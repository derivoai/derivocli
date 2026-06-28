import { Command } from 'commander';
import pc from 'picocolors';

export const initCommand = new Command('init')
  .description('Initialize a new project')
  .action(() => {
    console.log(pc.yellow('This command will be available in a future release.'));
  });
