# Plugin Author Guide

Derivo is an extensible platform. Plugins participate in detection, validation,
inspection, and setup, and can subscribe to lifecycle hooks — all through a
typed SDK. Plugins never touch CLI internals; everything goes through the
`PluginContext`.

## Plugin types

- **Built-in** — ship with the CLI.
- **Local** — discovered from `~/.derivo/plugins/<name>/` or
  `<project>/.derivo/plugins/<name>/`.
- **npm** — reserved for a future release.

## Anatomy of a local plugin

A local plugin is a directory containing a manifest and an ESM entry module.

```
~/.derivo/plugins/my-plugin/
├── derivo-plugin.json
└── index.mjs
```

### Manifest (`derivo-plugin.json`)

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What it does",
  "author": "you",
  "apiVersion": "1",
  "entry": "./index.mjs",
  "permissions": ["filesystem"]
}
```

- `id` — lowercase, alphanumeric + dashes; must match the plugin's `id`.
- `apiVersion` — currently `"1"`.
- `permissions` — any of `filesystem`, `network`, `environment`, `process`,
  `prompt`. The context enforces these at runtime.

### Entry module

Export the plugin as `default` or as a named `plugin` export.

```js
export const plugin = {
  id: 'my-plugin',

  detect(ctx) {
    const pkg = ctx.fs.readJSON('package.json');
    const applies = !!pkg?.dependencies?.['my-lib'];
    return {
      applies,
      findings: applies ? [{ level: 'success', message: 'my-lib detected' }] : [],
    };
  },

  validate(ctx) {
    /* return { applies, findings, recommendations } */
  },

  inspect(ctx) {},
  setup(ctx) {},

  activate(ctx) {
    ctx.logger.debug('activated');
  },

  hooks: {
    afterInspect(ctx) {
      ctx.logger.debug('inspect finished');
    },
  },
};
```

With TypeScript, use the SDK for full typing:

```ts
import { definePlugin } from 'derivo/plugin-sdk';

export default definePlugin({
  id: 'my-plugin',
  detect(ctx) {
    return { applies: true };
  },
});
```

## Capabilities

Each is optional and runs inside a sandbox (errors and timeouts are isolated —
a failing plugin never crashes the CLI):

`detect` · `doctor` · `validate` · `setup` · `inspect` · `activate` ·
`deactivate`.

Return a `PluginResult`: `{ applies?, findings?, recommendations?, data? }`.

## Hooks

Subscribe without modifying core code:

`beforeInspect` · `afterInspect` · `beforeValidate` · `afterValidate` ·
`beforeDoctor` · `afterDoctor` · `beforeSetup` · `afterSetup`.

## The PluginContext

Provides: `logger`, `fs` (permission-gated), `prompt`, `config` (persisted,
namespaced), `timing`, `packageManager`, `environment` (variable names only —
values are never exposed), `workspace`, `analysis` (the shared project
analysis), `analyze()`, `validateProject()`, `host`, and `hasPermission()`.

## Managing plugins

```bash
derivo plugin list
derivo plugin info my-plugin
derivo plugin enable my-plugin
derivo plugin disable my-plugin
derivo plugin reload my-plugin
derivo plugin doctor
```
