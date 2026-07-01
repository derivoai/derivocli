# Derivo Connection Architecture - Visual Guide

## 🎯 Overview

This document provides visual diagrams to understand how Derivo components connect to each other in different environments.

---

## 📍 Local Development Setup

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Your Development Machine                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────┐                                         │
│  │   Terminal 1           │                                         │
│  │   $ cd apps/api        │                                         │
│  │   $ pnpm dev           │                                         │
│  │   ✓ Backend Running    │                                         │
│  │   📍 localhost:3001    │                                         │
│  └────────────────────────┘                                         │
│              ▲                                                       │
│              │ HTTP API Requests                                    │
│              │                                                       │
│  ┌────────────────────────┐                                         │
│  │   Terminal 2           │                                         │
│  │   $ cd apps/web        │                                         │
│  │   $ pnpm dev           │                                         │
│  │   ✓ Frontend Running   │                                         │
│  │   📍 localhost:3000    │                                         │
│  │                        │                                         │
│  │   .env:                │                                         │
│  │   VITE_API_URL=        │                                         │
│  │   localhost:3001  ─────┼──────────────────┘                     │
│  └────────────────────────┘                                         │
│              ▲                                                       │
│              │ Browser                                              │
│              │                                                       │
│  ┌────────────────────────┐                                         │
│  │   Browser              │                                         │
│  │   http://localhost:3000│                                         │
│  │   👤 You               │                                         │
│  └────────────────────────┘                                         │
│              ▲                                                       │
│              │                                                       │
│  ┌────────────────────────┐                                         │
│  │   Terminal 3           │                                         │
│  │   $ cd apps/cli        │                                         │
│  │   $ derivo status      │                                         │
│  │                        │                                         │
│  │   (defaults to         │                                         │
│  │   localhost:3001) ─────┼──────────────────┐                     │
│  └────────────────────────┘                  │                     │
│                                               │ HTTP API Requests   │
│                                               ▼                     │
│                                    ┌────────────────────────┐      │
│                                    │   Backend API          │      │
│                                    │   localhost:3001       │      │
│                                    └────────────────────────┘      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Configuration:**
- Frontend: `VITE_API_URL=http://localhost:3001` in root `.env`
- Backend: No special config needed
- CLI: No config needed (defaults to localhost:3001)

---

## 🌐 Production Setup (Vercel - Separate Projects)

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Internet                                  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
    ┌──────────────────┐  ┌──────────────┐  ┌─────────────────┐
    │   Browser        │  │  CLI User    │  │  Mobile App     │
    │   (Web App)      │  │  (Terminal)  │  │  (Future)       │
    └──────────────────┘  └──────────────┘  └─────────────────┘
                │                │                │
                │                │                │
                │ HTTPS          │ HTTPS          │ HTTPS
                │                │                │
                ▼                │                │
    ┌────────────────────────────┐               │
    │  Vercel Project 1          │               │
    │  Frontend Hosting          │               │
    │  ─────────────────────     │               │
    │  app.yourdomain.com        │               │
    │  or                        │               │
    │  derivo-web.vercel.app     │               │
    │                            │               │
    │  Environment Variables:    │               │
    │  ┌──────────────────────┐  │               │
    │  │ VITE_API_URL=        │  │               │
    │  │ api.yourdomain.com ──┼──┼───────────┐   │
    │  │                      │  │           │   │
    │  │ APP_URL=             │  │           │   │
    │  │ app.yourdomain.com   │  │           │   │
    │  │                      │  │           │   │
    │  │ VITE_FIREBASE_*=xxx  │  │           │   │
    │  └──────────────────────┘  │           │   │
    └────────────────────────────┘           │   │
                                              │   │
                ┌─────────────────────────────┘   │
                │                                 │
                │ HTTPS API Requests              │ HTTPS
                │                                 │
                ▼                                 ▼
    ┌────────────────────────────────────────────────────────┐
    │  Vercel Project 2                                      │
    │  Backend Hosting                                       │
    │  ────────────────────                                  │
    │  api.yourdomain.com                                    │
    │  or                                                    │
    │  derivo-api.vercel.app                                 │
    │                                                        │
    │  Environment Variables:                                │
    │  ┌──────────────────────────────────────────────────┐  │
    │  │ APP_URL=app.yourdomain.com (for CORS)            │  │
    │  │ FIREBASE_PROJECT_ID=xxx                          │  │
    │  │ FIREBASE_CLIENT_EMAIL=xxx                        │  │
    │  │ FIREBASE_PRIVATE_KEY=xxx                         │  │
    │  │ RESEND_API_KEY=xxx                               │  │
    │  │ EMAIL_FROM=xxx                                   │  │
    │  └──────────────────────────────────────────────────┘  │
    │                                                        │
    │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
    │  │  Auth        │  │  Billing     │  │  Security  │  │
    │  │  ────        │  │  ────────    │  │  ─────────│  │
    │  │  Firebase    │  │  Subscription│  │  API Keys  │  │
    │  │  Admin SDK   │  │  Management  │  │  Sessions  │  │
    │  └──────────────┘  └──────────────┘  └────────────┘  │
    └────────────────────────────────────────────────────────┘
                │                │
                ▼                ▼
    ┌─────────────────┐  ┌─────────────────┐
    │  Firebase       │  │  Resend         │
    │  (Firestore DB) │  │  (Email)        │
    │  Google Cloud   │  │  Email Service  │
    └─────────────────┘  └─────────────────┘
