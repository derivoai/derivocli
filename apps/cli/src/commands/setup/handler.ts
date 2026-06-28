import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import pc from 'picocolors';
import ora from 'ora';
import { getSession } from '../../utils/session.js';
import { detectProject } from '../../utils/detect.js';
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

function runInstallerWithProgress(pkgManager: string, cwd: string, spinner: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const installCmd = pkgManager;
    const args = ['install'];

    if (pkgManager === 'npm') {
      args.push('--no-audit', '--no-fund');
    }

    const child = spawn(installCmd, args, { cwd, shell: true });

    let lastActivePackage = '';

    const processLine = (line: string) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      let pkg = '';

      if (pkgManager === 'pnpm') {
        const resolvingMatch = cleanLine.match(/Resolving:?\s+([@a-zA-Z0-9./_-]+)/);
        const additionMatch = cleanLine.match(/\+\s+([@a-zA-Z0-9./_-]+)/);
        const fetchMatch = cleanLine.match(/Fetching\s+([@a-zA-Z0-9./_-]+)/);

        if (resolvingMatch && resolvingMatch[1]) {
          pkg = resolvingMatch[1];
        } else if (additionMatch && additionMatch[1]) {
          pkg = additionMatch[1];
        } else if (fetchMatch && fetchMatch[1]) {
          pkg = fetchMatch[1];
        }
      } else if (pkgManager === 'npm') {
        const reifyMatch = cleanLine.match(/reify:([a-zA-Z0-9./_-]+)/);
        const httpMatch = cleanLine.match(/fetch GET .*?\/([a-zA-Z0-9./_-]+)$/);

        if (reifyMatch && reifyMatch[1]) {
          pkg = reifyMatch[1];
        } else if (httpMatch && httpMatch[1]) {
          pkg = httpMatch[1];
        }
      } else if (pkgManager === 'yarn') {
        const resolvingMatch = cleanLine.match(/resolving\s+([@a-zA-Z0-9./_-]+)/);
        const fetchMatch = cleanLine.match(/fetch\s+.*?\/([a-zA-Z0-9./_-]+)$/);

        if (resolvingMatch && resolvingMatch[1]) {
          pkg = resolvingMatch[1];
        } else if (fetchMatch && fetchMatch[1]) {
          pkg = fetchMatch[1];
        }
      } else if (pkgManager === 'bun') {
        const installMatch = cleanLine.match(/install\s+([@a-zA-Z0-9./_-]+)/);
        if (installMatch && installMatch[1]) {
          pkg = installMatch[1];
        }
      }

      if (pkg) {
        pkg = pkg.replace(/[/\s]+$/, '');
        if (pkg !== lastActivePackage && pkg.length > 2 && pkg.length < 50) {
          lastActivePackage = pkg;
          spinner.text = `  ${icons.package} Installing: ${pc.cyan(pkg)}...`;
        }
      }
    };

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(processLine);
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(processLine);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exit code ${code}`));
      }
    });
  });
}

export async function setupHandler() {
  const startTime = Date.now();

  printBanner('Project Setup', `${icons.tools} Prepare your environment for development`);

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

  const pkgManager = detected.packageManager || 'npm';
  printStatus('success', `Package manager: ${pc.white(pkgManager)}`);

  // Count dependencies for progress display
  const depCount =
    Object.keys(packageJson.dependencies || {}).length +
    Object.keys(packageJson.devDependencies || {}).length;
  if (depCount > 0) {
    console.log(pc.dim(`    ${icons.arrow} ${depCount} dependencies to install`));
  }

  // ── Step 4: Dependencies ──────────────────
  nl();
  console.log(`  ${stepLabel(4, TOTAL_STEPS)} ${pc.bold('Installing dependencies')}`);
  nl();

  const installCmd = `${pkgManager} install`;
  const depSpinner = ora({
    text: `  ${icons.package} Running ${pc.cyan(installCmd)}...`,
    ...spinnerConfig,
  }).start();

  try {
    await execPromise(installCmd, cwd);
    depSpinner.succeed(`  ${icons.package} Dependencies installed ${pc.dim(`via ${pkgManager}`)}`);
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
