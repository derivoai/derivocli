import type { ProjectAnalysis, ReadmeCommandCategory } from '../../analysis/index.js';
import { BaseValidationRule } from '../base-rule.js';
import type { ValidationResult, ValidationSeverity } from '../types.js';

export class MissingReadmeRule extends BaseValidationRule {
  readonly id = 'missing-readme';
  description(): string {
    return 'README present';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    if (analysis.readme.present) return this.pass('README found');
    return this.issue({
      message: 'No README',
      detail: 'Setup instructions could not be discovered.',
    });
  }
}

/**
 * Flags README setup steps that Derivo cannot perform automatically
 * (Docker, database, migrations, seeding). These are displayed, NEVER executed.
 */
export class ReadmeManualSetupRule extends BaseValidationRule {
  readonly id = 'readme-manual-setup';
  description(): string {
    return 'README manual setup';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }

  private static readonly MANUAL_CATEGORIES: ReadmeCommandCategory[] = [
    'docker',
    'database',
    'migration',
    'seed',
  ];

  validate(analysis: ProjectAnalysis): ValidationResult {
    if (!analysis.readme.present) return this.pass('No README to inspect');

    const manual: string[] = [];
    for (const category of ReadmeManualSetupRule.MANUAL_CATEGORIES) {
      manual.push(...analysis.readme.byCategory[category]);
    }
    const unique = [...new Set(manual)];

    if (unique.length === 0) return this.pass('No manual setup steps detected');

    return this.issue({
      message: 'README contains manual setup',
      detail: unique.map((c) => `• ${c}`).join('\n'),
      meta: { commands: unique },
    });
  }
}

export class NodeVersionMismatchRule extends BaseValidationRule {
  readonly id = 'node-version-mismatch';
  description(): string {
    return 'Node version compatibility';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    const required = analysis.nodeVersion.required;
    if (!required) return this.pass('No Node version constraint');

    const currentMajor = parseInt(process.versions.node.split('.')[0]!, 10);
    const requiredMajor = this.minMajor(required);

    if (requiredMajor === null) return this.pass(`Node ${required} (unparsed, skipped)`);

    if (currentMajor < requiredMajor) {
      return this.issue({
        message: `Node ${process.versions.node} is below the required ${required}`,
        detail: `Upgrade Node.js to satisfy "${required}".`,
      });
    }
    return this.pass(`Node ${process.versions.node} satisfies ${required}`);
  }

  /** Extract the minimum required major version from a range expression. */
  private minMajor(range: string): number | null {
    const match = range.match(/(\d+)/);
    if (!match) return null;
    return parseInt(match[1]!, 10);
  }
}
