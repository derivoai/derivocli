import { BaseDetector } from '../base-detector.js';
import type {
  IProjectContext,
  PackageManagerInfo,
  PackageManagerName,
  Recommendation,
  Risk,
} from '../types.js';

const LOCKFILES: Record<string, PackageManagerName> = {
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lockb': 'bun',
  'bun.lock': 'bun',
  'package-lock.json': 'npm',
};

export class PackageManagerDetector extends BaseDetector<PackageManagerInfo> {
  readonly id = 'package-manager';
  readonly title = 'Package Manager';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).name !== null;
  }

  analyze(ctx: IProjectContext): PackageManagerInfo {
    const lockfiles = Object.keys(LOCKFILES).filter((file) => ctx.exists(file));

    // 1. Corepack `packageManager` field — most authoritative.
    const pmField = ctx.packageJson()?.packageManager;
    if (pmField) {
      const name = pmField.split('@')[0]?.trim() as PackageManagerName | undefined;
      if (name && this.isKnown(name)) {
        return {
          name,
          source: 'packageManager-field',
          lockfiles,
          conflicting: lockfiles.length > 1,
        };
      }
    }

    // 2. Lockfiles.
    if (lockfiles.length > 0) {
      const name = LOCKFILES[lockfiles[0]!]!;
      return { name, source: 'lockfile', lockfiles, conflicting: lockfiles.length > 1 };
    }

    // 3. Workspace config implies pnpm.
    if (ctx.exists('pnpm-workspace.yaml')) {
      return { name: 'pnpm', source: 'workspace-config', lockfiles, conflicting: false };
    }

    return { name: null, source: 'none', lockfiles, conflicting: false };
  }

  confidence(ctx: IProjectContext): number {
    const info = this.analyze(ctx);
    if (info.name === null) return 0;
    if (info.conflicting) return 55;
    switch (info.source) {
      case 'packageManager-field':
        return 100;
      case 'lockfile':
        return 95;
      case 'workspace-config':
        return 70;
      default:
        return 0;
    }
  }

  override recommendations(ctx: IProjectContext, data: PackageManagerInfo): Recommendation[] {
    const recs: Recommendation[] = [];
    if (data.conflicting) {
      recs.push({
        id: 'resolve-lockfiles',
        priority: 'high',
        message: `Use a single package manager (detected: ${data.name})`,
        detail: `Conflicting lockfiles found: ${data.lockfiles.join(', ')}`,
        source: this.id,
      });
    }
    if (data.name === null) {
      recs.push({
        id: 'use-pnpm',
        priority: 'medium',
        message: 'Use pnpm for installs',
        detail: 'No lockfile detected. pnpm is recommended for Derivo projects.',
        source: this.id,
      });
    }
    return recs;
  }

  override risks(_ctx: IProjectContext, data: PackageManagerInfo): Risk[] {
    const risks: Risk[] = [];
    if (data.conflicting) {
      risks.push({
        id: 'conflicting-lockfiles',
        severity: 'warning',
        title: 'Conflicting lockfiles',
        detail: data.lockfiles.join(', '),
        source: this.id,
      });
    }
    return risks;
  }

  private isKnown(name: string): name is PackageManagerName {
    return name === 'npm' || name === 'pnpm' || name === 'yarn' || name === 'bun';
  }
}
