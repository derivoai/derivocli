import { BaseDetector } from '../base-detector.js';
import type { BuildInfo, IProjectContext, Recommendation, Risk } from '../types.js';

interface BuildToolRule {
  name: string;
  /** True when this tool is in use. */
  test(ctx: IProjectContext, scripts: Record<string, string>): boolean;
}

const BUILD_TOOL_RULES: BuildToolRule[] = [
  { name: 'Turborepo', test: (ctx) => !!ctx.existsWithExt('turbo', ['.json', '.jsonc']) },
  { name: 'Nx', test: (ctx) => ctx.exists('nx.json') },
  { name: 'Next.js', test: (_c, s) => /next build/.test(s.build ?? '') },
  { name: 'Vite', test: (ctx) => !!ctx.existsWithExt('vite.config') || hasDep(ctx, 'vite') },
  {
    name: 'Webpack',
    test: (ctx) => !!ctx.existsWithExt('webpack.config') || hasDep(ctx, 'webpack'),
  },
  { name: 'Rollup', test: (ctx) => !!ctx.existsWithExt('rollup.config') || hasDep(ctx, 'rollup') },
  { name: 'esbuild', test: (ctx) => hasDep(ctx, 'esbuild') },
  { name: 'Parcel', test: (ctx) => hasDep(ctx, 'parcel') },
  { name: 'tsc', test: (_c, s) => /(^|\s)tsc(\s|$|\b)/.test(s.build ?? '') },
];

function hasDep(ctx: IProjectContext, name: string): boolean {
  return ctx.hasDependency(name);
}

export class BuildDetector extends BaseDetector<BuildInfo> {
  readonly id = 'build';
  readonly title = 'Build';

  detect(ctx: IProjectContext): boolean {
    const info = this.analyze(ctx);
    return info.buildTool !== null || info.hasBuildScript;
  }

  analyze(ctx: IProjectContext): BuildInfo {
    const scripts = ctx.scripts();
    const buildTool = BUILD_TOOL_RULES.find((rule) => rule.test(ctx, scripts))?.name ?? null;

    return {
      buildTool,
      hasBuildScript: typeof scripts.build === 'string',
      hasDevScript: typeof scripts.dev === 'string',
      buildScript: scripts.build ?? null,
      devScript: scripts.dev ?? null,
      startScript: scripts.start ?? null,
    };
  }

  confidence(ctx: IProjectContext): number {
    const info = this.analyze(ctx);
    if (info.buildTool && info.hasBuildScript) return 98;
    if (info.buildTool || info.hasBuildScript) return 85;
    return 50;
  }

  override recommendations(_ctx: IProjectContext, data: BuildInfo): Recommendation[] {
    const recs: Recommendation[] = [];
    if (!data.buildTool && !data.hasBuildScript) {
      recs.push({
        id: 'unknown-build-system',
        priority: 'medium',
        message: 'Unknown build system',
        detail: 'No build tool or build script detected.',
        source: this.id,
      });
    }
    return recs;
  }

  override risks(_ctx: IProjectContext, data: BuildInfo): Risk[] {
    const risks: Risk[] = [];
    if (!data.hasBuildScript) {
      risks.push({
        id: 'missing-build-script',
        severity: 'warning',
        title: 'Missing build script',
        detail: 'No "build" script in package.json.',
        source: this.id,
      });
    }
    if (!data.hasDevScript) {
      risks.push({
        id: 'missing-dev-script',
        severity: 'info',
        title: 'Missing dev script',
        detail: 'No "dev" script in package.json.',
        source: this.id,
      });
    }
    return risks;
  }
}
