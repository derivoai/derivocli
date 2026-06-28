/**
 * Derivo CLI — Version information
 *
 * Single source of truth for version + compatibility info. The CLI version is
 * read from the published package.json so it never drifts from the release.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SUPPORTED_API_VERSION } from '../plugins/plugin-types/index.js';

/** Minimum supported Node.js major version (mirrors package.json "engines"). */
export const MIN_NODE_MAJOR = 18;

let cachedVersion: string | null = null;

/** Read the CLI version from package.json (relative to the compiled output). */
export function getCliVersion(): string {
  if (cachedVersion) return cachedVersion;
  let resolved = '0.0.0';
  try {
    // dist/utils/version.js -> package root is two levels up.
    const here = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.resolve(here, '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (typeof pkg.version === 'string') resolved = pkg.version;
  } catch {
    // Fall back to the default.
  }
  cachedVersion = resolved;
  return resolved;
}

export interface VersionInfo {
  cli: string;
  /** Plugin manifest API version this build supports. */
  pluginApiVersion: string;
  /** Compatibility band for the analysis/validation engine contracts. */
  apiCompatibility: string;
  node: {
    current: string;
    minimum: string;
    satisfied: boolean;
  };
  platform: string;
  arch: string;
}

export function getVersionInfo(): VersionInfo {
  const currentMajor = parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  return {
    cli: getCliVersion(),
    pluginApiVersion: SUPPORTED_API_VERSION,
    apiCompatibility: '1.x',
    node: {
      current: process.versions.node,
      minimum: `>=${MIN_NODE_MAJOR}`,
      satisfied: currentMajor >= MIN_NODE_MAJOR,
    },
    platform: process.platform,
    arch: process.arch,
  };
}
