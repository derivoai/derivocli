# Derivo Core Engine Architecture (Phase 8)

**Status:** Approved  
**Author:** Vercel Principal Engineer, pnpm Maintainer, Docker Maintainer  
**Scope:** Automated Setup Workflow, Stack Detection, Installation, Configuration Generation

This document defines the architecture of the **Derivo Core Engine**—the heart of the product. The core engine translates raw repositories into fully configured local environments using automated detection and intelligent tooling. It encapsulates logic across modular, narrowly-scoped packages inside the Turborepo workspace.

---

## 1. Core Engine Architecture

The Core Engine is built on an **adapter and pipeline-based** architecture. It strictly avoids monolithic execution scripts. Instead, it processes projects through sequential phases (Detection, Validation, Configuration, Installation, Execution, Reporting). Every capability (e.g., detecting Next.js, running pnpm, starting Postgres) is handled via plugins and adapters.

**Core Principles:**
- **Zero Configuration First:** Assumes a complete absence of `derivo.config.json` initially.
- **Fail Gracefully:** Avoid dumping raw stack traces. Provide actionable feedback.
- **Idempotency:** Re-running `derivo setup` multiple times must be safe and performant.
- **Pluggability:** Core logic never references specific tools like React or Postgres. It queries registered plugins.

---

## 2. Workflow Diagram

The `derivo setup` lifecycle operates via the `setup-engine` orchestrator:

1. **Initialization:** Invoked via `apps/cli` -> `setup-engine`.
2. **Project Detection:** Scans the FS for config files and lockfiles.
3. **Environment Detection:** Scans the OS for binaries (Docker, pnpm, node) and checks constraints.
4. **Stack Analysis:** Analyzes files to determine Frameworks, Databases, and ORMs.
5. **Config Generation:** Prompts user *only* for missing data, generates `derivo.config.json`.
6. **Dependency Detection:** Compares required tools against the host OS.
7. **Installation Pipeline:** Installs system binaries, sets up containers, installs node/python dependencies.
8. **Validation:** Verifies ports are open, containers are running, environments match.
9. **File Generation:** Templates missing `.env` files or default configuration files.
10. **Command Execution:** Uses adapters to start the project (e.g., `pnpm dev`, `docker compose up`).
11. **Reporting:** Outputs a beautiful terminal summary.

---

## 3. Package Structure

The Turborepo workspace is expanded with strictly-scoped engine packages:

```text
packages/
  ├── setup-engine/         # Orchestrates the setup pipeline
  ├── project-detector/     # Scans manifests (package.json, lockfiles)
  ├── environment-detector/ # Checks OS, path, installed tools, and open ports
  ├── stack-analyzer/       # Infers frameworks and architectures (Next.js, Prisma, etc.)
  ├── config-generator/     # Prompts user and creates `derivo.config.json`
  ├── dependency-detector/  # Cross-references project needs vs. installed tools
  ├── installer-engine/     # Installs missing software/containers
  ├── template-engine/      # Generates missing files (.env, Dockerfile)
  ├── validator-engine/     # Validates post-install configurations and health
  ├── filesystem-engine/    # Wraps `fs`, provides caching and AST transformations
  ├── runtime-manager/      # Manages processes (Node, Docker)
  ├── package-manager/      # Adapters for pnpm, bun, npm, yarn, etc.
  ├── command-executor/     # Standardized child-process execution
  └── report-generator/     # Renders the final health score and summary UI
```

---

## 4. Folder Structure (setup-engine Example)

Every package enforces isolation of concerns:

```text
packages/setup-engine/
├── src/
│   ├── index.ts                # Public API
│   ├── pipeline.ts             # Sequential state machine executing the workflow
│   ├── errors.ts               # Custom Error classes (e.g., SetupAbortedError)
│   ├── types.ts                # Pipeline state interfaces
│   ├── validation/             # Zod schemas for internal state transitions
│   └── tests/                  # Integration tests across engine modules
└── package.json
```

---

## 5. Detection Pipeline

**1. Project Detector:**
Finds indicator files (`package.json`, `Cargo.toml`, `docker-compose.yml`, `drizzle/`). 
**2. Stack Analyzer:**
Calculates a confidence score.
*Example:* If `next` is in `package.json` dependencies and `next.config.js` exists -> `Next.js (Confidence: 100%)`.
**3. Environment Detector:**
Uses `which` or `where` to locate `node`, `docker`, `psql`. Identifies OS (Windows/WSL/macOS ARM64) to tailor installation paths.

