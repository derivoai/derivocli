# Derivo Deployment Guide

This guide explains how to deploy Derivo with separate frontend and backend hosting on Vercel.

## Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────┐
│   Frontend (Web)    │────────▶│   Backend (API)      │
│   Vercel App 1      │  HTTPS  │   Vercel App 2       │
│   apps/web          │         │   apps/api           │
└─────────────────────┘         └──────────────────────┘
         │                               ▲
         │                               │
         ▼                               │
┌─────────────────────┐                 │
│   CLI (Local)       │─────────────────┘
│   apps/cli          │     HTTPS
└─────────────────────┘
```

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Firebase Project**: Set up at [firebase.google.com](https://firebase.google.com)
3. **Resend Account** (for emails): Get API key from [resend.com](https://resend.com)
4. **Custom Domains** (recommended):
   - Frontend: `app.yourdomain.com`
   - Backend: `api.yourdomain.com`

---

## Step 1: Deploy Backend API

### 1.1 Create New Vercel Project for Backend

```bash
# Navigate to the API directory
cd apps/api

# Deploy to Vercel
vercel
```

Follow the prompts:
- **Set up and deploy?** Y
- **Which scope?** Your Vercel account
- **Link to existing project?** N
- **Project name:** derivo-api (or your choice)
- **Directory:** `./` (current directory)
- **Override settings?** N

### 1.2 Configure Backend Environment Variables

Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables

Add these variables for **Production**:

```env
# App Configuration
APP_URL=https://app.yourdomain.com
PORT=3001

# Firebase Admin SDK (REQUIRED)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n

# Email (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Derivo <noreply@yourdomain.com>
AUTH_ACTION_URL=https://auth.yourdomain.com/action

# Account Abuse Prevention
MAX_ACCOUNTS_PER_IP=10
MAX_ACCOUNTS_PER_IP_WINDOW_DAYS=30
INHERIT_TRIAL_ON_REREGISTER=true

# Optional: OAuth (if using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

**Important Notes:**
- Get Firebase credentials from: Firebase Console → Settings → Service Accounts → Generate Private Key
- The `FIREBASE_PRIVATE_KEY` must include `\n` sequences and be wrapped in quotes
- Set `APP_URL` to your **frontend** domain (for CORS)

### 1.3 Redeploy Backend

```bash
vercel --prod
```

Your backend will be available at: `https://derivo-api.vercel.app` (or your custom domain)

---

## Step 2: Deploy Frontend (Web App)

### 2.1 Create New Vercel Project for Frontend

```bash
# Navigate to the web directory
cd apps/web

# Deploy to Vercel
vercel
```

Follow the prompts:
- **Set up and deploy?** Y
- **Which scope?** Your Vercel account
- **Link to existing project?** N
- **Project name:** derivo-web (or your choice)
- **Directory:** `./` (current directory)
- **Override settings?** N

### 2.2 Configure Frontend Environment Variables

Go to Vercel Dashboard → Your Frontend Project → Settings → Environment Variables

Add these variables for **Production**:

```env
# Backend API URL (REQUIRED - points to your backend deployment)
VITE_API_URL=https://derivo-api.vercel.app

# App URL (your frontend domain)
APP_URL=https://app.yourdomain.com

# Firebase Client SDK
VITE_FIREBASE_API_KEY=AIzaSyCNv8mVHs3LF3nNrU7dy0If3GESnilBtmM
VITE_FIREBASE_AUTH_DOMAIN=derivo-e8c82.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=derivo
VITE_FIREBASE_APP_ID=1:290795143643:web:ca15a0ec196fcd4f50a7fe
VITE_FIREBASE_MOCK=false

# Optional: Gemini API (for AI features)
GEMINI_API_KEY=
```

**Critical:** Replace `VITE_API_URL` with your actual backend URL from Step 1.

### 2.3 Redeploy Frontend

```bash
vercel --prod
```

Your frontend will be available at: `https://derivo-web.vercel.app` (or your custom domain)

---

