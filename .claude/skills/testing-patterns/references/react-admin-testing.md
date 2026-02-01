# React Admin Component Testing

Detailed patterns for testing React Admin components in Crispy CRM. Covers renderWithAdminContext, form submission testing, error states, accessibility testing, and E2E approaches.

## renderWithAdminContext

**Always use `renderWithAdminContext` for React Admin components:**

```typescript
import { renderWithAdminContext } from '@/tests/utils/render-admin';

// CORRECT: Uses admin context
renderWithAdminContext(<ContactList />);

// WRONG: Missing context
render(<ContactList />); // Will fail - no DataProvider
```

**The helper provides:**
- `DataProvider` (mocked Supabase)
- `AuthProvider` (mock user)
- `QueryClient` (React Query)
- Router context

## Testing Form Submission

```typescript
it('submits form with valid data', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  renderWithAdminContext(
    <ContactCreate onSubmit={onSubmit} />
  );

  await user.type(screen.getByLabelText(/first name/i), 'John');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        email: 'john@example.com',
      })
    );
  });
});
```

## Testing Error States

```typescript
it('displays validation errors', async () => {
  const user = userEvent.setup();

  renderWithAdminContext(<ContactCreate />);

  // Submit without required fields
  await user.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i);
  });
});
```

## Testing Accessibility

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = renderWithAdminContext(<ContactList />);

  await waitFor(async () => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## E2E Testing with Playwright

### Test Structure

```typescript
// tests/e2e/contacts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
  });

  test('creates a new contact', async ({ page }) => {
    await page.click('text=Create');
    await page.fill('[name="first_name"]', 'Jane');
    await page.fill('[name="email"]', 'jane@example.com');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Jane')).toBeVisible();
  });

  test('filters contacts by name', async ({ page }) => {
    await page.fill('[placeholder="Search"]', 'John');

    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
});
```

### Page Object Pattern

```typescript
// tests/e2e/pages/ContactsPage.ts
import { Page } from '@playwright/test';

export class ContactsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/contacts');
  }

  async createContact(data: { firstName: string; email: string }) {
    await this.page.click('text=Create');
    await this.page.fill('[name="first_name"]', data.firstName);
    await this.page.fill('[name="email"]', data.email);
    await this.page.click('button:has-text("Save")');
  }

  async searchByName(name: string) {
    await this.page.fill('[placeholder="Search"]', name);
  }
}

// Usage in test
test('creates contact', async ({ page }) => {
  const contactsPage = new ContactsPage(page);
  await contactsPage.goto();
  await contactsPage.createContact({
    firstName: 'Jane',
    email: 'jane@example.com'
  });
});
```

## Manual E2E Testing with Claude Chrome

For browser-based manual testing using Claude Chrome, prompts are written as markdown documentation, copied by users into Claude Chrome, and executed via browser automation.

**Architecture:** Claude Code (WSL2) -> User copies prompt -> Claude Chrome (browser)

### When to Use Manual E2E

| Use Manual E2E | Use Playwright |
|----------------|----------------|
| Visual/UI verification | CI/CD regression testing |
| Production smoke tests (read-only) | Automated assertions |
| Exploratory testing | Repeatable test suites |
| Complex workflows needing judgment | Simple CRUD operations |

### Key Practices

1. **Be explicit** - Use exact button text, labels, URLs
2. **VERIFY checkpoints** - Every action needs explicit verification
3. **Console monitoring** - Include DevTools watching instructions
4. **Structured reporting** - Use test IDs (WG-001, SS-002) for traceability
5. **Copy-paste friendly** - Self-contained, no external references

### When Claude Chrome E2E is Triggered

For UI changes, verification-before-completion will prompt:
> Would you like me to generate a Claude Chrome test prompt?

See `.claude/skills/testing-patterns/resources/MANUAL_E2E_CLAUDE_CHROME.md` for prompt writing guide.

### Resources

- **Full guide:** [MANUAL_E2E_CLAUDE_CHROME.md](./MANUAL_E2E_CLAUDE_CHROME.md)
- **Test checklists:** `docs/tests/e2e/`
- **Examples:** `docs/tests/e2e/claude-code-e2e-prompt.md`

## Database Testing with pgTAP

### Test Structure

```sql
-- supabase/tests/contacts_test.sql
BEGIN;

SELECT plan(3);

-- Test RLS policies
SELECT ok(
  (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL) >= 0,
  'Can read active contacts'
);

-- Test soft delete
UPDATE contacts SET deleted_at = NOW() WHERE id = 'test-id';
SELECT is(
  (SELECT COUNT(*) FROM contacts_summary WHERE id = 'test-id'),
  0::bigint,
  'Soft-deleted contacts excluded from summary view'
);

-- Test constraints
SELECT throws_ok(
  $$INSERT INTO contacts (email) VALUES ('invalid-email')$$,
  '23514', -- check_violation
  'Email format constraint enforced'
);

SELECT * FROM finish();
ROLLBACK;
```
