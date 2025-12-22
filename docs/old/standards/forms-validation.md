# Forms & Validation Standards

Standards for form implementation and validation in Crispy CRM (Atomic CRM).

**Stack:** React Hook Form 7.66.1 + Zod 4.1.12 + @hookform/resolvers 5.2.2

---

## Core Principles

- **Backend is Source of Truth** - API validation catches all errors; form validation improves UX only
- **Fail Fast** - Throw errors immediately; no retry logic, circuit breakers, or graceful degradation
- **Single Schema, Dual Purpose** - One Zod schema serves both form defaults and API validation
- **Accessibility Non-Negotiable** - All errors must be screen-reader accessible with proper ARIA attributes
- **Errors are Guidance** - Error messages tell users exactly what to fix and how to fix it

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Form Component                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Form Defaults: schema.partial().parse({})               │  │
│  │ Optional: zodResolver(schema) for client-side UX        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            │ User submits                       │
│                            ▼                                    │
│                  ┌──────────────────┐                          │
│                  │  onSubmit()      │                          │
│                  └──────────────────┘                          │
└────────────────────────│────────────────────────────────────────┘
                         │
                         │ POST/PUT/PATCH
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              unifiedDataProvider (API Boundary)                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. schema.parse(data) - Zod validation                  │  │
│  │ 2. Business rules validation                            │  │
│  │ 3. Uniqueness checks                                    │  │
│  │ 4. Permission checks                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                   ┌────────┴────────┐                          │
│                   │                 │                          │
│              Success            Validation                      │
│                   │              Error                          │
│                   ▼                 ▼                          │
│            Return data      Throw ZodError                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ Response
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Form Component                             │
│                                                                 │
│  Success: redirect/refresh    Error: display in form           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Must-Follow Rules

| Rule | Details |
|------|---------|
| **Schema Location** | All Zod schemas in `src/atomic-crm/validation/` |
| **Form Defaults** | Always use `schema.partial().parse({})` for default values |
| **No Custom Validation** | Never implement validation logic in form components |
| **Validation Location** | Zod validation ONLY at API boundary in `unifiedDataProvider` |
| **Field Error State** | Add `aria-invalid={!!error}` to all form inputs |
| **Error Announcements** | Use `role="alert"` on error message containers |
| **Error Styling** | Use `text-destructive` for all error text |
| **zodResolver Usage** | Optional for UX; backend validation is required |
| **Server Errors** | Always display server-returned errors verbatim |

---

## Validation Responsibilities

| Validation Type | Form (Client) | API (Server) | Notes |
|----------------|---------------|--------------|-------|
| **Required Fields** | ✓ (UX) | ✓ (Required) | Client prevents empty submit; server enforces |
| **Format Checks** | ✓ (UX) | ✓ (Required) | Email format, phone format, URL structure |
| **Field Lengths** | ✓ (UX) | ✓ (Required) | Min/max character counts |
| **Type Validation** | ✓ (UX) | ✓ (Required) | Number vs string, date formats |
| **Uniqueness Checks** | ✗ | ✓ (Required) | Email uniqueness, duplicate prevention |
| **Business Rules** | ✗ | ✓ (Required) | Cross-field validation, domain logic |
| **Permissions** | ✗ | ✓ (Required) | RLS policies, role checks |
| **Database Constraints** | ✗ | ✓ (Required) | Foreign keys, check constraints |

**Key:** ✓ = Must implement | ✗ = Never implement

---

