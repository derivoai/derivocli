# Environment Variables Reference

Complete reference for all environment variables used across Derivo applications.

---

## Quick Reference by Application

| Variable | Web App | Backend API | CLI |
|----------|---------|-------------|-----|
| `VITE_API_URL` | ✅ Required | ❌ | ❌ |
| `DERIVO_API_URL` | ❌ | ❌ | ✅ Optional* |
| `APP_URL` | ❌ | ✅ Required | ❌ |
| `FIREBASE_PROJECT_ID` | ❌ | ✅ Required | ❌ |
| `FIREBASE_CLIENT_EMAIL` | ❌ | ✅ Required | ❌ |
| `FIREBASE_PRIVATE_KEY` | ❌ | ✅ Required | ❌ |
| `VITE_FIREBASE_API_KEY` | ✅ Required | ❌ | ❌ |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Required | ❌ | ❌ |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Required | ❌ | ❌ |
| `VITE_FIREBASE_APP_ID` | ✅ Required | ❌ | ❌ |

\* Can also be configured in `~/.derivo/config.json`

---

## Application URLs

### `APP_URL`
- **Used by**: Backend API
- **Purpose**: CORS configuration and OAuth callback URLs
- **Required**: Yes
- **Format**: Full URL without trailing slash
- **Examples**:
  - Local: `http://localhost:3000`
  - Production: `https://app.yourdomain.com`

```bash
APP_URL="https://app.yourdomain.com"
```

### `VITE_API_URL`
- **Used by**: Web App
- **Purpose**: Backend API endpoint for all dashboard API calls
- **Required**: Yes (defaults to `http://localhost:3001`)
- **Format**: Full URL without trailing slash
- **Examples**:
  - Local: `http://localhost:3001`
  - Production: `https://api.yourdomain.com`

```bash
VITE_API_URL="https://api.yourdomain.com"
```

### `DERIVO_API_URL`
- **Used by**: CLI
- **Purpose**: Backend API endpoint for all CLI API calls
- **Required**: Optional (can use `~/.derivo/config.json` instead)
- **Format**: Full URL without trailing slash
- **Examples**:
  - Local: `http://localhost:3001`
  - Production: `https://api.yourdomain.com`

```bash
DERIVO_API_URL="https://api.yourdomain.com"
```

**Alternative Configuration** (in `~/.derivo/config.json`):
```json
{
  "apiUrl": "https://api.yourdomain.com"
}
```

### `PORT`
- **Used by**: Backend API (local development only)
- **Purpose**: Port the backend server listens on
- **Required**: Optional (defaults to `3001`)
- **Format**: Integer port number

```bash
PORT="3001"
```

---

## Firebase Admin SDK (Backend Only)

These variables are used by the backend to verify Firebase authentication tokens and manage users.

### `FIREBASE_PROJECT_ID`
- **Used by**: Backend API
- **Purpose**: Identifies your Firebase project
- **Required**: Yes (backend will run in MOCK MODE without it)
- **Where to get**: Firebase Console → Project Settings → Service Accounts → Download JSON

```bash
FIREBASE_PROJECT_ID="derivo"
```

### `FIREBASE_CLIENT_EMAIL`
- **Used by**: Backend API
- **Purpose**: Service account email for Firebase Admin SDK
- **Required**: Yes (backend will run in MOCK MODE without it)
- **Where to get**: Firebase Console → Project Settings → Service Accounts → Download JSON

```bash
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
```

### `FIREBASE_PRIVATE_KEY`
- **Used by**: Backend API
- **Purpose**: Private key for Firebase Admin SDK authentication
- **Required**: Yes (backend will run in MOCK MODE without it)
- **Format**: Keep the `\n` newline sequences, wrap in quotes
- **Where to get**: Firebase Console → Project Settings → Service Accounts → Download JSON

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

**Important Security Notes**:
- Never commit this to version control
- Keep the `\n` sequences in the string (they represent actual newlines)
- Wrap the entire value in quotes
- Rotate this key periodically for security

---

## Firebase Client SDK (Web App Only)

These variables are used by the web app to initialize Firebase authentication on the client side.

### `VITE_FIREBASE_API_KEY`
- **Used by**: Web App
- **Purpose**: Firebase client SDK initialization
- **Required**: Yes
- **Where to get**: Firebase Console → Project Settings → General → Your apps

```bash
VITE_FIREBASE_API_KEY="AIzaSyCNv8mVHs3LF3nNrU7dy0If3GESnilBtmM"
```

### `VITE_FIREBASE_AUTH_DOMAIN`
- **Used by**: Web App
- **Purpose**: Firebase authentication domain
- **Required**: Yes
- **Where to get**: Firebase Console → Project Settings → General → Your apps

```bash
VITE_FIREBASE_AUTH_DOMAIN="derivo-e8c82.firebaseapp.com"
```

