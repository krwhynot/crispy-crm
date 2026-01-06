# View vs. Table Duality

## Table of Contents
1. [The Problem](#the-problem)
2. [The Solution](#the-solution)
3. [Implementation Rules](#implementation-rules)
4. [Field Stripping](#field-stripping)
5. [Common Views and Tables](#common-views-and-tables)

---

## The Problem

React Admin expects a **Single Resource** (e.g., `contacts`) for both reading and writing. However, our database uses:

- **Views (`contacts_summary`):** Optimized for reading with pre-computed fields
- **Tables (`contacts`):** Normalized storage for writes

### Why Views?

Views provide:
- **Pre-computed fields:** `total_opportunities`, `last_activity_date`
- **Joined data:** `organization_name` without extra queries
- **Performance:** Complex aggregations computed once
- **Simplicity:** Flat structure for React Admin lists

### The Conflict

```typescript
// This FAILS - View fields aren't writable
await supabase.from('contacts_summary').insert({
  first_name: 'John',
  organization_name: 'Acme Corp',  // ERROR! Computed field
});
```

---

## The Solution

**Read from Views, Write to Tables.**

```
┌─────────────────┐     ┌─────────────────┐
│  React Admin    │     │    Supabase     │
│                 │     │                 │
│  getList() ─────┼────►│ contacts_summary│ (VIEW)
│  getOne()  ─────┼────►│                 │
│                 │     │                 │
│  create()  ─────┼────►│ contacts        │ (TABLE)
│  update()  ─────┼────►│                 │
│  delete()  ─────┼────►│                 │
└─────────────────┘     └─────────────────┘
```

---

## Implementation Rules

### Rule 1: Reading (getList, getOne)

**Always query the View.**

```typescript
// CORRECT
const getList = async () => {
  const { data } = await supabase
    .from('contacts_summary')  // ← VIEW
    .select('*');
  return { data, total: data.length };
};

const getOne = async ({ id }) => {
  const { data } = await supabase
    .from('contacts_summary')  // ← VIEW
    .select('*')
    .eq('id', id)
    .single();
  return { data };
};
```

### Rule 2: Writing (create, update, delete)

**Always write to the Table.**

```typescript
// CORRECT
const create = async ({ data }) => {
  const cleanData = stripComputedFields(data);
  const { data: result } = await supabase
    .from('contacts')  // ← TABLE (not view!)
    .insert(cleanData)
    .select()
    .single();
  return { data: result };
};

const update = async ({ id, data }) => {
  const cleanData = stripComputedFields(data);
  const { data: result } = await supabase
    .from('contacts')  // ← TABLE
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();
  return { data: result };
};
```

### Rule 3: Soft Delete

**Always soft delete via Table.**

```typescript
const delete = async ({ id }) => {
  const { data } = await supabase
    .from('contacts')  // ← TABLE
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data };
};
```

---

## Field Stripping

### The Problem

React Admin forms may include view-only fields from `getOne()`. These must be stripped before writing.

### TransformService Pattern

```typescript
// src/services/TransformService.ts

export class TransformService {
  private static viewOnlyFields = {
    contacts: [
      'organization_name',
      'total_opportunities',
      'last_activity_date',
      'nb_notes',
      'days_since_contact',
    ],
    opportunities: [
      'contact_name',
      'organization_name',
      'principal_name',
      'days_in_stage',
      'probability_label',
    ],
    tasks: [
      'assignee_name',
      'contact_name',
      'organization_name',
    ],
  };

  static stripForWrite(resource: string, data: any): any {
    const fieldsToStrip = this.viewOnlyFields[resource] || [];
    const result = { ...data };

    for (const field of fieldsToStrip) {
      delete result[field];
    }

    return result;
  }
}
```

### Using in Callbacks

```typescript
// src/providers/supabase/callbacks/contactsCallbacks.ts

import { TransformService } from '@/services/TransformService';

export const contactsCallbacks = {
  beforeCreate: (data: any) => {
    return TransformService.stripForWrite('contacts', data);
  },

  beforeUpdate: (data: any) => {
    return TransformService.stripForWrite('contacts', data);
  },
};
```

### Inline Stripping (Alternative)

For simple cases, destructure inline:

```typescript
const contactsCallbacks = {
  beforeCreate: (data: any) => {
    const {
      organization_name,
      total_opportunities,
      last_activity_date,
      nb_notes,
      days_since_contact,
      ...writeableData
    } = data;
    return writeableData;
  },
};
```

---

## Common Views and Tables

### Contacts

| View: `contacts_summary` | Table: `contacts` |
|--------------------------|-------------------|
| `id` ✓ | `id` ✓ |
| `first_name` ✓ | `first_name` ✓ |
| `last_name` ✓ | `last_name` ✓ |
| `email` ✓ | `email` ✓ |
| `phone` ✓ | `phone` ✓ |
| `organization_name` ❌ | — |
| `total_opportunities` ❌ | — |
| `last_activity_date` ❌ | — |

✓ = Writable  ❌ = View-only (strip before write)

### Opportunities

| View: `opportunities_summary` | Table: `opportunities` |
|-------------------------------|------------------------|
| `id` ✓ | `id` ✓ |
| `name` ✓ | `name` ✓ |
| `stage` ✓ | `stage` ✓ |
| `amount` ✓ | `amount` ✓ |
| `contact_id` ✓ | `contact_id` ✓ |
| `contact_name` ❌ | — |
| `organization_name` ❌ | — |
| `days_in_stage` ❌ | — |

### Tasks

| View: `tasks_summary` | Table: `tasks` |
|-----------------------|----------------|
| `id` ✓ | `id` ✓ |
| `title` ✓ | `title` ✓ |
| `description` ✓ | `description` ✓ |
| `due_date` ✓ | `due_date` ✓ |
| `status` ✓ | `status` ✓ |
| `assigned_to` ✓ | `assigned_to` ✓ |
| `assignee_name` ❌ | — |
| `contact_name` ❌ | — |

---

## Debugging Tips

### Error: "Could not insert into view"

**Cause:** Writing to a view instead of table.

**Fix:**
```typescript
// WRONG
.from('contacts_summary')

// CORRECT
.from('contacts')
```

### Error: "Column does not exist"

**Cause:** Trying to write a computed field.

**Fix:** Add field to `viewOnlyFields` and strip before write.

### Error: "null value in column violates not-null"

**Cause:** Stripped a required field that shouldn't be stripped.

**Fix:** Check your `viewOnlyFields` list - only include truly computed fields.
