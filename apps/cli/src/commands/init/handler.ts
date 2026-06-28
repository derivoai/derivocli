import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pc from 'picocolors';
import ora from 'ora';
import { getSession } from '../../utils/session.js';
import { detectProject, isFrameworkSupported } from '../../utils/detect.js';
import { createDocument, listDocuments, updateDocument } from '../../utils/firestore.js';
import { prompt, promptSelect, promptConfirm, closePrompt } from '../../utils/prompts.js';
import { ensureDerivoDir } from '../../utils/session.js';
import { getGlobalConfig } from '../../utils/config.js';
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
  spinnerConfig,
} from '../../utils/ui.js';

const CLI_VERSION = '0.1.0';

export async function initHandler() {
  printBanner('Project Initialization', `${icons.rocket} Set up a new Derivo project`);

  // ── Step 1: Verify login ──────────────────────────
  const session = getSession();
  if (!session) {
    printStatus('error', 'You are not logged in.');
    console.log(`    ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo login')} to authenticate.`);
    nl();
    process.exit(1);
  }

  printStatus('success', `Authenticated as ${colors.brand(session.email)}`);
  nl();

  // ── Step 2: Detect project ────────────────────────
  const cwd = process.cwd();
  const spinner = ora({
    text: `  ${icons.magnify} Scanning project directory...`,
    ...spinnerConfig,
  }).start();

  const detected = detectProject(cwd);

  spinner.succeed(`  ${icons.magnify} Project directory scanned`);

  if (!detected.hasPackageJson && !detected.hasGit) {
    nl();
    printStatus('warning', 'No package.json or git repository detected.');
    const continueAnyway = await promptConfirm('  Continue anyway?', false);
    if (!continueAnyway) {
      nl();
      console.log(pc.dim('  Initialization canceled.'));
      nl();
      closePrompt();
      process.exit(0);
    }
  }

  // Print detection results
  printSection('Detection Results');
  if (detected.name) printKeyValue(`${icons.package} Package`, detected.name);
  if (detected.framework) printKeyValue(`${icons.gear} Framework`, detected.framework);
  if (detected.packageManager) printKeyValue(`${icons.tools} Manager`, detected.packageManager);
  if (detected.hasGit) printKeyValue(`${icons.check} Git`, pc.green('Detected'));
  nl();

  // Check if framework is supported
  if (detected.framework && !isFrameworkSupported(detected.framework)) {
    printStatus('warning', `Framework "${detected.framework}" is not officially supported.`);
    const continueAnyway = await promptConfirm('  Continue anyway?', true);
    if (!continueAnyway) {
      nl();
      console.log(pc.dim('  Initialization canceled.'));
      nl();
      closePrompt();
      process.exit(0);
    }
    nl();
  }

  // ── Step 3: Check existing derivo.json ────────────
  const derivoJsonPath = path.join(cwd, 'derivo.json');
  let existingProjectId: string | null = null;
  let existingCreatedAt: string | null = null;

  if (detected.hasDerivoJson) {
    printStatus('warning', 'A derivo.json already exists in this directory.');
    const overwrite = await promptConfirm('  Overwrite?', false);
    if (!overwrite) {
      nl();
      console.log(pc.dim('  Initialization canceled.'));
      nl();
      closePrompt();
      process.exit(0);
    }
    try {
      const existingConfig = JSON.parse(fs.readFileSync(derivoJsonPath, 'utf8'));
      existingProjectId = existingConfig.projectId || null;
      existingCreatedAt = existingConfig.createdAt || null;
    } catch {
      // ignore corrupt files
    }
    nl();
  }

  // ── Step 4: Interactive setup ─────────────────────
  printSection('Project Configuration');
  const defaultName = detected.name || path.basename(cwd);
  const projectName =
    (await prompt(`    ${icons.arrowRight} Project Name (${pc.dim(defaultName)}): `)) ||
    defaultName;

  const environment = await promptSelect(`    ${icons.arrowRight} Select Environment:`, [
    'Development',
    'Production',
    'Staging',
  ]);

  nl();

  // Reuse existing project ID or generate a new unique one
  const projectId = existingProjectId || `proj_${crypto.randomBytes(8).toString('hex')}`;

  // ── Step 5: Check for duplicates in Firestore ─────
  const dupSpinner = ora({
    text: `  ${icons.magnify} Checking for duplicate projects...`,
    ...spinnerConfig,
  }).start();

  const existingProjects = await listDocuments(session.token, session.uid, 'projects');

  if (existingProjects.error) {
    dupSpinner.warn(
      `  ${icons.warning} Could not verify duplicates (Firestore might be unavailable)`,
    );
  } else {
    // Only flag as duplicate if it's a different project ID
    const duplicate = existingProjects.documents.find(
      (doc) =>
        doc.data.name === projectName &&
        doc.data.env === environment &&
        doc.data.projectId !== projectId,
    );

    if (duplicate) {
      dupSpinner.fail(
        `  ${icons.error} A project named "${projectName}" already exists in ${environment}.`,
      );
      console.log(pc.dim(`    ${icons.arrow} Use a different name or environment.`));
      nl();
      closePrompt();
      process.exit(1);
    }

    dupSpinner.succeed(
      existingProjectId
        ? `  ${icons.check} Updating existing project`
        : `  ${icons.check} No duplicate projects found`,
    );
  }

  // ── Step 6: Write derivo.json ─────────────────────
  const writeSpinner = ora({
    text: `  ${icons.file} Writing derivo.json...`,
    ...spinnerConfig,
  }).start();

  const derivoConfig = {
    projectId,
    name: projectName,
    framework: detected.framework || 'Unknown',
    environment: environment.toLowerCase(),
    createdAt: existingCreatedAt || new Date().toISOString(),
    cliVersion: CLI_VERSION,
  };

  try {
    fs.writeFileSync(derivoJsonPath, JSON.stringify(derivoConfig, null, 2) + '\n', 'utf8');
    writeSpinner.succeed(`  ${icons.file} derivo.json created`);
  } catch (err) {
    writeSpinner.fail(`  ${icons.error} Failed to write derivo.json`);
    console.log(pc.red(`    ${err instanceof Error ? err.message : String(err)}`));
    nl();
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
  const firestoreSpinner = ora({
    text: existingProjectId
      ? `  ${icons.globe} Updating project in Derivo Cloud...`
      : `  ${icons.globe} Registering project...`,
    ...spinnerConfig,
  }).start();

  const globalConfig = getGlobalConfig();
  const deviceId = globalConfig.deviceId || 'unknown';

  const firestoreData: Record<string, unknown> = {
    projectId,
    ownerUid: session.uid,
    name: projectName,
    framework: detected.framework || 'Unknown',
    env: environment,
    environment: environment.toLowerCase(),
    status: 'synced',
    lastSync: 'Just now',
    createdAt: existingCreatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    localPath: cwd,
    deviceId: deviceId,
  };

  let result;
  if (existingProjectId) {
    result = await updateDocument(session.token, session.uid, 'projects', projectId, firestoreData);
  } else {
    result = await createDocument(session.token, session.uid, 'projects', projectId, firestoreData);
  }

  if (result.success) {
    firestoreSpinner.succeed(
      existingProjectId
        ? `  ${icons.globe} Project updated in Derivo Cloud`
        : `  ${icons.globe} Project registered in Derivo Cloud`,
    );
  } else {
    firestoreSpinner.warn(
      `  ${icons.warning} Could not register project remotely: ${result.error}`,
    );
    console.log(
      pc.dim(`    ${icons.arrow} The project was created locally. Cloud sync will retry later.`),
    );
  }

  // ── Step 9: Summary ───────────────────────────────
  printSuccessBox('Project Initialized!', [
    '',
    `  ${pc.dim('Name')}         ${pc.white(projectName)}`,
    `  ${pc.dim('ID')}           ${pc.dim(projectId)}`,
    `  ${pc.dim('Framework')}    ${pc.white(detected.framework || 'Unknown')}`,
    `  ${pc.dim('Environment')}  ${pc.white(environment)}`,
    `  ${pc.dim('Directory')}    ${pc.dim(cwd)}`,
    '',
  ]);

  console.log(
    `  ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo setup')} to install dependencies.`,
  );
  console.log(
    `  ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo doctor')} to check your environment.`,
  );
  nl();

  closePrompt();
  process.exit(0);
}
