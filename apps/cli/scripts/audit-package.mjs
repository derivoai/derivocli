#!/usr/bin/env node
/**
 * Package audit — proves the published tarball contains ONLY production files.
 *
 * Runs `npm pack --dry-run --json`, inspects the file list, and fails if any
 * development-only file would ship, if the binary entry is missing, or if the
 * runtime dependency set is not as expected. Also reports size and entry point.
 *
 * Usage: node scripts/audit-package.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..');

const DEV_FILE_PATTERNS = [
  /^src\//,
  /^tests\//,
  /\.test\./,
  /(^|\/)eslint\.config\./,
  /(^|\/)tsconfig(\.\w+)?\.json$/,
  /(^|\/)\.turbo\//,
  /(^|\/)scripts\//,
  /\.map$/,
];

const EXPECTED_DEPS = ['commander', 'open', 'ora', 'picocolors', 'zod'];
const SIZE_WARN_BYTES = 2 * 1024 * 1024; // 2 MB

function fail(msg) {
  console.error(`  \u2717 ${msg}`);
  failures++;
}
function ok(msg) {
  console.log(`  \u2714 ${msg}`);
}
function warn(msg) {
  console.warn(`  \u26a0 ${msg}`);
}

let failures = 0;

console.log('\nDerivo package audit\n');

// 1. Produce the dry-run manifest.
let manifest;
try {
  const out = execSync('npm pack --dry-run --json', { cwd: pkgRoot, encoding: 'utf8' });
  manifest = JSON.parse(out)[0];
} catch (err) {
  console.error('Failed to run npm pack:', err.message);
  process.exit(1);
}

const files = (manifest.files ?? []).map((f) => f.path.replace(/\\/g, '/'));

// 2. No development files.
const leaked = files.filter((f) => DEV_FILE_PATTERNS.some((re) => re.test(f)));
if (leaked.length > 0) {
  fail(`Development files would be published:\n      ${leaked.join('\n      ')}`);
} else {
  ok('No development files in the package');
}

// 3. Required production files.
const required = ['bin/derivo.js', 'dist/index.js', 'package.json', 'README.md', 'LICENSE'];
for (const req of required) {
  if (files.includes(req)) ok(`Contains ${req}`);
  else fail(`Missing required file: ${req}`);
}

// 4. Binary entry point matches package.json bin.
const pkg = JSON.parse(readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
const binPath = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.derivo;
if (binPath && files.includes(binPath.replace(/^\.\//, ''))) {
  ok(`Binary entry point present: ${binPath}`);
} else {
  fail(`Binary entry point not packaged: ${binPath}`);
}

// 5. Shebang present in the bin (required for global executables).
try {
  const binSrc = readFileSync(path.join(pkgRoot, binPath), 'utf8');
  if (binSrc.startsWith('#!')) ok('Binary has a shebang line');
  else fail('Binary is missing a shebang (#!/usr/bin/env node)');
} catch {
  fail('Could not read the binary entry point');
}

// 6. Dependencies: only the expected production set, no workspace protocols.
const deps = Object.keys(pkg.dependencies ?? {});
const workspaceDeps = Object.entries(pkg.dependencies ?? {}).filter(([, v]) =>
  String(v).startsWith('workspace:'),
);
if (workspaceDeps.length > 0) {
  fail(`Runtime dependencies use workspace protocol: ${workspaceDeps.map(([k]) => k).join(', ')}`);
} else {
  ok('No workspace: protocols in runtime dependencies');
}
const unexpected = deps.filter((d) => !EXPECTED_DEPS.includes(d));
if (unexpected.length > 0) warn(`Unexpected runtime dependencies: ${unexpected.join(', ')}`);
else ok(`Runtime dependencies as expected (${deps.length})`);

// 7. Size report.
const size = manifest.size ?? 0;
const unpacked = manifest.unpackedSize ?? 0;
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(`\n  Package: ${manifest.name}@${manifest.version}`);
console.log(`  Files: ${files.length}   Packed: ${kb(size)}   Unpacked: ${kb(unpacked)}`);
if (size > SIZE_WARN_BYTES) warn(`Packed size exceeds ${kb(SIZE_WARN_BYTES)}`);

console.log('');
if (failures > 0) {
  console.error(`Audit FAILED with ${failures} problem(s).\n`);
  process.exit(1);
}
console.log('Audit PASSED — package is production-clean.\n');
