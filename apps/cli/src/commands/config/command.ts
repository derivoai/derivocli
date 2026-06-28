import { Command } from 'commander';
import pc from 'picocolors';
import { printBanner, printStatus, icons, colors, BRAND, nl } from '../../utils/ui.js';

export const configCommand = new Command('config')
  .description('Manage configuration')
  .action(() => {
    printBanner('Configuration', 'Manage your Derivo CLI settings');
    printStatus('info', 'This command will be available in a future release.');
    console.log(pc.dim('  ' + icons.arrow + ' Manage settings at ' + colors.link(BRAND.url)));
    nl();
  });
