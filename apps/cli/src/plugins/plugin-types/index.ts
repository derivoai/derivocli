/**
 * Derivo Plugin SDK — Core Types
 *
 * The complete, stable contract shared by the plugin runtime and by plugin
 * authors. Plugins depend ONLY on these types (and the SDK barrel) — never on
 * CLI internals. This is the boundary that keeps the platform decoupled.
 */
import type { ProjectAnalysis } from '../../analysis/index.js';
import type { ValidationReport } from '../../validation/index.js';

/** Manifest API version this CLI build understands. */
export const SUPPORTED_API_VERSION = '1';

/** Capabilities a plugin may request. The context enforces these at runtime. */
export type PluginPermission = 'filesystem' | 'network' | 'environment' | 'process' | 'prompt';

export const ALL_PERMISSIONS: PluginPermission[] = [
  'filesystem',
  'network',
  'environment',
  'process',
  'prompt',
];

/** The on-disk / in-code descriptor for a plugin. */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  apiVersion: string;
  /** Entry module, relative to the manifest. Omitted for built-ins. */
  entry?: string;
  permissions?: PluginPermission[];
}

/** Where a plugin came from. */
export type PluginSource = 'builtin' | 'local' | 'npm';

/** Lifecycle states a plugin moves through. */
export type PluginState =
  'discovered' | 'validated' | 'activated' | 'deactivated' | 'failed' | 'disabled';

/** Names of the lifecycle hooks plugins may subscribe to. */
export type HookName =
  | 'beforeInspect'
  | 'afterInspect'
  | 'beforeValidate'
  | 'afterValidate'
  | 'beforeDoctor'
  | 'afterDoctor'
  | 'beforeSetup'
  | 'afterSetup';

export const HOOK_NAMES: HookName[] = [
  'beforeInspect',
  'afterInspect',
  'beforeValidate',
  'afterValidate',
  'beforeDoctor',
  'afterDoctor',
  'beforeSetup',
  'afterSetup',
];

/** A finding a plugin returns from one of its capability methods. */
export interface PluginFinding {
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  detail?: string;
}

/** Standard return shape for capability methods. */
export interface PluginResult {
  /** Whether the plugin's subject applies to this project. */
  applies?: boolean;
  findings?: PluginFinding[];
  recommendations?: string[];
  /** Free-form data for JSON consumers. */
  data?: Record<string, unknown>;
}

export type MaybePromise<T> = T | Promise<T>;

/**
 * The capabilities a plugin can implement. Every method is optional; the
 * runtime invokes only what exists, always inside the sandbox.
 */
export interface DerivoPlugin {
  /** Stable id, must match the manifest id. */
  readonly id: string;

  detect?(ctx: PluginContext): MaybePromise<PluginResult | void>;
  doctor?(ctx: PluginContext): MaybePromise<PluginResult | void>;
  validate?(ctx: PluginContext): MaybePromise<PluginResult | void>;
  setup?(ctx: PluginContext): MaybePromise<PluginResult | void>;
  inspect?(ctx: PluginContext): MaybePromise<PluginResult | void>;

  activate?(ctx: PluginContext): MaybePromise<void>;
  deactivate?(ctx: PluginContext): MaybePromise<void>;

  /** Hook subscriptions — invoked around core command phases. */
  hooks?: Partial<Record<HookName, (ctx: PluginContext) => MaybePromise<void>>>;
}

/** The capability method names that can be executed via the runtime. */
export type PluginCapability = 'detect' | 'doctor' | 'validate' | 'setup' | 'inspect';

// ── Context surfaces (no Node globals leak to plugins) ──────────────────────

export interface PluginLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  success(message: string): void;
}

/** Permission-gated, read-mostly filesystem surface. */
export interface PluginFileSystem {
  exists(relativePath: string): boolean;
  readText(relativePath: string): string | null;
  readJSON<T = unknown>(relativePath: string): T | null;
  list(relativePath: string): string[];
}

export interface PluginPrompt {
  confirm(question: string, defaultYes?: boolean): Promise<boolean>;
  select(question: string, options: string[]): Promise<string>;
}

export interface PluginPackageManagerInfo {
  name: string | null;
  lockfiles: string[];
}

export interface PluginEnvironmentInfo {
  /** Variable names declared in the env template — values are never exposed. */
  declaredVariables: string[];
  hasEnv: boolean;
  hasExample: boolean;
  /** Permission-gated read of a single process env var by name. */
  get(name: string): string | undefined;
}

export interface PluginWorkspaceInfo {
  isMonorepo: boolean;
  tool: string | null;
  members: { name: string; relativePath: string; kind: string }[];
}

export interface PluginConfigStore {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  all(): Record<string, unknown>;
}

export interface PluginTiming {
  /** Milliseconds since the context was created. */
  elapsed(): number;
  /** Start a named sub-timer; returns a stop function returning duration ms. */
  start(label: string): () => number;
}

export interface PluginHostInfo {
  cliVersion: string;
  os: string;
  platform: NodeJS.Platform;
  nodeVersion: string;
}

/**
 * The single object every plugin method receives. It is the ONLY way a plugin
 * touches the outside world. Built per-plugin so permissions are enforced.
 */
export interface PluginContext {
  readonly pluginId: string;
  readonly root: string;
  readonly host: PluginHostInfo;

  logger: PluginLogger;
  fs: PluginFileSystem;
  prompt: PluginPrompt;
  config: PluginConfigStore;
  timing: PluginTiming;

  packageManager: PluginPackageManagerInfo;
  environment: PluginEnvironmentInfo;
  workspace: PluginWorkspaceInfo;

  /** The shared analysis for the current command (single source of truth). */
  analysis: ProjectAnalysis;
  /** Run a fresh analysis (e.g. for a sub-path). */
  analyze(path?: string): ProjectAnalysis;
  /** Run analysis + validation. */
  validateProject(path?: string): { analysis: ProjectAnalysis; report: ValidationReport };

  /** Whether this plugin was granted a permission. */
  hasPermission(permission: PluginPermission): boolean;
}

// ── Registry record ─────────────────────────────────

export interface PluginRecord {
  manifest: PluginManifest;
  source: PluginSource;
  /** Absolute directory the plugin lives in (built-ins: synthetic). */
  dir: string;
  state: PluginState;
  enabled: boolean;
  /** Loaded plugin instance, present once activated. */
  instance?: DerivoPlugin;
  /** Last error message if the plugin failed. */
  error?: string;
}
