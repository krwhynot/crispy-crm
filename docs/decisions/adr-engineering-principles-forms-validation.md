# ADR: Engineering Principles Update for Forms & Validation

**Status:** Proposed
**Date:** 2024-12-03
**Context:** Audit of current engineering principles against industry best practices for React Hook Form + Zod + @hookform/resolvers stack.

---

## Summary

After auditing current engineering principles against official documentation and OWASP standards, **most principles are already well-aligned**. This ADR recommends **5 additions** and **2 clarifications** to close gaps identified during the review.

---

## Current State Analysis

### What's Already Excellent ✅

| Principle | Implementation | Best Practice Alignment |
|-----------|---------------|------------------------|
| Zod at API boundary only | `unifiedDataProvider.ts` calls validation | ✅ Single validation point |
| Form state from schema | `zodSchema.partial().parse({})` | ✅ Official React Hook Form pattern |
| Allowlist validation | `z.enum()` for stage, priority, win/loss reasons | ✅ OWASP Input Validation |
| Date coercion | `z.coerce.date()` in opportunities.ts | ✅ Form input handling |
| Cross-field validation | `superRefine` for win/loss reasons | ✅ Zod best practice |
| HTML sanitization | `sanitizeHtml()` for description/notes | ✅ XSS prevention |
| Type inference | `z.infer<typeof schema>` | ✅ Single source of truth |

### Gaps Identified ⚠️

| Gap | Risk Level | Current State | Recommendation |
|-----|------------|---------------|----------------|
| Missing string length limits | Medium | No max on name, title, notes | Add `.max()` to all strings |
| No strict object enforcement | Low | `z.object()` allows unknown keys | Use `z.strictObject()` at API boundary |
| Accessibility not documented | Medium | Implemented but not codified | Add A11y requirements to principles |
| Coercion not documented | Low | Used but not required | Document coercion requirement |
| Form mode not specified | Low | Using onSubmit (default) | Document recommended modes |

---

## Recommended Principle Updates

### 1. ADD: String Length Limits (Security)

**Rationale:** OWASP requires input length limits to prevent DoS attacks and buffer-related issues.

```markdown
### String Length Limits (Security)
All string fields MUST have explicit `.max()` constraints:
- Names: 100 characters
- Titles/labels: 200 characters
- Descriptions/notes: 2000 characters
- URLs: 2048 characters (browser limit)

Exception: Only omit for fields with inherent limits (e.g., UUIDs, enums).
```

**Example fix needed:**
```typescript
// ❌ CURRENT (contacts.ts:92)
name: z.string().optional()

// ✅ RECOMMENDED
name: z.string().max(100).optional()
```

---

### 2. ADD: Strict Object Schemas at API Boundary (Security)

**Rationale:** OWASP recommends rejecting unknown keys to prevent mass assignment attacks.

```markdown
### Strict Object Schemas
Use `z.strictObject()` for:
- Create/Update schemas that touch the database
- Any schema validating external input (API, CSV imports)

Use `z.object()` only for:
- Internal form state (partial updates)
- Base schemas used for composition
```

**Example:**
```typescript
// ✅ API boundary schema
export const createContactSchema = z.strictObject({
  name: z.string().max(100),
  email: z.string().email(),
  // Unknown keys rejected
});

// ✅ Internal composition
const contactBaseSchema = z.object({
  // Can extend/compose
});
```

---

### 3. ADD: Accessibility (A11y) Requirements

**Rationale:** React Hook Form docs explicitly cover A11y; should be codified in principles.

```markdown
### Form Accessibility (A11y)
All form inputs MUST include:
- `aria-invalid={!!errors.fieldName}` - Announce invalid state
- `aria-describedby` linking to error element ID
- Error messages with `role="alert"` - Screen reader announcement

Standard pattern:
```tsx
<input
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
  {...register('email')}
/>
{errors.email && (
  <span id="email-error" role="alert">{errors.email.message}</span>
)}
```
```

---

### 4. ADD: Form Input Coercion Requirement

