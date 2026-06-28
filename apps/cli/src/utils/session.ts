import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import pc from 'picocolors';
import { apiRequest, getApiBaseUrl } from './api.js';

const DERIVO_DIR = path.join(os.homedir(), '.derivo');
const SESSION_FILE = path.join(DERIVO_DIR, 'session.json');

// Get machine specific key for encryption (so copying session.json to another machine won't work)
function getEncryptionKey(): Buffer {
  const machineId = os.hostname() + os.userInfo().username;
  return crypto.createHash('sha256').update(machineId).digest();
}

const ALGORITHM = 'aes-256-gcm';

export interface SessionData {
  token: string;
  uid: string;
  email: string;
  expiresAt?: number;
}

export function ensureDerivoDir() {
  if (!fs.existsSync(DERIVO_DIR)) {
    fs.mkdirSync(DERIVO_DIR, { recursive: true });
  }
  const cacheDir = path.join(DERIVO_DIR, 'cache');
  const logsDir = path.join(DERIVO_DIR, 'logs');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
}

export function saveSession(data: SessionData) {
  ensureDerivoDir();

  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonStr = JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const payload = {
    iv: iv.toString('hex'),
    encrypted,
    authTag,
  };

  fs.writeFileSync(SESSION_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

export function getSession(): SessionData | null {
  if (!fs.existsSync(SESSION_FILE)) {
    return null;
  }

  try {
    const content = fs.readFileSync(SESSION_FILE, 'utf8');
    const payload = JSON.parse(content);

    if (!payload.iv || !payload.encrypted || !payload.authTag) {
      return null;
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as SessionData;
  } catch (err) {
    // If decryption fails (e.g. copied to another machine or corrupted), return null
    return null;
  }
}

export function clearSession() {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
}

/**
 * Verify subscription via the BACKEND (single source of truth).
 *
 * Security model: the CLI never decides access itself. It asks the backend,
 * which validates the Firebase ID token and the subscription server-side.
 * For premium commands this FAILS CLOSED — if the backend is unreachable or
 * the token is invalid, access is denied. Free/offline commands never call
 * this, so they keep working without a backend.
 */
export async function verifySubscriptionActive(): Promise<boolean> {
  const session = getSession();
  if (!session) return true; // commands themselves handle the "please log in" path

  try {
    const res = await apiRequest<{
      active?: boolean;
      plan?: string;
      status?: string;
      reason?: string;
    }>('/api/cli/verify', { token: session.token, timeoutMs: 8000 });

    if (process.env.DERIVO_DEBUG) {
      console.log(
        pc.dim(`  [debug] verify ${getApiBaseUrl()} -> ${res.status} ${JSON.stringify(res.data)}`),
      );
    }

    if (res.status === 200 && res.data?.active) {
      return true;
    }

    if (res.status === 401 || res.status === 403) {
      console.log(pc.red('  ✗ Your session is invalid or expired.'));
      console.log(pc.dim('    Run: derivo login'));
      return false;
    }

    if (res.status === 200 && res.data && res.data.active === false) {
      console.log(pc.red('  ✗ No active subscription.'));
      if (res.data.reason) console.log(pc.dim(`    ${res.data.reason}`));
      console.log(pc.dim('    Upgrade your plan to use this command.'));
      return false;
    }

    // Any other backend response is treated as a denial (fail closed).
    console.log(pc.red(`  ✗ Could not verify your subscription (HTTP ${res.status}).`));
    return false;
  } catch (err) {
    // Backend unreachable: premium commands fail CLOSED for security.
    const base = getApiBaseUrl();
    console.log(pc.red(`  ✗ Cannot reach the Derivo backend at ${base}`));
    console.log(pc.dim('    Start the backend (apps/api) or set DERIVO_API_URL, then retry.'));
    if (process.env.DERIVO_DEBUG && err instanceof Error) {
      console.log(pc.dim(`    [debug] ${err.message}`));
    }
    return false;
  }
}
