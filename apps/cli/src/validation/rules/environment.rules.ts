import fs from 'fs';
import path from 'path';
import type { ProjectAnalysis } from '../../analysis/index.js';
import { BaseValidationRule } from '../base-rule.js';
import type { FixContext, FixResult, ValidationResult, ValidationSeverity } from '../types.js';

export class MissingEnvRule extends BaseValidationRule {
  readonly id = 'missing-env';
  description(): string {
    return 'Environment file present';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }
  canFix(): boolean {
    return true;
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    const env = analysis.environment;
    if (!env.hasExample) return this.pass('No env template — nothing to create');
    if (env.hasEnv) return this.pass('.env present');

    const template = env.files[0] ?? '.env.example';
    return this.issue({
      message: 'Missing .env',
      detail: `${env.declaredVariables.length} variables declared in ${template}.`,
      fixPrompt: `Create .env from ${template}?`,
      meta: { template },
    });
  }

  async fix(ctx: FixContext): Promise<FixResult> {
    const envPath = path.join(ctx.root, '.env');
    // SAFETY: never overwrite an existing .env.
    if (fs.existsSync(envPath)) return this.skipped('.env already exists — not overwriting');

    const template = (ctx.analysis.environment.files[0] as string) ?? '.env.example';
    const templatePath = path.join(ctx.root, template);
    if (!fs.existsSync(templatePath)) return this.skipped(`${template} not found`);

    const ok = await ctx.confirm(`  Create .env from ${template}?`, true);
    if (!ok) return this.skipped('.env not created');

    try {
      fs.copyFileSync(templatePath, envPath, fs.constants.COPYFILE_EXCL);
      ctx.log(`Created .env from ${template}`);
      return this.applied('.env created');
    } catch (error) {
      return this.failedFix(error);
    }
  }
}
