import { Command } from 'commander';
import pc from 'picocolors';
import { clearSession, getSession } from '../../utils/session.js';
import { getGlobalConfig } from '../../utils/config.js';
import { deleteDocument } from '../../utils/firestore.js';

export const logoutCommand = new Command('logout')
  .description('Log out of the Derivo platform')
  .action(async () => {
    const session = getSession();
    if (!session) {
      console.log(pc.yellow('You are not logged in.'));
      process.exit(0);
    }

    const config = getGlobalConfig();
    if (config.deviceId) {
      try {
        await deleteDocument(session.token, session.uid, 'devices', config.deviceId);
      } catch (e) {
        // ignore deletion errors on network issues
      }
    }

    clearSession();
    console.log(pc.green('Successfully logged out.'));
    process.exit(0);
  });
