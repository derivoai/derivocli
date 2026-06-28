import fs from 'fs';
import path from 'path';
import type { PackageManagerName, ProjectAnalysis } from '../../analysis/index.js';
import { BaseValidationRule } from '../base-rule.js';
import type { FixContext, FixResult, ValidationResult, ValidationSeverity } from '../types.js';

const LOCKFILE_PM: Record<string, PackageManagerName> = {
  'package-lock.json': 'npm',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lockb': 'bun',
  'bun.lock': 'bun',
};

const SUPPORTED_MANAGERS: PackageManagerName[] = ['npm', 'pnpm', 'yarn', 'bun'];

/** Resolve the intended package manager and a human-readable reason. */
export function resolveIntendedManager(analysis: ProjectAnalysis): {
  manager: PackageManagerName | null;
  reason: string;
} {
  const pm = analysis.packageManager;
  if (pm.source === 'packageManager-field' && pm.name) {
    return { manager: pm.name, reason: 'declared in the "packageManager" field' };
  }
  if (analysis.workspace.tool === 'pnpm' || analysis.workspace.tool === 'turborepo') {
    return { manager: 'pnpm', reason: 'workspace configuration uses pnpm' };
  }
  if (pm.name) {
    return { manager: pm.name, reason: 'matches the primary lockfile' };
  }
  return { manager: null, reason: 'no signal available' };
}

/** Lockfile names that do NOT belong to the intended manager. */
function strayLockfiles(analysis: ProjectAnalysis, intended: PackageManagerName | null): string[] {
  return analysis.packageManager.lockfiles.filter((file) => {
    const pm = LOCKFILE_PM[file];
    return pm !== undefined && pm !== intended;
  });
}

// ── Conflicting lockfiles (multiple lockfiles present) ──────────────────────

export class ConflictingLockfilesRule extends BaseValidationRule {
  readonly id = 'conflicting-lockfiles';
  description(): string {
    return 'Single package manager';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }
  canFix(): boolean {
    return true;
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    const lockfiles = analysis.packageManager.lockfiles;
    if (lockfiles.length <= 1) {
      return this.pass('Only one lockfile present');
    }

    const { manager, reason } = resolveIntendedManager(analysis);
    const stray = strayLockfiles(analysis, manager);

    return this.issue({
      message: 'Conflicting package managers detected',
      detail: `Recommended: ${manager ?? 'pnpm'} (${reason}). Found: ${lockfiles.join(', ')}`,
      fixPrompt: stray.length === 1 ? `Delete ${stray[0]}?` : `Delete ${stray.join(', ')}?`,
      meta: { stray, recommended: manager },
    });
  }

  async fix(ctx: FixContext): Promise<FixResult> {
    const { manager } = resolveIntendedManager(ctx.analysis);
    const stray = strayLockfiles(ctx.analysis, manager);
    if (stray.length === 0) return this.skipped('Nothing to remove');

    const deleted: string[] = [];
    try {
      for (const file of stray) {
        const ok = await ctx.confirm(`  Delete ${file}? (recommended: keep ${manager})`, true);
        if (!ok) {
          ctx.log(`Skipped ${file}`);
          continue;
        }
        const target = path.join(ctx.root, file);
        if (fs.existsSync(target)) {
          fs.rmSync(target, { force: true });
          deleted.push(file);
          ctx.log(`Deleted ${file}`);
        }
      }
    } catch (error) {
      return this.failedFix(error);
    }

    if (deleted.length === 0) return this.skipped('No lockfiles deleted');
    return this.applied(`Removed ${deleted.join(', ')}`);
  }
}

// ── Package manager field vs lockfile mismatch ──────────────────────────────

export class PackageManagerConflictRule extends BaseValidationRule {
  readonly id = 'package-manager-conflict';
  description(): string {
    return 'Package manager consistency';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }
  canFix(): boolean {
    return true;
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    const pm = analysis.packageManager;
    // Only relevant when exactly one lockfile and a declared/intended manager.
    if (pm.lockfiles.length !== 1) return this.pass('No single-lockfile mismatch');

    const { manager, reason } = resolveIntendedManager(analysis);
    if (!manager) return this.pass('No intended manager declared');

    const lockManager = LOCKFILE_PM[pm.lockfiles[0]!];
    if (lockManager === manager) return this.pass('Lockfile matches intended manager');

    return this.issue({
      message: `Lockfile does not match intended package manager (${manager})`,
      detail: `Intended ${manager} (${reason}) but found ${pm.lockfiles[0]}`,
      fixPrompt: `Delete ${pm.lockfiles[0]}?`,
      meta: { stray: [pm.lockfiles[0]], recommended: manager },
    });
  }

  async fix(ctx: FixContext): Promise<FixResult> {
    const stray = (ctx.analysis.packageManager.lockfiles ?? []).filter((file) => {
      const { manager } = resolveIntendedManager(ctx.analysis);
      return LOCKFILE_PM[file] !== manager;
    });
    if (stray.length === 0) return this.skipped('Nothing to remove');

    try {
      const file = stray[0]!;
      const ok = await ctx.confirm(`  Delete ${file}?`, true);
      if (!ok) return this.skipped(`Kept ${file}`);
      const target = path.join(ctx.root, file);
      if (fs.existsSync(target)) {
        fs.rmSync(target, { force: true });
        ctx.log(`Deleted ${file}`);
        return this.applied(`Removed ${file}`);
      }
      return this.skipped('File already absent');
    } catch (error) {
      return this.failedFix(error);
    }
  }
}

// ── Missing lockfile ────────────────────────────────────────────────────────

export class MissingLockfileRule extends BaseValidationRule {
  readonly id = 'missing-lockfile';
  description(): string {
    return 'Lockfile present';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    if (analysis.packageManager.lockfiles.length > 0) {
      return this.pass('Lockfile found');
    }
    if (!analysis.name && analysis.framework.name === null) {
      return this.pass('No package.json — lockfile not applicable');
    }
    return this.issue({
      message: 'No lockfile found',
      detail: 'Installs may produce non-deterministic dependency trees.',
    });
  }
}

// ── Unsupported package manager ─────────────────────────────────────────────

export class UnsupportedPackageManagerRule extends BaseValidationRule {
  readonly id = 'unsupported-package-manager';
  description(): string {
    return 'Supported package manager';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    const name = analysis.packageManager.name;
    if (!name) return this.pass('No package manager to validate');
    if (SUPPORTED_MANAGERS.includes(name)) return this.pass(`${name} is supported`);
    return this.issue({
      message: `Unsupported package manager: ${name}`,
      detail: `Supported: ${SUPPORTED_MANAGERS.join(', ')}`,
    });
  }
}

// ── Workspace / package-manager mismatch ────────────────────────────────────

export class WorkspaceMismatchRule extends BaseValidationRule {
  readonly id = 'workspace-mismatch';
  description(): string {
    return 'Workspace / package manager alignment';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    const { tool } = analysis.workspace;
    const pm = analysis.packageManager.name;

    if (!analysis.workspace.isMonorepo) return this.pass('Not a monorepo');

    // pnpm/turborepo workspaces expect pnpm.
    if ((tool === 'pnpm' || tool === 'turborepo') && pm && pm !== 'pnpm') {
      return this.issue({
        message: `Workspace uses ${tool} but package manager is ${pm}`,
        detail: 'pnpm is recommended for this workspace layout.',
      });
    }
    return this.pass('Workspace and package manager aligned');
  }
}
