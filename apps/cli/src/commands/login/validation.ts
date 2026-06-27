import { z } from 'zod';

export const loginOptionsSchema = z.object({
  token: z.string().optional(),
});
