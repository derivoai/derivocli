import './load-env';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import admin from 'firebase-admin';

const app = express();
const port = Number(process.env.PORT || 3001);
const appUrl = process.env.APP_URL || 'http://localhost:3000';

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [appUrl, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json());
app.use(cookieParser());

// ─── Firebase Admin SDK ──────────────────────────────────────────────────────
let adminInitialized = false;

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    adminInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (err: any) {
    console.error('❌ Failed to initialize Firebase Admin:', err.message);
  }
} else {
  console.log('ℹ️  Firebase credentials missing — running in mock mode for OTP verification');
}

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Session Verification Middleware (Firebase ID Token) ─────────────────────
async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return;
    }
    const token = authHeader.split(' ')[1];

    if (!adminInitialized) {
      // Mock mode fallback when Firebase credentials are not yet set up
      console.log('⚠️ Mocking session verification (No Firebase Admin configured)');
      (req as any).user = { uid: 'mock-uid', email: 'mock-user@derivo.in' };
      next();
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (err: any) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// ─── Trial Phone Verification Endpoint (Firestore DB) ────────────────────────
app.post(
  '/api/trials/verify-phone',
  requireAuth,
  async (req: express.Request, res: express.Response) => {
    const { idToken, phoneNumber } = req.body;
    const user = (req as any).user;

    if (!idToken) {
      res.status(400).json({ error: 'Firebase ID Token is required.' });
      return;
    }

    try {
      let verifiedPhoneNumber = phoneNumber || '';

      const isMock =
        idToken === 'mock-phone-token' ||
        process.env.VITE_FIREBASE_MOCK === 'true';

      if (isMock) {
        console.log('📱 Phone verification — mock mode active');
        if (!verifiedPhoneNumber) verifiedPhoneNumber = '+15555555555';
      } else {
        if (!adminInitialized) {
          res.status(500).json({ error: 'Firebase Admin SDK not initialized.' });
          return;
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        verifiedPhoneNumber = decodedToken.phone_number || '';
      }

      if (!verifiedPhoneNumber) {
        res.status(400).json({ error: 'Could not extract verified phone number.' });
        return;
      }

      const phoneNumberHash = crypto
        .createHash('sha256')
        .update(verifiedPhoneNumber)
        .digest('hex');

      const now = new Date();
      const trialExpiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      if (adminInitialized) {
        const db = admin.firestore();
        
        // Check uniqueness of phone number hash
        const trialRef = db.collection('trials').doc(phoneNumberHash);
        const trialDoc = await trialRef.get();

        if (trialDoc.exists) {
          res.status(400).json({
            error: 'This phone number has already been used to activate a Pro Trial.',
          });
          return;
        }

        // Record trial details
        await trialRef.set({
          userId: user.uid,
          phoneVerified: true,
          trialStartedAt: now.toISOString(),
          trialExpiresAt: trialExpiresAt.toISOString(),
          trialUsed: true,
        });

        // Set user role to pro_trial
        await db.collection('users').doc(user.uid).set(
          {
            role: 'pro_trial',
            updatedAt: now.toISOString(),
          },
          { merge: true }
        );
      } else {
        console.log(`ℹ️ [Mock mode] Active Trial for UID ${user.uid} using phone hash: ${phoneNumberHash}`);
      }

      res.json({
        success: true,
        message: 'Pro Trial activated!',
        trial: {
          trialStartedAt: now,
          trialExpiresAt,
          plan: 'Pro Trial'
        },
      });
    } catch (error: any) {
      console.error('Phone verification failed:', error);
      res.status(500).json({ error: error.message || 'Verification failed.' });
    }
  }
);

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
});
