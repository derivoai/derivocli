/**
 * Built-in example plugin: React
 *
 * Demonstrates the SDK: detection via the shared analysis, validation of the
 * dependency set, inspect reporting, setup participation, and a hook.
 */
import type { DerivoPlugin, PluginManifest } from '../plugin-types/index.js';

export const manifest: PluginManifest = {
  id: 'react',
  name: 'React Plugin',
  version: '1.0.0',
  description: 'Detects and validates React applications.',
  author: 'Derivo',
  apiVersion: '1',
  permissions: ['filesystem'],
};

function hasReact(deps: Record<string, string>): boolean {
  return 'react' in deps;
}

function readDeps(ctx: Parameters<NonNullable<DerivoPlugin['detect']>>[0]): Record<string, string> {
  const pkg = ctx.fs.readJSON<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>('package.json');
  return { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
}

export const plugin: DerivoPlugin = {
  id: 'react',

  detect(ctx) {
    const deps = readDeps(ctx);
    const applies = hasReact(deps) || ctx.analysis.framework.name === 'React';
    return {
      applies,
      findings: applies
        ? [{ level: 'success', message: `React detected (${deps.react ?? 'workspace'})` }]
        : [],
      data: { version: deps.react ?? null },
    };
  },

  validate(ctx) {
    const deps = readDeps(ctx);
    if (!hasReact(deps)) return { applies: false };
    const findings = [];
    if (!('react-dom' in deps)) {
      findings.push({
        level: 'warning' as const,
        message: 'react is present but react-dom is missing',
      });
    }
    return {
      applies: true,
      findings,
      recommendations: findings.length ? ['Install react-dom to render React in the browser'] : [],
    };
  },

  inspect(ctx) {
    const deps = readDeps(ctx);
    if (!hasReact(deps)) return { applies: false };
    const bundler = 'vite' in deps ? 'Vite' : 'webpack' in deps ? 'Webpack' : 'unknown';
    ctx.logger.debug(`bundler resolved to ${bundler}`);
    return {
      applies: true,
      findings: [{ level: 'info', message: `React + ${bundler}` }],
      data: { react: deps.react, bundler },
    };
  },

  setup(ctx) {
    const deps = readDeps(ctx);
    if (!hasReact(deps)) return { applies: false };
    return {
      applies: true,
      recommendations: ctx.analysis.typescript.used
        ? []
        : ['Consider adding TypeScript for safer React development'],
    };
  },

  hooks: {
    afterInspect(ctx) {
      ctx.logger.debug('react plugin observed inspect completion');
    },
  },
};
