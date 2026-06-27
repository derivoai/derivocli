import { createAuthClient } from 'better-auth/react';

/**
 * The auth client must point to the API server (port 3001),
 * NOT the frontend (port 3000).
 *
 * In development the Vite proxy forwards /api/* → localhost:3001,
 * so we use a relative baseURL so cookies are set on the same origin
 * and CORS is not an issue.
 */
export const authClient = createAuthClient({
  baseURL: 'http://localhost:3001',
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient;
