# Derivo Architecture & Monorepo Blueprint

**Status:** Approved  
**Author:** Principal Software Architect  
**Scope:** Phase 1.5 - Production-grade File Structure & Architecture Blueprint  

This document defines the definitive file structure, architecture, and governance rules for the Derivo platform. It is designed to scale gracefully over the next 2 years, supporting 20,000+ commits, multiple teams, and 50+ features without requiring major structural migrations.

Everything is contained within a single **Turborepo** monorepo workspace.

---

## 1. Root Folder Structure

The repository root is strictly for orchestration, configuration, and workspace management.

```text
derivo-monorepo/
├── apps/                 # Deployable applications (Web, API, CLI, Docs)
├── packages/             # Internal shared libraries and tools
├── tooling/              # Custom internal CLI scripts and development tools
├── docker/               # Monorepo-wide Docker compose and infrastructure definitions
├── scripts/              # CI/CD, migration, and maintenance bash/node scripts
├── configs/              # Centralized environment templates and IDE settings
├── docs/                 # Internal repository documentation (RFCs, ADRs, Architecture)
├── .github/              # GitHub Actions workflows, issue templates, PR templates
├── .husky/               # Git hooks (pre-commit, commit-msg)
├── turbo.json            # Turborepo pipeline configuration
├── package.json          # Root workspace definitions
└── pnpm-workspace.yaml   # pnpm workspace mapping
```

**Why this exists:** Separation of concerns. Code that is deployed goes in `apps/`. Code that is shared goes in `packages/`. Automation goes in `scripts/` or `tooling/`. This prevents the root directory from becoming a dumping ground.

---

## 2. Apps Folder

Each directory in `apps/` is an isolated, deployable application. They do not depend on each other, only on `packages/`.

```text
apps/
├── web/                  # Public marketing website (Next.js App Router)
├── dashboard/            # Authenticated web application (React/Vite or Next.js SPA)
├── api/                  # Core backend REST API (NestJS or Express)
├── cli/                  # Command Line Interface application (Node.js)
├── docs/                 # Public documentation site (Mintlify or Nextra)
├── vscode-extension/     # (Future) VS Code plugin ecosystem
└── ai-service/           # (Future) Isolated AI microservice (Python/Go)
```

**Responsibilities:**
- `web`: Optimized for SEO, conversions, and speed. No heavy application logic.
- `dashboard`: Heavy client-side state, complex routing, data visualization.
- `api`: Source of truth for business logic, database mutations, and authentication.
- `cli`: Local execution, file system manipulation, daemon orchestration.

---

## 3. Packages Folder

These are modular, versioned (internally) packages shared across the monorepo.

```text
packages/
├── ui/                   # Shared React component library (Tailwind, Radix)
├── db/                   # Database schemas, ORM clients, migrations
├── core/                 # Shared domain logic, TS types, validation schemas (Zod)
├── auth/                 # Shared authentication strategies and session utilities
├── billing/              # Stripe integrations, pricing models, entitlement logic
├── logger/               # Standardized isomorphic logging service (Pino)
├── utils/                # Pure utility functions (dates, formatting)
├── config-eslint/        # Base ESLint configurations
├── config-typescript/    # Base tsconfig.json extensions
└── plugins-core/         # Abstract base classes and types for the CLI plugin engine
```

**Ownership:**
Packages must be strictly domain-bound. If `apps/api` and `apps/dashboard` both need user validation schemas, it lives in `@derivo/core`. If it is UI, it lives in `@derivo/ui`.

---

## 4. API Structure (`apps/api`)

The API follows a strict **Domain-Driven Feature Module** architecture.

```text
apps/api/src/
├── app.module.ts
├── main.ts
├── common/               # API-specific interceptors, filters, guards
└── modules/
    ├── auth/             # Login, registration, OAuth, JWT validation
    ├── users/            # Profile management, preferences
    ├── projects/         # Project CRUD, environment associations
    ├── devices/          # CLI device registration, machine IDs
    ├── teams/            # RBAC, invitations, organization management
    ├── billing/          # Stripe webhooks, subscriptions
    ├── cli/              # Endpoints specifically serving the CLI agent
    ├── plugins/          # Plugin registry and version resolution
    ├── analytics/        # Telemetry ingestion from CLI
    ├── health/           # Liveness/readiness probes
    └── webhooks/         # Inbound third-party webhooks
```

