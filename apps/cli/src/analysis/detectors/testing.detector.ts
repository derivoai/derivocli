import { BaseDetector } from '../base-detector.js';
import type { IProjectContext, TestingInfo } from '../types.js';

interface TestFrameworkRule {
  name: string;
  dep: string;
  configBasenames?: string[];
}

const TEST_FRAMEWORKS: TestFrameworkRule[] = [
  { name: 'Vitest', dep: 'vitest', configBasenames: ['vitest.config'] },
  { name: 'Jest', dep: 'jest', configBasenames: ['jest.config'] },
  { name: 'Playwright', dep: '@playwright/test', configBasenames: ['playwright.config'] },
  { name: 'Cypress', dep: 'cypress', configBasenames: ['cypress.config'] },
  { name: 'Mocha', dep: 'mocha' },
  { name: 'AVA', dep: 'ava' },
];

export class TestingDetector extends BaseDetector<TestingInfo> {
  readonly id = 'testing';
  readonly title = 'Testing';

  detect(ctx: IProjectContext): boolean {
    return this.analyze(ctx).used;
  }

  analyze(ctx: IProjectContext): TestingInfo {
    const framework =
      TEST_FRAMEWORKS.find(
        (rule) =>
          ctx.hasDependency(rule.dep) ||
          (rule.configBasenames ?? []).some((b) => ctx.existsWithExt(b)),
      )?.name ?? null;

    const hasScript = typeof ctx.scripts().test === 'string';
    return { used: framework !== null || hasScript, framework, hasScript };
  }

  confidence(ctx: IProjectContext): number {
    const info = this.analyze(ctx);
    if (!info.used) return 90;
    return info.framework ? 95 : 70;
  }

  override evidence(_ctx: IProjectContext, data: TestingInfo): string[] {
    const evidence: string[] = [];
    if (data.framework) evidence.push(`${data.framework} dependency`);
    if (data.hasScript) evidence.push('test script');
    return evidence;
  }
}
