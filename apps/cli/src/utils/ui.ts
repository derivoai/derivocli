/**
 * Derivo CLI — Shared UI Branding & Formatting Utilities
 *
 * Provides consistent visual identity across all CLI commands.
 * Uses only picocolors (already a dependency) for zero-overhead styling.
 */
import pc from 'picocolors';

// ── Brand Constants ─────────────────────────────────
export const BRAND = {
  name: 'Derivo',
  version: 'v0.1.0',
  tagline: 'Developer Experience, Automated.',
  url: 'https://derivo.in',
};

// ── Unicode Characters ──────────────────────────────
export const icons = {
  success: '✔',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  arrow: '→',
  arrowRight: '▸',
  bullet: '●',
  dot: '·',
  dash: '─',
  check: '✓',
  cross: '✕',
  star: '★',
  sparkle: '✦',
  rocket: '🚀',
  package: '📦',
  gear: '⚙',
  lock: '🔒',
  key: '🔑',
  globe: '🌐',
  folder: '📁',
  file: '📄',
  link: '🔗',
  bolt: '⚡',
  shield: '🛡',
  heart: '❤',
  wave: '👋',
  party: '🎉',
  tools: '🔧',
  magnify: '🔍',
  trash: '🗑',
  clock: '⏱',
  terminal: '❯',
};

// ── Box Drawing ─────────────────────────────────────
const box = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
};

// ── Color Palette ───────────────────────────────────
export const colors = {
  brand: (text: string) => pc.cyan(text),
  brandBold: (text: string) => pc.bold(pc.cyan(text)),
  success: (text: string) => pc.green(text),
  error: (text: string) => pc.red(text),
  warning: (text: string) => pc.yellow(text),
  info: (text: string) => pc.blue(text),
  dim: (text: string) => pc.dim(text),
  muted: (text: string) => pc.dim(pc.white(text)),
  highlight: (text: string) => pc.bold(pc.white(text)),
  label: (text: string) => pc.dim(pc.cyan(text)),
  value: (text: string) => pc.white(text),
  link: (text: string) => pc.underline(pc.cyan(text)),
  cmd: (text: string) => pc.bold(pc.cyan(text)),
};

// ── Logo ────────────────────────────────────────────
export function printLogo() {
  console.log('');
  console.log(pc.cyan('    ____             _           '));
  console.log(pc.cyan('   / __ \\  ___  _ __(_)_   _____ '));
  console.log(pc.cyan("  / / / / / _ \\| '__| \\ \\ / / _ \\"));
  console.log(pc.cyan(' / /_/ / |  __/| |  | |\\ V / (_) |'));
  console.log(pc.cyan('/_____/   \\___||_|  |_| \\_/ \\___/ '));
  console.log('');
  console.log(pc.dim(`  ${BRAND.tagline}  ${pc.cyan(BRAND.version)}`));
  console.log('');
}

// ── Small Banner ────────────────────────────────────
export function printBanner(title: string, subtitle?: string) {
  const width = 44;
  const pad = (str: string, len: number) => {
    const stripped = stripAnsi(str);
    const padLen = Math.max(0, len - stripped.length);
    return str + ' '.repeat(padLen);
  };

  console.log('');
  console.log(pc.cyan(`  ${box.topLeft}${box.horizontal.repeat(width)}${box.topRight}`));
  console.log(
    pc.cyan(`  ${box.vertical}`) +
      '  ' +
      pad(pc.bold(pc.white(`${icons.sparkle}  ${title}`)), width - 2) +
      pc.cyan(box.vertical),
  );
  if (subtitle) {
    console.log(
      pc.cyan(`  ${box.vertical}`) +
        '  ' +
        pad(pc.dim(subtitle), width - 2) +
        pc.cyan(box.vertical),
    );
  }
  console.log(pc.cyan(`  ${box.bottomLeft}${box.horizontal.repeat(width)}${box.bottomRight}`));
  console.log('');
}

// ── Section Header ──────────────────────────────────
export function printSection(title: string) {
  console.log('');
  console.log(`  ${pc.bold(pc.cyan(icons.arrowRight))} ${pc.bold(pc.white(title))}`);
  console.log(pc.dim(`  ${box.horizontal.repeat(40)}`));
}

