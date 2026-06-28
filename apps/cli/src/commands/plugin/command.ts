import { Command } from 'commander';
import { pluginHandler } from './handler.js';

interface RawOptions {
  json?: boolean;
  verbose?: boolean;
}

function opts(command: Command): { json: boolean; verbose: boolean } {
  // Merge options from this subcommand and its parent for ergonomic flags.
  const local = command.opts<RawOptions>();
  const parent = (command.parent?.opts<RawOptions>() ?? {}) as RawOptions;
  return {
    json: !!(local.json ?? parent.json),
    verbose: !!(local.verbose ?? parent.verbose),
  };
}

export const pluginCommand = new Command('plugin')
  .description('Manage Derivo plugins')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Show detailed plugin execution');

pluginCommand
  .command('list')
  .description('List all installed plugins')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Verbose output')
  .action(async (_o, cmd: Command) => {
    await pluginHandler('list', undefined, opts(cmd));
  });

pluginCommand
  .command('info <id>')
  .description('Show details about a plugin')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Verbose output')
  .action(async (id: string, _o, cmd: Command) => {
    await pluginHandler('info', id, opts(cmd));
  });

pluginCommand
  .command('enable <id>')
  .description('Enable a plugin')
  .option('--json', 'Output as JSON')
  .action(async (id: string, _o, cmd: Command) => {
    await pluginHandler('enable', id, opts(cmd));
  });

pluginCommand
  .command('disable <id>')
  .description('Disable a plugin')
  .option('--json', 'Output as JSON')
  .action(async (id: string, _o, cmd: Command) => {
    await pluginHandler('disable', id, opts(cmd));
  });

pluginCommand
  .command('reload <id>')
  .description('Reload a plugin')
  .option('--json', 'Output as JSON')
  .action(async (id: string, _o, cmd: Command) => {
    await pluginHandler('reload', id, opts(cmd));
  });

pluginCommand
  .command('doctor')
  .description('Diagnose plugin health')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Verbose output')
  .action(async (_o, cmd: Command) => {
    await pluginHandler('doctor', undefined, opts(cmd));
  });