**Hierarchy per module:** Each module folder contains `controller`, `service`, `repository` (if not using `@derivo/db` directly), and `dto` files. No leaking logic across modules.

---

## 5. Dashboard Structure (`apps/dashboard`)

The dashboard uses **Feature-Based Routing Architecture**.

```text
apps/dashboard/src/
├── app/                  # Route definitions (Next.js app directory or React Router)
│   ├── (auth)/           # login, register, forgot-password
│   ├── (dashboard)/      # dashboard layout wrapper
│   │   ├── projects/
│   │   ├── devices/
│   │   ├── teams/
│   │   ├── plugins/
│   │   ├── activity/
│   │   ├── settings/
│   │   └── profile/
├── features/             # Business logic grouped by feature
│   ├── projects/         # components/, hooks/, api/, types/
│   ├── teams/            # components/, hooks/, api/, types/
│   └── billing/          # components/, hooks/, api/, types/
└── shared/               # Dashboard-specific shared UI (layouts, navbars)
```

**Why:** Feature folders scale infinitely. Route folders stay clean and purely declarative.

---

## 6. Landing Website Structure (`apps/web`)

Every marketing page has a dedicated route. No single-page hash-anchor scrolling sites.

```text
apps/web/app/
├── layout.tsx
├── page.tsx              # / (Hero, CLI Demo, Value Props)
├── features/             # /features
├── how-it-works/         # /how-it-works
├── pricing/              # /pricing
├── install/              # /install (Download instructions, curl scripts)
├── blog/                 # /blog (Contentlayer / MDX integration)
├── about/                # /about
├── contact/              # /contact
├── (legal)/
│   ├── privacy/          # /privacy
│   └── terms/            # /terms
└── (auth-redirects)/
    ├── login/            # /login (redirects to dashboard)
    └── register/         # /register (redirects to dashboard)
```

---

## 7. Documentation Structure (`apps/docs`)

```text
apps/docs/content/
├── get-started/
│   ├── installation.mdx
│   └── quickstart.mdx
├── cli-reference/
│   ├── setup.mdx
│   ├── doctor.mdx
│   └── commands.mdx
├── plugins/
│   ├── node.mdx
│   ├── docker.mdx
│   └── database.mdx
├── configuration/
│   ├── derivo-json.mdx
│   └── environment-variables.mdx
├── troubleshooting/
│   ├── common-errors.mdx
│   └── faq.mdx
└── api/
    └── rest-api.mdx
```

---

## 8. CLI Structure (`apps/cli`)

The CLI uses a modular command pattern to keep the executable fast and isolated.

```text
apps/cli/src/
├── index.ts              # Binary entry point (commander / yargs)
├── core/                 # Execution engine, config parser, telemetry runner
├── commands/             # Isolated command logic
│   ├── setup/
│   ├── doctor/
│   ├── login/
│   ├── logout/
│   ├── status/
│   └── version/
├── services/             # External interactions (API client, Docker daemon API)
├── utils/                # Terminal formatting, spinners, file-system helpers
└── types/                # CLI-specific interfaces
```

---

## 9. Plugin System

Plugins are self-contained definitions of how Derivo sets up specific technologies.

```text
packages/plugins/
├── plugin-node/          # NVM/fnm detection, package.json parsing
├── plugin-docker/        # Daemon checks, docker-compose parsing
├── plugin-postgres/      # PG ready-state polling, port conflict resolution
├── plugin-redis/         # Redis connection checks
├── plugin-nextjs/        # Next.js specific build/cache optimizations
├── plugin-python/        # pip/poetry/conda environment detection
└── plugin-go/            # GOPATH and module resolution
```

