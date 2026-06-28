import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pc from 'picocolors';
import ora from 'ora';
import { getSession } from '../../utils/session.js';
import { detectProject, isFrameworkSupported } from '../../utils/detect.js';
import { createDocument, listDocuments } from '../../utils/firestore.js';
import { prompt, promptSelect, promptConfirm, closePrompt } from '../../utils/prompts.js';
import { ensureDerivoDir } from '../../utils/session.js';

const CLI_VERSION = '0.1.0';

export async function initHandler() {
  console.log('');
  console.log(pc.bold('  Derivo — Project Initialization'));
  console.log(pc.dim('  ─────────────────────────────────'));
  console.log('');

  // ── Step 1: Verify login ──────────────────────────
  const session = getSession();
  if (!session) {
    console.log(pc.red('  ✗ You are not logged in.'));
    console.log(`  Run ${pc.cyan('derivo login')} to authenticate.\n`);
    process.exit(1);
  }

  console.log(pc.dim(`  Authenticated as ${pc.green(session.email)}\n`));

  // ── Step 2: Detect project ────────────────────────
  const cwd = process.cwd();
  const spinner = ora('Scanning project directory...').start();

  const detected = detectProject(cwd);

  spinner.succeed('Project directory scanned');

  if (!detected.hasPackageJson && !detected.hasGit) {
    console.log(pc.yellow('\n  ⚠ No package.json or git repository detected.'));
    const continueAnyway = await promptConfirm('  Continue anyway?', false);
    if (!continueAnyway) {
      console.log(pc.dim('\n  Initialization canceled.\n'));
      closePrompt();
      process.exit(0);
    }
  }

  // Print detection results
  console.log('');
  console.log(pc.dim('  Detected:'));
  if (detected.name) console.log(`    Package   ${pc.white(detected.name)}`);
  if (detected.framework) console.log(`    Framework ${pc.white(detected.framework)}`);
  if (detected.packageManager) console.log(`    Manager   ${pc.white(detected.packageManager)}`);
  if (detected.hasGit) console.log(`    Git       ${pc.green('✓')}`);
  console.log('');

  // Check if framework is supported
  if (detected.framework && !isFrameworkSupported(detected.framework)) {
    console.log(pc.yellow(`  ⚠ Framework "${detected.framework}" is not officially supported.`));
    const continueAnyway = await promptConfirm('  Continue anyway?', true);
    if (!continueAnyway) {
      console.log(pc.dim('\n  Initialization canceled.\n'));
      closePrompt();
      process.exit(0);
    }
    console.log('');
  }

  // ── Step 3: Check existing derivo.json ────────────
  const derivoJsonPath = path.join(cwd, 'derivo.json');

  if (detected.hasDerivoJson) {
    console.log(pc.yellow('  ⚠ A derivo.json already exists in this directory.'));
    const overwrite = await promptConfirm('  Overwrite?', false);
    if (!overwrite) {
      console.log(pc.dim('\n  Initialization canceled.\n'));
      closePrompt();
      process.exit(0);
    }
    console.log('');
  }

  // ── Step 4: Interactive setup ─────────────────────
  const defaultName = detected.name || path.basename(cwd);
  const projectName = (await prompt(`  Project Name (${pc.dim(defaultName)}): `)) || defaultName;

  const environment = await promptSelect('  Select Environment:', [
    'Development',
    'Production',
    'Staging',
  ]);

  console.log('');

  // Generate unique project ID
  const projectId = `proj_${crypto.randomBytes(8).toString('hex')}`;

  // ── Step 5: Check for duplicates in Firestore ─────
  const dupSpinner = ora('Checking for duplicate projects...').start();

  const existingProjects = await listDocuments(session.token, session.uid, 'projects');

  if (existingProjects.error) {
    dupSpinner.warn('Could not verify duplicates (Firestore might be unavailable)');
  } else {
    const duplicate = existingProjects.documents.find(
      (doc) => doc.data.name === projectName && doc.data.env === environment,
    );

    if (duplicate) {
      dupSpinner.fail(`A project named "${projectName}" already exists in ${environment}.`);
      console.log(pc.dim(`  Use a different name or environment.\n`));
      closePrompt();
      process.exit(1);
    }

    dupSpinner.succeed('No duplicate projects found');
  }

  // ── Step 6: Write derivo.json ─────────────────────
  const writeSpinner = ora('Writing derivo.json...').start();

  const derivoConfig = {
    projectId,
    name: projectName,
    framework: detected.framework || 'Unknown',
    environment: environment.toLowerCase(),
    createdAt: new Date().toISOString(),
    cliVersion: CLI_VERSION,
  };

  try {
    fs.writeFileSync(derivoJsonPath, JSON.stringify(derivoConfig, null, 2) + '\n', 'utf8');
    writeSpinner.succeed('derivo.json created');
  } catch (err) {
    writeSpinner.fail('Failed to write derivo.json');
    console.log(pc.red(`  ${err instanceof Error ? err.message : String(err)}\n`));
    closePrompt();
    process.exit(1);
  }

  // ── Step 7: Create local .derivo/ directory ───────
  const localDerivoDir = path.join(cwd, '.derivo');
  if (!fs.existsSync(localDerivoDir)) {
    fs.mkdirSync(localDerivoDir, { recursive: true });
  }
  const localCacheDir = path.join(localDerivoDir, 'cache');
  const localLogsDir = path.join(localDerivoDir, 'logs');
  if (!fs.existsSync(localCacheDir)) fs.mkdirSync(localCacheDir, { recursive: true });
  if (!fs.existsSync(localLogsDir)) fs.mkdirSync(localLogsDir, { recursive: true });

  // Also ensure global ~/.derivo/ exists
  ensureDerivoDir();

  // ── Step 8: Register project in Firestore ─────────
  const firestoreSpinner = ora('Registering project...').start();

  const firestoreData: Record<string, unknown> = {
    projectId,
    ownerUid: session.uid,
    name: projectName,
    framework: detected.framework || 'Unknown',
    env: environment,
    environment: environment.toLowerCase(),
    status: 'synced',
    lastSync: 'Just now',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await createDocument(
    session.token,
    session.uid,
    'projects',
    projectId,
    firestoreData,
  );

  if (result.success) {
    firestoreSpinner.succeed('Project registered in Derivo Cloud');
  } else {
    firestoreSpinner.warn(`Could not register project remotely: ${result.error}`);
    console.log(pc.dim('  The project was created locally. Cloud sync will retry later.\n'));
  }

  // ── Step 9: Summary ───────────────────────────────
  console.log('');
  console.log(pc.green('  ✓ Project initialized successfully!'));
  console.log('');
  console.log(pc.dim('  ┌──────────────────────────────────────'));
  console.log(pc.dim('  │') + `  Name         ${pc.white(projectName)}`);
  console.log(pc.dim('  │') + `  ID           ${pc.dim(projectId)}`);
  console.log(pc.dim('  │') + `  Framework    ${pc.white(detected.framework || 'Unknown')}`);
  console.log(pc.dim('  │') + `  Environment  ${pc.white(environment)}`);
  console.log(pc.dim('  │') + `  Directory    ${pc.dim(cwd)}`);
  console.log(pc.dim('  └──────────────────────────────────────'));
  console.log('');
  console.log(pc.dim(`  Run ${pc.cyan('derivo status')} to check your project.\n`));

  closePrompt();
  process.exit(0);
}
