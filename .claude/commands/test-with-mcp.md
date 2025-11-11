# Generate E2E Tests with Playwright MCP

Generate comprehensive E2E tests using Playwright MCP interactive exploration and convert them to traditional Playwright test code.

## Usage

When you need to create tests for a feature, use this command and specify:
1. The feature or component to test
2. Which viewport (iPad or desktop)
3. Specific scenarios to cover

## Process

I will follow this workflow:

### Step 1: Clarify Requirements
- Ask which MCP server to use (playwright-ipad, playwright-desktop, or playwright-debug)
- Confirm test scenarios to cover
- Identify if Page Object Models exist

### Step 2: Explore with MCP
- Use Playwright MCP tools to interact with the feature
- Record all user interactions (clicks, fills, navigations)
- Monitor console for errors (RLS, React, network)
- Capture accessibility tree for semantic selectors
- Take screenshots if needed for visual verification

### Step 3: Generate Traditional Test Code
- Convert MCP interactions to traditional Playwright TypeScript code
- Apply Page Object Model pattern (use existing POMs or create new ones)
- Use accessibility-first selectors (getByRole, getByLabel, getByText)
- Add console error monitoring using project utilities
- Include proper assertions and wait conditions
- Follow existing test patterns from `tests/e2e/specs/`

### Step 4: Apply Test Standards
- Follow `playwright-e2e-testing` skill requirements:
  - Page Object Models for reusable selectors
  - Semantic selectors over CSS selectors
  - Console error monitoring (RLS/React/Network)
  - Condition-based waiting (no `waitForTimeout`)
  - Fixtures for authentication
- Ensure tests are:
  - Deterministic (same result every run)
  - Fast (no unnecessary waits)
  - Isolated (independent from other tests)
  - Maintainable (clear intent, good naming)

### Step 5: Output Deliverables
1. **Test File**: Complete TypeScript test file ready for `tests/e2e/specs/`
2. **Page Object Models**: New or updated POMs if needed
3. **Test Coverage Summary**: List of scenarios covered
4. **Console Error Report**: Any issues found during exploration
5. **Recommendations**: Suggestions for additional test coverage

## Example Invocations

### Example 1: New Feature Test
```
User: /test-with-mcp
Claude: What feature would you like to test?
User: The organization hierarchy feature - test creating parent org and adding branches
Claude: Which viewport? (ipad/desktop/debug)
User: ipad

[Claude uses playwright-ipad to explore and generate tests]
```

### Example 2: Edge Case Discovery
```
User: /test-with-mcp
Claude: What feature would you like to test?
User: Contact form - find all edge cases for email validation
Claude: Which viewport? (ipad/desktop/debug)
User: desktop

[Claude explores email validation edge cases and generates test suite]
```

### Example 3: Accessibility Audit
```
User: /test-with-mcp
Claude: What feature would you like to test?
User: Opportunities Kanban board - audit for WCAG 2.1 AA compliance
Claude: Which viewport? (ipad/desktop/debug)
User: ipad

[Claude performs accessibility analysis and generates a11y test suite]
```

## Output Format

### Test File Structure
```typescript
// tests/e2e/specs/{module}/{feature}.spec.ts
import { test, expect } from '@playwright/test';
import { ExistingPOM } from '../../support/poms/ExistingPOM';
import { consoleMonitor } from '../../support/utils/console-monitor';

test.describe('{Feature Name}', () => {
  let pom: ExistingPOM;

  test.beforeEach(async ({ page }) => {
    pom = new ExistingPOM(page);
    await pom.navigate();
    consoleMonitor.startMonitoring(page);
  });

  test.afterEach(async () => {
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test('should {scenario description}', async ({ page }) => {
    // Test steps with clear comments
    // Proper assertions
    // Condition-based waiting
  });
});
```

### Page Object Model Structure (if new POM needed)
```typescript
// tests/e2e/support/poms/{Module}Page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewFeaturePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Getters for elements (semantic selectors)
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit' });
  }

  // Actions
  async fillForm(data: FormData): Promise<void> {
    // Implementation
  }
}
```

## Best Practices

### DO:
✅ Use playwright-ipad for iPad-specific features (default viewport)
✅ Use playwright-desktop for desktop-only features
✅ Use playwright-debug when you need full tracing/video
✅ Reference existing tests for patterns: `tests/e2e/specs/contacts/contacts-crud.spec.ts`
✅ Use existing Page Object Models when available
✅ Monitor console for RLS errors and React warnings
✅ Include edge cases discovered during exploration
✅ Generate deterministic, fast, maintainable tests

### DON'T:
❌ Use MCP for test execution (generate traditional code instead)
❌ Create tests with `waitForTimeout` (use condition-based waiting)
❌ Use CSS selectors when semantic selectors are available
❌ Skip console error monitoring
❌ Generate tests without proper assertions
❌ Forget to check if Page Object Models already exist

## Integration with Existing Tests

### Before Generating
1. Check if similar tests exist in `tests/e2e/specs/`
2. Verify if Page Object Models exist in `tests/e2e/support/poms/`
3. Review existing test patterns to maintain consistency

### After Generating
1. Review generated code for correctness
2. Run test locally to verify it passes: `npm run test:e2e {test-file}`
3. Verify console error monitoring works
4. Check test is deterministic (run multiple times)
5. Commit to Git with descriptive message

## Troubleshooting

### If MCP Exploration Fails
- Verify dev server is running: `npm run dev`
- Check auth state exists: `tests/e2e/.auth/user.json`
- Try playwright-debug for more detailed tracing

### If Generated Test Fails
- Review selectors (may need to be more specific)
- Add explicit waits for dynamic content
- Check console for errors during test run
- Verify test data doesn't conflict with existing data

## Related Documentation
- [Playwright MCP Guide](../../docs/development/playwright-mcp-guide.md) - Complete usage guide
- [Testing Quick Reference](../../docs/development/testing-quick-reference.md) - Test commands
- [Playwright E2E Testing Skill](.claude/skills/playwright-e2e-testing.md) - Testing standards

## Success Criteria

A successful test generation includes:
- ✅ Test file follows project patterns
- ✅ Uses Page Object Models appropriately
- ✅ Includes console error monitoring
- ✅ Uses semantic selectors (accessibility-first)
- ✅ Has proper assertions and wait conditions
- ✅ Passes when run locally
- ✅ Is deterministic and maintainable
- ✅ Covers specified scenarios completely
