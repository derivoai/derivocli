/**
 * Derivo — Project Analysis Engine: ProjectAnalyzer
 *
 * The orchestrator and SINGLE SOURCE OF TRUTH for project understanding.
 * Future commands (`derivo doctor`, `derivo setup`, plugins, the AI assistant)
 * MUST call `ProjectAnalyzer.analyze()` instead of re-implementing detection.
 *
 * Responsibilities:
 *  - Run every registered detector against a shared, cached context.
 *  - Aggregate per-detector risks and recommendations.
 *  - Derive an overall risk level and confidence score.
 *  - Assemble the canonical, strongly typed `ProjectAnalysis`.
 *
 * Detectors are injected (DI) so the engine is testable and extensible.
 */
import { ProjectContext } from './context.js';
import { createDefaultDetectors } from './detectors/index.js';
import type {
  BuildInfo,
  Detector,
  DetectorOutcome,
  DockerInfo,
  EnvironmentInfo,
  FrameworkInfo,
  GitInfo,
  GithubActionsInfo,
  IProjectContext,
  LanguageInfo,
  NodeVersionInfo,
  PackageManagerInfo,
  PrismaInfo,
  ProjectAnalysis,
  ReadmeAnalysis,
  Recommendation,
  Risk,
  RiskLevel,
  TailwindInfo,
  TestingInfo,
  ToolingInfo,
  TypeScriptInfo,
  WorkspaceInfo,
} from './types.js';

/** Detectors whose confidence defines the overall analysis confidence. */
const CORE_CONFIDENCE_DETECTORS = ['framework', 'package-manager', 'language', 'build'];

export interface AnalyzerOptions {
  /** Override the detector set (defaults to the full registry). */
  detectors?: Detector[];
  /** Optional sink for non-fatal detector errors. */
  onDetectorError?: (detectorId: string, error: unknown) => void;
}

export class ProjectAnalyzer {
  private readonly detectors: Detector[];
  private readonly onDetectorError?: (detectorId: string, error: unknown) => void;

  constructor(options: AnalyzerOptions = {}) {
    this.detectors = options.detectors ?? createDefaultDetectors();
    this.onDetectorError = options.onDetectorError;
  }

