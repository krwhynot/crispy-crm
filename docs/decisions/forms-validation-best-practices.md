# Forms & Validation Best Practices

> Industry standards, must-follows, and best practices for form state management and runtime validation.

## Technology Stack

| Technology          | Version | Purpose                     |
|---------------------|---------|-----------------------------|
| React Hook Form     | 7.66.1  | Form state management       |
| @hookform/resolvers | 5.2.2   | Schema resolver integration |
| Zod                 | 4.1.12  | Runtime schema validation   |

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [React Hook Form Best Practices](#react-hook-form-best-practices)
3. [Zod Schema Validation](#zod-schema-validation)
4. [Integration Patterns](#integration-patterns)
5. [Performance Optimization](#performance-optimization)
6. [Error Handling & UX](#error-handling--ux)
7. [Accessibility (A11y)](#accessibility-a11y)
8. [Security & Input Validation](#security--input-validation)
9. [Must-Follow Rules](#must-follow-rules)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Design Philosophy

### React Hook Form Core Principles

React Hook Form's design philosophy focuses on **user and developer experience**:

1. **Uncontrolled Components First** - Uses `ref` registration for better performance
2. **Subscription-Based State** - Proxy-based form state subscription model
3. **Minimal Re-renders** - Isolates component re-rendering when required
4. **HTML Standards Alignment** - Aligns with native HTML form validation
5. **TypeScript-First** - Strong type-checking with early build-time feedback

### Zod Core Principles

1. **TypeScript-First** - Static type inference from schemas
2. **Zero Dependencies** - Minimal bundle impact (~2kb gzipped core)
3. **Immutable API** - Methods return new instances
4. **Composable Schemas** - Build complex validations from simple primitives

---

## React Hook Form Best Practices

### 1. Validation Mode Selection

Choose the appropriate validation trigger based on UX requirements:

| Mode        | Trigger                          | Performance | Use Case                           |
|-------------|----------------------------------|-------------|------------------------------------|
| `onSubmit`  | Submit event (default)           | ✅ Best     | Standard forms, simple validation  |
| `onBlur`    | Blur event                       | ✅ Good     | Complex forms, field-by-field UX   |
| `onTouched` | First blur, then every change    | ⚠️ Medium  | Balance of UX and performance      |
| `onChange`  | Every change event               | ❌ Worst    | Real-time validation (use sparingly) |
| `all`       | Both blur and change events      | ❌ Worst    | Critical fields only               |

```typescript
// ✅ RECOMMENDED: onSubmit (default) or onBlur
const { register, handleSubmit } = useForm({
  mode: 'onBlur', // Validates on field blur
  reValidateMode: 'onChange', // Re-validates on change after first error
});

// ⚠️ CAUTION: onChange has significant performance impact
const { register } = useForm({
  mode: 'onChange', // Multiple re-renders per keystroke
});
```

### 2. Form State Management

```typescript
// ✅ CORRECT: Destructure only needed state
const {
  formState: { errors, isSubmitting, isDirty }
} = useForm();

// ✅ CORRECT: Use useWatch for isolated subscriptions
function PriceDisplay({ control }) {
  const price = useWatch({ control, name: 'price' });
  return <span>${price}</span>; // Only this component re-renders
}

// ❌ WRONG: Watching entire form at root level
const formValues = watch(); // Causes re-renders on every change
```

### 3. Default Values

```typescript
// ✅ CORRECT: Provide defaultValues for consistent behavior
const { register } = useForm({
  defaultValues: {
    firstName: '',
    lastName: '',
    email: '',
  },
});

// ✅ CORRECT: Async default values
const { register } = useForm({
  defaultValues: async () => {
    const response = await fetch('/api/user');
    return response.json();
  },
});
```

### 4. Type Safety with TypeScript

```typescript
// ✅ CORRECT: Define form interface
interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
}

const { register, handleSubmit } = useForm<ContactForm>();

const onSubmit: SubmitHandler<ContactForm> = (data) => {
  // data is fully typed
  console.log(data.firstName);
};
```

---

## Zod Schema Validation

### 1. Schema Definition Best Practices

```typescript
import { z } from 'zod';

// ✅ CORRECT: Define reusable schemas
const emailSchema = z.string().email('Invalid email address');

const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

// ✅ CORRECT: Compose schemas
const contactSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

// ✅ CORRECT: Infer TypeScript types from schema
type Contact = z.infer<typeof contactSchema>;
```

### 2. Coercion for Form Inputs

HTML form inputs always return strings. Use coercion for non-string types:

```typescript
// ✅ CORRECT: Use coercion for numeric inputs
const schema = z.object({
  age: z.coerce.number().min(0).max(150),
  price: z.coerce.number().positive(),
  isActive: z.coerce.boolean(),
});

// ❌ WRONG: Expecting number from form input
const schema = z.object({
  age: z.number(), // Will fail - input returns string "25", not number 25
});
```

### 3. Date Coercion: Critical Type Boundary Warning

> ⚠️ **CRITICAL:** `z.coerce.date()` produces JavaScript Date objects, but HTML `<input type="date">` requires `YYYY-MM-DD` strings. This type mismatch causes runtime errors.

**The Problem:**

```typescript
// ❌ DANGEROUS: This creates a type boundary mismatch
const schema = z.object({
  birthDate: z.coerce.date(),  // Produces Date object
});

// Form defaults via schema
const defaults = schema.partial().parse({});

// HTML input expects string format
<input type="date" value={field.value} />
// 💥 If field.value is Date: renders incorrectly or crashes

// UI component calling string methods
field.value.slice(0, 10);  // 💥 TypeError: slice is not a function
```

**The Solution - Use `z.iso.date()` for Form Fields:**

```typescript
import { z } from 'zod';

// ✅ CORRECT: Use z.iso.date() for form-bound date fields
const formSchema = z.object({
  birthDate: z.iso.date(),  // Validates YYYY-MM-DD, stays as STRING
  expectedCloseDate: z.iso.date().optional(),
});

// Works with HTML date inputs
<input
  type="date"
  value={field.value}  // Already a string!
  {...register('birthDate')}
/>
```

**When to Use Each Pattern:**

| Use Case | Zod Type | Output Type | Form Compatible? |
|----------|----------|-------------|------------------|
| Date picker inputs | `z.iso.date()` | `string` | ✅ Yes |
| Datetime inputs | `z.iso.datetime()` | `string` | ✅ Yes |
| API request bodies | `z.coerce.date()` | `Date` | ❌ No |
| Display-only dates | `z.coerce.date()` | `Date` | N/A |

**For Complex Date Handling (Zod 4 Codecs):**

```typescript
// Bidirectional conversion when you need Date internally
const isoDateCodec = z.codec(z.iso.date(), z.date(), {
  decode: (str) => new Date(str),           // string → Date (internal)
  encode: (date) => date.toISOString().slice(0, 10),  // Date → string (UI)
});
```

> 📖 **See Also:** [ADR: Date Coercion and Type Boundaries](./adr-date-coercion-type-boundaries.md) for complete guidance.

### 4. Refinements for Complex Validation

```typescript
// ✅ CORRECT: Use refine for custom validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (val) => /[A-Z]/.test(val),
    { message: 'Password must contain uppercase letter' }
  )
  .refine(
    (val) => /[0-9]/.test(val),
    { message: 'Password must contain a number' }
  );

// ✅ CORRECT: Use superRefine for multiple issues
const passwordSchema = z.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.addIssue({
      code: 'too_small',
      minimum: 8,
      type: 'string',
      inclusive: true,
      message: 'Password must be at least 8 characters',
    });
  }
  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Password must contain uppercase letter',
    });
  }
});

// ✅ CORRECT: Cross-field validation with path
const passwordForm = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Error appears on confirmPassword field
  }
);
```

### 4. Conditional Validation with `when`

```typescript
// ✅ CORRECT: Use 'when' for dependent field validation
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
  otherField: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
    // Run even if otherField has errors
    when: (payload) => {
      const partial = z.object({
        password: z.string(),
        confirmPassword: z.string(),
      });
      return partial.safeParse(payload.value).success;
    },
  }
);
```

---

## Integration Patterns

### 1. Basic Zod + React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.coerce.number().min(18, 'Must be 18 or older'),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      age: undefined,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="number" {...register('age')} />
      {errors.age && <span>{errors.age.message}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### 2. Resolver Rules & Constraints

> **IMPORTANT**: A resolver cannot be used with built-in validators (required, min, max, etc.)

```typescript
// ❌ WRONG: Mixing resolver with register validation
const { register } = useForm({
  resolver: zodResolver(schema),
});
<input {...register('name', { required: true })} /> // Built-in validation ignored!

// ✅ CORRECT: All validation in Zod schema
const schema = z.object({
  name: z.string().min(1, 'Required'),
});
<input {...register('name')} />
```

### 3. Debugging Resolver Issues

```typescript
// ✅ TIP: Debug resolver with logging
const { register } = useForm({
  resolver: async (data, context, options) => {
    console.log('Form data:', data);
    const result = await zodResolver(schema)(data, context, options);
    console.log('Validation result:', result);
    return result;
  },
});
```

---

## Performance Optimization

### 1. Re-render Isolation

```typescript
// ✅ BEST: useWatch for isolated subscriptions
function PriceWatcher({ control }: { control: Control }) {
  const price = useWatch({ control, name: 'price' });
  // Only this component re-renders when price changes
  return <p>Price: ${price}</p>;
}

// ✅ GOOD: Computed values with useWatch
const watchedValue = useWatch({
  control,
  compute: (data) => {
    // Only return when condition met
    return data.quantity > 0 ? data.quantity * data.price : 0;
  },
});

// ❌ AVOID: watch() at form root
const allValues = watch(); // Entire form re-renders on any change
```

### 2. FormProvider Performance

```typescript
// ✅ CORRECT: Isolate re-renders with useFormContext
function NestedInput() {
  const { register } = useFormContext();
  // This component doesn't re-render on other field changes
  return <input {...register('nestedField')} />;
}

// ✅ CORRECT: Use control prop instead of context when possible
function OptimizedChild({ control }) {
  const value = useWatch({ control, name: 'field' });
  return <span>{value}</span>;
}
```

### 3. Large Forms Optimization

```typescript
// ✅ CORRECT: Lazy validation for large forms
const schema = z.object({
  // Use abort: true to stop on first error
  field1: z.string().refine(expensiveCheck, { abort: true }),
  field2: z.string(),
});

// ✅ CORRECT: Partial validation with pick
const partialSchema = schema.pick({ field1: true });
```

---

## Error Handling & UX

### 1. Error Message Display Patterns

```typescript
// ✅ CORRECT: Optional chaining for safe access
{errors?.firstName?.message}

// ✅ CORRECT: Using ErrorMessage component
import { ErrorMessage } from '@hookform/error-message';

<ErrorMessage
  errors={errors}
  name="firstName"
  render={({ message }) => <p className="error">{message}</p>}
/>

// ✅ CORRECT: Custom error messages in Zod
const schema = z.object({
  email: z.string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  }).email('Please enter a valid email address'),
});
```

### 2. Zod Error Formatting

```typescript
import { z } from 'zod';

// ✅ CORRECT: Flatten errors for simple forms
const result = schema.safeParse(data);
if (!result.success) {
  const flattened = z.flattenError(result.error);
  // { formErrors: string[], fieldErrors: { [key]: string[] } }
  console.log(flattened.fieldErrors.email); // ['Invalid email']
}

// ✅ CORRECT: Tree errors for nested forms
const tree = z.treeifyError(result.error);
// Access nested: tree.properties?.address?.properties?.zip?.errors

// ✅ CORRECT: Pretty print for debugging
console.log(z.prettifyError(result.error));
// ✖ Invalid email
//   → at email
```

### 3. Server Error Integration

```typescript
// ✅ CORRECT: Set server errors with setError
const { setError, handleSubmit } = useForm();

const onSubmit = async (data) => {
  try {
    await api.submit(data);
  } catch (error) {
    // Set field-specific error from server
    setError('email', {
      type: 'server',
      message: 'This email is already registered',
    });

    // Set form-level error
    setError('root.serverError', {
      type: 'server',
      message: 'Server validation failed',
    });
  }
};
```

---

## Accessibility (A11y)

### Must-Follow ARIA Patterns

```tsx
// ✅ CORRECT: Accessible form implementation
function AccessibleForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <form>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        aria-invalid={errors.email ? 'true' : 'false'}
        aria-describedby={errors.email ? 'email-error' : undefined}
        {...register('email')}
      />
      {errors.email && (
        <span id="email-error" role="alert">
          {errors.email.message}
        </span>
      )}
    </form>
  );
}
```

### A11y Checklist

| Requirement | Implementation |
|-------------|----------------|
| Label association | Use `htmlFor` matching input `id` |
| Error announcement | Use `role="alert"` on error messages |
| Invalid state | Use `aria-invalid="true"` on invalid inputs |
| Error description | Use `aria-describedby` linking to error `id` |
| Focus management | Focus first invalid field on submit |

---

## Security & Input Validation

### OWASP Input Validation Principles

#### 1. Allowlist Over Denylist

> **CRITICAL**: Always use allowlist (whitelist) validation. Denylist validation is trivially bypassed.

```typescript
// ✅ CORRECT: Allowlist validation
const roleSchema = z.enum(['admin', 'user', 'guest']);

const statusSchema = z.enum(['active', 'inactive', 'pending']);

// ❌ WRONG: Denylist approach (easily bypassed)
const unsafeSchema = z.string().refine(
  (val) => !val.includes('<script>'), // Attacker can use <SCRIPT> or encoding
  'Invalid input'
);
```

#### 2. Strong Pattern Validation

```typescript
// ✅ CORRECT: Strict patterns for structured data
const schemas = {
  // Email with strict pattern
  email: z.string().email(),

  // Phone: E.164 format
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),

  // ZIP code (US)
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),

  // UUID
  uuid: z.string().uuid(),

  // Date (ISO 8601)
  date: z.string().date(), // or z.coerce.date()

  // URL
  url: z.string().url(),
};
```

#### 3. Strict Object Schemas

```typescript
// ✅ CORRECT: Use strict to reject unknown keys
const userSchema = z.strictObject({
  name: z.string(),
  email: z.string().email(),
});

userSchema.parse({ name: 'John', email: 'john@example.com', admin: true });
// ❌ Throws: Unrecognized key: "admin"

// ⚠️ CAUTION: Default object allows unknown keys
const looseSchema = z.object({
  name: z.string(),
});
looseSchema.parse({ name: 'John', admin: true }); // ✅ Passes (admin ignored)

// ✅ ALTERNATIVE: Strip unknown keys
const strippedSchema = z.object({
  name: z.string(),
}).strip(); // Removes unknown keys from output
```

#### 4. Length and Size Limits

```typescript
// ✅ CORRECT: Always set reasonable limits
const schema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().max(1000),
  tags: z.array(z.string()).max(10),
  metadata: z.record(z.string()).refine(
    (obj) => Object.keys(obj).length <= 20,
    'Too many metadata keys'
  ),
});
```

### Input Sanitization Strategy

```typescript
// ✅ CORRECT: Transform/sanitize in schema
const schema = z.object({
  // Trim whitespace
  name: z.string().trim(),

  // Normalize email
  email: z.string().email().toLowerCase(),

  // Remove dangerous characters (for specific use cases)
  searchQuery: z.string()
    .transform((val) => val.replace(/[<>]/g, '')),
});

// ⚠️ NOTE: Sanitization is NOT a substitute for:
// - Parameterized queries (SQL injection)
// - Output encoding (XSS)
// - Content Security Policy (XSS)
```

---

## Must-Follow Rules

### React Hook Form

| # | Rule | Rationale |
|---|------|-----------|
| 1 | Never mix resolver with built-in validation | Built-in rules ignored when resolver present |
| 2 | Always provide `defaultValues` | Prevents undefined behavior, enables reset |
| 3 | Use `useWatch` over `watch()` for subscriptions | Isolates re-renders for performance |
| 4 | Type forms with TypeScript interfaces | Compile-time error detection |
| 5 | Use `onSubmit` or `onBlur` mode by default | `onChange` causes performance issues |

### Zod

| # | Rule | Rationale |
|---|------|-----------|
| 1 | Use `z.coerce` for form inputs | HTML inputs always return strings |
| 2 | Enable TypeScript `strict` mode | Required for proper type inference |
| 3 | Use `z.infer<typeof schema>` for types | Single source of truth |
| 4 | Set `path` for cross-field refinements | Errors appear on correct field |
| 5 | Use `strictObject` for API boundaries | Prevents prototype pollution, mass assignment |

### Security

| # | Rule | Rationale |
|---|------|-----------|
| 1 | Allowlist validation only | Denylist trivially bypassed |
| 2 | Server-side validation mandatory | Client validation is bypassable |
| 3 | Set length/size limits | Prevents DoS, buffer issues |
| 4 | Use strict object schemas at boundaries | Prevents mass assignment |
| 5 | Never trust form data for authorization | Validate server-side |

---

## Anti-Patterns to Avoid

### ❌ Don't Do This

```typescript
// ❌ Validation in component (duplicates schema)
<input {...register('email', {
  required: true,  // Duplicates Zod validation
  pattern: /email/ // Already in schema!
})} />

// ❌ Watching entire form unnecessarily
const allValues = watch(); // Re-renders entire tree

// ❌ Missing error handling
const onSubmit = (data) => api.submit(data); // No try/catch

// ❌ Loose object schemas at API boundary
const schema = z.object({ name: z.string() }); // Allows unknown keys

// ❌ Denylist validation
z.string().refine(val => !val.includes('<script>'));

// ❌ No length limits
z.string(); // Allows infinite length input

// ❌ Missing accessibility attributes
<input {...register('email')} />
{errors.email && <span>{errors.email.message}</span>} // No ARIA
```

### ✅ Do This Instead

```typescript
// ✅ All validation in Zod schema
const schema = z.object({
  email: z.string().email().max(254),
});
<input {...register('email')} />

// ✅ Isolated watching
const email = useWatch({ control, name: 'email' });

// ✅ Proper error handling
const onSubmit = async (data) => {
  try {
    await api.submit(data);
  } catch (e) {
    setError('root', { message: 'Submission failed' });
  }
};

// ✅ Strict schemas at boundaries
const schema = z.strictObject({ name: z.string().max(100) });

// ✅ Allowlist validation
const status = z.enum(['active', 'inactive']);

// ✅ Accessible form
<input
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
  {...register('email')}
/>
{errors.email && (
  <span id="email-error" role="alert">{errors.email.message}</span>
)}
```

---

## References

### Official Documentation
- [React Hook Form Documentation](https://react-hook-form.com/docs)
- [React Hook Form - Advanced Usage](https://react-hook-form.com/advanced-usage) - Transform/Parse, Testing, Accessibility
- [React Hook Form - Register Options](https://react-hook-form.com/docs/useform/register#options) - `valueAsDate` limitations
- [Zod Documentation](https://zod.dev)
- [Zod API - ISO Dates](https://zod.dev/api#iso-dates) - String-based date validation
- [Zod Codecs](https://zod.dev/codecs) - Bidirectional type transformation
- [@hookform/resolvers GitHub](https://github.com/react-hook-form/resolvers)

### Security Standards
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### Accessibility Standards
- [MDN Web Accessibility ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [axe-core WCAG 2.0/2.1 Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [W3C WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Project-Specific ADRs
- [ADR: Date Coercion and Type Boundaries](./adr-date-coercion-type-boundaries.md) - Critical guidance for date handling in forms

---

*Generated: December 2024*
*Updated: December 2024 - Added Date Coercion section and expanded references*
*Sources: Official documentation from React Hook Form, Zod, OWASP, and W3C*
