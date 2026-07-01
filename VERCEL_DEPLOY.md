# Vercel Deployment Guide - Step by Step

This is a practical, copy-paste friendly guide for deploying Derivo to Vercel with separate frontend and backend projects.

## Prerequisites Checklist

- [ ] Vercel account created ([vercel.com/signup](https://vercel.com/signup))
- [ ] Vercel CLI installed: `npm i -g vercel`
- [ ] Firebase project created
- [ ] Firebase service account JSON downloaded
- [ ] Resend account created and API key obtained
- [ ] Email sending domain verified in Resend

---

## Part 1: Deploy Backend (15 minutes)

### Step 1.1: Deploy Backend to Vercel

```bash
# Navigate to API directory
cd apps/api

# Login to Vercel (if not already)
vercel login

# Deploy
vercel

# Answer prompts:
# Set up and deploy? → Y
# Which scope? → Select your account
# Link to existing project? → N
# Project name? → derivo-api (or your choice)
# In which directory is your code located? → ./
# Want to override the settings? → N
```

**Note the deployment URL!** Example: `https://derivo-api-xxxx.vercel.app`

### Step 1.2: Set Backend Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Select `derivo-api` project → Settings → Environment Variables

Add these variables (set for **Production** environment):

```env
APP_URL=https://your-frontend-url.vercel.app
PORT=3001
```

**Firebase Admin SDK:**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Firebase Private Key (IMPORTANT!):**
```env
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgk...(your key)...\n-----END PRIVATE KEY-----\n
```

> ⚠️ **Critical:** Keep the `\n` characters in the private key. Wrap in quotes if needed.

**Email Configuration:**
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Derivo <noreply@yourdomain.com>
AUTH_ACTION_URL=https://auth.yourdomain.com/action
```

**Security Settings:**
```env
MAX_ACCOUNTS_PER_IP=10
MAX_ACCOUNTS_PER_IP_WINDOW_DAYS=30
INHERIT_TRIAL_ON_REREGISTER=true
```

**Optional (OAuth):**
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Step 1.3: Redeploy Backend

```bash
# Still in apps/api directory
vercel --prod
```

✅ **Backend is now live!** Test it:
```bash
curl https://derivo-api-xxxx.vercel.app/health
```

---

## Part 2: Deploy Frontend (10 minutes)

### Step 2.1: Deploy Frontend to Vercel

```bash
# Navigate to web directory
cd apps/web

# Deploy
vercel

# Answer prompts:
# Set up and deploy? → Y
# Which scope? → Select your account
# Link to existing project? → N
# Project name? → derivo-web (or your choice)
# In which directory is your code located? → ./
# Want to override the settings? → N
```

**Note the deployment URL!** Example: `https://derivo-web-xxxx.vercel.app`

### Step 2.2: Set Frontend Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Select `derivo-web` project → Settings → Environment Variables

Add these variables (set for **Production** environment):

**⚠️ CRITICAL - Backend Connection:**
```env
VITE_API_URL=https://derivo-api-xxxx.vercel.app
```
Replace with YOUR backend URL from Part 1!

**App Configuration:**
```env
APP_URL=https://derivo-web-xxxx.vercel.app
```
Replace with YOUR frontend URL!

**Firebase Client SDK:**
```env
VITE_FIREBASE_API_KEY=AIzaSyCNv8mVHs3LF3nNrU7dy0If3GESnilBtmM
VITE_FIREBASE_AUTH_DOMAIN=derivo-e8c82.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=derivo
VITE_FIREBASE_APP_ID=1:290795143643:web:ca15a0ec196fcd4f50a7fe
VITE_FIREBASE_MOCK=false
```
Replace with YOUR Firebase project values!

**Optional (AI Features):**
```env
GEMINI_API_KEY=your-gemini-key
```

### Step 2.3: Update Backend APP_URL

Now that you know your frontend URL, update the backend:

1. Go back to backend project in Vercel Dashboard
2. Settings → Environment Variables
3. Edit `APP_URL` → Set to your frontend URL: `https://derivo-web-xxxx.vercel.app`
4. Save

### Step 2.4: Redeploy Both Projects

```bash
# Redeploy backend (to pick up new APP_URL)
cd apps/api
vercel --prod

# Redeploy frontend (to pick up environment variables)
cd apps/web
vercel --prod
```

✅ **Frontend is now live!** Open in browser:
```
https://derivo-web-xxxx.vercel.app
```

---

## Part 3: Configure Firebase (5 minutes)

### Step 3.1: Add Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Authentication → Settings → Authorized domains
4. Add these domains:
   - `derivo-api-xxxx.vercel.app` (your backend)
   - `derivo-web-xxxx.vercel.app` (your frontend)
   - `*.vercel.app` (for preview deployments)

### Step 3.2: Verify Firebase Configuration

Ensure both frontend and backend use the same Firebase project:
- Backend `FIREBASE_PROJECT_ID` = Frontend `VITE_FIREBASE_PROJECT_ID`

---

## Part 4: Test Deployment (5 minutes)

### Test 4.1: Backend Health Check

```bash
curl https://derivo-api-xxxx.vercel.app/health
```

Expected: `{"status":"ok"}` or similar

### Test 4.2: Frontend Loads

Open browser: `https://derivo-web-xxxx.vercel.app`

Check:
- [ ] Page loads without errors
- [ ] No console errors in DevTools

### Test 4.3: Frontend → Backend Connection

1. Open frontend in browser
2. Open DevTools (F12) → Network tab
3. Try to sign up or log in
4. Check Network tab:
   - [ ] Requests go to: `https://derivo-api-xxxx.vercel.app`
   - [ ] Status codes are 200 or expected errors (not CORS errors)
   - [ ] No "Cannot reach backend" errors

### Test 4.4: Authentication Flow

1. Sign up with a test email
2. Check email for verification link
3. Verify email
4. Log in
5. Access dashboard

All should work without errors!

---

## Part 5: Custom Domains (Optional, 10 minutes)

### Step 5.1: Add Domain to Backend

1. Vercel Dashboard → `derivo-api` project
2. Settings → Domains
3. Add domain: `api.yourdomain.com`
4. Follow DNS instructions (add CNAME record)
5. Wait for DNS propagation (5-30 minutes)

### Step 5.2: Add Domain to Frontend

1. Vercel Dashboard → `derivo-web` project
2. Settings → Domains
3. Add domain: `app.yourdomain.com`
4. Follow DNS instructions (add CNAME record)
5. Wait for DNS propagation

### Step 5.3: Update Environment Variables

**Backend:**
1. Go to backend project → Settings → Environment Variables
2. Edit `APP_URL` → `https://app.yourdomain.com`
3. Redeploy: `cd apps/api && vercel --prod`

**Frontend:**
1. Go to frontend project → Settings → Environment Variables
2. Edit `VITE_API_URL` → `https://api.yourdomain.com`
3. Edit `APP_URL` → `https://app.yourdomain.com`
4. Redeploy: `cd apps/web && vercel --prod`

### Step 5.4: Update Firebase Authorized Domains

Add your custom domains to Firebase:
- `api.yourdomain.com`
- `app.yourdomain.com`

---

## Part 6: CLI Configuration for Users

Users of your CLI need to point to the production backend.

### Option A: Environment Variable (Recommended)

Add to user documentation:

**Linux/macOS:**
```bash
echo 'export DERIVO_API_URL=https://api.yourdomain.com' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('DERIVO_API_URL', 'https://api.yourdomain.com', 'User')
```

### Option B: Config File

Add to user documentation:

Create `~/.derivo/config.json`:
```json
{
  "apiUrl": "https://api.yourdomain.com"
}
```

### Option C: Update Default in Code

Edit `apps/cli/src/utils/api.ts`:
```typescript
export const DEFAULT_API_URL = 'https://api.yourdomain.com';
```

Then rebuild and publish CLI.

---

## Verification Commands

### Check Backend Logs
```bash
vercel logs derivo-api --prod
```

### Check Frontend Logs
```bash
vercel logs derivo-web --prod
```

### Test Backend Endpoint
```bash
curl https://api.yourdomain.com/health
```

### Check Environment Variables
```bash
# Backend
vercel env ls --scope derivo-api

# Frontend
vercel env ls --scope derivo-web
```

---

## Common Issues & Fixes

### ❌ Issue: Frontend shows "Cannot reach backend"

**Diagnosis:**
```javascript
// Open browser console on frontend
console.log(import.meta.env.VITE_API_URL)
```

**Fix:**
1. Verify `VITE_API_URL` is set in frontend Vercel environment variables
2. Ensure it points to backend URL: `https://derivo-api-xxxx.vercel.app`
3. Redeploy frontend: `vercel --prod`

---

### ❌ Issue: CORS errors in browser console

**Example Error:**
```
Access to fetch at 'https://derivo-api-xxxx.vercel.app/api/...' 
from origin 'https://derivo-web-xxxx.vercel.app' has been blocked by CORS policy
```

**Fix:**
1. Check `APP_URL` in backend environment variables
2. Should match frontend URL: `https://derivo-web-xxxx.vercel.app`
3. Verify CORS middleware in `apps/api/src/app.ts` includes `APP_URL`
4. Redeploy backend: `vercel --prod`

---

### ❌ Issue: Firebase authentication errors

**Example Error:**
```
Firebase: Error (auth/invalid-api-key)
```

**Fix:**
1. Verify `VITE_FIREBASE_API_KEY` matches your Firebase project
2. Check Firebase authorized domains include your Vercel domains
3. Ensure `FIREBASE_PROJECT_ID` (backend) matches `VITE_FIREBASE_PROJECT_ID` (frontend)

---

### ❌ Issue: Email verification not sending

**Fix:**
1. Check `RESEND_API_KEY` is set correctly in backend
2. Verify `EMAIL_FROM` domain is verified in Resend dashboard
3. Check backend logs: `vercel logs derivo-api --prod`
4. Ensure `EMAIL_PROVIDER=resend` (not "none")

---

### ❌ Issue: Environment variables not working

**Fix:**
1. Environment variables require redeployment to take effect
2. After adding/changing variables, always redeploy:
   ```bash
   vercel --prod
   ```

---

### ❌ Issue: CLI connects to localhost instead of production

**Fix:**
Users need to set `DERIVO_API_URL`:
```bash
export DERIVO_API_URL=https://api.yourdomain.com
```

Or create `~/.derivo/config.json` with the backend URL.

---

## Environment Variables Quick Reference

### Backend (derivo-api)
```
APP_URL=https://derivo-web-xxxx.vercel.app
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
EMAIL_PROVIDER=resend
RESEND_API_KEY=xxx
EMAIL_FROM=xxx
```

### Frontend (derivo-web)
```
VITE_API_URL=https://derivo-api-xxxx.vercel.app
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_APP_ID=xxx
APP_URL=https://derivo-web-xxxx.vercel.app
```

---

## Next Steps After Deployment

- [ ] Set up custom domains (recommended)
- [ ] Configure monitoring/analytics
- [ ] Set up staging environment
- [ ] Document API for users
- [ ] Create CLI installation guide for users
- [ ] Set up automated deployments (GitHub Actions)
- [ ] Configure error tracking (Sentry)
- [ ] Set up backup strategy
- [ ] Create admin documentation
- [ ] Plan scaling strategy

---

## Helpful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Resend Dashboard](https://resend.com/dashboard)
- [Derivo Documentation](./README.md)

---

## Support

If you encounter issues not covered here:

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive guide
2. Review [ENV_VARS.md](./ENV_VARS.md) for variable details
3. Check Vercel deployment logs
4. Verify all environment variables are set
5. Test backend endpoint directly with curl

---

**Deployment Checklist:**

- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] `VITE_API_URL` points to backend
- [ ] `APP_URL` on backend points to frontend
- [ ] Firebase authorized domains updated
- [ ] Both projects redeployed after config
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] Authentication flow works
- [ ] Email verification works
- [ ] No CORS errors in browser
- [ ] CLI configuration documented for users

**Congratulations! 🎉 Derivo is now deployed!**
