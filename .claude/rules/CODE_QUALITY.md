# Code Quality Standards

Enforces production cleanliness, type safety, and accessibility baselines.

## Production Noise Prevention

**Baseline:** 83 console statements (pre-cleanup)
**Target:** 0 console statements in production code
**Current Status:** Track with `grep -r "console\." src/ --exclude-dir=tests --exclude="*.test.ts" --exclude="*.test.tsx" | wc -l`

### Banned Patterns

DO NOT:
- `console.log()` - Debug artifacts left in production
- `console.error()` - Bypasses error tracking systems
- `console.warn()` - No structured logging
- `console.info()` - Not integrated with observability
- `console.debug()` - Use proper debug logger

### Allowed Exceptions

- **Test files:** `*.test.ts`, `*.test.tsx`, `__tests__/` directories
- **Logging infrastructure:** `logger.ts`, `devLogger.ts`
- **Build scripts:** `scripts/`, `*.config.ts`

### Replacement Patterns

WRONG:
```typescript
// Production noise - no context, not tracked, clutters console
console.log('User logged in:', userId);
console.error('Failed to fetch contacts:', error);
console.warn('Deprecated field used:', fieldName);
```

RIGHT:
```typescript
// Structured logging with context
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId, timestamp: Date.now() });
logger.error('Failed to fetch contacts', {
  error: error instanceof Error ? error.message : String(error),
  operation: 'getList',
  resource: 'contacts'
});
logger.warn('Deprecated field used', {
  fieldName,
  migration: 'Use new_field instead'
});
```

### Verification Command

```bash
# Check for console statements in production code
grep -r "console\." src/ \
  --exclude-dir=tests \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="logger.ts" \
  --exclude="devLogger.ts" \
  | grep -v "// ALLOWED:"
```

**Expected Output:** Empty (zero matches)

## Type Safety Baseline

**Baseline:** 163 uses of `: any` (pre-hardening)
**90-Day Goal:** 0 uses of `: any` in production code
**30-Day Milestone:** <50 uses
**Current Status:** `grep -r ": any" src/ --exclude-dir=tests | wc -l`

### Banned Patterns

DO NOT:
- `: any` - Disables all type checking
- `as any` - Bypasses type safety completely
- `as unknown as T` - Signals broken types (fix root cause)
- `any[]` - Untyped arrays

### Preferred Alternatives

WRONG:
```typescript
// Type safety disabled - bugs hide until production
function processData(data: any) {
  return data.map((item: any) => item.value);
}

// Double cast - types are incompatible
const result = resourceExtractors.organizations(org as unknown as Organization);

// Untyped array
const items: any[] = fetchItems();
```

RIGHT:
```typescript
// Type guard for runtime narrowing
import type { Contact } from '@/atomic-crm/validation/contact';

function isContact(data: unknown): data is Contact {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'first_name' in data
  );
}

function processData(data: unknown) {
  if (!Array.isArray(data)) {
    throw new Error('Expected array');
  }
  return data
    .filter(isContact)
    .map(item => item.first_name);
}

// Generic constraint
function extractOrganizations<T extends RaRecord>(records: T[]): Organization[] {
  return records.filter((r): r is Organization => 'name' in r);
}

// Zod inference for API boundaries
import { contactSchema } from '@/atomic-crm/validation/contact';
type Contact = z.infer<typeof contactSchema>;

// Unknown with explicit narrowing
function handleError(error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', { message: error.message });
  } else {
    logger.error('Unknown error', { error: String(error) });
  }
}
```

### Type Safety Checklist

- [ ] No `: any` types (use generic constraints, unknown with guards)
- [ ] No `as any` casts (use type guards)
- [ ] No `as unknown as T` (fix type mismatch at source)
- [ ] API boundaries use Zod schemas with `z.infer`
- [ ] Test mocks use typed factories from `src/tests/utils/typed-mocks.ts`

### Verification Command

```bash
# Count remaining any types
grep -r ": any" src/ --exclude-dir=tests | wc -l

# List files with any types (for cleanup)
grep -r ": any" src/ --exclude-dir=tests -l
```

**90-Day Target:** 0 matches

## Accessibility Requirements

**Baseline:** 743 ARIA attributes (good foundation)
**Standards:** WCAG 2.1 AA compliance
**Touch Targets:** ≥ 44px (Tailwind `h-11`, `w-11`)

### Required Patterns

DO:
- `aria-invalid="true"` on error fields
- `aria-describedby` linking to error messages
- `role="alert"` on error containers
- Focus management (modals, slide-overs)
- Semantic colors (no hardcoded hex)
- Minimum touch target size

WRONG:
```tsx
// Missing ARIA, hardcoded color, small target
<input className="border-[#E11D48]" />
<div className="text-red-500">Error occurred</div>
<button className="h-8 w-8">X</button>
```