**Rationale:** HTML form inputs always return strings; coercion is required for type safety.

```markdown
### Form Input Coercion
All non-string form fields MUST use `z.coerce`:
- Numbers: `z.coerce.number()`
- Dates: `z.coerce.date()`
- Booleans: `z.coerce.boolean()`

Rationale: HTML inputs return strings. Without coercion, `z.number().parse("42")` fails.
```

---

### 5. ADD: Validation Mode Guidance

**Rationale:** React Hook Form mode selection impacts performance significantly.

```markdown
### Form Validation Mode
Default: `mode: 'onSubmit'` (best performance)
Alternative: `mode: 'onBlur'` (field-by-field UX)

NEVER use `mode: 'onChange'` except for:
- Real-time search fields
- Character counters

Rationale: onChange triggers validation on every keystroke, causing excessive re-renders.
```

---

### 6. CLARIFY: Form State Derivation

**Current:**
> Form state: `zodSchema.partial().parse({})`

**Proposed clarification:**
```markdown
### Form Default Values
Derive form defaults from Zod schema:
```typescript
const defaults = zodSchema.partial().parse({});
// Use in useForm:
useForm({ defaultValues: defaults });
```

For fields with business logic defaults (e.g., estimated_close_date = 30 days):
```typescript
const schema = z.object({
  estimated_close_date: z.coerce.date().default(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }),
});
```
```

---

### 7. CLARIFY: Re-render Isolation

**Add to performance section:**
```markdown
### Form Re-render Isolation
Use `useWatch` for subscriptions (isolates re-renders):
```typescript
// ✅ CORRECT - Only this component re-renders
const price = useWatch({ control, name: 'price' });

// ❌ WRONG - Entire form tree re-renders
const values = watch();
```
```

---

## Proposed CLAUDE.md Updates

### Add to "Engineering Principles" Section:

```markdown
### Zod Validation (Details)
- **Boundary:** Validation at API boundary only (unifiedDataProvider)
- **Coercion:** Use `z.coerce` for all non-string form inputs
- **Length Limits:** All strings must have `.max()` constraint
- **Strict Objects:** Use `z.strictObject()` at API boundary
- **Allowlist:** Use `z.enum()` for constrained values (never denylist)

### Form State
- **Defaults:** `zodSchema.partial().parse({})`
- **Mode:** `onSubmit` (default) or `onBlur` — never `onChange`
- **Watching:** `useWatch` for subscriptions (not `watch()`)

### Accessibility (A11y)
- `aria-invalid` on invalid inputs
- `aria-describedby` linking errors
- `role="alert"` on error messages
```

---

## Implementation Priority

| Update | Priority | Effort | Risk if Ignored |
|--------|----------|--------|-----------------|
| String length limits | **P1** | Medium | DoS vulnerability |
| Strict object schemas | P2 | Low | Mass assignment risk |
| A11y documentation | P2 | Low | Accessibility failures |
| Coercion documentation | P3 | Trivial | None (already implemented) |
| Form mode documentation | P3 | Trivial | Performance issues |

---

## Files Requiring Updates

If P1 (string length limits) is approved:

| File | Fields Needing `.max()` |
|------|------------------------|
| `contacts.ts` | name, first_name, last_name, title, department, notes |
| `opportunities.ts` | name (already limited), campaign (already limited) |
| `organizations.ts` | name, address, city, state, country |
| `notes.ts` | content, title |
| `tasks.ts` | title, description |
| `tags.ts` | name |

---

## Decision

**Options:**
1. **Accept all recommendations** - Full alignment with industry standards
2. **Accept P1-P2 only** - Security-focused updates, documentation later
3. **Document only** - Update CLAUDE.md without code changes
4. **Defer** - Current implementation is acceptable for pre-launch

**Recommendation:** Option 2 (Accept P1-P2) — Security updates are critical; documentation can follow.

---

## References

- [React Hook Form Best Practices](https://react-hook-form.com/docs)
- [Zod Documentation](https://zod.dev)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [forms-validation-best-practices.md](./forms-validation-best-practices.md) - Full research document
