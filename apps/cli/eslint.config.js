import { baseConfig } from '@derivo/config-eslint';

export default [
  ...baseConfig,
  {
    ignores: ['dist', '.turbo', 'node_modules', 'bin'],
  }
];
