import { describe, it, expect } from 'vitest';

/**
 * Test command detection regex patterns from track-test-run.ts
 *
 * These tests verify that the hook correctly detects various test command formats.
 */

// Regex patterns from track-test-run.ts
const TEST_COMMAND_REGEX = /(?:npx\s+)?(?:vitest|playwright|jest)|(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|just\s+test/i;
const MANUAL_OVERRIDE_REGEX = /claude[:\s]+mark[:\s]+tests[:\s]+passed/i;

function isTestCommand(command: string): boolean {
  return TEST_COMMAND_REGEX.test(command);
}

function isManualOverride(command: string): boolean {
  return MANUAL_OVERRIDE_REGEX.test(command);
}

describe('track-test-run: Test Command Detection', () => {
  describe('vitest variations', () => {
    it('detects raw vitest command', () => {
      expect(isTestCommand('vitest')).toBe(true);
    });

    it('detects npx vitest', () => {
      expect(isTestCommand('npx vitest')).toBe(true);
    });

    it('detects npx vitest run', () => {
      expect(isTestCommand('npx vitest run')).toBe(true);
    });

    it('detects vitest with flags', () => {
      expect(isTestCommand('vitest run --reporter=verbose')).toBe(true);
      expect(isTestCommand('npx vitest --watch')).toBe(true);
    });
  });

  describe('npm variations (from package.json)', () => {
    it('detects npm test', () => {
      expect(isTestCommand('npm test')).toBe(true);
    });

    it('detects npm run test variants', () => {
      expect(isTestCommand('npm run test')).toBe(true);
      expect(isTestCommand('npm run test:ci')).toBe(true);
      expect(isTestCommand('npm run test:unit')).toBe(true);
      expect(isTestCommand('npm run test:coverage')).toBe(true);
    });
  });

  describe('pnpm variations', () => {
    it('detects pnpm test', () => {
      expect(isTestCommand('pnpm test')).toBe(true);
    });

    it('detects pnpm run test variants', () => {
      expect(isTestCommand('pnpm run test')).toBe(true);
      expect(isTestCommand('pnpm run test:e2e')).toBe(true);
    });
  });

  describe('yarn and bun', () => {
    it('detects yarn test', () => {
      expect(isTestCommand('yarn test')).toBe(true);
      expect(isTestCommand('yarn run test')).toBe(true);
    });

    it('detects bun test', () => {
      expect(isTestCommand('bun test')).toBe(true);
      expect(isTestCommand('bun run test')).toBe(true);
    });
  });

  describe('just commands', () => {
    it('detects just test', () => {
      expect(isTestCommand('just test')).toBe(true);
    });

    it('detects just test variants', () => {
      expect(isTestCommand('just test-ci')).toBe(true);
      expect(isTestCommand('just test-cov')).toBe(true);
    });
  });

  describe('playwright and jest', () => {
    it('detects playwright commands', () => {
      expect(isTestCommand('playwright test')).toBe(true);
      expect(isTestCommand('npx playwright test')).toBe(true);
    });

    it('detects jest commands', () => {
      expect(isTestCommand('jest')).toBe(true);
      expect(isTestCommand('npx jest')).toBe(true);
    });
  });

  describe('non-test commands (should NOT match)', () => {
    it('rejects build commands', () => {
      expect(isTestCommand('npm run build')).toBe(false);
      expect(isTestCommand('npm run build:production')).toBe(false);
    });

    it('rejects dev commands', () => {
      expect(isTestCommand('npm run dev')).toBe(false);
      expect(isTestCommand('just dev')).toBe(false);
    });

    it('rejects git commands', () => {
      expect(isTestCommand('git status')).toBe(false);
      expect(isTestCommand('git commit')).toBe(false);
    });

    it('rejects typecheck', () => {
      expect(isTestCommand('npm run typecheck')).toBe(false);
      expect(isTestCommand('npx tsc --noEmit')).toBe(false);
    });
  });
});

describe('track-test-run: Manual Override Detection', () => {
  it('detects manual override with colon', () => {
    expect(isManualOverride('echo "claude: mark tests passed"')).toBe(true);
  });

  it('detects manual override with spaces', () => {
    expect(isManualOverride('claude mark tests passed')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isManualOverride('CLAUDE: MARK TESTS PASSED')).toBe(true);
    expect(isManualOverride('Claude: Mark Tests Passed')).toBe(true);
  });

  it('allows flexible whitespace', () => {
    expect(isManualOverride('claude:mark tests passed')).toBe(true);
    expect(isManualOverride('claude :  mark  tests  passed')).toBe(true);
  });

  it('rejects similar but wrong patterns', () => {
    expect(isManualOverride('claude mark test passed')).toBe(false); // singular 'test'
    expect(isManualOverride('mark tests passed')).toBe(false); // missing 'claude'
  });
});
