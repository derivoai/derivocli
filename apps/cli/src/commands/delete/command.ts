import { Command } from 'commander';
import { deleteHandler } from './handler.js';

export const deleteCommand = new Command('delete')
  .description('Delete a project locally and from Derivo Cloud')
  .action(async () => {
    await deleteHandler();
  });
