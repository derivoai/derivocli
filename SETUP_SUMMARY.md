# Backend URL Configuration Setup - Summary

## What Was Done

This document summarizes the changes made to enable separate frontend/backend hosting with proper environment variable configuration.

## Changes Made

### 1. Environment Files Updated

#### `.env.example`
Added comprehensive documentation for backend URL configuration:
- `VITE_API_URL` - Used by web app to connect to backend
- `DERIVO_API_URL` - Alternative name for CLI usage
- Clear instructions for local vs. production usage

#### `.env`
Added `VITE_API_URL=http://localhost:3001` for local development.

### 2. Vite Configuration Enhanced

**File:** `apps/web/vite.config.ts`

Added automatic exposure of `VITE_DERIVO_API_URL` as an alias:
```typescript
define: {
  'import.meta.env.VITE_DERIVO_API_URL': JSON.stringify(
    env.VITE_API_URL || env.DERIVO_API_URL || 'http://localhost:3001'
  ),
}
```

This ensures the frontend can access the backend URL through multiple environment variable names.

### 3. Documentation Created

#### `DEPLOYMENT.md` (Comprehensive Guide)
- Complete step-by-step Vercel deployment instructions
- Environment variable configuration for both projects
- Firebase setup instructions
- CORS configuration
- CLI user setup
- Troubleshooting section
- Security checklist
- Custom domain setup

#### `ENV_VARS.md` (Reference)
- Complete list of all environment variables
- Detailed descriptions and defaults
- Connection flow diagrams
- Quick setup guides
- Platform-specific instructions
- Common issues and solutions

#### `QUICK_START.md` (Fast Reference)
- Quick local development setup
- Quick production deployment
- Critical checklists
- Verification steps
- Common issues with fixes

#### `README.md` (Main Documentation)
- Complete project overview
- Architecture explanation
- Quick start guide
- Development instructions
- Troubleshooting section

### 4. No Code Changes Required

**Important:** No changes to actual application code were needed because:

1. **Frontend (`apps/web/src/lib/api.ts`)** already checks:
   ```typescript
   const API_BASE = (
     (import.meta.env.VITE_API_URL as string) ||
     (import.meta.env.VITE_DERIVO_API_URL as string) ||
     'http://localhost:3001'
   ).replace(/\/+$/, '');
   ```

2. **CLI (`apps/cli/src/utils/api.ts`)** already checks:
   ```typescript
   export function getApiBaseUrl(): string {
     const fromEnv = process.env.DERIVO_API_URL?.trim();
     if (fromEnv) return fromEnv.replace(/\/+$/, '');
     const fromConfig = getGlobalConfig().apiUrl?.trim();
     if (fromConfig) return fromConfig.replace(/\/+$/, '');
     return DEFAULT_API_URL;
   }
   ```

The code already supported environment-based backend URL configuration! We just documented it and updated the environment files.

## How It Works

### Local Development

**Backend runs at:** `http://localhost:3001`

**Frontend configuration (`.env`):**
```env
VITE_API_URL=http://localhost:3001
```

**CLI configuration:**
- No configuration needed (defaults to localhost:3001)
- Or set: `export DERIVO_API_URL=http://localhost:3001`

### Production (Separate Vercel Apps)

**Backend Vercel Project:**
- Deployed to: `https://derivo-api.vercel.app` (or custom domain)
- Environment variables: Firebase Admin, Resend, etc.
- `APP_URL` set to frontend domain (for CORS)

**Frontend Vercel Project:**
- Deployed to: `https://derivo-web.vercel.app` (or custom domain)
- **Critical:** `VITE_API_URL=https://derivo-api.vercel.app`
- Other: Firebase Client SDK variables

**CLI (End Users):**
- Set environment variable: `export DERIVO_API_URL=https://derivo-api.vercel.app`
- Or create `~/.derivo/config.json` with backend URL

## Connection Architecture

```
Production Setup:
┌─────────────────────────────────┐
│  Frontend Vercel Project        │
│  derivo-web.vercel.app          │
│                                 │
│  Env: VITE_API_URL=             │
│    https://derivo-api.vercel.app│
└────────────┬────────────────────┘
             │
             │ HTTPS API Requests
             │
             ▼
┌─────────────────────────────────┐
│  Backend Vercel Project         │
│  derivo-api.vercel.app          │
│                                 │
│  Env: APP_URL=                  │
│    https://derivo-web.vercel.app│
│  (for CORS)                     │
└────────────▲────────────────────┘
             │
             │ HTTPS API Requests
             │
┌────────────┴────────────────────┐
│  CLI (User's Machine)           │
│                                 │
│  Env: DERIVO_API_URL=           │
│    https://derivo-api.vercel.app│
│  or ~/.derivo/config.json       │
└─────────────────────────────────┘
```

