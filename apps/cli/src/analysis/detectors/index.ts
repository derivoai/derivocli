/**
 * Derivo — Project Analysis Engine: Detector Registry
 *
 * The single place detectors are registered. To support a new aspect of a
 * project, add a detector here — no existing detector or the engine needs to
 * change (Open/Closed Principle).
 */
import type { Detector } from '../types.js';
import { BuildDetector } from './build.detector.js';
import { DockerDetector } from './docker.detector.js';
import { EnvironmentDetector } from './environment.detector.js';
import { FrameworkDetector } from './framework.detector.js';
import { GitDetector } from './git.detector.js';
import { GithubActionsDetector } from './github-actions.detector.js';
import { LanguageDetector } from './language.detector.js';
import { NodeVersionDetector } from './node-version.detector.js';
import { PackageManagerDetector } from './package-manager.detector.js';
import { PrismaDetector } from './prisma.detector.js';
import { ReadmeDetector } from './readme.detector.js';
import { TailwindDetector } from './tailwind.detector.js';
import { TestingDetector } from './testing.detector.js';
import { ToolingDetector } from './tooling.detector.js';
import { TypeScriptDetector } from './typescript.detector.js';
import { WorkspaceDetector } from './workspace.detector.js';

export * from './build.detector.js';
export * from './docker.detector.js';
export * from './environment.detector.js';
export * from './framework.detector.js';
export * from './git.detector.js';
export * from './github-actions.detector.js';
export * from './language.detector.js';
export * from './node-version.detector.js';
export * from './package-manager.detector.js';
export * from './prisma.detector.js';
export * from './readme.detector.js';
export * from './tailwind.detector.js';
export * from './testing.detector.js';
export * from './tooling.detector.js';
export * from './typescript.detector.js';
export * from './workspace.detector.js';

/** Build the default, ordered set of detectors used by the engine. */
export function createDefaultDetectors(): Detector[] {
  return [
    new FrameworkDetector(),
    new PackageManagerDetector(),
    new WorkspaceDetector(),
    new LanguageDetector(),
    new NodeVersionDetector(),
    new TypeScriptDetector(),
    new BuildDetector(),
    new TailwindDetector(),
    new DockerDetector(),
    new GitDetector(),
    new PrismaDetector(),
    new EnvironmentDetector(),
    new ToolingDetector(),
    new TestingDetector(),
    new GithubActionsDetector(),
    new ReadmeDetector(),
  ];
}
