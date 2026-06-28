import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import https from 'https';
import pc from 'picocolors';
import { getSession, ensureDerivoDir } from '../../utils/session.js';
import { detectProject, isFrameworkSupported } from '../../utils/detect.js';

const CLI_VERSION = '0.1.0';
const DERIVO_DIR = path.join(os.homedir(), '.derivo');
const LOGS_DIR = path.join(DERIVO_DIR, 'logs');

// ── Types ───────────────────────────────────────────
export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
  detail?: string;
  fixable?: boolean;
  fixed?: boolean;
}

interface DoctorOptions {
  fix: boolean;
  json: boolean;
}

// ── Helpers ─────────────────────────────────────────
function tryExec(cmd: string): string | null {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function httpPing(hostname: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = https.request({ hostname, port: 443, method: 'HEAD', timeout: 5000 }, (res) => {
      resolve((res.statusCode ?? 500) < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
}

// ── Individual Checks ───────────────────────────────

function checkNodeVersion(): CheckResult {
  const version = tryExec('node --version');
  if (!version)
    return {
      name: 'Node.js',
      status: 'fail',
      message: 'Not installed',
      detail: 'Install Node.js from https://nodejs.org',
    };
  const major = parseInt(version.replace('v', '').split('.')[0]!, 10);
  if (major < 18)
    return {
      name: 'Node.js',
      status: 'warn',
      message: version,
      detail: 'Upgrade to Node.js 18+ recommended',
    };
  return { name: 'Node.js', status: 'pass', message: version };
}

function checkNpm(): CheckResult {
  const version = tryExec('npm --version');
  if (!version) return { name: 'npm', status: 'warn', message: 'Not found' };
  return { name: 'npm', status: 'pass', message: `v${version}` };
}

function checkPnpm(): CheckResult {
  const version = tryExec('pnpm --version');
  if (!version)
    return {
      name: 'pnpm',
      status: 'warn',
      message: 'Not installed',
      detail: 'Install with: npm i -g pnpm',
    };
  return { name: 'pnpm', status: 'pass', message: `v${version}` };
}

function checkGit(): CheckResult {
  const version = tryExec('git --version');
  if (!version)
    return {
      name: 'Git',
      status: 'fail',
      message: 'Not installed',
      detail: 'Install Git from https://git-scm.com',
    };
  return { name: 'Git', status: 'pass', message: version.replace('git version ', 'v') };
}

function checkDocker(): CheckResult {
  const version = tryExec('docker --version');
  if (!version)
    return {
      name: 'Docker',
      status: 'warn',
      message: 'Not installed',
      detail: 'Optional. Install from https://docker.com',
    };
  const match = version.match(/Docker version ([\d.]+)/);
  return { name: 'Docker', status: 'pass', message: match ? `v${match[1]}` : version };
}

async function checkInternet(): Promise<CheckResult> {
  const reachable = await httpPing('www.google.com');
  if (!reachable)
    return {
      name: 'Internet',
      status: 'fail',
      message: 'No connection',
      detail: 'Check your network connectivity',
    };
  return { name: 'Internet', status: 'pass', message: 'Connected' };
}

function checkCliVersion(): CheckResult {
  return { name: 'CLI Version', status: 'pass', message: `v${CLI_VERSION}` };
}

function checkAuth(): CheckResult {
  const session = getSession();
  if (!session)
    return {
      name: 'Authentication',
      status: 'fail',
      message: 'Not logged in',
      detail: 'Run: derivo login',
      fixable: false,
    };
  return { name: 'Authentication', status: 'pass', message: session.email };
}

function checkDerivoJson(cwd: string): CheckResult {
  const derivoPath = path.join(cwd, 'derivo.json');
  if (!fs.existsSync(derivoPath)) {
    return {
      name: 'derivo.json',
      status: 'warn',
      message: 'Not found',
      detail: 'Run: derivo init',
      fixable: false,
    };
  }
  try {
    const content = JSON.parse(fs.readFileSync(derivoPath, 'utf8'));
    if (!content.projectId || !content.name) {
      return {
        name: 'derivo.json',
        status: 'warn',
        message: 'Invalid — missing required fields',
        detail: 'Re-run: derivo init',
      };
    }
    return { name: 'derivo.json', status: 'pass', message: 'Valid' };
  } catch {
    return {
      name: 'derivo.json',
      status: 'fail',
      message: 'Corrupt JSON',
      detail: 'Delete and re-run: derivo init',
    };
  }
}

function checkPackageJson(cwd: string): CheckResult {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath))
    return { name: 'package.json', status: 'warn', message: 'Not found' };
  try {
    JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return { name: 'package.json', status: 'pass', message: 'Found' };
  } catch {
    return { name: 'package.json', status: 'fail', message: 'Corrupt JSON' };
  }
}

function checkGitRepo(cwd: string): CheckResult {
  if (!fs.existsSync(path.join(cwd, '.git'))) {
    return {
      name: 'Git Repository',
      status: 'warn',
      message: 'Not initialized',
      detail: 'Run: git init',
    };
  }
  return { name: 'Git Repository', status: 'pass', message: 'Initialized' };
}

function checkFramework(cwd: string): CheckResult {
  const detected = detectProject(cwd);
  if (!detected.framework) return { name: 'Framework', status: 'warn', message: 'Not detected' };
  if (!isFrameworkSupported(detected.framework)) {
    return {
      name: 'Framework',
      status: 'warn',
      message: `${detected.framework} (unsupported)`,
      detail: 'Derivo may not fully support this framework',
    };
  }
  return { name: 'Framework', status: 'pass', message: detected.framework };
}

function checkPackageManager(cwd: string): CheckResult {
  const detected = detectProject(cwd);
  if (!detected.packageManager)
    return { name: 'Package Manager', status: 'warn', message: 'Not detected' };
  return { name: 'Package Manager', status: 'pass', message: detected.packageManager };
}

function checkWorkspace(cwd: string): CheckResult {
  const pnpmWs = path.join(cwd, 'pnpm-workspace.yaml');
  const lernaJson = path.join(cwd, 'lerna.json');
  let pkgWorkspaces = false;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    pkgWorkspaces = !!pkg.workspaces;
  } catch {
    /* ignore */
  }

  if (fs.existsSync(pnpmWs))
    return { name: 'Workspace', status: 'pass', message: 'pnpm workspace' };
  if (fs.existsSync(lernaJson))
    return { name: 'Workspace', status: 'pass', message: 'Lerna monorepo' };
  if (pkgWorkspaces) return { name: 'Workspace', status: 'pass', message: 'npm/yarn workspaces' };
  return { name: 'Workspace', status: 'warn', message: 'Not a monorepo' };
}

async function checkFirebase(): Promise<CheckResult> {
  const reachable = await httpPing('firebase.googleapis.com');
  if (!reachable)
    return {
      name: 'Firebase',
      status: 'fail',
      message: 'Unreachable',
      detail: 'Check firewall or network',
    };
  return { name: 'Firebase', status: 'pass', message: 'Reachable' };
}

async function checkFirestore(): Promise<CheckResult> {
  const reachable = await httpPing('firestore.googleapis.com');
  if (!reachable)
    return {
      name: 'Firestore',
      status: 'fail',
      message: 'Unreachable',
      detail: 'Check firewall or network',
    };
  return { name: 'Firestore', status: 'pass', message: 'Reachable' };
}

function checkWritePermissions(cwd: string): CheckResult {
  try {
    const testFile = path.join(cwd, '.derivo_write_test');
    fs.writeFileSync(testFile, 'test', 'utf8');
    fs.unlinkSync(testFile);
    return { name: 'Write Permissions', status: 'pass', message: 'Writable' };
  } catch {
    return {
      name: 'Write Permissions',
      status: 'fail',
      message: 'No write access',
      detail: 'Check directory permissions',
    };
  }
}

function checkOsInfo(): CheckResult {
  const platform = os.platform();
  const release = os.release();
  const name =
    platform === 'win32'
      ? 'Windows'
      : platform === 'darwin'
        ? 'macOS'
        : platform === 'linux'
          ? 'Linux'
          : platform;
  return { name: 'OS', status: 'pass', message: `${name} ${release}` };
}

function checkCpuArch(): CheckResult {
  return {
    name: 'CPU Architecture',
    status: 'pass',
    message: `${os.arch()} (${os.cpus().length} cores)`,
  };
}

function checkDiskSpace(cwd: string): CheckResult {
  try {
    if (os.platform() === 'win32') {
      const drive = path.parse(cwd).root.replace('\\', '');
      const output = tryExec(
        `wmic logicaldisk where "DeviceID='${drive.replace(':', '')}:'" get FreeSpace /value`,
      );
      if (output) {
        const match = output.match(/FreeSpace=(\d+)/);
        if (match) {
          const freeBytes = parseInt(match[1]!, 10);
          const freeGb = freeBytes / 1024 ** 3;
          if (freeGb < 1)
            return {
              name: 'Disk Space',
              status: 'warn',
              message: formatBytes(freeBytes),
              detail: 'Low disk space',
            };
          return { name: 'Disk Space', status: 'pass', message: `${freeGb.toFixed(1)} GB free` };
        }
      }
    } else {
      const output = tryExec(`df -k "${cwd}" | tail -1`);
      if (output) {
        const parts = output.split(/\s+/);
        const availKb = parseInt(parts[3]!, 10);
        if (!isNaN(availKb)) {
          const freeBytes = availKb * 1024;
          const freeGb = freeBytes / 1024 ** 3;
          if (freeGb < 1)
            return {
              name: 'Disk Space',
              status: 'warn',
              message: formatBytes(freeBytes),
              detail: 'Low disk space',
            };
          return { name: 'Disk Space', status: 'pass', message: `${freeGb.toFixed(1)} GB free` };
        }
      }
    }
    return { name: 'Disk Space', status: 'pass', message: 'Available' };
  } catch {
    return { name: 'Disk Space', status: 'pass', message: 'Could not determine' };
  }
}

function checkConfigDir(fix: boolean): CheckResult {
  const cacheDir = path.join(DERIVO_DIR, 'cache');
  const logsDir = path.join(DERIVO_DIR, 'logs');
  const missing: string[] = [];

  if (!fs.existsSync(DERIVO_DIR)) missing.push('~/.derivo');
  if (!fs.existsSync(cacheDir)) missing.push('~/.derivo/cache');
  if (!fs.existsSync(logsDir)) missing.push('~/.derivo/logs');

  if (missing.length > 0) {
    if (fix) {
      ensureDerivoDir();
      return {
        name: 'Config Directory',
        status: 'pass',
        message: 'Fixed — created missing directories',
        fixable: true,
        fixed: true,
      };
    }
    return {
      name: 'Config Directory',
      status: 'warn',
      message: `Missing: ${missing.join(', ')}`,
      detail: 'Run: derivo doctor --fix',
      fixable: true,
    };
  }
  return { name: 'Config Directory', status: 'pass', message: 'Valid' };
}

function checkLocalDerivoDir(cwd: string, fix: boolean): CheckResult {
  const localDir = path.join(cwd, '.derivo');
  const derivoJsonExists = fs.existsSync(path.join(cwd, 'derivo.json'));

  if (!derivoJsonExists) {
    return { name: 'Local .derivo/', status: 'warn', message: 'No project initialized' };
  }

  const cacheDir = path.join(localDir, 'cache');
  const logsDir = path.join(localDir, 'logs');
  const missing: string[] = [];

  if (!fs.existsSync(localDir)) missing.push('.derivo');
  if (!fs.existsSync(cacheDir)) missing.push('.derivo/cache');
  if (!fs.existsSync(logsDir)) missing.push('.derivo/logs');

  if (missing.length > 0) {
    if (fix) {
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      return {
        name: 'Local .derivo/',
        status: 'pass',
        message: 'Fixed — created missing directories',
        fixable: true,
        fixed: true,
      };
    }
    return {
      name: 'Local .derivo/',
      status: 'warn',
      message: `Missing: ${missing.join(', ')}`,
      detail: 'Run: derivo doctor --fix',
      fixable: true,
    };
  }

  return { name: 'Local .derivo/', status: 'pass', message: 'Valid' };
}

// ── Main Handler ────────────────────────────────────

export async function doctorHandler(options: DoctorOptions) {
  const cwd = process.cwd();
  const results: CheckResult[] = [];

  if (!options.json) {
    console.log('');
    console.log(pc.bold('  Derivo Doctor'));
    console.log(pc.dim('  ─────────────────────────────────'));
    console.log('');
    console.log(pc.dim('  Running diagnostics...\n'));
  }

  // ── System Checks ─────────────────────────────────
  results.push(checkOsInfo());
  results.push(checkCpuArch());
  results.push(checkDiskSpace(cwd));
  results.push(checkNodeVersion());
  results.push(checkNpm());
  results.push(checkPnpm());
  results.push(checkGit());
  results.push(checkDocker());
  results.push(await checkInternet());
  results.push(checkCliVersion());

  // ── Auth & Config ─────────────────────────────────
  results.push(checkAuth());
  results.push(checkConfigDir(options.fix));

  // ── Connectivity ──────────────────────────────────
  results.push(await checkFirebase());
  results.push(await checkFirestore());

  // ── Project Checks ────────────────────────────────
  results.push(checkPackageJson(cwd));
  results.push(checkDerivoJson(cwd));
  results.push(checkGitRepo(cwd));
  results.push(checkFramework(cwd));
  results.push(checkPackageManager(cwd));
  results.push(checkWorkspace(cwd));
  results.push(checkWritePermissions(cwd));
  results.push(checkLocalDerivoDir(cwd, options.fix));

  // ── Calculate Score ───────────────────────────────
  const total = results.length;
  const passCount = results.filter((r) => r.status === 'pass').length;
  const warnCount = results.filter((r) => r.status === 'warn').length;
  const failCount = results.filter((r) => r.status === 'fail').length;
  const fixedCount = results.filter((r) => r.fixed).length;

  // Score: pass = full points, warn = half, fail = 0
  const score = Math.round(((passCount + warnCount * 0.5) / total) * 100);

  // ── JSON Output ───────────────────────────────────
  if (options.json) {
    const output = {
      version: CLI_VERSION,
      timestamp: new Date().toISOString(),
      score,
      summary: { total, pass: passCount, warn: warnCount, fail: failCount, fixed: fixedCount },
      checks: results,
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    // ── Pretty Output ─────────────────────────────────
    const icons: Record<CheckStatus, string> = {
      pass: pc.green('✔'),
      warn: pc.yellow('⚠'),
      fail: pc.red('✗'),
    };

    for (const r of results) {
      const icon = icons[r.status];
      const msg =
        r.status === 'pass'
          ? pc.white(r.message)
          : r.status === 'warn'
            ? pc.yellow(r.message)
            : pc.red(r.message);
      const fixTag = r.fixed ? pc.green(' [FIXED]') : '';
      console.log(`  ${icon} ${pc.dim(r.name.padEnd(20))} ${msg}${fixTag}`);
      if (r.detail && r.status !== 'pass') {
        console.log(`    ${pc.dim('→')} ${pc.dim(r.detail)}`);
      }
    }

    // ── Summary ───────────────────────────────────────
    console.log('');
    console.log(pc.dim('  ─────────────────────────────────'));

    const scoreColor = score >= 80 ? pc.green : score >= 50 ? pc.yellow : pc.red;
    console.log(`\n  Health Score: ${scoreColor(pc.bold(`${score}/100`))}`);

    if (failCount > 0) {
      console.log(pc.red(`\n  ${failCount} issue${failCount > 1 ? 's' : ''} found.`));
    }
    if (warnCount > 0) {
      console.log(pc.yellow(`  ${warnCount} warning${warnCount > 1 ? 's' : ''}.`));
    }
    if (fixedCount > 0) {
      console.log(pc.green(`  ${fixedCount} issue${fixedCount > 1 ? 's' : ''} auto-fixed.`));
    }
    if (score >= 80) {
      console.log(pc.green('\n  Ready for development. ✓'));
    } else if (score >= 50) {
      console.log(pc.yellow('\n  Some issues need attention.'));
    } else {
      console.log(pc.red('\n  Critical issues detected. Please resolve them.'));
    }
    console.log('');
  }

  // ── Write log ─────────────────────────────────────
  try {
    ensureDerivoDir();
    const logEntry = {
      timestamp: new Date().toISOString(),
      score,
      summary: { total, pass: passCount, warn: warnCount, fail: failCount, fixed: fixedCount },
      checks: results,
    };
    const logFile = path.join(LOGS_DIR, 'doctor.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine, 'utf8');
  } catch {
    // Silently fail — logging should never crash the doctor
  }
}
