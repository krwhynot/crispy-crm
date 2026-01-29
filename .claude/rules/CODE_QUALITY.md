# Code Quality Standards

Enforces production cleanliness, type safety, and accessibility baselines.

## Production Noise Prevention

**Baseline:** 0 in production code (Verified Jan 2026)
**Target:** Maintain 0 console statements in production code
**Current Status:** Track with `grep -rn "console\.(log|warn|error|info|debug)(" src/ --include="*.ts" --include="*.tsx" --exclude-dir=tests --exclude="*.test.ts" --exclude="*.test.tsx" --exclude="logger.ts" --exclude="devLogger.ts" | wc -l`

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
- **Documentation:** `*.md`, JSDoc comments (not executable)

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

## Type Safety Baseline

**Baseline:** 0 uses of `: any` across ALL code (Cleaned Jan 2026) ✅
**Target:** 0 (Strict Enforcement — Zero Tolerance)
**Current Status:**
```bash
# Verify zero any (expect: 0)
rg ": any|as any|any\[\]|Promise<any>" src/ --type ts -c \
  | grep -v "typed-test-helpers" \
  | awk -F: '{sum += $NF} END {print sum+0, "any instances"}'
```

### Banned Patterns (ALL code — production AND tests)

DO NOT:
- `: any` - Disables all type checking. Use `unknown`, `Record<string, unknown>`, or `Partial<T>`
- `as any` - Bypasses type safety completely. Use type guards or typed factories
- `as unknown as T` - Signals broken types (fix root cause). Exception: with a runtime type guard (see `segmentsHandler.ts`) or `// Type: partial mock` in tests
- `any[]` - Untyped arrays. Use `unknown[]` or `Array<T>`
- `Promise<any>` - Use `Promise<unknown>` or `Promise<T>`

### Type-Safe Alternatives

| Instead of | Use |
|------------|-----|
| `(props: any)` | Inline type: `({ children }: { children: React.ReactNode })` |
| `{...} as any` (RA hook mock) | Typed factory: `mockUseGetListReturn<T>()` from `src/tests/utils/typed-mocks.ts` |
| `(param: any)` in mock | `Record<string, unknown>` or specific interface |
| `(item: any)` in callback | Infer type from context or define local interface |
| `let error: any` | `let error: unknown` with type narrowing |

### Type Safety Checklist

- [x] No `: any` types in production (use generic constraints, unknown with guards)
- [x] No `as any` casts in production (use type guards)
- [x] `as unknown as T` only with runtime guards (`segmentsHandler.ts` pattern)
- [x] API boundaries use Zod schemas with `z.infer`
- [x] Test mocks use typed factories from `src/tests/utils/typed-mocks.ts`
- [x] Zero `any` in test files (cleaned Jan 2026)

## Form Standards (React Admin)

Enforces strict type safety in form implementations to prevent `as any` casting and Type Variance errors.

### Resolver Pattern

DO:
- Use the Adapter: `import { createFormResolver } from "@/lib/zodErrorFormatting"`
- Wrap Schemas: `resolver={createFormResolver(mySchema)}`

DON'T:
- Direct Usage: `resolver={zodResolver(mySchema)}` (Causes generic type mismatch)
- Type Casting: `resolver={zodResolver(mySchema) as any}` (Violates Type Safety rules)

## Storage Hygiene

Ensures file uploads and bucket interactions are secure and performant.

DO:
- **Centralized Config:** Define max file sizes and allowed types in `src/config/storage.ts`.
- **Sanitization:** Sanitize filenames before upload (remove special chars, spaces) to prevent URL encoding issues.
- **Error Codes:** Handle specific storage errors (e.g., "Quota Exceeded") explicitly, do not just `catch (e)`.

DON'T:
- **Hardcoded Buckets:** Never use string literals like `"avatars"` in components. Use constants (`STORAGE_BUCKETS.AVATARS`).
- **Magic Numbers:** No `if (file.size > 5000000)`. Use `MAX_FILE_SIZE_BYTES`.

## Accessibility Requirements

**Baseline:** 743 ARIA attributes (good foundation)
**Standards:** WCAG 2.1 AA compliance
**Touch Targets:** >= 44px (Tailwind `h-11`, `w-11`)

### Required Patterns

DO:
- `aria-invalid="true"` on error fields
- `aria-describedby` linking to error messages
- `role="alert"` on error containers
- Focus management (modals, slide-overs)
- Semantic colors (no hardcoded hex)
- Minimum touch target size

WRONG:
```typescript
// Missing ARIA, hardcoded color, small target
<input className="border-[#E11D48]" />
<div className="text-red-500">Error occurred</div>
<button className="h-8 w-8">X</button>
```

RIGHT:
```typescript
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

## Pre-Commit Verification

Run BEFORE committing to catch quality regressions early.

### Quick Check Commands

```bash
# 1. Console statements (expect: 0)
grep -rn "console\.(log|warn|error|info|debug)(" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=tests \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="logger.ts" \
  --exclude="devLogger.ts" \
  | wc -l

# 2. Any types — ZERO TOLERANCE (expect: 0 across ALL code)
rg ": any|as any|any\[\]|Promise<any>" src/ --type ts -c \
  | grep -v "typed-test-helpers" \
  | awk -F: '{sum += $NF} END {print sum+0, "any instances (expect: 0)"}'

# 3. TypeScript errors (expect: 0 errors)
npx tsc --noEmit

# 4. Form Resolver Violations (expect: 0)
grep -r "zodResolver" src/ --exclude="zodErrorFormatting.ts"

# 5. Linting (expect: clean)
npm run lint
```
