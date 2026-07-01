# Quick Start: Vercel Deployment

Get Derivo running on Vercel in under 10 minutes.

## Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- Firebase project with service account credentials
- Your code pushed to GitHub/GitLab/Bitbucket

---

## Step 1: Deploy Backend (5 minutes)

### 1.1 Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Configure:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 1.2 Set Environment Variables

Add these in Vercel project settings → Environment Variables:

```bash
# Required: Firebase Admin (from service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Required: Application URL (update after deploying frontend)
APP_URL=http://localhost:3000

# Optional: Email delivery
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Derivo <noreply@yourdomain.com>
```

### 1.3 Deploy

Click **Deploy** and wait ~2 minutes.

**Copy your backend URL**: `https://derivo-backend-xxxxx.vercel.app`

---

## Step 2: Deploy Frontend (3 minutes)

### 2.1 Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the **same repository** (different project)
3. Configure:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.2 Set Environment Variables

Add these in Vercel project settings → Environment Variables:

```bash
# Required: Backend URL (from Step 1.3)
VITE_API_URL=https://derivo-backend-xxxxx.vercel.app

# Required: Firebase Client SDK
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Get Firebase Client config:**
- Firebase Console → Project Settings → General → Your apps
- Click "Add app" → Web if none exists

### 2.3 Deploy

Click **Deploy** and wait ~2 minutes.

**Copy your frontend URL**: `https://derivo-web-xxxxx.vercel.app`

---

## Step 3: Update Backend APP_URL (1 minute)

1. Go to your **backend** Vercel project
2. Settings → Environment Variables
3. Update `APP_URL` to your frontend URL:
   ```bash
   APP_URL=https://derivo-web-xxxxx.vercel.app
   ```
4. Redeploy the backend (Deployments → ⋯ → Redeploy)

---

## Step 4: Test Everything (1 minute)

### Test Backend
```bash
curl https://derivo-backend-xxxxx.vercel.app/health
```

Expected:
```json
{"status":"ok","timestamp":"2026-07-01T12:00:00.000Z"}
```

### Test Frontend
1. Open `https://derivo-web-xxxxx.vercel.app`
2. Click "Sign Up"
3. Create an account
4. Verify you can log in

✅ **Done!** Your Derivo instance is live.

---

## Configure CLI (Optional)

To use the CLI with your production backend:

### Option 1: Environment Variable
```bash
# Windows (PowerShell)
$env:DERIVO_API_URL="https://derivo-backend-xxxxx.vercel.app"
derivo login

# macOS / Linux
export DERIVO_API_URL=https://derivo-backend-xxxxx.vercel.app
derivo login
```

### Option 2: Config File
Edit `~/.derivo/config.json`:
```json
{
  "apiUrl": "https://derivo-backend-xxxxx.vercel.app"
}
```

---

## Next Steps

- ✅ Add custom domain (Vercel dashboard → Domains)
- ✅ Enable email delivery (add Resend credentials)
- ✅ Set up OAuth (Google/GitHub)
- ✅ Configure account security settings
- ✅ Review [complete deployment guide](./VERCEL_DEPLOYMENT.md)

---

## Common Issues

### "Cannot reach backend"
- Frontend can't find backend
- **Fix**: Check `VITE_API_URL` in frontend Vercel settings

### "CORS error"
- Backend rejects frontend requests
- **Fix**: Update `APP_URL` in backend to match frontend URL

### "Token verification failed"
- Firebase credentials missing/wrong
- **Fix**: Verify `FIREBASE_*` variables in backend settings

### "Verification email not sent"
- Email not configured
- **Fix**: Set `EMAIL_PROVIDER=resend` and add Resend credentials

---

## Environment Variables Cheat Sheet

### Backend (apps/api)
```bash
# URLs
APP_URL=https://your-frontend.vercel.app

# Firebase Admin (required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Email (optional)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Derivo <noreply@yourdomain.com>
AUTH_ACTION_URL=https://auth.yourdomain.com/action

# Auth (generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET=your-random-secret-here

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Security (optional)
MAX_ACCOUNTS_PER_IP=3
MAX_ACCOUNTS_PER_IP_WINDOW_DAYS=30
INHERIT_TRIAL_ON_REREGISTER=true
```

### Frontend (apps/web)
```bash
# Backend URL
VITE_API_URL=https://your-backend.vercel.app

# Firebase Client
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id

# AI (optional)
VITE_GEMINI_API_KEY=your-gemini-key
```

---

## Support

- **Full guide**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Environment variables**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- **Troubleshooting**: [VERCEL_DEPLOYMENT.md#troubleshooting](./VERCEL_DEPLOYMENT.md#troubleshooting)
