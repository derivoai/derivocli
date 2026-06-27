#!/usr/bin/env node

import { program } from 'commander';
import { loginCommand } from '../dist/commands/login/command.js';

program
  .name('derivo')
  .description('Derivo CLI')
  .version('0.1.0');

program.addCommand(loginCommand);

// Add placeholders for the other commands
program.command('logout').description('Log out of the Derivo platform');
program.command('setup').description('Setup your project');
program.command('doctor').description('Run diagnostics');
program.command('init').description('Initialize a new project');
program.command('status').description('Show current status');
program.command('config').description('Manage configuration');
program.command('update').description('Update the CLI');

program.parse(process.argv);
