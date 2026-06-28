import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import pc from 'picocolors';
import ora from 'ora';
import { getSession } from '../../utils/session.js';
import { detectProject } from '../../utils/detect.js';
import { analyzeProject } from '../../analysis/index.js';
import { ProjectValidator, FixEngine } from '../../validation/index.js';
import { updateDocument } from '../../utils/firestore.js';
import { promptConfirm, closePrompt } from '../../utils/prompts.js';
import {
  printBanner,
  printSuccessBox,
  printSection,
  printKeyValue,
  printStatus,
  printDivider,
  nl,
  icons,
  colors,
  stepLabel,
  progressBar,
  spinnerConfig,
  formatDuration,
} from '../../utils/ui.js';

const CLI_VERSION = '0.1.0';
const TOTAL_STEPS = 8;

interface SetupOptions {
  verbose?: boolean;
}

function execPromise(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/** Print a dimmed verbose-only line. */
function vlog(verbose: boolean, message: string): void {
  if (verbose) console.log(`    ${pc.dim(`${icons.arrow} ${message}`)}`);
}

/**
 * Run a command and stream its stdout/stderr live (used in --verbose mode).
 * Each line is prefixed so it's clearly part of the sub-process output.
 */
function streamCommand(
  cmd: string,
  args: string[],
  cwd: string,
  highlight?: (line: string) => string | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, shell: true });

    const onData = (data: Buffer) => {
      for (const raw of data.toString().split('\n')) {
        const line = raw.replace(/\r$/, '').trimEnd();
        if (!line.trim()) continue;
        const tag = highlight?.(line) ?? null;
        if (tag) {
          console.log(`    ${pc.dim('│')} ${pc.cyan(tag)}`);
        } else {
          console.log(`    ${pc.dim('│')} ${pc.dim(line)}`);
        }
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });
  });
}

/** Extract a package name from an installer output line, if present. */
function highlightPackage(pkgManager: string, line: string): string | null {
  const clean = line.trim();
  let match: RegExpMatchArray | null = null;
  if (pkgManager === 'pnpm') {
    match =
      clean.match(/^\+\s+([@a-zA-Z0-9./_-]+)\s/) ||
      clean.match(/(?:Fetching|Resolving)\s+([@a-zA-Z0-9./_-]+)/);
  } else if (pkgManager === 'npm') {
    match = clean.match(/reify:([@a-zA-Z0-9./_-]+)/);
  } else if (pkgManager === 'yarn') {
    match = clean.match(/(?:resolving|fetch)\s+([@a-zA-Z0-9./_-]+)/);
  } else if (pkgManager === 'bun') {
    match = clean.match(/\+\s+([@a-zA-Z0-9./_-]+)/);
  }
  return match && match[1] ? `${icons.package} ${match[1]}` : null;
}

/** Verbose install: stream the package manager output line-by-line. */
function streamInstall(pkgManager: string, cwd: string): Promise<void> {
  const args = ['install'];
  if (pkgManager === 'npm') args.push('--no-audit', '--no-fund');
  return streamCommand(pkgManager, args, cwd, (line) => highlightPackage(pkgManager, line));
}

