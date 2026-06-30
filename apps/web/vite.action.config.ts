import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

/**
 * Dedicated build for the standalone Firebase email-action page only.
 * Outputs to `dist-action/` with `action.html` as the single entry, so the
 * deployed bundle contains just the /action experience.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');

  return {
    plugins: [react(), tailwindcss()],
    envDir: '../../',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'import.meta.env.APP_URL': JSON.stringify(env.APP_URL || 'http://localhost:3000'),
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist-action',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'action.html'),
      },
    },
  };
});
