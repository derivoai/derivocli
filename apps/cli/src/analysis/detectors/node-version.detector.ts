import { BaseDetector } from '../base-detector.js';
import type { IProjectContext, NodeVersionInfo, Risk } from '../types.js';

export class NodeVersionDetector extends BaseDetector<NodeVersionInfo> {
  readonly id = 'node-version';
  readonly title = 'Node Version';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).required !== null;
  }

  analyze(ctx: IProjectContext): NodeVersionInfo {
    const pkg = ctx.packageJson();

    const engineNode = pkg?.engines?.node;
    if (engineNode) return { required: engineNode.trim(), source: 'engines' };

    const nvmrc = ctx.readText('.nvmrc');
    if (nvmrc && nvmrc.trim()) return { required: nvmrc.trim(), source: '.nvmrc' };

    const nodeVersionFile = ctx.readText('.node-version');
    if (nodeVersionFile && nodeVersionFile.trim()) {
      return { required: nodeVersionFile.trim(), source: '.node-version' };
    }

    const volta = pkg?.volta?.node;
    if (volta) return { required: volta.trim(), source: 'volta' };

    return { required: null, source: 'none' };
  }

  confidence(ctx: IProjectContext): number {
    return this.analyze(ctx).required !== null ? 100 : 40;
  }

  override evidence(_ctx: IProjectContext, data: NodeVersionInfo): string[] {
    if (data.required === null) return [];
    return [`${data.source}: ${data.required}`];
  }

  override risks(_ctx: IProjectContext, data: NodeVersionInfo): Risk[] {
    if (data.required === null) return [];
    const match = data.required.match(/(\d+)/);
    if (!match) return [];
    const requiredMajor = parseInt(match[1]!, 10);
    const currentMajor = parseInt(process.versions.node.split('.')[0]!, 10);
    if (currentMajor < requiredMajor) {
      return [
        {
          id: 'unsupported-node-version',
          severity: 'critical',
          title: 'Unsupported Node version',
          detail: `Running Node ${process.versions.node}, project requires ${data.required}.`,
          source: this.id,
        },
      ];
    }
    return [];
  }
}
