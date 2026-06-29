/**
 * API-key authentication middleware. Accepts a key via `x-api-key` or
 * `Authorization: ApiKey <key>`, resolves it (hash lookup), checks
 * status/expiry, enforces scopes, and records last-used. Sets req.apiKey.
 */
import type { Request, Response, NextFunction } from 'express';
import { asyncHandler, Errors } from '../security/errors.js';
import {
  effectiveStatus,
  resolveKeyGlobal,
  touchLastUsed,
  type ApiKeyRecord,
} from './api-key-store.js';
import { hasScopes, type Scope } from './scopes.js';

export interface ApiKeyRequest extends Request {
  apiKey?: { uid: string; keyId: string; permissions: Scope[] };
}

function extractKey(req: Request): string | null {
  const headerKey = req.headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey) return headerKey;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('ApiKey ')) return auth.slice('ApiKey '.length).trim();
  return null;
}

export function requireApiKey(...required: Scope[]) {
  return asyncHandler<ApiKeyRequest>(async (req, _res, next) => {
    const presented = extractKey(req);
    if (!presented) throw Errors.unauthorized('Missing API key');

    const resolved = await resolveKeyGlobal(presented);
    if (!resolved) throw Errors.unauthorized('Invalid API key');

    const rec: ApiKeyRecord = resolved.record;
    const status = effectiveStatus(rec);
    if (status === 'revoked') throw Errors.unauthorized('API key revoked');
    if (status === 'expired') throw Errors.unauthorized('API key expired');
    if (status === 'disabled') throw Errors.forbidden('API key disabled');

    // Honor a rotation grace window: a key past its grace is treated as revoked.
    if (rec.graceUntil && Date.parse(rec.graceUntil) <= Date.now()) {
      throw Errors.unauthorized('API key rotated out');
    }

    if (required.length > 0 && !hasScopes(rec.permissions, required)) {
      throw Errors.forbidden(`Missing required scope(s): ${required.join(', ')}`);
    }

    req.apiKey = { uid: resolved.uid, keyId: rec.id, permissions: rec.permissions };
    void touchLastUsed(resolved.uid, rec.id);
    next();
  });
}
