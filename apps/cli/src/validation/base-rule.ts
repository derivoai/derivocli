/**
 * Derivo — Project Validation Engine: BaseValidationRule
 *
 * Abstract base implementing the `ValidationRule` contract. Concrete rules
 * implement `validate()` (pure) and override `canFix()`/`fix()` only when they
 * support remediation. Helper builders keep result construction consistent.
 */
import type { ProjectAnalysis } from '../analysis/index.js';
import type {
  FixContext,
  FixResult,
  ValidationResult,
  ValidationRule,
  ValidationSeverity,
} from './types.js';

interface IssueOptions {
  message: string;
  detail?: string;
  fixPrompt?: string;
  meta?: Record<string, unknown>;
}

export abstract class BaseValidationRule implements ValidationRule {
  abstract readonly id: string;
  abstract description(): string;
  abstract severity(): ValidationSeverity;
  abstract validate(analysis: ProjectAnalysis): ValidationResult;

  canFix(): boolean {
    return false;
  }

  async fix(_ctx: FixContext): Promise<FixResult> {
    return {
      ruleId: this.id,
      applied: false,
      skipped: true,
      message: 'No automatic fix available',
    };
  }

  /** Build a passing result. */
  protected pass(message: string): ValidationResult {
    return {
      ruleId: this.id,
      status: 'pass',
      severity: this.severity(),
      title: this.description(),
      message,
      fixable: false,
    };
  }

  /** Build a failing/warning result; status is derived from severity. */
  protected issue(options: IssueOptions): ValidationResult {
    const severity = this.severity();
    return {
      ruleId: this.id,
      status: severity === 'error' ? 'fail' : 'warn',
      severity,
      title: this.description(),
      message: options.message,
      detail: options.detail,
      fixable: this.canFix() && !!options.fixPrompt,
      fixPrompt: options.fixPrompt,
      meta: options.meta,
    };
  }

  protected skipped(message: string): FixResult {
    return { ruleId: this.id, applied: false, skipped: true, message };
  }

  protected applied(message: string): FixResult {
    return { ruleId: this.id, applied: true, skipped: false, message };
  }

  protected failedFix(error: unknown): FixResult {
    return {
      ruleId: this.id,
      applied: false,
      skipped: false,
      message: 'Fix failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
