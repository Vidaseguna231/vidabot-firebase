
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import * as functions from 'firebase-functions';
import { secrets } from './services/secrets.js';
import { issueAdminToken, revokeAdminToken, verifyAdminToken } from './services/auth.js';
import { verifyFirebaseToken } from './services/firebase.js';
import { generateV4UploadSignedUrl } from './services/gcs.js';
import { streamResponseToClient } from './services/gemini.js';

const app = express();

app.use(express.json());

// In a deployed environment (Cloud Functions), env vars should be set.
// For emulators, this allows wider access during local development.
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', 
};
app.use(cors(corsOptions));

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100, 
	standardHeaders: true,
	legacyHeaders: false,
});
// The rewrite rule in firebase.json makes all requests start with /api/
// so we apply the limiter to the whole app. The '/api' prefix is stripped
// before it reaches the function.
app.use(limiter);

// --- AUTH ENDPOINTS ---
// SECURED: Added verifyFirebaseToken middleware.
app.post('/admin/activate', verifyFirebaseToken, (req, res) => {
  const { passkey } = req.body;
  const userId = req.user.uid;

  if (passkey === secrets.vidaAdminKey) {
    const adminToken = issueAdminToken(userId);
    res.json({ adminToken });
  } else {
    res.status(401).send('Invalid passkey.');
  }
});

app.post('/admin/deactivate', verifyAdminToken, async (req, res) => {
  try {
    await revokeAdminToken(req.admin.jti);
    res.status(200).send('Admin mode deactivated.');
  } catch (error) {
    console.error("Deactivation failed:", error);
    res.status(500).send("Server error during deactivation.");
  }
});

// --- UPLOAD ENDPOINT ---
// SECURED: Added verifyFirebaseToken middleware.
app.post('/uploads/signed-url', verifyFirebaseToken, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).send("fileName and contentType are required.");
    }
    const uniqueFileName = `${Date.now()}-${fileName.replace(/\s/g, '_')}`;
    const data = await generateV4UploadSignedUrl(uniqueFileName, contentType);
    res.json(data);
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    res.status(500).send('Could not create upload URL.');
  }
});

// --- CHAT ENDPOINT ---
// Open for unauthenticated access for now.
app.post('/chat/stream', async (req, res) => {
  try {
    let isAdmin = false;
    const adminToken = req.headers['x-admin-authorization']?.split(' ')[1];
    if (adminToken) {
        try {
            jwt.verify(adminToken, secrets.jwtSecret);
            isAdmin = true;
        } catch (error) {
            console.warn(`An invalid admin token was provided: ${error.message}`);
            isAdmin = false;
        }
    }

    const { prompt, imageUrl } = req.body;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    await streamResponseToClient(prompt, isAdmin, imageUrl, res);
  } catch (error) {
    console.error('Chat streaming error:', error);
    if (!res.headersSent) {
      res.status(500).send('Failed to process chat stream.');
    } else {
      res.end();
    }
  }
});

// Expose the Express app as a Cloud Function named 'api'.
export const api = functions.https.onRequest(app);
