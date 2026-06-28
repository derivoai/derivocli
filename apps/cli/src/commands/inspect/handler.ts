/**
 * `derivo inspect` — surfaces the shared Project Analysis Engine to the user.
 *
 * This command is a thin presentation layer. ALL detection logic lives in the
 * analysis engine (`../../analysis`), which is the single source of truth.
 */
import path from 'path';
import pc from 'picocolors';
import { analyzeProject } from '../../analysis/index.js';
import type { ProjectAnalysis, ReadmeCommandCategory, RiskLevel } from '../../analysis/index.js';
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

  render(analysis);
  process.exit(0);
}

function render(a: ProjectAnalysis): void {
  printBanner('Project Analysis', `${icons.magnify} Understanding your repository`);

  // ── Identity ──────────────────────────────────────
  printSection('Overview');
  kv('Project', a.name ?? pc.dim('unnamed'));
  kv('Framework', frameworkLabel(a));
  kv('Package Manager', a.packageManager.name ?? pc.dim('unknown'));
  kv('Workspace', workspaceLabel(a));
  kv('Language', languageLabel(a));
  if (a.nodeVersion.required) kv('Node Version', a.nodeVersion.required);
  if (a.build.buildTool) kv('Build Tool', a.build.buildTool);

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

  // ── Risk & Confidence ─────────────────────────────
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

// ── Label helpers ───────────────────────────────────

function frameworkLabel(a: ProjectAnalysis): string {
  if (!a.framework.name) return pc.yellow('Unknown');
  const tag = a.framework.supported ? '' : pc.dim(' (unsupported)');
  return `${pc.white(a.framework.name)}${tag}`;
}

function workspaceLabel(a: ProjectAnalysis): string {
  if (!a.workspace.isMonorepo) return pc.dim('Single package');
  const tool = a.workspace.tool ? toolName(a.workspace.tool) : 'Monorepo';
  return `${pc.white(tool)} ${pc.dim(`(${a.workspace.packageCount} packages)`)}`;
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
  // Prioritise setup-relevant categories, one or two per category.
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
