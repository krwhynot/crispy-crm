# ADR: Date Coercion and Type Boundaries in Forms

> **Status:** Accepted
> **Date:** 2024-12-03
> **Context:** Form validation with Zod + React Hook Form

---

## Problem Statement

A critical documentation gap exists in form validation best practices regarding **type boundaries between Zod schemas and HTML form inputs**.

### The Bug Pattern

```typescript
// Schema definition (common pattern from documentation)
const formSchema = z.object({
  birthDate: z.coerce.date(),  // Returns JavaScript Date object
});

// Form defaults using schema
const defaults = formSchema.partial().parse({});
// Result: { birthDate: undefined } → but when coerced: Date object!

// HTML input expects string
<input type="date" value={field.value} />
// If field.value is a Date → renders as "[object Object]" or crashes

// UI component calling string methods
field.value.slice(0, 10);  // 💥 TypeError: slice is not a function (on Date)
```

### Root Cause

| Layer | Expects | Produces |
|-------|---------|----------|
| HTML `<input type="date">` | `YYYY-MM-DD` string | `YYYY-MM-DD` string |
| `z.coerce.date()` | string/number input | `Date` object output |
| Form defaults via `schema.parse({})` | — | Whatever schema produces |
| API responses | Usually ISO strings | Strings |

**The mismatch:** `z.coerce.date()` handles INPUT coercion (string → Date) but provides no OUTPUT formatting (Date → string for HTML).

---

## Industry Standards & Best Practices

### 1. Zod 4: Use `z.iso.date()` for Form Fields (Recommended)

