# Derivo

**Developer Experience, Automated.**

Derivo is an intelligent CLI that understands your project before you do. It
analyzes any repository, validates it for common problems, fixes them safely,
and prepares your environment for development — all through an extensible
plugin platform.

## Install

```bash
npm install -g derivo
```

Requires **Node.js 18+**. Works on Windows, macOS, and Linux.

## Quick start

```bash
derivo login        # authenticate
derivo inspect      # understand the project (framework, stack, risks)
derivo validate     # find issues, with --fix to repair them
derivo setup        # install deps + prepare the environment
derivo doctor       # diagnose your machine and project
```

## Commands

| Command | Description |
| --- | --- |
| `derivo version` | CLI, plugin API, and Node compatibility info (`--json`) |
| `derivo doctor` | Diagnose machine + project health (`--fix`, `--json`) |
| `derivo inspect` | Analyze project structure (`--graph`, `--deps`, `--packages`, `--json`, `--verbose`) |
| `derivo validate` | Validate the project and apply safe fixes (`--fix`, `--json`) |
| `derivo setup` | Prepare the environment for development (`--verbose`) |
| `derivo plugin` | Manage plugins: `list`, `info`, `enable`, `disable`, `reload`, `doctor` |
| `derivo telemetry` | Manage opt-in telemetry: `status`, `enable`, `disable` |
| `derivo login` / `logout` / `whoami` | Authentication |

Add `--verbose` to any command for technical details and stack traces on error.

## Plugins

Derivo ships with built-in plugins (React, Next.js, Express, Docker) and can
load local plugins from `~/.derivo/plugins`. See the
[Plugin Author Guide](https://github.com/derivo/derivo/blob/main/docs/plugin-authoring.md).

## Documentation

- [Installation](https://github.com/derivo/derivo/blob/main/docs/installation.md)
- [Quick Start](https://github.com/derivo/derivo/blob/main/docs/quickstart.md)
- [CLI Reference](https://github.com/derivo/derivo/blob/main/docs/cli-reference.md)
- [Plugin Authoring](https://github.com/derivo/derivo/blob/main/docs/plugin-authoring.md)
- [Configuration](https://github.com/derivo/derivo/blob/main/docs/configuration.md)
- [Troubleshooting](https://github.com/derivo/derivo/blob/main/docs/troubleshooting.md)

## License

MIT
