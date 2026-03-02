const admin = require('firebase-admin');
const path  = require('path');

const credential = admin.credential.cert(
  require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS))
);

// Default app – used by Firestore (agentparkinson project)
if (!admin.apps.length) {
  admin.initializeApp({ credential });
}

// Named app – used only for ID token verification.
// Its projectId must match the frontend Firebase project (parkinson-doctor)
// so the "aud" claim in the token passes validation.
const AUTH_APP_NAME = 'auth-verifier';
const authApp =
  admin.apps.find((a) => a.name === AUTH_APP_NAME) ||
  admin.initializeApp(
    {
      credential,
      projectId: process.env.FIREBASE_AUTH_PROJECT_ID,
    },
    AUTH_APP_NAME
  );

/**
 * Express middleware – verifies the Firebase ID token sent in the
 * Authorization header and attaches { uid, email } to req.user.
 */
const verifyToken = async (req, res, next) => {
  // Accept token from Authorization header OR ?token= query param (for browser GET requests)
  const header = req.headers['authorization'] || '';
  const token  = (header.startsWith('Bearer ') ? header.slice(7) : null)
              || req.query.token
              || null;

  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token.' });
  }

  try {
    const decoded = await authApp.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || '' };
    next();
  } catch (err) {
    console.warn('[auth] Invalid token:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = { verifyToken };