## Key Environment Variables

### For Frontend
| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API endpoint | `https://api.yourdomain.com` |
| `APP_URL` | Frontend URL (for Firebase) | `https://app.yourdomain.com` |

### For Backend
| Variable | Purpose | Example |
|----------|---------|---------|
| `APP_URL` | Frontend URL (for CORS) | `https://app.yourdomain.com` |
| `PORT` | Server listen port | `3001` |

### For CLI Users
| Variable | Purpose | Example |
|----------|---------|---------|
| `DERIVO_API_URL` | Backend API endpoint | `https://api.yourdomain.com` |

## Testing Checklist

### Local Development
- [ ] Backend starts: `cd apps/api && pnpm dev`
- [ ] Frontend starts: `cd apps/web && pnpm dev`
- [ ] Frontend can sign up/login (check Network tab)
- [ ] CLI can connect: `derivo status`

### Production
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] `VITE_API_URL` set in frontend Vercel env
- [ ] Frontend can sign up/login (no CORS errors)
- [ ] CLI can connect with `DERIVO_API_URL` set
- [ ] Email delivery works
- [ ] Firebase authentication works

## Files Modified

✅ `.env.example` - Added backend URL documentation
✅ `.env` - Added `VITE_API_URL` for local dev
✅ `apps/web/vite.config.ts` - Added VITE_DERIVO_API_URL exposure
✅ `README.md` - Complete rewrite with deployment info
📝 `DEPLOYMENT.md` - Created (comprehensive deployment guide)
📝 `ENV_VARS.md` - Created (environment variables reference)
📝 `QUICK_START.md` - Created (quick reference)
📝 `SETUP_SUMMARY.md` - Created (this document)

## No Changes Needed To

✅ `apps/web/src/lib/api.ts` - Already supports VITE_API_URL
✅ `apps/cli/src/utils/api.ts` - Already supports DERIVO_API_URL
✅ `apps/api/src/**` - Backend doesn't need changes
✅ Any React components - Frontend API client handles connection
✅ Any CLI commands - CLI API client handles connection

## Next Steps for Deployment

1. **Deploy Backend to Vercel:**
   ```bash
   cd apps/api
   vercel
   ```
   Note the deployment URL (e.g., `https://derivo-api-xxx.vercel.app`)

2. **Configure Backend Environment Variables in Vercel Dashboard:**
   - Firebase Admin credentials
   - Resend API key
   - `APP_URL` (set to frontend URL)

3. **Deploy Frontend to Vercel:**
   ```bash
   cd apps/web
   vercel
   ```

4. **Configure Frontend Environment Variables in Vercel Dashboard:**
   - **`VITE_API_URL`** (set to backend URL from step 1) ⚠️ **CRITICAL**
   - Firebase Client SDK credentials
   - `APP_URL` (set to frontend URL)

5. **Verify Deployment:**
   - Test frontend → backend connection
   - Check for CORS errors (should be none)
   - Test authentication flow

6. **CLI Users - Distribute Instructions:**
   Add to CLI documentation:
   ```bash
   export DERIVO_API_URL=https://derivo-api-xxx.vercel.app
   ```

## Benefits of This Setup

✅ **Flexibility** - Frontend and backend can be hosted separately
✅ **Scalability** - Each can scale independently
✅ **Cost-Effective** - Use free tiers for both
✅ **Easy Updates** - Deploy each independently
✅ **Custom Domains** - Assign different domains to each
✅ **Regional Deployment** - Deploy to different regions
✅ **Development/Production Parity** - Same code, different configs

## Documentation Structure

```
Derivo/
├── README.md              # Main project documentation
├── QUICK_START.md         # Fast reference for setup
├── DEPLOYMENT.md          # Comprehensive deployment guide
├── ENV_VARS.md            # Complete environment variables reference
├── SETUP_SUMMARY.md       # This document (what was done)
├── .env.example           # Environment template
└── .env                   # Local environment (not in git)
```

## Support and Troubleshooting

If issues arise:

1. Check `VITE_API_URL` is set correctly in frontend
2. Verify backend is accessible: `curl https://backend-url/health`
3. Check CORS configuration includes frontend domain
4. Review [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
5. Verify all environment variables in Vercel Dashboard

## Summary

The Derivo codebase already supported separate hosting with environment-based backend URL configuration. We've now:

1. ✅ Documented the configuration extensively
2. ✅ Updated environment file templates
3. ✅ Created comprehensive deployment guides
4. ✅ Enhanced Vite configuration for better compatibility
5. ✅ Provided troubleshooting resources

**No application code changes were required** - the architecture was already designed correctly!

---

**Created:** $(date)
**Version:** 1.0
**Status:** Ready for Deployment