**Architecture:** Each plugin implements a strict `DerivoPluginInterface` exporting lifecycle hooks (`detect`, `validate`, `install`, `start`, `diagnose`). Future plugins require zero changes to the core CLI orchestrator.

---

## 10. Database Folder (`packages/db`)

```text
packages/db/
├── src/
│   ├── schema/           # Table definitions (users, projects, devices)
│   ├── relations/        # ORM relation definitions
│   ├── migrations/       # Generated SQL migration files
│   ├── seeds/            # Deterministic seed data for local dev & testing
│   ├── queries/          # Optimized, reusable prepared statements
│   ├── repositories/     # Data access layer wrappers (if necessary)
│   └── index.ts          # Client instantiation and exports
└── drizzle.config.ts     # ORM configuration
```

---

## 11. Shared Assets

```text
packages/ui/assets/       # Or centralized in apps/web/public depending on bundler
├── icons/                # SVG icon library
├── logos/                # Derivo brand marks (dark/light, wordmark, symbol)
├── illustrations/        # Custom vector art for empty states/errors
├── fonts/                # Inter, JetBrains Mono (local hosting)
└── animations/           # Lottie JSON files
```

---

## 12. Public Assets

Stored in `apps/*/public/`.

```text
public/
├── favicon.ico
├── favicon.svg
├── apple-touch-icon.png
├── site.webmanifest
├── robots.txt
├── sitemap.xml
├── og-image.jpg          # Default Open Graph social preview
└── downloads/            # Install scripts (e.g., install.sh)
```

---

## 13. Configuration Files

```text
(Root & Package levels)
├── .editorconfig         # IDE indention rules
├── .prettierrc           # Formatting rules
├── .eslintrc.js          # Linting rules
├── commitlint.config.js  # Git commit message enforcement
├── lint-staged.config.js # Pre-commit targeting
├── turbo.json            # Build caching and pipeline
├── tailwind.config.ts    # Design tokens
├── tsconfig.json         # TypeScript strict mode
└── .env.example          # Safe environment templates
```

---

## 14. Scripts (`scripts/`)

```text
scripts/
├── setup.sh              # Bootstraps local monorepo
├── build-all.sh          # Parallel builds
├── db-seed.ts            # Wipes and seeds database
├── generate-types.ts     # OpenAPI to TS generators
├── cleanup.sh            # Removes all node_modules and turbo caches
└── release.sh            # Version bumping and changelog generation
```

---

## 15. Testing Structure

```text
(Inside any app or package)
├── src/
│   └── utils.test.ts     # Co-located Unit tests
├── tests/
│   ├── integration/      # Cross-module tests
│   ├── e2e/              # Playwright / Cypress full flows
│   ├── fixtures/         # Static test data (mock package.jsons, etc)
│   ├── mocks/            # MSW network mocks, Jest module mocks
│   └── test-utils/       # Custom render functions, database setup/teardown hooks
└── coverage/             # Istanbul/V8 coverage reports
```

---

## 16. Naming Conventions

