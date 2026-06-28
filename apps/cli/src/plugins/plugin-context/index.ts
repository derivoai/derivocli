/**
 * Derivo Plugin SDK — Plugin Context Factory
 *
 * Builds the per-plugin `PluginContext`. This is the ONLY bridge between a
 * plugin and the host. Capabilities are permission-gated here, and the shared
 * ProjectAnalysis is injected so plugins never re-run detection needlessly.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import pc from 'picocolors';
import { analyzeProject } from '../../analysis/index.js';
import { ProjectContext } from '../../analysis/context.js';
import { validateProject } from '../../validation/index.js';
import { promptConfirm, promptSelect } from '../../utils/prompts.js';
import { PermissionError } from '../plugin-errors/index.js';
import type {
  PluginConfigStore,
  PluginContext,
  PluginEnvironmentInfo,
  PluginFileSystem,
  PluginLogger,
  PluginPermission,
  PluginPrompt,
  PluginTiming,
} from '../plugin-types/index.js';
import type { ProjectAnalysis } from '../../analysis/index.js';

const CONFIG_FILE = path.join(os.homedir(), '.derivo', 'plugin-config.json');

export interface ContextFactoryOptions {
  pluginId: string;
  root: string;
  permissions: PluginPermission[];
  analysis: ProjectAnalysis;
  cliVersion: string;
  verbose: boolean;
  /** Optional output sink (defaults to console). Captured in tests. */
  sink?: (line: string) => void;
}

export function createPluginContext(options: ContextFactoryOptions): PluginContext {
  const { pluginId, root, permissions, analysis, cliVersion, verbose } = options;
  const write = options.sink ?? ((line: string) => console.log(line));
  const granted = new Set(permissions);
  const created = Date.now();
  const projectCtx = new ProjectContext(root);

  const require = (permission: PluginPermission): void => {
    if (!granted.has(permission)) throw new PermissionError(permission, pluginId);
  };

  const logger: PluginLogger = {
    info: (m) => write(`  ${pc.dim(`[${pluginId}]`)} ${m}`),
    success: (m) => write(`  ${pc.green('✔')} ${pc.dim(`[${pluginId}]`)} ${m}`),
    warn: (m) => write(`  ${pc.yellow('⚠')} ${pc.dim(`[${pluginId}]`)} ${m}`),
    error: (m) => write(`  ${pc.red('✗')} ${pc.dim(`[${pluginId}]`)} ${m}`),
    debug: (m) => {
      if (verbose) write(`  ${pc.dim(`[${pluginId}] debug:`)} ${pc.dim(m)}`);
    },
  };

  const fsSurface: PluginFileSystem = {
    exists: (rel) => {
      require('filesystem');
      return projectCtx.exists(rel);
    },
    readText: (rel) => {
      require('filesystem');
      return projectCtx.readText(rel);
    },
    readJSON: (rel) => {
      require('filesystem');
      return projectCtx.readJSON(rel);
    },
    list: (rel) => {
      require('filesystem');
      return projectCtx.listDir(rel);
    },
  };

  const prompt: PluginPrompt = {
    confirm: (q, d) => {
      require('prompt');
      return promptConfirm(q, d);
    },
    select: (q, o) => {
      require('prompt');
      return promptSelect(q, o);
    },
  };

  const environment: PluginEnvironmentInfo = {
    declaredVariables: analysis.environment.declaredVariables,
    hasEnv: analysis.environment.hasEnv,
    hasExample: analysis.environment.hasExample,
    get: (name) => {
      require('environment');
      return process.env[name];
    },
  };

  const timing: PluginTiming = {
    elapsed: () => Date.now() - created,
    start: (_label) => {
      const t0 = Date.now();
      return () => Date.now() - t0;
    },
  };

  return {
    pluginId,
    root,
    host: {
      cliVersion,
      os: `${os.type()} ${os.release()}`,
      platform: process.platform,
      nodeVersion: process.versions.node,
    },
    logger,
    fs: fsSurface,
    prompt,
    config: createConfigStore(pluginId),
    timing,
    packageManager: {
      name: analysis.packageManager.name,
      lockfiles: analysis.packageManager.lockfiles,
    },
    environment,
    workspace: {
      isMonorepo: analysis.workspace.isMonorepo,
      tool: analysis.workspace.tool,
      members: analysis.workspace.members.map((m) => ({
        name: m.name,
        relativePath: m.relativePath,
        kind: m.kind,
      })),
    },
    analysis,
    analyze: (p) => analyzeProject(p ?? root),
    validateProject: (p) => validateProject(p ?? root),
    hasPermission: (p) => granted.has(p),
  };
}

// ── Persistent, namespaced config store ─────────────

function readConfigFile(): Record<string, Record<string, unknown>> {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfigFile(data: Record<string, Record<string, unknown>>): void {
  try {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Config persistence is best-effort and must never crash a plugin.
  }
}

function createConfigStore(pluginId: string): PluginConfigStore {
  return {
    get: <T = unknown>(key: string): T | undefined => {
      return readConfigFile()[pluginId]?.[key] as T | undefined;
    },
    set: (key, value) => {
      const all = readConfigFile();
      all[pluginId] = { ...(all[pluginId] ?? {}), [key]: value };
      writeConfigFile(all);
    },
    all: () => readConfigFile()[pluginId] ?? {},
  };
}
