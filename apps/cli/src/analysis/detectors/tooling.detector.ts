import { BaseDetector } from '../base-detector.js';
import type { IProjectContext, ToolingInfo } from '../types.js';

const ESLINT_CONFIGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
];

const PRETTIER_CONFIGS = [
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
];

export class ToolingDetector extends BaseDetector<ToolingInfo> {
  readonly id = 'tooling';
  readonly title = 'Lint & Format';

  detect(ctx: IProjectContext): boolean {
    const info = this.analyze(ctx);
    return info.lint.used || info.format.used;
  }

  analyze(ctx: IProjectContext): ToolingInfo {
    const scripts = ctx.scripts();

    const eslintConfig = ctx.firstExisting(ESLINT_CONFIGS);
    const lintUsed = eslintConfig !== null || ctx.hasDependency('eslint');

    const prettierConfig = ctx.firstExisting(PRETTIER_CONFIGS);
    const formatUsed = prettierConfig !== null || ctx.hasDependency('prettier');

    return {
      lint: {
        used: lintUsed,
        tool: lintUsed ? 'ESLint' : null,
        hasScript: typeof scripts.lint === 'string',
      },
      format: {
        used: formatUsed,
        tool: formatUsed ? 'Prettier' : null,
        hasScript: typeof scripts.format === 'string',
      },
    };
  }

  confidence(ctx: IProjectContext): number {
    return this.detect(ctx) ? 92 : 90;
  }

  override evidence(ctx: IProjectContext, data: ToolingInfo): string[] {
    const evidence: string[] = [];
    if (data.lint.used) {
      evidence.push(ctx.firstExisting(ESLINT_CONFIGS) ?? 'eslint dependency');
    }
    if (data.format.used) {
      evidence.push(ctx.firstExisting(PRETTIER_CONFIGS) ?? 'prettier dependency');
    }
    return evidence;
  }
}
