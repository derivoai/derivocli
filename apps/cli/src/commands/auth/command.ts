import { Command } from 'commander';
import { authLogoutAll, authSessions, authStatus } from './handler.js';

export const authCommand = new Command('auth').description('Authentication and session management');

authCommand
  .command('status')
  .description('Show authentication and subscription status')
  .option('--json', 'Output as JSON')
  .action(async (o: { json?: boolean }) => authStatus({ json: !!o.json }));

authCommand
  .command('sessions')
  .description('List active sessions')
  .option('--json', 'Output as JSON')
  .action(async (o: { json?: boolean }) => authSessions({ json: !!o.json }));

authCommand
  .command('logout-all')
  .description('Log out all other sessions')
  .option('--json', 'Output as JSON')
  .action(async (o: { json?: boolean }) => authLogoutAll({ json: !!o.json }));