export async function setupHandler(options: SetupOptions = {}) {
  const verbose = !!options.verbose;
  const startTime = Date.now();

  printBanner('Project Setup', `${icons.tools} Prepare your environment for development`);
  if (verbose) vlog(true, 'verbose mode enabled');

  const cwd = process.cwd();
  const session = getSession();

  // ── Step 1: Verify ────────────────────────
  console.log(`  ${stepLabel(1, TOTAL_STEPS)} ${pc.bold('Verifying prerequisites')}`);
  nl();

  if (!session) {
    printStatus('error', 'You are not logged in.');
    console.log(`    ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo login')} to authenticate.`);
    nl();
    process.exit(1);
  }
  printStatus('success', `Authenticated as ${colors.brand(session.email)}`);

  const derivoJsonPath = path.join(cwd, 'derivo.json');
  if (!fs.existsSync(derivoJsonPath)) {
    printStatus('error', 'Project not initialized.');
    console.log(`    ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo init')} first.`);
    nl();
    process.exit(1);
  }

  let derivoJson;
  try {
    derivoJson = JSON.parse(fs.readFileSync(derivoJsonPath, 'utf8'));
    printStatus('success', `Project found: ${pc.white(derivoJson.name || 'Unknown')}`);
    vlog(verbose, `derivo.json: ${derivoJsonPath}`);
    vlog(verbose, `projectId: ${derivoJson.projectId ?? 'unknown'}`);
  } catch (err) {
    printStatus('error', 'Corrupt derivo.json file. Aborting setup.');
    nl();
    process.exit(1);
  }

  // ── Step 2: Diagnostics ───────────────────
  nl();
  console.log(`  ${stepLabel(2, TOTAL_STEPS)} ${pc.bold('Running diagnostics')}`);
  nl();

  const docSpinner = ora({
    text: `  ${icons.magnify} Running system checks...`,
    ...spinnerConfig,
  }).start();
  try {
    const derivoBin = process.argv[1];
    vlog(verbose, `running: node "${derivoBin}" doctor --json`);
    const doctorOutput = await execPromise(`node "${derivoBin}" doctor --json`, cwd);
    const doctorData = JSON.parse(doctorOutput);
    if (doctorData.summary && doctorData.summary.fail > 0) {
      docSpinner.fail(`  ${icons.error} Critical issues detected`);
      console.log(`    ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo doctor')} for details.`);
      nl();
      process.exit(1);
    }
    const score = doctorData.score || 0;
    docSpinner.succeed(`  ${icons.shield} Diagnostics passed ${pc.dim(`(score: ${score}/100)`)}`);
  } catch (err) {
    docSpinner.warn(`  ${icons.warning} Diagnostics could not be fully verified, proceeding...`);
  }

  // ── Step 3: Detect ────────────────────────
  nl();
  console.log(`  ${stepLabel(3, TOTAL_STEPS)} ${pc.bold('Detecting project structure')}`);
  nl();

  const detected = detectProject(cwd);

  printStatus('success', `Framework: ${pc.white(detected.framework || 'Unknown')}`);

  if (!detected.hasPackageJson) {
    printStatus('error', 'package.json not found. Aborting setup.');
    nl();
    process.exit(1);
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  } catch (err) {
    printStatus('error', 'Corrupt package.json file. Aborting setup.');
    nl();
    process.exit(1);
  }

  let pkgManager = detected.packageManager || 'npm';
  printStatus('success', `Package manager: ${pc.white(pkgManager)}`);

  // Count dependencies for progress display
  const depCount =
    Object.keys(packageJson.dependencies || {}).length +
    Object.keys(packageJson.devDependencies || {}).length;
  if (depCount > 0) {
    console.log(pc.dim(`    ${icons.arrow} ${depCount} dependencies to install`));
  }
  if (verbose) {
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});
    for (const d of deps) vlog(true, `dependency: ${d}@${packageJson.dependencies[d]}`);
    for (const d of devDeps) vlog(true, `devDependency: ${d}@${packageJson.devDependencies[d]}`);
  }

  // ── Validation & Auto-Fix ─────────────────
  nl();
  console.log(`  ${pc.bold('Validating project')}`);
  nl();
  try {
    const analysis = analyzeProject(cwd);
    const validator = new ProjectValidator();
    const report = validator.validate(analysis);
    const issues = report.results.filter((r) => r.status !== 'pass');

    if (verbose) {
      for (const r of report.results.filter((x) => x.status === 'pass')) {
        vlog(true, `pass: ${r.title}`);
      }
    }

    if (issues.length === 0) {
      printStatus('success', `Validation passed ${pc.dim(`(score: ${report.score}/100)`)}`);
    } else {
      for (const issue of issues) {
        printStatus(issue.status === 'fail' ? 'error' : 'warning', issue.message);
      }

      // Surface README manual-setup steps (display only — never executed).
      const manual = report.results.find(
        (r) => r.ruleId === 'readme-manual-setup' && r.status !== 'pass',
      );
      const manualCmds = (manual?.meta?.commands as string[] | undefined) ?? [];
      if (manualCmds.length > 0) {
        nl();
        console.log(`    ${pc.dim('Manual setup steps detected (run these yourself):')}`);
        for (const cmd of manualCmds) {
          console.log(`    ${pc.cyan(icons.bullet)} ${pc.white(cmd)}`);
        }
      }

      // Offer interactive, confirmed fixes for fixable issues.
      if (report.fixable.length > 0) {
        nl();
        const engine = new FixEngine({
          root: cwd,
          analysis,
          rules: validator.getRules(),
          confirm: promptConfirm,
          log: (msg) => console.log(`    ${pc.dim(icons.arrow)} ${pc.dim(msg)}`),
        });
        const fixes = await engine.run(report.fixable);
        for (const fix of fixes) {
          if (fix.applied) printStatus('success', fix.message);
          else if (fix.error) printStatus('error', `${fix.message}: ${fix.error}`);
        }

        // Re-detect package manager in case a stray lockfile was removed.
        pkgManager = detectProject(cwd).packageManager || pkgManager;
      }
    }
  } catch (err) {
    printStatus('warning', 'Validation skipped (analysis error)');
  }

  // ── Step 4: Dependencies ──────────────────
  nl();
  console.log(`  ${stepLabel(4, TOTAL_STEPS)} ${pc.bold('Installing dependencies')}`);
  nl();

  const installCmd = `${pkgManager} install`;

  if (verbose) {
    // Verbose: stream the package manager output live (shows each package).
    vlog(true, `running: ${installCmd}`);
    nl();
    try {
      await streamInstall(pkgManager, cwd);
      nl();
      printStatus('success', `Dependencies installed ${pc.dim(`via ${pkgManager}`)}`);
    } catch (err) {
      nl();
      printStatus(
        'error',
        `Failed to install dependencies (${err instanceof Error ? err.message : 'error'})`,
      );
      console.log(`    ${pc.dim(icons.arrow)} Run ${colors.cmd(installCmd)} manually.`);
    }
  } else {
    const depSpinner = ora({
      text: `  ${icons.package} Running ${pc.cyan(installCmd)}...`,
      ...spinnerConfig,
    }).start();

    try {
      await execPromise(installCmd, cwd);
      depSpinner.succeed(
        `  ${icons.package} Dependencies installed ${pc.dim(`via ${pkgManager}`)}`,
      );
    } catch (err) {
      depSpinner.text = `  ${icons.package} Retrying installation...`;
      try {
        await execPromise(installCmd, cwd);
        depSpinner.succeed(`  ${icons.package} Dependencies installed on retry`);
      } catch {
        depSpinner.fail(`  ${icons.error} Failed to install dependencies`);
        console.log(`    ${pc.dim(icons.arrow)} Run ${colors.cmd(installCmd)} manually.`);
      }
    }
  }

  // ── Step 5: Environment ───────────────────
  nl();
  console.log(`  ${stepLabel(5, TOTAL_STEPS)} ${pc.bold('Configuring environment')}`);
  nl();

  const envExamplePath = path.join(cwd, '.env.example');
  const envPath = path.join(cwd, '.env');

  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      printStatus('success', `Environment configured ${pc.dim('(.env copied from .env.example)')}`);
    } catch {
      printStatus('warning', 'Failed to copy .env.example to .env');
    }
  } else if (fs.existsSync(envPath)) {
    printStatus('success', `Environment already configured ${pc.dim('(.env exists)')}`);
  } else {
    printStatus('info', 'No .env.example found, skipping environment setup');
  }

  // ── Step 6: Git ───────────────────────────
  nl();
  console.log(`  ${stepLabel(6, TOTAL_STEPS)} ${pc.bold('Version control')}`);
  nl();

  if (!detected.hasGit) {
    printStatus('warning', 'Git repository not initialized.');
    const initGit = await promptConfirm(`    ${icons.arrowRight} Initialize git repository?`, true);
    if (initGit) {
      try {
        await execPromise('git init', cwd);
        printStatus('success', 'Git repository initialized');
      } catch {
        printStatus('error', 'Failed to initialize git');
      }
    } else {
      printStatus('info', 'Skipped git initialization');
    }
  } else {
    printStatus('success', 'Git repository detected');
  }

  // ── Step 7: Build Verification ────────────
  nl();
  console.log(`  ${stepLabel(7, TOTAL_STEPS)} ${pc.bold('Build verification')}`);
  nl();

  if (packageJson.scripts && packageJson.scripts.build) {
    vlog(verbose, `build script: ${packageJson.scripts.build}`);
    if (verbose) {
      vlog(true, `running: ${pkgManager} run build`);
      nl();
      try {
        await streamCommand(pkgManager, ['run', 'build'], cwd);
        nl();
        printStatus('success', 'Build successful');
      } catch (err) {
        nl();
        printStatus('error', `Build failed (${err instanceof Error ? err.message : 'error'})`);
        console.log(`    ${pc.dim(icons.arrow)} Check your build script output above.`);
      }
    } else {
      const buildSpinner = ora({
        text: `  ${icons.bolt} Running build verification...`,
        ...spinnerConfig,
      }).start();
      try {
        await execPromise(`${pkgManager} run build`, cwd);
        buildSpinner.succeed(`  ${icons.bolt} Build successful`);
      } catch {
        buildSpinner.fail(`  ${icons.error} Build failed`);
        console.log(`    ${pc.dim(icons.arrow)} Check your build script output manually.`);
      }
    }
  } else {
    printStatus('info', `No build script found in package.json ${pc.dim('(skipped)')}`);
  }

  // ── Step 8: Dashboard Sync ────────────────
  nl();
  console.log(`  ${stepLabel(8, TOTAL_STEPS)} ${pc.bold('Syncing to dashboard')}`);
  nl();

  const syncSpinner = ora({
    text: `  ${icons.globe} Syncing project metadata...`,
    ...spinnerConfig,
  }).start();
  const updateData = {
    lastSetup: new Date().toISOString(),
    cliVersion: CLI_VERSION,
    framework: detected.framework || 'Unknown',
    packageManager: pkgManager,
    lastSuccessfulSetup: new Date().toISOString(),
    status: 'synced',
    updatedAt: new Date().toISOString(),
  };

  const syncResult = await updateDocument(
    session.token,
    session.uid,
    'projects',
    derivoJson.projectId,
    updateData,
  );
  if (syncResult.success) {
    syncSpinner.succeed(`  ${icons.globe} Dashboard synced`);
  } else {
    syncSpinner.warn(`  ${icons.warning} Dashboard sync failed: ${syncResult.error}`);
  }

  // ── Summary ───────────────────────────────
  const elapsed = formatDuration(Date.now() - startTime);

  printSuccessBox('Setup Complete!', [
    '',
    `  ${pc.dim('Project')}     ${pc.white(derivoJson.name || 'Unknown')}`,
    `  ${pc.dim('Framework')}   ${pc.white(detected.framework || 'Unknown')}`,
    `  ${pc.dim('Manager')}     ${pc.white(pkgManager)}`,
    `  ${pc.dim('Duration')}    ${pc.cyan(elapsed)}`,
    '',
  ]);

  console.log(`  ${progressBar(TOTAL_STEPS, TOTAL_STEPS)}`);
  nl();

  // ── Optional: Start Dev Server ────────────
  if (packageJson.scripts && packageJson.scripts.dev) {
    const startDev = await promptConfirm(`  ${icons.arrowRight} Start development server?`, true);
    if (startDev) {
      nl();
      console.log(`  ${icons.rocket} ${pc.bold('Starting dev server...')}`);
      printDivider();
      nl();
      closePrompt();
      const devProcess = spawn(pkgManager, ['run', 'dev'], { cwd, stdio: 'inherit', shell: true });
      devProcess.on('error', (err) => {
        printStatus('error', `Failed to start dev server: ${err.message}`);
        process.exit(1);
      });
      return;
    }
  }

  console.log(
    `  ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo doctor')} to check your environment.`,
  );
  nl();

  closePrompt();
  process.exit(0);
}
