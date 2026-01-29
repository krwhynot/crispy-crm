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
RIGHT:

TypeScript
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
Type Safety Baseline
Baseline: 163 uses of : any (pre-hardening) 90-Day Goal: 0 uses of : any in production code 30-Day Milestone: <50 uses Current Status: grep -r ": any" src/ --exclude-dir=tests | wc -l

Banned Patterns
DO NOT:

: any - Disables all type checking

as any - Bypasses type safety completely

as unknown as T - Signals broken types (fix root cause)

any[] - Untyped arrays

Type Safety Checklist
[ ] No : any types (use generic constraints, unknown with guards)

[ ] No as any casts (use type guards)

[ ] No as unknown as T (fix type mismatch at source)

[ ] API boundaries use Zod schemas with z.infer

[ ] Test mocks use typed factories from src/tests/utils/typed-mocks.ts

Form Standards (React Admin)
Enforces strict type safety in form implementations to prevent as any casting and Type Variance errors.

Resolver Pattern
DO:

Use the Adapter: import { createFormResolver } from "@/lib/zodErrorFormatting"

Wrap Schemas: resolver={createFormResolver(mySchema)}

DON'T:

Direct Usage: resolver={zodResolver(mySchema)} (Causes generic type mismatch)

Type Casting: resolver={zodResolver(mySchema) as any} (Violates Type Safety rules)

Storage Hygiene
Ensures file uploads and bucket interactions are secure and performant.

DO:

Centralized Config: Define max file sizes and allowed types in src/config/storage.ts.

Sanitization: Sanitize filenames before upload (remove special chars, spaces) to prevent URL encoding issues.

Error Codes: Handle specific storage errors (e.g., "Quota Exceeded") explicitly, do not just catch (e).

DON'T:

Hardcoded Buckets: Never use string literals like "avatars" in components. Use constants (STORAGE_BUCKETS.AVATARS).

Magic Numbers: No if (file.size > 5000000). Use MAX_FILE_SIZE_BYTES.

Accessibility Requirements
Baseline: 743 ARIA attributes (good foundation) Standards: WCAG 2.1 AA compliance Touch Targets: ≥ 44px (Tailwind h-11, w-11)

Required Patterns
DO:

aria-invalid="true" on error fields

aria-describedby linking to error messages

role="alert" on error containers

Focus management (modals, slide-overs)

Semantic colors (no hardcoded hex)

Minimum touch target size

WRONG:

TypeScript
// Missing ARIA, hardcoded color, small target
<input className="border-[#E11D48]" />
<div className="text-red-500">Error occurred</div>
<button className="h-8 w-8">X</button>
RIGHT:

TypeScript
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
Pre-Commit Verification
Run BEFORE committing to catch quality regressions early.

Quick Check Commands
Bash
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

# 4. Form Resolver Violations (expect: 0)
grep -r "zodResolver" src/ --exclude="zodErrorFormatting.ts"

# 5. Linting (expect: clean)
npm run lint