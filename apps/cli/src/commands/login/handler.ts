import http from 'http';
import { URL } from 'url';
import open from 'open';
import pc from 'picocolors';
import ora from 'ora';
import { saveSession } from '../../utils/session.js';
import { registerOrUpdateDevice } from '../../utils/device.js';

const CLI_VERSION = '0.1.0';

export async function loginHandler() {
  const spinner = ora('Starting login flow...').start();

  try {
    const server = http.createServer();

    // Listen on any available port (0)
    server.listen(0, '127.0.0.1', async () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        spinner.fail('Failed to start local server for authentication.');
        process.exit(1);
      }

      const port = address.port;
      const webUrl = process.env.DERIVO_WEB_URL || 'http://localhost:3000';
      const loginUrl = `${webUrl}/cli-login?port=${port}`;

      spinner.text = 'Waiting for authentication in browser...';

      try {
        await open(loginUrl);
        console.log(
          `\nIf your browser does not open automatically, visit:\n${pc.cyan(loginUrl)}\n`,
        );
      } catch (err) {
        console.log(`\nPlease open the following URL in your browser:\n${pc.cyan(loginUrl)}\n`);
      }
    });

    server.on('request', async (req: http.IncomingMessage, res: http.ServerResponse) => {
      if (!req.url) return;

      const url = new URL(req.url, `http://localhost`);
      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        const uid = url.searchParams.get('uid');
        const email = url.searchParams.get('email');

        if (token && uid && email) {
          const session = { token, uid, email };
          // Success
          saveSession(session);

          try {
            await registerOrUpdateDevice(session, CLI_VERSION);
          } catch (e) {
            // ignore
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head>
                <style>
                  body { font-family: system-ui, -apple-system, sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                  .container { text-align: center; }
                  h1 { color: #4ade80; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Successfully Authenticated</h1>
                  <p>You can now close this window and return to your terminal.</p>
                </div>
                <script>
                  setTimeout(() => window.close(), 3000);
                </script>
              </body>
            </html>
          `);

          spinner.succeed(`Successfully logged in as ${pc.green(email)}`);

          // Gracefully shut down
          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 1000);
        } else {
          // Failure
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('Missing required parameters in callback.');

          spinner.fail('Authentication failed: Missing parameters.');

          setTimeout(() => {
            server.close();
            process.exit(1);
          }, 1000);
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
  } catch (error) {
    spinner.fail(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
