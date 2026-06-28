/**
 * `derivo inspect` — surfaces the shared Project Analysis Engine to the user.
 *
 * This command is a thin presentation layer. ALL detection logic lives in the
 * analysis engine (`../../analysis`), which is the single source of truth.
 */
import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import { analyzeProject } from '../../analysis/index.js';
import type {
  ProjectAnalysis,
  ReadmeCommandCategory,
  RiskLevel,
  WorkspaceMember,
} from '../../analysis/index.js';
import { printBanner, printSection, printDivider, nl, icons } from '../../utils/ui.js';

interface InspectOptions {
  json: boolean;
  path?: string;
}

const YES = pc.green('Detected');
const NO = pc.dim('Not detected');

export async function inspectHandler(options: InspectOptions): Promise<void> {
  const cwd = options.path ? path.resolve(options.path) : process.cwd();

  let analysis: ProjectAnalysis;
  try {
    analysis = analyzeProject(cwd);
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: errorMessage(error) }, null, 2));
    } else {
      console.error(pc.red(`${icons.error} Analysis failed: ${errorMessage(error)}`));
    }
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify(analysis, null, 2));
    process.exit(0);
  }

  render(analysis, cwd);
  process.exit(0);
}

function render(a: ProjectAnalysis, root: string): void {
  printBanner('Project Analysis', `${icons.magnify} Understanding your repository`);

  // ── Overview ──────────────────────────────────────
  printSection('Overview');
  kv('Project', a.name ?? pc.dim('unnamed'));
  kv('Project Type', a.workspace.isMonorepo ? 'Monorepo' : 'Single package');
  if (a.workspace.isMonorepo && a.workspace.tool) kv('Workspace', toolName(a.workspace.tool));
  kv('Framework', frameworkLabel(a));
  kv('Package Manager', a.packageManager.name ?? pc.dim('unknown'));
  kv('Language', languageLabel(a));
  if (a.nodeVersion.required) kv('Node Version', a.nodeVersion.required);
  if (a.build.buildTool) kv('Build Tool', a.build.buildTool);

  // ── Workspace members ─────────────────────────────
  if (a.workspace.isMonorepo && a.workspace.members.length > 0) {
    renderMembers(
      'Applications',
      a.workspace.members.filter((m) => m.kind === 'app'),
      root,
    );
    renderMembers(
      'Packages',
      a.workspace.members.filter((m) => m.kind === 'package'),
      root,
    );
    renderMembers(
      'Other',
      a.workspace.members.filter((m) => m.kind === 'other'),
      root,
    );
  }

  // ── Core stack ────────────────────────────────────
  printSection('Core Stack');
  const stack = coreStack(a, root);
  if (stack.length === 0) console.log(`    ${pc.dim('No notable libraries detected')}`);
  else console.log(`    ${stack.map((s) => pc.white(s)).join(pc.dim('  ·  '))}`);

  // ── Capabilities ──────────────────────────────────
  printSection('Capabilities');
  flag('TypeScript', a.typescript.used, a.typescript.strict ? 'strict' : undefined);
  flag('Tailwind', a.tailwind.used);
  flag('Prisma', a.prisma.used, a.prisma.hasMigrations ? 'migrations' : undefined);
  flag('Docker', a.docker.used, a.docker.hasCompose ? 'compose' : undefined);
  flag('Git', a.git.initialized, a.git.initialized ? 'initialized' : undefined);
  flag('GitHub Actions', a.githubActions.used);
  flag('Testing', a.testing.used, a.testing.framework ?? undefined);
  flag('Lint', a.tooling.lint.used, a.tooling.lint.tool ?? undefined);
  flag('Format', a.tooling.format.used, a.tooling.format.tool ?? undefined);
  flag('Env Template', a.environment.hasExample, envDetail(a));

  // ── Environment variables (names only — never values) ─
  if (a.environment.declaredVariables.length > 0) {
    printSection('Environment Variables');
    console.log(`    ${pc.dim('(names only — values are never read)')}`);
    for (const name of a.environment.declaredVariables) {
      console.log(`    ${pc.cyan(icons.dot)} ${pc.white(name)}`);
    }
  }

  // ── Framework evidence ────────────────────────────
  if (a.framework.name && a.framework.evidence.length > 0) {
    printSection('Framework');
    kv('Detected', a.framework.name);
    kv('Confidence', confidenceLabel(detectorConfidence(a, 'framework')));
    console.log(`    ${pc.dim('Evidence')}`);
    for (const item of a.framework.evidence) {
      console.log(`      ${pc.green(icons.check)} ${pc.white(item)}`);
    }
  }

  // ── README ────────────────────────────────────────
  printSection('README Instructions');
  if (!a.readme.present) {
    console.log(`    ${pc.yellow(icons.warning)} ${pc.dim('No README found')}`);
  } else {
    const commands = topReadmeCommands(a);
    if (commands.length === 0) {
      console.log(`    ${pc.dim('No setup commands detected in README')}`);
    } else {
      for (const cmd of commands) {
        console.log(`    ${pc.cyan(icons.bullet)} ${pc.white(cmd)}`);
      }
    }
  }

  // ── Detector confidence ───────────────────────────
  printSection('Detectors');
  for (const d of a.detectors) {
    const mark = d.detected ? pc.green(icons.success) : pc.dim(icons.dot);
    console.log(`    ${mark} ${pc.dim(d.title.padEnd(18))} ${confidenceLabel(d.confidence)}`);
  }

  // ── Assessment ────────────────────────────────────
  printSection('Assessment');
  kv('Risk Level', riskLabel(a.riskLevel));
  kv('Confidence', confidenceLabel(a.confidence));

  if (a.risks.length > 0) {
    nl();
    console.log(`    ${pc.bold('Risks')}`);
    for (const risk of a.risks) {
      const icon = riskIcon(risk.severity);
      const detail = risk.detail ? pc.dim(` — ${risk.detail}`) : '';
      console.log(`    ${icon} ${pc.white(risk.title)}${detail}`);
    }
  }

  // ── Recommendations ───────────────────────────────
  printSection('Recommendations');
  if (a.recommendations.length === 0) {
    console.log(`    ${pc.green(icons.success)} ${pc.dim('Nothing to flag — looks ready.')}`);
  } else {
    for (const rec of a.recommendations) {
      const dot = priorityDot(rec.priority);
      const detail = rec.detail ? pc.dim(`\n      ${icons.arrow} ${rec.detail}`) : '';
      console.log(`    ${dot} ${pc.white(rec.message)}${detail}`);
    }
  }

  nl();
  printDivider();
  console.log(
    pc.dim(
      `  Analyzed ${a.root}  ${icons.dot}  ${a.detectors.length} detectors  ${icons.dot}  ${a.confidence}% confidence`,
    ),
  );
  nl();
}

