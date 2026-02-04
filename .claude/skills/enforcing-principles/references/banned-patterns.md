# Banned Patterns & Anti-Patterns

## 1. NO OVER-ENGINEERING (Most Violated)

**Rule:** No circuit breakers, retry logic, or graceful fallbacks. Fail fast.

**Context:** Pre-launch phase = velocity over resilience. We want **loud failures**, not silent degradation.

### ❌ FORBIDDEN PATTERNS

```typescript
// ❌ Circuit breaker
class CircuitBreaker {
  state: 'OPEN' | 'CLOSED' | 'HALF-OPEN'
}

// ❌ Retry logic with exponential backoff
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    return await operation()
  } catch (error) {
    await sleep(Math.pow(2, i) * 100)
  }
}

// ❌ Graceful fallbacks
try {
  return await fetchData()
} catch {
  return cachedData // Silent degradation
}

// ❌ Health monitoring
if (failureCount > threshold) {
  activateCircuitBreaker()
}
```

### ✅ CORRECT PATTERN

```typescript
// ✅ Let it throw - operator sees error immediately
const data = await supabase.from('contacts').select()
// If 429 error occurs, it throws
// Operator investigates and fixes at source
```

### Why Fail Fast

- Complex error handling = maintenance burden
- No users yet = no one benefits from resilience
- Loud failures = immediate investigation
- Silent degradation = hidden problems

### Common Rationalizations to REJECT

- "This is for production" → We're **pre-launch**, velocity matters more
- "It needs to be resilient" → Resilience = fail loud, not graceful degradation
- "Users will see errors" → **No users yet**, operators need to see errors
- "Industry best practice" → Context matters, pre-launch has different needs

## 2. Multiple Entry Points (BANNED)

**Rule:** Have a single, composable entry point for data access.

### ❌ WRONG - Multiple Competing Entry Points

```typescript
// ❌ Direct API calls bypassing provider
import { contactsApi } from './contactsApi'
await contactsApi.updateContact(id, data)

// ❌ Validation in component
const isValidEmail = (email: string) => /@/.test(email)

// ❌ Which is authoritative? Now two+ definitions can diverge!
```

### ✅ CORRECT - Unified Entry Point

```typescript
// Always use the unified provider
import { dataProvider } from '@/atomic-crm/providers/supabase/unifiedDataProvider'
await dataProvider.update('contacts', { id, data })
// Provider internally delegates to contacts-specific logic

// Validation: Zod at API boundary only
import { contactSchema } from '@/atomic-crm/validation/contacts'
```

## 3. Hardcoded Form Defaults (BANNED)

See `form-defaults.md` for full pattern.

```typescript
// ❌ WRONG
const form = useForm({
  defaultValues: {
    stage: 'new_lead', // Out of sync with schema!
  }
})

// ✅ CORRECT
const schemaDefaults = opportunitySchema.partial().parse({})
```

## 4. Raw HTML Inputs (BANNED)

**Rule:** Always use React Admin components.

```typescript
// ❌ WRONG
<input type="text" />
<select>...</select>

// ✅ CORRECT
import { TextInput, SelectInput } from 'react-admin'
<TextInput source="name" />
<SelectInput source="status" />
```

## 5. Hardcoded Colors (BANNED)

**Rule:** Semantic CSS variables only.

```typescript
// ❌ WRONG
<div className="bg-[#E11D48]">Error</div>
<div className="text-red-500">Warning</div>

// ✅ CORRECT
<div className="bg-destructive">Error</div>
<div className="text-destructive">Warning</div>
```

> Full color rules: `.claude/rules/UI_STANDARDS.md`

## 6. Manual Migration Numbering (BANNED)

**Rule:** Use Supabase CLI to generate correctly timestamped migrations.

```bash
# ✅ Correct
npx supabase migration new add_contact_tags
# Generates: 20250126143000_add_contact_tags.sql

# ❌ Don't manually create
# 001_add_contact_tags.sql
```

## 7. Tailwind v4 Anti-Patterns

### ❌ @apply Self-Reference (BANNED)

```css
@layer utilities {
  .touch-target-44 { /* ... */ }
  .data-cell {
    @apply touch-target-44; /* ERROR: Cannot resolve */
  }
}
```

### ✅ Inline the Styles

```css
@layer utilities {
  .data-cell {
    position: relative;
    /* Inline the touch-target styles directly */
  }
}
```

## Common Mistakes Summary

| Mistake | Fix |
|---------|-----|
| "Add retry logic for production" | NO. Fail fast. Pre-launch = velocity over resilience. |
| "Circuit breaker for resilience" | NO. Let errors throw. Investigate and fix at source. |
| Validation in component/utils | Move to Zod schema in `src/atomic-crm/validation/` |
| Hardcoded form defaults | Use `zodSchema.partial().parse({})` |
| `type` for object shapes | Use `interface` for objects |
| Raw `<input>` elements | Use React Admin's `<TextInput>` |
| Leaving unused imports | Fix when editing file (Boy Scout Rule) |
| Hardcoded hex colors | Use semantic classes (`text-destructive`) |

## Red Flags - STOP and Review

If you find yourself:
- Writing retry logic → Delete it, let errors throw
- Adding circuit breaker → Delete it, fail fast
- Creating "resilient" error handling → Pre-launch doesn't need it
- Validating outside Zod schemas → Move to API boundary
- Hardcoding form defaults → Use schema.partial().parse({})
- Using `<input>` directly → Use React Admin components
- Ignoring nearby issues → Fix them (Boy Scout Rule)

**All of these mean:** Review Engineering Constitution before proceeding.

## Cross-References

- Full constitution: `resources/error-handling.md`, `resources/validation.md`
- Form patterns: `form-defaults.md`
- Type safety: `type-safety.md`
- Zod security: `zod-patterns.md`
