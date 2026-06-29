/**
 * `derivo device` — manage trusted devices via the backend.
 */
import pc from 'picocolors';
import { getSession } from '../../utils/session.js';
import { apiRequest, getApiBaseUrl } from '../../utils/api.js';
import { getGlobalConfig } from '../../utils/config.js';
import { printSection, icons, nl } from '../../utils/ui.js';

function requireSession() {
  const session = getSession();
  if (!session) {
    console.log(`  ${pc.red(icons.error)} Not logged in. Run: ${pc.cyan('derivo login')}`);
    process.exit(1);
  }
  return session;
}

export async function deviceList(options: { json?: boolean }): Promise<void> {
  const session = requireSession();
  const currentId = getGlobalConfig().deviceId;
  const res = await apiRequest<{ devices?: Array<Record<string, unknown>> }>('/api/devices', {
    token: session.token,
    timeoutMs: 8000,
  }).catch(() => null);
  if (!res || res.status !== 200) {
    console.log(`  ${pc.red(icons.error)} Could not list devices (backend: ${getApiBaseUrl()}).`);
    process.exit(1);
  }
  const devices = res.data.devices ?? [];
  if (options.json) {
    console.log(JSON.stringify(devices, null, 2));
    return;
  }
  printSection('Trusted Devices');
  if (devices.length === 0) console.log(`    ${pc.dim('No devices registered')}`);
  for (const d of devices) {
    const current = d.id === currentId ? pc.green(' (this device)') : '';
    const revoked = d.revoked ? pc.red(' [revoked]') : '';
    const trust = d.isTrusted ? pc.green('trusted') : pc.yellow('untrusted');
    console.log(
      `    ${pc.cyan(icons.bullet)} ${pc.white(String(d.name ?? d.id))}${current}${revoked}`,
    );
    console.log(`        ${pc.dim(`${d.os ?? ''} · ${d.cliVersion ?? ''} · ${trust}`)}`);
    console.log(`        ${pc.dim(`id: ${d.id}`)}`);
  }
  nl();
}

export async function deviceRename(id: string, name: string): Promise<void> {
  const session = requireSession();
  const res = await apiRequest(`/api/devices/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token: session.token,
    body: { name },
    timeoutMs: 8000,
  }).catch(() => null);
  if (!res || (res.status !== 200 && res.status !== 204)) {
    console.log(`  ${pc.red(icons.error)} Could not rename device "${id}".`);
    process.exit(1);
  }
  console.log(`  ${pc.green(icons.success)} Device renamed to "${name}".`);
}

export async function deviceRevoke(id: string): Promise<void> {
  const session = requireSession();
  const res = await apiRequest(`/api/devices/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    token: session.token,
    body: {},
    timeoutMs: 8000,
  }).catch(() => null);
  if (!res || res.status !== 200) {
    console.log(`  ${pc.red(icons.error)} Could not revoke device "${id}".`);
    process.exit(1);
  }
  console.log(`  ${pc.green(icons.success)} Device "${id}" revoked.`);
}
