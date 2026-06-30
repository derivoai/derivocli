/**
 * Request context middleware: assigns a request id, propagates a correlation
 * id, records latency, and emits a structured access log. The request id is
 * returned in the `X-Request-Id` header for client/server correlation.
 */
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';
import { incr, observeLatency } from './metrics.js';

export interface ContextRequest extends Request {
  requestId?: string;
  correlationId?: string;
}

export function requestContext(req: ContextRequest, res: Response, next: NextFunction): void {
  const requestId = crypto.randomBytes(8).toString('hex');
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    requestId;

  req.requestId = requestId;
  req.correlationId = correlationId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Correlation-Id', correlationId);

  const start = Date.now();
  incr('http.requests');

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    observeLatency(durationMs);
    if (res.statusCode >= 500) incr('http.errors');
    if (res.statusCode === 401 || res.statusCode === 403) incr('auth.failures');

    logger.info('request', {
      requestId,
      correlationId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
    });
  });

  next();
}
