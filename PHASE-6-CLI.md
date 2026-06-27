# Derivo CLI Foundation Architecture (Phase 6)

**Status:** Approved  
**Author:** Vercel Staff Engineer, Node.js CLI Expert, npm Package Maintainer  
**Scope:** CLI Framework, Package Structure, Terminal UI, Command Registration, Configuration

This document defines the architecture of the Derivo CLI. It establishes a robust, extensible foundation built with modern Node.js tools, enabling future features (e.g., Setup Engine, Doctor, Plugins) to plug seamlessly into the CLI core.

---

## 1. CLI Architecture

The CLI is built using a highly modular, decoupled architecture where each package owns a single concern.

**Core Technology Stack:**
- **Runtime:** Node.js (v20+)
- **Language:** Strict TypeScript
- **Command Parser:** `commander` (Lightweight, well-maintained, standard in the ecosystem)
- **Terminal Styling:** `chalk` (Standard for coloring terminal output)
- **Spinners & Progress:** `ora` (Minimal, smooth spinners)
- **Task Runner:** `listr2` (Excellent for complex, multi-step tasks)
- **Process Execution:** `execa` (Better `child_process` with promises, cross-platform)
- **Configuration:** `conf` (Cross-platform configuration storage)
- **Validation:** `zod`
- **Logging:** Custom implementation wrapping `pino` for file logs and `chalk` for console logs.

**Why these choices?** They are battle-tested, actively maintained, and offer the best balance of speed and developer experience, similar to the tooling at Vercel.

---

## 2. Package Structure

The CLI is split into specialized packages within the Turborepo workspace.

```text
apps/cli/               -> The entrypoint (bin/derivo). Glues packages together.
packages/
  ├── cli-core/         -> Command parser initialization and lifecycle management.
  ├── terminal-ui/      -> Reusable UI components (Spinners, Banners, Badges).
  ├── cli-config/       -> Global and Project configuration logic.
  ├── cli-logger/       -> Multi-transport logging (Console, File, Debug).
  ├── cli-types/        -> Shared TypeScript interfaces and enums.
  ├── cli-utils/        -> Cross-platform paths, FS helpers, error formatters.
  └── command-runner/   -> Execution engine for running tasks and external tools.
```

---

## 3. Command Hierarchy

The command structure uses modular registration. We only define the skeleton for now.

- `derivo` (Base command, shows help/welcome)
  - `derivo login`
  - `derivo logout`
  - `derivo setup`
  - `derivo doctor`
  - `derivo init`
  - `derivo status`
  - `derivo config`
  - `derivo update`
  - `derivo version`
  - `derivo help`

---

## 4. Folder Structure

Every command owns its vertical slice within `apps/cli/src/commands/`.

```text
apps/cli/
├── bin/
│   └── derivo.js                # Executable binary
├── src/
│   ├── index.ts                 # CLI Entry point
│   └── commands/
│       ├── login/
│       │   ├── command.ts       # Commander.js registration
│       │   ├── handler.ts       # Execution logic
│       │   ├── types.ts         # Command-specific types
│       │   └── validation.ts    # Zod schemas for flags/args
│       ├── doctor/
│       └── ...
└── package.json
```

---

## 5. Configuration Strategy

- **Global Config:** Stored using `conf` (e.g., `~/.config/derivo-nodejs/config.json`). Holds user tokens and global preferences.
- **Project Config:** Looks for `derivo.config.json` in `process.cwd()`. Optional. Used to override global behavior.
- **Cache:** Stored in OS-specific cache directories (e.g., `~/.cache/derivo-nodejs`).
- **Logs:** Stored in `~/.local/state/derivo-nodejs/logs` on Linux/macOS.

---

## 6. Logging Strategy

The `cli-logger` package exports multi-transport logging:
- **Levels:** `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
- **Console Logger:** Uses `chalk` to output clean messages without timestamps to the user.
- **Debug Logger:** Activated with `--debug`. Shows verbose output and stack traces.
- **File Logger:** Writes structured JSON logs (via `pino`) to the local OS log directory for telemetry and troubleshooting.

---

## 7. Terminal UI System

The `terminal-ui` package enforces consistency.
- **Banners:** ASCII logo displayed on initial run.
- **Spinners:** Standardized `ora` wrapping for pending states.
- **Alerts:** Success (green `✔`), Error (red `✖`), Warning (yellow `⚠`), Info (blue `ℹ`).
- **Task Lists:** Built using `listr2` for complex flows like `setup`.

---

## 8. Error Handling

Custom standard errors defined in `cli-utils`:
- `CliError`: Base class.
- `ConfigError`: Issues with `derivo.config.json`.
- `AuthError`: Requires re-login.
- `ValidationError`: Bad arguments or schema mismatch.
**Formatting:** Errors are intercepted at the top level and pretty-printed using `terminal-ui`. Stack traces are hidden unless `--debug` is present.

---

## 9. Cross-Platform Strategy

- **Paths:** Always use Node.js `path` module. We use `env-paths` for correctly locating global config directories on Windows (%APPDATA%), macOS (Library), and Linux (~/.config).
- **Execution:** We use `execa` which automatically handles cross-platform shell differences (like `.cmd` extensions on Windows).
- **Permissions:** The installer / package.json uses `"bin": { "derivo": "bin/derivo.js" }` ensuring npm sets executable permissions correctly.

---

## 10. Testing Strategy

- **Command Tests:** Use `execa` to run the CLI as a child process and assert `stdout`/`stderr`.
- **Unit Tests:** Mock the file system (using `memfs`) to test config and file writes without mutating the host disk.
- **UI Tests:** Mock `chalk` and `ora` to assert the correct UI states are invoked.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Unresponsive terminal on failure | Always use `try/finally` blocks to stop spinners before throwing or exiting. |
| Leaking credentials in debug logs | Implement a redaction utility in `cli-logger` that scrubs `Bearer`, `sk_` or sensitive keys from all outputs. |
| Windows path errors | Enforce strict ESLint rules against hardcoded forward slashes. |

---

## 12. Self Review

- **Vercel Staff Engineer:** The separation of concerns is excellent. Moving logging and UI into their own packages means we can share them with future internal tools or sub-CLIs. Commander + Execa + Ora is the gold standard for reliable Node CLIs.
- **Node.js CLI Expert:** Using `conf` and `env-paths` ensures we aren't polluting `~/.derivo`, respecting the OS conventions (XDG on Linux).
- **npm Package Maintainer:** The package structure prevents circular dependencies. Exposing `derivo` as the global bin while maintaining internal monorepo packages makes publishing via Changesets straightforward.

**Conclusion:** The CLI Foundation architecture is approved and ready for foundational implementation.
