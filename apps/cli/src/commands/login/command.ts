import { Command } from 'commander';
import { loginHandler } from './handler';

export const loginCommand = new Command('login')
  .description('Log into the Derivo platform')
  .action(async () => {
    await loginHandler();
  });
