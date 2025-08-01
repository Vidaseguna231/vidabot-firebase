
import admin from 'firebase-admin';

// In Cloud Functions, initializeApp() can be called without arguments.
// It will automatically use Application Default Credentials.
// For local dev with emulators, this also works, but for production-like
// local dev, GOOGLE_APPLICATION_CREDENTIALS should be set.
if (!admin.apps.length) {
    admin.initializeApp();
}


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