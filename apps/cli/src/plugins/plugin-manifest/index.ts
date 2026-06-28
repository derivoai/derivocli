/**
 * Derivo Plugin SDK — Manifest parsing & schema
 *
 * Parses and structurally validates plugin manifests with zod (already a CLI
 * dependency). Semantic validation (API version, permissions) lives in
 * plugin-validator so this stays a pure schema concern.
 */
import { z } from 'zod';
import { ManifestError } from '../plugin-errors/index.js';
import { ALL_PERMISSIONS, type PluginManifest } from '../plugin-types/index.js';

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+].*)?$/;

export const manifestSchema = z.object({
  id: z.string().min(1).regex(ID_PATTERN, 'id must be lowercase alphanumeric with dashes'),
  name: z.string().min(1),
  version: z.string().regex(SEMVER_PATTERN, 'version must be semver (x.y.z)'),
  description: z.string().optional(),
  author: z.string().optional(),
  apiVersion: z.string().min(1),
  entry: z.string().min(1).optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).optional(),
});

/** Parse + structurally validate an unknown manifest value. */
export function parseManifest(value: unknown): PluginManifest {
  const result = manifestSchema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new ManifestError(`Invalid manifest: ${issues}`);
  }
  return result.data as PluginManifest;
}

/** Parse a manifest from raw JSON text. */
export function parseManifestJSON(json: string): PluginManifest {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ManifestError('Manifest is not valid JSON');
  }
  return parseManifest(value);
}

export const MANIFEST_FILENAME = 'derivo-plugin.json';
