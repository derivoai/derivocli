# Derivo Documentation Index

Welcome to Derivo! This index will help you find the right documentation for your needs.

## 🚀 I want to...

### Get Started

| Goal | Document | Time | Description |
|------|----------|------|-------------|
| **Understand what Derivo is** | [README.md](./README.md) | 5 min | Project overview, features, tech stack |
| **Set up locally fast** | [QUICK_START.md](./QUICK_START.md) | 10 min | Fastest path to running locally |
| **Deploy to production** | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | 30 min | Step-by-step Vercel deployment |

### Learn the System

| Goal | Document | Time | Description |
|------|----------|------|-------------|
| **Understand the architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) | 15 min | System design, data flow, tech stack |
| **See connection diagrams** | [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md) | 10 min | Visual connection architecture |
| **Learn about environment variables** | [ENV_VARS.md](./ENV_VARS.md) | 10 min | Complete variable reference |

### Deploy & Configure

| Goal | Document | Time | Description |
|------|----------|------|-------------|
| **Deploy to Vercel (practical)** | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | 30 min | Copy-paste friendly deployment guide |
| **Deploy to Vercel (comprehensive)** | [DEPLOYMENT.md](./DEPLOYMENT.md) | 45 min | Detailed deployment with troubleshooting |
| **Configure environment variables** | [ENV_VARS.md](./ENV_VARS.md) | 10 min | All variables with examples |
| **Set up custom domains** | [DEPLOYMENT.md](./DEPLOYMENT.md#custom-domains) | 15 min | Custom domain configuration |

### Troubleshoot

| Goal | Document | Section | Description |
|------|----------|---------|-------------|
| **Fix connection issues** | [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) | Troubleshooting | Common issues and solutions |
| **Debug CORS errors** | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#common-issues--fixes) | Common Issues | CORS-specific fixes |
| **CLI not connecting** | [ENV_VARS.md](./ENV_VARS.md#cli-variables) | CLI Variables | CLI configuration guide |
| **Environment vars not working** | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#common-issues--fixes) | Common Issues | Variable configuration fixes |

### Understand What Was Done

| Goal | Document | Time | Description |
|------|----------|------|-------------|
| **See what was changed** | [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) | 5 min | What was modified and why |
| **Understand the setup** | [docs/BACKEND_URL_SETUP_COMPLETE.md](./docs/BACKEND_URL_SETUP_COMPLETE.md) | 10 min | Complete setup summary |

---

## 📂 Documentation Files

### Core Documentation

| File | Purpose | Audience | Priority |
|------|---------|----------|----------|
| **README.md** | Project overview and quick start | Everyone | ⭐⭐⭐⭐⭐ |
| **QUICK_START.md** | Fast setup reference | Developers | ⭐⭐⭐⭐⭐ |
| **DEPLOYMENT.md** | Comprehensive deployment guide | DevOps/Developers | ⭐⭐⭐⭐ |
| **VERCEL_DEPLOY.md** | Practical Vercel deployment | Developers | ⭐⭐⭐⭐⭐ |
| **ENV_VARS.md** | Environment variables reference | Developers | ⭐⭐⭐⭐ |

### Technical Documentation

| File | Purpose | Audience | Priority |
|------|---------|----------|----------|
| **ARCHITECTURE.md** | System architecture and design | Technical leads | ⭐⭐⭐ |
| **CONNECTION_DIAGRAM.md** | Visual connection diagrams | Everyone | ⭐⭐⭐⭐ |
| **DESIGN.md** | Product design specification | Designers/PMs | ⭐⭐ |

### Reference Documentation

| File | Purpose | Audience | Priority |
|------|---------|----------|----------|
| **SETUP_SUMMARY.md** | What was changed | Developers | ⭐⭐ |
| **docs/BACKEND_URL_SETUP_COMPLETE.md** | Setup completion summary | Developers | ⭐⭐ |
| **DOCUMENTATION_INDEX.md** | This file - navigation help | Everyone | ⭐⭐⭐ |

### Configuration Files

| File | Purpose | Commit? |
|------|---------|---------|
| `.env` | Local environment configuration | ❌ No (gitignored) |
| `.env.example` | Environment template | ✅ Yes |
| `apps/web/vite.config.ts` | Vite configuration | ✅ Yes |

---

## 🎯 Common User Journeys

### Journey 1: New Developer - First Time Setup

1. Read [README.md](./README.md) - Understand the project
2. Follow [QUICK_START.md](./QUICK_START.md) - Set up locally
3. Check [ENV_VARS.md](./ENV_VARS.md) - Configure environment
4. (Optional) Review [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand system

**Time: 30 minutes**

---

### Journey 2: Deploy to Production

1. Read [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Step-by-step deployment
2. Follow deployment checklist in the guide
3. If issues arise, check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting
4. Verify with [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md)

**Time: 1 hour**

---

### Journey 3: Troubleshooting Connection Issues

1. Check [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md) - Understand flow
2. Verify [ENV_VARS.md](./ENV_VARS.md) - Check configuration
3. Follow [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) - Specific fixes
4. Use [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#verification-commands) - Test

**Time: 15-30 minutes**

---

### Journey 4: Understanding the Codebase

1. Read [README.md](./README.md) - High-level overview
2. Study [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
3. Review [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md) - Data flow
4. Explore [DESIGN.md](./DESIGN.md) - Product design

**Time: 1-2 hours**

---

## 📖 Documentation by Topic

### Environment Variables

- **Quick Reference**: [QUICK_START.md](./QUICK_START.md#environment-variables)
- **Complete Reference**: [ENV_VARS.md](./ENV_VARS.md)
- **Template**: `.env.example`
- **Troubleshooting**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#environment-variables-quick-reference)

### Deployment

- **Quick Deploy**: [QUICK_START.md](./QUICK_START.md#deploy-to-vercel)
- **Practical Guide**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
- **Comprehensive Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Troubleshooting**: [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

### Architecture

- **System Overview**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Connection Flow**: [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md)
- **Data Flow**: [ARCHITECTURE.md](./ARCHITECTURE.md#data-flow)
- **Security**: [ARCHITECTURE.md](./ARCHITECTURE.md#security-architecture)

### Configuration

- **Local Setup**: [QUICK_START.md](./QUICK_START.md#local-development)
- **Production Setup**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
- **Environment Vars**: [ENV_VARS.md](./ENV_VARS.md)
- **CLI Config**: [ENV_VARS.md](./ENV_VARS.md#cli-variables)

### Troubleshooting

- **Quick Fixes**: [QUICK_START.md](./QUICK_START.md#common-issues)
- **Common Issues**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#common-issues--fixes)
- **Comprehensive Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)
- **Debug Tools**: [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md#debugging-connection-issues)

---

## 🔍 Quick Search

### I'm getting...

| Error/Issue | Solution | Document |
|-------------|----------|----------|
| "Cannot reach backend" | Check VITE_API_URL | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#issue-frontend-shows-cannot-reach-backend) |
| CORS errors | Check APP_URL on backend | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#issue-cors-errors-in-browser-console) |
| CLI connects to localhost | Set DERIVO_API_URL | [ENV_VARS.md](./ENV_VARS.md#cli-variables) |
| Firebase auth errors | Check Firebase config | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#issue-firebase-authentication-errors) |
| Email not sending | Check Resend config | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#issue-email-verification-not-sending) |
| Env vars not working | Redeploy after changes | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#issue-environment-variables-not-working) |

### I need to...

| Task | Guide | Document |
|------|-------|----------|
| Run locally | Local setup guide | [QUICK_START.md](./QUICK_START.md#local-development) |
| Deploy to Vercel | Deployment steps | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) |
| Add custom domain | Domain setup | [DEPLOYMENT.md](./DEPLOYMENT.md#custom-domains-recommended) |
| Configure CLI for users | CLI setup | [ENV_VARS.md](./ENV_VARS.md#cli-variables) |
| Set up Firebase | Firebase config | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#part-3-configure-firebase-5-minutes) |
| Check logs | Logging commands | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#verification-commands) |
| Understand data flow | Flow diagrams | [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md#request-flow---authentication) |
| See what changed | Change summary | [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) |

---

## 📱 Documentation Format Guide

### Quick Reference Documents
- **Format**: Checklists, commands, quick fixes
- **Examples**: QUICK_START.md, VERCEL_DEPLOY.md
- **Use when**: You need to do something fast

### Comprehensive Guides
- **Format**: Detailed explanations, theory, options
- **Examples**: DEPLOYMENT.md, ENV_VARS.md, ARCHITECTURE.md
- **Use when**: You need deep understanding

### Visual Guides
- **Format**: Diagrams, flowcharts, architecture
- **Examples**: CONNECTION_DIAGRAM.md, ARCHITECTURE.md
- **Use when**: You learn better visually

### Reference Documents
- **Format**: Tables, lists, complete information
- **Examples**: ENV_VARS.md, DOCUMENTATION_INDEX.md
- **Use when**: You need to look something up

---

## 🎓 Learning Path

### Beginner Path (First Day)

1. **Start**: [README.md](./README.md) - 5 minutes
2. **Setup**: [QUICK_START.md](./QUICK_START.md) - 30 minutes
3. **Visual**: [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md) - 10 minutes
4. **Practice**: Run locally and explore

**Total: ~1 hour**

### Intermediate Path (First Week)

1. Review beginner path
2. **Deploy**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - 1 hour
3. **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) - 30 minutes
4. **Config**: [ENV_VARS.md](./ENV_VARS.md) - 20 minutes
5. **Practice**: Deploy to staging

**Total: ~2.5 hours**

### Advanced Path (First Month)

1. Review intermediate path
2. **Full Deploy**: [DEPLOYMENT.md](./DEPLOYMENT.md) - 1 hour
3. **Design**: [DESIGN.md](./DESIGN.md) - 2 hours
4. **Changes**: [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - 15 minutes
5. **Practice**: Full production deployment

**Total: ~4 hours**

---

## 🔗 External Resources

### Services Used

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Firebase**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Resend**: [resend.com/docs](https://resend.com/docs)
- **Vite**: [vitejs.dev](https://vitejs.dev)
- **React**: [react.dev](https://react.dev)

### Tools

- **pnpm**: [pnpm.io](https://pnpm.io)
- **Turborepo**: [turbo.build](https://turbo.build)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)

---

## 💡 Tips for Using This Documentation

### For Quick Tasks
→ Use **QUICK_START.md** or **VERCEL_DEPLOY.md**

### For Understanding
→ Use **ARCHITECTURE.md** or **CONNECTION_DIAGRAM.md**

### For Reference
→ Use **ENV_VARS.md** or **DEPLOYMENT.md**

### For Troubleshooting
→ Check the relevant guide's troubleshooting section

### When Stuck
1. Check this index for relevant document
2. Use the search feature in your editor
3. Follow the "I'm getting..." quick search above
4. Review connection diagrams

---

## ✅ Documentation Checklist

Before deploying to production:

- [ ] Read [README.md](./README.md)
- [ ] Complete [QUICK_START.md](./QUICK_START.md) locally
- [ ] Understand [CONNECTION_DIAGRAM.md](./CONNECTION_DIAGRAM.md)
- [ ] Follow [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
- [ ] Configure all variables from [ENV_VARS.md](./ENV_VARS.md)
- [ ] Complete deployment checklist in [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
- [ ] Verify connections work
- [ ] Bookmark this index for reference

---

## 📝 Contributing to Documentation

Found an issue or want to improve docs?

1. File an issue with `[docs]` prefix
2. Submit a PR with clear description
3. Follow existing formatting style
4. Update this index if adding new docs

---

## 🎯 Need Help?

**Can't find what you need?**

1. Use Ctrl+F to search this index
2. Check the "I need to..." section
3. Review the "I'm getting..." section
4. Follow a learning path above

**Still stuck?**
- Check troubleshooting sections in relevant guides
- Review connection diagrams
- Verify environment variables
- Check deployment logs

---

## 📊 Documentation Statistics

| Type | Count | Total Words |
|------|-------|-------------|
| Core Guides | 5 | ~25,000 |
| Technical Docs | 3 | ~20,000 |
| Reference Docs | 3 | ~10,000 |
| **Total** | **11** | **~55,000** |

**Last Updated**: 2026-07-01

---

**Happy Building! 🚀**

Start with [README.md](./README.md) or jump to [QUICK_START.md](./QUICK_START.md) to begin!
