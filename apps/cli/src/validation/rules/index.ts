/**
 * Derivo — Validation Engine: Rule Registry
 *
 * Single place rules are registered. Add a rule here to have it run across
 * `validate`, `setup`, `doctor`, and future consumers — no other change needed.
 */
import type { ValidationRule } from '../types.js';
import { MissingEnvRule } from './environment.rules.js';
import { MissingGitRule, MissingGitignoreRule } from './git.rules.js';
import {
  ConflictingLockfilesRule,
  MissingLockfileRule,
  PackageManagerConflictRule,
  UnsupportedPackageManagerRule,
  WorkspaceMismatchRule,
} from './package-manager.rules.js';
import {
  MissingReadmeRule,
  NodeVersionMismatchRule,
  ReadmeManualSetupRule,
} from './project.rules.js';
import {
  MissingBuildScriptRule,
  MissingDevScriptRule,
  MissingLintScriptRule,
  MissingTestScriptRule,
} from './scripts.rules.js';

export * from './environment.rules.js';
export * from './git.rules.js';
export * from './package-manager.rules.js';
export * from './project.rules.js';
export * from './scripts.rules.js';

/** The default, ordered set of validation rules. */
export function createDefaultRules(): ValidationRule[] {
  return [
    // Package manager integrity.
    new ConflictingLockfilesRule(),
    new PackageManagerConflictRule(),
    new MissingLockfileRule(),
    new UnsupportedPackageManagerRule(),
    new WorkspaceMismatchRule(),
    // Version control.
    new MissingGitRule(),
    new MissingGitignoreRule(),
    // Environment.
    new MissingEnvRule(),
    // Scripts.
    new MissingBuildScriptRule(),
    new MissingDevScriptRule(),
    new MissingTestScriptRule(),
    new MissingLintScriptRule(),
    // Project hygiene.
    new MissingReadmeRule(),
    new ReadmeManualSetupRule(),
    new NodeVersionMismatchRule(),
  ];
}
