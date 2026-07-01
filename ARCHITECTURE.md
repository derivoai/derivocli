# Derivo Architecture

## System Overview

Derivo is a monorepo SaaS application with three main components that communicate through a centralized backend API.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Derivo Ecosystem                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌──────────────────────┐
│   Frontend (Web)    │────────▶│   Backend (API)      │
│                     │  HTTPS  │                      │
│   • React 18        │◀────────│   • Express          │
│   • TypeScript      │         │   • TypeScript       │
│   • Vite            │         │   • Firebase Admin   │
│   • Tailwind CSS    │         │   • Resend Email     │
│   • shadcn/ui       │         │   • Vercel Host      │
│   • Vercel Host     │         │                      │
│                     │         │   Port: 3001         │
│   Port: 3000        │         │                      │
└─────────────────────┘         └──────────────────────┘
         │                               ▲
         │                               │
         │ HTTPS                         │ HTTPS
         │                               │
         ▼                               │
┌─────────────────────┐                 │
│   CLI Tool          │─────────────────┘
│                     │
│   • Node.js         │
│   • TypeScript      │
│   • Commander.js    │
│   • Local Machine   │
│                     │
└─────────────────────┘
```

## Data Flow

### Authentication Flow

```
User Action (Web/CLI)
        │
        ▼
Firebase Client SDK (Frontend/CLI)
        │
        ▼
Firebase ID Token Generated
        │
        ▼
Request to Backend API
(with Authorization: Bearer <token>)
        │
        ▼
Backend Middleware (auth.ts)
        │
        ├──▶ Verify Token with Firebase Admin SDK
        │
        ├──▶ Extract User UID
        │
        └──▶ Attach to Request Context
        │
        ▼
Protected Route Handler
        │
        ▼
Database Operations (Firestore)
        │
        ▼
Response to Client
```

### API Request Flow

```
┌─────────────────────┐
│   Client            │
│   (Web or CLI)      │
└──────────┬──────────┘
           │
           │ 1. HTTP Request
           │    GET/POST/PATCH/DELETE
           │    Authorization: Bearer <token>
           ▼
┌─────────────────────┐
│   Backend API       │
│   (apps/api)        │
└──────────┬──────────┘
           │
           │ 2. Auth Middleware
           ├──▶ Verify Firebase Token
           │    Extract User UID
           │
           │ 3. Route Handler
           ├──▶ Check Subscription
           ├──▶ Check Feature Limits
           ├──▶ Process Request
           │
           │ 4. Database Operations
           ├──▶ Firestore Read/Write
           │
           │ 5. Response
           └──▶ JSON Response
           │
           ▼
┌─────────────────────┐
│   Client            │
│   Process Response  │
└─────────────────────┘
```

## Environment Variable Flow

### Development Environment

```
.env (Root)
    │
    ├──▶ apps/web/vite.config.ts
    │    │
    │    ├──▶ VITE_API_URL → Frontend Runtime
    │    ├──▶ VITE_FIREBASE_* → Frontend Runtime
    │    └──▶ GEMINI_API_KEY → Frontend Runtime
    │
    └──▶ apps/api/src/load-env.ts
         │
         ├──▶ FIREBASE_PROJECT_ID → Backend Runtime
         ├──▶ FIREBASE_CLIENT_EMAIL → Backend Runtime
         ├──▶ FIREBASE_PRIVATE_KEY → Backend Runtime
         ├──▶ RESEND_API_KEY → Backend Runtime
         └──▶ APP_URL → Backend Runtime (CORS)

apps/cli
    │
    └──▶ process.env.DERIVO_API_URL → CLI Runtime
         or ~/.derivo/config.json
```

### Production Environment (Vercel)

```
Vercel Project 1 (Frontend)
    │
    ├──▶ VITE_API_URL=https://api.yourdomain.com
    ├──▶ VITE_FIREBASE_API_KEY=xxx
    ├──▶ VITE_FIREBASE_AUTH_DOMAIN=xxx
    ├──▶ VITE_FIREBASE_PROJECT_ID=xxx
    ├──▶ VITE_FIREBASE_APP_ID=xxx
    └──▶ APP_URL=https://app.yourdomain.com

