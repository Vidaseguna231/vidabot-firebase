
import admin from 'firebase-admin';

// In Cloud Run, Application Default Credentials will be used automatically.
// For local dev, you need to set GOOGLE_APPLICATION_CREDENTIALS env var.
admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount) // if needed for local
});

export const db = admin.firestore();

// Middleware to verify Firebase ID token for "Power Users"
export async function verifyFirebaseToken(req, res, next) {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(401).send('Firebase ID token required.');
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return res.status(403).send('Invalid Firebase token.');
    }
}
