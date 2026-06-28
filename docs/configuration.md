# Configuration Guide

## Configuration home

Derivo stores all state under a single directory, resolved consistently across
platforms:

| Platform | Default location |
| --- | --- |
| Windows | `C:\Users\<you>\.derivo` |
| macOS | `/Users/<you>/.derivo` |
| Linux | `/home/<you>/.derivo` |

Override the location with the `DERIVO_HOME` environment variable (useful for
CI, tests, or sandboxed setups):

```bash
DERIVO_HOME=/tmp/derivo derivo doctor
```

## Layout

```
~/.derivo/
├── config.json           # global configuration
├── session.json          # encrypted auth session (machine-bound)
├── plugin-state.json     # enabled/disabled plugins
├── plugin-config.json    # per-plugin persisted config
├── cache/
│   └── update-check.json # cached latest-version info
├── logs/                 # command logs (e.g. doctor)
└── plugins/              # local plugins
```

## `config.json`

```json
{
  "telemetryEnabled": false,
  "updateCheck": true,
  "theme": "dark"
}
```

| Key | Default | Description |
| --- | --- | --- |
| `telemetryEnabled` | `false` | Opt-in telemetry (see below) |
| `updateCheck` | `true` | Set `false` to disable update notifications |
| `theme` | `dark` | UI theme hint |

Edit it directly or via `derivo config`.

## Environment variables

| Variable | Effect |
| --- | --- |
| `DERIVO_HOME` | Override the configuration home directory |
| `DERIVO_NO_UPDATE_NOTIFIER` | Disable update checks |
| `DERIVO_VERBOSE` | Force verbose output globally |
| `DERIVO_DEBUG` | Print extra diagnostic detail (e.g. subscription checks) |
| `CI` | Update notifications are automatically suppressed |

## Migration from older layouts

Derivo standardizes on the home directory above. If you point `DERIVO_HOME` at a
new location and a previous `~/.derivo` exists, Derivo migrates existing files
into the new home without overwriting newer data.

## Telemetry

Telemetry is **off by default** and fully opt-in. When enabled, events are
written to a local queue file (`~/.derivo/telemetry-queue.jsonl`) only — no data
leaves your machine in this build.

```bash
derivo telemetry status
derivo telemetry enable
derivo telemetry disable
```
