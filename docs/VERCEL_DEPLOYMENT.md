# Vercel Deployment Guide

This guide explains how to deploy Derivo with separate frontend and backend on Vercel.

## Architecture Overview

Derivo consists of three main applications:

1. **Web App** (`apps/web`) — React dashboard frontend
2. **Backend API** (`apps/api`) — Express backend with Firebase Admin
3. **CLI** (`apps/cli`) — Command-line tool for local development

For production deployment, you'll create **two separate Vercel projects**:
- One for the frontend (web app)
- One for the backend (API)

The CLI will be distributed via npm and configured to connect to your production backend.

---

## Prerequisites

1. **Vercel Account** — Sign up at [vercel.com](https://vercel.com)
2. **Firebase Project** — Set up at [console.firebase.google.com](https://console.firebase.google.com)
3. **Resend Account** (optional) — For email delivery: [resend.com](https://resend.com)
4. **Repository Access** — Your Derivo codebase pushed to GitHub/GitLab/Bitbucket

---

## Part 1: Deploy the Backend API

### Step 1: Create a New Vercel Project for Backend

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Configure the project:
   - **Project Name**: `derivo-backend` (or your choice)
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Configure Backend Environment Variables

In your Vercel project settings, add these environment variables:

#### Required Firebase Admin Variables
```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n
```

**Where to get these:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Open the downloaded JSON file and copy:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` sequences)

#### Required Application URLs
```bash
APP_URL=https://your-frontend.vercel.app
AUTH_ACTION_URL=https://auth.derivo.in/action
```

**Note:** Update `APP_URL` to your actual frontend URL after deploying it (Part 2).

#### Optional: Email Delivery (Resend)
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Derivo <noreply@yourdomain.com>
```

**Where to get these:**
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Generate an API key
4. Use a verified sender email

#### Optional: OAuth Providers
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### Optional: Account Abuse Prevention
```bash
MAX_ACCOUNTS_PER_IP=10
MAX_ACCOUNTS_PER_IP_WINDOW_DAYS=30
INHERIT_TRIAL_ON_REREGISTER=true
```

### Step 3: Deploy Backend

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Note your backend URL: `https://derivo-backend-xxxxx.vercel.app`

### Step 4: Test Backend

Visit `https://your-backend.vercel.app/health` — you should see:
```json
{
  "status": "ok",
  "timestamp": "2026-07-01T12:00:00.000Z",
  "mode": "production"
}
```

---

## Part 2: Deploy the Frontend Web App

### Step 1: Create a New Vercel Project for Frontend

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository (same repo, different project)
3. Configure the project:
   - **Project Name**: `derivo-web` (or your choice)
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Configure Frontend Environment Variables

In your Vercel project settings, add these environment variables:

#### Required: Backend API URL
```bash
VITE_API_URL=https://derivo-backend-xxxxx.vercel.app
```

**Important:** Use the exact backend URL from Part 1, Step 3 (without trailing slash).

#### Required: Firebase Client Configuration
```bash
VITE_FIREBASE_API_KEY=AIzaSyCNv8mVHs3LF3nNrU7dy0If3GESnilBtmM
VITE_FIREBASE_AUTH_DOMAIN=derivo-e8c82.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=derivo
VITE_FIREBASE_APP_ID=1:290795143643:web:ca15a0ec196fcd4f50a7fe
```

**Where to get these:**
1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. If no web app exists, click "Add app" → Web
4. Copy the config values

#### Optional: Gemini API Key
```bash
VITE_GEMINI_API_KEY=your-gemini-api-key
```

#### Optional: Application URL
```bash
VITE_APP_URL=https://your-frontend.vercel.app
```

### Step 3: Deploy Frontend

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Note your frontend URL: `https://derivo-web-xxxxx.vercel.app`

### Step 4: Update Backend APP_URL

**Important:** Go back to your backend Vercel project and update the `APP_URL` environment variable:

```bash
APP_URL=https://derivo-web-xxxxx.vercel.app
```

Then redeploy the backend for the change to take effect.

---

## Part 3: Configure the CLI

The Derivo CLI can connect to your production backend in two ways:

### Option 1: Environment Variable (Recommended for CI/CD)

Set the environment variable before running CLI commands:

```bash
# Windows (cmd)
set DERIVO_API_URL=https://derivo-backend-xxxxx.vercel.app
derivo login

# Windows (PowerShell)
$env:DERIVO_API_URL="https://derivo-backend-xxxxx.vercel.app"
derivo login

# macOS / Linux
export DERIVO_API_URL=https://derivo-backend-xxxxx.vercel.app
derivo login
```

### Option 2: Configuration File (Recommended for Local Development)

Edit `~/.derivo/config.json` (created after first `derivo login`):

```json
{
  "apiUrl": "https://derivo-backend-xxxxx.vercel.app",
  "projectId": "your-project-id",
  "sessionToken": "your-session-token"
}
```

The CLI will automatically use this URL for all API requests.

---

## Environment Variable Resolution Order

### Web App (`apps/web`)
1. `VITE_API_URL` (primary)
2. `VITE_DERIVO_API_URL` (fallback for backward compatibility)
3. Default: `http://localhost:3001`

### CLI (`apps/cli`)
1. `DERIVO_API_URL` environment variable
2. `apiUrl` in `~/.derivo/config.json`
3. Default: `http://localhost:3001`

### Backend API (`apps/api`)
- Reads `APP_URL` to configure CORS and OAuth callbacks
- The backend itself doesn't need to know its own URL

---

## Troubleshooting

### Frontend can't connect to backend

**Error:** `Cannot reach the backend at http://localhost:3001`

**Solution:** Verify `VITE_API_URL` is set correctly in your Vercel frontend project:
1. Go to Vercel dashboard → Your frontend project → Settings → Environment Variables
2. Ensure `VITE_API_URL` is set to your backend URL
3. Redeploy the frontend

### Backend returns CORS errors

**Error:** `Access to fetch at 'https://backend...' has been blocked by CORS policy`

**Solution:** Update `APP_URL` in your backend environment variables:
1. Go to Vercel dashboard → Your backend project → Settings → Environment Variables
2. Set `APP_URL` to your frontend URL: `https://derivo-web-xxxxx.vercel.app`
3. Redeploy the backend

### CLI can't connect to backend

**Error:** `Could not reach the Derivo backend at http://localhost:3001`

**Solution:** Set the `DERIVO_API_URL` environment variable or update `~/.derivo/config.json`:

```bash
# Set environment variable
export DERIVO_API_URL=https://derivo-backend-xxxxx.vercel.app

# OR edit ~/.derivo/config.json
{
  "apiUrl": "https://derivo-backend-xxxxx.vercel.app"
}
```

### Firebase authentication fails

**Error:** `401 Unauthorized` or `Token verification failed`

**Solution:** Verify Firebase Admin credentials in backend:
1. Check that `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` are set
2. Ensure the private key includes `\n` newline sequences
3. Verify the service account has the correct permissions in Firebase Console

### Email delivery not working

**Error:** Verification emails not received

**Solution:** 
1. Verify `EMAIL_PROVIDER=resend` is set in backend
2. Check that `RESEND_API_KEY` is valid
3. Ensure `EMAIL_FROM` uses a verified domain in Resend
4. Check Resend dashboard for delivery logs

---

## Security Best Practices

1. **Never commit `.env` files** — Use `.env.example` as a template
2. **Use strong secrets** — Generate `BETTER_AUTH_SECRET` with: `openssl rand -hex 32`
3. **Rotate API keys regularly** — Firebase, Resend, OAuth credentials
4. **Enable rate limiting** — Set reasonable `MAX_ACCOUNTS_PER_IP` values
5. **Monitor logs** — Check Vercel function logs for suspicious activity
6. **Use environment-specific configs** — Separate dev/staging/production variables

---

## Custom Domains (Optional)

### Frontend Custom Domain

1. Go to Vercel dashboard → Your frontend project → Settings → Domains
2. Add your custom domain: `app.yourdomain.com`
3. Configure DNS as instructed by Vercel
4. Update `APP_URL` in backend environment variables to your custom domain

### Backend Custom Domain

1. Go to Vercel dashboard → Your backend project → Settings → Domains
2. Add your custom domain: `api.yourdomain.com`
3. Configure DNS as instructed by Vercel
4. Update `VITE_API_URL` in frontend environment variables to your custom domain

---

## Monitoring and Debugging

### Vercel Function Logs

View real-time logs:
1. Go to Vercel dashboard → Your project → Functions
2. Click on any function to see logs
3. Filter by time range or search for errors

### Health Check Endpoints

Test your deployments:

```bash
# Backend health
curl https://your-backend.vercel.app/health

# Frontend (should return HTML)
curl https://your-frontend.vercel.app
```

### Firebase Console

Monitor authentication and errors:
1. Go to Firebase Console → Authentication → Users
2. Check Authentication → Sign-in method for enabled providers
3. Review errors in Firebase Console → Analytics

---

## Cost Estimation

### Vercel Pricing (as of 2026)

- **Hobby Plan** (Free):
  - 100 GB bandwidth per month
  - Unlimited deployments
  - Automatic HTTPS
  - Good for personal projects or low-traffic apps

- **Pro Plan** ($20/month per member):
  - 1 TB bandwidth per month
  - Advanced analytics
  - Password protection
  - Good for production apps with moderate traffic

### Firebase Pricing (Pay as You Go)

- **Authentication**: Free up to 50,000 monthly active users
- **Firestore**: Free tier includes 1 GB storage + 50K reads/day
- **Functions**: Free tier includes 2M invocations/month

### Resend Pricing

- **Free Tier**: 100 emails/day
- **Paid Plans**: Start at $20/month for 50K emails

---

## Next Steps

1. ✅ Deploy backend to Vercel
2. ✅ Deploy frontend to Vercel
3. ✅ Configure CLI to use production backend
4. Test the full authentication flow
5. Set up custom domains (optional)
6. Configure monitoring and alerts
7. Set up CI/CD for automatic deployments

---

## Support

If you encounter issues not covered in this guide:

1. Check Vercel function logs for backend errors
2. Check browser console for frontend errors
3. Review Firebase Console for authentication issues
4. Consult Derivo documentation: [your-docs-url]
5. Contact support: [your-support-email]
