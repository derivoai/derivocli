/**
 * Consistent, safe error handling.
 *
 * Production responses never leak stack traces, internal paths, Firestore
 * queries, or secrets. Clients receive a stable shape: { error, code }.
 */
import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const Errors = {
  unauthorized: (msg = 'Authentication required') => new ApiError(401, 'unauthorized', msg),
  forbidden: (msg = 'Access denied') => new ApiError(403, 'forbidden', msg),
  paymentRequired: (msg = 'An active subscription is required') =>
    new ApiError(402, 'subscription_required', msg),
  notFound: (msg = 'Resource not found') => new ApiError(404, 'not_found', msg),
  badRequest: (msg = 'Invalid request') => new ApiError(400, 'bad_request', msg),
  tooMany: (msg = 'Too many requests') => new ApiError(429, 'rate_limited', msg),
  conflict: (msg = 'Conflict') => new ApiError(409, 'conflict', msg),
  internal: (msg = 'Internal server error') => new ApiError(500, 'internal_error', msg),
};

/** Wrap async route handlers so thrown errors reach the error middleware. */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found', code: 'not_found' });
}

/** Final error middleware — must be registered last. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'body' in (err as any)) {
    res.status(400).json({ error: 'Malformed JSON body', code: 'bad_request' });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  // Unknown error: log server-side, return generic message (no leakage).
  console.error('Unhandled error:', err instanceof Error ? err.message : String(err));
  res.status(500).json({ error: 'Internal server error', code: 'internal_error' });
}
