/**
 * Derivo Plugin SDK — Plugin Validator
 *
 * Semantic validation performed before a plugin is allowed to activate:
 *  - manifest is structurally valid
 *  - apiVersion is supported
 *  - permissions are recognized
 *  - the loaded instance matches the manifest and exposes a usable shape
 */
import {
  ALL_PERMISSIONS,
  SUPPORTED_API_VERSION,
  type DerivoPlugin,
  type PluginManifest,
} from '../plugin-types/index.js';

export interface ValidationOutcome {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Validate a manifest's semantics (beyond its structure). */
export function validateManifest(manifest: PluginManifest): ValidationOutcome {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (manifest.apiVersion !== SUPPORTED_API_VERSION) {
    errors.push(
      `Unsupported apiVersion "${manifest.apiVersion}" (this CLI supports "${SUPPORTED_API_VERSION}")`,
    );
  }

  for (const permission of manifest.permissions ?? []) {
    if (!ALL_PERMISSIONS.includes(permission)) {
      errors.push(`Unknown permission "${permission}"`);
    }
  }

  if (!manifest.description) warnings.push('Manifest has no description');

  return { valid: errors.length === 0, errors, warnings };
}

/** Validate a loaded plugin instance against its manifest. */
export function validateInstance(manifest: PluginManifest, instance: unknown): ValidationOutcome {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!instance || typeof instance !== 'object') {
    errors.push('Plugin entry did not export a plugin object');
    return { valid: false, errors, warnings };
  }

  const plugin = instance as Partial<DerivoPlugin>;

  if (typeof plugin.id !== 'string' || plugin.id.length === 0) {
    errors.push('Plugin is missing a string "id"');
  } else if (plugin.id !== manifest.id) {
    errors.push(`Plugin id "${plugin.id}" does not match manifest id "${manifest.id}"`);
  }

  const capabilityNames = ['detect', 'doctor', 'validate', 'setup', 'inspect'] as const;
  const hasCapability = capabilityNames.some((name) => typeof plugin[name] === 'function');
  const hasHooks = plugin.hooks && Object.keys(plugin.hooks).length > 0;
  if (!hasCapability && !hasHooks) {
    warnings.push('Plugin implements no capabilities or hooks');
  }

  return { valid: errors.length === 0, errors, warnings };
}
