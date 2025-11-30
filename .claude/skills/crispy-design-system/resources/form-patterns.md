# Form Patterns

## Purpose

Document form patterns for Atomic CRM including Zod validation, React Hook Form integration, JSONB array inputs, tabbed forms, error handling, and accessible form design optimized for desktop (primary) and tablet touch input.

## Create Form Layout

**Per unified design system** (docs/plans/2025-11-16-unified-design-system-rollout.md:211-288):

### Pattern: Full-Page Create Form

```tsx
// Must be FULL-PAGE (NOT slide-over)
// Breadcrumb + centered card + tabbed sections + sticky footer

export const ContactCreate = () => {
  return (
    <div className="bg-muted px-[var(--spacing-edge-desktop)] py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbItem>Home</BreadcrumbItem>
        <BreadcrumbItem>Contacts</BreadcrumbItem>
        <BreadcrumbItem>New Contact</BreadcrumbItem>
      </Breadcrumb>

      {/* Centered form card */}
      <form className="create-form-card max-w-4xl mx-auto mt-6">
        {/* Tabbed sections */}
        <TabbedFormInputs
          tabs={[
            { key: 'identity', label: 'Identity', content: <IdentityTab /> },
            { key: 'contact', label: 'Contact Info', content: <ContactTab /> },
            { key: 'account', label: 'Account', content: <AccountTab /> },
          ]}
        />

        {/* Sticky footer with actions - bottom-12 clears fixed layout footer */}
        <div className="sticky bottom-12 bg-card border-t border-border p-4 flex justify-between">
          <Button variant="outline">Cancel</Button>
          <div className="flex gap-2">
            <Button type="submit">Save & Close</Button>
            <Button type="submit" variant="secondary">Save & Add Another</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
```

### Styling Rules
- Page background: `bg-muted` (light, airy)
- Form card: `.create-form-card` (max-w-4xl, shadow-lg, centered)
- Tabbed sections: `TabbedFormInputs` with error badges
- Sticky footer: `sticky bottom-12` with Cancel | Save & Close | Save & Add
  - **IMPORTANT:** Use `bottom-12` (48px) NOT `bottom-0` to clear the fixed layout footer
- Validation: Zod schemas with inline errors
- Optional autosave: localStorage (key: `crm.draft.{resource}.{userId}`)

## Core Principle: Schema-Driven Forms

Forms derive validation rules AND default values from **Zod schemas** (centralized at API boundary). This eliminates duplication between validation logic and TypeScript types, ensuring forms stay in sync with business rules.

**Golden Rule:** `zodSchema.partial().parse({})` provides form defaults

## Zod Schema Foundation

### Pattern: Schema with Defaults

**From `src/atomic-crm/validation/contacts.ts`:**

```typescript
import { z } from "zod";

// Sub-schemas for JSONB arrays
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

// Main schema
const contactBaseSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  title: z.string().optional().nullable(),

  // JSONB arrays with defaults
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),

  // Optional fields with defaults
  linkedin_url: z
    .string()
    .refine((url) => {
      if (!url) return true;
      return url.match(/^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//) !== null;
    }, { message: "URL must be from linkedin.com" })
    .optional()
    .nullable(),
});

export const contactSchema = contactBaseSchema;
export type Contact = z.infer<typeof contactSchema>;
```

**Why this works:**
- Schema defines validation rules once
- `.default()` provides business logic defaults
- Type automatically inferred with `z.infer`
- Form defaults derived via `schema.partial().parse({})`

## React Hook Form Integration

### Pattern: Form with Zod Resolver

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@/atomic-crm/validation/contacts';

