import { BaseDetector } from '../base-detector.js';
import type { DockerInfo, IProjectContext, Recommendation } from '../types.js';

const COMPOSE_FILES = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];

export class DockerDetector extends BaseDetector<DockerInfo> {
  readonly id = 'docker';
  readonly title = 'Docker';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).used;
  }

  analyze(ctx: IProjectContext): DockerInfo {
    const files: string[] = [];
    const hasDockerfile = ctx.exists('Dockerfile');
    if (hasDockerfile) files.push('Dockerfile');

    const composeFile = ctx.firstExisting(COMPOSE_FILES);
    if (composeFile) files.push(composeFile);

    if (ctx.exists('.dockerignore')) files.push('.dockerignore');

    return {
      used: hasDockerfile || composeFile !== null,
      hasDockerfile,
      hasCompose: composeFile !== null,
      files,
    };
  }

  confidence(ctx: IProjectContext): number {
    return this.analyze(ctx).used ? 98 : 100;
  }

  override recommendations(_ctx: IProjectContext, data: DockerInfo): Recommendation[] {
    if (data.used) {
      return [
        {
          id: 'docker-required',
          priority: 'high',
          message: 'Docker required',
          detail: data.hasCompose
            ? 'docker-compose detected — services likely need to be running.'
            : 'Dockerfile detected.',
          source: this.id,
        },
      ];
    }
    return [];
  }
}
