import type { ProjectAnalysis } from '../../analysis/index.js';
import { BaseValidationRule } from '../base-rule.js';
import type { ValidationResult, ValidationSeverity } from '../types.js';

export class MissingBuildScriptRule extends BaseValidationRule {
  readonly id = 'missing-build-script';
  description(): string {
    return 'Build script';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    if (analysis.build.hasBuildScript) return this.pass('"build" script present');
    return this.issue({
      message: 'No "build" script',
      detail: 'Add a build script to package.json for production builds.',
    });
  }
}

export class MissingDevScriptRule extends BaseValidationRule {
  readonly id = 'missing-dev-script';
  description(): string {
    return 'Dev script';
  }
  severity(): ValidationSeverity {
    return 'info';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    if (analysis.build.hasDevScript) return this.pass('"dev" script present');
    return this.issue({
      message: 'No "dev" script',
      detail: 'Add a dev script to run the project locally.',
    });
  }
}

export class MissingTestScriptRule extends BaseValidationRule {
  readonly id = 'missing-test-script';
  description(): string {
    return 'Test script';
  }
  severity(): ValidationSeverity {
    return 'info';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    if (analysis.testing.hasScript) return this.pass('"test" script present');
    return this.issue({
      message: 'No "test" script',
      detail: 'Automated tests are recommended.',
    });
  }
}

export class MissingLintScriptRule extends BaseValidationRule {
  readonly id = 'missing-lint-script';
  description(): string {
    return 'Lint script';
  }
  severity(): ValidationSeverity {
    return 'info';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    if (analysis.tooling.lint.hasScript) return this.pass('"lint" script present');
    return this.issue({
      message: 'No "lint" script',
      detail: 'A lint script helps keep code consistent.',
    });
  }
}