## Step 3: Configure CLI for Production Backend

Users of your CLI need to point to the production backend.

### Method 1: Environment Variable (Recommended for End Users)

Users can set the backend URL in their shell:

```bash
# Linux/macOS
export DERIVO_API_URL=https://derivo-api.vercel.app

# Windows (PowerShell)
$env:DERIVO_API_URL="https://derivo-api.vercel.app"

# Windows (CMD)
set DERIVO_API_URL=https://derivo-api.vercel.app
```

### Method 2: Global Configuration File

Users can create `~/.derivo/config.json`:

```json
{
  "apiUrl": "https://derivo-api.vercel.app"
}
```

### Method 3: Package Default (For Distribution)

Update `apps/cli/src/utils/api.ts` to change the default:

```typescript
export const DEFAULT_API_URL = 'https://derivo-api.vercel.app';
```

Then rebuild and publish:

```bash
cd apps/cli
pnpm build
pnpm pack
```

---

## Step 4: Update Firebase Configuration

### 4.1 Add Authorized Domains

Go to Firebase Console → Authentication → Settings → Authorized Domains

Add your domains:
- `app.yourdomain.com` (frontend)
- `api.yourdomain.com` (backend)
- `derivo-web.vercel.app` (Vercel preview)
- `derivo-api.vercel.app` (Vercel preview)

### 4.2 Update OAuth Redirect URLs (If Using OAuth)

For Google OAuth:
- Go to Google Cloud Console → Credentials
- Add authorized redirect URIs:
  - `https://app.yourdomain.com/__/auth/handler`
  - `https://derivo-e8c82.firebaseapp.com/__/auth/handler`

For GitHub OAuth:
- Go to GitHub Settings → Developer Settings → OAuth Apps
- Update Authorization callback URL:
  - `https://app.yourdomain.com/__/auth/handler`

---

## Step 5: Configure CORS (Backend)

Ensure your backend API allows requests from your frontend domain.

In `apps/api/src/app.ts`, verify CORS configuration:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://app.yourdomain.com',
    'https://derivo-web.vercel.app',
    process.env.APP_URL,
  ].filter(Boolean),
  credentials: true,
}));
```

---

## Step 6: Test the Deployment

### 6.1 Test Frontend → Backend Connection

1. Open your frontend: `https://app.yourdomain.com`
2. Open browser DevTools → Network tab
3. Try to sign up or log in
4. Verify API requests are going to: `https://api.yourdomain.com`
5. Check for CORS errors (should be none)

### 6.2 Test CLI → Backend Connection

```bash
# Set the backend URL
export DERIVO_API_URL=https://api.yourdomain.com

# Test CLI commands
derivo status
derivo login
```

### 6.3 Verify Email Delivery

1. Sign up with a new account
2. Check that verification email arrives
3. Verify the email action links point to your domain

---

## Environment Variable Summary

### Backend (API) - Vercel Project 1

```env
APP_URL=https://app.yourdomain.com
PORT=3001
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx
EMAIL_FROM=Derivo <noreply@yourdomain.com>
AUTH_ACTION_URL=https://auth.yourdomain.com/action
MAX_ACCOUNTS_PER_IP=10
MAX_ACCOUNTS_PER_IP_WINDOW_DAYS=30
INHERIT_TRIAL_ON_REREGISTER=true
```

### Frontend (Web) - Vercel Project 2

```env
VITE_API_URL=https://api.yourdomain.com
APP_URL=https://app.yourdomain.com
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_MOCK=false
GEMINI_API_KEY=xxx (optional)
```

### CLI (User Environment)

```env
DERIVO_API_URL=https://api.yourdomain.com
```

---

## Troubleshooting

### Issue: Frontend can't reach backend

**Symptoms:** Network errors, "Cannot reach backend" messages

**Solutions:**
1. Verify `VITE_API_URL` is set correctly in frontend environment variables
2. Check CORS configuration in backend
3. Ensure backend is deployed and accessible
4. Check browser DevTools → Network tab for actual error

### Issue: CORS errors

