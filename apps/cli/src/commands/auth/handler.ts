/**
 * `derivo auth` — authentication & session status/management. All actions go
 * through the backend (single source of truth).
 */
import pc from 'picocolors';
import { getSession } from '../../utils/session.js';
import { apiRequest, getApiBaseUrl } from '../../utils/api.js';
import { getGlobalConfig } from '../../utils/config.js';
import { printBanner, printSection, icons, nl } from '../../utils/ui.js';

function requireSession() {
  const session = getSession();
  if (!session) {
    console.log(`  ${pc.red(icons.error)} Not logged in. Run: ${pc.cyan('derivo login')}`);
    process.exit(1);
  }
  return session;
}

export async function authStatus(options: { json?: boolean }): Promise<void> {
  const session = requireSession();
  let verify: { active?: boolean; plan?: string; status?: string; reason?: string } = {};
  try {
    const res = await apiRequest('/api/cli/verify', { token: session.token, timeoutMs: 8000 });
    if (res.status === 200) verify = res.data as typeof verify;
    else if (res.status === 401) verify = { status: 'session_expired' };
  } catch {
    verify = { status: 'backend_unreachable' };
  }

  const deviceName = getGlobalConfig().deviceName ?? 'this device';
  if (options.json) {
    console.log(
      JSON.stringify({ email: session.email, uid: session.uid, deviceName, ...verify }, null, 2),
    );
    return;
  }

  printBanner('Authentication', `${icons.lock} Session status`);
  printSection('Account');
  kv('Email', session.email);
  kv('UID', session.uid);
  kv('Device', deviceName);
  kv('Backend', getApiBaseUrl());
  printSection('Subscription');
  if (verify.status === 'backend_unreachable') {
    console.log(`  ${pc.yellow(icons.warning)} Backend unreachable`);
  } else if (verify.status === 'session_expired') {
    console.log(`  ${pc.red(icons.error)} Session expired — run ${pc.cyan('derivo login')}`);
  } else {
    kv('Active', verify.active ? pc.green('yes') : pc.red('no'));
    if (verify.plan) kv('Plan', verify.plan);
    if (verify.status) kv('Status', verify.status);
  }
  nl();
}

export async function authSessions(options: { json?: boolean }): Promise<void> {
  const session = requireSession();
  try {
    const res = await apiRequest<{ sessions?: Array<Record<string, unknown>> }>('/api/sessions', {
      token: session.token,
      timeoutMs: 8000,
    });
    if (res.status !== 200) {
      console.log(`  ${pc.red(icons.error)} Could not list sessions (HTTP ${res.status}).`);
      process.exit(1);
    }
    const sessions = res.data.sessions ?? [];
    if (options.json) {
      console.log(JSON.stringify(sessions, null, 2));
      return;
    }
    printSection('Active Sessions');
    if (sessions.length === 0) console.log(`    ${pc.dim('No active sessions')}`);
    for (const s of sessions) {
      const cur = s.current ? pc.green(' (current)') : '';
      console.log(`    ${pc.cyan(icons.bullet)} ${pc.white(String(s.deviceName ?? s.id))}${cur}`);
      console.log(`        ${pc.dim(`last seen ${s.lastSeenAt}`)}`);
    }
    nl();
  } catch {
    console.log(`  ${pc.red(icons.error)} Cannot reach the backend at ${getApiBaseUrl()}`);
    process.exit(1);
  }
}

export async function authLogoutAll(options: { json?: boolean }): Promise<void> {
  const session = requireSession();
  const res = await apiRequest<{ revoked?: number }>('/api/sessions/logout-all', {
    method: 'POST',
    token: session.token,
    body: {},
    timeoutMs: 8000,
  }).catch(() => null);
  if (!res || res.status !== 200) {
    console.log(`  ${pc.red(icons.error)} Could not log out other sessions.`);
    process.exit(1);
  }
  if (options.json) console.log(JSON.stringify(res.data));
  else console.log(`  ${pc.green(icons.success)} Logged out ${res.data.revoked ?? 0} session(s).`);
}

function kv(key: string, value: string): void {
  console.log(`    ${pc.dim(key.padEnd(12))} ${pc.white(value)}`);
}
