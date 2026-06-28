/**
 * Derivo Plugin SDK — Cache
 *
 * In-memory cache for parsed manifests and discovery results, keyed by
 * directory + file mtime so repeated scans within a process avoid redundant
 * filesystem reads and JSON parsing. Cleared on reload.
 */
import fs from 'fs';
import type { PluginManifest } from '../plugin-types/index.js';

interface ManifestCacheEntry {
  mtimeMs: number;
  manifest: PluginManifest;
}

export class PluginCache {
  private readonly manifests = new Map<string, ManifestCacheEntry>();
  private readonly discovery = new Map<string, string[]>();

  /** Cached manifest for a file, validated against its mtime. */
  getManifest(manifestPath: string): PluginManifest | undefined {
    const entry = this.manifests.get(manifestPath);
    if (!entry) return undefined;
    try {
      const stat = fs.statSync(manifestPath);
      if (stat.mtimeMs === entry.mtimeMs) return entry.manifest;
    } catch {
      // Fall through — file gone or unreadable.
    }
    this.manifests.delete(manifestPath);
    return undefined;
  }

  setManifest(manifestPath: string, manifest: PluginManifest): void {
    try {
      const stat = fs.statSync(manifestPath);
      this.manifests.set(manifestPath, { mtimeMs: stat.mtimeMs, manifest });
    } catch {
      // Cannot stat — skip caching.
    }
  }

  getDiscovery(dir: string): string[] | undefined {
    return this.discovery.get(dir);
  }

  setDiscovery(dir: string, manifestPaths: string[]): void {
    this.discovery.set(dir, manifestPaths);
  }

  /** Invalidate a single plugin directory (used by reload). */
  invalidate(dir: string): void {
    this.discovery.delete(dir);
    for (const key of this.manifests.keys()) {
      if (key.startsWith(dir)) this.manifests.delete(key);
    }
  }

  clear(): void {
    this.manifests.clear();
    this.discovery.clear();
  }
}
