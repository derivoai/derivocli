/**
 * `derivo inspect` — surfaces the shared Project Analysis Engine to the user.
 *
 * Pure presentation layer. ALL detection logic lives in the analysis engine
 * (`../../analysis`), the single source of truth. This file only formats and
 * composes engine output; it never re-implements detection.
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
  packages: boolean;
  graph: boolean;
  deps: boolean;
}

const YES = pc.green('Detected');
const NO = pc.dim('Not detected');
const SAMPLE_SIZE = 6;

/** Lightweight per-member analysis cache (avoids re-analyzing apps twice). */
type MemberAnalysis = { member: WorkspaceMember; analysis: ProjectAnalysis | null };

export async function inspectHandler(options: InspectOptions): Promise<void> {
  const cwd = options.path ? path.resolve(options.path) : process.cwd();

  let analysis: ProjectAnalysis;
  try {
    analysis = analyzeProject(cwd);
  } catch (error) {
    if (options.json) console.log(JSON.stringify({ error: errorMessage(error) }, null, 2));
    else console.error(pc.red(`${icons.error} Analysis failed: ${errorMessage(error)}`));
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify(analysis, null, 2));
    process.exit(0);
  }

  if (options.graph) {
    renderGraph(analysis, cwd);
    process.exit(0);
  }

  if (options.deps) {
    renderDeps(analysis, cwd);
    process.exit(0);
  }

  render(analysis, cwd, options);
  process.exit(0);
}

// ── Main report ─────────────────────────────────────

