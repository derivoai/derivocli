/**
 * Derivo CLI — Update checker with interactive upgrade prompt.
 *
 * On startup:
 *   1. Print update notice from local cache (instant, no network)
 *   2. If newer version found, prompt: [Upgrade] [Skip]
 *   3. If user chooses Upgrade, run: npm install -g @derivo/derivo-cli
 *   4. Refresh cache in background (non-blocking, once per day)
 *
 * Disable with DERIVO_NO_UPDATE_NOTIFIER=1 or updateCheck: false in config.
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { execSync } from 'child_process';
import pc from 'picocolors';
import { derivoPaths } from './paths.js';
import { getCliVersion } from './version.js';

export const PACKAGE_NAME = '@derivo/derivo-cli';
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day
const FETCH_TIMEOUT_MS = 3000;

interface UpdateCache {
  latest: string;
  checkedAt: number;
}

export function isUpdateCheckDisabled(): boolean {
  if (process.env.DERIVO_NO_UPDATE_NOTIFIER) return true;
  if (process.env.CI) return true;
  try {
    const cfg = JSON.parse(fs.readFileSync(derivoPaths.config(), 'utf8'));
    if (cfg.updateCheck === false) return true;
  } catch {
    // No config — checks enabled.
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

/** Compare semver. Returns true when `latest` > `current`. */
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

/**
 * Check cache and prompt user to upgrade if a newer version exists.
 * This is async and interactive — call it before running commands.
 */
export async function checkAndPromptUpdate(): Promise<void> {
  if (isUpdateCheckDisabled()) return;

  const cache = readCache();
  const current = getCliVersion();
  if (!cache?.latest || !isNewer(cache.latest, current)) return;

  const latest = cache.latest;

  console.log('');
  console.log(`  ${pc.yellow('┌─ Update Available ─────────────────────────────┐')}`);
  console.log(
    `  ${pc.yellow('│')}  ${pc.white('A new version of Derivo CLI is available!')}       ${pc.yellow('│')}`,
  );
  console.log(
    `  ${pc.yellow('│')}                                                 ${pc.yellow('│')}`,
  );
  console.log(
    `  ${pc.yellow('│')}  ${pc.dim('Current:')} ${pc.red(current.padEnd(10))}  ${pc.dim('Latest:')} ${pc.green(latest.padEnd(10))}  ${pc.yellow('│')}`,
  );
  console.log(`  ${pc.yellow('└─────────────────────────────────────────────────┘')}`);
  console.log('');

  const answer = await promptUpgrade();

  if (answer === 'upgrade') {
    console.log('');
    console.log(`  ${pc.cyan('▶')} Running: ${pc.bold(`npm install -g ${PACKAGE_NAME}`)}`);
    console.log('');
    try {
      execSync(`npm install -g ${PACKAGE_NAME}`, { stdio: 'inherit' });
      console.log('');
      console.log(
        `  ${pc.green('✓')} Upgraded to ${pc.green(latest)}! Please re-run your command.`,
      );
      console.log('');
      process.exit(0);
    } catch {
      console.log('');
      console.log(
        `  ${pc.red('✗')} Upgrade failed. Try manually: ${pc.cyan(`npm install -g ${PACKAGE_NAME}`)}`,
      );
      console.log('');
      // Continue with current version
    }
  } else {
    console.log(
      `  ${pc.dim('Skipping update. Run')} ${pc.cyan(`npm install -g ${PACKAGE_NAME}`)} ${pc.dim('anytime to upgrade.')}`,
    );
    console.log('');
  }
}

/** Simple interactive prompt without external dependencies. */
function promptUpgrade(): Promise<'upgrade' | 'skip'> {
  return new Promise((resolve) => {
    const readline = process.stdin;

    process.stdout.write(
      `  ${pc.bold('[U]')}${pc.dim('pgrade')}  ${pc.bold('[S]')}${pc.dim('kip')}   ` +
        `${pc.dim('Choice [U/s]:')} `,
    );

    // Read a single keypress if TTY, otherwise skip
    if (!process.stdin.isTTY) {
      process.stdout.write('\n');
      return resolve('skip');
    }

    readline.setEncoding('utf8');
    readline.setRawMode?.(true);
    readline.resume();

    readline.once('data', (key: string) => {
      readline.setRawMode?.(false);
      readline.pause();

      const k = key.toLowerCase().trim();
      process.stdout.write(k === 's' ? 'skip\n' : 'upgrade\n');

      if (k === 's') {
        resolve('skip');
      } else {
        // Enter or 'u' or anything else = upgrade
        resolve('upgrade');
      }
    });
  });
}

/** Non-blocking background refresh. */
export function notifyUpdateFromCache(): void {
  // Kept for backward compat — silent in new flow (checkAndPromptUpdate handles display)
}

export function refreshUpdateCacheInBackground(): void {
  if (isUpdateCheckDisabled()) return;
  const cache = readCache();
  if (cache && Date.now() - cache.checkedAt < CHECK_INTERVAL_MS) return;

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
          /* ignore */
        }
      });
    });
    req.on('error', () => undefined);
    req.on('timeout', () => req.destroy());
    req.on('socket', (socket) => {
      if (typeof socket.unref === 'function') socket.unref();
    });
  } catch {
    /* never throw */
  }
}