// ── Workspace member rendering ──────────────────────

function renderMembers(label: string, members: WorkspaceMember[], root: string): void {
  if (members.length === 0) return;
  printSection(label);
  for (const member of members) {
    let descriptor = '';
    try {
      const sub = analyzeProject(path.join(root, member.relativePath));
      const fw = sub.framework.name ?? 'Node.js';
      const tool =
        sub.build.buildTool && sub.build.buildTool !== fw ? ` + ${sub.build.buildTool}` : '';
      descriptor = pc.dim(` (${fw}${tool})`);
    } catch {
      descriptor = '';
    }
    console.log(`    ${pc.cyan(icons.bullet)} ${pc.white(member.name)}${descriptor}`);
  }
}

// ── Core stack derivation ───────────────────────────

const NOTABLE_LIBS: Record<string, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  next: 'Next.js',
  astro: 'Astro',
  vite: 'Vite',
  express: 'Express',
  fastify: 'Fastify',
  firebase: 'Firebase',
  'firebase-admin': 'Firebase',
  commander: 'Commander',
  zod: 'Zod',
  prisma: 'Prisma',
  '@prisma/client': 'Prisma',
  tailwindcss: 'Tailwind',
  turbo: 'Turbo',
  nx: 'Nx',
  ora: 'Ora',
  picocolors: 'picocolors',
};

