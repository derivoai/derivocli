/**
 * Built-in example plugin: Next.js
 */
import type { DerivoPlugin, PluginManifest } from '../plugin-types/index.js';

export const manifest: PluginManifest = {
  id: 'nextjs',
  name: 'Next.js Plugin',
  version: '1.0.0',
  description: 'Detects and validates Next.js applications.',
  author: 'Derivo',
  apiVersion: '1',
  permissions: ['filesystem'],
};

function readDeps(ctx: Parameters<NonNullable<DerivoPlugin['detect']>>[0]): Record<string, string> {
  const pkg = ctx.fs.readJSON<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>('package.json');
  return { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
}

function hasNext(ctx: Parameters<NonNullable<DerivoPlugin['detect']>>[0]): boolean {
  return 'next' in readDeps(ctx) || ctx.analysis.framework.name === 'Next.js';
}

export const plugin: DerivoPlugin = {
  id: 'nextjs',

  detect(ctx) {
    const applies = hasNext(ctx);
    return {
      applies,
      findings: applies ? [{ level: 'success', message: 'Next.js detected' }] : [],
      data: { version: readDeps(ctx).next ?? null },
    };
  },

  validate(ctx) {
    if (!hasNext(ctx)) return { applies: false };
    const hasConfig =
      ctx.fs.exists('next.config.js') ||
      ctx.fs.exists('next.config.mjs') ||
      ctx.fs.exists('next.config.ts');
    return {
      applies: true,
      findings: hasConfig
        ? [{ level: 'success', message: 'next.config found' }]
        : [{ level: 'info', message: 'No next.config — using defaults' }],
    };
  },

  inspect(ctx) {
    if (!hasNext(ctx)) return { applies: false };
    const appRouter = ctx.fs.exists('app');
    const pagesRouter = ctx.fs.exists('pages');
    const router = appRouter ? 'App Router' : pagesRouter ? 'Pages Router' : 'unknown';
    return {
      applies: true,
      findings: [{ level: 'info', message: `Next.js (${router})` }],
      data: { router },
    };
  },

  setup(ctx) {
    if (!hasNext(ctx)) return { applies: false };
    const recommendations: string[] = [];
    if (ctx.analysis.environment.hasExample && !ctx.analysis.environment.hasEnv) {
      recommendations.push('Create .env.local from the template before running next dev');
    }
    return { applies: true, recommendations };
  },
};
