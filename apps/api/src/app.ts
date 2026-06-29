/**
 * Express app factory — composes security middleware and routes.
 * Exported separately from `index.ts` so tests can mount the app without
 * binding a port.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { securityHeaders } from './security/headers.js';
import { limiters } from './security/rate-limit.js';
import { errorHandler, notFoundHandler } from './security/errors.js';
import { cliRouter } from './routes/cli.js';
import { billingRouter } from './routes/billing.js';
import { projectsRouter } from './routes/projects.js';
import { devicesRouter } from './routes/devices.js';
import { keysRouter } from './routes/keys.js';
import { trialsRouter } from './routes/trials.js';
import { sessionsRouter } from './routes/sessions.js';
import { loginHistoryRouter } from './routes/login-history.js';

export function createApp(): express.Express {
  const app = express();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeaders);
  app.use(
    cors({
      origin: [appUrl, 'http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Cookie',
        'X-Signature',
        'X-Mock-Signature',
      ],
    }),
  );

  // Bounded JSON body; capture the raw bytes so webhook signatures can be
  // verified over the exact payload.
  app.use(
    express.json({
      limit: '100kb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(cookieParser());

  app.get('/health', limiters.public, (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Billing + entitlements (subscription, usage, limits, features, webhook, admin).
  app.use('/api', billingRouter);
  app.use('/api/cli', cliRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/devices', devicesRouter);
  app.use('/api/keys', keysRouter);
  app.use('/api/trials', trialsRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/login-history', loginHistoryRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
