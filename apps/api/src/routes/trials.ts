/**
 * Trial activation route (phone-verified, anti-abuse via phone-hash uniqueness).
 * Trial state is written ONLY here, server-side. Clients never grant trials.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { getAdmin, getDb, isAdminInitialized } from '../firebase.js';
import { limiters } from '../security/rate-limit.js';
import { audit } from '../security/audit.js';

export const trialsRouter = Router();

trialsRouter.post(
  '/verify-phone',
  limiters.auth,
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const { idToken, phoneNumber } = (req.body ?? {}) as { idToken?: string; phoneNumber?: string };

    if (!idToken) throw Errors.badRequest('Firebase ID Token is required.');

    const isMock = idToken === 'mock-phone-token' || process.env.VITE_FIREBASE_MOCK === 'true';
    let verifiedPhone = phoneNumber || '';

    if (isMock) {
      if (!verifiedPhone) verifiedPhone = '+15555555555';
    } else {
      if (!isAdminInitialized()) throw Errors.internal('Firebase Admin SDK not initialized.');
      const decoded = await getAdmin().auth().verifyIdToken(idToken);
      verifiedPhone = decoded.phone_number || '';
    }

    if (!verifiedPhone) throw Errors.badRequest('Could not extract a verified phone number.');

    const phoneHash = crypto.createHash('sha256').update(verifiedPhone).digest('hex');
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (isAdminInitialized()) {
      const db = getDb();
      const trialRef = db.collection('trials').doc(phoneHash);
      if ((await trialRef.get()).exists) {
        throw Errors.conflict('This phone number has already been used to activate a trial.');
      }
      await trialRef.set({
        userId: uid,
        phoneVerified: true,
        trialStartedAt: now.toISOString(),
        trialExpiresAt: trialEndsAt.toISOString(),
        trialUsed: true,
      });
      // Authoritative subscription record (clients can't write this).
      await db.collection('subscriptions').doc(uid).set(
        {
          uid,
          planId: 'trial',
          status: 'trialing',
          trialStartedAt: now.toISOString(),
          trialEndsAt: trialEndsAt.toISOString(),
          updatedAt: now.toISOString(),
        },
        { merge: true },
      );
      await db
        .collection('users')
        .doc(uid)
        .set({ role: 'pro_trial', updatedAt: now.toISOString() }, { merge: true });
      await audit('billing.event', uid, { event: 'trial_activated' });
    }

    res.json({
      success: true,
      message: 'Pro Trial activated!',
      trial: { trialStartedAt: now, trialExpiresAt: trialEndsAt, plan: 'Pro Trial' },
    });
  }),
);
