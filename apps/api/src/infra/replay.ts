/**
 * Distributed replay protection backed by the pluggable store (memory /
 * Firestore / Redis). A replay "id" (webhook event id, nonce, etc.) is
 * remembered for a TTL; presenting the same id again within the window is a
 * replay and is rejected. Because it rides on the shared store, protection is
 * consistent across multiple API instances.
 */
import { getStore, setStoreForTesting } from './store.js';

const PREFIX = 'replay';
// Webhook providers may retry for hours/days; keep ids long enough to matter
// without growing the store unbounded.
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function k(namespace: string, id: string): string {
  return `${PREFIX}:${namespace}:${id}`;
}

/** True if this id has already been seen within the window. */
export async function seen(namespace: string, id: string): Promise<boolean> {
  if (!id) return false;
  const store = await getStore();
  return store.has(k(namespace, id));
}

/** Record an id as processed for `ttlSeconds`. */
export async function remember(
  namespace: string,
  id: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<void> {
  if (!id) return;
  const store = await getStore();
  await store.set(k(namespace, id), '1', ttlSeconds);
}

/**
 * Check and record in one call. Returns true if the id is a REPLAY (was already
 * present). On a fresh id it records and returns false.
 *
 * Note: memory/Firestore/Redis here are not strictly atomic across the
 * check-then-set, which is acceptable for at-least-once webhook delivery — the
 * downstream apply is itself idempotent.
 */
export async function checkAndRemember(
  namespace: string,
  id: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<boolean> {
  if (!id) return false;
  const store = await getStore();
  const key = k(namespace, id);
  if (await store.has(key)) return true;
  await store.set(key, '1', ttlSeconds);
  return false;
}

/** Tests: drop the shared store so replay state starts clean. */
export function resetReplayStoreForTesting(): void {
  setStoreForTesting(null);
}
