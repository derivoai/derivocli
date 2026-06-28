import { BaseDetector } from '../base-detector.js';
import type { IProjectContext, LanguageInfo } from '../types.js';

export class LanguageDetector extends BaseDetector<LanguageInfo> {
  readonly id = 'language';
  readonly title = 'Language';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).primary !== 'Unknown';
  }

  analyze(ctx: IProjectContext): LanguageInfo {
    const isTs = ctx.exists('tsconfig.json') || ctx.hasDependency('typescript');
    const pkg = ctx.packageJson();

    let primary: LanguageInfo['primary'] = 'Unknown';
    if (isTs) primary = 'TypeScript';
    else if (pkg) primary = 'JavaScript';

    let moduleSystem: LanguageInfo['moduleSystem'] = 'unknown';
    if (pkg?.type === 'module') moduleSystem = 'esm';
    else if (pkg?.type === 'commonjs') moduleSystem = 'commonjs';
    else if (pkg) moduleSystem = 'commonjs'; // Node default when unspecified

    return { primary, moduleSystem };
  }

  confidence(ctx: IProjectContext): number {
    return this.analyze(ctx).primary === 'Unknown' ? 30 : 95;
  }
}
