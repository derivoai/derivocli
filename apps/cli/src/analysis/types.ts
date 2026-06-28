/**
 * Derivo — Project Analysis Engine: Core Types
 *
 * Single source of truth for the contracts shared by the analysis engine,
 * every detector, and all downstream consumers (doctor, setup, plugins, AI).
 *
 * Design notes:
 *  - Detectors depend ONLY on these interfaces, never on each other.
 *  - The `ProjectAnalysis` object is the canonical result that future
 *    commands MUST consume instead of re-implementing detection logic.
 */

// ── Shared primitives ───────────────────────────────

export type RiskSeverity = 'info' | 'warning' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high';
export type RecommendationPriority = 'low' | 'medium' | 'high';

/** A potential problem surfaced by a detector or the engine. */
export interface Risk {
  /** Stable identifier, e.g. `missing-readme`. */
  id: string;
  severity: RiskSeverity;
  title: string;
  detail?: string;
  /** Detector id (or `engine`) that produced this risk. */
  source: string;
}

/** An actionable suggestion for the user. */
export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  message: string;
  detail?: string;
  source: string;
}

// ── Detector contract ───────────────────────────────

/**
 * The result of running a single detector.
 *
 * `data` is the detector's strongly typed domain payload. The concrete shape
 * is owned by the detector and surfaced on `ProjectAnalysis` via the builder.
 */
export interface DetectorOutcome<TData = unknown> {
  id: string;
  title: string;
  /** Whether the subject of the detector is present in the project. */
  detected: boolean;
  /** Confidence in the detection/analysis, 0–100. */
  confidence: number;
  data: TData;
  recommendations: Recommendation[];
  risks: Risk[];
}

/**
 * The four-method contract every detector exposes.
 * `run()` orchestrates them and is what the engine calls.
 */
export interface Detector<TData = unknown> {
  readonly id: string;
  readonly title: string;
  detect(ctx: IProjectContext): boolean;
  analyze(ctx: IProjectContext): TData;
  confidence(ctx: IProjectContext): number;
  recommendations(ctx: IProjectContext, data: TData): Recommendation[];
  risks(ctx: IProjectContext, data: TData): Risk[];
  run(ctx: IProjectContext): DetectorOutcome<TData>;
}

// ── Project context (cached filesystem access) ──────

export interface PackageJson {
  name?: string;
  version?: string;
  type?: 'module' | 'commonjs';
  packageManager?: string;
  engines?: Record<string, string>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
  volta?: { node?: string };
  [key: string]: unknown;
}

/**
 * Read-only, cached view of the project on disk.
 * The ONLY component that touches the filesystem during analysis, so
 * detectors never duplicate IO logic.
 */
export interface IProjectContext {
  readonly root: string;
  exists(relativePath: string): boolean;
  /** First existing path among the candidates, or null. */
  firstExisting(relativePaths: string[]): string | null;
  /** Check a basename against a set of common config extensions. */
  existsWithExt(basename: string, extensions?: string[]): string | null;
  readText(relativePath: string): string | null;
  readJSON<T = unknown>(relativePath: string): T | null;
  listDir(relativePath: string): string[];
  packageJson(): PackageJson | null;
  scripts(): Record<string, string>;
  hasDependency(name: string): boolean;
  dependencyVersion(name: string): string | null;
}

// ── Domain payloads (per-detector data) ─────────────

export interface FrameworkInfo {
  name: string | null;
  supported: boolean;
  evidence: string[];
  /** Other frameworks that also matched, for transparency. */
  candidates: string[];
}

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface PackageManagerInfo {
  name: PackageManagerName | null;
  source: 'packageManager-field' | 'lockfile' | 'workspace-config' | 'none';
  lockfiles: string[];
  conflicting: boolean;
}

export type WorkspaceTool = 'turborepo' | 'nx' | 'pnpm' | 'lerna' | 'npm/yarn' | null;

export interface WorkspaceMember {
  name: string;
  relativePath: string;
  /** Conventional grouping inferred from the path root. */
  kind: 'app' | 'package' | 'other';
}

export interface WorkspaceInfo {
  isMonorepo: boolean;
  tool: WorkspaceTool;
  packageCount: number;
  large: boolean;
  patterns: string[];
  members: WorkspaceMember[];
}

export interface LanguageInfo {
  primary: 'TypeScript' | 'JavaScript' | 'Unknown';
  moduleSystem: 'esm' | 'commonjs' | 'unknown';
}

export interface NodeVersionInfo {
  required: string | null;
  source: 'engines' | '.nvmrc' | '.node-version' | 'volta' | 'none';
}

export interface TypeScriptInfo {
  used: boolean;
  hasConfig: boolean;
  strict: boolean | null;
  version: string | null;
}

export interface TailwindInfo {
  used: boolean;
  hasConfig: boolean;
  version: string | null;
}

export interface DockerInfo {
  used: boolean;
  hasDockerfile: boolean;
  hasCompose: boolean;
  files: string[];
}

export interface GitInfo {
  initialized: boolean;
  hasGitignore: boolean;
}

export interface PrismaInfo {
  used: boolean;
  hasSchema: boolean;
  hasMigrations: boolean;
}

export interface EnvironmentInfo {
  hasExample: boolean;
  hasEnv: boolean;
  /** Variable names declared in .env.example (keys only, never values). */
  declaredVariables: string[];
  files: string[];
}

export interface BuildInfo {
  buildTool: string | null;
  hasBuildScript: boolean;
  hasDevScript: boolean;
  buildScript: string | null;
  devScript: string | null;
  startScript: string | null;
}

export interface ToolingInfo {
  lint: { used: boolean; tool: string | null; hasScript: boolean };
  format: { used: boolean; tool: string | null; hasScript: boolean };
}

export interface TestingInfo {
  used: boolean;
  framework: string | null;
  hasScript: boolean;
}

export interface GithubActionsInfo {
  used: boolean;
  workflows: string[];
}

/** A command extracted from the README, classified by intent. */
export type ReadmeCommandCategory =
  | 'installation'
  | 'development'
  | 'build'
  | 'database'
  | 'migration'
  | 'environment'
  | 'docker'
  | 'seed'
  | 'testing'
  | 'other';

export interface ReadmeCommand {
  command: string;
  category: ReadmeCommandCategory;
}

export interface ReadmeAnalysis {
  present: boolean;
  fileName: string | null;
  commands: ReadmeCommand[];
  /** Convenience: commands grouped by category. */
  byCategory: Record<ReadmeCommandCategory, string[]>;
}

// ── The canonical analysis result ───────────────────

export interface ProjectAnalysis {
  root: string;
  name: string | null;
  analyzedAt: string;

  framework: FrameworkInfo;
  packageManager: PackageManagerInfo;
  workspace: WorkspaceInfo;
  language: LanguageInfo;
  nodeVersion: NodeVersionInfo;
  typescript: TypeScriptInfo;
  tailwind: TailwindInfo;
  docker: DockerInfo;
  git: GitInfo;
  prisma: PrismaInfo;
  environment: EnvironmentInfo;
  build: BuildInfo;
  tooling: ToolingInfo;
  testing: TestingInfo;
  githubActions: GithubActionsInfo;
  readme: ReadmeAnalysis;

  risks: Risk[];
  riskLevel: RiskLevel;
  recommendations: Recommendation[];
  /** Overall confidence across the core identity detectors, 0–100. */
  confidence: number;

  /** Raw per-detector outcomes, for advanced/extensible consumers. */
  detectors: DetectorOutcome[];
}
