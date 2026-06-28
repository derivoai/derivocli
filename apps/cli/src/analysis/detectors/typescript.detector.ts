import { BaseDetector } from '../base-detector.js';
import type { IProjectContext, TypeScriptInfo } from '../types.js';

interface TsConfig {
  compilerOptions?: { strict?: boolean };
  extends?: string;
}

export class TypeScriptDetector extends BaseDetector<TypeScriptInfo> {
  readonly id = 'typescript';
  readonly title = 'TypeScript';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).used;
  }

  analyze(ctx: IProjectContext): TypeScriptInfo {
    const hasConfig = ctx.exists('tsconfig.json');
    const version = ctx.dependencyVersion('typescript');
    const used = hasConfig || version !== null;

    let strict: boolean | null = null;
    if (hasConfig) {
      const cfg = ctx.readJSON<TsConfig>('tsconfig.json');
      if (cfg && typeof cfg.compilerOptions?.strict === 'boolean') {
        strict = cfg.compilerOptions.strict;
      }
    }

    return { used, hasConfig, strict, version };
  }

  confidence(ctx: IProjectContext): number {
    const info = this.analyze(ctx);
    if (!info.used) return 100; // confidently not TypeScript
    if (info.hasConfig && info.version) return 100;
    return info.hasConfig || info.version ? 90 : 0;
  }

  override evidence(_ctx: IProjectContext, data: TypeScriptInfo): string[] {
    if (!data.used) return [];
    const evidence: string[] = [];
    if (data.hasConfig) evidence.push('tsconfig.json');
    if (data.version) evidence.push('typescript dependency');
    if (data.strict) evidence.push('strict mode enabled');
    return evidence;
  }
}