```

**Configuration:**
- Frontend Vercel: `VITE_API_URL=https://api.yourdomain.com`
- Backend Vercel: `APP_URL=https://app.yourdomain.com`
- CLI Users: `DERIVO_API_URL=https://api.yourdomain.com`

---

## 🔄 Request Flow - Authentication

```
┌─────────────────────────────────────────────────────────────────────┐
│  Step-by-Step Authentication Flow                                   │
└─────────────────────────────────────────────────────────────────────┘

1. User Action (Login/Signup)
   │
   │   Web: Click "Sign In" button
   │   CLI: Run `derivo login`
   │
   ▼
2. Firebase Client SDK (Frontend/CLI)
   │
   │   • Validates email/password
   │   • Sends to Firebase Auth Service
   │   • Receives Firebase ID Token (JWT)
   │
   ▼
3. Client Makes API Request
   │
   │   POST /api/subscription
   │   Authorization: Bearer <firebase-token>
   │   Content-Type: application/json
   │
   ▼
4. Backend Receives Request
   │
   │   Express server at api.yourdomain.com
   │
   ▼
5. Auth Middleware (apps/api/src/auth.ts)
   │
   │   • Extracts Bearer token from Authorization header
   │   • Verifies token with Firebase Admin SDK
   │   • Checks token signature and expiration
   │   • Extracts user UID from token
   │   • Attaches UID to request: req.uid
   │
   ▼
6. Route Handler
   │
   │   • Access user data via req.uid
   │   • Check subscription status
   │   • Check feature limits
   │   • Process business logic
   │
   ▼
7. Database Query (Firestore)
   │
   │   • Read/Write user data
   │   • Update subscription info
   │   • Log activity
   │
   ▼
8. Response
   │
   │   HTTP 200 OK
   │   {
   │     "active": true,
   │     "planId": "pro",
   │     "status": "active"
   │   }
   │
   ▼
9. Client Receives Response
   │
   │   • Web: Updates UI state
   │   • CLI: Displays result
   │
   └── Complete ✓
```

---

## 🔐 Environment Variable Flow

### Development
```
.env (root directory)
    │
    ├─── Loaded by Vite for Frontend
    │    │
    │    ├──▶ VITE_API_URL
    │    ├──▶ VITE_FIREBASE_*
    │    └──▶ GEMINI_API_KEY
    │
    └─── Loaded by Node for Backend
         │
         ├──▶ FIREBASE_PROJECT_ID
         ├──▶ FIREBASE_CLIENT_EMAIL
         ├──▶ FIREBASE_PRIVATE_KEY
         ├──▶ RESEND_API_KEY
         └──▶ APP_URL
```

### Production
```
Vercel Dashboard
    │
    ├─── Frontend Project Environment Variables
    │    │
    │    ├──▶ VITE_API_URL → Exposed to browser
    │    ├──▶ VITE_FIREBASE_* → Exposed to browser
    │    └──▶ APP_URL → Exposed to browser
    │
    └─── Backend Project Environment Variables
         │
         ├──▶ FIREBASE_PROJECT_ID → Server only
         ├──▶ FIREBASE_CLIENT_EMAIL → Server only
         ├──▶ FIREBASE_PRIVATE_KEY → Server only (SECRET)
         ├──▶ RESEND_API_KEY → Server only (SECRET)
         └──▶ APP_URL → Server only
```

---

## 🛡️ Security Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Public (Browser)                             │
│  ─────────────────────────────────────────────────────────────────  │
│  • Frontend JavaScript (exposed to user)                            │
│  • VITE_* environment variables (exposed to user)                   │
│  • Firebase Client SDK (public API key - safe)                      │
│  • No secrets here - everything is visible!                         │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS + Bearer Token
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                         Private (Server)                             │
│  ─────────────────────────────────────────────────────────────────  │
│  • Backend Node.js server (not exposed)                             │
│  • FIREBASE_PRIVATE_KEY (SECRET - server only)                      │
│  • RESEND_API_KEY (SECRET - server only)                            │
│  • Firebase Admin SDK (full database access)                        │
│  • Business logic & authorization                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Admin SDK
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                    External Services                                 │
│  ─────────────────────────────────────────────────────────────────  │
│  • Firebase/Firestore (Google Cloud)                                │
│  • Resend (Email Service)                                           │
│  • OAuth Providers (Google, GitHub)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Important Security Notes:**
- ✅ `VITE_FIREBASE_API_KEY` is safe to expose (public by design)
- ⚠️ `FIREBASE_PRIVATE_KEY` must NEVER be exposed to frontend
- ⚠️ `RESEND_API_KEY` must remain server-side only
- ✅ All secrets are in backend environment variables only

