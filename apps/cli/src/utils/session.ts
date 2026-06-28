import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import pc from 'picocolors';
import { getTopLevelDocument } from './firestore.js';

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

export async function verifySubscriptionActive(): Promise<boolean> {
  const session = getSession();
  if (!session) return true; // Let commands handle basic login checks

  try {
    // 1. Get subscription document
    const subDoc = await getTopLevelDocument(session.token, 'subscriptions', session.uid);
    let subData: any = null;

    if (subDoc.exists && subDoc.data) {
      subData = subDoc.data;
    } else {
      // Fallback: check users/{uid}
      const userDoc = await getTopLevelDocument(session.token, 'users', session.uid);
      if (userDoc.exists && userDoc.data && userDoc.data.subscription) {
        subData = userDoc.data.subscription;
      }
    }

    if (!subData) {
      console.log(pc.red('  ✗ Trial/Subcription expired Purchase the subcription'));
      return false;
    }

    const plan = subData.plan;
    const status = subData.status;

    if (plan === 'pro' || plan === 'enterprise') {
      if (status === 'active') return true;
    } else if (plan === 'trial') {
      if (status === 'active') {
        const trialEndsAt = subData.trialEndsAt;
        const ends = new Date(trialEndsAt).getTime();
        if (ends > Date.now()) {
          return true;
        }
      }
    }

    console.log(pc.red('  ✗ Trial/Subcription expired Purchase the subcription'));
    return false;
  } catch (e) {
    // If offline, let it pass (allow offline CLI checks where applicable, doctor handles offline test)
    return true;
  }
}
