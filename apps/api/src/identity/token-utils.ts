/**
 * Token primitives for the session/refresh system.
 *
 * - Access token: compact HS256-signed token (uid, sid, exp). Short-lived.
 * - Refresh token: opaque CSPRNG string; only its SHA-256 hash is stored.
 *
 * No secrets/tokens are logged. The signing secret comes from SESSION_SECRET
 * (falls back to a dev value when unset; production should always set it).
 */
import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';
export const ACCESS_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const REFRESH_PREFIX = 'drf_';

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export interface AccessClaims {
  uid: string;
  sid: string;
  exp: number; // epoch ms
}

export function signAccessToken(uid: string, sid: string, ttlMs = ACCESS_TTL_MS): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'DAT' }));
  const payload = b64url(JSON.stringify({ uid, sid, exp: Date.now() + ttlMs }));
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function verifyAccessToken(token: string): AccessClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  const a = Buffer.from(sig!);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload!, 'base64url').toString('utf8')) as AccessClaims;
    if (!claims.uid || !claims.sid || typeof claims.exp !== 'number') return null;
    if (claims.exp <= Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Generate an opaque refresh token (return to client once) + its stored hash.
 * Format: `drf_<tokenId>.<secret>` so the server can locate the record by
 * `tokenId` without trusting the client, then verify the full-token hash. */
export function generateRefreshToken(): { token: string; tokenId: string; hash: string } {
  const tokenId = crypto.randomBytes(12).toString('hex');
  const secret = crypto.randomBytes(32).toString('base64url');
  const token = `${REFRESH_PREFIX}${tokenId}.${secret}`;
  return { token, tokenId, hash: hashToken(token) };
}

/** Extract the lookup id from a refresh token, or null if malformed. */
export function refreshTokenId(token: string): string | null {
  if (!token.startsWith(REFRESH_PREFIX)) return null;
  const body = token.slice(REFRESH_PREFIX.length);
  const id = body.split('.')[0];
  return id && id.length > 0 ? id : null;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
