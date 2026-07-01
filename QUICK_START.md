# Derivo Quick Start Guide

## 🚀 For Local Development

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

**Minimum required in `.env`:**
```env
VITE_API_URL=http://localhost:3001

# Firebase Client
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=your-app-id

# Firebase Admin
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx
EMAIL_FROM="Derivo <noreply@yourdomain.com>"
```

### Step 3: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd apps/api
pnpm dev
```
✅ Backend running at http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd apps/web
pnpm dev
```
✅ Frontend running at http://localhost:3000

**Terminal 3 - CLI:**
```bash
cd apps/cli
pnpm build
pnpm link
derivo --help
```
✅ CLI ready to use

---

## 🌐 For Production (Vercel)

### Step 1: Deploy Backend

```bash
cd apps/api
vercel
```

**Set environment variables in Vercel Dashboard:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `APP_URL=https://your-frontend.vercel.app`

### Step 2: Deploy Frontend

```bash
cd apps/web
vercel
```

**Set environment variables in Vercel Dashboard:**
- `VITE_API_URL=https://your-backend.vercel.app` ⚠️ **CRITICAL**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `APP_URL=https://your-frontend.vercel.app`

### Step 3: Configure CLI for Users

Users need to set the backend URL:

**Option A - Environment Variable:**
```bash
export DERIVO_API_URL=https://your-backend.vercel.app
```

**Option B - Config File (`~/.derivo/config.json`):**
```json
{
  "apiUrl": "https://your-backend.vercel.app"
}
```

---

## 📋 Critical Checklist

### Local Development
- [ ] `VITE_API_URL=http://localhost:3001` in `.env`
- [ ] Firebase credentials configured
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] CLI built and linked

### Production
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set in frontend Vercel env (points to backend)
- [ ] `APP_URL` set in backend Vercel env (points to frontend)
- [ ] Firebase authorized domains updated
- [ ] CORS configured in backend
- [ ] CLI users know backend URL

---

## 🔍 Verification

### Test Backend
```bash
curl http://localhost:3001/health
# or
curl https://your-backend.vercel.app/health
```

### Test Frontend → Backend Connection
1. Open frontend in browser
2. Open DevTools → Network tab
3. Try to sign up/log in
4. Verify API requests go to correct backend URL

### Test CLI → Backend Connection
```bash
derivo status
```

---

## 🆘 Common Issues

### ❌ Frontend shows "Cannot reach backend"
**Fix:** Set `VITE_API_URL` in frontend environment variables and redeploy

### ❌ CORS errors in browser
**Fix:** Set `APP_URL` in backend environment variables to match frontend domain

### ❌ CLI connects to localhost instead of production
**Fix:** Set `DERIVO_API_URL` environment variable or update `~/.derivo/config.json`

### ❌ Firebase authentication errors
**Fix:** Verify Firebase credentials match and authorized domains are updated

---

## 📚 More Documentation

- **Complete Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Environment Variables Reference:** [ENV_VARS.md](./ENV_VARS.md)
- **Project Documentation:** [README.md](./README.md)

---

## 🎯 Connection Flow

### Local Development
```
Frontend (localhost:3000)
    ↓ VITE_API_URL=localhost:3001
Backend (localhost:3001)
    ↑ DERIVO_API_URL=localhost:3001
CLI
```

### Production
```
Frontend (your-frontend.vercel.app)
    ↓ VITE_API_URL=your-backend.vercel.app
Backend (your-backend.vercel.app)
    ↑ DERIVO_API_URL=your-backend.vercel.app
CLI (User's machine)
```

---

**Need help?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
