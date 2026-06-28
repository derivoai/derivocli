import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import { getSession } from './session.js';
import { getGlobalConfig } from './config.js';
import { listDocuments, deleteDocument } from './firestore.js';

export async function cleanupOrphanedProjects() {
  const session = getSession();
  if (!session) return;

  const config = getGlobalConfig();
  const currentDeviceId = config.deviceId;
  if (!currentDeviceId) return;

  const result = await listDocuments(session.token, session.uid, 'projects');
  if (result.error || !result.documents) return;

  for (const doc of result.documents) {
    const data = doc.data;
    const projectId = data.projectId as string;
    const localPath = data.localPath as string | undefined;
    const deviceId = data.deviceId as string | undefined;
    const projectName = (data.name as string) || 'Unknown';

    // Only clean up projects registered to the current device that have a localPath set
    if (deviceId === currentDeviceId && localPath) {
      let isOrphaned = false;

      // Check if directory exists
      if (!fs.existsSync(localPath)) {
        isOrphaned = true;
      } else {
        // Check if derivo.json exists and has matching projectId
        const derivoJsonPath = path.join(localPath, 'derivo.json');
        if (!fs.existsSync(derivoJsonPath)) {
          isOrphaned = true;
        } else {
          try {
            const config = JSON.parse(fs.readFileSync(derivoJsonPath, 'utf8'));
            if (config.projectId !== projectId) {
              isOrphaned = true;
            }
          } catch {
            isOrphaned = true; // corrupt derivo.json
          }
        }
      }

      if (isOrphaned) {
        // Remove project from Firestore
        const delResult = await deleteDocument(session.token, session.uid, 'projects', projectId);
        if (delResult.success) {
          console.log(
            pc.dim(`  [info] Removed orphaned project "${projectName}" from Derivo Cloud.`),
          );
        }
      }
    }
  }
}
