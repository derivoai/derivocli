import { BaseDetector } from '../base-detector.js';
import type { EnvironmentInfo, IProjectContext, Recommendation, Risk } from '../types.js';

const KNOWN_ENV_FILES = ['.env.example', '.env.sample', '.env.template', '.env'];

export class EnvironmentDetector extends BaseDetector<EnvironmentInfo> {
  readonly id = 'environment';
  readonly title = 'Environment';

  detect(ctx: IProjectContext): boolean {
    const info = this.analyze(ctx);
    return info.hasExample || info.hasEnv;
  }

  analyze(ctx: IProjectContext): EnvironmentInfo {
    const files = KNOWN_ENV_FILES.filter((file) => ctx.exists(file));
    const exampleFile = ctx.firstExisting(['.env.example', '.env.sample', '.env.template']);

    return {
      hasExample: exampleFile !== null,
      hasEnv: ctx.exists('.env'),
      // Parse keys ONLY from the example template — never read .env secret values.
      declaredVariables: exampleFile ? this.parseKeys(ctx.readText(exampleFile)) : [],
      files,
    };
  }

  confidence(ctx: IProjectContext): number {
    return this.detect(ctx) ? 95 : 90;
  }

  override evidence(_ctx: IProjectContext, data: EnvironmentInfo): string[] {
    const evidence = [...data.files];
    if (data.declaredVariables.length > 0) {
      evidence.push(`${data.declaredVariables.length} variables declared`);
    }
    return evidence;
  }

  override recommendations(_ctx: IProjectContext, data: EnvironmentInfo): Recommendation[] {
    const recs: Recommendation[] = [];
    if (data.hasExample && !data.hasEnv) {
      recs.push({
        id: 'env-missing',
        priority: 'high',
        message: 'Environment variables missing',
        detail: `Copy ${data.files[0] ?? '.env.example'} to .env (${data.declaredVariables.length} variables declared).`,
        source: this.id,
      });
    } else if (data.declaredVariables.length > 0) {
      recs.push({
        id: 'env-detected',
        priority: 'low',
        message: 'Environment variables detected',
        detail: `${data.declaredVariables.length} variables declared in the example file.`,
        source: this.id,
      });
    }
    return recs;
  }

  override risks(_ctx: IProjectContext, data: EnvironmentInfo): Risk[] {
    if (!data.hasExample) {
      return [
        {
          id: 'missing-env-example',
          severity: 'info',
          title: 'No .env.example',
          detail: 'Required environment variables are undocumented.',
          source: this.id,
        },
      ];
    }
    return [];
  }

  /** Extract variable names (left of `=`), ignoring comments and values. */
  private parseKeys(content: string | null): string[] {
    if (!content) return [];
    const keys: string[] = [];
    for (const raw of content.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match) keys.push(match[1]!);
    }
    return keys;
  }
}