### `VITE_FIREBASE_PROJECT_ID`
- **Used by**: Web App
- **Purpose**: Firebase project identifier
- **Required**: Yes
- **Where to get**: Firebase Console → Project Settings → General → Your apps

```bash
VITE_FIREBASE_PROJECT_ID="derivo"
```

### `VITE_FIREBASE_APP_ID`
- **Used by**: Web App
- **Purpose**: Firebase application identifier
- **Required**: Yes
- **Where to get**: Firebase Console → Project Settings → General → Your apps

```bash
VITE_FIREBASE_APP_ID="1:290795143643:web:ca15a0ec196fcd4f50a7fe"
```

### `VITE_FIREBASE_MOCK`
- **Used by**: Web App
- **Purpose**: Enable/disable Firebase mock mode in development
- **Required**: Optional (defaults to `false`)
- **Values**: `true` or `false`

```bash
VITE_FIREBASE_MOCK="false"
```

---

## Email Delivery (Backend Only)

### `EMAIL_PROVIDER`
- **Used by**: Backend API
- **Purpose**: Enable/disable email delivery
- **Required**: Optional (defaults to `none`)
- **Values**: `resend` or `none`
- **Notes**: When set to `none`, verification/reset links are only logged to console

```bash
EMAIL_PROVIDER="resend"
```

