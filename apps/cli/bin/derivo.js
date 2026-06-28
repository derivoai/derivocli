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

program.hook('preAction', async (thisCommand, actionCommand) => {
  const name = actionCommand.name();
  if (name !== 'login' && name !== 'logout' && name !== 'help') {
    const active = await verifySubscriptionActive();
    if (!active) {
      process.exit(1);
    }
    // Automatically clean up orphaned projects (whose directories were deleted)
    try {
      await cleanupOrphanedProjects();
    } catch {
      // ignore silently to prevent blocking normal CLI execution
    }
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

program.parse(process.argv);