---

## 📊 Deployment States

### State 1: Not Deployed (Local Dev)
```
┌────────────┐
│  Your PC   │
│  ────────  │
│  Frontend  │
│  Backend   │
│  CLI       │
└────────────┘
```

### State 2: Backend Deployed
```
┌────────────┐         ┌─────────────┐
│  Your PC   │────────▶│  Vercel     │
│  ────────  │  HTTPS  │  ─────────  │
│  Frontend  │         │  Backend    │
│  CLI       │         │             │
└────────────┘         └─────────────┘
```

### State 3: Both Deployed (Production)
```
┌────────────┐         ┌─────────────┐
│  Vercel    │────────▶│  Vercel     │
│  ────────  │  HTTPS  │  ─────────  │
│  Frontend  │         │  Backend    │
└────────────┘         └─────────────┘
      ▲
      │ HTTPS
      │
┌────────────┐
│  User PC   │
│  ────────  │
│  Browser   │
│  CLI       │
└────────────┘
```

---

## 🎯 Critical Connection Points

### Point 1: Frontend → Backend

**What connects them:**
```
Frontend Code:
  const API_BASE = import.meta.env.VITE_API_URL;
  fetch(`${API_BASE}/api/subscription`)

Configured by:
  VITE_API_URL environment variable
```

### Point 2: Backend → Frontend (CORS)

**What allows connection:**
```
Backend Code:
  app.use(cors({
    origin: process.env.APP_URL
  }))

Configured by:
  APP_URL environment variable
```

### Point 3: CLI → Backend

**What connects them:**
```
CLI Code:
  const base = process.env.DERIVO_API_URL 
              || config.apiUrl 
              || 'http://localhost:3001';

Configured by:
  DERIVO_API_URL env var or ~/.derivo/config.json
```

---

## ✅ Configuration Checklist

### Local Development
```
┌─────────────────────────────────────────┐
│  .env file in root directory            │
├─────────────────────────────────────────┤
│  ✓ VITE_API_URL=http://localhost:3001   │
│  ✓ VITE_FIREBASE_API_KEY=xxx            │
│  ✓ VITE_FIREBASE_AUTH_DOMAIN=xxx        │
│  ✓ VITE_FIREBASE_PROJECT_ID=xxx         │
│  ✓ VITE_FIREBASE_APP_ID=xxx             │
│  ✓ FIREBASE_PROJECT_ID=xxx              │
│  ✓ FIREBASE_CLIENT_EMAIL=xxx            │
│  ✓ FIREBASE_PRIVATE_KEY=xxx             │
│  ✓ RESEND_API_KEY=xxx                   │
│  ✓ EMAIL_FROM=xxx                       │
└─────────────────────────────────────────┘
```

### Production (Vercel)
```
┌─────────────────────────────────────────┐
│  Frontend Vercel Project Env Vars       │
├─────────────────────────────────────────┤
│  ✓ VITE_API_URL=https://api.domain.com  │
│  ✓ VITE_FIREBASE_API_KEY=xxx            │
│  ✓ VITE_FIREBASE_AUTH_DOMAIN=xxx        │
│  ✓ VITE_FIREBASE_PROJECT_ID=xxx         │
│  ✓ VITE_FIREBASE_APP_ID=xxx             │
│  ✓ APP_URL=https://app.domain.com       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Backend Vercel Project Env Vars        │
├─────────────────────────────────────────┤
│  ✓ APP_URL=https://app.domain.com       │
│  ✓ FIREBASE_PROJECT_ID=xxx              │
│  ✓ FIREBASE_CLIENT_EMAIL=xxx            │
│  ✓ FIREBASE_PRIVATE_KEY=xxx             │
│  ✓ RESEND_API_KEY=xxx                   │
│  ✓ EMAIL_FROM=xxx                       │
└─────────────────────────────────────────┘
```

---

## 🔍 Debugging Connection Issues

### Issue: Frontend can't reach backend

**Check in browser console:**
```javascript
console.log(import.meta.env.VITE_API_URL)
// Should show: https://api.yourdomain.com
```

**Check in Network tab:**
```
Look at API request URL
Should go to: https://api.yourdomain.com/api/...
Not to: http://localhost:3001/api/...
```

### Issue: CORS errors

**Check backend logs:**
```bash
vercel logs derivo-api --prod
```

**Look for:**
```
Origin 'https://app.yourdomain.com' in CORS whitelist: YES/NO
```

### Issue: CLI connects to wrong backend

**Check CLI configuration:**
```bash
echo $DERIVO_API_URL
# Should show: https://api.yourdomain.com

# Or check config file
cat ~/.derivo/config.json
# Should contain: {"apiUrl": "https://api.yourdomain.com"}
```

---

## 📚 Related Documentation

- [README.md](./README.md) - Project overview
- [QUICK_START.md](./QUICK_START.md) - Fast setup guide
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Deployment steps
- [ENV_VARS.md](./ENV_VARS.md) - Variable reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

---

**Need more help?**
See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive troubleshooting.