function coreStack(a: ProjectAnalysis, root: string): string[] {
  const stack = new Set<string>();
  if (a.framework.name) stack.add(a.framework.name);
  if (a.build.buildTool) stack.add(a.build.buildTool);
  if (a.language.primary === 'TypeScript') stack.add('TypeScript');
  if (a.workspace.tool) stack.add(toolName(a.workspace.tool));
  if (a.packageManager.name) stack.add(a.packageManager.name);

  // Scan root dependencies for notable libraries (presentation only).
  const pkg = readRootPackage(root);
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  for (const [dep, label] of Object.entries(NOTABLE_LIBS)) {
    if (deps[dep]) stack.add(label);
  }
  return [...stack];
}

function readRootPackage(
  root: string,
): { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null {
  try {
    const p = path.join(root, 'package.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// ── Label helpers ───────────────────────────────────

function detectorConfidence(a: ProjectAnalysis, id: string): number {
  return a.detectors.find((d) => d.id === id)?.confidence ?? a.confidence;
}

function frameworkLabel(a: ProjectAnalysis): string {
  if (!a.framework.name) return pc.yellow('Unknown');
  const tag = a.framework.supported ? '' : pc.dim(' (unsupported)');
  return `${pc.white(a.framework.name)}${tag}`;
}

function toolName(tool: string): string {
  const map: Record<string, string> = {
    turborepo: 'Turborepo',
    nx: 'Nx',
    pnpm: 'pnpm workspaces',
    lerna: 'Lerna',
    'npm/yarn': 'npm/yarn workspaces',
  };
  return map[tool] ?? tool;
}

function languageLabel(a: ProjectAnalysis): string {
  const mod = a.language.moduleSystem !== 'unknown' ? pc.dim(` (${a.language.moduleSystem})`) : '';
  return `${pc.white(a.language.primary)}${mod}`;
}

function envDetail(a: ProjectAnalysis): string | undefined {
  if (!a.environment.hasExample) return undefined;
  return `${a.environment.declaredVariables.length} vars`;
}

function topReadmeCommands(a: ProjectAnalysis): string[] {
  const order: ReadmeCommandCategory[] = [
    'installation',
    'environment',
    'database',
    'migration',
    'seed',
    'docker',
    'build',
    'development',
    'testing',
  ];
  const out: string[] = [];
  for (const category of order) {
    for (const cmd of a.readme.byCategory[category].slice(0, 2)) {
      if (!out.includes(cmd)) out.push(cmd);
    }
  }
  return out.slice(0, 10);
}

function riskLabel(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return pc.green('Low');
    case 'medium':
      return pc.yellow('Medium');
    case 'high':
      return pc.red('High');
  }
}

function confidenceLabel(confidence: number): string {
  const color = confidence >= 85 ? pc.green : confidence >= 60 ? pc.yellow : pc.red;
  return color(`${confidence}%`);
}

function riskIcon(severity: 'info' | 'warning' | 'critical'): string {
  if (severity === 'critical') return pc.red(icons.error);
  if (severity === 'warning') return pc.yellow(icons.warning);
  return pc.blue(icons.info);
}

function priorityDot(priority: 'low' | 'medium' | 'high'): string {
  if (priority === 'high') return pc.red(icons.bullet);
  if (priority === 'medium') return pc.yellow(icons.bullet);
  return pc.dim(icons.bullet);
}

// ── Print primitives ────────────────────────────────

function kv(key: string, value: string): void {
  console.log(`    ${pc.dim(key.padEnd(18))} ${value}`);
}

function flag(name: string, on: boolean, detail?: string): void {
  const status = on ? YES : NO;
  const extra = on && detail ? pc.dim(` (${detail})`) : '';
  console.log(`    ${pc.dim(name.padEnd(18))} ${status}${extra}`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
