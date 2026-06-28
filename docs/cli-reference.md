# CLI Reference

Global options (available on every command):

- `--verbose` — show technical details and stack traces on error.
- `-V, --version` — print the CLI version.
- `-h, --help` — show help.

Most commands also support `--json` for machine-readable output.

---

## `derivo version`

Show CLI, plugin API, and Node compatibility information.

```bash
derivo version
derivo version --json
```

## `derivo login` / `logout` / `whoami`

Authentication. `whoami` works offline (reads the local session).

## `derivo doctor`

Diagnose machine and project health: OS, Node, package managers, Git, Docker,
connectivity, auth, config directory, **global install**, **plugin directory**,
write permissions, and project structure.

```bash
derivo doctor
derivo doctor --fix     # create missing directories
derivo doctor --json
```

## `derivo init`

Initialize a Derivo project (`derivo.json`) in the current directory.

## `derivo inspect`

Analyze the project and report structure, stack, risks, and recommendations.

| Option | Description |
| --- | --- |
| `--graph` | Render the project as a tree |
| `--deps` | Core first-party dependencies + versions |
| `--packages` | List every workspace package |
| `--path <dir>` | Analyze a specific directory |
| `--json` | Machine-readable output |
| `--verbose` | Detector reasoning, plugin execution, timing |

## `derivo validate`

Validate the project and optionally apply safe, confirmed fixes.

```bash
derivo validate
derivo validate --fix
derivo validate --json
```

## `derivo setup`

Prepare the machine and project for development (diagnostics → validate →
install → environment → git → build check → dashboard sync).

```bash
derivo setup
derivo setup --verbose   # stream per-package install + build output
```

## `derivo plugin`

Manage plugins.

```bash
derivo plugin list
derivo plugin info <id>
derivo plugin enable <id>
derivo plugin disable <id>
derivo plugin reload <id>
derivo plugin doctor
```

All subcommands support `--json`; the tree supports `--verbose`.

## `derivo telemetry`

Manage opt-in telemetry (off by default).

```bash
derivo telemetry status
derivo telemetry enable
derivo telemetry disable
```

## `derivo config`

Read and write global configuration in `~/.derivo/config.json`.

## `derivo delete`

Remove a Derivo project registration.

---

## Subscription gating

Local/offline commands are always free: `login`, `logout`, `help`, `version`,
`telemetry`, `whoami`, `doctor`, `inspect`, `validate`, `plugin`, `config`.
Cloud-backed commands (e.g. `init`, `setup`, `delete`, `status`) require an
active subscription. When verification can't be performed (offline/expired
token), the CLI fails open rather than locking you out.
