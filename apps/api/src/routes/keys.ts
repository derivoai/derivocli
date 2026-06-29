/**
 * API key routes — full lifecycle: create, list, get, rename/disable/enable,
 * rotate (with grace), revoke. Plaintext is shown once; only hashes are stored.
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { requireFeature } from '../billing/feature-gate.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { limiters } from '../security/rate-limit.js';
import { schemas, validateBody } from '../security/validation.js';
import { audit } from '../security/audit.js';
import {
  createKey,
  getKey,
  listKeys,
  revokeKey,
  rotateKey,
  toPublic,
  updateKey,
} from '../identity/api-key-store.js';

export const keysRouter: Router = Router();

keysRouter.get(
  '/',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    res.json({ keys: await listKeys(authOf(req).uid) });
  }),
);

keysRouter.post(
  '/',
  requireAuth,
  limiters.keyCreate,
  requireFeature('apiKeys'),
  validateBody(schemas.createApiKey),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const body = req.body as {
      name: string;
      environment?: 'live' | 'test';
      permissions?: string[];
      tags?: string[];
      expiresInDays?: number;
    };
    const { record, plaintext } = await createKey(uid, { ...body, createdBy: uid });
    await audit('apikey.create', uid, { keyId: record.id, name: record.name });
    res.status(201).json({
      id: record.id,
      key: plaintext, // shown ONCE
      keyRecord: toPublic(record),
      message: 'Store this key now — it will not be shown again.',
    });
  }),
);

keysRouter.get(
  '/:id',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const rec = await getKey(authOf(req).uid, req.params.id!);
    if (!rec) throw Errors.notFound('API key not found');
    res.json({ key: toPublic(rec) });
  }),
);

keysRouter.patch(
  '/:id',
  requireAuth,
  validateBody(schemas.updateApiKey),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const ok = await updateKey(uid, req.params.id!, req.body);
    if (!ok) throw Errors.notFound('API key not found or not editable');
    await audit('permission.change', uid, { keyId: req.params.id, action: 'update_key' });
    res.json({ success: true });
  }),
);

keysRouter.post(
  '/:id/rotate',
  requireAuth,
  requireFeature('apiKeys'),
  validateBody(schemas.rotateApiKey),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const graceSeconds = (req.body?.graceSeconds as number) ?? 0;
    const rotated = await rotateKey(uid, req.params.id!, uid, graceSeconds);
    if (!rotated) throw Errors.notFound('API key not found');
    await audit('apikey.rotate', uid, {
      oldKeyId: req.params.id,
      newKeyId: rotated.record.id,
      graceSeconds,
    });
    res.status(201).json({
      id: rotated.record.id,
      key: rotated.plaintext,
      keyRecord: toPublic(rotated.record),
      message: 'New key issued. Update your integrations before the grace period ends.',
    });
  }),
);

keysRouter.post(
  '/:id/revoke',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const ok = await revokeKey(uid, req.params.id!);
    if (!ok) throw Errors.notFound('API key not found');
    await audit('apikey.revoke', uid, { keyId: req.params.id });
    res.json({ success: true });
  }),
);

// DELETE is an alias for revoke (keys are never hard-deleted).
keysRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const ok = await revokeKey(uid, req.params.id!);
    if (!ok) throw Errors.notFound('API key not found');
    await audit('apikey.revoke', uid, { keyId: req.params.id });
    res.json({ success: true });
  }),
);
