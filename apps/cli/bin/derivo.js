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

program.name('derivo').description('Derivo CLI').version('0.1.0');

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(initCommand);
program.addCommand(doctorCommand);
program.addCommand(configCommand);
program.addCommand(statusCommand);

program.parse(process.argv);
