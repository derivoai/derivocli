/**
 * Request validation built on zod. Schemas are STRICT — unknown fields are
 * rejected. Malformed JSON and oversized payloads are handled upstream by
 * express.json({ limit }) + the error middleware.
 */
import type { Response, NextFunction } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { type AuthedRequest } from './auth.js';
import { Errors } from './errors.js';

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const detail = result.error.issues
        .map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`)
        .join('; ');
      next(Errors.badRequest(`Validation failed: ${detail}`));
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Shared field schemas ─────────────────────────────────────────────────────
const id = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9._-]+$/, 'invalid id');

const safeName = z.string().min(1).max(100);

export const schemas = {
  createProject: z
    .object({
      projectId: id.optional(),
      name: safeName,
      framework: z.string().max(60).optional(),
      env: z.enum(['Development', 'Production', 'Staging']).optional(),
      localPath: z.string().max(1024).optional(),
      deviceId: id.optional(),
    })
    .strict(),

  registerDevice: z
    .object({
      deviceId: id,
      name: z.string().min(1).max(120),
      type: z.enum(['mac', 'windows', 'linux']),
      os: z.string().max(120),
      cliVersion: z.string().max(40),
    })
    .strict(),

  createApiKey: z
    .object({
      name: safeName,
      expiresInDays: z.number().int().min(1).max(3650).optional(),
    })
    .strict(),
};

export { z };