## Form Component Template

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@/atomic-crm/validation/contacts';
import { useDataProvider } from 'react-admin';
import type { z } from 'zod';

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm({ id }: { id?: string }) {
  const dataProvider = useDataProvider();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ContactFormData>({
    defaultValues: contactSchema.partial().parse({}),
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (id) {
        await dataProvider.update('contacts', { id, data });
      } else {
        await dataProvider.create('contacts', { data });
      }
    } catch (error) {
      if (error instanceof Error) {
        setError('root.serverError', {
          type: 'server',
          message: error.message,
        });
      } else {
        setError('root.serverError', {
          type: 'server',
          message: 'An unexpected error occurred',
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root?.serverError && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-destructive"
        >
          {errors.root.serverError.message}
        </div>
      )}

      <div>
        <label htmlFor="first_name" className="block text-sm font-medium">
          First Name
        </label>
        <input
          id="first_name"
          type="text"
          {...register('first_name')}
          aria-invalid={!!errors.first_name}
          aria-describedby={errors.first_name ? 'first_name-error' : undefined}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
        {errors.first_name && (
          <p
            id="first_name-error"
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {errors.first_name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
        {errors.email && (
          <p
            id="email-error"
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        {isSubmitting ? 'Saving...' : id ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
```

---

## Error Handling

### Field-Level Errors

Field-level errors appear directly below the input they describe.

**Requirements:**
- Error message immediately follows input in DOM order
- Input has `aria-invalid="true"` when error exists
- Input has `aria-describedby` pointing to error message ID
- Error container has `role="alert"` for screen reader announcement
- Error text uses `text-destructive` color

```tsx
<input
  id="email"
  type="email"
  {...register('email')}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert" className="text-sm text-destructive">
    {errors.email.message}
  </p>
)}
```

### Form-Level Errors

Form-level errors appear at the top of the form and summarize all validation errors.

**Use FormErrorSummary component:**

```tsx
import { FormErrorSummary } from '@/components/admin/forms/FormErrorSummary';

export function ContactForm() {
  const { formState: { errors } } = useForm();

  return (
    <form>
      <FormErrorSummary errors={errors} />
      {/* form fields */}
    </form>
  );
}
```

**FormErrorSummary displays:**
- Server errors from `errors.root.serverError`
- List of field errors with links to inputs
- Proper ARIA live region for announcements

### Server Errors

Server errors are caught in the form's `onSubmit` handler and set using `setError('root.serverError', ...)`.

**Server error flow:**
1. API throws error (e.g., uniqueness violation)
2. Form catches error in `catch` block
3. Form calls `setError('root.serverError', { message })`
4. Error displays at top of form via FormErrorSummary
5. User fixes issue and resubmits

**Example:**

```tsx
const onSubmit = async (data: FormData) => {
  try {
    await dataProvider.create('contacts', { data });
  } catch (error) {
    setError('root.serverError', {
      type: 'server',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
```

---

## API Error Response Format

The API (unifiedDataProvider) throws errors with this structure:

```typescript
interface ApiValidationError {
  message: string;
  errors?: {
    field: string;
    message: string;
  }[];
}
```

**Example error thrown by API:**

```typescript
throw new Error('Validation failed: Email already exists');
```

**Example field-level errors (future enhancement):**

```typescript
throw new Error(JSON.stringify({
  message: 'Validation failed',
  errors: [
    { field: 'email', message: 'Email already exists' },
    { field: 'phone', message: 'Invalid phone format' },
  ],
}));
```

**Form handling:**

```tsx
catch (error) {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as ApiValidationError;
      if (parsed.errors) {
        parsed.errors.forEach(({ field, message }) => {
          setError(field as keyof FormData, { message });
        });
      } else {
        setError('root.serverError', { message: parsed.message });
      }
    } catch {
      setError('root.serverError', { message: error.message });
    }
  }
}
```

---

## Accessibility Checklist

- [ ] All inputs have associated `<label>` with matching `for`/`id`
- [ ] Error messages have `role="alert"` for screen reader announcement
- [ ] Invalid inputs have `aria-invalid="true"`
- [ ] Error messages linked via `aria-describedby` to inputs
- [ ] Form-level errors appear in live region (`role="alert"` or `aria-live="polite"`)
- [ ] Required fields indicated visually and in label text (not just asterisk)
- [ ] Error text has sufficient color contrast (WCAG AA minimum 4.5:1)
- [ ] Error text uses `text-destructive` semantic color
- [ ] Touch targets minimum 44x44px for buttons
- [ ] Form can be completed using keyboard only (no mouse required)
- [ ] Submit button disabled state clearly communicated (`aria-disabled` or `disabled`)
- [ ] Focus moves to first error on submit failure
- [ ] Success/error messages announced to screen readers

---

## References

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)
- [WCAG 2.1 Form Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?tags=forms)
- [ARIA: alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [React Admin Form Components](https://marmelab.com/react-admin/Inputs.html)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-03
**Status:** Active
