/**
 * Unit tests for the Plugin SDK: manifest validation, registry, loader,
 * sandbox, hooks, and cache. Run with: node --test
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  parseManifest,
  parseManifestJSON,
  validateManifest,
  validateInstance,
  PluginRegistry,
  PluginLoader,
  PluginCache,
  HookBus,
  runSafely,
} from '../dist/plugins/index.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'derivo-plg-'));
const stateFile = () => path.join(tmp(), 'state.json');

// ── Manifest ────────────────────────────────────────
test('manifest: accepts a valid manifest', () => {
  const m = parseManifest({ id: 'docker', name: 'Docker', version: '1.0.0', apiVersion: '1' });
  assert.equal(m.id, 'docker');
});

test('manifest: rejects bad id', () => {
  assert.throws(() => parseManifest({ id: 'Bad Id', name: 'x', version: '1.0.0', apiVersion: '1' }));
});

test('manifest: rejects non-semver version', () => {
  assert.throws(() => parseManifest({ id: 'x', name: 'x', version: 'one', apiVersion: '1' }));
});

test('manifest: rejects invalid JSON', () => {
  assert.throws(() => parseManifestJSON('{ not json'));
});

test('manifest: unsupported apiVersion is semantically invalid', () => {
  const outcome = validateManifest({ id: 'x', name: 'x', version: '1.0.0', apiVersion: '99' });
  assert.equal(outcome.valid, false);
});

// ── validateInstance ────────────────────────────────
test('validateInstance: id must match manifest', () => {
  const m = { id: 'a', name: 'a', version: '1.0.0', apiVersion: '1' };
  assert.equal(validateInstance(m, { id: 'b', detect() {} }).valid, false);
  assert.equal(validateInstance(m, { id: 'a', detect() {} }).valid, true);
});

// ── Registry ────────────────────────────────────────
test('registry: register / has / get / list', () => {
  const reg = new PluginRegistry(stateFile());
  reg.register({
    manifest: { id: 'a', name: 'A', version: '1.0.0', apiVersion: '1' },
    source: 'builtin',
    dir: '<b>',
    state: 'validated',
    enabled: true,
  });
  assert.ok(reg.has('a'));
  assert.equal(reg.get('a').manifest.name, 'A');
  assert.equal(reg.list().length, 1);
});

test('registry: disable persists and survives reconstruction', () => {
  const file = stateFile();
  const reg = new PluginRegistry(file);
  reg.register({
    manifest: { id: 'a', name: 'A', version: '1.0.0', apiVersion: '1' },
    source: 'builtin',
    dir: '<b>',
    state: 'validated',
    enabled: true,
  });
  reg.disable('a');
  assert.equal(reg.get('a').enabled, false);

  const reg2 = new PluginRegistry(file);
  assert.ok(reg2.isDisabled('a'));
});

// ── Cache ───────────────────────────────────────────
test('cache: stores and retrieves manifest by mtime', () => {
  const dir = tmp();
  const file = path.join(dir, 'derivo-plugin.json');
  fs.writeFileSync(file, JSON.stringify({ id: 'a', name: 'A', version: '1.0.0', apiVersion: '1' }));
  const cache = new PluginCache();
  const manifest = { id: 'a', name: 'A', version: '1.0.0', apiVersion: '1' };
  cache.setManifest(file, manifest);
  assert.deepEqual(cache.getManifest(file), manifest);
  cache.clear();
  assert.equal(cache.getManifest(file), undefined);
});

// ── Sandbox ─────────────────────────────────────────
test('sandbox: captures thrown errors without rejecting', async () => {
  const result = await runSafely(() => {
    throw new Error('boom');
  }, { pluginId: 'x', label: 'test' });
  assert.equal(result.ok, false);
  assert.match(result.error.message, /boom/);
});

test('sandbox: returns value on success', async () => {
  const result = await runSafely(() => 42, { pluginId: 'x', label: 'test' });
  assert.equal(result.ok, true);
  assert.equal(result.value, 42);
});

test('sandbox: enforces timeout', async () => {
  const result = await runSafely(() => new Promise(() => {}), {
    pluginId: 'x',
    label: 'slow',
    timeoutMs: 50,
  });
  assert.equal(result.ok, false);
  assert.match(result.error.message, /timed out/);
});

// ── Hooks ───────────────────────────────────────────
test('hooks: emit invokes subscribers; failing hook is isolated', async () => {
  const bus = new HookBus();
  let calls = 0;
  bus.on('beforeInspect', 'p1', () => {
    calls++;
  });
  bus.on('beforeInspect', 'p2', () => {
    throw new Error('hook failed');
  });
  const fakeCtx = (id) => ({ pluginId: id });
  const results = await bus.emit('beforeInspect', fakeCtx);
  assert.equal(calls, 1);
  assert.equal(results.length, 2);
  assert.equal(results.find((r) => r.pluginId === 'p2').result.ok, false);
});

test('hooks: offPlugin removes subscriptions', async () => {
  const bus = new HookBus();
  bus.on('afterValidate', 'p1', () => {});
  assert.equal(bus.count('afterValidate'), 1);
  bus.offPlugin('p1');
  assert.equal(bus.count('afterValidate'), 0);
});

// ── Loader: broken local plugin never crashes ───────
test('loader: invalid local manifest is recorded as failed, not thrown', async () => {
  const root = tmp();
  const pluginsDir = path.join(root, '.derivo', 'plugins', 'broken');
  fs.mkdirSync(pluginsDir, { recursive: true });
  fs.writeFileSync(path.join(pluginsDir, 'derivo-plugin.json'), '{ broken json');

  const reg = new PluginRegistry(stateFile());
  const loader = new PluginLoader(reg, { localDirs: [path.join(root, '.derivo', 'plugins')] });
  const report = { loaded: [], failed: [], skipped: [] };
  await loader.loadLocal(report);
  assert.equal(report.failed.length, 1);
  assert.equal(report.loaded.length, 0);
});

test('loader: loads a valid local plugin', async () => {
  const root = tmp();
  const pluginsDir = path.join(root, '.derivo', 'plugins', 'demo');
  fs.mkdirSync(pluginsDir, { recursive: true });
  fs.writeFileSync(
    path.join(pluginsDir, 'derivo-plugin.json'),
    JSON.stringify({ id: 'demo', name: 'Demo', version: '1.0.0', apiVersion: '1', entry: './index.mjs' }),
  );
  fs.writeFileSync(
    path.join(pluginsDir, 'index.mjs'),
    `export const plugin = { id: 'demo', detect() { return { applies: true }; } };`,
  );

  const reg = new PluginRegistry(stateFile());
  const loader = new PluginLoader(reg, { localDirs: [path.join(root, '.derivo', 'plugins')] });
  const report = { loaded: [], failed: [], skipped: [] };
  await loader.loadLocal(report);
  assert.deepEqual(report.loaded, ['demo']);
  assert.equal(reg.get('demo').source, 'local');
});
