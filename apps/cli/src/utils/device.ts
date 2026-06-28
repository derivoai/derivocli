import os from 'os';
import crypto from 'crypto';
import { getGlobalConfig, saveGlobalConfig } from './config.js';
import { createDocument, getDocument } from './firestore.js';
import { SessionData } from './session.js';
import { execSync } from 'child_process';

export interface DeviceData {
  id: string;
  name: string;
  type: 'mac' | 'windows' | 'linux';
  os: string;
  browser: string;
  cliVersion: string;
  lastActive: string;
  isTrusted: boolean;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export function getRealOSName(): string {
  const platform = os.platform();
  const release = os.release();

  if (platform === 'win32') {
    try {
      // wmic os get Caption /value
      const stdout = execSync('wmic os get Caption /value', {
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
        timeout: 5000,
      });
      const match = stdout.match(/Caption=(.+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    } catch {
      // Fallback if wmic fails
      const major = parseInt(release.split('.')[0]!, 10);
      const build = parseInt(release.split('.')[2]!, 10);
      if (major === 10) {
        if (build >= 22000) return 'Windows 11';
        return 'Windows 10';
      }
    }
    return `Windows ${release}`;
  }

  if (platform === 'darwin') {
    try {
      const stdout = execSync('sw_vers -productVersion', {
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
        timeout: 5000,
      });
      return `macOS ${stdout.trim()}`;
    } catch {
      return 'macOS';
    }
  }

  if (platform === 'linux') {
    try {
      const stdout = execSync('cat /etc/os-release', {
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
        timeout: 5000,
      });
      const match = stdout.match(/PRETTY_NAME="(.+)"/);
      if (match && match[1]) return match[1];
    } catch {
      return 'Linux';
    }
  }

  return platform;
}

export async function registerOrUpdateDevice(session: SessionData, cliVersion: string) {
  const config = getGlobalConfig();
  let deviceId = config.deviceId;

  if (!deviceId) {
    deviceId = `dev_${crypto.randomBytes(8).toString('hex')}`;
    saveGlobalConfig({
      ...config,
      deviceId,
    });
  }

  const hostname = os.hostname();
  const username = os.userInfo().username;
  const deviceName = `${username}@${hostname}`;

  const platform = os.platform();
  const type: 'mac' | 'windows' | 'linux' =
    platform === 'darwin' ? 'mac' : platform === 'win32' ? 'windows' : 'linux';
  const osName = getRealOSName();

  // Try checking if device is already registered
  const check = await getDocument(session.token, session.uid, 'devices', deviceId);

  const deviceData: Record<string, unknown> = {
    id: deviceId,
    name: deviceName,
    type,
    os: osName,
    browser: 'CLI',
    cliVersion: `v${cliVersion}`,
    lastActive: 'Active now',
    isTrusted: true,
    location: 'Local Machine',
    updatedAt: new Date().toISOString(),
  };

  if (!check.exists) {
    deviceData.createdAt = new Date().toISOString();
  } else {
    deviceData.createdAt = check.data?.createdAt || new Date().toISOString();
  }

  // Save to Firestore
  await createDocument(session.token, session.uid, 'devices', deviceId, deviceData);
}
