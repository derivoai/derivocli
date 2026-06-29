/**
 * API key routes — secure generation, hashed storage, one-time display,
 * revocation, and rotation. Plaintext keys are NEVER stored or re-shown.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { requireActiveSubscription } from '../security/authorize.js';
import { requireFeature } from '../billing/feature-gate.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { getDb, isAdminInitialized } from '../firebase.js';
import { limiters } from '../security/rate-limit.js';
import { schemas, validateBody } from '../security/validation.js';
import { audit } from '../security/audit.js';
import { generateApiKey, maskedPreview } from '../security/api-keys.js';

export const MAX_API_KEYS = 50;
export const keysRouter = Router();

function keysCol(uid: string) {
  return getDb().collection('users').doc(uid).collection('apiKeys');
}

// List keys — previews only, never the hash or plaintext.
keysRouter.get(
  '/',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    if (!isAdminInitialized()) {
      res.json({ keys: [] });
      return;
    }
    const snap = await keysCol(uid).get();
    const keys = snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          name: data.name,
          preview: maskedPreview(String(data.prefix ?? 'drv_'), String(data.last4 ?? '')),
          created: data.createdAt,
          lastUsed: data.lastUsed ?? 'Never',
          expires: data.expiresAt ?? 'Never',
          revoked: data.revoked === true,
        };
      })
      .filter((k) => !k.revoked);
    res.json({ keys });
  }),
);

async function createKey(uid: string, name: string, expiresInDays?: number) {
  const generated = generateApiKey(true);
  const id = `key_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date();
  const record = {
    name,
    prefix: generated.prefix,
    last4: generated.last4,
    hash: generated.hash, // only the hash is persisted
    createdAt: now.toISOString(),
    lastUsed: null,
    revoked: false,
    expiresAt: expiresInDays
      ? new Date(now.getTime() + expiresInDays * 86_400_000).toISOString()
      : null,
  };
  if (isAdminInitialized()) {
    await keysCol(uid).doc(id).set(record);
  }
  return {
    id,
    plaintext: generated.plaintext,
    preview: maskedPreview(generated.prefix, generated.last4),
  };
}

// Create — returns the plaintext ONCE.
keysRouter.post(
  '/',
  requireAuth,
  limiters.keyCreate,
  requireFeature('apiKeys'),
  validateBody(schemas.createApiKey),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const body = req.body as { name: string; expiresInDays?: number };

    const { id, plaintext, preview } = await createKey(uid, body.name, body.expiresInDays);
    await audit('apikey.create', uid, { keyId: id, name: body.name });
    // The plaintext is shown ONCE and never stored.
    res.status(201).json({
      id,
      key: plaintext,
      preview,
      message: 'Store this key now — it will not be shown again.',
    });
  }),
);

// Revoke.
keysRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const keyId = req.params.id!;
    if (isAdminInitialized()) {
      const ref = keysCol(uid).doc(keyId);
      if (!(await ref.get()).exists) throw Errors.notFound('API key not found');
      await ref.set({ revoked: true, revokedAt: new Date().toISOString() }, { merge: true });
      await audit('apikey.revoke', uid, { keyId });
    }
    res.json({ success: true });
  }),
);

// Rotate — revoke old, issue new, return new plaintext once.
keysRouter.post(
  '/:id/rotate',
  requireAuth,
  requireActiveSubscription,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const keyId = req.params.id!;
    let name = 'Rotated key';
    if (isAdminInitialized()) {
      const ref = keysCol(uid).doc(keyId);
      const snap = await ref.get();
      if (!snap.exists) throw Errors.notFound('API key not found');
      name = String(snap.data()?.name ?? name);
      await ref.set({ revoked: true, revokedAt: new Date().toISOString() }, { merge: true });
    }
    const created = await createKey(uid, name);
    await audit('apikey.rotate', uid, { oldKeyId: keyId, newKeyId: created.id });
    res.status(201).json({ id: created.id, key: created.plaintext, preview: created.preview });
  }),
);
