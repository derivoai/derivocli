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
    if (data.large) {
      return [
        {
          id: 'large-monorepo',
          severity: 'info',
          title: 'Large monorepo',
          detail: `${data.packageCount} packages`,
          source: this.id,
        },
      ];
    }
    return [];
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
    // Resolve glob roots like `apps/*` and `packages/*` into their member dirs.
    const roots = new Set<string>();
    for (const pattern of patterns) {
      const root = pattern.split('/')[0];
      if (root && !root.includes('*')) roots.add(root);
    }
    if (roots.size === 0) {
      for (const folder of ['apps', 'packages']) {
        if (ctx.exists(folder)) roots.add(folder);
      }
    }

    const fsCtx = ctx instanceof ProjectContext ? ctx : null;
    const members: WorkspaceMember[] = [];

    for (const root of roots) {
      if (!ctx.exists(root)) continue;
      const subdirs = fsCtx ? fsCtx.listSubdirectories(root) : ctx.listDir(root);
      for (const dir of subdirs) {
        const relativePath = `${root}/${dir}`;
        const pkg = ctx.readJSON<{ name?: string }>(`${relativePath}/package.json`);
        members.push({
          name: pkg?.name ?? dir,
          relativePath,
          kind: this.classifyKind(root),
        });
      }
    }

    // Stable, predictable ordering for consumers.
    return members.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private classifyKind(root: string): WorkspaceMember['kind'] {
    if (root === 'apps' || root === 'app') return 'app';
    if (root === 'packages' || root === 'libs' || root === 'lib') return 'package';
    return 'other';
  }
}
