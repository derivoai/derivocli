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
app.use(
  cors({
    origin: [appUrl, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  }),
);

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
  next: express.NextFunction,
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

      const isMock = idToken === 'mock-phone-token' || process.env.VITE_FIREBASE_MOCK === 'true';

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

      const phoneNumberHash = crypto.createHash('sha256').update(verifiedPhoneNumber).digest('hex');

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
          { merge: true },
        );
      } else {
        console.log(
          `ℹ️ [Mock mode] Active Trial for UID ${user.uid} using phone hash: ${phoneNumberHash}`,
        );
      }

      res.json({
        success: true,
        message: 'Pro Trial activated!',
        trial: {
          trialStartedAt: now,
          trialExpiresAt,
          plan: 'Pro Trial',
        },
      });
    } catch (error: any) {
      console.error('Phone verification failed:', error);
      res.status(500).json({ error: error.message || 'Verification failed.' });
    }
  },
);

// ─── Subscription evaluation (server-side, authoritative) ────────────────────
function parseEpochMs(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) return asNumber < 1e12 ? asNumber * 1000 : asNumber;
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') {
      try {
        return value.toMillis();
      } catch {
        /* ignore */
      }
    }
    const seconds = value.seconds ?? value._seconds;
    if (seconds !== undefined) return Number(seconds) * 1000;
  }
  return null;
}

function resolveEndDate(sub: any): number | null {
  const candidates = [
    sub.trialEndsAt,
    sub.trialEndAt,
    sub.trialEnd,
    sub.trialExpiresAt,
    sub.expiresAt,
    sub.currentPeriodEnd,
    sub.periodEnd,
    sub.endsAt,
    sub.endDate,
  ];
  for (const candidate of candidates) {
    const ms = parseEpochMs(candidate);
    if (ms !== null) return ms;
  }
  return null;
}

interface SubscriptionResult {
  active: boolean;
  plan: string;
  status: string;
  endsAt: number | null;
  reason: string;
}

function computeSubscription(sub: any): SubscriptionResult {
  if (!sub) {
    return {
      active: false,
      plan: 'none',
      status: 'none',
      endsAt: null,
      reason: 'No subscription found',
    };
  }

  const plan = String(sub.plan ?? sub.tier ?? sub.role ?? '').toLowerCase();
  const status = String(sub.status ?? '').toLowerCase();
  const expired = ['canceled', 'cancelled', 'expired', 'inactive', 'past_due', 'unpaid'];
  const isExpiredStatus = expired.includes(status);
  const endsAt = resolveEndDate(sub);
  const hasFutureEnd = endsAt !== null && endsAt > Date.now();

  const base = { plan: plan || 'unknown', status: status || 'unknown', endsAt };

  // Paid plans.
  if (['pro', 'enterprise', 'paid', 'team', 'pro_trial'].includes(plan)) {
    if ((status === 'active' || status === 'trialing') && !isExpiredStatus) {
      return { ...base, active: true, reason: 'Active paid plan' };
    }
    if (hasFutureEnd && !isExpiredStatus) {
      return { ...base, active: true, reason: 'Paid plan within period' };
    }
  }

  // Trials.
  if (plan === 'trial' || plan === 'free_trial' || status.includes('trial')) {
    const activeTrialStatus =
      status === 'active' || status === 'trialing' || status === 'trial' || status === '';
    if (activeTrialStatus && hasFutureEnd) {
      return { ...base, active: true, reason: 'Active trial' };
    }
    if (activeTrialStatus && endsAt === null) {
      return { ...base, active: true, reason: 'Active trial (no end date)' };
    }
    if (endsAt !== null && endsAt <= Date.now()) {
      return { ...base, active: false, reason: 'Trial expired' };
    }
  }

  if (status === 'active' && !isExpiredStatus && (hasFutureEnd || endsAt === null)) {
    return { ...base, active: true, reason: 'Active subscription' };
  }

  return {
    ...base,
    active: false,
    reason: isExpiredStatus ? `Subscription ${status}` : 'No active subscription',
  };
}

// ─── CLI Verification Endpoint ───────────────────────────────────────────────
// The CLI calls this to learn whether the authenticated user may run premium
// commands. ALL enforcement happens here, server-side — the CLI cannot be
// patched to bypass it.
app.get('/api/cli/verify', requireAuth, async (req: express.Request, res: express.Response) => {
  const user = (req as any).user;

  // Mock mode (no Firebase Admin configured): allow, for local development.
  if (!adminInitialized) {
    res.json({
      authenticated: true,
      uid: user.uid,
      active: true,
      plan: 'dev',
      status: 'mock',
      endsAt: null,
      reason: 'Mock mode (Firebase Admin not configured)',
    });
    return;
  }

  try {
    const db = admin.firestore();
    let sub: any = null;

    const subDoc = await db.collection('subscriptions').doc(user.uid).get();
    if (subDoc.exists) {
      sub = subDoc.data();
    } else {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        // Either a nested subscription object or a role-based field.
        sub = data.subscription ?? { plan: data.role, status: 'active' };
      }
    }

    const result = computeSubscription(sub);
    res.json({ authenticated: true, uid: user.uid, ...result });
  } catch (err: any) {
    console.error('CLI verify error:', err.message);
    res.status(500).json({ error: 'Subscription verification failed' });
  }
});

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
});
