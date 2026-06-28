# Distribution & Installation Methods

Derivo can be installed several ways depending on where you are in the release
lifecycle. For everyday users the npm registry is the goal; for private beta the
**local `.tgz`** is the simplest and most reliable.

| Method | Status | Best for |
| --- | --- | --- |
| Local `.tgz` | ✅ Works today | Private beta, sharing with friends |
| GitHub repo | ✅ Works (via distribution repo) | Open beta, no registry needed |
| npm registry | 🔜 Future | Public release |
| Private npm | 🔜 Future | Internal/enterprise distribution |

All methods install the **same prebuilt package** — no build toolchain is
required on the installing machine. Requires **Node.js 18+**.

---

## 1. Install from a local `.tgz` (recommended for beta)

Generate the package from the monorepo:

```bash
cd apps/cli
pnpm pack:tgz          # builds, then runs `npm pack`
# -> produces derivo-0.1.0.tgz
```

Share that file. Anyone can install it globally:

```bash
npm install -g ./derivo-0.1.0.tgz
derivo version
```

This works offline-friendly (only the 5 runtime deps are fetched) and ships a
committed `dist/`, so there's no compile step on the target machine.

## 2. Install from GitHub

The monorepo cannot be installed via `github:` directly (its `dist/` is
gitignored and its tsconfig is workspace-coupled). Use the **distribution repo**
workflow instead:

```bash
cd apps/cli
pnpm pack:standalone   # builds + assembles ./standalone/ with committed dist
```

Push the contents of `apps/cli/standalone/` to a dedicated repo
(e.g. `derivoai/derivocli`). Testers then install with:

```bash
npm install -g github:derivoai/derivocli
derivo version
```

Alternatively, attach the `.tgz` from method 1 to a **GitHub Release** and
install directly from the asset URL (no distribution repo needed):

```bash
npm install -g https://github.com/derivoai/derivocli/releases/download/v0.1.0/derivo-0.1.0.tgz
```

## 3. Install from npm (public beta)

Published under the `beta` dist-tag:

```bash
npm install -g derivo@beta
```

Once promoted to stable:

```bash
npm install -g derivo
```

## 4. Private npm (future)

For internal distribution, publish to a private registry and scope installs:

```bash
npm install -g derivo --registry=https://your-private-registry
```

---

## Verifying an installation

```bash
derivo version        # CLI + plugin API + Node compatibility
derivo doctor         # full installation + environment diagnostics
```

`derivo doctor` detects: missing/corrupt config, outdated config schema, a
broken plugin directory, missing runtime dependencies, permission issues, and
whether `derivo` is on your `PATH` — each with an actionable fix
(`derivo doctor --fix`).

## Updating

```bash
# whichever method you installed with:
npm install -g derivo                    # npm
npm install -g ./derivo-0.1.1.tgz        # newer .tgz
npm install -g github:derivoai/derivocli # GitHub (latest)
```

Derivo shows an update notice when a newer version is available. Disable with
`DERIVO_NO_UPDATE_NOTIFIER=1` or `"updateCheck": false` in `~/.derivo/config.json`.

## Uninstalling

```bash
npm uninstall -g derivo
```

Configuration in `~/.derivo` is left intact. Remove it manually if desired (see
the [Troubleshooting guide](./troubleshooting.md)).

## Package audit

To confirm a build ships only production files:

```bash
cd apps/cli
pnpm audit:package
```

This fails if any `src/`, `tests/`, sourcemaps, or config files would be
published, verifies the binary entry point and shebang, and checks the runtime
dependency set.
