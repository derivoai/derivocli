# Sharing Derivo for Private Beta

This is the recommended workflow for getting Derivo onto other people's machines
before a public npm release.

## TL;DR — the easiest way to share with friends

```bash
cd apps/cli
pnpm pack:tgz            # -> derivo-0.1.0.tgz
```

Send them `derivo-0.1.0.tgz` (Slack, email, shared drive). They run:

```bash
npm install -g ./derivo-0.1.0.tgz
derivo doctor
```

That's it — no GitHub access, no registry, no build tools required.

## Recommended workflow for an organized private beta

Use a **GitHub Release with the tarball attached**. It gives you versioned,
shareable links and works on every machine.

1. Build and pack:
   ```bash
   cd apps/cli
   pnpm pack:tgz
   ```
2. Create a GitHub Release (tag `v0.1.0`) and upload `derivo-0.1.0.tgz`.
3. Share the install command with testers:
   ```bash
   npm install -g https://github.com/derivoai/derivocli/releases/download/v0.1.0/derivo-0.1.0.tgz
   ```

### Or: a dedicated distribution repo

If you want `npm install -g github:derivoai/derivocli` to "just work":

```bash
cd apps/cli
pnpm pack:standalone     # builds ./standalone/ with a committed dist
```

Push `apps/cli/standalone/*` to `derivoai/derivocli`. Testers install with:

```bash
npm install -g github:derivoai/derivocli
```

## What to ask beta testers to run

```bash
derivo doctor            # confirms install + environment health
derivo version --json    # capture for bug reports
derivo inspect           # on one of their real projects
derivo validate          # then validate it
```

If something fails, ask them to re-run with `--verbose` and share the output
plus `derivo version --json`.

## Collecting feedback safely

- Telemetry is **off by default**. Don't ask testers to enable it unless you
  have a transport and a privacy policy in place.
- Bug reports: `derivo doctor --json` + `derivo version --json` capture the
  environment without exposing secrets (env values are never printed).

## Promoting to public release

When ready, publish to npm via the gated release workflow
(`.github/workflows/release.yml`, manual `workflow_dispatch`). Testers then
switch to:

```bash
npm install -g derivo
```
