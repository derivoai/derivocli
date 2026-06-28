import { Command } from 'commander';
import { inspectHandler } from './handler.js';

export const inspectCommand = new Command('inspect')
  .description('Analyze the current project and report its structure, risks, and recommendations')
  .option('--json', 'Output the full analysis as JSON')
  .option('--path <dir>', 'Analyze a specific directory instead of the current one')
  .action(async (options: { json?: boolean; path?: string }) => {
    await inspectHandler({ json: !!options.json, path: options.path });
  });
