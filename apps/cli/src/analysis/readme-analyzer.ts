/**
 * Derivo — Project Analysis Engine: README Analyzer
 *
 * Pure, side-effect-free parser that extracts and CLASSIFIES setup commands
 * from a README. It NEVER executes anything — it only reads and categorizes.
 *
 * Strategy:
 *  1. Collect candidate command lines from fenced code blocks and `$`-prefixed
 *     shell lines.
 *  2. Keep only lines that look like real commands (known CLIs / runners).
 *  3. Classify each command into a category by keyword heuristics.
 */
import type { ReadmeAnalysis, ReadmeCommand, ReadmeCommandCategory } from './types.js';

const CATEGORIES: ReadmeCommandCategory[] = [
  'installation',
  'development',
  'build',
  'database',
  'migration',
  'environment',
  'docker',
  'seed',
  'testing',
  'other',
];

/** Tools/runners that signal an actual command line. */
const COMMAND_PREFIXES = [
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'npx',
  'pnpx',
  'node',
  'docker',
  'docker-compose',
  'prisma',
  'git',
  'make',
  'cp',
  'mv',
];

function looksLikeCommand(line: string): boolean {
  const first = line.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return COMMAND_PREFIXES.includes(first);
}

/** Heuristic classification — order matters (most specific first). */
function classify(command: string): ReadmeCommandCategory {
  const c = command.toLowerCase();

  if (
    /(prisma\s+migrate|migrate\s+(deploy|dev|reset)|migration|knex\s+migrate|sequelize.*migrat)/.test(
      c,
    )
  ) {
    return 'migration';
  }
  if (/(prisma\s+(generate|db)|createdb|psql|mongod|mysql|createdatabase|db:create)/.test(c)) {
    return 'database';
  }
  if (/(seed|db:seed|prisma\s+db\s+seed)/.test(c)) {
    return 'seed';
  }
  if (/(docker|docker-compose|compose\s+up|compose\s+build)/.test(c)) {
    return 'docker';
  }
  if (/(cp\s+\.env|\.env\.example|\.env\.sample|setenv|env\s+setup)/.test(c)) {
    return 'environment';
  }
  if (/(test|vitest|jest|mocha|cypress|playwright|spec)/.test(c)) {
    return 'testing';
  }
  if (/(\b(install|ci|i)\b|add\s)/.test(c) && /(npm|pnpm|yarn|bun)/.test(c)) {
    return 'installation';
  }
  if (/(run\s+)?(dev|start|serve|develop)/.test(c)) {
    return 'development';
  }
  if (/(run\s+)?build|compile/.test(c)) {
    return 'build';
  }
  return 'other';
}

function extractCommandLines(markdown: string): string[] {
  const lines: string[] = [];

  // 1. Fenced code blocks.
  const fenceRegex = /```[^\n]*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(markdown)) !== null) {
    for (const raw of match[1]!.split(/\r?\n/)) {
      const line = raw.replace(/^\s*\$\s?/, '').trim(); // strip shell prompt
      if (line && !line.startsWith('#')) lines.push(line);
    }
  }

  // 2. Inline `$`-prefixed shell lines outside fences.
  for (const raw of markdown.split(/\r?\n/)) {
    const m = raw.match(/^\s*\$\s+(.*)$/);
    if (m && m[1]) lines.push(m[1].trim());
  }

  return lines;
}

/** Analyze raw README markdown content. Pure — accepts text, returns structure. */
export function analyzeReadmeContent(
  markdown: string | null,
  fileName: string | null,
): ReadmeAnalysis {
  const byCategory = emptyByCategory();

  if (!markdown) {
    return { present: false, fileName, commands: [], byCategory };
  }

  const seen = new Set<string>();
  const commands: ReadmeCommand[] = [];

  for (const line of extractCommandLines(markdown)) {
    if (!looksLikeCommand(line)) continue;
    // Split on chained operators so each command classifies independently.
    for (const part of line.split(/&&|;/).map((p) => p.trim())) {
      if (!part || !looksLikeCommand(part)) continue;
      if (seen.has(part)) continue;
      seen.add(part);
      const category = classify(part);
      commands.push({ command: part, category });
      byCategory[category].push(part);
    }
  }

  return { present: true, fileName, commands, byCategory };
}

function emptyByCategory(): Record<ReadmeCommandCategory, string[]> {
  return CATEGORIES.reduce(
    (acc, key) => {
      acc[key] = [];
      return acc;
    },
    {} as Record<ReadmeCommandCategory, string[]>,
  );
}
