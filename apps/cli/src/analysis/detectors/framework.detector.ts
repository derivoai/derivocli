import { BaseDetector } from '../base-detector.js';
import type { FrameworkInfo, IProjectContext, Recommendation } from '../types.js';

interface FrameworkMatch {
  matched: boolean;
  /** Confidence contribution for this match, 0–100. */
  confidence: number;
  evidence: string[];
}

/**
 * A declarative framework definition.
 *
 * New frameworks are added by appending to `FRAMEWORK_DEFINITIONS` — the
 * detection algorithm itself never changes (Open/Closed Principle).
 * Definitions are evaluated in descending `priority` so that the most
 * specific framework (e.g. Next.js) wins over a generic one (e.g. React).
 */
export interface FrameworkDefinition {
  name: string;
  supported: boolean;
  priority: number;
  match(ctx: IProjectContext): FrameworkMatch;
}

/** Helper: a match driven by a dependency, optionally strengthened by a config file. */
function depMatch(
  ctx: IProjectContext,
  dep: string,
  configBasenames: string[] = [],
): FrameworkMatch {
  const hasDep = ctx.hasDependency(dep);
  const config = configBasenames.map((b) => ctx.existsWithExt(b)).find(Boolean) ?? null;
  if (!hasDep && !config) return { matched: false, confidence: 0, evidence: [] };

  const evidence: string[] = [];
  if (hasDep) evidence.push(`${dep} dependency`);
  if (config) evidence.push(config);

  // Dependency + config => very high. Single signal => solid but lower.
  const confidence = hasDep && config ? 99 : hasDep ? 90 : 75;
  return { matched: true, confidence, evidence };
}

export const FRAMEWORK_DEFINITIONS: FrameworkDefinition[] = [
  {
    name: 'Next.js',
    supported: true,
    priority: 100,
    match: (ctx) => depMatch(ctx, 'next', ['next.config']),
  },
  {
    name: 'Astro',
    supported: true,
    priority: 95,
    match: (ctx) => depMatch(ctx, 'astro', ['astro.config']),
  },
  {
    name: 'Remix',
    supported: false,
    priority: 94,
    match: (ctx) => depMatch(ctx, '@remix-run/react', ['remix.config']),
  },
  {
    name: 'Nuxt',
    supported: false,
    priority: 93,
    match: (ctx) => depMatch(ctx, 'nuxt', ['nuxt.config']),
  },
  {
    name: 'SvelteKit',
    supported: false,
    priority: 92,
    match: (ctx) => depMatch(ctx, '@sveltejs/kit', ['svelte.config']),
  },
  {
    name: 'NestJS',
    supported: false,
    priority: 85,
    match: (ctx) => depMatch(ctx, '@nestjs/core', ['nest-cli.json']),
  },
  {
    name: 'Express',
    supported: true,
    priority: 80,
    match: (ctx) => depMatch(ctx, 'express'),
  },
  {
    name: 'Fastify',
    supported: false,
    priority: 79,
    match: (ctx) => depMatch(ctx, 'fastify'),
  },
  {
    name: 'Angular',
    supported: false,
    priority: 78,
    match: (ctx) => depMatch(ctx, '@angular/core', ['angular.json']),
  },
  {
    name: 'Vue',
    supported: true,
    priority: 70,
    match: (ctx) => depMatch(ctx, 'vue', ['vue.config']),
  },
  {
    name: 'Svelte',
    supported: false,
    priority: 69,
    match: (ctx) => depMatch(ctx, 'svelte'),
  },
  {
    name: 'React',
    supported: true,
    priority: 60,
    match: (ctx) => depMatch(ctx, 'react'),
  },
  {
    name: 'Vite',
    supported: true,
    priority: 40,
    match: (ctx) => depMatch(ctx, 'vite', ['vite.config']),
  },
  {
    // Fallback when a package.json exists but no specific framework matched.
    name: 'Node.js',
    supported: true,
    priority: 1,
    match: (ctx) =>
      ctx.packageJson()
        ? { matched: true, confidence: 70, evidence: ['package.json present'] }
        : { matched: false, confidence: 0, evidence: [] },
  },
];

