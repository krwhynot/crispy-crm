# Organization Form Refactor - Shared Patterns & Conventions

This document contains common patterns, code conventions, and reference implementations that all agents should follow during implementation.

---

## Engineering Constitution

**CRITICAL:** All agents MUST adhere to these principles:

1. **NO OVER-ENGINEERING**: No circuit breakers, health monitoring, or backward compatibility. Fail fast.
2. **SINGLE SOURCE OF TRUTH**: Supabase for data, Zod at API boundary only
3. **BOY SCOUT RULE**: Fix inconsistencies when editing files
4. **VALIDATION**: Zod schemas at API boundary only (`src/atomic-crm/validation/`)
5. **TYPESCRIPT**: `interface` for objects/classes, `type` for unions/intersections
6. **FORMS**: Always use admin layer (`src/components/admin/`) for validation/errors
7. **COLORS**: Semantic CSS variables only (--primary, --destructive). Never hex codes
8. **MIGRATIONS**: Timestamp format YYYYMMDDHHMMSS (e.g., `20250107000000_migration_name.sql`)

---

## Common Patterns

### React Admin Component Structure

All organization feature files follow this pattern:

```typescript
// Standard imports
import { ... } from "react-admin";
import { ... } from "@/components/ui/..."; // shadcn/ui components
import { ... } from "@/components/admin/..."; // React Admin wrappers

// Feature-specific imports
import { ... } from "../validation/...";
import { ... } from "../types";

export const ComponentName = (props: ComponentProps) => {
  // Hooks first
  const notify = useNotify();
  const dataProvider = useDataProvider();

  // State
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleAction = async () => {
    // Implementation
  };

  // Render
  return (
    <Component {...props}>
      {/* Content */}
    </Component>
  );
};
```

### Zod Schema Pattern

All validation schemas in `src/atomic-crm/validation/`:

```typescript
import { z } from "zod";

// Schema definition
export const resourceSchema = z.object({
  id: z.number().optional(), // or z.string().uuid() for new tables
  name: z.string().min(1, "Name is required"),
  // ... other fields
});

// Type export
export type Resource = z.infer<typeof resourceSchema>;

// Partial schemas for updates
export const resourceUpdateSchema = resourceSchema.partial();
```

### Data Provider Integration

Pattern for adding resources to `unifiedDataProvider.ts`:

```typescript
// In the main switch/case for resource types
case 'resource-name':
  if (type === 'create') {
    // Validate
    const validated = resourceSchema.parse(params.data);

    // Insert
    const { data, error } = await supabaseClient
      .from('table_name')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;
    return { data };
  }
  // ... other CRUD operations
  break;
```

---

## Database Migration Standards

### Migration File Template

```sql
-- YYYYMMDDHHMMSS_migration_description.sql

BEGIN;

-- 1. Create tables
CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_table_field ON table_name(field);

-- 3. Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "policy_name"
ON table_name FOR SELECT
USING (auth.role() = 'authenticated');

-- 5. Create functions (if needed)
CREATE OR REPLACE FUNCTION function_name(params)
RETURNS return_type AS $$
BEGIN
  -- Implementation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

### RLS Policy Patterns

**Read Access (All Authenticated):**
```sql
CREATE POLICY "Allow authenticated read access"
ON table_name FOR SELECT
USING (auth.role() = 'authenticated');
```

**Write Access (All Authenticated):**
```sql
CREATE POLICY "Allow authenticated users to create"
ON table_name FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

**Update/Delete (Owner Only):**
```sql
CREATE POLICY "Allow users to update own records"
ON table_name FOR UPDATE
USING (created_by = auth.uid());
```

---

## React Admin Field Patterns

### Reference Field (Foreign Key Display)

```typescript
<ReferenceField source="foreign_key_id" reference="table_name" link={false}>
  <TextField source="name" />
</ReferenceField>
```

### Required Field with Validation

