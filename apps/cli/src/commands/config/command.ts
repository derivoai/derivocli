import { Command } from 'commander';
import pc from 'picocolors';

export const configCommand = new Command('config')
  .description('Manage configuration')
  .action(() => {
    console.log(pc.yellow('This command will be available in a future release.'));
  });
