import { Command } from 'commander';
import pc from 'picocolors';

export const statusCommand = new Command('status').description('Show current status').action(() => {
  console.log(pc.yellow('This command will be available in a future release.'));
});
