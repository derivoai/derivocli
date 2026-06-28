/**
 * Derivo — Project Validation Engine: Public API
 *
 * Consumers (validate, setup, doctor, plugins, AI) depend on this barrel.
 *
 *   import { ProjectValidator, FixEngine, validateProject } from '../../validation/index.js';
 */
export * from './types.js';
export { BaseValidationRule } from './base-rule.js';
export { ProjectValidator, validateProject } from './validator.js';
export type { ValidatorOptions } from './validator.js';
export { FixEngine } from './fix-engine.js';
export type { FixEngineOptions } from './fix-engine.js';
export { createDefaultRules } from './rules/index.js';
export * from './rules/index.js';
