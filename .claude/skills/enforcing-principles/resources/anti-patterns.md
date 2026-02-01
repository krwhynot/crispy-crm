# Anti-Patterns

## Engineering: Over-Engineering

Adding retry logic, circuit breakers, or graceful fallbacks during pre-launch.

**WRONG:** 100+ line CircuitBreaker class with state management.
**RIGHT:** `if (error) throw error;` -- 2 lines, loud failure, immediate investigation.

## Engineering: Promise.all() for Bulk Mutations

`Promise.all()` fails completely if one operation fails, wasting all successes.

**WRONG:** `await Promise.all(ids.map(id => update(...)))` -- 1 failure = all 100 fail.
**RIGHT:** `await Promise.allSettled(ids.map(id => update(...)))` -- preserves partial success.

**Exception:** `Promise.all()` IS correct for parallel reads where all results are required.

## Validation: Multiple Sources

Validating in components AND utils AND Zod schemas creates drift.

**WRONG:**
```typescript
// Three competing definitions that will drift
const validateEmail = (email: string) => !email.includes('@') ? "Invalid" : undefined;
function isValidContact(data) { return data.email?.includes('@'); }
const schema = z.object({ email: z.string().email() });
```

**RIGHT:** One Zod schema at API boundary. Components use no validation. Utils call `schema.safeParse()`.

## Validation: Hardcoded Form Defaults

Duplicating defaults in components instead of deriving from schema.

**WRONG:** `const formDefaults = { stage: 'new_lead', priority: 'medium' };`
**RIGHT:** `const formDefaults = { ...schema.partial().parse({}), owner_id: identity?.id };`

## Validation: Skipping CSV Validation

No file size limit (DoS), no format check (accepts .exe), no formula sanitization (Excel injection).

**RIGHT:** validateCsvFile() + sanitizeCsvValue() + Zod validation at API boundary.

## Database: RLS Without GRANT

Creating RLS policies but forgetting GRANT = "permission denied for table".

**RIGHT:** Always add BOTH:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;
-- THEN create RLS policies
```

## Database: Removing Enum Values

PostgreSQL does not support removing enum values.

**RIGHT:** Deprecate with comments and update data, or create new enum type and migrate.

## Database: Skipping Verification

No DO block at end of migration = no confirmation it worked.

**RIGHT:** Add verification DO block checking pg_type, information_schema.columns, pg_policies.

## Testing: Implementation Details

Testing private methods, internal state, or HOW instead of WHAT.

**WRONG:** `expect(spy).toHaveBeenCalled()` -- tests implementation.
**RIGHT:** `expect(calculator.getTotal([1,2,3])).toBe(6)` -- tests behavior.

## Testing: Missing Error Context

`console.error(error)` with no context makes debugging impossible.

**RIGHT:** Log method, resource, params, timestamp, error message, and stack trace.

## Testing: Missing renderWithAdminContext

React Admin components need context. `render(<ContactForm />)` fails with cryptic errors.

**RIGHT:** `renderWithAdminContext(<ContactForm />)` provides all required RA context.

## Testing: CSS Selectors in E2E

`await page.click('.submit-btn')` breaks on CSS refactors.

**RIGHT:** `await page.getByRole('button', { name: 'Save' }).click()` -- semantic, accessible, resilient.

## Pre-Commit Checklist

- [ ] No retry logic or circuit breakers
- [ ] No Promise.all() for bulk mutations
- [ ] No validation outside Zod schemas
- [ ] No hardcoded form defaults
- [ ] No defaultValue props on inputs
- [ ] No RLS policies without GRANT
- [ ] No enum value removals
- [ ] No migrations without verification
- [ ] No testing implementation details
- [ ] No errors without logging context
- [ ] No renderWithAdminContext missing
- [ ] No CSS selectors in E2E tests
