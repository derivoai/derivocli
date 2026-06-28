/**
 * Derivo — Validation Engine: FixEngine
 *
 * Orchestrates remediation of fixable validation results. Every fix runs
 * through the rule's own `fix()` method, which MUST confirm with the user
 * before any destructive action. The engine never deletes, overwrites, or
 * mutates anything itself — it only coordinates and collects results.
 */
import type { ProjectAnalysis } from '../analysis/index.js';
import type { FixContext, FixResult, ValidationResult, ValidationRule } from './types.js';

export interface FixEngineOptions {
  root: string;
  analysis: ProjectAnalysis;
  rules: ValidationRule[];
  confirm: (question: string, defaultYes?: boolean) => Promise<boolean>;
  log?: (message: string) => void;
}

export class FixEngine {
  private readonly rulesById: Map<string, ValidationRule>;
  private readonly options: FixEngineOptions;

  constructor(options: FixEngineOptions) {
    this.options = options;
    this.rulesById = new Map(options.rules.map((rule) => [rule.id, rule]));
  }

  /** Attempt to fix each fixable result, in order. */
  async run(fixable: ValidationResult[]): Promise<FixResult[]> {
    const ctx: FixContext = {
      root: this.options.root,
      analysis: this.options.analysis,
      confirm: this.options.confirm,
      log: this.options.log ?? (() => undefined),
    };

    const results: FixResult[] = [];
    for (const result of fixable) {
      const rule = this.rulesById.get(result.ruleId);
      if (!rule || !rule.canFix()) continue;
      try {
        results.push(await rule.fix(ctx));
      } catch (error) {
        results.push({
          ruleId: result.ruleId,
          applied: false,
          skipped: false,
          message: 'Fix threw an error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return results;
  }
}
