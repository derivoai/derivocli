# Installation Guide

Derivo is distributed as a global npm package.

## Requirements

- **Node.js 18 or newer** (`node --version`)
- npm, pnpm, yarn, or bun (any one is fine for installing)

## Install globally

```bash
npm install -g derivo
```

With pnpm or yarn:

```bash
pnpm add -g derivo
yarn global add derivo
```

## Verify the installation

```bash
derivo version
derivo doctor
```

`derivo doctor` checks your Node version, global installation, permissions,
config directory, plugin directory, and authentication.

## Updating

Derivo notifies you when a newer version is available. To update:

```bash
npm install -g derivo
```

To disable update notifications, set `DERIVO_NO_UPDATE_NOTIFIER=1` or add
`"updateCheck": false` to `~/.derivo/config.json`.

## Uninstalling

```bash
npm uninstall -g derivo
```

Your configuration lives in `~/.derivo` and is not removed automatically.

## Troubleshooting installs

- **`derivo: command not found`** — ensure your global npm bin directory is on
  your `PATH`. Run `npm bin -g` to find it.
- **Permission errors on install** — avoid `sudo`; instead configure a
  user-level npm prefix, or use a Node version manager (nvm, fnm, volta).

See the [Troubleshooting guide](./troubleshooting.md) for more.
