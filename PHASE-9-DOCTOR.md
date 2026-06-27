# Derivo Doctor Engine Architecture (Phase 9)

**Status:** Approved
**Author:** Google Principal Reliability Engineer, GitHub Senior SRE, Docker Maintainer, Node.js Tooling Expert
**Scope:** Automated diagnostics, issue detection, remediation, reporting, and snapshot generation

This document outlines the architecture for the **Derivo Doctor Engine**, a world-class diagnostic tool that serves as an intelligent SRE in the developer's terminal. It inspects OS, runtimes, dependencies, environments, and projects, translating cryptic failures into actionable, plain-English solutions.

---

## 1. Doctor Engine Architecture

The Doctor Engine runs as a decoupled suite of specialized scanner packages coordinated by a central orchestrator (`doctor-engine`). It operates non-destructively by default, generating immutable health snapshots and classifying issues.

**Core Principles:**
- **Zero-Harm by Default:** Scans are read-only. Fixes are only applied via `--fix` with explicit confirmation for destructive actions.
- **Explainability:** Problems must include plain-English causes and impacts. Never output a raw stack trace as the primary diagnosis.
- **Pluggability:** Core logic delegates framework-specific checks (e.g., Next.js vs. Django) to isolated plugins.
- **Historical Context:** Preserves snapshot history to detect regressions between project runs.

---

## 2. Package Structure

The Turborepo workspace includes the following narrowly-scoped packages:

```text
packages/
  ├── doctor-engine/         # Orchestrator tying all scanners and reporters together
  ├── diagnostics-engine/    # Controls the concurrent execution of all scanners
  ├── health-engine/         # Aggregates results and computes component scores
  ├── repair-engine/         # Manages interactive and automated fixes
  ├── issue-detector/        # Analyzes raw scanner data to pinpoint specific anomalies
  ├── issue-classifier/      # Assigns severity, impact, and confidence to issues
  ├── recommendation-engine/ # Generates plain-English advice and manual steps
  ├── fix-engine/            # Executes automated repair scripts
  ├── report-engine/         # Formats terminal, JSON, and Markdown outputs
  ├── system-scanner/        # Hardware, OS, shell, and virtualization checks
  ├── port-scanner/          # Port conflict and zombie process detection
  ├── permission-checker/    # Read/write/execute and ownership validation
  ├── environment-health/    # PATH, binary, and ENV var checks
  ├── dependency-health/     # Lockfile integrity and package compatibility
  ├── runtime-health/        # Node, Python, Java, Go version and state checks
  ├── container-health/      # Docker, compose, volume, and image analysis
  ├── plugin-health/         # Dynamically loads and runs third-party diagnostic hooks
  ├── workspace-health/      # Git state, monorepo integrity, ignored files
  ├── telemetry/             # Opt-in diagnostic telemetry collection
  ├── snapshot-engine/       # Health report persistence and comparison
  ├── doctor-types/          # Shared interfaces (e.g., IDiagnosticIssue)
  └── doctor-utils/          # Plain-English formatters and shared helpers
```

---

## 3. Folder Structure (Doctor Engine Example)

```text
packages/doctor-engine/
├── src/
│   ├── index.ts                # Entry point
│   ├── pipeline.ts             # Async execution flow (Scan -> Classify -> Recommend -> Report)
│   ├── context.ts              # Global diagnostic context passed to scanners
│   ├── commands/               # Handlers for specific CLI flags (--fix, --json)
│   └── tests/                  # Integration tests spanning multiple sub-packages
└── package.json
```

---

## 4. Diagnostic Pipeline

1. **Context Initialization:** Read `derivo.config.json` (or infer dynamically) to determine the expected state.
2. **Concurrent Scanning:** Execute `system-scanner`, `environment-health`, `port-scanner`, etc., in parallel using `diagnostics-engine`.
3. **Data Aggregation:** Collect raw metrics, paths, and binary states.
4. **Issue Detection:** `issue-detector` maps raw data against known failure signatures.
5. **Issue Classification:** `issue-classifier` assigns categories, severities, and confidence scores.
6. **Recommendation Generation:** `recommendation-engine` translates classified issues into human-readable text.
7. **Scoring:** `health-engine` computes final scores.
8. **Reporting & Snapshots:** `report-engine` renders the UI, and `snapshot-engine` saves the state.
9. **Remediation (Optional):** If `--fix` is passed, `repair-engine` loops through fixable issues.

---

## 5. Health Scoring Model

Scores range from **0 to 100**, presented visually (e.g., green/yellow/red).

- **System Score:** Hardware, OS, shell readiness.
- **Environment Score:** PATH, installed binaries.
- **Runtime Score:** Language versions (e.g., Node.js LTS).
- **Dependency Score:** Lockfile health, peer dependencies.
- **Container Score:** Docker daemon, container uptime.
- **Project Score:** Workspace integrity, Git state.

