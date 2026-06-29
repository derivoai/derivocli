/**
 * Session & refresh-token engine.
 *
 * - Sessions live under `users/{uid}/sessions/{sid}` with idle + absolute
 *   timeouts and revocation.
 * - Refresh tokens live in top-level `refreshTokens/{tokenId}` (hashed). They
 *   ROTATE on every use; presenting an already-used token triggers reuse
 *   detection and revokes the entire session (compromise response).
 * - Login history is recorded under `users/{uid}/loginHistory`.
 *
 * Works with Firestore in real mode and an in-memory store in mock/test mode.
 */
import crypto from 'crypto';
import { getDb, isAdminInitialized } from '../firebase.js';
import {
  ACCESS_TTL_MS,
  REFRESH_TTL_MS,
  generateRefreshToken,
  hashToken,
  refreshTokenId,
  signAccessToken,
} from './token-utils.js';

const IDLE_TIMEOUT_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface SessionRecord {
  id: string;
  uid: string;
  deviceId?: string;
  deviceName?: string;
  createdAt: string;
  lastSeenAt: string;
  absoluteExpiresAt: string;
  revoked: boolean;
}

export interface RefreshRecord {
  id: string; // tokenId
  uid: string;
  sessionId: string;
  hash: string;
  used: boolean;
  createdAt: string;
  expiresAt: string;
  replacedBy?: string | null;
}

export type LoginEventType =
  | 'login'
  | 'logout'
  | 'logout_all'
  | 'refresh'
  | 'refresh_failed'
  | 'device_registered'
  | 'token_revoked';

export interface LoginEvent {
  id: string;
  uid: string;
  type: LoginEventType;
  at: string;
  /** Mirror of `at` for client-side ordering consistency. */
  createdAt: string;
  deviceId?: string;
  detail?: string;
}

// ── In-memory store (mock/test mode) ─────────────────────────────────────────
const mem = {
  sessions: new Map<string, SessionRecord>(),
  refresh: new Map<string, RefreshRecord>(),
  history: [] as LoginEvent[],
};
export function resetSessionStoreForTesting(): void {
  mem.sessions.clear();
  mem.refresh.clear();
  mem.history.length = 0;
}

const usingDb = () => isAdminInitialized();

// ── Persistence helpers ──────────────────────────────────────────────────────
async function putSession(s: SessionRecord): Promise<void> {
  if (usingDb())
    await getDb().collection('users').doc(s.uid).collection('sessions').doc(s.id).set(s);
  else mem.sessions.set(s.id, s);
}
async function getSession(uid: string, sid: string): Promise<SessionRecord | null> {
  if (usingDb()) {
    const snap = await getDb().collection('users').doc(uid).collection('sessions').doc(sid).get();
    return snap.exists ? (snap.data() as SessionRecord) : null;
  }
  const s = mem.sessions.get(sid);
  return s && s.uid === uid ? s : null;
}
async function putRefresh(r: RefreshRecord): Promise<void> {
  if (usingDb()) await getDb().collection('refreshTokens').doc(r.id).set(r);
  else mem.refresh.set(r.id, r);
}
async function getRefresh(tokenId: string): Promise<RefreshRecord | null> {
  if (usingDb()) {
    const snap = await getDb().collection('refreshTokens').doc(tokenId).get();
    return snap.exists ? (snap.data() as RefreshRecord) : null;
  }
  return mem.refresh.get(tokenId) ?? null;
}

export async function recordLogin(
  event: Omit<LoginEvent, 'id' | 'at' | 'createdAt'> & { at?: string },
): Promise<void> {
  const at = event.at ?? new Date().toISOString();
  const entry: LoginEvent = {
    id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    at,
    createdAt: at,
    uid: event.uid,
    type: event.type,
    deviceId: event.deviceId,
    detail: event.detail,
  };
  if (usingDb()) {
    await getDb().collection('users').doc(entry.uid).collection('loginHistory').add(entry);
  } else {
    mem.history.push(entry);
  }
}

