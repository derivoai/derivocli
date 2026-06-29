import { Command } from 'commander';
import { deviceList, deviceRename, deviceRevoke } from './handler.js';

export const deviceCommand = new Command('device').description('Manage trusted devices');

deviceCommand
  .command('list')
  .description('List your registered devices')
  .option('--json', 'Output as JSON')
  .action(async (o: { json?: boolean }) => deviceList({ json: !!o.json }));

deviceCommand
  .command('rename <id> <name>')
  .description('Rename a device')
  .action(async (id: string, name: string) => deviceRename(id, name));

deviceCommand
  .command('revoke <id>')
  .description('Revoke a device')
  .action(async (id: string) => deviceRevoke(id));
