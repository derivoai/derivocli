import { Command } from 'commander';
import pc from 'picocolors';
import { getSession } from '../../utils/session.js';
import {
  printBanner,
  printSection,
  printKeyValue,
  printStatus,
  icons,
  colors,
  nl,
} from '../../utils/ui.js';

export const whoamiCommand = new Command('whoami')
  .description('Display the currently logged-in user')
  .action(() => {
    printBanner('Who Am I', 'Current session information');

    const session = getSession();
    if (!session) {
      printStatus('error', 'Not logged in.');
      console.log(`    ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo login')} to authenticate.`);
      nl();
      process.exit(1);
    }

    printSection('Session Details');
    nl();
    printKeyValue('Email', session!.email);
    printKeyValue('UID', session!.uid);
    nl();
    process.exit(0);
  });
