/**
 * Device trust routes — register (with fingerprint + plan limit), list,
 * rename, trust/untrust, revoke, delete. Ownership is implicit (under uid).
 */
import { Router } from 'express';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { getDb, isAdminInitialized } from '../firebase.js';
import { limiters } from '../security/rate-limit.js';
import { schemas, validateBody } from '../security/validation.js';
import { audit } from '../security/audit.js';
import { getLimit } from '../billing/subscription-service.js';
import { computeFingerprint } from '../identity/fingerprint.js';
import { recordLogin } from '../identity/sessions.js';

export const devicesRouter: Router = Router();

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
      hostname?: string;
      arch?: string;
      nodeVersion?: string;
    };

    const fingerprint = computeFingerprint({
      deviceId: body.deviceId,
      hostname: body.hostname,
      platform: body.type,
      arch: body.arch,
    });

    const now = new Date().toISOString();
    const record = {
      id: body.deviceId,
      name: body.name,
      type: body.type,
      os: body.os,
      hostname: body.hostname ?? null,
      arch: body.arch ?? null,
      nodeVersion: body.nodeVersion ?? null,
      cliVersion: body.cliVersion,
      fingerprint, // hashed — identification only, never authentication
      browser: 'CLI',
      lastActive: 'Active now',
      lastSeenAt: now,
      isTrusted: true,
      revoked: false,
      ownerUid: uid,
      updatedAt: now,
    };

    if (!isAdminInitialized()) {
      res.status(201).json({ device: record, mock: true });
      return;
    }

    const col = devicesCol(uid);
    const existing = await col.doc(body.deviceId).get();

    // Plan device limit applies to NEW trusted devices only.
    if (!existing.exists) {
      const limit = await getLimit(uid, 'devices');
      if (limit !== -1) {
        const all = await col.get();
        const trusted = all.docs.filter((d) => d.data().revoked !== true).length;
        if (trusted >= limit) {
          throw Errors.forbidden(`Device limit reached (${limit}). Revoke a device first.`);
        }
      }
    }

    await col
      .doc(body.deviceId)
      .set({ ...record, createdAt: existing.data()?.createdAt ?? now }, { merge: true });
    await audit('device.register', uid, { deviceId: body.deviceId, type: body.type });
    await recordLogin({ uid, type: 'device_registered', deviceId: body.deviceId });
    res.status(201).json({ device: record });
  }),
);

devicesRouter.patch(
  '/:id',
  requireAuth,
  validateBody(schemas.renameDevice),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const id = req.params.id!;
    if (isAdminInitialized()) {
      const ref = devicesCol(uid).doc(id);
      if (!(await ref.get()).exists) throw Errors.notFound('Device not found');
      await ref.set({ name: req.body.name, updatedAt: new Date().toISOString() }, { merge: true });
    }
    res.json({ success: true });
  }),
);

devicesRouter.post(
  '/:id/trust',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    await setTrust(authOf(req).uid, req.params.id!, true);
    res.json({ success: true });
  }),
);

devicesRouter.post(
  '/:id/untrust',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    await setTrust(authOf(req).uid, req.params.id!, false);
    res.json({ success: true });
  }),
);

devicesRouter.post(
  '/:id/revoke',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const id = req.params.id!;
    if (isAdminInitialized()) {
      const ref = devicesCol(uid).doc(id);
      if (!(await ref.get()).exists) throw Errors.notFound('Device not found');
      await ref.set(
        { revoked: true, isTrusted: false, revokedAt: new Date().toISOString() },
        { merge: true },
      );
      await audit('device.revoke', uid, { deviceId: id });
    }
    res.json({ success: true });
  }),
);

devicesRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const id = req.params.id!;
    if (isAdminInitialized()) {
      const ref = devicesCol(uid).doc(id);
      if (!(await ref.get()).exists) throw Errors.notFound('Device not found');
      await ref.delete();
      await audit('device.revoke', uid, { deviceId: id, deleted: true });
    }
    res.json({ success: true });
  }),
);

async function setTrust(uid: string, id: string, trusted: boolean): Promise<void> {
  if (!isAdminInitialized()) return;
  const ref = devicesCol(uid).doc(id);
  if (!(await ref.get()).exists) throw Errors.notFound('Device not found');
  await ref.set({ isTrusted: trusted, updatedAt: new Date().toISOString() }, { merge: true });
  await audit('permission.change', uid, { deviceId: id, action: trusted ? 'trust' : 'untrust' });
}
