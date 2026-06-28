/**
 * Derivo Plugin SDK — Sandbox
 *
 * Lightweight isolation: every plugin invocation runs through `runSafely`,
 * which captures synchronous and asynchronous failures (including timeouts)
 * so a misbehaving plugin can NEVER crash the CLI. This is fault isolation,
 * not a security boundary — that is enforced separately by permissions.
 */
import { PluginExecutionError } from '../plugin-errors/index.js';

export interface SandboxResult<T> {
  ok: boolean;
  value?: T;
  error?: PluginExecutionError;
  durationMs: number;
}

export interface SandboxOptions {
  pluginId: string;
  label: string;
  /** Abort the plugin call after this many ms (default 15s). */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Execute `fn` with full fault isolation. Resolves with a SandboxResult that
 * is never rejected.
 */
export async function runSafely<T>(
  fn: () => T | Promise<T>,
  options: SandboxOptions,
): Promise<SandboxResult<T>> {
  const start = Date.now();
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const value = await withTimeout(Promise.resolve().then(fn), timeout, options);
    return { ok: true, value, durationMs: Date.now() - start };
  } catch (error) {
    const execError =
      error instanceof PluginExecutionError
        ? error
        : new PluginExecutionError(
            error instanceof Error ? error.message : String(error),
            options.pluginId,
            error,
          );
    return { ok: false, error: execError, durationMs: Date.now() - start };
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  options: SandboxOptions,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new PluginExecutionError(
          `${options.label} timed out after ${timeoutMs}ms`,
          options.pluginId,
        ),
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
