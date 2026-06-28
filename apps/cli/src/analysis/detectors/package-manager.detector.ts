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
    switch (info.source) {
      case 'packageManager-field':
        // The declared field is authoritative even if stray lockfiles exist.
        return 100;
      case 'workspace-config':
        return 95;
      case 'lockfile':
        // A single, unambiguous lockfile is a strong signal.
        return info.conflicting ? 70 : 95;
      default:
        return 0;
    }
  }

  override evidence(ctx: IProjectContext, data: PackageManagerInfo): string[] {
    const evidence: string[] = [];
    if (data.source === 'packageManager-field') evidence.push('packageManager field');
    for (const lock of data.lockfiles) evidence.push(lock);
    if (ctx.exists('pnpm-workspace.yaml')) evidence.push('pnpm-workspace.yaml');
    return evidence;
  }

  override reasoning(_ctx: IProjectContext, data: PackageManagerInfo): string | undefined {
    if (!data.name) return 'No package manager signal found';
    const reasonBySource: Record<PackageManagerInfo['source'], string> = {
      'packageManager-field': 'declared in the packageManager field',
      lockfile: 'inferred from the lockfile',
      'workspace-config': 'implied by the workspace configuration',
      none: 'no signal',
    };
    return `${data.name} — ${reasonBySource[data.source]}`;
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
      // Low severity: the intended manager is still known; this is hygiene.
      risks.push({
        id: 'conflicting-lockfiles',
        severity: 'info',
        title: 'Conflicting lockfiles',
        detail: data.lockfiles.join(', '),
        source: this.id,
      });
    }
    if (data.name === null && _ctx.exists('package.json')) {
      risks.push({
        id: 'missing-package-manager',
        severity: 'warning',
        title: 'Package manager could not be determined',
        detail: 'No lockfile, packageManager field, or workspace config found.',
        source: this.id,
      });
    }
    return risks;
  }

  private isKnown(name: string): name is PackageManagerName {
    return name === 'npm' || name === 'pnpm' || name === 'yarn' || name === 'bun';
  }
}
