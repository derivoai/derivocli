/**
 * Derivo CLI — Standardized configuration paths
 *
 * Single source of truth for where Derivo stores config, cache, logs, and
 * plugins across platforms. The canonical home is `~/.derivo` (which resolves
 * correctly on Windows, macOS, and Linux via os.homedir()) and can be
 * overridden with the DERIVO_HOME environment variable — useful for tests,
 * CI, and sandboxed environments.
 *
 * A migration helper is provided so older/alternate layouts can be moved into
 * the standard location without data loss.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

/** Root Derivo directory. Honors DERIVO_HOME for overrides. */
export function getDerivoHome(): string {
  const override = process.env.DERIVO_HOME;
  if (override && override.trim()) return path.resolve(override.trim());
  return path.join(os.homedir(), '.derivo');
}

export const derivoPaths = {
  home: getDerivoHome,
  config: () => path.join(getDerivoHome(), 'config.json'),
  session: () => path.join(getDerivoHome(), 'session.json'),
  cacheDir: () => path.join(getDerivoHome(), 'cache'),
  logsDir: () => path.join(getDerivoHome(), 'logs'),
  pluginsDir: () => path.join(getDerivoHome(), 'plugins'),
  pluginState: () => path.join(getDerivoHome(), 'plugin-state.json'),
  pluginConfig: () => path.join(getDerivoHome(), 'plugin-config.json'),
  updateCache: () => path.join(getDerivoHome(), 'cache', 'update-check.json'),
  telemetryQueue: () => path.join(getDerivoHome(), 'telemetry-queue.jsonl'),
};

/** Ensure the standard directory structure exists. Safe to call repeatedly. */
export function ensureDerivoDirs(): void {
  const dirs = [
    getDerivoHome(),
    derivoPaths.cacheDir(),
    derivoPaths.logsDir(),
    derivoPaths.pluginsDir(),
  ];
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Best-effort — never crash on directory creation.
    }
  }
}

/**
 * Migrate any known legacy layout into the standard home. Currently the legacy
 * and standard layouts coincide (`~/.derivo`), so this is a no-op unless
 * DERIVO_HOME points elsewhere and an old `~/.derivo` exists. Returns the list
 * of files migrated.
 */
export function migrateLegacyLayout(): string[] {
  const standardHome = getDerivoHome();
  const legacyHome = path.join(os.homedir(), '.derivo');
  if (path.resolve(standardHome) === path.resolve(legacyHome)) return [];
  if (!fs.existsSync(legacyHome)) return [];

  const migrated: string[] = [];
  try {
    if (!fs.existsSync(standardHome)) fs.mkdirSync(standardHome, { recursive: true });
    for (const entry of fs.readdirSync(legacyHome)) {
      const from = path.join(legacyHome, entry);
      const to = path.join(standardHome, entry);
      if (fs.existsSync(to)) continue; // never overwrite newer data
      try {
        fs.cpSync(from, to, { recursive: true });
        migrated.push(entry);
      } catch {
        // Skip files that cannot be copied.
      }
    }
  } catch {
    // Migration is best-effort.
  }
  return migrated;
}
