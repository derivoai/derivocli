import { reactConfig } from '@derivo/config-eslint';

export default [
  ...reactConfig,
  {
    ignores: ['dist', '.turbo', 'node_modules', 'vite.config.ts'],
  }
];
