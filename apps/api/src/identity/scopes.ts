/**
 * API key permission scopes. Keys are issued with a subset of these; the
 * `requireApiKey(...scopes)` middleware enforces them. `admin` implies all.
 */
export const ALL_SCOPES = [
  'projects:read',
  'projects:write',
  'devices:read',
  'devices:write',
  'billing:read',
  'billing:write',
  'admin',
  'future:ai',
] as const;

export type Scope = (typeof ALL_SCOPES)[number];

export function isValidScope(value: string): value is Scope {
  return (ALL_SCOPES as readonly string[]).includes(value);
}

export function normalizeScopes(input: unknown): Scope[] {
  if (!Array.isArray(input)) return [];
  const set = new Set<Scope>();
  for (const s of input) {
    if (typeof s === 'string' && isValidScope(s)) set.add(s);
  }
  return [...set];
}

/** True if `granted` satisfies all `required` scopes (admin implies all). */
export function hasScopes(granted: string[], required: Scope[]): boolean {
  if (granted.includes('admin')) return true;
  return required.every((r) => granted.includes(r));
}