Vercel Project 2 (Backend)
    │
    ├──▶ APP_URL=https://app.yourdomain.com (CORS)
    ├──▶ FIREBASE_PROJECT_ID=xxx
    ├──▶ FIREBASE_CLIENT_EMAIL=xxx
    ├──▶ FIREBASE_PRIVATE_KEY=xxx
    ├──▶ RESEND_API_KEY=xxx
    └──▶ EMAIL_FROM=xxx

User's Machine (CLI)
    │
    └──▶ DERIVO_API_URL=https://api.yourdomain.com
         or ~/.derivo/config.json
```

## Module Boundaries

### Frontend (`apps/web`)

**Responsibilities:**
- User interface rendering
- Client-side routing
- Form validation
- Firebase client authentication
- API request orchestration
- State management

**Key Files:**
- `src/lib/api.ts` - Backend API client
- `src/lib/firebase.ts` - Firebase client SDK
- `src/pages/**` - Page components
- `src/components/**` - UI components

**Environment Variables:**
- `VITE_API_URL` - Backend endpoint
- `VITE_FIREBASE_*` - Firebase client config

### Backend (`apps/api`)

**Responsibilities:**
- API endpoint implementation
- Authentication & authorization
- Subscription & billing logic
- Device & session management
- API key management
- Email delivery
- Rate limiting
- Database operations

**Key Files:**
- `src/app.ts` - Express app setup
- `src/auth.ts` - Auth middleware
- `src/billing/**` - Subscription logic
- `src/identity/**` - Device/session management
- `src/security/**` - API key management
- `src/routes/**` - API endpoints

**Environment Variables:**
- `APP_URL` - Frontend URL (CORS)
- `FIREBASE_*` - Firebase Admin SDK
- `RESEND_API_KEY` - Email service

### CLI (`apps/cli`)

**Responsibilities:**
- Command-line interface
- Project analysis
- Backend API integration
- Local configuration
- Plugin system

**Key Files:**
- `src/index.ts` - CLI entry point
- `src/commands/**` - CLI commands
- `src/utils/api.ts` - Backend API client
- `src/utils/config.ts` - Config management

**Environment Variables:**
- `DERIVO_API_URL` - Backend endpoint

## Security Architecture

### Authentication Layers

```
Layer 1: Firebase Client SDK
    │
    ├──▶ Email/Password Authentication
    ├──▶ OAuth (Google, GitHub)
    ├──▶ Email Verification
    └──▶ Password Reset

Layer 2: Firebase ID Token
    │
    ├──▶ JWT Token Generated
    ├──▶ Short-lived (1 hour)
    ├──▶ Signed by Firebase
    └──▶ Contains User UID

Layer 3: Backend Verification
    │
    ├──▶ Extract Token from Authorization Header
    ├──▶ Verify Signature with Firebase Admin SDK
    ├──▶ Check Expiration
    ├──▶ Extract User UID
    └──▶ Attach to Request Context

Layer 4: Authorization
    │
    ├──▶ Check Subscription Status
    ├──▶ Check Feature Limits
    ├──▶ Check API Key Permissions (if applicable)
    └──▶ Allow/Deny Request
```

### API Key Flow (Alternative to User Auth)

```
Developer Creates API Key (Dashboard)
        │
        ▼
Backend Generates Key
(prefix_base62random + stored hash)
        │
        ▼
Developer Stores Key Securely
        │
        ▼
Request with API Key
(Authorization: Bearer sk_xxx)
        │
        ▼
Backend Validates Key
        │
        ├──▶ Check Format
        ├──▶ Verify Hash
        ├──▶ Check Status (active/revoked)
        ├──▶ Check Expiration
        ├──▶ Check Permissions
        └──▶ Allow/Deny
```

## Database Schema (Firestore)

```
users/{userId}
    ├── email
    ├── emailVerified
    ├── createdAt
    ├── subscription
    │   ├── planId
    │   ├── status
    │   ├── trialEndsAt
    │   └── renewsAt
    └── usage
        ├── projects
        ├── devices
        └── apiKeys

devices/{deviceId}
    ├── userId
    ├── name
    ├── fingerprint
    ├── os, arch, hostname
    ├── isTrusted
    ├── revoked
    ├── createdAt
    └── lastSeenAt

sessions/{sessionId}
    ├── userId
    ├── deviceId
    ├── createdAt
    ├── lastSeenAt
    └── active

apiKeys/{keyId}
    ├── userId
    ├── name
    ├── hash
    ├── status
    ├── environment
    ├── permissions
    ├── createdAt
    ├── expiresAt
    └── lastUsedAt

loginHistory/{eventId}
    ├── userId
    ├── type
    ├── deviceId
    ├── detail
    └── timestamp
```

## Deployment Architecture

### Development (Single Machine)

```
localhost:3000 (Frontend)
    │
    └──▶ VITE_API_URL=http://localhost:3001
         │
         ▼
localhost:3001 (Backend)
    │
    ├──▶ Firebase
    ├──▶ Resend
    └──▶ Firestore

CLI (same machine)
    │
    └──▶ DERIVO_API_URL=http://localhost:3001
         │
         └──▶ localhost:3001 (Backend)
```

### Production (Vercel - Separate Projects)

```
app.yourdomain.com (Frontend - Vercel App 1)
    │
    └──▶ VITE_API_URL=https://api.yourdomain.com
         │
         ▼
api.yourdomain.com (Backend - Vercel App 2)
    │
    ├──▶ Firebase (Google Cloud)
    ├──▶ Resend (Email Service)
    ├──▶ Firestore (Google Cloud)
    └──▶ CORS: app.yourdomain.com

CLI (User's Machine)
    │
    └──▶ DERIVO_API_URL=https://api.yourdomain.com
         │
         └──▶ api.yourdomain.com (Backend)
```

## Technology Stack

### Frontend Stack
```
┌─────────────────────┐
│   React 18          │  UI Library
├─────────────────────┤
│   TypeScript        │  Type Safety
├─────────────────────┤
│   Vite              │  Build Tool
├─────────────────────┤
│   Tailwind CSS      │  Styling
├─────────────────────┤
│   shadcn/ui         │  Component Library
├─────────────────────┤
│   React Router      │  Routing
├─────────────────────┤
│   Firebase SDK      │  Authentication
└─────────────────────┘
```

### Backend Stack
```
┌─────────────────────┐
│   Express           │  Web Framework
├─────────────────────┤
│   TypeScript        │  Type Safety
├─────────────────────┤
│   Firebase Admin    │  Auth & Database
├─────────────────────┤
│   Resend            │  Email Delivery
├─────────────────────┤
│   CORS              │  Cross-Origin
├─────────────────────┤
│   Body Parser       │  JSON Parsing
└─────────────────────┘
```

### CLI Stack
```
┌─────────────────────┐
│   Node.js           │  Runtime
├─────────────────────┤
│   TypeScript        │  Type Safety
├─────────────────────┤
│   Commander.js      │  CLI Framework
├─────────────────────┤
│   Inquirer          │  Interactive Prompts
├─────────────────────┤
│   Chalk             │  Terminal Colors
└─────────────────────┘
```

### Build & Deploy Stack
```
┌─────────────────────┐
│   Turborepo         │  Monorepo Build
├─────────────────────┤
│   pnpm              │  Package Manager
├─────────────────────┤
│   ESLint            │  Linting
├─────────────────────┤
│   Prettier          │  Formatting
├─────────────────────┤
│   Vercel            │  Hosting
└─────────────────────┘
```

## Communication Protocols

### HTTP/HTTPS
- Frontend ↔ Backend: RESTful API
- CLI ↔ Backend: RESTful API
- All production traffic over HTTPS

### Authentication
- Bearer Token (Firebase ID Token)
- API Key (Bearer Token for programmatic access)

### Data Format
- JSON for all API requests/responses
- UTF-8 encoding

## Scalability Considerations

### Horizontal Scaling
- Frontend: Vercel Edge Network (automatic)
- Backend: Vercel Serverless Functions (automatic)
- CLI: Runs locally (no scaling needed)

### Vertical Scaling
- Database: Firestore (managed by Google)
- Email: Resend (managed service)
- Storage: Firebase Storage (managed by Google)

### Caching Strategy
- Frontend: Browser cache, Service Workers (future)
- Backend: Firestore automatic caching
- CDN: Vercel Edge Network

## Monitoring & Observability

### Logging
- Frontend: Console logs (development only)
- Backend: Vercel logs, console.log/error
- CLI: stdout/stderr

### Error Tracking
- Frontend: Browser DevTools
- Backend: Vercel logs
- CLI: Exit codes and error messages

### Analytics (Planned)
- User analytics (Vercel Analytics)
- API usage tracking
- Performance monitoring

---

**Related Documentation:**
- [README.md](./README.md) - Project overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ENV_VARS.md](./ENV_VARS.md) - Environment variables
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
