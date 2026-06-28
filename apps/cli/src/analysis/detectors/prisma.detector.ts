import { BaseDetector } from '../base-detector.js';
import { ProjectContext } from '../context.js';
import type { IProjectContext, PrismaInfo, Recommendation } from '../types.js';

export class PrismaDetector extends BaseDetector<PrismaInfo> {
  readonly id = 'prisma';
  readonly title = 'Prisma';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).used;
  }

  analyze(ctx: IProjectContext): PrismaInfo {
    const hasSchema = ctx.exists('prisma/schema.prisma') || ctx.exists('schema.prisma');
    const hasDep = ctx.hasDependency('prisma') || ctx.hasDependency('@prisma/client');

    let hasMigrations = false;
    if (ctx.exists('prisma/migrations')) {
      const entries =
        ctx instanceof ProjectContext
          ? ctx.listSubdirectories('prisma/migrations')
          : ctx.listDir('prisma/migrations');
      hasMigrations = entries.length > 0;
    }

    return { used: hasSchema || hasDep, hasSchema, hasMigrations };
  }

  confidence(ctx: IProjectContext): number {
    const info = this.analyze(ctx);
    if (!info.used) return 100;
    return info.hasSchema ? 98 : 85;
  }

  override recommendations(_ctx: IProjectContext, data: PrismaInfo): Recommendation[] {
    if (data.used) {
      return [
        {
          id: 'prisma-migration',
          priority: 'high',
          message: 'Prisma migration recommended',
          detail: data.hasMigrations
            ? 'Run "prisma migrate deploy" / "prisma generate" before development.'
            : 'Run "prisma generate" (and migrate) before development.',
          source: this.id,
        },
      ];
    }
    return [];
  }
}
