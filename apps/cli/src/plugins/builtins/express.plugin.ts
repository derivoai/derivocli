/**
 * Built-in example plugin: Express
 */
import type { DerivoPlugin, PluginManifest } from '../plugin-types/index.js';

export const manifest: PluginManifest = {
  id: 'express',
  name: 'Express Plugin',
  version: '1.0.0',
  description: 'Detects and validates Express servers.',
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

export const plugin: DerivoPlugin = {
  id: 'express',

  detect(ctx) {
    const deps = readDeps(ctx);
    const applies = 'express' in deps || ctx.analysis.framework.name === 'Express';
    return {
      applies,
      findings: applies
        ? [{ level: 'success', message: `Express detected (${deps.express ?? 'workspace'})` }]
        : [],
      data: { version: deps.express ?? null },
    };
  },

  validate(ctx) {
    const deps = readDeps(ctx);
    if (!('express' in deps)) return { applies: false };
    const findings = [];
    const recommendations: string[] = [];
    if (ctx.analysis.typescript.used && !('@types/express' in deps)) {
      findings.push({
        level: 'warning' as const,
        message: 'TypeScript project without @types/express',
      });
      recommendations.push('Install @types/express for type-safe routing');
    }
    return { applies: true, findings, recommendations };
  },

  inspect(ctx) {
    const deps = readDeps(ctx);
    if (!('express' in deps)) return { applies: false };
    const startScript = ctx.analysis.build.startScript;
    return {
      applies: true,
      findings: [
        {
          level: 'info',
          message: `Express server${startScript ? ` (start: ${startScript})` : ''}`,
        },
      ],
      data: { start: startScript },
    };
  },

  setup(ctx) {
    const deps = readDeps(ctx);
    if (!('express' in deps)) return { applies: false };
    const recommendations: string[] = [];
    if (ctx.analysis.environment.hasExample && !ctx.analysis.environment.hasEnv) {
      recommendations.push('Configure environment variables (PORT, etc.) before starting');
    }
    return { applies: true, recommendations };
  },
};
