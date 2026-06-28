import { Command } from 'commander';
import pc from 'picocolors';
import { printBanner, printStatus, icons, colors, nl } from '../../utils/ui.js';

export const statusCommand = new Command('status').description('Show current status').action(() => {
  printBanner('Project Status', 'View current project and sync status');
  printStatus('info', 'This command will be available in a future release.');
  console.log(
    pc.dim(
      '  ' + icons.arrow + ' Run ' + colors.cmd('derivo doctor') + pc.dim(' to check your setup'),
    ),
  );
  nl();
});
