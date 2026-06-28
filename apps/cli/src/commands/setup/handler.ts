import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import pc from 'picocolors';
import ora from 'ora';
import { getSession } from '../../utils/session.js';
import { detectProject } from '../../utils/detect.js';
import { updateDocument } from '../../utils/firestore.js';
import { promptConfirm, closePrompt } from '../../utils/prompts.js';

const CLI_VERSION = '0.1.0';

export async function setupHandler() {
  console.log('');
  console.log(pc.bold('  Derivo Setup'));
  console.log(pc.dim('  ─────────────────────────────────'));
  console.log('');

  const cwd = process.cwd();
  const session = getSession();

  // ── Step 1: Verify ────────────────────────
  if (!session) {
    console.log(pc.red('  ✗ You are not logged in.'));
    console.log(`  Run ${pc.cyan('derivo login')} to authenticate.\n`);
    process.exit(1);
  }

  const derivoJsonPath = path.join(cwd, 'derivo.json');
  if (!fs.existsSync(derivoJsonPath)) {
    console.log(pc.red('  ✗ Project not initialized.'));
    console.log(`  Run ${pc.cyan('derivo init')} first.\n`);
    process.exit(1);
  }

  let derivoJson;
  try {
    derivoJson = JSON.parse(fs.readFileSync(derivoJsonPath, 'utf8'));
  } catch (err) {
    console.log(pc.red('  ✗ Corrupt derivo.json file. Aborting setup.\n'));
    process.exit(1);
  }

  // ── Step 2: Diagnostics ───────────────────
  const docSpinner = ora('Running diagnostics...').start();
  try {
    // Run doctor command in json mode using the current executable
    const derivoBin = process.argv[1];
    const doctorOutput = execSync(`node "${derivoBin}" doctor --json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const doctorData = JSON.parse(doctorOutput);
    if (doctorData.summary && doctorData.summary.fail > 0) {
      docSpinner.fail('Critical issues detected by doctor. Run `derivo doctor` for details.');
      process.exit(1);
    }
    docSpinner.succeed('Diagnostics passed');
  } catch (err) {
    // Proceed if doctor fails to execute or parse (not explicitly critical)
    docSpinner.warn('Diagnostics could not be fully verified, proceeding anyway...');
  }

  // ── Step 3: Detect ────────────────────────
  const detected = detectProject(cwd);
  console.log(
    pc.green(`  ✔ Project detected: ${pc.white(detected.framework || 'Unknown framework')}`),
  );

  if (!detected.hasPackageJson) {
    console.log(pc.red('\n  ✗ package.json not found. Aborting setup.\n'));
    process.exit(1);
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  } catch (err) {
    console.log(pc.red('  ✗ Corrupt package.json file. Aborting setup.\n'));
    process.exit(1);
  }

  const pkgManager = detected.packageManager || 'npm';
  console.log(pc.green(`  ✔ Package manager detected: ${pc.white(pkgManager)}`));

  // ── Step 4: Dependencies ──────────────────
  const installCmd = `${pkgManager} install`;

  const depSpinner = ora(`Installing dependencies using ${pkgManager}...`).start();
  try {
    execSync(installCmd, { cwd, stdio: 'ignore' });
    depSpinner.succeed('Dependencies installed');
  } catch (err) {
    depSpinner.text = `Install failed, retrying...`;
    try {
      execSync(installCmd, { cwd, stdio: 'ignore' });
      depSpinner.succeed('Dependencies installed on retry');
    } catch {
      depSpinner.fail('Failed to install dependencies');
      console.log(pc.red(`  ✗ Please run ${pc.cyan(installCmd)} manually.\n`));
    }
  }

  // ── Step 5: Environment ───────────────────
  const envExamplePath = path.join(cwd, '.env.example');
  const envPath = path.join(cwd, '.env');

  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log(pc.green('  ✔ Environment configured (.env copied from .env.example)'));
    } catch {
      console.log(pc.yellow('  ⚠ Failed to copy .env.example to .env'));
    }
  } else if (fs.existsSync(envPath)) {
    console.log(pc.green('  ✔ Environment already configured (.env exists)'));
  }

  // ── Step 6: Git ───────────────────────────
  if (!detected.hasGit) {
    console.log('');
    const initGit = await promptConfirm('  Initialize git repository?', true);
    if (initGit) {
      try {
        execSync('git init', { cwd, stdio: 'ignore' });
        console.log(pc.green('  ✔ Git repository initialized.'));
      } catch {
        console.log(pc.red('  ✗ Failed to initialize git.'));
      }
    }
  }

  // ── Step 7: Build Verification ────────────
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('');
    const buildSpinner = ora('Verifying build...').start();
    try {
      execSync(`${pkgManager} run build`, { cwd, stdio: 'ignore' });
      buildSpinner.succeed('Build successful');
    } catch {
      buildSpinner.fail('Build failed');
      console.log(pc.yellow(`  ⚠ Please check your build script output manually.\n`));
    }
  }

  // ── Step 9: Dashboard Sync ────────────────
  console.log('');
  const syncSpinner = ora('Syncing to dashboard...').start();
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
    syncSpinner.succeed('Dashboard synced');
  } else {
    syncSpinner.warn(`Dashboard sync failed: ${syncResult.error}`);
  }

  // ── Step 10: Output ───────────────────────
  console.log('');
  console.log(pc.green('  ┌──────────────────────────────────────'));
  console.log(pc.green('  │ ') + pc.bold('Setup Complete!'));
  console.log(pc.green('  └──────────────────────────────────────'));
  console.log('');

  // ── Step 8: Development Server ────────────
  if (packageJson.scripts && packageJson.scripts.dev) {
    const startDev = await promptConfirm('  Start development server?', true);
    if (startDev) {
      console.log(pc.dim('\n  Starting dev server...\n'));
      closePrompt();
      const devProcess = spawn(pkgManager, ['run', 'dev'], { cwd, stdio: 'inherit', shell: true });
      devProcess.on('error', (err) => {
        console.log(pc.red(`  ✗ Failed to start dev server: ${err.message}`));
        process.exit(1);
      });
      return;
    }
  }

  closePrompt();
  process.exit(0);
}
