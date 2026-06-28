import os from 'os';
import path from 'path';
import fs from 'fs';

const DERIVO_DIR = path.join(os.homedir(), '.derivo');
const CONFIG_FILE = path.join(DERIVO_DIR, 'config.json');

export interface GlobalConfig {
  telemetryEnabled?: boolean;
  theme?: 'dark' | 'light';
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
