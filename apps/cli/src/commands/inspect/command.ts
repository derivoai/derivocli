import { Command } from 'commander';
import { inspectHandler } from './handler.js';

export const inspectCommand = new Command('inspect')
  .description('Analyze the current project and report its structure, risks, and recommendations')
  .option('--json', 'Output the full analysis as JSON')
  .option('--path <dir>', 'Analyze a specific directory instead of the current one')
  .option('--packages', 'List every workspace package (default shows a sample)')
  .option('--graph', 'Render the project structure as a tree')
  .option('--deps', 'Show core first-party dependencies and versions')
  .action(
    async (options: {
      json?: boolean;
      path?: string;
      packages?: boolean;
      graph?: boolean;
      deps?: boolean;
    }) => {
      await inspectHandler({
        json: !!options.json,
        path: options.path,
        packages: !!options.packages,
        graph: !!options.graph,
        deps: !!options.deps,
      });
    },
  );
