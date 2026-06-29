/**
 * Device routes — ownership is implicit (stored under the caller's uid),
 * with a maximum device limit and revocation. Registration is rate-limited.
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { getDb, isAdminInitialized } from '../firebase.js';
import { limiters } from '../security/rate-limit.js';
import { schemas, validateBody } from '../security/validation.js';
import { audit } from '../security/audit.js';
import { getLimit } from '../billing/subscription-service.js';

export const devicesRouter = Router();

function devicesCol(uid: string) {
  return getDb().collection('users').doc(uid).collection('devices');
}

devicesRouter.get(
  '/',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    if (!isAdminInitialized()) {
      res.json({ devices: [] });
      return;
    }
    const snap = await devicesCol(uid).get();
    res.json({ devices: snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) });
  }),
);

devicesRouter.post(
  '/register',
  requireAuth,
  limiters.deviceRegister,
  validateBody(schemas.registerDevice),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const body = req.body as {
      deviceId: string;
      name: string;
      type: string;
      os: string;
      cliVersion: string;
    };

    const now = new Date().toISOString();
    const record = {
      id: body.deviceId,
      name: body.name,
      type: body.type,
      os: body.os,
      browser: 'CLI',
      cliVersion: body.cliVersion,
      lastActive: 'Active now',
      isTrusted: true,
      location: 'Local Machine',
      ownerUid: uid,
      updatedAt: now,
    };

    if (!isAdminInitialized()) {
      res.status(201).json({ device: record, mock: true });
      return;
    }

    const col = devicesCol(uid);
    const existing = await col.doc(body.deviceId).get();

    // Enforce the plan's device limit for NEW devices (re-registering is fine).
    if (!existing.exists) {
      const limit = await getLimit(uid, 'devices');
      if (limit !== -1) {
        const all = await col.get();
        if (all.size >= limit) {
          throw Errors.forbidden(`Device limit reached (${limit}). Revoke a device first.`);
        }
      }
    }

    await col
      .doc(body.deviceId)
      .set({ ...record, createdAt: existing.data()?.createdAt ?? now }, { merge: true });
    await audit('device.register', uid, { deviceId: body.deviceId, type: body.type });
    res.status(201).json({ device: record });
  }),
);

devicesRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const deviceId = req.params.id!;
    if (isAdminInitialized()) {
      const ref = devicesCol(uid).doc(deviceId);
      if (!(await ref.get()).exists) throw Errors.notFound('Device not found');
      await ref.delete();
      await audit('device.revoke', uid, { deviceId });
    }
    res.json({ success: true });
  }),
);
