/**
 * Built-in plugin registry.
 *
 * Built-ins ship with the CLI and are registered in code (no filesystem
 * scan). Add a new built-in by appending it here.
 */
import type { DerivoPlugin, PluginManifest } from '../plugin-types/index.js';
import * as docker from './docker.plugin.js';
import * as express from './express.plugin.js';
import * as nextjs from './nextjs.plugin.js';
import * as react from './react.plugin.js';

export interface BuiltinPlugin {
  manifest: PluginManifest;
  plugin: DerivoPlugin;
}

export const BUILTIN_PLUGINS: BuiltinPlugin[] = [
  { manifest: react.manifest, plugin: react.plugin },
  { manifest: nextjs.manifest, plugin: nextjs.plugin },
  { manifest: express.manifest, plugin: express.plugin },
  { manifest: docker.manifest, plugin: docker.plugin },
];
