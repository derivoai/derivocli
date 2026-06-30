/**
 * Structured JSON logger with request/correlation IDs and secret sanitization.
 * In development it pretty-prints; in production it emits one JSON line per log
 * so platform log aggregators can parse it.
 */
import { loadConfig } from './config.js';

type Level = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE = /(authorization|token|secret|password|api[_-]?key|cookie|refresh)/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[depth]';
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE.test(k) ? '[redacted]' : sanitize(v, depth + 1);
  }
  return out;
}

function emit(level: Level, message: string, meta?: Record<string, unknown>): void {
  const isProd = loadConfig().env === 'production';
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? (sanitize(meta) as Record<string, unknown>) : {}),
  };
  const line = isProd
    ? JSON.stringify(entry)
    : `[${level}] ${message}${meta ? ' ' + JSON.stringify(sanitize(meta)) : ''}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => {
    if (loadConfig().env !== 'production') emit('debug', m, meta);
  },
  info: (m: string, meta?: Record<string, unknown>) => emit('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit('error', m, meta),
};
