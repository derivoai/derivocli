/**
 * Pluggable key-value store. One interface, three backends:
 *   - memory     (development / tests)
 *   - firestore  (default in production without Redis)
 *   - redis      (preferred for multi-instance; lazy-loaded if available)
 *
 * Used by distributed rate limiting, replay protection, and session storage so
 * those concerns are consistent across multiple API instances.
 */
import { getDb, isAdminInitialized } from '../firebase.js';
import { loadConfig, type StoreBackend } from './config.js';

export interface KVStore {
  readonly backend: StoreBackend;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** Atomic increment; sets TTL on first write. Returns the new value. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  has(key: string): Promise<boolean>;
  del(key: string): Promise<void>;
}

// ── Memory ───────────────────────────────────────────────────────────────────
class MemoryStore implements KVStore {
  readonly backend = 'memory' as const;
  private readonly map = new Map<string, { value: string; expiresAt: number | null }>();

  private live(key: string): { value: string; expiresAt: number | null } | null {
    const e = this.map.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && e.expiresAt <= Date.now()) {
      this.map.delete(key);
      return null;
    }
    return e;
  }

  async get(key: string): Promise<string | null> {
    return this.live(key)?.value ?? null;
  }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.map.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const existing = this.live(key);
    const next = (existing ? parseInt(existing.value, 10) || 0 : 0) + 1;
    this.map.set(key, {
      value: String(next),
      expiresAt: existing?.expiresAt ?? Date.now() + ttlSeconds * 1000,
    });
    return next;
  }
  async has(key: string): Promise<boolean> {
    return this.live(key) !== null;
  }
  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}

// ── Firestore ────────────────────────────────────────────────────────────────
class FirestoreStore implements KVStore {
  readonly backend = 'firestore' as const;
  private col() {
    return getDb().collection('kv');
  }

  async get(key: string): Promise<string | null> {
    const snap = await this.col().doc(encode(key)).get();
    if (!snap.exists) return null;
    const data = snap.data() as { value: string; expiresAt: number | null };
    if (data.expiresAt && data.expiresAt <= Date.now()) return null;
    return data.value;
  }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.col()
      .doc(encode(key))
      .set({ value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const ref = this.col().doc(encode(key));
    return getDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const data = snap.exists
        ? (snap.data() as { value: string; expiresAt: number | null })
        : null;
      const expired = data?.expiresAt && data.expiresAt <= now;
      const current = data && !expired ? parseInt(data.value, 10) || 0 : 0;
      const next = current + 1;
      tx.set(ref, {
        value: String(next),
        expiresAt: expired || !data ? now + ttlSeconds * 1000 : data.expiresAt,
      });
      return next;
    });
  }
  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }
  async del(key: string): Promise<void> {
    await this.col().doc(encode(key)).delete();
  }
}

// ── Redis (lazy) ─────────────────────────────────────────────────────────────
interface MinimalRedis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<unknown>;
  exists(key: string): Promise<number>;
  del(key: string): Promise<unknown>;
}

class RedisStore implements KVStore {
  readonly backend = 'redis' as const;
  constructor(private readonly client: MinimalRedis) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) await this.client.set(key, value, 'EX', ttlSeconds);
    else await this.client.set(key, value);
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const next = await this.client.incr(key);
    if (next === 1) await this.client.expire(key, ttlSeconds);
    return next;
  }
  async has(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

function encode(key: string): string {
  return Buffer.from(key).toString('base64url');
}

// ── Factory ──────────────────────────────────────────────────────────────────
let instance: KVStore | null = null;

async function tryCreateRedis(url: string): Promise<KVStore | null> {
  try {
    // Lazy, optional dependency — only loaded if installed. A non-literal
    // specifier keeps TypeScript from requiring the module at compile time.
    const moduleName = 'ioredis';
    const mod = (await import(moduleName).catch(() => null)) as {
      default?: new (url: string) => MinimalRedis;
    } | null;
    if (!mod?.default) return null;
    return new RedisStore(new mod.default(url));
  } catch {
    return null;
  }
}

/** Get the process-wide store, honoring config + availability with fallbacks. */
export async function getStore(): Promise<KVStore> {
  if (instance) return instance;
  const config = loadConfig();

  if (config.store === 'redis' && config.redisUrl) {
    const redis = await tryCreateRedis(config.redisUrl);
    if (redis) {
      instance = redis;
      return instance;
    }
    console.warn('⚠️  REDIS_URL set but ioredis is unavailable — falling back.');
  }

  if (config.store === 'firestore' || (config.store === 'redis' && isAdminInitialized())) {
    if (isAdminInitialized()) {
      instance = new FirestoreStore();
      return instance;
    }
  }

  instance = new MemoryStore();
  return instance;
}

/** Synchronous accessor used where async init already happened. */
export function getStoreSync(): KVStore {
  if (!instance) instance = new MemoryStore();
  return instance;
}

export function setStoreForTesting(store: KVStore | null): void {
  instance = store;
}
