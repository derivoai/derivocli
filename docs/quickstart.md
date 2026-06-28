# Quick Start

This walks through a typical first session with Derivo.

## 1. Install

```bash
npm install -g derivo
derivo version
```

## 2. Authenticate

```bash
derivo login
```

This opens your browser to sign in and stores an encrypted session in
`~/.derivo/session.json` (tied to your machine).

## 3. Understand a project

From inside a project directory:

```bash
derivo inspect
```

You'll see the framework, package manager, workspace layout, core stack,
detected capabilities (TypeScript, Docker, Prisma, …), risks, and
recommendations — each with a confidence score.

Useful variants:

```bash
derivo inspect --graph      # tree view of apps/packages
derivo inspect --deps       # core first-party dependencies + versions
derivo inspect --json       # machine-readable output
derivo inspect --verbose    # detector reasoning + plugin execution + timing
```

## 4. Validate and fix

```bash
derivo validate            # report issues + a health score
derivo validate --fix      # interactively apply safe, confirmed fixes
```

Fixes (lockfile conflicts, missing `.env`, `git init`, …) always ask for
confirmation before changing anything.

## 5. Set up the environment

```bash
derivo setup               # diagnostics, install deps, env, build check
derivo setup --verbose     # stream per-package install + build output
```

## 6. Diagnose anytime

```bash
derivo doctor              # machine + project health
derivo doctor --fix        # create missing directories, etc.
```

## Next steps

- Explore plugins: `derivo plugin list`
- Read the [CLI Reference](./cli-reference.md)
- Write your own plugin: [Plugin Authoring](./plugin-authoring.md)
