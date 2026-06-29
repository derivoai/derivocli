/**
 * API key lifecycle store — create, list, get, update, rotate, revoke.
 * Plaintext is shown ONCE at creation and never persisted (only the hash).
 */
import crypto from 'crypto';
import { getDb, isAdminInitialized } from '../firebase.js';
import { generateApiKey, hashApiKey, maskedPreview } from '../security/api-keys.js';
import { normalizeScopes, type Scope } from './scopes.js';

export type ApiKeyStatus = 'active' | 'disabled' | 'revoked' | 'expired';

export interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  last4: string;
  hash: string; // never returned to clients
  status: ApiKeyStatus;
  environment: 'live' | 'test';
  permissions: Scope[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt?: string | null;
  /** During rotation, the old key stays valid until this time. */
  graceUntil?: string | null;
  rotatedFrom?: string | null;
  rotatedTo?: string | null;
}

/** Public projection — never includes the hash. */
export interface ApiKeyPublic {
  id: string;
  name: string;
  preview: string;
  status: ApiKeyStatus;
  environment: string;
  permissions: Scope[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

function keysCol(uid: string) {
  return getDb().collection('users').doc(uid).collection('apiKeys');
}

/** Effective status, accounting for expiry at read time. */
export function effectiveStatus(rec: Pick<ApiKeyRecord, 'status' | 'expiresAt'>): ApiKeyStatus {
  if (rec.status === 'revoked') return 'revoked';
  if (rec.status === 'disabled') return 'disabled';
  if (rec.expiresAt && Date.parse(rec.expiresAt) <= Date.now()) return 'expired';
  return rec.status;
}

export function toPublic(rec: ApiKeyRecord): ApiKeyPublic {
  return {
    id: rec.id,
    name: rec.name,
    preview: maskedPreview(rec.prefix, rec.last4),
    status: effectiveStatus(rec),
    environment: rec.environment,
    permissions: rec.permissions,
    tags: rec.tags,
    createdBy: rec.createdBy,
    createdAt: rec.createdAt,
    expiresAt: rec.expiresAt,
    lastUsedAt: rec.lastUsedAt,
  };
}

export interface CreateKeyInput {
  name: string;
  environment?: 'live' | 'test';
  permissions?: string[];
  tags?: string[];
  expiresInDays?: number;
  createdBy: string;
}

export interface CreatedKey {
  record: ApiKeyRecord;
  plaintext: string;
}

/** Build a key record (pure) — does not persist. */
export function buildKeyRecord(input: CreateKeyInput): CreatedKey {
  const live = input.environment !== 'test';
  const generated = generateApiKey(live);
  const now = new Date();
  const record: ApiKeyRecord = {
    id: `key_${crypto.randomBytes(8).toString('hex')}`,
    name: input.name,
    prefix: generated.prefix,
    last4: generated.last4,
    hash: generated.hash,
    status: 'active',
    environment: live ? 'live' : 'test',
    permissions: normalizeScopes(input.permissions ?? []),
    tags: Array.isArray(input.tags) ? input.tags.slice(0, 20).map(String) : [],
    createdBy: input.createdBy,
    createdAt: now.toISOString(),
    expiresAt: input.expiresInDays
      ? new Date(now.getTime() + input.expiresInDays * 86_400_000).toISOString()
      : null,
    lastUsedAt: null,
    revokedAt: null,
    graceUntil: null,
    rotatedFrom: null,
    rotatedTo: null,
  };
  return { record, plaintext: generated.plaintext };
}

export async function createKey(uid: string, input: CreateKeyInput): Promise<CreatedKey> {
  const built = buildKeyRecord(input);
  if (isAdminInitialized()) {
    await keysCol(uid).doc(built.record.id).set(built.record);
  }
  return built;
}

export async function listKeys(uid: string): Promise<ApiKeyPublic[]> {
  if (!isAdminInitialized()) return [];
  const snap = await keysCol(uid).get();
  return snap.docs
    .map((d) => toPublic({ id: d.id, ...(d.data() as object) } as ApiKeyRecord))
    .filter((k) => k.status !== 'revoked');
}

export async function getKey(uid: string, id: string): Promise<ApiKeyRecord | null> {
  if (!isAdminInitialized()) return null;
  const snap = await keysCol(uid).doc(id).get();
  return snap.exists ? ({ id, ...(snap.data() as object) } as ApiKeyRecord) : null;
}

export interface UpdateKeyInput {
  name?: string;
  tags?: string[];
  status?: 'active' | 'disabled'; // re-enable / disable only
}

export async function updateKey(uid: string, id: string, input: UpdateKeyInput): Promise<boolean> {
  if (!isAdminInitialized()) return true;
  const ref = keysCol(uid).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const current = snap.data() as ApiKeyRecord;
  if (current.status === 'revoked') return false; // cannot modify a revoked key

  const patch: Partial<ApiKeyRecord> = {};
  if (typeof input.name === 'string') patch.name = input.name;
  if (Array.isArray(input.tags)) patch.tags = input.tags.slice(0, 20).map(String);
  if (input.status === 'active' || input.status === 'disabled') patch.status = input.status;
  await ref.set(patch, { merge: true });
  return true;
}

export async function revokeKey(uid: string, id: string): Promise<boolean> {
  if (!isAdminInitialized()) return true;
  const ref = keysCol(uid).doc(id);
  if (!(await ref.get()).exists) return false;
  await ref.set({ status: 'revoked', revokedAt: new Date().toISOString() }, { merge: true });
  return true;
}

/**
 * Rotate a key. The new key is issued immediately; the old one stays valid for
 * `graceSeconds` (0 = emergency rotation: revoke immediately).
 */
export async function rotateKey(
  uid: string,
  id: string,
  createdBy: string,
  graceSeconds = 0,
): Promise<CreatedKey | null> {
  const old = await getKey(uid, id);
  // In mock mode `old` is null; still issue a fresh key for dev ergonomics.
  const built = buildKeyRecord({
    name: old?.name ?? 'Rotated key',
    environment: old?.environment,
    permissions: old?.permissions,
    tags: old?.tags,
    createdBy,
  });
  built.record.rotatedFrom = id;

  if (isAdminInitialized()) {
    await keysCol(uid).doc(built.record.id).set(built.record);
    const graceUntil =
      graceSeconds > 0 ? new Date(Date.now() + graceSeconds * 1000).toISOString() : null;
    await keysCol(uid)
      .doc(id)
      .set(
        graceUntil
          ? { graceUntil, rotatedTo: built.record.id }
          : { status: 'revoked', revokedAt: new Date().toISOString(), rotatedTo: built.record.id },
        { merge: true },
      );
  }
  return built;
}

/** Resolve a presented plaintext key to its record (for API-key auth). */
export async function resolveKey(uid: string, plaintext: string): Promise<ApiKeyRecord | null> {
  if (!isAdminInitialized()) return null;
  const hash = hashApiKey(plaintext);
  const snap = await keysCol(uid).where('hash', '==', hash).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, ...(doc.data() as object) } as ApiKeyRecord;
}

/** Resolve a key across all users (for API-key authentication middleware). */
export async function resolveKeyGlobal(
  plaintext: string,
): Promise<{ uid: string; record: ApiKeyRecord } | null> {
  if (!isAdminInitialized()) return null;
  const hash = hashApiKey(plaintext);
  const snap = await getDb().collectionGroup('apiKeys').where('hash', '==', hash).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  // Path: users/{uid}/apiKeys/{id}
  const uid = doc.ref.parent.parent?.id;
  if (!uid) return null;
  return { uid, record: { id: doc.id, ...(doc.data() as object) } as ApiKeyRecord };
}

export async function touchLastUsed(uid: string, id: string): Promise<void> {
  if (!isAdminInitialized()) return;
  await keysCol(uid).doc(id).set({ lastUsedAt: new Date().toISOString() }, { merge: true });
}
