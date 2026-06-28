# Publishing Derivo (Public Beta)

Derivo ships as a **public** npm package. This is safe because security is
enforced by the backend and Firestore Security Rules — not by the CLI. Anyone
can read the published JavaScript, but a forked/patched CLI gains nothing: the
server still rejects unauthorized requests.

The beta is published under the **`beta`** dist-tag so the bare `derivo` name
(the `latest` tag) stays free for the stable release.

---

## 1. One-time: deploy Firestore Security Rules

This is the database-level enforcement. Do it **before** the public beta.

```bash
npm install -g firebase-tools
firebase login
firebase use derivo            # your Firebase project id
firebase deploy --only firestore:rules
```

Rules live in `firestore.rules`. They ensure:
- users read/write only their own data,
- `subscriptions`/`trials` are backend-only (clients can't grant themselves a plan),
- creating project records requires an active subscription.

## 2. One-time: deploy the backend

The CLI's premium gate calls `GET /api/cli/verify` on the backend. Host
`apps/api` somewhere reachable (VPS, Render, Fly, etc.) with Firebase Admin
credentials set in its environment. Note its public URL — testers point the CLI
at it via `DERIVO_API_URL` or `~/.derivo/config.json` (`apiUrl`). Default is
`http://localhost:3001` for local beta.

## 3. Publish the CLI to npm

```bash
# from the repo root
pnpm install
pnpm build

cd apps/cli
pnpm audit:package          # verify production-only contents
npm login                   # your npm account

# publish under the "beta" tag (configured in package.json publishConfig)
pnpm publish --no-git-checks --access public
```

> CI alternative: run the **Release** GitHub Action
> (`.github/workflows/release.yml`) with `dry_run: false`. It needs an
> `NPM_TOKEN` secret.

## 4. How testers install the public beta

```bash
npm install -g derivo@beta
derivo version
derivo doctor
```

(When you promote to stable, `npm install -g derivo` will work for everyone.)

## 5. Releasing updates

```bash
cd apps/cli
npm version prerelease --preid=beta   # 0.1.0-beta.1 -> 0.1.0-beta.2
pnpm build && pnpm audit:package
pnpm publish --no-git-checks --access public
```

## 6. Promoting beta to stable (later)

```bash
# set the version to a stable release first (e.g. 0.1.0), publish to latest:
cd apps/cli
npm version 0.1.0
pnpm build
pnpm publish --no-git-checks --access public --tag latest
```

---

## Security checklist before going public

- [ ] Firestore Rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Backend deployed and reachable; Firebase Admin creds configured
- [ ] `derivo doctor` passes on a clean machine
- [ ] `pnpm audit:package` shows no dev files
- [ ] Premium commands fail closed when the backend is unreachable (verified)
- [ ] No secrets in the published package (`.env` is never bundled)