- **Folders:** `kebab-case` (e.g., `user-profile`, `auth-module`).
- **Files (Logic):** `kebab-case` (e.g., `string-utils.ts`, `auth.controller.ts`).
- **Files (React Components):** `PascalCase` (e.g., `UserAvatar.tsx`, `FeatureCard.tsx`).
- **Classes/Interfaces:** `PascalCase` (e.g., `class SetupCommand`, `interface UserData`).
- **Hooks:** `camelCase`, prefixed with `use` (e.g., `useAuth.ts`).
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`).
- **Environment Variables:** `UPPER_SNAKE_CASE`, with context (e.g., `NEXT_PUBLIC_API_URL`).
- **Branches:** `type/ticket-description` (e.g., `feat/CLI-102-add-redis-plugin`, `fix/WEB-09-button-alignment`).
- **Commits:** Conventional Commits (e.g., `feat(cli): add docker daemon validation`).

---

## 17. Import Rules

Strict path aliases configured in `tsconfig.json`:

- `@/components/*` -> `src/components/*`
- `@/features/*` -> `src/features/*`
- `@/lib/*` -> `src/lib/*`
- `@repo/ui` -> Workspace package import
- `@repo/core` -> Workspace package import

**Rule:** No relative imports going up more than one level (`../../`). If you need `../../`, you must use an alias like `@/` or extract the code to a package.

---

## 18. Feature Architecture (Vertical Slicing)

Features must be self-contained. 

**CORRECT (`src/features/projects/`):**
```text
projects/
├── components/           # ProjectCard, ProjectList
├── hooks/                # useProjects
├── api/                  # fetchProjects, mutateProject
├── types/                # Project types
└── utils/                # Project-specific parsers
```

**INCORRECT (The Giant Shared Dump):**
Do NOT dump all API calls into `src/api/` or all types into `src/types/`. Features own their data requirements.

---

## 19. Scalability Rules

1. **Rule of 3 (Abstraction):** Do not extract code into a shared package (`@repo/*`) until it is actively required by at least 3 different consumers (apps). Duplication is cheaper than the wrong abstraction early on.
2. **Feature First:** Always create a vertical feature folder before creating a shared global component.
3. **Module Boundaries:** `apps/api` must never import from `apps/dashboard`. Apps only communicate via network requests or by importing shared `@repo/` packages.

---

## 20. Forbidden Practices

- **NO Utils Folder Dumping:** If a utility is for dates, name it `date-utils.ts`. Do not dump 50 unrelated functions into a single `index.ts` or `utils.ts` file.
- **NO Components Folder Dumping:** Create subfolders for domains (e.g., `components/layout/`, `components/forms/`).
- **NO Barrel Export Abuse:** Do not create `index.ts` files that just re-export 20 files if it causes circular dependency loops. Only barrel at feature boundaries.
- **NO Business Logic in UI:** React components must only handle rendering and local state. Complex logic goes in custom hooks or pure functions.
- **NO API Calls inside UI Components:** Fetching must happen via hooks (React Query / SWR) or Server Components.
- **NO Magic Strings:** Use ENUMs or strict constant objects for statuses, roles, and event names.
- **NO Circular Dependencies:** Lint rules must enforce strict dependency graphs.

---

## 21. Final Directory Tree

```text
derivo/
├── apps/
│   ├── api/
│   ├── cli/
│   ├── dashboard/
│   ├── docs/
│   └── web/
├── packages/
│   ├── auth/
│   ├── billing/
│   ├── config-eslint/
│   ├── config-typescript/
│   ├── core/
│   ├── db/
│   ├── logger/
│   ├── plugins/
│   │   ├── plugin-docker/
│   │   ├── plugin-node/
│   │   └── plugin-postgres/
│   ├── ui/
│   └── utils/
├── configs/
├── docker/
├── scripts/
├── .github/
├── .husky/
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## 22. Architecture Review (Post-Mortem)

**Google Principal Engineer Perspective:**
*Critique:* The separation of concerns is rigorous. The boundary between CLI and backend API is well respected. 
*Adjustment Made:* I initially considered keeping plugins inside the CLI app. However, extracting them to `packages/plugins/` ensures the Dashboard can eventually import the plugin schemas to render dynamic UI settings without depending on CLI source code.

**Vercel Staff Engineer Perspective:**
*Critique:* The caching strategy will be highly effective. `apps/web` and `apps/dashboard` can build entirely independently.
*Adjustment Made:* Enforced standard `@repo/*` naming for packages instead of `@derivo/*` to align with Turborepo generator standards, reducing cognitive load for new hires used to standard Vercel tooling.

**Turborepo Maintainer Perspective:**
*Critique:* The package granularity is excellent. Keeping ESLint and TSConfig in their own packages prevents `devDependencies` pollution across the monorepo.
*Adjustment Made:* Added strict import alias rules (Section 17) to prevent "ghost imports" and guarantee the dependency graph remains acyclic, which is critical for Turbo's remote caching algorithms.