### `RESEND_API_KEY`
- **Used by**: Backend API
- **Purpose**: Resend API key for sending emails
- **Required**: Yes (when `EMAIL_PROVIDER=resend`)
- **Where to get**: [resend.com](https://resend.com) → API Keys

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### `EMAIL_FROM`
- **Used by**: Backend API
- **Purpose**: Sender email address for all outgoing emails
- **Required**: Yes (when `EMAIL_PROVIDER=resend`)
- **Format**: `Name <email@domain.com>`
- **Notes**: Domain must be verified in Resend

```bash
EMAIL_FROM="Derivo <noreply@derivo.in>"
```

### `AUTH_ACTION_URL`
- **Used by**: Backend API
- **Purpose**: Branded Firebase email action page URL
- **Required**: Optional (defaults to Firebase default)
- **Format**: Full URL without trailing slash

```bash
AUTH_ACTION_URL="https://auth.derivo.in/action"
```

---

## Better Auth (Backend Only)

### `BETTER_AUTH_URL`
- **Used by**: Backend API
- **Purpose**: Base URL for Better Auth session management
- **Required**: Yes
- **Format**: Full URL without trailing slash

```bash
BETTER_AUTH_URL="http://localhost:3001"
```

### `BETTER_AUTH_SECRET`
- **Used by**: Backend API
- **Purpose**: Secret key for signing session tokens
- **Required**: Yes
- **Format**: Long random string (minimum 32 characters)
- **Generate with**: `openssl rand -hex 32`

```bash
BETTER_AUTH_SECRET="your-long-random-secret-here"
```

---

## OAuth Providers (Backend Only)

All OAuth credentials are optional. Leave blank to disable that provider.

### Google OAuth

#### `GOOGLE_CLIENT_ID`
- **Used by**: Backend API
- **Purpose**: Google OAuth client ID
- **Required**: Optional (disable Google login if not set)
- **Where to get**: [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials

```bash
GOOGLE_CLIENT_ID="your-google-client-id"
```

#### `GOOGLE_CLIENT_SECRET`
- **Used by**: Backend API
- **Purpose**: Google OAuth client secret
- **Required**: Optional (disable Google login if not set)
- **Where to get**: [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials

```bash
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### GitHub OAuth

#### `GITHUB_CLIENT_ID`
- **Used by**: Backend API
- **Purpose**: GitHub OAuth client ID
- **Required**: Optional (disable GitHub login if not set)
- **Where to get**: [GitHub Settings](https://github.com/settings/developers) → OAuth Apps

```bash
GITHUB_CLIENT_ID="your-github-client-id"
```

#### `GITHUB_CLIENT_SECRET`
- **Used by**: Backend API
- **Purpose**: GitHub OAuth client secret
- **Required**: Optional (disable GitHub login if not set)
- **Where to get**: [GitHub Settings](https://github.com/settings/developers) → OAuth Apps

```bash
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## Account Security (Backend Only)

### `MAX_ACCOUNTS_PER_IP`
- **Used by**: Backend API
- **Purpose**: Maximum accounts that can be created from a single IP
- **Required**: Optional (defaults to `0` = disabled)
- **Format**: Integer (0 to disable)
- **Recommended**: `3` to `10`

```bash
MAX_ACCOUNTS_PER_IP="10"
```

### `MAX_ACCOUNTS_PER_IP_WINDOW_DAYS`
- **Used by**: Backend API
- **Purpose**: Time window (days) for counting IP registrations
- **Required**: Optional (defaults to `30`)
- **Format**: Integer

```bash
MAX_ACCOUNTS_PER_IP_WINDOW_DAYS="30"
```

### `INHERIT_TRIAL_ON_REREGISTER`
- **Used by**: Backend API
- **Purpose**: Whether to inherit trial status when user re-registers with same email
- **Required**: Optional (defaults to `true`)
- **Values**: `true` or `false`
- **Notes**: Prevents trial abuse by detecting deleted accounts

```bash
INHERIT_TRIAL_ON_REREGISTER="true"
```

---

## AI Integration (Web App Only)

### `VITE_GEMINI_API_KEY`
- **Used by**: Web App
- **Purpose**: Google Gemini API key for AI features
- **Required**: Optional (AI features disabled if not set)
- **Where to get**: [Google AI Studio](https://makersuite.google.com/app/apikey)

```bash
VITE_GEMINI_API_KEY="your-gemini-api-key"
```

### `GEMINI_API_KEY`
- **Used by**: Web App (fallback)
- **Purpose**: Alternative variable name for Gemini API key
- **Required**: Optional
- **Notes**: Use `VITE_GEMINI_API_KEY` instead (this is for backward compatibility)

```bash
GEMINI_API_KEY="your-gemini-api-key"
```

---

## Environment-Specific Configuration

### Development (.env)
```bash
# Local URLs
APP_URL="http://localhost:3000"
VITE_API_URL="http://localhost:3001"
DERIVO_API_URL="http://localhost:3001"
PORT="3001"

# Firebase (use test project)
FIREBASE_PROJECT_ID="derivo-dev"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@derivo-dev.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Disable email in dev (logs to console)
EMAIL_PROVIDER="none"

# Development auth secret
BETTER_AUTH_SECRET="dev-secret-change-in-production"
```

### Production (Vercel Environment Variables)

**Backend API**:
```bash
# Production URLs
APP_URL="https://app.yourdomain.com"

# Firebase (use production project)
FIREBASE_PROJECT_ID="derivo-prod"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@derivo-prod.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Enable email delivery
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_live_xxxxxxxxxxxx"
EMAIL_FROM="Derivo <noreply@yourdomain.com>"
AUTH_ACTION_URL="https://auth.yourdomain.com/action"

# Production auth secret (generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET="your-production-secret-here"

# Account security
MAX_ACCOUNTS_PER_IP="3"
MAX_ACCOUNTS_PER_IP_WINDOW_DAYS="30"
INHERIT_TRIAL_ON_REREGISTER="true"
```

**Web App**:
```bash
# Backend API URL
VITE_API_URL="https://api.yourdomain.com"

# Firebase Client SDK
VITE_FIREBASE_API_KEY="AIzaSyCNv8mVHs3LF3nNrU7dy0If3GESnilBtmM"
VITE_FIREBASE_AUTH_DOMAIN="derivo-prod.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="derivo-prod"
VITE_FIREBASE_APP_ID="1:290795143643:web:ca15a0ec196fcd4f50a7fe"

# Optional: AI features
VITE_GEMINI_API_KEY="your-production-gemini-key"
```

---

## Validation and Testing

### Check Backend Configuration
```bash
curl https://your-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-07-01T12:00:00.000Z",
  "mode": "production"
}
```

### Check Frontend Configuration

Open browser console on your frontend and run:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

Should output your backend URL.

### Check CLI Configuration
```bash
# Test API connection
derivo login

# View current config
cat ~/.derivo/config.json
```

---

## Common Issues

### Issue: "Cannot reach the backend"

**Cause**: `VITE_API_URL` or `DERIVO_API_URL` not set correctly

**Solution**:
- Web app: Set `VITE_API_URL` in Vercel project settings
- CLI: Set `DERIVO_API_URL` environment variable or update `~/.derivo/config.json`

### Issue: "Firebase token verification failed"

**Cause**: Firebase Admin credentials not set or incorrect

**Solution**: Verify `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` are set correctly in backend

### Issue: "CORS error"

**Cause**: `APP_URL` in backend doesn't match frontend URL

**Solution**: Update `APP_URL` in backend to match your frontend deployment URL

### Issue: "Verification emails not sent"

**Cause**: Email configuration missing or incorrect

**Solution**: 
- Set `EMAIL_PROVIDER=resend`
- Verify `RESEND_API_KEY` is valid
- Check `EMAIL_FROM` uses a verified domain

---

## Security Checklist

- [ ] Never commit `.env` files to version control
- [ ] Use strong random secrets (minimum 32 characters)
- [ ] Rotate Firebase service account keys periodically
- [ ] Use separate Firebase projects for dev/staging/prod
- [ ] Enable `INHERIT_TRIAL_ON_REREGISTER` to prevent trial abuse
- [ ] Set reasonable `MAX_ACCOUNTS_PER_IP` limits
- [ ] Use environment-specific Resend API keys
- [ ] Regularly audit Vercel environment variables
- [ ] Monitor backend logs for suspicious activity
- [ ] Keep OAuth client secrets secure

---

## References

- [Derivo Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Resend Documentation](https://resend.com/docs)
