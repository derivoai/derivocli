/**
 * Audit logging for security-relevant events.
 *
 * Writes to `users/{uid}/auditLogs` (best-effort) and stdout. NEVER logs
 * passwords, tokens, secrets, or API key plaintext — callers must pass only
 * safe metadata, and we additionally strip known-sensitive keys.
 */
import { getDb, isAdminInitialized } from '../firebase.js';

export type AuditEvent =
  | 'auth.login'
  | 'project.create'
  | 'project.delete'
  | 'apikey.create'
  | 'apikey.revoke'
  | 'apikey.rotate'
  | 'device.register'
  | 'device.revoke'
  | 'billing.event'
  | 'permission.change';

const SENSITIVE_KEYS = ['token', 'password', 'secret', 'apikey', 'apiKey', 'key', 'authorization'];

function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
      out[k] = '[redacted]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function audit(
  event: AuditEvent,
  uid: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  const safe = sanitize(meta);
  const entry = { event, uid, meta: safe, timestamp: new Date().toISOString() };
  console.log(`[audit] ${event} uid=${uid} ${JSON.stringify(safe)}`);

  if (!isAdminInitialized()) return;
  try {
    await getDb().collection('users').doc(uid).collection('auditLogs').add(entry);
  } catch {
    // Audit persistence is best-effort and must never break the request.
  }
}
