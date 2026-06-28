/**
 * Derivo Plugin SDK — Errors
 *
 * Typed error hierarchy plus a `humanizeError` helper that turns low-level
 * Node exceptions into friendly, actionable messages for the CLI.
 */

export class PluginError extends Error {
  readonly pluginId?: string;
  constructor(message: string, pluginId?: string) {
    super(message);
    this.name = 'PluginError';
    this.pluginId = pluginId;
  }
}

export class ManifestError extends PluginError {
  constructor(message: string, pluginId?: string) {
    super(message, pluginId);
    this.name = 'ManifestError';
  }
}

export class PermissionError extends PluginError {
  readonly permission: string;
  constructor(permission: string, pluginId?: string) {
    super(`Permission "${permission}" was not granted`, pluginId);
    this.name = 'PermissionError';
    this.permission = permission;
  }
}

export class PluginLoadError extends PluginError {
  constructor(message: string, pluginId?: string) {
    super(message, pluginId);
    this.name = 'PluginLoadError';
  }
}

export class PluginExecutionError extends PluginError {
  readonly cause?: unknown;
  constructor(message: string, pluginId?: string, cause?: unknown) {
    super(message, pluginId);
    this.name = 'PluginExecutionError';
    this.cause = cause;
  }
}

interface ErrnoLike {
  code?: string;
  path?: string;
  message?: string;
}

/**
 * Convert any thrown value into a human-friendly message.
 * Recognizes common Node errno codes and surfaces guidance.
 */
export function humanizeError(error: unknown): string {
  if (error instanceof PermissionError) {
    return `${error.message}. Add it to the plugin manifest "permissions".`;
  }
  if (error instanceof PluginError) {
    return error.message;
  }

  const e = error as ErrnoLike;
  const target = e?.path ? ` (${e.path})` : '';
  switch (e?.code) {
    case 'ENOENT':
      if (e.path && /package\.json$/.test(e.path)) {
        return 'Could not locate package.json. Make sure you are inside a project directory.';
      }
      return `A required file or directory was not found${target}.`;
    case 'EACCES':
    case 'EPERM':
      return `Permission denied${target}. Check file permissions or run with appropriate access.`;
    case 'ENOTDIR':
      return `Expected a directory but found a file${target}.`;
    case 'EISDIR':
      return `Expected a file but found a directory${target}.`;
    case 'EEXIST':
      return `The target already exists${target}.`;
    case 'ENOSPC':
      return 'No space left on device. Free up disk space and try again.';
    default:
      break;
  }

  if (error instanceof Error) return error.message;
  return String(error);
}
