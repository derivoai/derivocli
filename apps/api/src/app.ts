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
import { requestContext } from './infra/request-context.js';
import { snapshot } from './infra/metrics.js';
import { getStore } from './infra/store.js';
import { isAdminInitialized } from './firebase.js';
import { loadConfig } from './infra/config.js';
import { cliRouter } from './routes/cli.js';
import { billingRouter } from './routes/billing.js';
import { projectsRouter } from './routes/projects.js';
import { devicesRouter } from './routes/devices.js';
import { keysRouter } from './routes/keys.js';
import { trialsRouter } from './routes/trials.js';
import { sessionsRouter } from './routes/sessions.js';
import { loginHistoryRouter } from './routes/login-history.js';
import { authEmailRouter } from './routes/auth-email.js';
import { accountRouter } from './routes/account.js';

export function createApp(): express.Express {
  const app = express();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeaders);
  // Assign request/correlation ids, record latency + access logs (before routes).
  app.use(requestContext);
  app.use(
    cors({
      origin: [
        appUrl,
        'http://localhost:3000',
        'http://localhost:5173',
        'https://derivo.in',
        'https://www.derivo.in',
      ],
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

  // Liveness: the process is up and the event loop responds.
  app.get('/healthz', (_req, res) => {
    res.json({ status: 'alive', uptimeSec: Math.round(process.uptime()) });
  });

  // Readiness: dependencies (store + Firebase mode) are usable.
  app.get('/readyz', async (_req, res) => {
    const checks: Record<string, string> = {};
    let ready = true;

    try {
      const store = await getStore();
      const probe = `readyz:${Date.now()}`;
      await store.set(probe, '1', 5);
      await store.del(probe);
      checks.store = `ok (${store.backend})`;
    } catch (err) {
      ready = false;
      checks.store = `error: ${err instanceof Error ? err.message : String(err)}`;
    }

    checks.firebase = isAdminInitialized() ? 'initialized' : 'mock';
    if (loadConfig().requireFirebase && !isAdminInitialized()) {
      ready = false;
      checks.firebase = 'required-but-missing';
    }

    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not-ready', checks });
  });

  // Operational metrics snapshot (counters + latency). Scrape or ship this.
  app.get('/metrics', (_req, res) => {
    res.json(snapshot());
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
  app.use('/api/auth/email', authEmailRouter);
  app.use('/api/account', accountRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
