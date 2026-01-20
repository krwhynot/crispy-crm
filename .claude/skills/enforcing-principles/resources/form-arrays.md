# Form: JSONB Array Inputs

## Purpose

Document patterns for JSONB array inputs using ArrayInput and SimpleFormIterator.

## Pattern: ArrayInput for JSONB Arrays

**From `src/atomic-crm/contacts/ContactInfoTab.tsx:35`:**

```typescript
import { ArrayInput } from "@/components/ra-wrappers/array-input";
import { SimpleFormIterator } from "@/components/ra-wrappers/simple-form-iterator";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";

const personalInfoTypes = [{ id: "work" }, { id: "home" }, { id: "other" }];

export const ContactInfoTab = () => {
  return (
    <div className="space-y-2">
      {/* Email array - NO defaultValue props */}
      <ArrayInput source="email" label="Email addresses" helperText={false}>
        <SimpleFormIterator inline disableReordering disableClear>
          <TextInput
            source="value"
            className="w-full"
            placeholder="Email (valid email required)"
            helperText={false}
            label={false}
          />
          <SelectInput
            source="type"
            choices={personalInfoTypes}
            optionText="id"
            helperText={false}
            label={false}
            className="w-24 min-w-24"
            {/* NO defaultValue - comes from Zod sub-schema */}
          />
        </SimpleFormIterator>
      </ArrayInput>

      {/* Phone array - same pattern */}
      <ArrayInput source="phone" label="Phone numbers" helperText={false}>
        <SimpleFormIterator inline disableReordering disableClear>
          <TextInput source="value" placeholder="Phone number" />
          <SelectInput source="type" choices={personalInfoTypes} />
        </SimpleFormIterator>
      </ArrayInput>
    </div>
  );
};
```

**Zod Sub-Schema:**

```typescript
// src/atomic-crm/validation/contacts.ts
export const personalInfoTypeSchema = z.enum(["work", "home", "other"]);

export const emailAndTypeSchema = z.object({
  value: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("work"), // Default in sub-schema
});

export const phoneNumberAndTypeSchema = z.object({
  value: z.string(),
  type: personalInfoTypeSchema.default("work"), // Default in sub-schema
});

const contactBaseSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});
```

**How It Works:**

```typescript
// 1. Form initialization
const formDefaults = contactSchema.partial().parse({});
// Result: { email: [], phone: [] }

// 2. User clicks "Add" button in ArrayInput
// SimpleFormIterator creates new item with sub-schema defaults:
{ value: "", type: "work" } // From emailAndTypeSchema.default("work")

// 3. User fills in email, type is already "Work"
// 4. On save, data is validated against schema
```

## WRONG: Defaults in Form Component

```typescript
// ❌ WRONG - defaultValue in SelectInput
<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="value" />
    <SelectInput source="type" choices={types} defaultValue="work" />
    {/* ^^^ WRONG - default should be in Zod sub-schema */}
  </SimpleFormIterator>
</ArrayInput>

// ❌ WRONG - Hardcoded initial array in component
const [emails, setEmails] = useState([{ value: '', type: 'work' }]);

// ❌ WRONG - Initializing array in useEffect
useEffect(() => {
  setValue('email', [{ value: '', type: 'work' }]);
}, []);
```

## Database Migration

```sql
-- JSONB arrays default to empty array
ALTER TABLE contacts
ADD COLUMN email JSONB DEFAULT '[]'::jsonb,
ADD COLUMN phone JSONB DEFAULT '[]'::jsonb;
```

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Array defaults | Sub-schema with `.default()` | `defaultValue` prop |
| Form initialization | `schema.partial().parse({})` | useState with array |
| New item defaults | Defined in Zod sub-schema | Set in SimpleFormIterator |

## Related Resources

- [form-defaults.md](form-defaults.md) - Core form defaults pattern
- [form-patterns.md](form-patterns.md) - Tabbed forms, submission
- [validation-arrays.md](validation-arrays.md) - JSONB array validation

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
