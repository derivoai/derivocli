import { BaseDetector } from '../base-detector.js';
import type { GitInfo, IProjectContext, Recommendation, Risk } from '../types.js';

export class GitDetector extends BaseDetector<GitInfo> {
  readonly id = 'git';
  readonly title = 'Git';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).initialized;
  }

  analyze(ctx: IProjectContext): GitInfo {
    return {
      initialized: ctx.exists('.git'),
      hasGitignore: ctx.exists('.gitignore'),
    };
  }

  confidence(): number {
    // Pure filesystem fact — always certain.
    return 100;
  }

  override evidence(_ctx: IProjectContext, data: GitInfo): string[] {
    const evidence: string[] = [];
    if (data.initialized) evidence.push('.git');
    if (data.hasGitignore) evidence.push('.gitignore');
    return evidence;
  }

  override recommendations(_ctx: IProjectContext, data: GitInfo): Recommendation[] {
    if (!data.initialized) {
      return [
        {
          id: 'init-git',
          priority: 'medium',
          message: 'Initialize a Git repository',
          detail: 'Run: git init',
          source: this.id,
        },
      ];
    }
    return [];
  }

  override risks(_ctx: IProjectContext, data: GitInfo): Risk[] {
    if (!data.initialized) {
      return [
        {
          id: 'missing-git',
          severity: 'warning',
          title: 'Git not initialized',
          source: this.id,
        },
      ];
    }
    return [];
  }
}
