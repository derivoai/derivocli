/**
 * Derivo CLI — Shared command runtime helpers
 *
 * Cross-cutting UX used by commands: execution timing, progress steps, a
 * consistent command footer, and human-friendly error rendering. Keeping this
 * in one place means every command gets the same polish without duplicating
 * presentation logic.
 */
import pc from 'picocolors';
import { humanizeError } from '../plugins/plugin-errors/index.js';
import { icons, nl, printDivider, formatDuration } from './ui.js';

export { humanizeError };

export interface CommandFooter {
  durationMs: number;
  pluginsLoaded?: number;
  confidence?: number;
  errors?: number;
}

/**
 * Tracks timing, progress steps, and summary stats for a single command run,
 * then renders a uniform footer.
 */
export class CommandReporter {
  private readonly start = Date.now();
  private errorCount = 0;
  private pluginsLoaded?: number;
  private confidence?: number;

  constructor(private readonly options: { json: boolean; verbose: boolean }) {}

  get verbose(): boolean {
    return this.options.verbose;
  }
  get json(): boolean {
    return this.options.json;
  }

  /** Print a completed progress step (suppressed in JSON mode). */
  step(label: string): void {
    if (this.options.json) return;
    console.log(`  ${pc.green(icons.success)} ${label}`);
  }

  /** Print a failed progress step. */
  failStep(label: string): void {
    this.errorCount++;
    if (this.options.json) return;
    console.log(`  ${pc.red(icons.error)} ${label}`);
  }

  /** Verbose-only diagnostic line. */
  debug(label: string): void {
    if (this.options.verbose && !this.options.json) {
      console.log(`    ${pc.dim(`${icons.arrow} ${label}`)}`);
    }
  }

  recordError(): void {
    this.errorCount++;
  }
  setPluginsLoaded(n: number): void {
    this.pluginsLoaded = n;
  }
  setConfidence(n: number): void {
    this.confidence = n;
  }

  elapsed(): number {
    return Date.now() - this.start;
  }

  footerData(): CommandFooter {
    return {
      durationMs: this.elapsed(),
      pluginsLoaded: this.pluginsLoaded,
      confidence: this.confidence,
      errors: this.errorCount,
    };
  }

  /** Render the standard footer (skipped in JSON mode). */
  printFooter(): void {
    if (this.options.json) return;
    nl();
    printDivider();
    const parts: string[] = [`${icons.clock} Completed in ${formatDuration(this.elapsed())}`];
    if (this.pluginsLoaded !== undefined) parts.push(`Plugins loaded: ${this.pluginsLoaded}`);
    if (this.confidence !== undefined) parts.push(`Analysis confidence: ${this.confidence}%`);
    parts.push(
      this.errorCount === 0 ? pc.green('No errors') : pc.red(`${this.errorCount} error(s)`),
    );
    console.log(pc.dim(`  ${parts.join(`  ${icons.dot}  `)}`));
    nl();
  }
}

/** Render a thrown value as a friendly one-line error (and count it). */
export function renderError(error: unknown, json: boolean): void {
  const message = humanizeError(error);
  if (json) {
    console.log(JSON.stringify({ error: message }, null, 2));
  } else {
    console.error(`  ${pc.red(icons.error)} ${pc.red(message)}`);
  }
}
