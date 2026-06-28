/**
 * Derivo Plugin SDK — Loader
 *
 * Discovers plugins from two sources today (built-in + local directories) and
 * is structured to add npm-installed plugins later without changes elsewhere.
 *
 * Every plugin is validated before it is registered, and ANY failure is
 * captured as a `failed` record rather than crashing the CLI.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import { BUILTIN_PLUGINS } from '../builtins/index.js';
import { PluginCache } from '../plugin-cache/index.js';
import { ManifestError, PluginLoadError } from '../plugin-errors/index.js';
import { MANIFEST_FILENAME, parseManifestJSON } from '../plugin-manifest/index.js';
import type { PluginRegistry } from '../plugin-registry/index.js';
import type {
  DerivoPlugin,
  PluginManifest,
  PluginRecord,
  PluginSource,
} from '../plugin-types/index.js';
import { validateInstance, validateManifest } from '../plugin-validator/index.js';

/** Default local plugin search roots. */
export function defaultLocalPluginDirs(cwd: string = process.cwd()): string[] {
  return [path.join(os.homedir(), '.derivo', 'plugins'), path.join(cwd, '.derivo', 'plugins')];
}

export interface LoaderOptions {
  cwd?: string;
  localDirs?: string[];
  cache?: PluginCache;
}

export interface LoadReport {
  loaded: string[];
  failed: { id: string; error: string }[];
  skipped: string[];
}

export class PluginLoader {
  private readonly cache: PluginCache;
  private readonly localDirs: string[];

  constructor(
    private readonly registry: PluginRegistry,
    options: LoaderOptions = {},
  ) {
    this.cache = options.cache ?? new PluginCache();
    this.localDirs = options.localDirs ?? defaultLocalPluginDirs(options.cwd);
  }

  /** Discover and register every available plugin. */
  loadAll(): LoadReport {
    const report: LoadReport = { loaded: [], failed: [], skipped: [] };
    this.loadBuiltins(report);
    // Local loading is async (dynamic import); callers use loadLocal() too.
    return report;
  }

  /** Register the in-code built-in plugins. */
  loadBuiltins(report: LoadReport): void {
    for (const { manifest, plugin } of BUILTIN_PLUGINS) {
      this.tryRegisterInstance(manifest, plugin, 'builtin', '<builtin>', report);
    }
  }

  /** Discover + import local plugins from the configured directories. */
  async loadLocal(report: LoadReport): Promise<void> {
    for (const dir of this.localDirs) {
      if (!fs.existsSync(dir)) continue;
      let entries: string[] = [];
      try {
        entries = fs.readdirSync(dir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        const pluginDir = path.join(dir, entry);
        await this.loadLocalPlugin(pluginDir, report);
      }
    }
  }

  /** Load a single local plugin directory. Never throws. */
  async loadLocalPlugin(pluginDir: string, report: LoadReport): Promise<void> {
    const manifestPath = path.join(pluginDir, MANIFEST_FILENAME);
    let manifest: PluginManifest;
    try {
      manifest = this.readManifest(manifestPath);
    } catch (error) {
      report.failed.push({
        id: path.basename(pluginDir),
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    if (this.registry.isDisabled(manifest.id)) {
      this.registry.register({
        manifest,
        source: 'local',
        dir: pluginDir,
        state: 'disabled',
        enabled: false,
      });
      report.skipped.push(manifest.id);
      return;
    }

    const semantic = validateManifest(manifest);
    if (!semantic.valid) {
      this.registerFailed(manifest, 'local', pluginDir, semantic.errors.join('; '), report);
      return;
    }

    const entry = manifest.entry ?? './index.js';
    const entryPath = path.resolve(pluginDir, entry);
    let instance: DerivoPlugin;
    try {
      const mod = (await import(pathToFileURL(entryPath).href)) as {
        default?: DerivoPlugin;
        plugin?: DerivoPlugin;
      };
      const candidate = mod.default ?? mod.plugin;
      if (!candidate) throw new PluginLoadError('Entry did not export a plugin', manifest.id);
      instance = candidate;
    } catch (error) {
      this.registerFailed(
        manifest,
        'local',
        pluginDir,
        error instanceof Error ? error.message : String(error),
        report,
      );
      return;
    }

    this.tryRegisterInstance(manifest, instance, 'local', pluginDir, report);
  }

  private tryRegisterInstance(
    manifest: PluginManifest,
    instance: DerivoPlugin,
    source: PluginSource,
    dir: string,
    report: LoadReport,
  ): void {
    if (this.registry.isDisabled(manifest.id)) {
      this.registry.register({ manifest, source, dir, state: 'disabled', enabled: false });
      report.skipped.push(manifest.id);
      return;
    }

    const semantic = validateManifest(manifest);
    const instanceCheck = validateInstance(manifest, instance);
    if (!semantic.valid || !instanceCheck.valid) {
      this.registerFailed(
        manifest,
        source,
        dir,
        [...semantic.errors, ...instanceCheck.errors].join('; '),
        report,
      );
      return;
    }

    this.registry.register({
      manifest,
      source,
      dir,
      state: 'validated',
      enabled: true,
      instance,
    });
    report.loaded.push(manifest.id);
  }

  private registerFailed(
    manifest: PluginManifest,
    source: PluginSource,
    dir: string,
    error: string,
    report: LoadReport,
  ): void {
    this.registry.register({ manifest, source, dir, state: 'failed', enabled: false, error });
    report.failed.push({ id: manifest.id, error });
  }

  private readManifest(manifestPath: string): PluginManifest {
    const cached = this.cache.getManifest(manifestPath);
    if (cached) return cached;
    let json: string;
    try {
      json = fs.readFileSync(manifestPath, 'utf8');
    } catch {
      throw new ManifestError(`Manifest not found: ${manifestPath}`);
    }
    const manifest = parseManifestJSON(json);
    this.cache.setManifest(manifestPath, manifest);
    return manifest;
  }
}
