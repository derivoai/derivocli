/**
 * Centralized environment variable handling.
 * Validates that required environment variables are set.
 */

export const env = {
  GEMINI_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '') as string,
  APP_URL: (import.meta.env.VITE_APP_URL || import.meta.env.APP_URL || 'http://localhost:3000') as string,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

export function validateEnv() {
  if (!env.GEMINI_API_KEY) {
    console.warn('[Env Validation] Warning: VITE_GEMINI_API_KEY or GEMINI_API_KEY is not defined.');
  }
}

// Automatically validate when imported
validateEnv();
