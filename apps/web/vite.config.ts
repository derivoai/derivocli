import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file from the monorepo root
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
      // Expose environment variables without VITE_ prefix to import.meta.env
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'import.meta.env.APP_URL': JSON.stringify(env.APP_URL || 'http://localhost:3000'),
      // Expose backend API URL (VITE_API_URL is automatically available, but also expose as VITE_DERIVO_API_URL)
      'import.meta.env.VITE_DERIVO_API_URL': JSON.stringify(
        env.VITE_API_URL || env.DERIVO_API_URL || 'http://localhost:3001',
      ),
    },
    build: {
      // Modern browsers only — smaller output, no legacy transpilation cost.
      target: 'es2020',
      cssCodeSplit: true,
      // esbuild minify is fast and strips console/debugger in prod.
      minify: 'esbuild',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Isolate large, cache-stable LEAF libraries into their own chunks so
          // the landing bundle stays lean and app-only deps (Firebase) never
          // load on marketing pages. Everything else uses Vite's default
          // chunking to avoid circular-chunk issues.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/firebase/') || id.includes('@firebase/')) return 'firebase';
            if (id.includes('/motion/') || id.includes('framer-motion')) return 'motion';
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('micromark'))
              return 'markdown';
            if (id.includes('lucide-react')) return 'icons';
            return undefined;
          },
        },
      },
    },
    esbuild: {
      // Drop console/debugger from production builds to cut main-thread work.
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    server: {
      hosts: true,
      allowedHosts: true,
      // Allow importing markdown docs from the monorepo root (outside apps/web).
      fs: {
        allow: [path.resolve(__dirname, '../../')],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
