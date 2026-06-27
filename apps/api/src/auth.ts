import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, users, accounts, sessions, verifications } from '@derivo/db';

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

const githubConfigured =
  !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  /**
   * The URL where this auth server is reachable.
   * Better Auth uses this to generate OAuth callback URLs.
   */
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',

  /**
   * A long, random secret used to sign cookies and tokens.
   * Generate: openssl rand -hex 32
   */
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      account: accounts,
      session: sessions,
      verification: verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    /**
     * Set to false so users can log in immediately after registering
     * without needing to verify their email first.
     * Enable this only after you have configured an email provider.
     */
    requireEmailVerification: false,
  },

  ...(googleConfigured || githubConfigured
    ? {
        socialProviders: {
          ...(googleConfigured
            ? {
                google: {
                  clientId: process.env.GOOGLE_CLIENT_ID!,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                },
              }
            : {}),
          ...(githubConfigured
            ? {
                github: {
                  clientId: process.env.GITHUB_CLIENT_ID!,
                  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                },
              }
            : {}),
        },
      }
    : {}),

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github'],
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes client-side cache
    },
    expiresIn: 60 * 60 * 24 * 7,   // 7 days
    updateAge: 60 * 60 * 24,        // refresh if older than 1 day
  },

  trustedOrigins: [
    process.env.APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
});

export type Auth = typeof auth;
