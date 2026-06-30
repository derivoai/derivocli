/**
 * Lightweight in-process metrics (counters + latency histogram) and a metrics
 * snapshot for the /metrics endpoint. No external dependency; intended to be
 * scraped or shipped by the platform. For multi-instance aggregation, point a
 * real metrics backend at these values later.
 */
export type CounterName =
  | 'http.requests'
  | 'http.errors'
  | 'auth.failures'
  | 'ratelimit.hits'
  | 'billing.webhook.failures'
  | 'plugin.failures'
  | 'cli.verify.failures'
  | 'session.refresh.failures'
  | 'jobs.runs'
  | 'jobs.failures'
  | 'store.errors';

const counters = new Map<string, number>();
const latency = { count: 0, totalMs: 0, maxMs: 0, p95Buckets: new Array(20).fill(0) as number[] };

export function incr(name: CounterName, by = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + by);
}

export function observeLatency(ms: number): void {
  latency.count++;
  latency.totalMs += ms;
  latency.maxMs = Math.max(latency.maxMs, ms);
  // Crude bucketing: 0-2000ms in 100ms buckets.
  const bucket = Math.min(19, Math.floor(ms / 100));
  latency.p95Buckets[bucket]!++;
}

function approxP95(): number {
  if (latency.count === 0) return 0;
  const target = latency.count * 0.95;
  let cumulative = 0;
  for (let i = 0; i < latency.p95Buckets.length; i++) {
    cumulative += latency.p95Buckets[i]!;
    if (cumulative >= target) return (i + 1) * 100;
  }
  return latency.maxMs;
}

export function snapshot(): Record<string, unknown> {
  return {
    counters: Object.fromEntries(counters),
    latency: {
      count: latency.count,
      avgMs: latency.count ? Math.round(latency.totalMs / latency.count) : 0,
      maxMs: latency.maxMs,
      p95Ms: approxP95(),
    },
    uptimeSec: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };
}

export function resetMetricsForTesting(): void {
  counters.clear();
  latency.count = 0;
  latency.totalMs = 0;
  latency.maxMs = 0;
  latency.p95Buckets.fill(0);
}