```typescript
import { required } from "react-admin";

<TextInput
  source="field_name"
  label="Field Label"
  validate={required()}
  fullWidth
/>
```

### SelectInput with Enum Choices

```typescript
<SelectInput
  source="type_field"
  label="Type"
  choices={[
    { id: "value1", name: "Display Name 1" },
    { id: "value2", name: "Display Name 2" },
  ]}
  defaultValue="default_value"
  validate={required()}
  fullWidth
/>
```

### Filter Pattern

```typescript
import { FilterList, FilterListItem } from "react-admin";

<FilterList label="Category" icon={<Icon />}>
  <FilterListItem label="Option 1" value={{ field: "value1" }} />
  <FilterListItem label="Option 2" value={{ field: "value2" }} />
</FilterList>
```

---

## shadcn/ui Integration

### Combobox Pattern (for searchable dropdowns)

```typescript
import { Combobox } from "@/components/ui/combobox";
import { useInput } from "react-admin";

export const CustomCombobox = (props) => {
  const { field } = useInput(props);

  return (
    <Combobox
      value={field.value}
      onChange={field.onChange}
      options={options}
      placeholder="Select..."
      {...props}
    />
  );
};
```

---

## TypeScript Type Patterns

### Organization Types (Example)

```typescript
// Use type for unions/intersections
export type OrganizationType =
  | "customer"
  | "prospect"
  | "partner"
  | "principal"
  | "distributor"
  | "unknown";

// Use interface for objects
export interface Organization {
  id: number;
  name: string;
  organization_type: OrganizationType;
  industry_id: string | null;
  // ... other fields
}
```

---

## Import Organization

**Preferred Import Order:**
1. React imports
2. Third-party libraries (react-admin, etc.)
3. Internal UI components (`@/components/ui/...`)
4. Internal admin components (`@/components/admin/...`)
5. Local feature imports (validation, types, utils)

```typescript
import { useState } from "react";
import { useNotify, useDataProvider, TextField } from "react-admin";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/admin/FormInput";
import { organizationSchema } from "../validation/organizations";
import type { Organization } from "../types";
```

---

## Error Handling Patterns

### Data Provider Error Handling

```typescript
try {
  const { data, error } = await supabaseClient
    .from('table')
    .select();

  if (error) throw error;
  return { data };
} catch (error) {
  console.error('Operation failed:', error);
  notify('Operation failed', { type: 'error' });
  throw error; // Re-throw for React Admin to handle
}
```

### Form Validation Error Handling

```typescript
const validate = (values: FormData) => {
  const errors: Record<string, string> = {};

  try {
    schema.parse(values);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
    }
  }

  return errors;
};
```

---

## File Naming Conventions

