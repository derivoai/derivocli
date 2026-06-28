/**
 * Derivo CLI — Update checker (non-blocking)
 *
 * On startup we print an update notice from a local cache (instant, no
 * network), then refresh that cache in the background with a short timeout and
 * an unref'd socket so it can NEVER block or delay command execution.
 *
 * Disable with `DERIVO_NO_UPDATE_NOTIFIER=1` or `updateCheck: false` in config.
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import pc from 'picocolors';
import { derivoPaths } from './paths.js';
import { getCliVersion } from './version.js';

const PACKAGE_NAME = 'derivo';
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day
const FETCH_TIMEOUT_MS = 3000;

interface UpdateCache {
  latest: string;
  checkedAt: number;
}

export function isUpdateCheckDisabled(): boolean {
  if (process.env.DERIVO_NO_UPDATE_NOTIFIER) return true;
  if (process.env.CI) return true; // never nag in CI
  try {
    const cfg = JSON.parse(fs.readFileSync(derivoPaths.config(), 'utf8'));
    if (cfg.updateCheck === false) return true;
  } catch {
    // No/invalid config — checks remain enabled.
  }
  return false;
}

function readCache(): UpdateCache | null {
  try {
    return JSON.parse(fs.readFileSync(derivoPaths.updateCache(), 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(cache: UpdateCache): void {
  try {
    fs.mkdirSync(path.dirname(derivoPaths.updateCache()), { recursive: true });
    fs.writeFileSync(derivoPaths.updateCache(), JSON.stringify(cache), 'utf8');
  } catch {
    // Best-effort.
  }
}

/** Compare semver-ish versions. Returns true when `latest` > `current`. */
export function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) =>
    v
      .replace(/^v/, '')
      .split('-')[0]!
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const a = parse(latest);
  const b = parse(current);
  for (let i = 0; i < 3; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

/** Print an update notice if the cache shows a newer version. Synchronous. */
export function notifyUpdateFromCache(): void {
  if (isUpdateCheckDisabled()) return;
  const cache = readCache();
  const current = getCliVersion();
  if (!cache?.latest || !isNewer(cache.latest, current)) return;

  console.log('');
  console.log(`  ${pc.yellow('▲ Update available')}`);
  console.log(
    `    ${pc.dim('Current:')} ${current}   ${pc.dim('Latest:')} ${pc.green(cache.latest)}`,
  );
  console.log(`    ${pc.dim('Run:')} ${pc.cyan('npm install -g derivo')}`);
  console.log('');
}

/**
 * Refresh the update cache in the background. Fire-and-forget: the request is
 * unref'd and time-boxed so it never keeps the process alive or blocks exit.
 */
export function refreshUpdateCacheInBackground(): void {
  if (isUpdateCheckDisabled()) return;
  const cache = readCache();
  if (cache && Date.now() - cache.checkedAt < CHECK_INTERVAL_MS) return; // still fresh

  try {
    const req = https.get(REGISTRY_URL, { timeout: FETCH_TIMEOUT_MS }, (res) => {
      if ((res.statusCode ?? 500) >= 400) {
        res.resume();
        return;
      }
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (typeof parsed.version === 'string') {
            writeCache({ latest: parsed.version, checkedAt: Date.now() });
          }
        } catch {
          // Ignore malformed responses.
        }
      });
    });
    req.on('error', () => undefined);
    req.on('timeout', () => req.destroy());
    // Do not let the request keep the event loop alive (fire-and-forget).
    req.on('socket', (socket) => {
      if (typeof socket.unref === 'function') socket.unref();
    });
  } catch {
    // Never throw from a background check.
  }
}
