/**
 * Integration tests for the Plugin runtime against built-in example plugins
 * (React, Express, Docker), plus disabled/broken/reload scenarios.
 * Run with: node --test
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PluginRuntime } from '../dist/plugins/index.js';

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'derivo-int-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return dir;
}
const pkg = (o) => JSON.stringify(o, null, 2);
const newRuntime = (cwd) =>
  new PluginRuntime({
    cwd,
    stateFile: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'st-')), 'state.json'),
    sink: () => {},
  });

test('runtime: loads all built-in plugins', async () => {
  const cwd = fixture({ 'package.json': pkg({ name: 'x' }) });
  const rt = newRuntime(cwd);
  const report = await rt.init();
  assert.ok(report.loaded.includes('react'));
  assert.ok(report.loaded.includes('express'));
  assert.ok(report.loaded.includes('docker'));
  assert.ok(report.loaded.includes('nextjs'));
});

test('integration: React plugin detects a React project', async () => {
  const cwd = fixture({
    'package.json': pkg({ name: 'web', dependencies: { react: '19.0.0', 'react-dom': '19.0.0' } }),
  });
  const rt = newRuntime(cwd);
  await rt.init();
  // Use the public path: analyze then run capability.
  const a = (await import('../dist/analysis/index.js')).analyzeProject(cwd);
  const results = await rt.runCapability('detect', a);
  const react = results.find((r) => r.pluginId === 'react');
  assert.equal(react.ok, true);
  assert.equal(react.result.applies, true);
});

test('integration: Express plugin detects + warns on missing @types/express', async () => {
  const cwd = fixture({
    'package.json': pkg({ name: 'api', dependencies: { express: '4.0.0' }, devDependencies: { typescript: '5.0.0' } }),
    'tsconfig.json': '{}',
  });
  const rt = newRuntime(cwd);
  await rt.init();
  const a = (await import('../dist/analysis/index.js')).analyzeProject(cwd);
  const results = await rt.runCapability('validate', a);
  const express = results.find((r) => r.pluginId === 'express');
  assert.equal(express.result.applies, true);
  assert.ok(express.result.findings.some((f) => /@types\/express/.test(f.message)));
});

test('integration: Docker plugin detects compose', async () => {
  const cwd = fixture({
    'package.json': pkg({ name: 'svc' }),
    'Dockerfile': 'FROM node:20',
    'docker-compose.yml': 'services: {}',
  });
  const rt = newRuntime(cwd);
  await rt.init();
  const a = (await import('../dist/analysis/index.js')).analyzeProject(cwd);
  const results = await rt.runCapability('inspect', a);
  const docker = results.find((r) => r.pluginId === 'docker');
  assert.equal(docker.result.applies, true);
  assert.equal(docker.result.data.compose, true);
});

test('integration: multiple plugins apply to a full-stack monorepo root', async () => {
  const cwd = fixture({
    'package.json': pkg({ name: 'app', dependencies: { react: '19', express: '4' } }),
    'Dockerfile': 'FROM node:20',
  });
  const rt = newRuntime(cwd);
  await rt.init();
  const a = (await import('../dist/analysis/index.js')).analyzeProject(cwd);
  const results = await rt.runCapability('detect', a);
  const applied = results.filter((r) => r.ok && r.result?.applies).map((r) => r.pluginId);
  assert.ok(applied.includes('react'));
  assert.ok(applied.includes('express'));
  assert.ok(applied.includes('docker'));
});

test('integration: disabled plugin does not run', async () => {
  const cwd = fixture({ 'package.json': pkg({ name: 'web', dependencies: { react: '19' } }) });
  const rt = newRuntime(cwd);
  await rt.init();
  await rt.disable('react');
  const a = (await import('../dist/analysis/index.js')).analyzeProject(cwd);
  const results = await rt.runCapability('detect', a);
  assert.equal(
    results.find((r) => r.pluginId === 'react'),
    undefined,
  );
});

test('integration: reload re-activates a built-in plugin', async () => {
  const cwd = fixture({ 'package.json': pkg({ name: 'web', dependencies: { react: '19' } }) });
  const rt = newRuntime(cwd);
  await rt.init();
  const ok = await rt.reload('react');
  assert.equal(ok, true);
  assert.equal(rt.get('react').state, 'activated');
});

test('integration: broken plugin is isolated and never crashes the runtime', async () => {
  const cwd = fixture({ 'package.json': pkg({ name: 'web' }) });
  const pluginsDir = path.join(cwd, '.derivo', 'plugins', 'crasher');
  fs.mkdirSync(pluginsDir, { recursive: true });
  fs.writeFileSync(
    path.join(pluginsDir, 'derivo-plugin.json'),
    pkg({ id: 'crasher', name: 'Crasher', version: '1.0.0', apiVersion: '1', entry: './index.mjs' }),
  );
  fs.writeFileSync(
    path.join(pluginsDir, 'index.mjs'),
    `export const plugin = { id: 'crasher', detect() { throw new Error('kaboom'); } };`,
  );

  const rt = new PluginRuntime({
    cwd,
    localDirs: [path.join(cwd, '.derivo', 'plugins')],
    stateFile: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'st-')), 'state.json'),
    sink: () => {},
  });
  await rt.init();
  assert.ok(rt.has('crasher'));

  const a = (await import('../dist/analysis/index.js')).analyzeProject(cwd);
  const results = await rt.runCapability('detect', a);
  const crasher = results.find((r) => r.pluginId === 'crasher');
  assert.equal(crasher.ok, false);
  assert.match(crasher.error, /kaboom/);
});

test('integration: hooks fire around inspect', async () => {
  const cwd = fixture({ 'package.json': pkg({ name: 'web', dependencies: { react: '19' } }) });
  const rt = newRuntime(cwd);
  await rt.init();
  const a = (await import('../dist/analysis/index.js')).analyzeProject(cwd);
  // react plugin subscribes to afterInspect; emitting must not throw.
  await rt.emitHook('beforeInspect', a);
  await rt.emitHook('afterInspect', a);
  assert.ok(rt.hooks.count('afterInspect') >= 1);
});
