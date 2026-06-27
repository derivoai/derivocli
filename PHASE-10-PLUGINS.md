# Derivo Plugin SDK & Ecosystem Architecture (Phase 10)

**Status:** Approved
**Author:** JetBrains Principal Software Architect, VS Code Extension Maintainer, Ecosystem Creator
**Scope:** Plugin Lifecycle, SDK API, Security Model, Marketplace Architecture

This document defines the architecture of the **Derivo Plugin Ecosystem**. It transitions the Derivo Core from a monolithic, hardcoded tool into a highly extensible, unopinionated platform. Everything—from Next.js detection to PostgreSQL installation—is implemented as a plugin.

---

## 1. Plugin SDK Architecture

The Plugin SDK provides the foundational tools for both internal developers (building the default plugins) and community developers (building third-party extensions). It heavily enforces **Inversion of Control (IoC)**: the core engine never knows about specific technologies, it only queries the `plugin-registry` for hooks that handle abstract capabilities (e.g., "detect stack", "run doctor").

**Core Principles:**
- **Zero Hardcoding:** Core packages like `setup-engine` or `doctor-engine` do not contain logic for specific runtimes or databases.
- **Strict Isolation:** Plugins run within a controlled context (`plugin-context`) and cannot arbitrarily execute commands or access the raw filesystem without declaring permissions.
- **Event-Driven Lifecycle:** Plugins register themselves against hooks (`onDetect`, `onSetup`, `onDoctor`).

---

## 2. Package Structure

The plugin infrastructure requires extensive, narrowly-focused packages:

```text
packages/
  ├── plugin-sdk/          # The developer-facing toolkit for writing plugins
  ├── plugin-loader/       # Dynamically requires/imports plugin bundles
  ├── plugin-runtime/      # Manages the active state and lifecycle of plugins
  ├── plugin-registry/     # Central repository of loaded plugins and their capabilities
  ├── plugin-validator/    # Enforces schemas for manifests and configuration
  ├── plugin-types/        # Shared ecosystem types (IPlugin, Manifest, Hooks)
  ├── plugin-utils/        # Common utilities (path joining, hashing)
  ├── plugin-sandbox/      # Enforces execution boundaries and capability restrictions
  ├── plugin-api/          # The stable API surface area `import { ... } from '@derivo/plugin-api'`
  ├── plugin-hooks/        # The pub/sub and hook delegation engine
  ├── plugin-context/      # The secure wrapper providing access to FS, Logger, and Shell
  ├── plugin-installer/    # Downloads and extracts `.tgz` or zip archives
  ├── plugin-manager/      # Orchestrates installation, uninstallation, and updating
  ├── plugin-marketplace/  # Client for interacting with the remote registry API
  ├── plugin-security/     # Validates permissions and digital signatures
  ├── plugin-testing/      # Harness for authors to unit test their plugins
  ├── plugin-cli/          # Command handlers for `derivo plugin *`
  ├── plugin-errors/       # Standardized error reporting for misbehaving plugins
  ├── plugin-cache/        # Caches downloaded plugins and compiled artifacts
  └── plugin-manifest/     # Parser for `plugin.json`
```

---

## 3. Folder Structure (Example: Core Plugin Implementation)

Plugins are isolated and follow a standard structure:

```text
plugins/official/nextjs/
├── src/
│   ├── index.ts           # Entry point exporting the lifecycle methods
│   ├── detect.ts          # Logic for detecting Next.js
│   ├── doctor.ts          # Next.js specific health checks
│   └── setup.ts           # Installation and scaffolding steps
├── package.json
└── plugin.json            # The required Derivo manifest
```

---

## 4. Plugin Lifecycle

1. **Discover:** `plugin-loader` scans global and local directories for `plugin.json` files.
2. **Validate:** `plugin-manifest` and `plugin-security` verify the structure, dependencies, and digital signature.
3. **Load:** The entry point is imported (supporting both ESM and CJS).
4. **Initialize:** The plugin's `init(context)` method is called, passing the scoped `plugin-context`.
5. **Register Hooks:** The plugin registers its capabilities with `plugin-hooks` (e.g., `context.hooks.register('doctor', myDoctorCheck)`).
6. **Execute:** The core engine fires events. The `plugin-registry` routes these events to the appropriate plugins.
7. **Unload / Cleanup:** On exit or upgrade, plugins run their `cleanup()` routines to release resources.

---

## 5. Plugin API

Plugins interact with the Core Engine through a strictly typed API:

- **Project Detection:** Return confidence scores and detected metadata.
- **Setup Steps:** Provide instructions for installing missing pieces (e.g., generating `drizzle.config.ts`).
- **Doctor Checks:** Register diagnostic checks, severities, and automatic fix scripts.
- **Commands:** Register custom scripts runnable via `derivo [cmd]`.

