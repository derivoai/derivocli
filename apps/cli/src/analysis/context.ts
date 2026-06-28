/**
 * Derivo — Project Analysis Engine: ProjectContext
 *
 * The single filesystem boundary for the analysis engine. Every detector
 * reads the project through this cached, read-only context so that:
 *  - IO logic is never duplicated across detectors
 *  - files (e.g. package.json) are parsed at most once per analysis
 *  - detectors stay pure and trivially testable (inject a fake context)
 */
import fs from 'fs';
import path from 'path';
import type { IProjectContext, PackageJson } from './types.js';

/** Common config-file extensions used across the JS/TS ecosystem. */
const DEFAULT_CONFIG_EXTENSIONS = [
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.cts',
  '.mts',
  '.json',
  '.jsonc',
  '.yaml',
  '.yml',
];

/**
 * Build artifacts, tooling caches, and VCS/editor folders that are never
 * meaningful project structure. Excluded from directory enumeration so they
 * never appear as workspace members or in the project graph.
 */
export const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  '.turbo',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.cache',
  'coverage',
  '.git',
  '.idea',
  '.vscode',
  '.derivo',
  '.husky',
]);

export class ProjectContext implements IProjectContext {
  public readonly root: string;

  private readonly textCache = new Map<string, string | null>();
  private readonly jsonCache = new Map<string, unknown>();
  private readonly existsCache = new Map<string, boolean>();
  private readonly dirCache = new Map<string, string[]>();
  private packageJsonLoaded = false;
  private packageJsonValue: PackageJson | null = null;

  constructor(root: string = process.cwd()) {
    this.root = path.resolve(root);
  }

  private abs(relativePath: string): string {
    return path.join(this.root, relativePath);
  }

  exists(relativePath: string): boolean {
    const cached = this.existsCache.get(relativePath);
    if (cached !== undefined) return cached;
    let result = false;
    try {
      result = fs.existsSync(this.abs(relativePath));
    } catch {
      result = false;
    }
    this.existsCache.set(relativePath, result);
    return result;
  }

  firstExisting(relativePaths: string[]): string | null {
    for (const rel of relativePaths) {
      if (this.exists(rel)) return rel;
    }
    return null;
  }

  existsWithExt(basename: string, extensions: string[] = DEFAULT_CONFIG_EXTENSIONS): string | null {
    // Exact match first (e.g. a basename that already has an extension).
    if (this.exists(basename)) return basename;
    for (const ext of extensions) {
      const candidate = `${basename}${ext}`;
      if (this.exists(candidate)) return candidate;
    }
    return null;
  }

  readText(relativePath: string): string | null {
    if (this.textCache.has(relativePath)) return this.textCache.get(relativePath) ?? null;
    let content: string | null = null;
    try {
      content = fs.readFileSync(this.abs(relativePath), 'utf8');
    } catch {
      content = null;
    }
    this.textCache.set(relativePath, content);
    return content;
  }

  readJSON<T = unknown>(relativePath: string): T | null {
    if (this.jsonCache.has(relativePath)) return (this.jsonCache.get(relativePath) as T) ?? null;
    const text = this.readText(relativePath);
    let value: T | null = null;
    if (text !== null) {
      try {
        value = JSON.parse(text) as T;
      } catch {
        value = null;
      }
    }
    this.jsonCache.set(relativePath, value);
    return value;
  }

  listDir(relativePath: string): string[] {
    if (this.dirCache.has(relativePath)) return this.dirCache.get(relativePath)!;
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(this.abs(relativePath));
    } catch {
      entries = [];
    }
    this.dirCache.set(relativePath, entries);
    return entries;
  }

  /**
   * Names of subdirectories within `relativePath`, excluding build artifacts,
   * caches, and VCS/editor folders (see `IGNORED_DIRECTORIES`).
   */
  listSubdirectories(relativePath: string): string[] {
    return this.listDir(relativePath).filter((entry) => {
      if (IGNORED_DIRECTORIES.has(entry)) return false;
      try {
        return fs.statSync(this.abs(path.join(relativePath, entry))).isDirectory();
      } catch {
        return false;
      }
    });
  }

  packageJson(): PackageJson | null {
    if (this.packageJsonLoaded) return this.packageJsonValue;
    this.packageJsonValue = this.readJSON<PackageJson>('package.json');
    this.packageJsonLoaded = true;
    return this.packageJsonValue;
  }

  scripts(): Record<string, string> {
    return this.packageJson()?.scripts ?? {};
  }

  hasDependency(name: string): boolean {
    return this.dependencyVersion(name) !== null;
  }

  dependencyVersion(name: string): string | null {
    const pkg = this.packageJson();
    if (!pkg) return null;
    return (
      pkg.dependencies?.[name] ??
      pkg.devDependencies?.[name] ??
      pkg.peerDependencies?.[name] ??
      pkg.optionalDependencies?.[name] ??
      null
    );
  }
}
