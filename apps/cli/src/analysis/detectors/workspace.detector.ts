import { BaseDetector } from '../base-detector.js';
import { ProjectContext } from '../context.js';
import type {
  IProjectContext,
  PackageJson,
  Recommendation,
  Risk,
  WorkspaceInfo,
  WorkspaceMember,
  WorkspaceTool,
} from '../types.js';

const LARGE_MONOREPO_THRESHOLD = 20;

export class WorkspaceDetector extends BaseDetector<WorkspaceInfo> {
  readonly id = 'workspace';
  readonly title = 'Workspace';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).isMonorepo;
  }

  analyze(ctx: IProjectContext): WorkspaceInfo {
    const tool = this.resolveTool(ctx);
    const patterns = this.resolvePatterns(ctx);
    const members = this.resolveMembers(ctx, patterns);
    const packageCount = members.length;
    const isMonorepo = tool !== null || patterns.length > 0;

    return {
      isMonorepo,
      tool,
      packageCount,
      large: packageCount >= LARGE_MONOREPO_THRESHOLD,
      patterns,
      members,
    };
  }

  confidence(ctx: IProjectContext): number {
    const info = this.analyze(ctx);
    if (!info.isMonorepo) return 100; // confidently "not a monorepo"
    // Dedicated tooling config is a strong signal.
    if (info.tool === 'turborepo' || info.tool === 'nx' || info.tool === 'lerna') return 98;
    return 88;
  }

  override recommendations(_ctx: IProjectContext, data: WorkspaceInfo): Recommendation[] {
    const recs: Recommendation[] = [];
    if (data.large) {
      recs.push({
        id: 'large-monorepo',
        priority: 'medium',
        message: 'Large monorepo detected',
        detail: `${data.packageCount} workspace packages. Setup may take longer than usual.`,
        source: this.id,
      });
    }
    return recs;
  }

  override risks(_ctx: IProjectContext, data: WorkspaceInfo): Risk[] {
    const risks: Risk[] = [];
    if (data.large) {
      risks.push({
        id: 'large-monorepo',
        severity: 'info',
        title: 'Large monorepo',
        detail: `${data.packageCount} packages`,
        source: this.id,
      });
    }
    // Workspace config declares globs but resolves to zero members → broken.
    if (data.patterns.length > 0 && data.members.length === 0) {
      risks.push({
        id: 'invalid-workspace',
        severity: 'critical',
        title: 'Invalid workspace configuration',
        detail: `Patterns ${data.patterns.join(', ')} match no packages.`,
        source: this.id,
      });
    }
    return risks;
  }

  override evidence(ctx: IProjectContext, data: WorkspaceInfo): string[] {
    const evidence: string[] = [];
    if (ctx.existsWithExt('turbo', ['.json', '.jsonc'])) evidence.push('turbo.json');
    if (ctx.exists('nx.json')) evidence.push('nx.json');
    if (ctx.exists('pnpm-workspace.yaml')) evidence.push('pnpm-workspace.yaml');
    if (ctx.exists('lerna.json')) evidence.push('lerna.json');
    if (data.patterns.length > 0) evidence.push(`patterns: ${data.patterns.join(', ')}`);
    if (data.members.length > 0) evidence.push(`${data.members.length} packages`);
    return evidence;
  }

  private resolveTool(ctx: IProjectContext): WorkspaceTool {
    if (ctx.existsWithExt('turbo', ['.json', '.jsonc'])) return 'turborepo';
    if (ctx.exists('nx.json')) return 'nx';
    if (ctx.exists('pnpm-workspace.yaml')) return 'pnpm';
    if (ctx.exists('lerna.json')) return 'lerna';
    if (this.packageWorkspaces(ctx.packageJson()).length > 0) return 'npm/yarn';
    return null;
  }

  private resolvePatterns(ctx: IProjectContext): string[] {
    // pnpm workspaces.
    const pnpmYaml = ctx.readText('pnpm-workspace.yaml');
    if (pnpmYaml) {
      const patterns = this.parseYamlPackages(pnpmYaml);
      if (patterns.length > 0) return patterns;
    }
    // package.json workspaces.
    return this.packageWorkspaces(ctx.packageJson());
  }

  private packageWorkspaces(pkg: PackageJson | null): string[] {
    if (!pkg?.workspaces) return [];
    if (Array.isArray(pkg.workspaces)) return pkg.workspaces;
    return pkg.workspaces.packages ?? [];
  }

  /** Minimal YAML reader for the `packages:` list — avoids a yaml dependency. */
  private parseYamlPackages(yaml: string): string[] {
    const lines = yaml.split(/\r?\n/);
    const patterns: string[] = [];
    let inPackages = false;
    for (const raw of lines) {
      const line = raw.replace(/#.*$/, '');
      if (/^\s*packages\s*:/.test(line)) {
        inPackages = true;
        continue;
      }
      if (inPackages) {
        const match = line.match(/^\s*-\s*['"]?([^'"#]+?)['"]?\s*$/);
        if (match) {
          patterns.push(match[1]!.trim());
        } else if (line.trim() !== '' && !/^\s/.test(line)) {
          inPackages = false; // dedented to a new top-level key
        }
      }
    }
    return patterns;
  }

  private resolveMembers(ctx: IProjectContext, patterns: string[]): WorkspaceMember[] {
    const effectivePatterns =
      patterns.length > 0
        ? patterns
        : ['apps', 'packages'].filter((f) => ctx.exists(f)).map((f) => `${f}/*`);

    const fsCtx = ctx instanceof ProjectContext ? ctx : null;
    const seen = new Set<string>();
    const members: WorkspaceMember[] = [];

    const addMember = (relativePath: string): void => {
      const normalized = relativePath.replace(/\\/g, '/').replace(/\/+$/, '');
      if (seen.has(normalized)) return;
      // A workspace member MUST have its own package.json.
      const pkg = ctx.readJSON<{ name?: string }>(`${normalized}/package.json`);
      if (!pkg) return;
      seen.add(normalized);
      members.push({
        name: pkg.name ?? normalized.split('/').pop() ?? normalized,
        relativePath: normalized,
        kind: this.classifyKind(normalized),
      });
    };

    for (const pattern of effectivePatterns) {
      const wildcardIndex = pattern.indexOf('*');
      if (wildcardIndex === -1) {
        // Direct package path (e.g. `tooling`, `packages/x/y`).
        addMember(pattern);
        continue;
      }
      // Glob container (e.g. `apps/*`): enumerate its immediate subdirectories.
      const container = pattern.slice(0, wildcardIndex).replace(/\/+$/, '');
      if (!container || !ctx.exists(container)) continue;
      const subdirs = fsCtx ? fsCtx.listSubdirectories(container) : ctx.listDir(container);
      for (const dir of subdirs) addMember(`${container}/${dir}`);
    }

    // Stable, predictable ordering for consumers.
    return members.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private classifyKind(relativePath: string): WorkspaceMember['kind'] {
    const root = relativePath.split('/')[0];
    if (root === 'apps' || root === 'app') return 'app';
    if (root === 'packages' || root === 'libs' || root === 'lib') return 'package';
    return 'other';
  }
}
