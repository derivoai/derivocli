/**
 * Project routes — ownership + subscription enforced server-side.
 * Soft-delete is used; foreign/missing projects return 404 (no enumeration).
 */
import { Router } from 'express';
import crypto from 'crypto';
import { authOf, requireAuth, type AuthedRequest } from '../security/auth.js';
import { requireProjectOwnership } from '../security/authorize.js';
import { requireFeature } from '../billing/feature-gate.js';
import { asyncHandler } from '../security/errors.js';
import { getDb, isAdminInitialized } from '../firebase.js';
import { limiters } from '../security/rate-limit.js';
import { schemas, validateBody } from '../security/validation.js';
import { audit } from '../security/audit.js';

export const projectsRouter = Router();

function projectsCol(uid: string) {
  return getDb().collection('users').doc(uid).collection('projects');
}

// List the caller's (non-deleted) projects.
projectsRouter.get(
  '/',
  requireAuth,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    if (!isAdminInitialized()) {
      res.json({ projects: [] });
      return;
    }
    const snap = await projectsCol(uid).get();
    const projects = snap.docs
      .map(
        (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as Record<string, unknown>,
      )
      .filter((p) => !p.deletedAt && p.status !== 'deleted');
    res.json({ projects });
  }),
);

// Create a project (premium).
projectsRouter.post(
  '/',
  requireAuth,
  limiters.projectCreate,
  requireFeature('projects'),
  validateBody(schemas.createProject),
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const body = req.body as {
      projectId?: string;
      name: string;
      framework?: string;
      env?: string;
      localPath?: string;
      deviceId?: string;
    };
    const projectId = body.projectId ?? `proj_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    const record = {
      projectId,
      ownerUid: uid, // ownership comes from the verified token, never the body
      name: body.name,
      framework: body.framework ?? 'Unknown',
      env: body.env ?? 'Development',
      environment: (body.env ?? 'Development').toLowerCase(),
      status: 'synced',
      lastSync: 'Just now',
      localPath: body.localPath ?? null,
      deviceId: body.deviceId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    if (!isAdminInitialized()) {
      res.status(201).json({ project: record, mock: true });
      return;
    }
    await projectsCol(uid).doc(projectId).set(record, { merge: true });
    await audit('project.create', uid, { projectId, name: body.name });
    res.status(201).json({ project: record });
  }),
);

// Fetch one (ownership enforced; 404 on missing/foreign/deleted).
projectsRouter.get(
  '/:id',
  requireAuth,
  requireProjectOwnership,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const project = (req as AuthedRequest & { project?: unknown }).project;
    res.json({ project: project ?? { id: req.params.id } });
  }),
);

// Soft-delete (ownership enforced).
projectsRouter.delete(
  '/:id',
  requireAuth,
  requireProjectOwnership,
  asyncHandler<AuthedRequest>(async (req, res) => {
    const { uid } = authOf(req);
    const projectId = req.params.id!;
    if (isAdminInitialized()) {
      await projectsCol(uid)
        .doc(projectId)
        .set({ status: 'deleted', deletedAt: new Date().toISOString() }, { merge: true });
      await audit('project.delete', uid, { projectId });
    }
    res.json({ success: true });
  }),
);
