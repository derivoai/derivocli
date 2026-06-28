import { BaseDetector } from '../base-detector.js';
import { analyzeReadmeContent } from '../readme-analyzer.js';
import type { IProjectContext, ReadmeAnalysis, Risk } from '../types.js';

const README_CANDIDATES = ['README.md', 'readme.md', 'README.markdown', 'README'];

export class ReadmeDetector extends BaseDetector<ReadmeAnalysis> {
  readonly id = 'readme';
  readonly title = 'README Instructions';

  detect(ctx: IProjectContext): boolean {
    return ctx.firstExisting(README_CANDIDATES) !== null;
  }

  analyze(ctx: IProjectContext): ReadmeAnalysis {
    const fileName = ctx.firstExisting(README_CANDIDATES);
    const content = fileName ? ctx.readText(fileName) : null;
    return analyzeReadmeContent(content, fileName);
  }

  confidence(ctx: IProjectContext): number {
    const info = this.analyze(ctx);
    if (!info.present) return 100; // confidently "no README"
    return info.commands.length > 0 ? 90 : 70;
  }

  override evidence(_ctx: IProjectContext, data: ReadmeAnalysis): string[] {
    if (!data.present) return [];
    const evidence: string[] = [];
    if (data.fileName) evidence.push(data.fileName);
    if (data.commands.length > 0) evidence.push(`${data.commands.length} commands extracted`);
    return evidence;
  }

  override risks(_ctx: IProjectContext, data: ReadmeAnalysis): Risk[] {
    if (!data.present) {
      return [
        {
          id: 'missing-readme',
          severity: 'info',
          title: 'No README',
          detail: 'No setup instructions could be discovered.',
          source: this.id,
        },
      ];
    }
    return [];
  }
}
