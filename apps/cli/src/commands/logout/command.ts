import { Command } from 'commander';
import pc from 'picocolors';
import ora from 'ora';
import { clearSession, getSession } from '../../utils/session.js';
import { getGlobalConfig } from '../../utils/config.js';
import { deleteDocument } from '../../utils/firestore.js';
import { printBanner, printSuccessBox, printStatus, icons, spinnerConfig } from '../../utils/ui.js';

export const logoutCommand = new Command('logout')
  .description('Log out of the Derivo platform')
  .action(async () => {
    printBanner('Derivo Logout', 'Sign out of your account');

    const session = getSession();
    if (!session) {
      printStatus('warning', 'You are not logged in.');
      process.exit(0);
    }

    const config = getGlobalConfig();
    if (config.deviceId) {
      const spinner = ora({
        text: `${icons.gear} Cleaning up device registration...`,
        ...spinnerConfig,
      }).start();

      try {
        await deleteDocument(session.token, session.uid, 'devices', config.deviceId);
        spinner.succeed('Device registration removed');
      } catch (e) {
        spinner.warn('Could not remove device registration (skipped)');
        // ignore deletion errors on network issues
      }
    }

    clearSession();
    printSuccessBox('Logged Out', [pc.dim('Session cleared successfully.')]);
    process.exit(0);
  });
