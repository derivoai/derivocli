#!/usr/bin/env node
/* global process */

import { program } from 'commander';
import { loginCommand } from '../dist/commands/login/command.js';
import { logoutCommand } from '../dist/commands/logout/command.js';
import { whoamiCommand } from '../dist/commands/whoami/command.js';
import { initCommand } from '../dist/commands/init/command.js';
import { doctorCommand } from '../dist/commands/doctor/command.js';
import { configCommand } from '../dist/commands/config/command.js';
import { statusCommand } from '../dist/commands/status/command.js';
import { setupCommand } from '../dist/commands/setup/command.js';
import { deleteCommand } from '../dist/commands/delete/command.js';
import { inspectCommand } from '../dist/commands/inspect/command.js';
import { validateCommand } from '../dist/commands/validate/command.js';
import { pluginCommand } from '../dist/commands/plugin/command.js';
import { verifySubscriptionActive } from '../dist/utils/session.js';
import { cleanupOrphanedProjects } from '../dist/utils/cleanup.js';
import { printLogo } from '../dist/utils/ui.js';

program
  .name('derivo')
  .description('Developer Experience, Automated.')
  .version('0.1.0')
  .addHelpText('beforeAll', () => {
    printLogo();
    return '';
  })
  .configureHelp({
    sortSubcommands: true,
  });

// Core / offline-capable commands that never require an active subscription.
// Everything else is gated by default (safer for a paid platform — new
// commands are protected unless explicitly listed here).
const FREE_COMMANDS = new Set([
  'login', // auth flow
  'logout',
  'help',
  'whoami', // local identity, works offline
  'doctor', // diagnostics, works offline
  'inspect', // local project analysis
  'validate', // local validation
  'plugin', // local plugin management
  'config', // local configuration
]);

/**
 * Resolve the top-level command name for an action command, walking up through
 * any subcommands (e.g. `derivo plugin list` -> "plugin").
 */
function topLevelName(actionCommand) {
  let cmd = actionCommand;
  while (cmd.parent && cmd.parent.parent) {
    cmd = cmd.parent;
  }
  return cmd.name();
}

program.hook('preAction', async (thisCommand, actionCommand) => {
  const name = topLevelName(actionCommand);

  if (name === 'login' || name === 'logout' || name === 'help') {
    return;
  }

  // Gate everything that is not an explicitly free/offline command.
  if (!FREE_COMMANDS.has(name)) {
    const active = await verifySubscriptionActive();
    if (!active) {
      process.exit(1);
    }
  }

  // Automatically clean up orphaned projects (whose directories were deleted).
  try {
    await cleanupOrphanedProjects();
  } catch {
    // ignore silently to prevent blocking normal CLI execution
  }
});

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(initCommand);
program.addCommand(doctorCommand);
program.addCommand(configCommand);
program.addCommand(statusCommand);
program.addCommand(setupCommand);
program.addCommand(deleteCommand);
program.addCommand(inspectCommand);
program.addCommand(validateCommand);
program.addCommand(pluginCommand);

program.parse(process.argv);