*Overall Score:* A weighted average. Any `Critical` issue instantly drops the overall score below 50.

---

## 6. Issue Classification Model

Every issue (`IDiagnosticIssue`) is standardized:

- **Category:** (e.g., `Network`, `Permission`, `Dependency`)
- **Severity:**
  - `Info:` Optimization suggestions.
  - `Warning:` Suboptimal state, but will run.
  - `Error:` Project will fail to start/build.
  - `Critical:` Data loss risk, security vulnerability, or hard crash.
- **Confidence:** (0-100%)
- **Cause:** Why this is happening.
- **Impact:** What happens if ignored.
- **Fixable:** Boolean indicating if `fix-engine` can handle it.

---

## 7. Recommendation Engine

Avoids robotic messages (e.g., "Node missing"). Uses a structured plain-English template:

- **Problem:** "Your Node.js version is incompatible."
- **Cause:** "This project requires Node >= 20.0.0, but you are running v18.16.0."
- **Why it matters:** "The framework uses modern web APIs that are not present in older versions, which will cause the build to fail."
- **Automatic Fix:** "Run `derivo doctor --fix` to automatically upgrade via your environment manager."
- **Manual Fix:** "Or, run `nvm install 20` manually."
- **Docs:** `https://derivo.dev/docs/errors/node-version`

---

## 8. Repair Engine

When `derivo doctor --fix` is invoked:
1. Filters issues where `Fixable === true`.
2. Groups fixes by category to prevent conflicts.
3. Prompts the user before executing destructive actions (e.g., `kill -9` on a zombie port).
4. Employs `fix-engine` to apply patches, install missing packages, or update PATH.
5. Re-runs the `diagnostics-engine` to verify the fix was successful.

---

## 9. Snapshot System

- **Storage:** Local `.derivo/snapshots/` directory.
- **Format:** Timestamped JSON containing the full `health-engine` state.
- **Comparison:** `derivo doctor` automatically diffs against the last snapshot to highlight *Regressions* (e.g., "Your container health dropped from 100 to 0 since yesterday").

---

## 10. Plugin Integration

Third-party tools and frameworks can hook into the pipeline:
- `registerDiagnostic()`: Add custom scans (e.g., Prisma checking for database drift).
- `registerFixer()`: Provide automated scripts for custom issues.
- `registerHealthCheck()`: Contribute to the overall score.

---

## 11. Report Generator

The `report-engine` provides a world-class terminal UI:
- **Default:** Clean, color-coded, grouped by category. Hides successful checks.
- **`--verbose`:** Expands all checks, showing exact paths and commands run.
- **`--json`:** Outputs structured JSON for CI/CD environments.
- **`--share`:** Strips secrets (ENV values, local paths) and generates a temporary, hosted link via the Derivo Cloud for sharing with teammates or support.

---

## 12. Testing Strategy

- **Mock OS & Filesystem:** `memfs` and mocked OS utilities to simulate broken PATHs or missing binaries.
- **Mock Docker:** Intercept Docker CLI commands to simulate stopped containers or missing daemon.
- **Golden Tests:** Run the doctor against known "broken" repository fixtures and assert the exact JSON output and health score matches expectations.
- **Regression Tests:** Ensure fixes applied by `repair-engine` don't inadvertently break adjacent health checks.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| False Positives | Strict confidence scoring. Issues with <90% confidence are downgraded to `Warning` and are never auto-fixed. |
| Destructive Auto-Fixes | `--fix` strictly categorizes fixes into `Safe` and `RequiresConfirmation`. Modifying `.bashrc` or killing processes always prompts. |
| Performance bottlenecks | The `diagnostics-engine` heavily leverages `Promise.all` and Worker Threads for heavy tasks (like parsing massive `node_modules` trees). |

---

## 14. Self Review

- **Google SRE:** The snapshot and regression detection is phenomenal. SREs rely on knowing *what changed*. Comparing historical snapshots is a game-changer for local dev.
- **GitHub Reliability Engineer:** Issue classification and clear recommendations perfectly mirror the incident response ethos. Providing a "Why it matters" context stops developers from blindly copying fixes without understanding them.
- **Docker Maintainer:** Abstracting `container-health` ensures we can deeply inspect networks and volumes without polluting the core logic. Handling zombie ports gracefully is a massive pain point solved here.
- **Node.js Tooling Expert:** The architecture handles the complexity of the modern JS ecosystem natively (bun/pnpm/npm/yarn) while keeping the package boundaries strict.

**Conclusion:** The Derivo Doctor Engine architecture is comprehensive, safe, and highly extensible. It is ready for implementation.
