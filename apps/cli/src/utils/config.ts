import os from 'os';
import path from 'path';
import fs from 'fs';

const DERIVO_DIR = path.join(os.homedir(), '.derivo');
const CONFIG_FILE = path.join(DERIVO_DIR, 'config.json');

/** Current on-disk configuration schema version. Bump when the shape changes. */
export const CONFIG_VERSION = 1;

export interface GlobalConfig {
  /** Schema version, used to migrate older layouts. */
  configVersion?: number;
  telemetryEnabled?: boolean;
  updateCheck?: boolean;
  theme?: 'dark' | 'light';
  deviceId?: string;
  deviceName?: string;
  /** Override the backend API base URL (defaults to http://localhost:3001). */
  apiUrl?: string;
}

export function getGlobalConfig(): GlobalConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

export function saveGlobalConfig(config: GlobalConfig) {
  if (!fs.existsSync(DERIVO_DIR)) {
    fs.mkdirSync(DERIVO_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/** Whether the stored config predates the current schema version. */
export function isConfigOutdated(): boolean {
  if (!fs.existsSync(CONFIG_FILE)) return false; // nothing to migrate yet
  const config = getGlobalConfig();
  return (config.configVersion ?? 0) < CONFIG_VERSION;
}

/**
 * Migrate the stored configuration to the current schema version. Safe to call
 * repeatedly; returns true if a migration was applied.
 */
export function migrateGlobalConfig(): boolean {
  const config = getGlobalConfig();
  const current = config.configVersion ?? 0;
  if (current >= CONFIG_VERSION) return false;

  // Forward-compatible migrations would branch on `current` here.
  config.configVersion = CONFIG_VERSION;
  saveGlobalConfig(config);
  return true;
}

/** Returns true if config.json exists but is not valid JSON. */
export function isConfigCorrupted(): boolean {
  if (!fs.existsSync(CONFIG_FILE)) return false;
  try {
    JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return false;
  } catch {
    return true;
  }
}

/**
 * Repair a corrupted config.json by backing it up and resetting to defaults.
 * Returns the backup path, or null if there was nothing to repair.
 */
export function repairCorruptedConfig(): string | null {
  if (!isConfigCorrupted()) return null;
  const backup = `${CONFIG_FILE}.bak`;
  try {
    fs.copyFileSync(CONFIG_FILE, backup);
  } catch {
    // Continue even if the backup fails — the corrupt file blocks usage.
  }
  saveGlobalConfig({ configVersion: CONFIG_VERSION });
  return backup;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
