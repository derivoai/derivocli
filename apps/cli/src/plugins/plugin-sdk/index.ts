/**
 * Derivo Plugin SDK — Author-facing entry point
 *
 * Plugin authors import from here. It exposes ONLY the stable contract and a
 * couple of authoring helpers — never CLI internals.
 *
 *   import { definePlugin } from '@derivo/cli/plugins/plugin-sdk';
 *
 *   export default definePlugin({
 *     id: 'my-plugin',
 *     detect(ctx) { ... },
 *   });
 */
import {
  SUPPORTED_API_VERSION,
  type DerivoPlugin,
  type PluginManifest,
} from '../plugin-types/index.js';

export type {
  DerivoPlugin,
  PluginContext,
  PluginManifest,
  PluginPermission,
  PluginResult,
  PluginFinding,
  PluginCapability,
  HookName,
  PluginLogger,
  PluginFileSystem,
  PluginPrompt,
  PluginConfigStore,
  PluginTiming,
} from '../plugin-types/index.js';

export { SUPPORTED_API_VERSION };

/** Identity helper that gives plugin authors full type-checking. */
export function definePlugin(plugin: DerivoPlugin): DerivoPlugin {
  return plugin;
}

/** Build a manifest with the current API version pre-filled. */
export function defineManifest(
  manifest: Omit<PluginManifest, 'apiVersion'> & { apiVersion?: string },
): PluginManifest {
  return { apiVersion: SUPPORTED_API_VERSION, ...manifest };
}