- Components: PascalCase (e.g., `OrganizationList.tsx`)
- Utilities: camelCase (e.g., `dataProvider.ts`)
- Types: PascalCase (e.g., `Organization`)
- Validation: camelCase (e.g., `organizationSchema`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_PAGE_SIZE`)

---

## Common Pitfalls to Avoid

### ❌ Don't: Hardcode values in multiple files
```typescript
// Bad: Same array in 5 different files
const types = ["customer", "vendor", "partner"];
```

### ✅ Do: Use single source of truth
```typescript
// Good: Import from database or shared constant
import { organizationTypeSchema } from "../validation/organizations";
```

### ❌ Don't: Validate at multiple layers
```typescript
// Bad: Validation in component, provider, and database
if (!name || name.length < 1) throw new Error("Invalid");
```

### ✅ Do: Validate at API boundary only
```typescript
// Good: Zod schema at data provider entry point
const validated = schema.parse(data);
```

### ❌ Don't: Use hex colors
```typescript
// Bad
<div style={{ color: "#3b82f6" }}>Text</div>
```

### ✅ Do: Use semantic CSS variables
```typescript
// Good
<div className="text-primary">Text</div>
```

---

## Resource Registration Pattern

In `src/atomic-crm/root/CRM.tsx`:

```typescript
import { Resource } from "react-admin";

// ... inside Admin component
<Resource
  name="resource-name"
  list={ResourceList}
  show={ResourceShow}
  edit={ResourceEdit}
  create={ResourceCreate}
  icon={ResourceIcon}
/>
```

For lookup tables (like industries):
```typescript
<Resource name="industries" />
```

---

## Testing Standards

### Compilation Check
After each task, run:
```bash
npm run build
```

Or for type-checking only:
```bash
npx tsc --noEmit
```

### Expected Output
- Zero TypeScript errors
- Zero critical ESLint errors
- Warnings are acceptable if justified

---

## Git Commit Conventions

**NOT REQUIRED** for this implementation (agents don't commit), but for reference:

```
feat: add industries table and combobox input
fix: remove vendor from organization type enum
refactor: normalize industry to dedicated table
chore: update TypeScript types after migration
```

---

## Common Component Paths

Quick reference for frequently accessed files:

- **Forms:** `src/atomic-crm/organizations/OrganizationInputs.tsx`
- **List:** `src/atomic-crm/organizations/OrganizationList.tsx`
- **Show:** `src/atomic-crm/organizations/OrganizationShow.tsx`
- **Edit:** `src/atomic-crm/organizations/OrganizationEdit.tsx`
- **Create:** `src/atomic-crm/organizations/OrganizationCreate.tsx`
- **Filters:** `src/atomic-crm/organizations/OrganizationListFilter.tsx`
- **Card:** `src/atomic-crm/organizations/OrganizationCard.tsx`
- **Aside:** `src/atomic-crm/organizations/OrganizationAside.tsx`
- **Types:** `src/atomic-crm/organizations/OrganizationType.tsx`
- **Validation:** `src/atomic-crm/validation/organizations.ts`
- **Data Provider:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- **CRM Root:** `src/atomic-crm/root/CRM.tsx`

---

## SQL Helper Functions

### Case-Insensitive Matching
```sql
WHERE lower(trim(field)) = lower(trim('value'))
```

### Enum Type Modification
```sql
-- Rename old enum
ALTER TYPE enum_name RENAME TO enum_name_old;

-- Create new enum
CREATE TYPE enum_name AS ENUM ('val1', 'val2');

-- Update column with cast
ALTER TABLE table_name
ALTER COLUMN column_name TYPE enum_name
USING column_name::text::enum_name;

-- Drop old enum
DROP TYPE enum_name_old;
```

### Unique Index with Transform
```sql
CREATE UNIQUE INDEX idx_name_case_insensitive
ON table_name (lower(column_name));
```

---

## React Admin Hooks Reference

Common hooks used in this project:

- `useInput(props)` - Connect form field to React Hook Form
- `useGetList(resource, params)` - Fetch list of records
- `useGetOne(resource, params)` - Fetch single record
- `useCreate(resource, params)` - Create new record
- `useUpdate(resource, params)` - Update existing record
- `useDelete(resource, params)` - Delete record
- `useNotify()` - Show notification toast
- `useDataProvider()` - Access data provider directly
- `useRecordContext()` - Access current record in Show/Edit

---

## Final Reminders

1. **Always read requirements.md** before starting any task
2. **Follow Engineering Constitution** without exception
3. **Run compilation check** after every file modification
4. **Use exact SQL** from requirements for migrations
5. **Import from correct paths** (check existing files)
6. **Don't add features** not in requirements
7. **Fix inconsistencies** you find (Boy Scout Rule)
8. **Report errors immediately** - fail fast

---

## Questions During Implementation?

If you encounter unclear requirements:
1. Check requirements.md section 3 (Technical Approach)
2. Check this shared.md for patterns
3. Look at existing similar components in the codebase
4. If still unclear, note the ambiguity in your task report

**Remember:** It's better to ask than to guess and break something!
