import open from 'open';
import pc from 'picocolors';
import ora from 'ora';
import { saveSession } from '../../utils/session.js';
import { registerOrUpdateDevice } from '../../utils/device.js';
import { apiRequest, getApiBaseUrl } from '../../utils/api.js';
import {
  printBanner,
  printSuccessBox,
  printErrorBox,
  printStatus,
  icons,
  colors,
  spinnerConfig,
  nl,
} from '../../utils/ui.js';

const CLI_VERSION = '0.1.0';
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export async function loginHandler() {
  printBanner('Derivo Login', 'Authenticate with your Derivo account');

  const spinner = ora({
    text: `${icons.lock} Initializing secure login...`,
    ...spinnerConfig,
  }).start();

  try {
    // Step 1: Request a one-time state code from the API
    const initRes = await apiRequest<{ state: string; expiresAt: string }>('/api/cli/auth/init', {
      method: 'POST',
    });

    if (initRes.status !== 200 || !initRes.data.state) {
      spinner.fail('Failed to initialize login session.');
      process.exit(1);
    }

    const { state } = initRes.data;

    // Step 2: Open browser with state code — no localhost, no port
    const webUrl = process.env.DERIVO_WEB_URL || 'https://derivo.in';
    const loginUrl = `${webUrl}/cli-login?state=${state}`;

    spinner.text = `${icons.globe} Waiting for authentication in browser...`;

    try {
      await open(loginUrl);
      nl();
      printStatus('info', 'Browser opened automatically');
      console.log(`    ${pc.dim(icons.arrow)} If it didn't open, visit: ${colors.link(loginUrl)}`);
      nl();
    } catch {
      nl();
      printStatus('warning', 'Could not open browser automatically');
      console.log(`    ${pc.dim(icons.arrow)} Please visit: ${colors.link(loginUrl)}`);
      nl();
    }

    // Step 3: Poll API for the token until ready or timeout
    spinner.text = `${icons.lock} Waiting for you to complete login in the browser...`;

    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);

      const pollRes = await apiRequest<{
        ready: boolean;
        token?: string;
        uid?: string;
        email?: string;
      }>(`/api/cli/auth/poll?state=${state}`);

      if (pollRes.status !== 200) {
        spinner.fail('Login session expired or invalid. Please try again.');
        process.exit(1);
      }

      if (!pollRes.data.ready) continue;

      // Got the token — save session
      const { token, uid, email } = pollRes.data;
      if (!token || !uid || !email) {
        spinner.fail('Incomplete auth response. Please try again.');
        process.exit(1);
      }

      const session = { token, uid, email };
      saveSession(session);

      try {
        await registerOrUpdateDevice(session, CLI_VERSION);
      } catch {
        // non-fatal
      }

      spinner.stop();
      printSuccessBox('Logged In', [
        `${pc.dim('Email:')}  ${pc.white(email)}`,
        pc.dim('Session saved to local config.'),
      ]);
      process.exit(0);
    }

    spinner.fail('Login timed out. Please try again.');
    process.exit(1);
  } catch (error) {
    spinner.stop();
    printErrorBox('Login Error', [
      pc.dim(error instanceof Error ? error.message : `Cannot reach the API at ${getApiBaseUrl()}`),
    ]);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
