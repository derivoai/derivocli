/**
 * `derivo validate` — surfaces the shared Validation Engine.
 *
 * Thin presentation + interaction layer. All validation/fix logic lives in
 * `../../validation`, which is the single source of truth.
 */
import path from 'path';
import pc from 'picocolors';
import { analyzeProject } from '../../analysis/index.js';
import type { ProjectAnalysis } from '../../analysis/index.js';
import {
  FixEngine,
  ProjectValidator,
  type ValidationReport,
  type ValidationResult,
} from '../../validation/index.js';
import { promptConfirm, closePrompt } from '../../utils/prompts.js';
import { printBanner, printSection, printDivider, nl, icons, progressBar } from '../../utils/ui.js';

interface ValidateOptions {
  fix: boolean;
  json: boolean;
  path?: string;
}

export async function validateHandler(options: ValidateOptions): Promise<void> {
  const cwd = options.path ? path.resolve(options.path) : process.cwd();

  let analysis: ProjectAnalysis;
  const validator = new ProjectValidator();
  let report: ValidationReport;
  try {
    analysis = analyzeProject(cwd);
    report = validator.validate(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) console.log(JSON.stringify({ error: message }, null, 2));
    else console.error(pc.red(`${icons.error} Validation failed: ${message}`));
    process.exit(1);
  }

  if (options.json && !options.fix) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  printBanner('Project Validation', `${icons.shield} Checking project health`);
  renderResults(report);

  // ── Interactive fixes ─────────────────────────────
  if (options.fix && report.fixable.length > 0) {
    printSection('Fixes');
    const engine = new FixEngine({
      root: cwd,
      analysis,
      rules: validator.getRules(),
      confirm: promptConfirm,
      log: (msg) => console.log(`      ${pc.dim(icons.arrow)} ${pc.dim(msg)}`),
    });

    const fixes = await engine.run(report.fixable);
    nl();
    for (const fix of fixes) {
      if (fix.applied) console.log(`    ${pc.green(icons.success)} ${fix.message}`);
      else if (fix.error)
        console.log(`    ${pc.red(icons.error)} ${fix.message}: ${pc.dim(fix.error)}`);
      else console.log(`    ${pc.dim(icons.dot)} ${pc.dim(fix.message)}`);
    }

    // Re-validate to reflect the post-fix state.
    const after = validator.validate(analyzeProject(cwd));
    nl();
    console.log(
      `    ${pc.dim('Score')}  ${scoreColor(after.score)(`${after.score}/100`)} ${pc.dim(
        `(was ${report.score}/100)`,
      )}`,
    );
    closePrompt();
  } else if (options.fix) {
    nl();
    console.log(`    ${pc.green(icons.success)} ${pc.dim('No fixable issues found.')}`);
    closePrompt();
  }

  renderScore(report);
  process.exit(0);
}

function renderResults(report: ValidationReport): void {
  printSection('Checks');
  for (const result of report.results) {
    console.log(`    ${statusIcon(result)} ${labelFor(result)}`);
    if (result.status !== 'pass' && result.detail) {
      for (const line of result.detail.split('\n')) {
        console.log(`      ${pc.dim(line.startsWith('•') ? line : `${icons.arrow} ${line}`)}`);
      }
    }
    if (result.fixable && result.fixPrompt) {
      console.log(
        `      ${pc.cyan(icons.arrowRight)} ${pc.cyan(result.fixPrompt)} ${pc.dim('(use --fix)')}`,
      );
    }
  }
}

function renderScore(report: ValidationReport): void {
  nl();
  printDivider();
  nl();
  console.log(`  ${icons.shield} Validation Score`);
  console.log(`  ${progressBar(report.score, 100, 36)}`);
  nl();
  const { passed, warnings, errors } = report.summary;
  console.log(
    `  ${pc.green(`${icons.success} ${passed} passed`)}  ${pc.yellow(
      `${icons.warning} ${warnings} warnings`,
    )}  ${pc.red(`${icons.error} ${errors} errors`)}`,
  );
  nl();
}

function statusIcon(result: ValidationResult): string {
  if (result.status === 'pass') return pc.green(icons.success);
  if (result.status === 'fail') return pc.red(icons.error);
  return pc.yellow(icons.warning);
}

function labelFor(result: ValidationResult): string {
  const message = result.status === 'pass' ? pc.dim(result.title) : pc.white(result.message);
  return message;
}

function scoreColor(score: number): (s: string) => string {
  return score >= 85 ? pc.green : score >= 60 ? pc.yellow : pc.red;
}
