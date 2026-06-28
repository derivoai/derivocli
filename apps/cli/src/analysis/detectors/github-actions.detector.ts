import { BaseDetector } from '../base-detector.js';
import type { GithubActionsInfo, IProjectContext } from '../types.js';

export class GithubActionsDetector extends BaseDetector<GithubActionsInfo> {
  readonly id = 'github-actions';
  readonly title = 'GitHub Actions';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).used;
  }

  analyze(ctx: IProjectContext): GithubActionsInfo {
    const workflows = ctx.exists('.github/workflows')
      ? ctx.listDir('.github/workflows').filter((f) => /\.ya?ml$/i.test(f))
      : [];
    return { used: workflows.length > 0, workflows };
  }

  confidence(ctx: IProjectContext): number {
    return this.analyze(ctx).used ? 100 : 95;
  }
}
