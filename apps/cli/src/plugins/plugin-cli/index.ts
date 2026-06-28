/**
 * Derivo Plugin SDK — Plugin CLI handlers
 *
 * Presentation for `derivo plugin <subcommand>`. These operate on an
 * initialized runtime and never re-implement plugin logic.
 */
import pc from 'picocolors';
import { icons, nl, printSection } from '../../utils/ui.js';
import type { LoadReport } from '../plugin-loader/index.js';
import type { PluginRuntime } from '../plugin-runtime/index.js';
import type { PluginRecord, PluginState } from '../plugin-types/index.js';

interface OutputOptions {
  json: boolean;
}

function stateBadge(record: PluginRecord): string {
  if (record.state === 'failed') return pc.red('failed');
  if (!record.enabled || record.state === 'disabled') return pc.dim('disabled');
  if (record.state === 'activated') return pc.green('active');
  return pc.yellow(record.state);
}

function recordSummary(record: PluginRecord) {
  return {
    id: record.manifest.id,
    name: record.manifest.name,
    version: record.manifest.version,
    source: record.source,
    enabled: record.enabled,
    state: record.state as PluginState,
    error: record.error,
  };
}

export function renderList(
  runtime: PluginRuntime,
  report: LoadReport,
  options: OutputOptions,
): void {
  const records = runtime.list();
  if (options.json) {
    console.log(JSON.stringify({ plugins: records.map(recordSummary), report }, null, 2));
    return;
  }

  printSection('Plugins');
  if (records.length === 0) {
    console.log(`    ${pc.dim('No plugins found')}`);
    return;
  }
  for (const record of records) {
    const src = pc.dim(`(${record.source})`);
    console.log(
      `    ${pc.cyan(icons.bullet)} ${pc.white(record.manifest.id.padEnd(14))} ${pc.dim(
        `v${record.manifest.version}`.padEnd(10),
      )} ${stateBadge(record)} ${src}`,
    );
    if (record.error) console.log(`        ${pc.red(icons.arrow)} ${pc.dim(record.error)}`);
  }
}

export function renderInfo(runtime: PluginRuntime, id: string, options: OutputOptions): boolean {
  const record = runtime.get(id);
  if (!record) {
    if (options.json) console.log(JSON.stringify({ error: `Plugin "${id}" not found` }, null, 2));
    else console.log(`    ${pc.red(icons.error)} Plugin "${id}" not found`);
    return false;
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          ...recordSummary(record),
          description: record.manifest.description,
          author: record.manifest.author,
          apiVersion: record.manifest.apiVersion,
          permissions: record.manifest.permissions ?? [],
          capabilities: capabilitiesOf(record),
          hooks: hooksOf(record),
        },
        null,
        2,
      ),
    );
    return true;
  }

  printSection(record.manifest.name);
  kv('ID', record.manifest.id);
  kv('Version', record.manifest.version);
  kv('Source', record.source);
  kv('State', record.state);
  kv('Enabled', record.enabled ? 'yes' : 'no');
  if (record.manifest.author) kv('Author', record.manifest.author);
  if (record.manifest.description) kv('Description', record.manifest.description);
  kv('API Version', record.manifest.apiVersion);
  kv('Permissions', (record.manifest.permissions ?? []).join(', ') || 'none');
  kv('Capabilities', capabilitiesOf(record).join(', ') || 'none');
  kv('Hooks', hooksOf(record).join(', ') || 'none');
  if (record.error) console.log(`    ${pc.red('Error')}        ${pc.red(record.error)}`);
  return true;
}

export async function doEnable(
  runtime: PluginRuntime,
  id: string,
  options: OutputOptions,
): Promise<boolean> {
  if (!runtime.has(id)) return notFound(id, options);
  const ok = await runtime.enable(id);
  report('enabled', id, ok, options);
  return ok;
}

export async function doDisable(
  runtime: PluginRuntime,
  id: string,
  options: OutputOptions,
): Promise<boolean> {
  if (!runtime.has(id)) return notFound(id, options);
  const ok = await runtime.disable(id);
  report('disabled', id, ok, options);
  return ok;
}

export async function doReload(
  runtime: PluginRuntime,
  id: string,
  options: OutputOptions,
): Promise<boolean> {
  if (!runtime.has(id)) return notFound(id, options);
  const ok = await runtime.reload(id);
  report('reloaded', id, ok, options);
  return ok;
}

export function renderDoctor(
  runtime: PluginRuntime,
  report: LoadReport,
  options: OutputOptions,
): void {
  const records = runtime.list();
  const active = records.filter((r) => r.enabled && r.state === 'activated');
  const failed = records.filter((r) => r.state === 'failed');
  const disabled = records.filter((r) => !r.enabled);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          total: records.length,
          active: active.length,
          failed: failed.length,
          disabled: disabled.length,
          report,
          plugins: records.map(recordSummary),
        },
        null,
        2,
      ),
    );
    return;
  }

  printSection('Plugin Doctor');
  console.log(`    ${pc.green(icons.success)} ${active.length} active`);
  console.log(`    ${pc.dim(icons.dot)} ${disabled.length} disabled`);
  console.log(
    `    ${failed.length ? pc.red(icons.error) : pc.green(icons.success)} ${failed.length} failed`,
  );
  for (const f of failed) {
    console.log(
      `        ${pc.red(icons.arrow)} ${pc.white(f.manifest.id)}: ${pc.dim(f.error ?? 'unknown error')}`,
    );
  }
  if (report.failed.length > 0) {
    nl();
    console.log(`    ${pc.yellow('Discovery problems:')}`);
    for (const f of report.failed) {
      console.log(`        ${pc.yellow(icons.warning)} ${f.id}: ${pc.dim(f.error)}`);
    }
  }
}

// ── helpers ─────────────────────────────────────────

function capabilitiesOf(record: PluginRecord): string[] {
  const inst = record.instance;
  if (!inst) return [];
  return (['detect', 'doctor', 'validate', 'setup', 'inspect'] as const).filter(
    (c) => typeof inst[c] === 'function',
  );
}

function hooksOf(record: PluginRecord): string[] {
  return Object.keys(record.instance?.hooks ?? {});
}

function notFound(id: string, options: OutputOptions): boolean {
  if (options.json) console.log(JSON.stringify({ error: `Plugin "${id}" not found` }, null, 2));
  else console.log(`    ${pc.red(icons.error)} Plugin "${id}" not found`);
  return false;
}

function report(action: string, id: string, ok: boolean, options: OutputOptions): void {
  if (options.json) {
    console.log(JSON.stringify({ action, id, success: ok }, null, 2));
    return;
  }
  if (ok) console.log(`    ${pc.green(icons.success)} Plugin "${id}" ${action}`);
  else console.log(`    ${pc.red(icons.error)} Failed to ${action.replace(/d$/, '')} "${id}"`);
}

function kv(key: string, value: string): void {
  console.log(`    ${pc.dim(key.padEnd(14))} ${pc.white(value)}`);
}
