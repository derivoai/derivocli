# Derivo Environment Variables Reference

Quick reference for all environment variables used across Derivo applications.

## Table of Contents
- [Backend API Variables](#backend-api-variables)
- [Frontend Web Variables](#frontend-web-variables)
- [CLI Variables](#cli-variables)
- [Connection Flow](#connection-flow)

---

## Backend API Variables

Location: Set in Vercel Dashboard for API project OR in root `.env` file for local development.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_URL` | No | `http://localhost:3000` | Frontend URL for CORS and OAuth callbacks |
| `PORT` | No | `3001` | Port for the API server to listen on |
| `FIREBASE_PROJECT_ID` | **Yes*** | - | Firebase project ID from service account JSON |
| `FIREBASE_CLIENT_EMAIL` | **Yes*** | - | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | **Yes*** | - | Firebase service account private key (with `\n`) |
| `EMAIL_PROVIDER` | No | `none` | Email provider: `resend` or `none` |
| `RESEND_API_KEY` | If `EMAIL_PROVIDER=resend` | - | Resend API key for email delivery |
| `EMAIL_FROM` | If `EMAIL_PROVIDER=resend` | - | Sender email address (must be verified domain) |
| `AUTH_ACTION_URL` | No | - | URL for Firebase email action links |
| `MAX_ACCOUNTS_PER_IP` | No | `3` | Max accounts per IP in window (0=disabled) |
| `MAX_ACCOUNTS_PER_IP_WINDOW_DAYS` | No | `30` | Sliding window for IP rate limiting (days) |
| `INHERIT_TRIAL_ON_REREGISTER` | No | `true` | Carry over trial status for same email |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | - | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | - | GitHub OAuth client secret |

\* Without Firebase credentials, the API runs in **MOCK MODE** (accepts any token, treats all users as subscribed).

---

## Frontend Web Variables

Location: Set in Vercel Dashboard for Web project OR in root `.env` file for local development.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes** | `http://localhost:3001` | **Backend API endpoint URL** |
| `APP_URL` | No | `http://localhost:3000` | Frontend application URL |
| `VITE_FIREBASE_API_KEY` | **Yes** | - | Firebase client SDK API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | - | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | - | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | **Yes** | - | Firebase app ID |
| `VITE_FIREBASE_MOCK` | No | `false` | Enable Firebase mock mode (dev only) |
| `GEMINI_API_KEY` | No | - | Gemini API key for AI features |

### How Frontend Connects to Backend

The frontend (`apps/web/src/lib/api.ts`) determines the backend URL in this order:

1. `VITE_API_URL` environment variable
2. `VITE_DERIVO_API_URL` environment variable (fallback)
3. Default: `http://localhost:3001`

**For separate hosting on Vercel:**
```env
# Frontend environment variables
VITE_API_URL=https://your-backend-domain.vercel.app
```

---

## CLI Variables

Location: User's shell environment OR `~/.derivo/config.json`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DERIVO_API_URL` | No | `http://localhost:3001` | **Backend API endpoint URL** |

### How CLI Connects to Backend

The CLI (`apps/cli/src/utils/api.ts`) determines the backend URL in this order:

1. `DERIVO_API_URL` environment variable
2. `apiUrl` in `~/.derivo/config.json`
3. Default: `http://localhost:3001`

**For production usage:**

Option A - Environment variable:
```bash
# Linux/macOS
export DERIVO_API_URL=https://your-backend-domain.vercel.app

# Windows (PowerShell)
$env:DERIVO_API_URL="https://your-backend-domain.vercel.app"
```

Option B - Config file (`~/.derivo/config.json`):
```json
{
  "apiUrl": "https://your-backend-domain.vercel.app"
}
```

---

## Connection Flow

### Local Development

```
┌─────────────────────┐         ┌──────────────────────┐
│   Frontend          │────────▶│   Backend            │
│   localhost:3000    │  HTTP   │   localhost:3001     │
│   VITE_API_URL=     │         │                      │
│   localhost:3001    │         │                      │
└─────────────────────┘         └──────────────────────┘
         │                               ▲
         │                               │
         ▼                               │
┌─────────────────────┐                 │
│   CLI               │─────────────────┘
│   DERIVO_API_URL=   │     HTTP
│   localhost:3001    │
└─────────────────────┘
```

### Production (Separate Hosting)

```
┌─────────────────────┐         ┌──────────────────────┐
│   Frontend          │────────▶│   Backend            │
│   Vercel App 1      │  HTTPS  │   Vercel App 2       │
│   VITE_API_URL=     │         │   api.yourdomain.com │
│   api.yourdomain.com│         │                      │
└─────────────────────┘         └──────────────────────┘
         │                               ▲
         │                               │
         ▼                               │
┌─────────────────────┐                 │
│   CLI (User)        │─────────────────┘
│   DERIVO_API_URL=   │     HTTPS
│   api.yourdomain.com│
└─────────────────────┘
```

---

## Quick Setup Guide

### 1. Local Development

**Root `.env` file:**
```env
# Frontend URL
APP_URL=http://localhost:3000

# Backend API URL
VITE_API_URL=http://localhost:3001
PORT=3001

# Firebase Client (for web)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_MOCK=false

# Firebase Admin (for API)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx

# Email (optional for dev)
EMAIL_PROVIDER=none
```

**Start both:**
```bash
# Terminal 1 - Backend
cd apps/api
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev

# Terminal 3 - CLI (uses backend at localhost:3001 by default)
cd apps/cli
pnpm build
derivo status
```

### 2. Production (Vercel - Separate Hosting)

**Backend Vercel Project Environment Variables:**
```env
APP_URL=https://app.yourdomain.com
PORT=3001
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
EMAIL_PROVIDER=resend
RESEND_API_KEY=xxx
EMAIL_FROM=Derivo <noreply@yourdomain.com>
AUTH_ACTION_URL=https://auth.yourdomain.com/action
MAX_ACCOUNTS_PER_IP=10
MAX_ACCOUNTS_PER_IP_WINDOW_DAYS=30
INHERIT_TRIAL_ON_REREGISTER=true
```

**Frontend Vercel Project Environment Variables:**
```env
VITE_API_URL=https://api.yourdomain.com
APP_URL=https://app.yourdomain.com
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_MOCK=false
GEMINI_API_KEY=xxx
```

**CLI Users (add to shell profile):**
```bash
export DERIVO_API_URL=https://api.yourdomain.com
```

---

## Environment Variable Prefixes

Understanding Vite's environment variable handling:

| Prefix | Exposed to | Description |
|--------|------------|-------------|
| `VITE_` | Frontend browser | Automatically exposed by Vite to `import.meta.env` |
| No prefix | Backend only | Server-side only, never exposed to browser |

**Example:**
- `VITE_API_URL` → Available in frontend as `import.meta.env.VITE_API_URL`
- `FIREBASE_PRIVATE_KEY` → Backend only, never exposed to frontend (secure)

The Vite config (`apps/web/vite.config.ts`) also manually exposes:
- `GEMINI_API_KEY` → `import.meta.env.GEMINI_API_KEY`
- `APP_URL` → `import.meta.env.APP_URL`
- `VITE_API_URL` → `import.meta.env.VITE_DERIVO_API_URL` (alias)

---

## Validation

### Check Frontend Connection

Open browser DevTools → Console:
```javascript
// Check what API URL the frontend is using
console.log(import.meta.env.VITE_API_URL);
```

Or inspect the Network tab to see where API requests are going.

### Check CLI Connection

```bash
# Set verbose logging (if available)
DERIVO_API_URL=https://api.yourdomain.com derivo status

# Or check config
cat ~/.derivo/config.json
```

### Test Backend Health

```bash
# Local
curl http://localhost:3001/health

# Production
curl https://api.yourdomain.com/health
```

---

## Common Issues

### Issue: Frontend makes requests to localhost instead of production backend

**Cause:** `VITE_API_URL` not set in Vercel environment variables

**Fix:** Add `VITE_API_URL=https://api.yourdomain.com` to frontend Vercel project and redeploy

### Issue: CLI connects to localhost instead of production

**Cause:** `DERIVO_API_URL` not set in user's environment

**Fix:** User needs to set:
```bash
export DERIVO_API_URL=https://api.yourdomain.com
```
Or create `~/.derivo/config.json` with the production URL.

### Issue: CORS errors in browser

**Cause:** Backend doesn't allow frontend domain

**Fix:** Set `APP_URL` on backend to match frontend domain and ensure CORS middleware includes it

### Issue: Environment variables not working after change

**Cause:** Vercel needs redeploy to pick up new environment variables

**Fix:** Redeploy the project:
```bash
vercel --prod
```

---

## Security Notes

1. **Never commit `.env` to git** - Use `.env.example` as template
2. **Backend credentials are secret** - Only set in Vercel, never in frontend
3. **Frontend variables are public** - Any `VITE_` prefixed variable is visible in browser
4. **Firebase Admin key** - Only backend should have this, it grants full access
5. **API keys rotation** - Rotate keys regularly, especially after security incidents

---

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Resend API Keys](https://resend.com/docs/dashboard/api-keys/introduction)
