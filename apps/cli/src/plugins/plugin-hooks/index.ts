/**
 * Derivo Plugin SDK — Hook Bus
 *
 * Lets plugins subscribe to core command phases (beforeInspect, afterValidate,
 * …) without touching core code. Emission runs every subscriber through the
 * sandbox so one failing hook never breaks the command or other plugins.
 */
import { runSafely, type SandboxResult } from '../plugin-sandbox/index.js';
import { HOOK_NAMES, type HookName, type PluginContext } from '../plugin-types/index.js';

type HookListener = (ctx: PluginContext) => unknown | Promise<unknown>;

interface Subscription {
  pluginId: string;
  listener: HookListener;
}

export interface HookEmissionResult {
  hook: HookName;
  pluginId: string;
  result: SandboxResult<unknown>;
}

export class HookBus {
  private readonly listeners = new Map<HookName, Subscription[]>();

  constructor() {
    for (const name of HOOK_NAMES) this.listeners.set(name, []);
  }

  on(hook: HookName, pluginId: string, listener: HookListener): void {
    this.listeners.get(hook)!.push({ pluginId, listener });
  }

  /** Remove all subscriptions registered by a plugin (used on disable/reload). */
  offPlugin(pluginId: string): void {
    for (const [hook, subs] of this.listeners.entries()) {
      this.listeners.set(
        hook,
        subs.filter((s) => s.pluginId !== pluginId),
      );
    }
  }

  count(hook: HookName): number {
    return this.listeners.get(hook)?.length ?? 0;
  }

  /**
   * Emit a hook. Each subscriber runs in the sandbox; results (including
   * failures) are collected and returned. Never throws.
   */
  async emit(
    hook: HookName,
    contextFor: (pluginId: string) => PluginContext,
  ): Promise<HookEmissionResult[]> {
    const subs = this.listeners.get(hook) ?? [];
    const results: HookEmissionResult[] = [];
    for (const sub of subs) {
      const result = await runSafely(() => sub.listener(contextFor(sub.pluginId)), {
        pluginId: sub.pluginId,
        label: `hook ${hook}`,
      });
      results.push({ hook, pluginId: sub.pluginId, result });
    }
    return results;
  }

  clear(): void {
    for (const name of HOOK_NAMES) this.listeners.set(name, []);
  }
}
