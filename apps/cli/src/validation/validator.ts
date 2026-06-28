/**
 * Derivo — Validation Engine: ProjectValidator
 *
 * Runs validation rules against a `ProjectAnalysis` and produces a scored
 * report. Pure with respect to the filesystem — it never mutates the project.
 * Remediation is delegated to the `FixEngine`.
 *
 * Reuses the analysis engine as its single source of truth. Detectors are not
 * re-implemented here.
 */
import { analyzeProject } from '../analysis/index.js';
import type { ProjectAnalysis } from '../analysis/index.js';
import { createDefaultRules } from './rules/index.js';
import type { ValidationReport, ValidationResult, ValidationRule } from './types.js';

/** Score penalties per severity for failed checks. */
const PENALTY: Record<ValidationResult['severity'], number> = {
  info: 1,
  warning: 3,
  error: 10,
};

export interface ValidatorOptions {
  rules?: ValidationRule[];
  onRuleError?: (ruleId: string, error: unknown) => void;
}

export class ProjectValidator {
  private readonly rules: ValidationRule[];
  private readonly onRuleError?: (ruleId: string, error: unknown) => void;

  constructor(options: ValidatorOptions = {}) {
    this.rules = options.rules ?? createDefaultRules();
    this.onRuleError = options.onRuleError;
  }

  /** Expose the active rules so the FixEngine can locate a rule by id. */
  getRules(): ValidationRule[] {
    return this.rules;
  }

  validate(analysis: ProjectAnalysis): ValidationReport {
    const results: ValidationResult[] = [];

    for (const rule of this.rules) {
      try {
        results.push(rule.validate(analysis));
      } catch (error) {
        this.onRuleError?.(rule.id, error);
        results.push({
          ruleId: rule.id,
          status: 'warn',
          severity: 'info',
          title: rule.description(),
          message: 'Validation rule failed to run',
          detail: error instanceof Error ? error.message : String(error),
          fixable: false,
        });
      }
    }

    const passed = results.filter((r) => r.status === 'pass').length;
    const warnings = results.filter((r) => r.status === 'warn').length;
    const errors = results.filter((r) => r.status === 'fail').length;
    const fixable = results.filter((r) => r.fixable);

    const penalty = results
      .filter((r) => r.status !== 'pass')
      .reduce((sum, r) => sum + PENALTY[r.severity], 0);
    const score = Math.max(0, 100 - penalty);

    return {
      root: analysis.root,
      results,
      score,
      summary: { total: results.length, passed, warnings, errors },
      fixable,
    };
  }
}

/** Convenience facade: analyze then validate a directory in one call. */
export function validateProject(
  target: string = process.cwd(),
  options?: ValidatorOptions,
): { analysis: ProjectAnalysis; report: ValidationReport } {
  const analysis = analyzeProject(target);
  const report = new ProjectValidator(options).validate(analysis);
  return { analysis, report };
}
