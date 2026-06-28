import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { ProjectAnalysis } from '../../analysis/index.js';
import { BaseValidationRule } from '../base-rule.js';
import type { FixContext, FixResult, ValidationResult, ValidationSeverity } from '../types.js';

const DEFAULT_GITIGNORE = `# Dependencies
node_modules/

# Build output
dist/
build/
.next/
out/

# Environment
.env
.env.local

# Logs
*.log

# OS
.DS_Store
Thumbs.db
`;

export class MissingGitRule extends BaseValidationRule {
  readonly id = 'missing-git';
  description(): string {
    return 'Git initialized';
  }
  severity(): ValidationSeverity {
    return 'warning';
  }
  canFix(): boolean {
    return true;
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    if (analysis.git.initialized) return this.pass('Git repository initialized');
    return this.issue({
      message: 'Git not initialized',
      detail: 'Version control is recommended before development.',
      fixPrompt: 'Initialize repository?',
    });
  }

  async fix(ctx: FixContext): Promise<FixResult> {
    if (ctx.analysis.git.initialized) return this.skipped('Already initialized');
    const ok = await ctx.confirm('  Initialize git repository?', true);
    if (!ok) return this.skipped('Git not initialized');
    try {
      execFileSync('git', ['init'], { cwd: ctx.root, stdio: 'ignore' });
      ctx.log('Initialized empty git repository');
      return this.applied('Git repository initialized');
    } catch (error) {
      return this.failedFix(error);
    }
  }
}

export class MissingGitignoreRule extends BaseValidationRule {
  readonly id = 'missing-gitignore';
  description(): string {
    return '.gitignore present';
  }
  severity(): ValidationSeverity {
    return 'info';
  }
  canFix(): boolean {
    return true;
  }

  validate(analysis: ProjectAnalysis): ValidationResult {
    // Only meaningful once git is in use.
    if (!analysis.git.initialized) return this.pass('Git not initialized — .gitignore optional');
    if (analysis.git.hasGitignore) return this.pass('.gitignore found');
    return this.issue({
      message: 'No .gitignore file',
      detail: 'Build artifacts and secrets may be accidentally committed.',
      fixPrompt: 'Create a default .gitignore?',
    });
  }

  async fix(ctx: FixContext): Promise<FixResult> {
    const target = path.join(ctx.root, '.gitignore');
    if (fs.existsSync(target)) return this.skipped('.gitignore already exists');
    const ok = await ctx.confirm('  Create a default .gitignore?', true);
    if (!ok) return this.skipped('.gitignore not created');
    try {
      // Safe: only writes when the file does not already exist.
      fs.writeFileSync(target, DEFAULT_GITIGNORE, { flag: 'wx' });
      ctx.log('Created .gitignore');
      return this.applied('.gitignore created');
    } catch (error) {
      return this.failedFix(error);
    }
  }
}
