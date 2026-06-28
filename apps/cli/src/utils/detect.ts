import fs from 'fs';
import path from 'path';

export interface DetectedProject {
  hasPackageJson: boolean;
  hasGit: boolean;
  hasDerivoJson: boolean;
  framework: string | null;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | null;
  name: string | null;
}

const FRAMEWORK_SIGNATURES: Record<string, (pkg: any) => boolean> = {
  'Next.js': (pkg) => !!(pkg.dependencies?.next || pkg.devDependencies?.next),
  Vite: (pkg) => !!(pkg.devDependencies?.vite || pkg.dependencies?.vite),
  React: (pkg) => !!(pkg.dependencies?.react || pkg.devDependencies?.react),
  Express: (pkg) => !!(pkg.dependencies?.express || pkg.devDependencies?.express),
  'Node.js': () => true, // fallback if package.json exists
};

const SUPPORTED_FRAMEWORKS = ['React', 'Next.js', 'Vite', 'Node.js', 'Express'];

export function detectProject(cwd: string = process.cwd()): DetectedProject {
  const result: DetectedProject = {
    hasPackageJson: false,
    hasGit: false,
    hasDerivoJson: false,
    framework: null,
    packageManager: null,
    name: null,
  };

  // Check for derivo.json
  const derivoJsonPath = path.join(cwd, 'derivo.json');
  result.hasDerivoJson = fs.existsSync(derivoJsonPath);

  // Check for .git
  const gitPath = path.join(cwd, '.git');
  result.hasGit = fs.existsSync(gitPath);

  // Check for package.json
  const packageJsonPath = path.join(cwd, 'package.json');
  result.hasPackageJson = fs.existsSync(packageJsonPath);

  if (result.hasPackageJson) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      result.name = pkg.name || null;

      // Detect framework (order matters — most specific first)
      for (const [name, check] of Object.entries(FRAMEWORK_SIGNATURES)) {
        if (name === 'Node.js') continue; // skip fallback initially
        if (check(pkg)) {
          result.framework = name;
          break;
        }
      }

      // Fallback to Node.js if package.json exists but no specific framework detected
      if (!result.framework) {
        result.framework = 'Node.js';
      }
    } catch {
      // Malformed package.json
    }
  }

  // Detect package manager
  if (
    fs.existsSync(path.join(cwd, 'pnpm-lock.yaml')) ||
    fs.existsSync(path.join(cwd, 'pnpm-workspace.yaml'))
  ) {
    result.packageManager = 'pnpm';
  } else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    result.packageManager = 'yarn';
  } else if (
    fs.existsSync(path.join(cwd, 'bun.lockb')) ||
    fs.existsSync(path.join(cwd, 'bun.lock'))
  ) {
    result.packageManager = 'bun';
  } else if (fs.existsSync(path.join(cwd, 'package-lock.json'))) {
    result.packageManager = 'npm';
  }

  return result;
}

export function isFrameworkSupported(framework: string | null): boolean {
  if (!framework) return false;
  return SUPPORTED_FRAMEWORKS.includes(framework);
}