---

## 6. Configuration Strategy

- **First Run:** `config-generator` takes the output of the Stack Analyzer. If a database is found (e.g., `prisma/schema.prisma`), it does *not* ask what database is used. It only asks for missing credentials or port overrides.
- **Persistence:** Outputs `derivo.config.json`.
- **Extensibility:** The schema supports plugins and custom lifecycle scripts:
  ```json
  {
    "framework": "nextjs",
    "runtime": "node20",
    "services": {
      "db": { "type": "postgres", "port": 5432 }
    },
    "commands": {
      "start": "pnpm dev"
    }
  }
  ```

---

## 7. Validation Pipeline

Before starting the server, `validator-engine` enforces constraints:
- Node.js version satisfies `engines` in `package.json`.
- Required environment variables (`.env`) are present and not empty.
- Port `5432` is not already bound by a competing process.
- Docker daemon is running (if containerized services are required).

---

## 8. Installation Pipeline

The `installer-engine` acts on the missing dependencies list.
- **System Binaries:** Provides instructions or automated scripts (e.g., `brew install redis`) depending on the OS.
- **Containers:** Uses `runtime-manager` to execute `docker run` or `docker compose up -d` for missing services.
- **Dependencies:** Uses the `package-manager` adapter to run `pnpm install` or `bun install`.

---

## 9. Error Recovery Strategy

Error messages are designed for developers. No raw stack traces.

**Pattern:** `[Issue] -> [Cause] -> [Automatic Fix available?] -> [Manual Steps]`

*Example:*
> ✖ **Failed to start PostgreSQL.**
> **Cause:** Port 5432 is already in use by another process (PID 1234).
> **Action:** Would you like Derivo to map PostgreSQL to port 5433 automatically? (Y/n)

---

## 10. Report Generation

At the end of the pipeline, the `report-generator` uses the `terminal-ui` package to render a beautiful summary.

```text
✔ Setup Complete! (Took 12.4s)

📦 Stack Detected
  Framework: Next.js (14.2)
  Database: PostgreSQL (Docker)
  Package Manager: pnpm

🛠 Actions Taken
  - Installed 432 npm packages
  - Started postgres:15 container
  - Generated .env.local

🚀 Next Steps
  Run `derivo dev` to start your workspace.
```

---

## 11. Plugin Integration

The entire engine is built to be agnostic. 

- **Interfaces:** We define `IAnalyzerPlugin`, `IRuntimePlugin`, etc.
- **Registration:** Plugins register their detection signatures.
  ```typescript
  // Example pseudo-code for a plugin
  registerPlugin({
    name: 'Next.js',
    detect: async (fs) => await fs.exists('next.config.js'),
    setup: async (env) => { /* Next.js specific logic */ }
  });
  ```
- **Strict Boundaries:** Hardcoding `if (isNextJs)` in the core pipeline is strictly forbidden.

---

## 12. Testing Strategy

- **Mock Repositories:** We maintain a folder of "fixtures" (e.g., `fixtures/next-postgres-monorepo`, `fixtures/python-django`) to integration test the Stack Analyzer.
- **File System Mocking:** `memfs` is used to simulate complex project structures in memory without touching the real disk.
- **Golden Tests:** Run the CLI against a fixture and compare the output `derivo.config.json` and terminal report against a snapshot.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Inaccurate Stack Detection | Analyzer must rely on multiple signals (files + dependencies) and expose a "Confidence Score". If confidence is <80%, prompt the user to confirm. |
| Destructive Overwrites | `template-engine` must *never* silently overwrite an existing `.env` or configuration file. It must backup existing files or prompt for a diff resolution. |
| Infinite Detection Loops | Enforce strict timeouts and depth limits when recursively traversing monorepo directories. |

---

## 14. Self Review

- **Vercel Principal Engineer:** The architecture is perfectly decoupled. By splitting the detection pipeline into `project`, `environment`, and `dependency`, we can cache intermediate states and avoid re-running expensive OS checks on every boot.
- **pnpm Maintainer:** Abstracting package management into an adapter layer is crucial. Relying blindly on `npm` when a project uses `pnpm` workspaces will destroy the lockfile. This architecture prevents that.
- **Docker Maintainer:** Validating constraints (like port collisions) *before* spinning up containers will save developers countless hours of debugging cryptic `bind: address already in use` errors.

**Conclusion:** The Core Engine Architecture establishes a robust, extensible pipeline capable of fulfilling Derivo's core product promise. Ready for implementation.
