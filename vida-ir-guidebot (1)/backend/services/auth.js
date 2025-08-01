
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { db } from './firebase.js';
import { secrets } from './secrets.js';

const REVOKED_TOKENS_COLLECTION = 'revoked_admin_tokens';

// Issues a new Admin JWT valid for 1 hour
export function issueAdminToken(userId) {
  const payload = { role: 'admin', sub: userId }; // Use Firebase UID as subject
  const options = { expiresIn: '1h', jwtid: randomUUID() };
  return jwt.sign(payload, secrets.jwtSecret, options);
}

// Revokes a token by adding its JTI to Firestore
export async function revokeAdminToken(jti) {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const docRef = db.collection(REVOKED_TOKENS_COLLECTION).doc(jti);
  await docRef.set({ revokedAt: new Date(), expires });
}

// Middleware to verify the Admin JWT
export async function verifyAdminToken(req, res, next) {
  const token = req.headers['x-admin-authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).send('Admin token required.');
  }

  try {
    const decoded = jwt.verify(token, secrets.jwtSecret);
    
    const doc = await db.collection(REVOKED_TOKENS_COLLECTION).doc(decoded.jti).get();
    if (doc.exists) {
      return res.status(403).send('Token has been revoked.');
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).send('Invalid admin token.');
  }
}