/** Common framework entry points, used as supplementary evidence. */
const ENTRY_FILES = [
  'src/main.tsx',
  'src/main.ts',
  'src/main.jsx',
  'src/main.js',
  'src/index.tsx',
  'src/index.ts',
  'src/index.jsx',
  'src/index.js',
  'app/page.tsx',
  'pages/index.tsx',
  'src/App.tsx',
];

export class FrameworkDetector extends BaseDetector<FrameworkInfo> {
  readonly id = 'framework';
  readonly title = 'Framework';

  private readonly definitions: FrameworkDefinition[];

  constructor(definitions: FrameworkDefinition[] = FRAMEWORK_DEFINITIONS) {
    super();
    // Sort once, descending priority.
    this.definitions = [...definitions].sort((a, b) => b.priority - a.priority);
  }

  detect(ctx: IProjectContext): boolean {
    return this.resolve(ctx).primary !== null;
  }

  analyze(ctx: IProjectContext): FrameworkInfo {
    const { primary, candidates } = this.resolve(ctx);
    return {
      name: primary?.definition.name ?? null,
      supported: primary?.definition.supported ?? false,
      evidence: primary?.match.evidence ?? [],
      candidates: candidates.map((c) => c.definition.name),
    };
  }

  confidence(ctx: IProjectContext): number {
    return this.resolve(ctx).primary?.match.confidence ?? 0;
  }

  override evidence(ctx: IProjectContext, data: FrameworkInfo): string[] {
    const evidence = [...data.evidence];
    // Surface a detected entry point as additional evidence.
    const entry = ctx.firstExisting(ENTRY_FILES);
    if (entry) evidence.push(entry);
    return evidence;
  }

  override reasoning(_ctx: IProjectContext, data: FrameworkInfo): string | undefined {
    if (!data.name) return 'No framework signature matched';
    if (data.candidates.length > 0) {
      return `${data.name} selected over ${data.candidates.join(', ')} by specificity`;
    }
    return `${data.name} matched by ${data.evidence.join(' + ') || 'package.json'}`;
  }

  override recommendations(ctx: IProjectContext, data: FrameworkInfo): Recommendation[] {
    if (data.name && !data.supported) {
      return [
        {
          id: 'unknown-framework',
          priority: 'medium',
          message: `Framework "${data.name}" is not officially supported`,
          detail: 'Derivo automation may be limited. Verify build and dev commands manually.',
          source: this.id,
        },
      ];
    }
    if (!data.name) {
      return [
        {
          id: 'unknown-build-system',
          priority: 'medium',
          message: 'Unknown framework / build system',
          detail: 'Could not infer a framework from dependencies or config files.',
          source: this.id,
        },
      ];
    }
    return [];
  }

  override risks(_ctx: IProjectContext, data: FrameworkInfo) {
    if (!data.name) {
      return [
        {
          id: 'unknown-framework',
          severity: 'warning' as const,
          title: 'Unknown framework',
          detail: 'No recognizable framework signature found.',
          source: this.id,
        },
      ];
    }
    if (!data.supported) {
      return [
        {
          id: 'unsupported-framework',
          severity: 'warning' as const,
          title: `Unsupported framework: ${data.name}`,
          source: this.id,
        },
      ];
    }
    return [];
  }

  private resolve(ctx: IProjectContext): {
    primary: { definition: FrameworkDefinition; match: FrameworkMatch } | null;
    candidates: { definition: FrameworkDefinition; match: FrameworkMatch }[];
  } {
    const matches = this.definitions
      .map((definition) => ({ definition, match: definition.match(ctx) }))
      .filter((entry) => entry.match.matched);

    // Definitions are pre-sorted by priority; the first match is the primary.
    const primary = matches[0] ?? null;
    const candidates = matches.filter((m) => m.definition.name !== primary?.definition.name);
    return { primary, candidates };
  }
}
