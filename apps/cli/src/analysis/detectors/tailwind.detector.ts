import { BaseDetector } from '../base-detector.js';
import type { IProjectContext, TailwindInfo } from '../types.js';

export class TailwindDetector extends BaseDetector<TailwindInfo> {
  readonly id = 'tailwind';
  readonly title = 'Tailwind';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).used;
  }

  analyze(ctx: IProjectContext): TailwindInfo {
    const hasConfig = !!ctx.existsWithExt('tailwind.config');
    const version = ctx.dependencyVersion('tailwindcss');
    return { used: hasConfig || version !== null, hasConfig, version };
  }

  confidence(ctx: IProjectContext): number {
    const info = this.analyze(ctx);
    if (!info.used) return 100;
    if (info.hasConfig && info.version) return 100;
    return 88;
  }
}
