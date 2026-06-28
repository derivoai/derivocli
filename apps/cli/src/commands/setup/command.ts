import { Command } from 'commander';
import { setupHandler } from './handler.js';

export const setupCommand = new Command('setup')
  .description('Automatically prepare your machine and project for development')
  .action(async () => {
    await setupHandler();
  });
