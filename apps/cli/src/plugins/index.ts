/**
 * Derivo Plugin Subsystem — Public barrel
 *
 * Internal consumers (CLI commands, tests) import from here. Plugin authors
 * should use `plugin-sdk` instead.
 */
export * from './plugin-types/index.js';
export * from './plugin-errors/index.js';
export {
  parseManifest,
  parseManifestJSON,
  manifestSchema,
  MANIFEST_FILENAME,
} from './plugin-manifest/index.js';
export { validateManifest, validateInstance } from './plugin-validator/index.js';
export type { ValidationOutcome } from './plugin-validator/index.js';
export { runSafely } from './plugin-sandbox/index.js';
export type { SandboxResult, SandboxOptions } from './plugin-sandbox/index.js';
export { PluginCache } from './plugin-cache/index.js';
export { HookBus } from './plugin-hooks/index.js';
export type { HookEmissionResult } from './plugin-hooks/index.js';
export { PluginRegistry } from './plugin-registry/index.js';
export { PluginLoader, defaultLocalPluginDirs } from './plugin-loader/index.js';
export type { LoaderOptions, LoadReport } from './plugin-loader/index.js';
export { createPluginContext } from './plugin-context/index.js';
export type { ContextFactoryOptions } from './plugin-context/index.js';
export { PluginRuntime } from './plugin-runtime/index.js';
export type { RuntimeOptions, CapabilityResult } from './plugin-runtime/index.js';
export { BUILTIN_PLUGINS } from './builtins/index.js';
export type { BuiltinPlugin } from './builtins/index.js';
// Author helpers (types already come from plugin-types above).
export { definePlugin, defineManifest } from './plugin-sdk/index.js';