**Symptoms:** "Access-Control-Allow-Origin" errors in browser console

**Solutions:**
1. Add frontend domain to CORS whitelist in `apps/api/src/app.ts`
2. Ensure `APP_URL` environment variable is set correctly on backend
3. Redeploy backend after CORS changes

### Issue: CLI can't reach backend

**Symptoms:** "ApiUnreachableError" messages

**Solutions:**
1. Set `DERIVO_API_URL` environment variable
2. Or create `~/.derivo/config.json` with `apiUrl` field
3. Verify backend URL is accessible: `curl https://api.yourdomain.com/health`

### Issue: Firebase authentication errors

**Symptoms:** "Firebase: Error (auth/...)" messages

**Solutions:**
1. Verify all Firebase environment variables are set correctly
2. Check Firebase authorized domains include your deployment domains
3. Ensure Firebase credentials match between frontend and backend

### Issue: Emails not sending

**Symptoms:** No verification emails received

**Solutions:**
1. Verify `RESEND_API_KEY` is set correctly
2. Check `EMAIL_FROM` domain is verified in Resend
3. Ensure `EMAIL_PROVIDER=resend` (not "none")
4. Check backend logs in Vercel for email errors

---

## Custom Domains (Recommended)

### Add Custom Domain to Frontend

1. Go to Vercel Dashboard → Your Frontend Project → Settings → Domains
2. Add domain: `app.yourdomain.com`
3. Configure DNS:
   - Type: `CNAME`
   - Name: `app`
   - Value: `cname.vercel-dns.com`
4. Wait for DNS propagation (5-30 minutes)

### Add Custom Domain to Backend

1. Go to Vercel Dashboard → Your Backend Project → Settings → Domains
2. Add domain: `api.yourdomain.com`
3. Configure DNS:
   - Type: `CNAME`
   - Name: `api`
   - Value: `cname.vercel-dns.com`
4. Wait for DNS propagation

### Update Environment Variables

After adding custom domains, update:

**Backend:**
- `APP_URL=https://app.yourdomain.com`

**Frontend:**
- `VITE_API_URL=https://api.yourdomain.com`
- `APP_URL=https://app.yourdomain.com`

Redeploy both projects.

---

## Monitoring and Logs

### View Backend Logs
```bash
vercel logs derivo-api --prod
```

### View Frontend Logs
```bash
vercel logs derivo-web --prod
```

### Monitor API Health
```bash
curl https://api.yourdomain.com/health
```

---

## Security Checklist

- [ ] Firebase Admin credentials are set and valid
- [ ] `FIREBASE_PRIVATE_KEY` is properly escaped with `\n`
- [ ] Backend environment variables are set in Vercel (not in code)
- [ ] CORS is configured to allow only your frontend domain
- [ ] Resend API key is valid and domain is verified
- [ ] Firebase authorized domains include deployment domains
- [ ] OAuth redirect URLs are configured (if using OAuth)
- [ ] Rate limiting is configured (`MAX_ACCOUNTS_PER_IP`)
- [ ] `VITE_FIREBASE_MOCK=false` in production

---

## Production Checklist

- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured on both
- [ ] `VITE_API_URL` points to production backend
- [ ] Custom domains configured (recommended)
- [ ] DNS propagated and SSL active
- [ ] Firebase authorized domains updated
- [ ] CORS configured correctly
- [ ] Email delivery tested
- [ ] CLI tested against production backend
- [ ] Error monitoring configured (optional)
- [ ] Backup and recovery plan documented

---

## Next Steps

1. Set up monitoring (e.g., Vercel Analytics, Sentry)
2. Configure custom error pages
3. Set up staging environment
4. Document API endpoints for users
5. Create user documentation for CLI setup
6. Set up automated deployments via GitHub Actions

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test backend endpoint directly: `curl https://api.yourdomain.com/health`
4. Check browser DevTools → Console and Network tabs
5. Review this guide's Troubleshooting section

For more help, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Resend Documentation](https://resend.com/docs)