> **Source:** [Zod API Documentation - ISO Dates](https://zod.dev/api#iso-dates)

Zod 4 provides `z.iso.date()` which validates `YYYY-MM-DD` format **without converting to Date**:

```typescript
import { z } from 'zod';

// ✅ RECOMMENDED: String validation (matches HTML input format)
const formSchema = z.object({
  birthDate: z.iso.date(),  // Validates YYYY-MM-DD, stays as string
});

z.iso.date().parse("2020-01-01");  // ✅ Returns "2020-01-01" (string)
z.iso.date().parse("2020-1-1");    // ❌ Fails (requires zero-padding)
z.iso.date().parse("2020-01-32");  // ❌ Fails (invalid date)

// Form integration - no type conversion needed
<input
  type="date"
  value={field.value}  // Already a string!
  {...register('birthDate')}
/>
```

**When to use:**
- Form fields with `<input type="date">`
- Any UI that displays/edits dates as strings
- When you don't need Date object methods

### 2. Zod Codecs: Bidirectional Type Conversion

> **Source:** [Zod Codecs Documentation](https://zod.dev/codecs#isodatetimetodate)

When you need Date objects internally but strings at boundaries, use **codecs**:

```typescript
import { z } from 'zod';

// Define bidirectional codec
const isoDateCodec = z.codec(z.iso.date(), z.date(), {
  decode: (isoString) => new Date(isoString),  // string → Date (for internal use)
  encode: (date) => date.toISOString().slice(0, 10),  // Date → string (for UI/API)
});

// Usage
isoDateCodec.decode("2024-01-15");  // → Date object
isoDateCodec.encode(new Date());     // → "2024-12-03"
```

**Key insight:** Codecs explicitly handle BOTH directions of type conversion.

### 3. React Hook Form: Controller Transform Pattern

> **Source:** [React Hook Form - Transform and Parse](https://react-hook-form.com/advanced-usage#TransformandParse)

Official RHF documentation recommends the **Controller transform pattern** for type conversion:

```typescript
import { Controller } from 'react-hook-form';

// Reusable transform wrapper
const DateController = ({ control, name, ...props }) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <input
        type="date"
        {...props}
        // Transform: internal Date → display string
        value={
          field.value instanceof Date
            ? field.value.toISOString().slice(0, 10)
            : field.value ?? ''
        }
        // Transform: input string → internal representation
        onChange={(e) => {
          // Option A: Keep as string (recommended for forms)
          field.onChange(e.target.value);

          // Option B: Convert to Date (if schema expects Date)
          // field.onChange(new Date(e.target.value));
        }}
      />
    )}
  />
);
```

### 4. React Hook Form: `valueAsDate` Limitation

> **Source:** [React Hook Form - Register Options](https://react-hook-form.com/docs/useform/register#options)

**Critical warning from official docs:**

> `valueAsDate`: Returns `Date` normally. If something goes wrong `Invalid Date` will be returned.
> - `valueAs` process is happening **before** validation
> - **Does not transform `defaultValue` or `defaultValues`**

This means:
```typescript
// ❌ PROBLEM: valueAsDate doesn't affect defaults
const { register } = useForm({
  defaultValues: {
    birthDate: new Date(),  // Date object as default
  },
});

<input
  type="date"
  {...register('birthDate', { valueAsDate: true })}
  // valueAsDate only transforms USER INPUT
  // The Date default will still break the input!
/>
```

---

## Decision: Type Boundary Strategy for Crispy CRM

### Rule 1: Use String Dates at Form Boundaries

```typescript
// ✅ CORRECT: Form schema uses string validation
const opportunityFormSchema = z.object({
  expectedCloseDate: z.iso.date().optional(),
  followUpDate: z.iso.date().optional(),
});

// Form defaults are strings (or undefined)
const defaults = {
  expectedCloseDate: '',  // Empty string, not undefined Date
  followUpDate: '',
};
```

### Rule 2: Convert at API Boundary, Not Form Boundary

```typescript
// API schema (for database interaction)
const opportunityApiSchema = z.object({
  expected_close_date: z.coerce.date().nullable(),
});

// Transform when sending to API
const toApi = (formData: FormData) => ({
  expected_close_date: formData.expectedCloseDate
    ? new Date(formData.expectedCloseDate)
    : null,
});

// Transform when receiving from API
const fromApi = (apiData: ApiData) => ({
  expectedCloseDate: apiData.expected_close_date
    ? apiData.expected_close_date.toISOString().slice(0, 10)
    : '',
});
```

### Rule 3: Document Type Expectations in Schema

```typescript
/**
 * Form schema for Opportunity edit form.
 *
 * @remarks
 * Date fields use z.iso.date() (string format) for HTML input compatibility.
 * Conversion to Date objects happens in the data provider, not the form.
 */
const opportunityFormSchema = z.object({
  name: z.string().min(1).max(200),
  expectedCloseDate: z.iso.date().optional(),  // String: "YYYY-MM-DD"
  // ...
});
```

---

## Coercion Decision Matrix

| Use Case | Schema Type | Form Default | Notes |
|----------|-------------|--------------|-------|
| Date picker input | `z.iso.date()` | `''` (empty string) | String throughout |
| Date display only | `z.coerce.date()` | N/A | OK if not in form |
| API request body | `z.coerce.date()` | N/A | Converts at boundary |
| Database timestamp | `z.coerce.date()` | N/A | Supabase returns strings anyway |
| Datetime with time | `z.iso.datetime()` | `''` | String: "YYYY-MM-DDTHH:mm:ss" |

---

## Anti-Patterns to Avoid

### ❌ Don't: Mix Date and String in Same Field

```typescript
// ❌ WRONG: Schema expects Date but form provides string
const schema = z.object({
  date: z.coerce.date(),  // Expects to produce Date
});

// Form input always sends strings
<input type="date" {...register('date')} />
// This "works" on input but breaks on defaults/display
```

### ❌ Don't: Use `.partial().parse({})` with Date Coercion

```typescript
// ❌ DANGEROUS: Partial parse with coercion
const schema = z.object({
  date: z.coerce.date().optional(),
});

const defaults = schema.partial().parse({});
// If date was required and becomes optional via partial(),
// the coercion behavior is still active and may cause issues
```

### ❌ Don't: Assume API and Form Use Same Types

```typescript
// ❌ WRONG: Using API schema for form
const apiSchema = z.object({
  created_at: z.coerce.date(),  // Fine for API
});

// Using same schema for form defaults
const formDefaults = apiSchema.partial().parse({});
// 💥 Type mismatch at render time
```

---

## Implementation Checklist

- [ ] Audit all `z.coerce.date()` usages in form schemas
- [ ] Replace with `z.iso.date()` for form-bound fields
- [ ] Update form default values to use empty strings
- [ ] Add type conversion in data provider (API ↔ Form)
- [ ] Add JSDoc comments documenting type expectations
- [ ] Update `forms-validation-best-practices.md` with this guidance

---

## References

- [Zod API - ISO Dates](https://zod.dev/api#iso-dates) - String-based date validation
- [Zod Codecs](https://zod.dev/codecs) - Bidirectional type transformation
- [React Hook Form - Transform and Parse](https://react-hook-form.com/advanced-usage#TransformandParse)
- [React Hook Form - Register Options](https://react-hook-form.com/docs/useform/register#options) - `valueAsDate` limitations
- [MDN - HTMLInputElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement) - Native input value types

---

*Generated: December 2024*
*Sources: Official Zod 4.x and React Hook Form 7.x documentation*
