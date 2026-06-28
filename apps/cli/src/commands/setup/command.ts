import { Command } from 'commander';
import { setupHandler } from './handler.js';

export const setupCommand = new Command('setup')
  .description('Automatically prepare your machine and project for development')
  .option('--verbose', 'Stream package installs, build output, and detailed step info')
  .action(async (options: { verbose?: boolean }) => {
    await setupHandler({ verbose: !!options.verbose });
  });
