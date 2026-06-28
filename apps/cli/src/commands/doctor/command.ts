import { Command } from 'commander';
import { doctorHandler } from './handler.js';

export const doctorCommand = new Command('doctor')
  .description('Run diagnostics on your machine and project')
  .option('--fix', 'Automatically fix issues when possible')
  .option('--json', 'Output results as JSON')
  .action(async (options: { fix?: boolean; json?: boolean }) => {
    await doctorHandler({ fix: !!options.fix, json: !!options.json });
  });
