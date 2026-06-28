import { Command } from 'commander';
import { initHandler } from './handler.js';

export const initCommand = new Command('init')
  .description('Initialize a new project')
  .action(async () => {
    await initHandler();
  });
