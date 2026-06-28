/**
 * Derivo — Project Analysis Engine: Public API
 *
 * Import surface for all consumers. Future commands should depend on this
 * barrel rather than reaching into individual modules.
 *
 *   import { analyzeProject, ProjectAnalyzer } from '../../analysis/index.js';
 */
export * from './types.js';
export { ProjectContext } from './context.js';
export { BaseDetector, clampConfidence } from './base-detector.js';
export { analyzeReadmeContent } from './readme-analyzer.js';
export { ProjectAnalyzer, analyzeProject } from './analyzer.js';
export type { AnalyzerOptions } from './analyzer.js';
export { createDefaultDetectors } from './detectors/index.js';
export * from './detectors/index.js';
