import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import ora from 'ora';
import { getSession } from '../../utils/session.js';
import { deleteDocument, listDocuments } from '../../utils/firestore.js';
import { promptConfirm, promptSelect, closePrompt } from '../../utils/prompts.js';

export async function deleteHandler() {
  console.log('');
  console.log(pc.bold('  Derivo — Delete Project'));
  console.log(pc.dim('  ─────────────────────────────────'));
  console.log('');

  // ── Step 1: Verify login ──────────────────────────
  const session = getSession();
  if (!session) {
    console.log(pc.red('  ✗ You are not logged in.'));
    console.log(`  Run ${pc.cyan('derivo login')} to authenticate.\n`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const derivoJsonPath = path.join(cwd, 'derivo.json');

  let projectIdToDelete: string | null = null;
  let projectNameToDelete: string | null = null;
  let isLocalProject = false;

  // ── Step 2: Check for local project ───────────────
  if (fs.existsSync(derivoJsonPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(derivoJsonPath, 'utf8'));
      projectIdToDelete = config.projectId || null;
      projectNameToDelete = config.name || 'Unnamed Project';
      isLocalProject = true;
    } catch {
      console.log(pc.red('  ✗ Found corrupt derivo.json file in current directory.'));
    }
  }

  if (isLocalProject && projectIdToDelete) {
    console.log(`  Local project detected: ${pc.cyan(projectNameToDelete)} (${projectIdToDelete})`);
    const confirm = await promptConfirm(
      `  Are you sure you want to delete this project from Derivo Cloud and local files?`,
      false,
    );

    if (!confirm) {
      console.log(pc.dim('\n  Deletion canceled.\n'));
      closePrompt();
      process.exit(0);
    }

    console.log('');
    const deleteSpinner = ora('Deleting project from cloud...').start();
    const result = await deleteDocument(session.token, session.uid, 'projects', projectIdToDelete);

    if (result.success) {
      deleteSpinner.succeed('Project deleted from Derivo Cloud');
    } else {
      deleteSpinner.warn(
        `Could not delete from cloud: ${result.error || 'Firestore might be offline'}`,
      );
    }

    const localSpinner = ora('Cleaning up local files...').start();
    try {
      // Remove derivo.json
      if (fs.existsSync(derivoJsonPath)) {
        fs.unlinkSync(derivoJsonPath);
      }
      // Remove .derivo directory
      const localDerivoDir = path.join(cwd, '.derivo');
      if (fs.existsSync(localDerivoDir)) {
        fs.rmSync(localDerivoDir, { recursive: true, force: true });
      }
      localSpinner.succeed('Local configuration files removed');
    } catch (err) {
      localSpinner.fail('Failed to remove local configuration files');
      console.log(pc.red(`  ${err instanceof Error ? err.message : String(err)}\n`));
    }

    console.log(pc.green('\n  ✓ Project deleted successfully.\n'));
    closePrompt();
    process.exit(0);
  }

  // ── Step 3: Check/Select cloud projects ───────────
  const fetchSpinner = ora('Fetching projects from Derivo Cloud...').start();
  const listResult = await listDocuments(session.token, session.uid, 'projects');

  if (listResult.error) {
    fetchSpinner.fail('Failed to fetch projects from Derivo Cloud');
    console.log(pc.red(`  Error: ${listResult.error}\n`));
    closePrompt();
    process.exit(1);
  }

  fetchSpinner.succeed('Fetched projects successfully');

  if (listResult.documents.length === 0) {
    console.log(pc.yellow('  ⚠ You have no projects registered in Derivo Cloud.\n'));
    closePrompt();
    process.exit(0);
  }

  // Map to select options
  const options = listResult.documents.map((doc) => {
    const data = doc.data;
    const name = data.name || 'Unnamed';
    const env = data.env || 'unknown';
    const id = data.projectId;
    return `${name} (${env}) [ID: ${id}]`;
  });

  const selected = await promptSelect('Select a project to delete:', options);
  const selectedIndex = options.indexOf(selected);
  const selectedDoc = listResult.documents[selectedIndex]!;
  const selectedProjId = selectedDoc.data.projectId as string;
  const selectedProjName = selectedDoc.data.name as string;

  console.log('');
  const confirmCloud = await promptConfirm(
    `  Are you sure you want to delete project "${selectedProjName}" from Derivo Cloud?`,
    false,
  );

  if (!confirmCloud) {
    console.log(pc.dim('\n  Deletion canceled.\n'));
    closePrompt();
    process.exit(0);
  }

  console.log('');
  const deleteSpinner = ora('Deleting project from cloud...').start();
  const result = await deleteDocument(session.token, session.uid, 'projects', selectedProjId);

  if (result.success) {
    deleteSpinner.succeed('Project deleted from Derivo Cloud');
    console.log(pc.green('\n  ✓ Project deleted successfully.\n'));
  } else {
    deleteSpinner.fail(`Failed to delete project: ${result.error}`);
    console.log('');
  }

  closePrompt();
  process.exit(0);
}
