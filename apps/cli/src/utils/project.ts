import fs from 'fs';
import path from 'path';

export interface ProjectConfig {
  projectId?: string;
  name?: string;
  framework?: string;
  environment?: string;
}

export function getProjectRoot(cwd: string = process.cwd()): string | null {
  let currentDir = cwd;

  while (currentDir !== path.parse(currentDir).root) {
    if (
      fs.existsSync(path.join(currentDir, 'derivo.json')) ||
      fs.existsSync(path.join(currentDir, 'package.json')) ||
      fs.existsSync(path.join(currentDir, '.git'))
    ) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Check root itself
  if (
    fs.existsSync(path.join(currentDir, 'derivo.json')) ||
    fs.existsSync(path.join(currentDir, 'package.json')) ||
    fs.existsSync(path.join(currentDir, '.git'))
  ) {
    return currentDir;
  }

  return null;
}

export function loadProjectConfig(projectRoot: string): ProjectConfig | null {
  const configPath = path.join(projectRoot, 'derivo.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      return null;
    }
  }
  return null;
}
