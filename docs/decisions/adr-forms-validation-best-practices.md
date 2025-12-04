# Forms & Validation: Industry Standards and Best Practices

> **Research Report** | December 2025
> **Technology Stack:** React Hook Form 7.66.1 | @hookform/resolvers 5.2.2 | Zod 4.1.12

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Overview](#technology-overview)
3. [React Hook Form Best Practices](#react-hook-form-best-practices)
4. [Zod Validation Patterns](#zod-validation-patterns)
5. [@hookform/resolvers Integration](#hookformresolvers-integration)
6. [Accessibility Standards (WCAG/ARIA)](#accessibility-standards-wcagaria)
7. [Testing Best Practices](#testing-best-practices)
8. [Performance Optimization](#performance-optimization)
9. [Error Handling Patterns](#error-handling-patterns)
10. [Internationalization (i18n)](#internationalization-i18n)
11. [Security Considerations](#security-considerations)
12. [Must-Follow Rules](#must-follow-rules)

---

## Executive Summary

This document outlines industry standards and best practices for form management and validation using React Hook Form, Zod, and @hookform/resolvers. These patterns ensure type-safe, accessible, performant, and maintainable form implementations.

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Type Safety** | Leverage Zod's TypeScript-first approach for compile-time validation |
| **Single Source of Truth** | Define schemas once, use for validation and type inference |
| **Accessibility First** | ARIA attributes and semantic HTML are mandatory |
| **Fail Fast** | Validate at boundaries, surface all errors immediately |
| **Uncontrolled by Default** | Minimize re-renders with uncontrolled components |

---

## Technology Overview

### React Hook Form 7.66.1

**Purpose:** Performant, flexible form state management with minimal re-renders.

**Key Features:**
- Uncontrolled component architecture (refs over state)
- Built-in validation aligned with HTML5 standards
- Tiny bundle size (~8.5KB gzipped)
- Zero dependencies
- First-class TypeScript support

### Zod 4.1.12

**Purpose:** TypeScript-first runtime schema validation with static type inference.

**Key Features:**
- Zero external dependencies
- 2KB core bundle (gzipped)
- Immutable API
- Built-in JSON Schema conversion
- 40+ built-in locales for i18n
- Works in Node.js and all modern browsers

### @hookform/resolvers 5.2.2

**Purpose:** Bridge between React Hook Form and external validation libraries.

**Supported Libraries:** Zod, Yup, Joi, Vest, Ajv, and custom resolvers.

---

## React Hook Form Best Practices

### 1. Form Structure

```tsx
// ✅ RECOMMENDED: Type-safe form with Zod inference
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // data is fully typed
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  );
}
```

### 2. Validation Modes

| Mode | When Validated | Use Case |
|------|----------------|----------|
| `onSubmit` (default) | On form submission | Most forms, reduces noise |
| `onBlur` | When field loses focus | Real-time feedback without being intrusive |
| `onChange` | On every input change | Instant validation (use sparingly) |
| `onTouched` | After first blur, then on change | Balance of feedback and performance |
| `all` | All events | Maximum feedback (highest cost) |

```tsx
// ✅ RECOMMENDED for most forms
useForm({
  mode: "onBlur",
  reValidateMode: "onChange",
});
```

### 3. Default Values

```tsx
// ✅ MUST: Always provide default values for controlled behavior
useForm({
  defaultValues: {
    email: "",
    password: "",
  },
});

// ✅ BETTER: Derive defaults from Zod schema
const defaults = schema.partial().parse({});
useForm({ defaultValues: defaults });
```

### 4. Field Registration

```tsx
// ✅ CORRECT: Spread register result
<input {...register("email")} />

// ✅ CORRECT: With valueAsNumber for numeric inputs
<input type="number" {...register("age", { valueAsNumber: true })} />

// ❌ WRONG: Manual ref assignment breaks functionality
<input ref={register("email").ref} />
```

---

## Zod Validation Patterns

### 1. Schema Definition Best Practices

```tsx
// ✅ RECOMMENDED: Colocate related validations
const userSchema = z.object({
  // Use built-in format validators
  email: z.email("Please enter a valid email"),

  // Chain validations logically
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),

  // Use enums for constrained values
  role: z.enum(["admin", "user", "guest"]),

  // Optional with defaults
  notifications: z.boolean().default(true),
});
```

### 2. Built-in String Formats (Zod 4)

```tsx
// ✅ USE THESE instead of custom regex
z.email();              // Email validation
z.uuid();               // UUID (any version)
z.uuidv4();             // UUID v4 specifically
z.url();                // Any valid URL
z.iso.date();           // YYYY-MM-DD
z.iso.datetime();       // ISO 8601 datetime
z.ipv4();               // IPv4 address
z.ipv6();               // IPv6 address
z.jwt();                // JSON Web Token
z.base64();             // Base64 string
```

### 3. Refinements for Complex Validation

```tsx
// ✅ Cross-field validation with path targeting
const passwordForm = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Target specific field
  });

// ✅ Async validation (use sparingly)
const uniqueUsername = z.string().refine(
  async (val) => {
    const exists = await checkUsernameExists(val);
    return !exists;
  },
  { message: "Username already taken" }
);
```

### 4. Coercion for Form Inputs

```tsx
// ✅ MUST USE for HTML form inputs (they return strings)
const formSchema = z.object({
  age: z.coerce.number().min(0).max(120),
  birthDate: z.coerce.date(),
  isActive: z.coerce.boolean(),
});
```

### 5. Discriminated Unions

```tsx
// ✅ RECOMMENDED for conditional fields
const contactSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    email: z.email(),
  }),
  z.object({
    type: z.literal("phone"),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  }),
]);
```

---

## @hookform/resolvers Integration

### 1. Basic Setup

```tsx
import { zodResolver } from "@hookform/resolvers/zod";

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

### 2. Resolver Rules (MUST FOLLOW)

| Rule | Description |
|------|-------------|
| **No mixing** | Cannot use resolver with built-in validators (`required`, `min`, etc.) |
| **Hierarchical errors** | Error keys must be nested, not flat |
| **Cached function** | Resolver function is cached internally |
| **Field-level focus** | Validation focuses on field-level reporting |

### 3. Debugging Resolvers

```tsx
// ✅ Debug resolver issues with this pattern
useForm({
  resolver: async (data, context, options) => {
    console.log("Form data:", data);
    const result = await zodResolver(schema)(data, context, options);
    console.log("Validation result:", result);
    return result;
  },
});
```

### 4. Context Passing

```tsx
// ✅ Pass dynamic context for conditional validation
const schema = z.object({
  discount: z.number().refine(
    (val, ctx) => val <= ctx.maxDiscount,
    { message: "Discount exceeds maximum" }
  ),
});

useForm({
  resolver: zodResolver(schema),
  context: { maxDiscount: 50 },
});
```

---

## Accessibility Standards (WCAG/ARIA)

### 1. MUST-HAVE Attributes

```tsx
// ✅ MANDATORY: Accessible form field
<label htmlFor="email">Email Address</label>
<input
  id="email"
  type="email"
  aria-invalid={errors.email ? "true" : "false"}
  aria-describedby={errors.email ? "email-error" : undefined}
  {...register("email")}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email.message}
  </span>
)}
```

### 2. Accessibility Checklist

| Requirement | Implementation | WCAG Level |
|-------------|----------------|------------|
| Labels | `<label htmlFor>` or `aria-label` | A |
| Error identification | `aria-invalid="true"` | A |
| Error announcement | `role="alert"` | A |
| Error description | `aria-describedby` | AA |
| Focus management | Focus first error on submit | AA |
| Required indication | `aria-required="true"` | A |

### 3. Screen Reader Behavior

With proper ARIA implementation, screen readers announce:
> "Email Address, edit, invalid entry, Please enter a valid email"

### 4. Focus Management

```tsx
// ✅ RECOMMENDED: Focus first error field on submission
useForm({
  shouldFocusError: true, // Default is true
});

// ✅ Manual focus for server errors
const { setError } = useForm();

setError("email", {
  type: "server",
  message: "Email already exists",
}, { shouldFocus: true });
```

---

## Testing Best Practices

### 1. Setup (Vitest/Jest)

```typescript
// setup.ts
import "@testing-library/jest-dom";

// For React Native:
// global.window = {};
// global.window = global;
```

### 2. Testing Patterns

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ✅ MUST: Use semantic queries
it("should show validation errors", async () => {
  render(<LoginForm />);

  // ✅ CORRECT: Query by role (most accessible)
  fireEvent.click(screen.getByRole("button", { name: /submit/i }));

  // ✅ CORRECT: Wait for async validation
  expect(await screen.findAllByRole("alert")).toHaveLength(2);

  // ✅ CORRECT: Use getByLabelText for form fields
  fireEvent.input(screen.getByLabelText(/email/i), {
    target: { value: "invalid" },
  });
});
```

### 3. Query Priority (MUST FOLLOW)

| Priority | Query | Use Case |
|----------|-------|----------|
| 1 | `getByRole` | Most accessible, primary choice |
| 2 | `getByLabelText` | Form fields |
| 3 | `getByPlaceholderText` | When no label exists |
| 4 | `getByText` | Non-interactive elements |
| 5 | `getByTestId` | Last resort only |

### 4. Handling Async Validation

```tsx
// ✅ CORRECT: Always await async operations
it("should submit valid form", async () => {
  render(<Form />);

  // Fill form...
  fireEvent.submit(screen.getByRole("button"));

  // Wait for submission to complete
  await waitFor(() => {
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });
});
```

### 5. Resolving `act()` Warnings

```tsx
// ❌ WRONG: Synchronous assertion causes act() warning
it("should render", () => {
  render(<Form />);
  expect(screen.getByText("Submit")).toBeInTheDocument();
});

// ✅ CORRECT: Await async behavior
it("should render", async () => {
  render(<Form />);
  expect(await screen.findByText("Submit")).toBeInTheDocument();
});
```

---

## Performance Optimization

### 1. Uncontrolled Components (Default)

React Hook Form uses uncontrolled components by default, which:
- Reduces re-renders dramatically
- Faster component mounting
- Smaller memory footprint

### 2. FormProvider Optimization

```tsx
import { memo } from "react";
import { FormProvider, useFormContext } from "react-hook-form";

// ✅ RECOMMENDED: Memoize nested components
const NestedInput = memo(
  ({ register, formState: { isDirty } }) => (
    <input {...register("field")} />
  ),
  (prev, next) => prev.formState.isDirty === next.formState.isDirty
);

// ✅ MUST: Read formState before render to enable Proxy
function Form() {
  const methods = useForm();
  console.log(methods.formState.isDirty); // Enable Proxy

  return (
    <FormProvider {...methods}>
      <NestedInput />
    </FormProvider>
  );
}
```

### 3. useFormState for Isolation

```tsx
import { useFormState } from "react-hook-form";

// ✅ RECOMMENDED: Isolate re-renders to specific state
function SubmitButton({ control }) {
  const { isSubmitting } = useFormState({ control });
  return <button disabled={isSubmitting}>Submit</button>;
}
```

### 4. Performance Anti-Patterns

| Anti-Pattern | Issue | Solution |
|--------------|-------|----------|
| `watch()` in render | Re-renders on every change | Use `useWatch` with specific fields |
| Controlled inputs everywhere | Unnecessary re-renders | Use uncontrolled with `register` |
| DevTools in production | Major performance hit | Conditionally load |
| Large forms without sections | Slow validation | Split into steps/sections |

---

## Error Handling Patterns

### 1. Error Message Display

```tsx
// ✅ RECOMMENDED: Use optional chaining
{errors.email?.message}

// ✅ ALTERNATIVE: ErrorMessage component
import { ErrorMessage } from "@hookform/error-message";

<ErrorMessage
  errors={errors}
  name="email"
  render={({ message }) => <span role="alert">{message}</span>}
/>
```

### 2. Server-Side Errors

```tsx
const { setError, clearErrors } = useForm();

// ✅ Set server errors
const onSubmit = async (data) => {
  try {
    await submitForm(data);
  } catch (error) {
    if (error.field) {
      setError(error.field, {
        type: "server",
        message: error.message,
      });
    } else {
      setError("root.serverError", {
        type: "server",
        message: error.message,
      });
    }
  }
};

// Display root errors
{errors.root?.serverError && (
  <div role="alert">{errors.root.serverError.message}</div>
)}
```

### 3. Zod Error Customization

```tsx
// ✅ Schema-level (highest priority)
z.string({ error: "Custom message" });

// ✅ Per-parse level
schema.parse(data, {
  error: (iss) => {
    if (iss.code === "invalid_type") {
      return `Expected ${iss.expected}, got ${typeof iss.input}`;
    }
    return undefined; // Fall back to default
  },
});

// ✅ Global level (lowest priority)
z.config({
  customError: (iss) => "Global fallback message",
});
```

---

## Internationalization (i18n)

### 1. Zod 4 Built-in Locales

```tsx
import * as z from "zod";
import { fr } from "zod/locales";

// ✅ Set locale globally
z.config(fr());

// ✅ Lazy loading for bundle optimization
async function setLocale(locale: string) {
  const { default: messages } = await import(`zod/v4/locales/${locale}.js`);
  z.config(messages());
}
```

### 2. Available Locales (40+)

Includes: Arabic, Chinese (Simplified/Traditional), Dutch, English, French, German, Italian, Japanese, Korean, Portuguese, Russian, Spanish, and many more.

### 3. Custom Error Maps

```tsx
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case "invalid_type":
      return { message: t("validation.invalidType", { expected: issue.expected }) };
    case "too_small":
      return { message: t("validation.tooSmall", { minimum: issue.minimum }) };
    default:
      return { message: ctx.defaultError };
  }
};

z.config({ customError: customErrorMap });
```

---

## Security Considerations

### 1. Input Sanitization

```tsx
// ✅ MUST: Always sanitize before database operations
const schema = z.object({
  // Zod validates, but sanitize for storage
  html: z.string().transform((val) => sanitizeHtml(val)),
});
```

### 2. Sensitive Data Handling

```tsx
// ✅ RECOMMENDED: Don't include input in errors by default
schema.parse(data); // input NOT included in errors

// ⚠️ CAUTION: Only enable for debugging
schema.parse(data, { reportInput: true }); // input IS included
```

### 3. Validation Boundaries

| Layer | What to Validate | Why |
|-------|------------------|-----|
| Client (Zod) | Format, required, length | UX, immediate feedback |
| Server (Zod) | All of above + business rules | Security, trust nothing |
| Database | Constraints, types | Data integrity |

---

## Must-Follow Rules

### React Hook Form

| # | Rule | Severity |
|---|------|----------|
| 1 | Always provide `defaultValues` | Required |
| 2 | Use `resolver` OR built-in validation, never both | Required |
| 3 | Include `aria-invalid` on all inputs | Required |
| 4 | Use `role="alert"` for error messages | Required |
| 5 | Await `findBy*` queries in tests | Required |
| 6 | Read `formState` before render when using FormProvider | Required |

### Zod

| # | Rule | Severity |
|---|------|----------|
| 1 | Enable `strict: true` in tsconfig.json | Required |
| 2 | Use `z.infer<typeof schema>` for type derivation | Required |
| 3 | Use `z.coerce.*` for HTML form inputs | Required |
| 4 | Use built-in formats (email, uuid) over custom regex | Recommended |
| 5 | Use `path` in refinements for cross-field validation | Required |
| 6 | Never throw in refinement functions | Required |

### @hookform/resolvers

| # | Rule | Severity |
|---|------|----------|
| 1 | Error keys must be hierarchical (nested), not flat | Required |
| 2 | Return both `values` and `errors` from custom resolvers | Required |
| 3 | Use debug pattern when troubleshooting validation | Recommended |

---

## References

- [React Hook Form Documentation](https://react-hook-form.com/docs)
- [Zod Documentation](https://zod.dev)
- [@hookform/resolvers GitHub](https://github.com/react-hook-form/resolvers)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about#priority)

---

*Generated: December 2025*
