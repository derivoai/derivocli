import { Command } from 'commander';
import pc from 'picocolors';
import { clearSession, getSession } from '../../utils/session.js';

export const logoutCommand = new Command('logout')
  .description('Log out of the Derivo platform')
  .action(() => {
    const session = getSession();
    if (!session) {
      console.log(pc.yellow('You are not logged in.'));
      return;
    }

    clearSession();
    console.log(pc.green('Successfully logged out.'));
    process.exit(0);
  });
