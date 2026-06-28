/**
 * Derivo — Project Analysis Engine: BaseDetector
 *
 * Abstract base implementing the `Detector` contract. Concrete detectors
 * implement the four required methods (detect / analyze / confidence /
 * recommendations) plus optional `risks`. `run()` orchestrates them into a
 * single `DetectorOutcome` and is the only method the engine invokes.
 *
 * This keeps detectors:
 *  - independently testable (each method is pure given a context)
 *  - decoupled (no detector references another)
 *  - open for extension (add a new detector without touching existing ones)
 */
import type { Detector, DetectorOutcome, IProjectContext, Recommendation, Risk } from './types.js';

export abstract class BaseDetector<TData> implements Detector<TData> {
  abstract readonly id: string;
  abstract readonly title: string;

  abstract detect(ctx: IProjectContext): boolean;
  abstract analyze(ctx: IProjectContext): TData;
  abstract confidence(ctx: IProjectContext): number;

  // Optional hooks — default to no contributions.
  recommendations(_ctx: IProjectContext, _data: TData): Recommendation[] {
    return [];
  }

  risks(_ctx: IProjectContext, _data: TData): Risk[] {
    return [];
  }

  run(ctx: IProjectContext): DetectorOutcome<TData> {
    const detected = this.detect(ctx);
    const data = this.analyze(ctx);
    const confidence = clampConfidence(this.confidence(ctx));
    return {
      id: this.id,
      title: this.title,
      detected,
      confidence,
      data,
      recommendations: this.recommendations(ctx, data),
      risks: this.risks(ctx, data),
    };
  }
}

export function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
