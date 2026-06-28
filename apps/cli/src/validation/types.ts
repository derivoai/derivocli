/**
 * Derivo — Project Validation Engine: Core Types
 *
 * The validation engine sits ON TOP of the analysis engine. Rules consume the
 * canonical `ProjectAnalysis` (the single source of truth) and never re-run
 * detection or touch the filesystem during `validate()`. Only `fix()` performs
 * IO — and always behind explicit user confirmation.
 *
 * This contract is shared by `validate`, `setup`, `doctor`, plugins, and the
 * future AI assistant so validation logic is never duplicated.
 */
import type { ProjectAnalysis } from '../analysis/index.js';

export type ValidationSeverity = 'info' | 'warning' | 'error';
export type ValidationStatus = 'pass' | 'warn' | 'fail';

/** The outcome of running a single rule against an analysis. */
export interface ValidationResult {
  ruleId: string;
  status: ValidationStatus;
  severity: ValidationSeverity;
  title: string;
  message: string;
  detail?: string;
  /** True when this specific result can be auto-fixed. */
  fixable: boolean;
  /** Human-readable description of the fix, e.g. "Delete package-lock.json?". */
  fixPrompt?: string;
  /** Extra structured payload for advanced consumers (e.g. files to delete). */
  meta?: Record<string, unknown>;
}

/** Result of attempting a fix. */
export interface FixResult {
  ruleId: string;
  applied: boolean;
  /** True when the user declined the confirmation. */
  skipped: boolean;
  message: string;
  error?: string;
}

/** Everything a fix needs to act safely. Injected by the consumer. */
export interface FixContext {
  root: string;
  analysis: ProjectAnalysis;
  /** Confirmation gate. MUST be awaited before any destructive action. */
  confirm: (question: string, defaultYes?: boolean) => Promise<boolean>;
  /** Structured logger callback for fix progress. */
  log: (message: string) => void;
}

/**
 * The five-method contract every validation rule exposes.
 */
export interface ValidationRule {
  readonly id: string;
  description(): string;
  severity(): ValidationSeverity;
  /** Pure: inspect the analysis, return a result. No side effects. */
  validate(analysis: ProjectAnalysis): ValidationResult;
  /** Whether this rule supports auto-fixing in principle. */
  canFix(): boolean;
  /** Perform the fix. MUST confirm before destructive operations. */
  fix(ctx: FixContext): Promise<FixResult>;
}

/** Aggregate report produced by the validator. */
export interface ValidationReport {
  root: string;
  results: ValidationResult[];
  /** 0–100 health score. */
  score: number;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    errors: number;
  };
  /** Results that can be auto-fixed, in display order. */
  fixable: ValidationResult[];
}
