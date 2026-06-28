import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import ora from 'ora';
import { getSession } from '../../utils/session.js';
import { deleteDocument, listDocuments } from '../../utils/firestore.js';
import { promptConfirm, promptSelect, closePrompt } from '../../utils/prompts.js';
import {
  printBanner,
  printSuccessBox,
  printErrorBox,
  printStatus,
  printKeyValue,
  printSection,
  icons,
  colors,
  spinnerConfig,
  nl,
} from '../../utils/ui.js';

export async function deleteHandler() {
  printBanner(`${icons.trash}  Delete Project`, 'Remove project from Derivo Cloud');

  // ── Step 1: Verify login ──────────────────────────
  const session = getSession();
  if (!session) {
    printStatus('error', 'You are not logged in.');
    console.log(`    ${pc.dim(icons.arrow)} Run ${colors.cmd('derivo login')} to authenticate.`);
    nl();
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
      printStatus('error', 'Found corrupt derivo.json file in current directory.');
    }
  }

  if (isLocalProject && projectIdToDelete) {
    printSection('Local Project Detected');
    nl();
    printKeyValue('Project', projectNameToDelete!);
    printKeyValue('ID', projectIdToDelete);
    nl();

    const confirm = await promptConfirm(
      `  Are you sure you want to delete this project from Derivo Cloud and local files?`,
      false,
    );

    if (!confirm) {
      nl();
      printStatus('info', 'Deletion canceled.');
      nl();
      closePrompt();
      process.exit(0);
    }

    nl();
    const deleteSpinner = ora({
      text: `${icons.trash}  Deleting project from cloud...`,
      ...spinnerConfig,
    }).start();
    const result = await deleteDocument(session.token, session.uid, 'projects', projectIdToDelete);

    if (result.success) {
      deleteSpinner.succeed('Project deleted from Derivo Cloud');
    } else {
      deleteSpinner.warn(
        `Could not delete from cloud: ${result.error || 'Firestore might be offline'}`,
      );
    }

    const localSpinner = ora({
      text: `${icons.folder} Cleaning up local files...`,
      ...spinnerConfig,
    }).start();
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
      printStatus('error', err instanceof Error ? err.message : String(err));
    }

    printSuccessBox('Project Deleted', [pc.dim('Cloud and local files removed successfully.')]);
    closePrompt();
    process.exit(0);
  }

  // ── Step 3: Check/Select cloud projects ───────────
  const fetchSpinner = ora({
    text: `${icons.globe} Fetching projects from Derivo Cloud...`,
    ...spinnerConfig,
  }).start();
  const listResult = await listDocuments(session.token, session.uid, 'projects');

  if (listResult.error) {
    fetchSpinner.fail('Failed to fetch projects from Derivo Cloud');
    printErrorBox('Fetch Error', [pc.dim(listResult.error)]);
    closePrompt();
    process.exit(1);
  }

  fetchSpinner.succeed('Fetched projects successfully');

  if (listResult.documents.length === 0) {
    nl();
    printStatus('warning', 'You have no projects registered in Derivo Cloud.');
    nl();
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

  nl();
  const confirmCloud = await promptConfirm(
    `  Are you sure you want to delete project "${selectedProjName}" from Derivo Cloud?`,
    false,
  );

  if (!confirmCloud) {
    nl();
    printStatus('info', 'Deletion canceled.');
    nl();
    closePrompt();
    process.exit(0);
  }

  nl();
  const deleteSpinner = ora({
    text: `${icons.trash}  Deleting project from cloud...`,
    ...spinnerConfig,
  }).start();
  const result = await deleteDocument(session.token, session.uid, 'projects', selectedProjId);

  if (result.success) {
    deleteSpinner.succeed('Project deleted from Derivo Cloud');
    printSuccessBox('Project Deleted', [
      `${pc.dim('Name:')}  ${pc.white(selectedProjName)}`,
      pc.dim('Removed from Derivo Cloud successfully.'),
    ]);
  } else {
    deleteSpinner.fail('Failed to delete project');
    printErrorBox('Delete Failed', [pc.dim(result.error || 'Unknown error')]);
  }

  closePrompt();
  process.exit(0);
}