// ── Key-Value Pair ──────────────────────────────────
export function printKeyValue(key: string, value: string, indent = 4) {
  const spaces = ' '.repeat(indent);
  console.log(`${spaces}${pc.dim(key.padEnd(18))} ${pc.white(value)}`);
}

// ── Status Line ─────────────────────────────────────
export function printStatus(
  status: 'success' | 'error' | 'warning' | 'info',
  message: string,
  detail?: string,
) {
  const iconMap = {
    success: pc.green(icons.success),
    error: pc.red(icons.error),
    warning: pc.yellow(icons.warning),
    info: pc.blue(icons.info),
  };
  const colorMap = {
    success: pc.green,
    error: pc.red,
    warning: pc.yellow,
    info: pc.blue,
  };

  console.log(`  ${iconMap[status]} ${colorMap[status](message)}`);
  if (detail) {
    console.log(`    ${pc.dim(icons.arrow)} ${pc.dim(detail)}`);
  }
}

// ── Success Box ─────────────────────────────────────
export function printSuccessBox(title: string, lines: string[] = []) {
  const width = 44;
  const pad = (str: string, len: number) => {
    const stripped = stripAnsi(str);
    const padLen = Math.max(0, len - stripped.length);
    return str + ' '.repeat(padLen);
  };

  console.log('');
  console.log(pc.green(`  ${box.topLeft}${box.horizontal.repeat(width)}${box.topRight}`));
  console.log(
    pc.green(`  ${box.vertical}`) +
      '  ' +
      pad(pc.bold(pc.green(`${icons.check} ${title}`)), width - 2) +
      pc.green(box.vertical),
  );

  for (const line of lines) {
    console.log(
      pc.green(`  ${box.vertical}`) + '  ' + pad(line, width - 2) + pc.green(box.vertical),
    );
  }

  console.log(pc.green(`  ${box.bottomLeft}${box.horizontal.repeat(width)}${box.bottomRight}`));
  console.log('');
}

// ── Error Box ───────────────────────────────────────
export function printErrorBox(title: string, lines: string[] = []) {
  const width = 44;
  const pad = (str: string, len: number) => {
    const stripped = stripAnsi(str);
    const padLen = Math.max(0, len - stripped.length);
    return str + ' '.repeat(padLen);
  };

  console.log('');
  console.log(pc.red(`  ${box.topLeft}${box.horizontal.repeat(width)}${box.topRight}`));
  console.log(
    pc.red(`  ${box.vertical}`) +
      '  ' +
      pad(pc.bold(pc.red(`${icons.cross} ${title}`)), width - 2) +
      pc.red(box.vertical),
  );

  for (const line of lines) {
    console.log(pc.red(`  ${box.vertical}`) + '  ' + pad(line, width - 2) + pc.red(box.vertical));
  }

  console.log(pc.red(`  ${box.bottomLeft}${box.horizontal.repeat(width)}${box.bottomRight}`));
  console.log('');
}

// ── Progress Bar (text-based) ───────────────────────
export function progressBar(current: number, total: number, width = 30): string {
  const ratio = Math.min(current / total, 1);
  const filled = Math.round(width * ratio);
  const empty = width - filled;
  const bar = pc.cyan('█'.repeat(filled)) + pc.dim('░'.repeat(empty));
  const pct = pc.bold(pc.white(`${Math.round(ratio * 100)}%`));
  return `${bar} ${pct}`;
}

// ── Step Counter ────────────────────────────────────
export function stepLabel(current: number, total: number): string {
  return pc.dim(`[${current}/${total}]`);
}

// ── Divider ─────────────────────────────────────────
export function printDivider() {
  console.log(pc.dim(`  ${box.horizontal.repeat(44)}`));
}

// ── Newline helper ──────────────────────────────────
export function nl(count = 1) {
  for (let i = 0; i < count; i++) console.log('');
}

// ── Strip ANSI codes for width calculation ──────────
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

// ── Formatted Timestamp ─────────────────────────────
export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Duration formatter ──────────────────────────────
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

// ── Branded Spinner Options (pass to ora) ───────────
export const spinnerConfig = {
  spinner: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  },
  color: 'cyan' as const,
};
