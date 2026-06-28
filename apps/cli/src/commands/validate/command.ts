import { Command } from 'commander';
import { validateHandler } from './handler.js';

export const validateCommand = new Command('validate')
  .description('Validate the project and optionally apply safe, confirmed fixes')
  .option('--fix', 'Interactively apply fixes for detected issues')
  .option('--json', 'Output the validation report as JSON')
  .option('--path <dir>', 'Validate a specific directory instead of the current one')
  .action(async (options: { fix?: boolean; json?: boolean; path?: string }) => {
    await validateHandler({ fix: !!options.fix, json: !!options.json, path: options.path });
  });