*Example Plugin Definition:*
```typescript
import { createPlugin } from '@derivo/plugin-sdk';

export default createPlugin({
  id: 'official:nextjs',
  init: (context) => {
    context.logger.info('Next.js plugin initialized');
    
    context.hooks.projectDetector.register(async (fs) => {
      const hasNext = await fs.exists('next.config.js');
      return hasNext ? { framework: 'nextjs', confidence: 100 } : null;
    });

    context.hooks.doctor.register(async (env) => {
      // Return IDiagnosticIssue arrays
    });
  }
});
```

---

## 6. Plugin Manifest (`plugin.json`)

Every plugin requires a declarative manifest for static analysis prior to code execution:

```json
{
  "id": "derivo-plugin-docker",
  "name": "Docker & Compose Integration",
  "version": "1.2.0",
  "author": "Derivo Core Team",
  "category": "container",
  "dependencies": {
    "@derivo/plugin-api": "^1.0.0"
  },
  "permissions": [
    "shell:exec:docker",
    "fs:read:docker-compose.yml",
    "network:outbound"
  ],
  "engines": {
    "derivo": ">=0.5.0"
  },
  "entryPoint": "dist/index.js",
  "integrity": "sha256-..."
}
```

---

## 7. Plugin Context & Sandbox

Plugins NEVER import core modules directly. They are passed a `Context` object.

- **Logger:** Prefixed with the plugin name.
- **Filesystem:** `context.fs` restricts writes to the project directory or the plugin's dedicated cache directory.
- **Shell:** `context.shell.run()` prompts the user if the command is not explicitly declared in the manifest permissions.
- **State:** `context.store` provides a simple key-value store for plugin-specific persistent data.

---

## 8. Plugin Security Model

- **Permission System:** Modes ranging from "Strict" (default for community plugins) to "Trusted" (default for official plugins).
- **Capability Grants:** If a plugin tries to execute a shell command without the `shell:exec` permission, the `plugin-sandbox` throws a `SecurityError`.
- **Manifest Integrity:** `plugin-security` verifies the checksum of the downloaded plugin archive against the registry. Future iterations will enforce cryptographic signing by developers.

---

## 9. Plugin Marketplace Architecture

The Marketplace is the central hub for discovering and distributing plugins.

- **Registry API:** REST endpoints supporting `GET /plugins`, `GET /plugins/:id/versions`.
- **Distribution:** Plugins are packed into `.tgz` files (similar to npm) and hosted on a CDN.
- **Verification:** "Verified" badges are assigned to official or heavily audited community plugins.
- **Namespaces:** Community plugins are prefixed with their publisher namespace (e.g., `acme/custom-linter`).

---

## 10. Plugin Manager & CLI

The `plugin-cli` and `plugin-manager` handle the lifecycle from the developer's terminal:

- `derivo plugin install <id>`: Fetches from the marketplace, verifies integrity, and installs globally.
- `derivo plugin remove <id>`: Uninstalls and cleans up cache.
- `derivo plugin list`: Shows active plugins and their versions.
- `derivo plugin doctor`: Diagnoses issues specifically related to plugin conflicts or broken hooks.

---

## 11. Testing Strategy

- **Plugin Testing Harness:** Provides an isolated, mock `PluginContext` for authors to unit test their hooks without booting the full CLI.
- **Compatibility Matrix:** CI/CD tests the top 50 plugins against every new Derivo Core release to catch breaking API changes.
- **Security Sandboxing Tests:** Integration tests that intentionally attempt to read `/etc/shadow` from a plugin to ensure the sandbox blocks the operation.

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Plugin Conflicts | Use dependency injection and hook priorities. If two plugins both try to start a database, the `plugin-registry` flags a conflict and asks the user to resolve it. |
| Malicious Plugins | Enforce strict manifest permissions. Sandbox file system access. Require manual user confirmation for any unexpected shell executions. |
| API Churn | Use semantic versioning for `@derivo/plugin-api`. Maintain backwards compatibility shims in the `plugin-runtime` for older plugins. |

---

## 13. Self Review

- **JetBrains Platform Engineer:** The event-driven hook system (like IntelliJ's extension points) is the only scalable way to manage thousands of features without core bloat. Providing a mock testing harness is critical for author adoption.
- **VS Code Extension Maintainer:** The manifest structure (`plugin.json`) and granular permission model perfectly mirrors `package.json` `contributes` fields. It enables fast, static discovery before the JS VM even parses the plugin code.
- **Security Engineer:** Moving from implicit trust to explicit Capability Grants (the sandbox model) prevents supply chain attacks where a compromised linter plugin steals environment variables.

**Conclusion:** The Plugin Ecosystem Architecture establishes a secure, highly extensible foundation that transforms Derivo from a tool into a platform. Ready for implementation.