function render(a: ProjectAnalysis, root: string, options: InspectOptions): void {
  printBanner('Project Analysis', `${icons.magnify} Understanding your repository`);

  const apps = a.workspace.members.filter((m) => m.kind === 'app');
  const pkgs = a.workspace.members.filter((m) => m.kind !== 'app');
  const appAnalyses = analyzeMembers(root, apps);

  // ── Overview ──────────────────────────────────────
  printSection('Overview');
  kv('Project', a.name ?? pc.dim('unnamed'));
  kv('Project Type', a.workspace.isMonorepo ? 'Monorepo' : 'Single package');
  if (a.workspace.isMonorepo && a.workspace.tool) kv('Workspace', toolName(a.workspace.tool));
  kv('Package Manager', a.packageManager.name ?? pc.dim('unknown'));
  kv('Language', languageLabel(a));
  if (a.nodeVersion.required) kv('Node Version', a.nodeVersion.required);

  // For standalone repos, a single top-level framework is meaningful.
  if (!a.workspace.isMonorepo) {
    kv('Framework', frameworkLabel(a));
    if (a.build.buildTool) kv('Build Tool', a.build.buildTool);
  }

  // ── Applications (monorepo) ───────────────────────
  if (a.workspace.isMonorepo && appAnalyses.length > 0) {
    printSection('Applications');
    for (const { member, analysis } of appAnalyses) {
      renderApplication(member, analysis, a);
    }
  }

  // ── Packages (monorepo) ───────────────────────────
  if (a.workspace.isMonorepo && pkgs.length > 0) {
    printSection('Packages');
    console.log(`    ${pc.dim('Count'.padEnd(10))} ${pc.white(`${pkgs.length} packages`)}`);
    const shown = options.packages ? pkgs : pkgs.slice(0, SAMPLE_SIZE);
    console.log(`    ${pc.dim(options.packages ? 'All' : 'Examples')}`);
    for (const pkg of shown) {
      console.log(`    ${pc.cyan(icons.bullet)} ${pc.white(pkg.name)}`);
    }
    if (!options.packages && pkgs.length > shown.length) {
      console.log(
        `    ${pc.dim(icons.dot)} ${pc.dim(`${pkgs.length - shown.length} more — run`)} ${pc.cyan(
          'derivo inspect --packages',
        )}`,
      );
    }
  }

  // ── Core stack ────────────────────────────────────
  printSection('Core Stack');
  const deps = aggregateDeps(root, a.workspace.members);
  const stack = coreStack(a, deps, appAnalyses);
  if (stack.length === 0) console.log(`    ${pc.dim('No notable technologies detected')}`);
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

  // ── README ────────────────────────────────────────
  printSection('README Instructions');
  if (!a.readme.present) {
    console.log(`    ${pc.yellow(icons.warning)} ${pc.dim('No README found')}`);
  } else {
    const commands = topReadmeCommands(a);
    if (commands.length === 0) console.log(`    ${pc.dim('No setup commands detected in README')}`);
    else for (const cmd of commands) console.log(`    ${pc.cyan(icons.bullet)} ${pc.white(cmd)}`);
  }

  // ── Detectors (with evidence) ─────────────────────
  printSection('Detectors');
  for (const d of a.detectors) {
    const mark = d.detected ? pc.green(icons.success) : pc.dim(icons.dot);
    console.log(
      `    ${mark} ${pc.white(d.title)}  ${pc.dim('—')}  ${pc.dim('Confidence')} ${confidenceLabel(
        d.confidence,
      )}`,
    );
    for (const item of d.evidence.slice(0, 4)) {
      console.log(`        ${pc.green(icons.check)} ${pc.dim(item)}`);
    }
  }

  // ── Assessment ────────────────────────────────────
  printSection('Assessment');
  kv('Risk Level', riskLabel(a.riskLevel));
  kv('Confidence', confidenceLabel(a.confidence));

  if (a.risks.length > 0) {
    nl();
    console.log(`    ${pc.bold('Risks')}`);
    for (const risk of a.risks) {
      const detail = risk.detail ? pc.dim(` — ${risk.detail}`) : '';
      console.log(
        `    ${riskIcon(risk.severity)} ${pc.white(risk.title)} ${pc.dim(
          `[${risk.severity}]`,
        )}${detail}`,
      );
    }
  }

  // ── Recommendations ───────────────────────────────
  printSection('Recommendations');
  if (a.recommendations.length === 0) {
    console.log(`    ${pc.green(icons.success)} ${pc.dim('Nothing to flag — looks ready.')}`);
  } else {
    for (const rec of a.recommendations) {
      const detail = rec.detail ? pc.dim(`\n      ${icons.arrow} ${rec.detail}`) : '';
      console.log(`    ${priorityDot(rec.priority)} ${pc.white(rec.message)}${detail}`);
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

function renderApplication(
  member: WorkspaceMember,
  sub: ProjectAnalysis | null,
  root: ProjectAnalysis,
): void {
  console.log(`    ${pc.cyan(icons.bullet)} ${pc.bold(pc.white(member.name))}`);
  if (!sub) {
    console.log(`        ${pc.dim('Could not analyze')}`);
    return;
  }
  const pm = sub.packageManager.name ?? root.packageManager.name ?? 'unknown';
  appKv('Framework', sub.framework.name ?? 'Node.js');
  if (sub.build.buildTool) appKv('Build Tool', sub.build.buildTool);
  appKv('Language', sub.language.primary);
  appKv('Package Mgr', pm);
}

// ── Graph mode ──────────────────────────────────────

function renderGraph(a: ProjectAnalysis, root: string): void {
  nl();
  console.log(pc.bold(pc.cyan(a.name ?? path.basename(root))));

  const apps = a.workspace.members.filter((m) => m.kind === 'app');
  const pkgs = a.workspace.members.filter((m) => m.kind !== 'app');
  const sections: Array<{ label: string; render: (prefix: string) => void }> = [];

  if (apps.length > 0) {
    const appAnalyses = analyzeMembers(root, apps);
    sections.push({
      label: 'Apps',
      render: (prefix) => {
        appAnalyses.forEach(({ member, analysis }, i) => {
          const last = i === appAnalyses.length - 1;
          console.log(`${prefix}${branch(last)}${pc.white(member.name)}`);
          const childPrefix = `${prefix}${pad(last)}`;
          const tech: string[] = [];
          if (analysis) {
            tech.push(analysis.framework.name ?? 'Node.js');
            if (analysis.build.buildTool && analysis.build.buildTool !== analysis.framework.name) {
              tech.push(analysis.build.buildTool);
            }
          }
          tech.forEach((t, j) => {
            console.log(`${childPrefix}${branch(j === tech.length - 1)}${pc.dim(t)}`);
          });
        });
      },
    });
  }

  if (pkgs.length > 0) {
    sections.push({
      label: 'Packages',
      render: (prefix) => {
        pkgs.forEach((pkg, i) => {
          console.log(`${prefix}${branch(i === pkgs.length - 1)}${pc.white(pkg.name)}`);
        });
      },
    });
  }

  if (a.workspace.tool) {
    sections.push({
      label: 'Workspace',
      render: (prefix) => {
        console.log(`${prefix}${branch(true)}${pc.dim(toolName(a.workspace.tool!))}`);
      },
    });
  }

  // Standalone fallback: show the single framework.
  if (sections.length === 0) {
    console.log(`${branch(true)}${pc.white(a.framework.name ?? 'Node.js')}`);
  }

  sections.forEach((section, i) => {
    const last = i === sections.length - 1;
    console.log(`${branch(last)}${pc.bold(section.label)}`);
    section.render(pad(last));
  });
  nl();
}

function branch(last: boolean): string {
  return pc.dim(last ? '└── ' : '├── ');
}
function pad(last: boolean): string {
  return last ? '    ' : pc.dim('│   ');
}

// ── Deps mode ───────────────────────────────────────

function renderDeps(a: ProjectAnalysis, root: string): void {
  printBanner('Core Dependencies', `${icons.package} First-party technologies`);
  const deps = aggregateDeps(root, a.workspace.members);

  const rows: Array<[string, string]> = [];
  for (const [dep, label] of Object.entries(NOTABLE_LIBS)) {
    const version = deps.get(dep);
    if (version) rows.push([label, cleanMajor(version)]);
  }
  // Package manager from the resolved analysis (with its version if declared).
  if (a.packageManager.name) {
    const pmVersion = pmFieldVersion(root) ?? '';
    rows.push([capitalize(a.packageManager.name), pmVersion]);
  }

  const seen = new Set<string>();
  const unique = rows.filter(([label]) => (seen.has(label) ? false : seen.add(label)));

  if (unique.length === 0) {
    console.log(`    ${pc.dim('No notable dependencies detected')}`);
  } else {
    for (const [label, version] of unique) {
      console.log(`    ${pc.white(label.padEnd(16))} ${pc.cyan(version || pc.dim('—'))}`);
    }
  }
  nl();
}

// ── Member analysis ─────────────────────────────────

function analyzeMembers(root: string, members: WorkspaceMember[]): MemberAnalysis[] {
  return members.map((member) => {
    let analysis: ProjectAnalysis | null = null;
    try {
      analysis = analyzeProject(path.join(root, member.relativePath));
    } catch {
      analysis = null;
    }
    return { member, analysis };
  });
}

// ── Dependency aggregation ──────────────────────────

const NOTABLE_LIBS: Record<string, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  '@angular/core': 'Angular',
  next: 'Next.js',
  astro: 'Astro',
  nuxt: 'Nuxt',
  vite: 'Vite',
  webpack: 'Webpack',
  express: 'Express',
  fastify: 'Fastify',
  '@nestjs/core': 'NestJS',
  firebase: 'Firebase',
  'firebase-admin': 'Firebase',
  commander: 'Commander',
  zod: 'Zod',
  prisma: 'Prisma',
  '@prisma/client': 'Prisma',
  tailwindcss: 'Tailwind',
  turbo: 'Turbo',
  nx: 'Nx',
  typescript: 'TypeScript',
  vitest: 'Vitest',
  jest: 'Jest',
};

function aggregateDeps(root: string, members: WorkspaceMember[]): Map<string, string> {
  const all = new Map<string, string>();
  const collect = (dir: string) => {
    const pkg = readPackageJson(dir);
    if (!pkg) return;
    for (const [name, version] of Object.entries({
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    })) {
      if (!all.has(name)) all.set(name, version);
    }
  };
  collect(root);
  for (const member of members) collect(path.join(root, member.relativePath));
  return all;
}

function coreStack(
  a: ProjectAnalysis,
  deps: Map<string, string>,
  apps: MemberAnalysis[],
): string[] {
  const stack = new Set<string>();

  // Frameworks across apps (monorepo) or the single framework (standalone).
  if (a.workspace.isMonorepo) {
    for (const { analysis } of apps) {
      if (analysis?.framework.name) stack.add(analysis.framework.name);
      if (analysis?.build.buildTool) stack.add(analysis.build.buildTool);
    }
  } else {
    if (a.framework.name) stack.add(a.framework.name);
    if (a.build.buildTool) stack.add(a.build.buildTool);
  }

  // Notable libraries detected anywhere in the workspace.
  for (const [dep, label] of Object.entries(NOTABLE_LIBS)) {
    if (deps.has(dep)) stack.add(label);
  }

  if (a.language.primary === 'TypeScript') stack.add('TypeScript');
  if (a.workspace.tool) stack.add(toolName(a.workspace.tool));
  if (a.packageManager.name) stack.add(a.packageManager.name);

  return [...stack];
}

function readPackageJson(
  dir: string,
): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
} | null {
  try {
    const p = path.join(dir, 'package.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function pmFieldVersion(root: string): string | null {
  const field = readPackageJson(root)?.packageManager;
  if (!field) return null;
  const v = field.split('@')[1];
  return v ? cleanMajor(v) : null;
}

function cleanMajor(version: string): string {
  const match = version.match(/(\d+)/);
  return match ? match[1]! : version.replace(/[\^~>=<\s]/g, '');
}

// ── Label helpers ───────────────────────────────────

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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Print primitives ────────────────────────────────

function kv(key: string, value: string): void {
  console.log(`    ${pc.dim(key.padEnd(18))} ${value}`);
}

function appKv(key: string, value: string): void {
  console.log(`        ${pc.dim(key.padEnd(13))} ${pc.white(value)}`);
}

function flag(name: string, on: boolean, detail?: string): void {
  const status = on ? YES : NO;
  const extra = on && detail ? pc.dim(` (${detail})`) : '';
  console.log(`    ${pc.dim(name.padEnd(18))} ${status}${extra}`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
