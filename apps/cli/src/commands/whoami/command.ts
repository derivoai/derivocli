import { Command } from 'commander';
import pc from 'picocolors';
import { getSession } from '../../utils/session.js';

export const whoamiCommand = new Command('whoami')
  .description('Display the currently logged-in user')
  .action(() => {
    const session = getSession();
    if (!session) {
      console.log(pc.red('Not logged in.'));
      console.log(`Run ${pc.cyan('derivo login')} to authenticate.`);
      process.exit(1);
    }

    console.log(`Logged in as ${pc.green(session!.email)} (UID: ${session!.uid})`);
  });
