# Troubleshooting

Run any command with `--verbose` to see technical details and stack traces.
Start with `derivo doctor` — it diagnoses most environment problems.

## `derivo: command not found`

The global npm bin directory isn't on your `PATH`.

```bash
npm bin -g          # show the global bin path; add it to PATH
```

Or reinstall with a Node version manager (nvm, fnm, volta) so global bins are
managed for you.

## Permission errors during install

Avoid `sudo npm install -g`. Instead set a user-level prefix:

```bash
npm config set prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"
```

## "Could not locate package.json"

You're not inside a project directory. `cd` into your project (the folder
containing `package.json`) and retry.

## "Trial/Subscription expired" but my trial is valid

This means the subscription **could not be verified**, usually an expired auth
token. Re-authenticate:

```bash
derivo login
```

Diagnose with:

```bash
$env:DERIVO_DEBUG=1; derivo setup     # PowerShell
DERIVO_DEBUG=1 derivo setup           # bash
```

The debug line shows the underlying read error (e.g. `HTTP 401`). When Derivo
cannot verify your subscription (offline or token error), it **fails open** and
allows the command rather than locking you out.

## A plugin is misbehaving

Plugins run in a sandbox and can't crash the CLI, but you can isolate one:

```bash
derivo plugin doctor          # see failed plugins and why
derivo plugin disable <id>    # turn it off
derivo plugin reload <id>     # reload after a fix
```

## Update notifications are annoying

```bash
# any one of these:
export DERIVO_NO_UPDATE_NOTIFIER=1
# or set "updateCheck": false in ~/.derivo/config.json
```

## Node version too old

Derivo requires Node 18+. Check and upgrade:

```bash
node --version
derivo version          # shows whether your Node satisfies the minimum
```

## Reset Derivo state

```bash
# remove cached/config state (does not affect your projects)
rm -rf ~/.derivo        # macOS/Linux
Remove-Item -Recurse -Force $HOME\.derivo   # Windows PowerShell
```
