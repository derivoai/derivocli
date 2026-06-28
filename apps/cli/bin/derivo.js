#!/usr/bin/env node
/* global process, console */

import { program } from 'commander';
import pc from 'picocolors';
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
import { versionCommand } from '../dist/commands/version/command.js';
import { telemetryCommand } from '../dist/commands/telemetry/command.js';
import { verifySubscriptionActive } from '../dist/utils/session.js';
import { cleanupOrphanedProjects } from '../dist/utils/cleanup.js';
import { printLogo } from '../dist/utils/ui.js';
import { getCliVersion } from '../dist/utils/version.js';
import {
  notifyUpdateFromCache,
  refreshUpdateCacheInBackground,
} from '../dist/utils/update-checker.js';

const VERBOSE = process.argv.includes('--verbose') || !!process.env.DERIVO_VERBOSE;

// ── Friendly global error handling ──────────────────
// Production builds never dump raw stack traces; use --verbose for details.
function reportFatal(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('');
  console.error(`  ${pc.red('✗')} ${pc.red(message)}`);
  if (VERBOSE && error instanceof Error && error.stack) {
    console.error(pc.dim(error.stack));
  } else {
    console.error(pc.dim('  Run with --verbose for technical details.'));
  }
  console.error('');
  process.exit(1);
}

process.on('uncaughtException', reportFatal);
process.on('unhandledRejection', reportFatal);

// ── Non-blocking update notice ──────────────────────
try {
  notifyUpdateFromCache();
  refreshUpdateCacheInBackground();
} catch {
  // Update checks must never affect command execution.
}

program
  .name('derivo')
  .description('Developer Experience, Automated.')
  .version(getCliVersion(), '-V, --version', 'Output the CLI version')
  .option('--verbose', 'Show technical details and stack traces on error')
  .addHelpText('beforeAll', () => {
    printLogo();
    return '';
  })
  .configureHelp({
    sortSubcommands: true,
  });

// Core / offline-capable commands that never require an active subscription.
const FREE_COMMANDS = new Set([
  'login',
  'logout',
  'help',
  'version',
  'telemetry',
  'whoami',
  'doctor',
  'inspect',
  'validate',
  'plugin',
  'config',
]);

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
program.addCommand(versionCommand);
program.addCommand(telemetryCommand);

program.parseAsync(process.argv).catch(reportFatal);