RIGHT:
```tsx
// ARIA attributes, semantic colors, proper sizing
<input
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
  className="border-destructive"
/>
{error && (
  <div id="email-error" role="alert" className="text-destructive">
    {error.message}
  </div>
)}
<button className="h-11 w-11 focus-visible:ring-2">
  <X className="h-4 w-4" />
</button>
```

### Verification Commands

```bash
# Count ARIA attributes (should not decrease)
grep -r "aria-" src/ | wc -l

# Check for hardcoded colors (should be zero)
grep -r "text-red-\|bg-blue-\|#[0-9a-fA-F]\{6\}" src/ \
  --exclude-dir=tests \
  --exclude="*.css"

# Find small touch targets (should be zero)
grep -r "h-[1-9] \|w-[1-9] \|h-10\|w-10" src/components/ \
  | grep -v "h-11\|w-11\|h-12\|w-12"
```
## Storage Hygiene

DO:
- **Centralized Config:** Define max file sizes and allowed types in `src/config/storage.ts`.
- **Sanitization:** Sanitize filenames before upload (remove special chars, spaces) to prevent URL encoding issues.
- **Error Codes:** Handle specific storage errors (e.g., "Quota Exceeded") explicitly, do not just `catch (e)`.

DON'T:
- **Hardcoded Buckets:** Never use string literals like `"avatars"` in components. Use constants (`STORAGE_BUCKETS.AVATARS`).
- **Magic Numbers:** No `if (file.size > 5000000)`. Use `MAX_FILE_SIZE_BYTES`.


### Accessibility Checklist

- [ ] Form inputs have `aria-invalid`, `aria-describedby`
- [ ] Error messages use `role="alert"`
- [ ] Interactive elements ≥ `h-11 w-11`
- [ ] Focus states use `focus-visible:ring-2`
- [ ] Semantic colors only (`text-destructive`, not `text-red-500`)
- [ ] No hex codes in component className

## Pre-Commit Verification

Run BEFORE committing to catch quality regressions early.

### Quick Check Commands

```bash
# 1. Console statements (expect: 0)
grep -r "console\." src/ \
  --exclude-dir=tests \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="logger.ts" \
  --exclude="devLogger.ts" \
  | wc -l

# 2. Any types (target: <50, goal: 0)
grep -r ": any" src/ --exclude-dir=tests | wc -l

# 3. TypeScript errors (expect: 0 errors)
npx tsc --noEmit

# 4. Hardcoded colors (expect: 0)
grep -r "text-red-\|bg-blue-\|#[0-9a-fA-F]\{6\}" src/ \
  --exclude-dir=tests \
  --exclude="*.css" \
  | wc -l

# 5. Linting (expect: clean)
npm run lint
```

### Expected Results

| Check | Target | Command |
|-------|--------|---------|
| Console logs | 0 | `grep console` |
| Any types | <50 → 0 | `grep ": any"` |
| TypeScript | 0 errors | `npx tsc --noEmit` |
| Hardcoded colors | 0 | `grep text-red-` |
| Lint warnings | 0 | `npm run lint` |

## Enforcement

### Manual Verification (Required)

DO NOT commit without running pre-commit checks. See `/verification-before-completion` skill.

### PR Review Checklist

Reviewers MUST verify:

- [ ] No new console statements in production code
- [ ] No new `: any` types introduced
- [ ] TypeScript compiles without errors
- [ ] No hardcoded colors (semantic Tailwind only)
- [ ] ARIA attributes present on form inputs
- [ ] Touch targets ≥ 44px

### Automated Enforcement (Future)

Planned additions:
- Pre-commit hook running verification commands
- CI pipeline blocking PRs with quality regressions
- ESLint rules for `console.*` and `: any`

## Rationale

### Why Ban Console Logs?

1. **Production Noise:** Clutters browser console for users
2. **No Tracking:** Errors don't reach Sentry or observability tools
3. **No Context:** Missing structured fields (userId, operation, timestamp)
4. **Security Risk:** May log sensitive data (tokens, passwords)

### Why Ban Any Types?

1. **Silent Bugs:** TypeScript can't catch errors at compile time
2. **Refactor Risk:** Breaking changes go undetected
3. **IDE Experience:** No autocomplete, no type hints
4. **False Security:** Tests pass but production fails

### Why Enforce Accessibility?

1. **Legal Compliance:** WCAG 2.1 AA required for government/enterprise
2. **User Experience:** iPad users need 44px targets (finger size)
3. **Error Clarity:** Screen readers need `role="alert"` and `aria-describedby`
4. **Inclusive Design:** 15% of users have accessibility needs

## Related Rules

- **Type Safety:** See `DOMAIN_INTEGRITY.md` for Zod patterns
- **Error Handling:** See `PROVIDER_RULES.md` for structured logging
- **Accessibility:** See `UI_STANDARDS.md` for semantic colors
- **Verification:** Use `/verification-before-completion` skill before claiming done
