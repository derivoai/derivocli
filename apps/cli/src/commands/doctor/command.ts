import { Command } from 'commander';
import pc from 'picocolors';

export const doctorCommand = new Command('doctor').description('Run diagnostics').action(() => {
  console.log(pc.yellow('This command will be available in a future release.'));
});