  /**
   * Analyze a project directory and produce the canonical analysis object.
   * @param target Either a directory path or a pre-built context.
   */
  analyze(target: string | IProjectContext = process.cwd()): ProjectAnalysis {
    const ctx: IProjectContext = typeof target === 'string' ? new ProjectContext(target) : target;

    const outcomes: DetectorOutcome[] = [];
    for (const detector of this.detectors) {
      try {
        outcomes.push(detector.run(ctx));
      } catch (error) {
        // A single faulty detector must never crash the whole analysis.
        this.onDetectorError?.(detector.id, error);
        outcomes.push(this.errorOutcome(detector, error));
      }
    }

    const risks = outcomes.flatMap((o) => o.risks);
    // Engine-level integrity check: package.json present but unparseable.
    if (ctx.exists('package.json') && ctx.packageJson() === null) {
      risks.push({
        id: 'corrupt-package-json',
        severity: 'critical',
        title: 'Corrupt package.json',
        detail: 'package.json exists but could not be parsed.',
        source: 'engine',
      });
    }
    const recommendations = this.dedupeRecommendations(outcomes.flatMap((o) => o.recommendations));

    return {
      root: ctx.root,
      name: ctx.packageJson()?.name ?? null,
      analyzedAt: new Date().toISOString(),

      framework: this.data<FrameworkInfo>(outcomes, 'framework', {
        name: null,
        supported: false,
        evidence: [],
        candidates: [],
      }),
      packageManager: this.data<PackageManagerInfo>(outcomes, 'package-manager', {
        name: null,
        source: 'none',
        lockfiles: [],
        conflicting: false,
      }),
      workspace: this.data<WorkspaceInfo>(outcomes, 'workspace', {
        isMonorepo: false,
        tool: null,
        packageCount: 0,
        large: false,
        patterns: [],
        members: [],
      }),
      language: this.data<LanguageInfo>(outcomes, 'language', {
        primary: 'Unknown',
        moduleSystem: 'unknown',
      }),
      nodeVersion: this.data<NodeVersionInfo>(outcomes, 'node-version', {
        required: null,
        source: 'none',
      }),
      typescript: this.data<TypeScriptInfo>(outcomes, 'typescript', {
        used: false,
        hasConfig: false,
        strict: null,
        version: null,
      }),
      tailwind: this.data<TailwindInfo>(outcomes, 'tailwind', {
        used: false,
        hasConfig: false,
        version: null,
      }),
      docker: this.data<DockerInfo>(outcomes, 'docker', {
        used: false,
        hasDockerfile: false,
        hasCompose: false,
        files: [],
      }),
      git: this.data<GitInfo>(outcomes, 'git', {
        initialized: false,
        hasGitignore: false,
      }),
      prisma: this.data<PrismaInfo>(outcomes, 'prisma', {
        used: false,
        hasSchema: false,
        hasMigrations: false,
      }),
      environment: this.data<EnvironmentInfo>(outcomes, 'environment', {
        hasExample: false,
        hasEnv: false,
        declaredVariables: [],
        files: [],
      }),
      build: this.data<BuildInfo>(outcomes, 'build', {
        buildTool: null,
        hasBuildScript: false,
        hasDevScript: false,
        buildScript: null,
        devScript: null,
        startScript: null,
      }),
      tooling: this.data<ToolingInfo>(outcomes, 'tooling', {
        lint: { used: false, tool: null, hasScript: false },
        format: { used: false, tool: null, hasScript: false },
      }),
      testing: this.data<TestingInfo>(outcomes, 'testing', {
        used: false,
        framework: null,
        hasScript: false,
      }),
      githubActions: this.data<GithubActionsInfo>(outcomes, 'github-actions', {
        used: false,
        workflows: [],
      }),
      readme: this.data<ReadmeAnalysis>(outcomes, 'readme', {
        present: false,
        fileName: null,
        commands: [],
        byCategory: {
          installation: [],
          development: [],
          build: [],
          database: [],
          migration: [],
          environment: [],
          docker: [],
          seed: [],
          testing: [],
          other: [],
        },
      }),

      risks,
      riskLevel: this.deriveRiskLevel(risks),
      recommendations,
      confidence: this.deriveConfidence(outcomes),
      detectors: outcomes,
    };
  }

  // ── Internal helpers ──────────────────────────────

  private data<T>(outcomes: DetectorOutcome[], id: string, fallback: T): T {
    const outcome = outcomes.find((o) => o.id === id);
    return outcome ? (outcome.data as T) : fallback;
  }

  private deriveRiskLevel(risks: Risk[]): RiskLevel {
    // Severity-based: critical → high, warning → medium, only info/none → low.
    if (risks.some((r) => r.severity === 'critical')) return 'high';
    if (risks.some((r) => r.severity === 'warning')) return 'medium';
    return 'low';
  }

  private deriveConfidence(outcomes: DetectorOutcome[]): number {
    const core = outcomes.filter((o) => CORE_CONFIDENCE_DETECTORS.includes(o.id));
    const pool = core.length > 0 ? core : outcomes;
    if (pool.length === 0) return 0;
    const sum = pool.reduce((acc, o) => acc + o.confidence, 0);
    return Math.round(sum / pool.length);
  }

  private dedupeRecommendations(recs: Recommendation[]): Recommendation[] {
    const order = { high: 0, medium: 1, low: 2 };
    const seen = new Map<string, Recommendation>();
    for (const rec of recs) {
      if (!seen.has(rec.id)) seen.set(rec.id, rec);
    }
    return [...seen.values()].sort((a, b) => order[a.priority] - order[b.priority]);
  }

  private errorOutcome(detector: Detector, error: unknown): DetectorOutcome {
    return {
      id: detector.id,
      title: detector.title,
      detected: false,
      confidence: 0,
      evidence: [],
      reasoning: 'Detector threw an error during analysis',
      data: {},
      recommendations: [],
      risks: [
        {
          id: `${detector.id}-error`,
          severity: 'info',
          title: `${detector.title} analysis failed`,
          detail: error instanceof Error ? error.message : String(error),
          source: detector.id,
        },
      ],
    };
  }
}

/** Convenience facade for one-shot analysis. */
export function analyzeProject(
  target: string | IProjectContext = process.cwd(),
  options?: AnalyzerOptions,
): ProjectAnalysis {
  return new ProjectAnalyzer(options).analyze(target);
}
