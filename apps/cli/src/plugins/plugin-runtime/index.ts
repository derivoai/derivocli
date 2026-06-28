/**
 * Derivo Plugin SDK — Runtime
 *
 * The high-level facade the CLI uses. It wires together the registry, loader,
 * hook bus, sandbox, and context factory, and exposes the full lifecycle:
 * load → validate → activate → execute → deactivate → unload → reload.
 *
 * All plugin invocations go through the sandbox, so the CLI is never crashed
 * by plugin code.
 */
import { createPluginContext } from '../plugin-context/index.js';
import { HookBus } from '../plugin-hooks/index.js';
import { PluginLoader, type LoadReport } from '../plugin-loader/index.js';
import { PluginRegistry } from '../plugin-registry/index.js';
import { runSafely } from '../plugin-sandbox/index.js';
import { analyzeProject } from '../../analysis/index.js';
import type {
  HookName,
  PluginCapability,
  PluginContext,
  PluginRecord,
  PluginResult,
} from '../plugin-types/index.js';
import type { ProjectAnalysis } from '../../analysis/index.js';

export interface RuntimeOptions {
  cwd?: string;
  cliVersion?: string;
  verbose?: boolean;
  /** Output sink for plugin logs (defaults to console). */
  sink?: (line: string) => void;
  /** Override the persisted registry state file (used in tests). */
  stateFile?: string;
  /** Override local plugin search directories (used in tests). */
  localDirs?: string[];
}

export interface CapabilityResult {
  pluginId: string;
  capability: PluginCapability;
  ok: boolean;
  durationMs: number;
  result?: PluginResult;
  error?: string;
}

export class PluginRuntime {
  readonly registry: PluginRegistry;
  readonly hooks: HookBus;
  private readonly loader: PluginLoader;
  private readonly cwd: string;
  private readonly cliVersion: string;
  private readonly verbose: boolean;
  private readonly sink?: (line: string) => void;
  private initialized = false;

  constructor(options: RuntimeOptions = {}) {
    this.cwd = options.cwd ?? process.cwd();
    this.cliVersion = options.cliVersion ?? '0.1.0';
    this.verbose = options.verbose ?? false;
    this.sink = options.sink;
    this.registry = new PluginRegistry(options.stateFile);
    this.hooks = new HookBus();
    this.loader = new PluginLoader(this.registry, {
      cwd: this.cwd,
      localDirs: options.localDirs,
    });
  }

  /** Load every plugin and activate the enabled ones. Idempotent. */
  async init(): Promise<LoadReport> {
    const report: LoadReport = { loaded: [], failed: [], skipped: [] };
    if (this.initialized) return report;
    this.loader.loadBuiltins(report);
    await this.loader.loadLocal(report);
    await this.activateEnabled();
    this.initialized = true;
    return report;
  }

  /** Activate every enabled+validated plugin: run activate() and bind hooks. */
  private async activateEnabled(): Promise<void> {
    for (const record of this.registry.enabled()) {
      await this.activate(record);
    }
  }

  private async activate(record: PluginRecord): Promise<void> {
    const instance = record.instance;
    if (!instance) return;

    // Bind hook subscriptions.
    for (const [hookName, fn] of Object.entries(instance.hooks ?? {})) {
      if (typeof fn === 'function') {
        this.hooks.on(hookName as HookName, record.manifest.id, fn);
      }
    }

    if (typeof instance.activate === 'function') {
      const analysis = this.cheapAnalysis();
      const ctx = this.contextFor(record.manifest.id, analysis);
      const outcome = await runSafely(() => instance.activate!(ctx), {
        pluginId: record.manifest.id,
        label: 'activate',
      });
      if (!outcome.ok) {
        record.state = 'failed';
        record.error = outcome.error?.message;
        this.hooks.offPlugin(record.manifest.id);
        return;
      }
    }
    record.state = 'activated';
  }

  /** Run a capability across all enabled plugins that implement it. */
  async runCapability(
    capability: PluginCapability,
    analysis: ProjectAnalysis,
  ): Promise<CapabilityResult[]> {
    const results: CapabilityResult[] = [];
    for (const record of this.registry.enabled()) {
      const instance = record.instance;
      const method = instance?.[capability];
      if (typeof method !== 'function') continue;

      const ctx = this.contextFor(record.manifest.id, analysis);
      const outcome = await runSafely(() => (method as (c: PluginContext) => unknown)(ctx), {
        pluginId: record.manifest.id,
        label: capability,
      });

      if (outcome.ok) {
        results.push({
          pluginId: record.manifest.id,
          capability,
          ok: true,
          durationMs: outcome.durationMs,
          result: (outcome.value as PluginResult) ?? undefined,
        });
      } else {
        record.error = outcome.error?.message;
        results.push({
          pluginId: record.manifest.id,
          capability,
          ok: false,
          durationMs: outcome.durationMs,
          error: outcome.error?.message,
        });
      }
    }
    return results;
  }

  /** Emit a lifecycle hook to all subscribers. */
  async emitHook(hook: HookName, analysis: ProjectAnalysis): Promise<void> {
    await this.hooks.emit(hook, (pluginId) => this.contextFor(pluginId, analysis));
  }

  /** Deactivate a plugin: run deactivate() and unbind hooks. */
  async deactivate(id: string): Promise<boolean> {
    const record = this.registry.get(id);
    if (!record?.instance) return false;
    if (typeof record.instance.deactivate === 'function') {
      const ctx = this.contextFor(id, this.cheapAnalysis());
      await runSafely(() => record.instance!.deactivate!(ctx), {
        pluginId: id,
        label: 'deactivate',
      });
    }
    this.hooks.offPlugin(id);
    record.state = 'deactivated';
    return true;
  }

  async enable(id: string): Promise<boolean> {
    if (!this.registry.enable(id)) return false;
    const record = this.registry.get(id);
    if (record) await this.activate(record);
    return true;
  }

  async disable(id: string): Promise<boolean> {
    await this.deactivate(id);
    return this.registry.disable(id);
  }

  /** Unload + rediscover a single plugin. */
  async reload(id: string): Promise<boolean> {
    const record = this.registry.get(id);
    if (!record) return false;
    await this.deactivate(id);

    if (record.source === 'builtin') {
      // Re-register the built-in from code.
      const report: LoadReport = { loaded: [], failed: [], skipped: [] };
      this.registry.reload(id);
      this.loader.loadBuiltins(report);
    } else if (record.source === 'local') {
      const report: LoadReport = { loaded: [], failed: [], skipped: [] };
      this.registry.reload(id);
      await this.loader.loadLocalPlugin(record.dir, report);
    }

    const fresh = this.registry.get(id);
    if (fresh && fresh.enabled) await this.activate(fresh);
    return !!fresh;
  }

  list(): PluginRecord[] {
    return this.registry.list();
  }

  has(id: string): boolean {
    return this.registry.has(id);
  }

  get(id: string): PluginRecord | undefined {
    return this.registry.get(id);
  }

  contextFor(pluginId: string, analysis: ProjectAnalysis): PluginContext {
    const record = this.registry.get(pluginId);
    return createPluginContext({
      pluginId,
      root: this.cwd,
      permissions: record?.manifest.permissions ?? [],
      analysis,
      cliVersion: this.cliVersion,
      verbose: this.verbose,
      sink: this.sink,
    });
  }

  /** A minimal analysis used for activation/deactivation contexts. */
  private cheapAnalysis(): ProjectAnalysis {
    return analyzeProject(this.cwd);
  }
}
