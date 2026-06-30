/**
 * Resilience primitives: bounded retries with exponential backoff + jitter,
 * a simple circuit breaker, and a timeout wrapper. These are dependency-free
 * and intended for wrapping outbound/IO calls (store, provider HTTP, etc.).
 */
import { logger } from './logger.js';

export interface RetryOptions {
  retries?: number;
  /** Base delay in ms; grows exponentially per attempt. */
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Decide whether an error is worth retrying. Defaults to always. */
  shouldRetry?: (err: unknown) => boolean;
  label?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Run `fn`, retrying transient failures with exponential backoff + jitter. */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const base = options.baseDelayMs ?? 100;
  const max = options.maxDelayMs ?? 2_000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !shouldRetry(err)) break;
      const backoff = Math.min(max, base * 2 ** attempt);
      const jitter = Math.floor(Math.random() * (backoff / 2));
      const delay = backoff + jitter;
      logger.warn('retrying after failure', {
        label: options.label,
        attempt: attempt + 1,
        delayMs: delay,
        error: err instanceof Error ? err.message : String(err),
      });
      await sleep(delay);
    }
  }
  throw lastErr;
}

/** Reject if `fn` does not settle within `ms`. */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  label = 'operation',
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export type BreakerState = 'closed' | 'open' | 'half-open';

export interface BreakerOptions {
  /** Consecutive failures before opening. */
  failureThreshold?: number;
  /** Time to wait before a half-open trial, in ms. */
  resetTimeoutMs?: number;
  label?: string;
}

/**
 * Minimal circuit breaker. Opens after N consecutive failures, rejects fast
 * while open, then allows a single half-open trial after a cooldown.
 */
export class CircuitBreaker {
  private failures = 0;
  private state: BreakerState = 'closed';
  private openedAt = 0;
  private readonly threshold: number;
  private readonly resetMs: number;
  private readonly label: string;

  constructor(options: BreakerOptions = {}) {
    this.threshold = options.failureThreshold ?? 5;
    this.resetMs = options.resetTimeoutMs ?? 30_000;
    this.label = options.label ?? 'breaker';
  }

  getState(): BreakerState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.resetMs) {
        this.state = 'half-open';
      } else {
        throw new Error(`Circuit "${this.label}" is open`);
      }
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) {
      if (this.state !== 'open') {
        logger.warn('circuit opened', { label: this.label, failures: this.failures });
      }
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  /** Tests: force a clean state. */
  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.openedAt = 0;
  }
}