export async function listLoginHistory(uid: string, limit = 50): Promise<LoginEvent[]> {
  if (usingDb()) {
    const snap = await getDb()
      .collection('users')
      .doc(uid)
      .collection('loginHistory')
      .orderBy('at', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as LoginEvent);
  }
  return mem.history
    .filter((e) => e.uid === uid)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

// ── Session lifecycle ────────────────────────────────────────────────────────
export interface NewSession {
  session: SessionRecord;
  accessToken: string;
  refreshToken: string;
}

export async function createSession(
  uid: string,
  opts: { deviceId?: string; deviceName?: string } = {},
): Promise<NewSession> {
  const now = Date.now();
  const session: SessionRecord = {
    id: `sess_${crypto.randomBytes(12).toString('hex')}`,
    uid,
    deviceId: opts.deviceId,
    deviceName: opts.deviceName,
    createdAt: new Date(now).toISOString(),
    lastSeenAt: new Date(now).toISOString(),
    absoluteExpiresAt: new Date(now + REFRESH_TTL_MS).toISOString(),
    revoked: false,
  };
  await putSession(session);
  const refresh = await issueRefresh(uid, session.id);
  await recordLogin({ uid, type: 'login', deviceId: opts.deviceId });
  return { session, accessToken: signAccessToken(uid, session.id), refreshToken: refresh };
}

async function issueRefresh(uid: string, sessionId: string): Promise<string> {
  const { token, tokenId, hash } = generateRefreshToken();
  const record: RefreshRecord = {
    id: tokenId,
    uid,
    sessionId,
    hash,
    used: false,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
    replacedBy: null,
  };
  await putRefresh(record);
  return token;
}

export async function listSessions(uid: string): Promise<SessionRecord[]> {
  const now = Date.now();
  const isLive = (s: SessionRecord) =>
    !s.revoked &&
    Date.parse(s.absoluteExpiresAt) > now &&
    Date.parse(s.lastSeenAt) + IDLE_TIMEOUT_MS > now;
  if (usingDb()) {
    const snap = await getDb().collection('users').doc(uid).collection('sessions').get();
    return snap.docs.map((d) => d.data() as SessionRecord).filter(isLive);
  }
  return [...mem.sessions.values()].filter((s) => s.uid === uid && isLive(s));
}

export async function revokeSession(uid: string, sid: string): Promise<boolean> {
  const s = await getSession(uid, sid);
  if (!s) return false;
  s.revoked = true;
  await putSession(s);
  await recordLogin({ uid, type: 'logout', deviceId: s.deviceId });
  return true;
}

export async function logoutAll(uid: string, exceptSid?: string): Promise<number> {
  const sessions = usingDb()
    ? (await getDb().collection('users').doc(uid).collection('sessions').get()).docs.map(
        (d) => d.data() as SessionRecord,
      )
    : [...mem.sessions.values()].filter((s) => s.uid === uid);
  let count = 0;
  for (const s of sessions) {
    if (s.revoked || s.id === exceptSid) continue;
    s.revoked = true;
    await putSession(s);
    count++;
  }
  await recordLogin({ uid, type: 'logout_all', detail: `${count} sessions` });
  return count;
}

export class RefreshError extends Error {
  constructor(
    public readonly code: 'invalid' | 'expired' | 'reuse_detected',
    message: string,
  ) {
    super(message);
  }
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

/**
 * Rotate a refresh token. Reuse of an already-rotated token revokes the whole
 * session (compromise detection).
 */
export async function refreshSession(presentedToken: string): Promise<RefreshResult> {
  const tokenId = refreshTokenId(presentedToken);
  if (!tokenId) throw new RefreshError('invalid', 'Malformed refresh token');

  const record = await getRefresh(tokenId);
  if (!record) throw new RefreshError('invalid', 'Unknown refresh token');

  // Hash mismatch → invalid (wrong secret for this tokenId).
  const presentedHash = hashToken(presentedToken);
  if (!timingSafeEqualHex(presentedHash, record.hash)) {
    throw new RefreshError('invalid', 'Refresh token mismatch');
  }

  const session = await getSession(record.uid, record.sessionId);

  // REUSE DETECTION: a used token presented again = compromise.
  if (record.used) {
    if (session && !session.revoked) {
      session.revoked = true;
      await putSession(session);
    }
    await recordLogin({ uid: record.uid, type: 'token_revoked', detail: 'refresh reuse detected' });
    throw new RefreshError('reuse_detected', 'Refresh token reuse detected — session revoked');
  }

  const now = Date.now();
  if (
    !session ||
    session.revoked ||
    Date.parse(record.expiresAt) <= now ||
    Date.parse(session.absoluteExpiresAt) <= now ||
    Date.parse(session.lastSeenAt) + IDLE_TIMEOUT_MS <= now
  ) {
    await recordLogin({ uid: record.uid, type: 'refresh_failed' });
    throw new RefreshError('expired', 'Session expired or revoked');
  }

  // Rotate: mark old used, mint a new refresh token in the same session.
  record.used = true;
  const newToken = await issueRefresh(record.uid, record.sessionId);
  record.replacedBy = refreshTokenId(newToken)!;
  await putRefresh(record);

  session.lastSeenAt = new Date(now).toISOString();
  await putSession(session);
  await recordLogin({ uid: record.uid, type: 'refresh', deviceId: session.deviceId });

  return {
    accessToken: signAccessToken(record.uid, record.sessionId, ACCESS_TTL_MS),
    refreshToken: newToken,
    sessionId: record.sessionId,
  };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