function ContactForm({ contact }: { contact?: Contact }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(contactSchema),
    // Get defaults from schema
    defaultValues: contact || contactSchema.partial().parse({}),
  });

  const onSubmit = async (data: Contact) => {
    try {
      await createContact(data);
      notify('Contact created', { type: 'success' });
      reset(); // Reset form to defaults
    } catch (error) {
      notify('Failed to create contact', { type: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name fields */}
      <div>
        <label htmlFor="first_name" className="text-sm font-medium">
          First Name *
        </label>
        <input
          {...register('first_name')}
          id="first_name"
          className="w-full px-4 py-2 border rounded-md"
        />
        {errors.first_name && (
          <p className="text-xs text-destructive mt-1">
            {errors.first_name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="last_name" className="text-sm font-medium">
          Last Name *
        </label>
        <input
          {...register('last_name')}
          id="last_name"
          className="w-full px-4 py-2 border rounded-md"
        />
        {errors.last_name && (
          <p className="text-xs text-destructive mt-1">
            {errors.last_name.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-md"
      >
        {isSubmitting ? 'Creating...' : 'Create Contact'}
      </button>
    </form>
  );
}
```

**Key Features:**
- `zodResolver` connects Zod schema to React Hook Form
- `defaultValues` from `schema.partial().parse({})`
- `errors` object has type-safe error messages
- `isSubmitting` tracks form submission state
- `reset()` resets to defaults after submission

## JSONB Array Inputs

JSONB arrays (email, phone) require special handling with `useFieldArray`.

### Pattern: Array Input with Add/Remove

```typescript
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@/atomic-crm/validation/contacts';

function ContactForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: contactSchema.partial().parse({}),
  });

  // Email array
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control,
    name: 'email',
  });

  // Phone array
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: 'phone',
  });

  const onSubmit = async (data: Contact) => {
    console.log(data); // email and phone are arrays
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email array */}
      <div>
        <label className="text-sm font-medium">Email Addresses</label>
        {emailFields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mt-2">
            <input
              {...register(`email.${index}.email`)}
              placeholder="email@example.com"
              className="flex-1 px-4 py-2 border rounded-md"
            />
            <select
              {...register(`email.${index}.type`)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="Work">Work</option>
              <option value="Home">Home</option>
              <option value="Other">Other</option>
            </select>
            <button
              type="button"
              onClick={() => removeEmail(index)}
              className="px-3 py-2 border rounded-md"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => appendEmail({ email: '', type: 'Work' })}
          className="mt-2 px-4 py-2 border rounded-md"
        >
          Add Email
        </button>
        {errors.email && (
          <p className="text-xs text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Phone array (similar pattern) */}
      <div>
        <label className="text-sm font-medium">Phone Numbers</label>
        {phoneFields.map((field, index) => (
          <div key={field.id} className="flex gap-2 mt-2">
            <input
              {...register(`phone.${index}.number`)}
              placeholder="555-1234"
              className="flex-1 px-4 py-2 border rounded-md"
            />
            <select
              {...register(`phone.${index}.type`)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="Work">Work</option>
              <option value="Home">Home</option>
              <option value="Other">Other</option>
            </select>
            <button
              type="button"
              onClick={() => removePhone(index)}
              className="px-3 py-2 border rounded-md"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => appendPhone({ number: '', type: 'Work' })}
          className="mt-2 px-4 py-2 border rounded-md"
        >
          Add Phone
        </button>
      </div>

      <button type="submit" className="px-6 py-3 bg-primary text-primary-foreground rounded-md">
        Create Contact
      </button>
    </form>
  );
}
```

**Key Points:**
- `useFieldArray` manages array state
- `fields` array with unique `id` for keys
- `append` adds new item with default values
- `remove(index)` deletes item at index
- Register with array syntax: `email.${index}.email`

## Tabbed Forms

Large forms split into tabs for better UX.

### Pattern: Tabbed Form

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function OpportunityForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(opportunitySchema),
    defaultValues: opportunitySchema.partial().parse({}),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            General
            {/* Error badge if errors in this tab */}
            {(errors.name || errors.description) && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                !
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div>
            <label htmlFor="name">Opportunity Name *</label>
            <input {...register('name')} id="name" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <textarea {...register('description')} id="description" rows={4} />
          </div>
        </TabsContent>

        <TabsContent value="classification" className="space-y-4">
          <div>
            <label htmlFor="stage">Stage</label>
            <select {...register('stage')} id="stage">
              <option value="new_lead">New Lead</option>
              <option value="initial_outreach">Initial Outreach</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority">Priority</label>
            <select {...register('priority')} id="priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          {/* Relationship fields */}
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 justify-end mt-6">
        <button type="button" className="px-6 py-3 border rounded-md">
          Cancel
        </button>
        <button type="submit" className="px-6 py-3 bg-primary text-primary-foreground rounded-md">
          Create Opportunity
        </button>
      </div>
    </form>
  );
}
```

**Error Indicators:**
- Show error badge on tab with errors
- Count total errors per tab
- Auto-focus first tab with errors on submit

## Accessible Form Design

### Pattern: Accessible Form Field

```typescript
function FormField({ name, label, required, register, error }: FormFieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="space-y-2">
      {/* Label with required indicator */}
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      {/* Input with ARIA attributes */}
      <input
        {...register(name)}
        id={id}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : helpId}
        className={cn(
          "w-full px-4 py-2 border rounded-md",
          error ? "border-destructive" : "border-input"
        )}
      />

      {/* Helper text */}
      {!error && (
        <p id={helpId} className="text-xs text-muted-foreground">
          Enter a valid {label.toLowerCase()}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
```

**Accessibility Features:**
- `<label htmlFor>` associates label with input
- `aria-invalid` signals validation state
- `aria-describedby` links to error/help text
- `role="alert"` announces errors to screen readers
- Required indicator (*) visually and semantically

## Best Practices

### DO

✅ Use Zod schemas for validation
✅ Derive form defaults from schema (`schema.partial().parse({})`)
✅ Use React Hook Form with `zodResolver`
✅ Show validation errors inline below fields
✅ Disable submit button while submitting
✅ Use `useFieldArray` for JSONB array inputs
✅ Associate labels with inputs (`htmlFor` + `id`)
✅ Mark required fields with `*`
✅ Provide helpful error messages
✅ Reset form after successful submission

### DON'T

❌ Duplicate validation logic (use Zod once)
❌ Hardcode default values (derive from schema)
❌ Show errors before user interacts (wait for blur/submit)
❌ Use non-semantic div/span for form elements
❌ Forget to disable submit during submission
❌ Use uncontrolled inputs (use React Hook Form)
❌ Skip accessibility attributes (aria-*, role)
❌ Show generic error messages ("Invalid input")

## Related Resources

- [TypeScript Patterns](typescript-patterns.md) - Zod schema inference
- [State Management](state-management.md) - Form state patterns
- [Component Architecture](component-architecture.md) - Form component patterns

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
