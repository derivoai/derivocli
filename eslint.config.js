import { baseConfig } from './packages/config-eslint/eslint.config.js';

export default [
  ...baseConfig,
  {
    ignores: ['**/dist/**', '**/.turbo/**', '**/node_modules/**', 'apps/web/dist/**'],
  },
];
