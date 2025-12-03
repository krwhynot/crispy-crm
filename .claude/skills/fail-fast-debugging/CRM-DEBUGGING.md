# Crispy CRM Debugging Patterns

## Table of Contents
1. [React Admin Issues](#react-admin-issues)
2. [Supabase / RLS Issues](#supabase--rls-issues)
3. [Data Provider Issues](#data-provider-issues)
4. [Form State Issues](#form-state-issues)
5. [Common Error Patterns](#common-error-patterns)

---

## React Admin Issues

### Component Not Rendering

**Investigation Steps:**
1. Check if resource is registered in `App.tsx` or resource config
2. Verify the component is exported correctly
3. Check React Admin's `useRecordContext()` - is the record available?
4. Look for hydration mismatches (server vs client)

**Common Causes:**
- Missing `<Resource>` registration
- Incorrect resource name (case-sensitive!)
- Record not loaded yet (missing loading state)

### List View Empty

**Investigation Steps:**
1. Check browser Network tab - is the API call succeeding?
2. Verify `unifiedDataProvider.getList()` response format
3. Check RLS policies for the table
4. Look for `deleted_at IS NULL` filter issues

**Common Causes:**
- RLS policy blocking all rows
- Data provider returning wrong format (`{ data: [], total: 0 }` required)
- Filter params not matching expected schema

### Edit Form Not Populating

**Investigation Steps:**
1. Check `useRecordContext()` value
2. Verify `getOne()` returns correct data shape
3. Check Zod schema matches API response
4. Look for field name mismatches

**Common Causes:**
- Record ID not passed correctly
- Zod schema stricter than actual data
- Field names don't match (snake_case vs camelCase)

---

## Supabase / RLS Issues

### RLS Policy Debugging Flow

```sql
-- Step 1: Check what auth.uid() sees
SELECT auth.uid();

-- Step 2: Check policy definitions
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Step 3: Test query as authenticated user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM your_table;
```

### "New row violates RLS policy"

**Investigation Steps:**
1. Check INSERT policy exists (separate from SELECT!)
2. Verify user has correct role/organization
3. Check if required fields are missing (org_id, user_id, etc.)

**Common Causes:**
- No INSERT policy (only SELECT defined)
- User not member of required organization
- Required field like `organization_id` not included in insert

### Query Returns Empty But Data Exists

**Investigation Steps:**
1. Query as service_role key (bypasses RLS) to confirm data exists
2. Check if `deleted_at IS NULL` is correctly applied
3. Verify user's organization membership
4. Check for date/time filtering issues

**Common Causes:**
- RLS filtering based on organization user doesn't belong to
- Soft-deleted records (`deleted_at IS NOT NULL`)
- Junction table relationship missing

---

## Data Provider Issues

### Debugging unifiedDataProvider

**Key file:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Add diagnostic logging:**
```typescript
// At API boundary, log request and response
console.log('[DataProvider] Method:', method, 'Resource:', resource, 'Params:', params);
// After Supabase call
console.log('[DataProvider] Response:', data, 'Error:', error);
```

### Zod Validation Errors

Zod errors are intentionally loud (fail-fast principle). When you see them:

1. **Don't add `.optional()` or `.catch()`** - fix the data!
2. Read the full Zod error - it tells you EXACTLY what's wrong
3. Check if API response changed (new field, renamed field)
4. Verify schema matches database column types

**Common Zod Issues:**
- `null` vs `undefined` mismatch
- Date strings not matching expected format
- Missing required fields
- Array when expecting single value

### Junction Table Issues

**Key tables:**
- `contact_organizations` - Links contacts to organizations
- (NOT `Contact.company_id` - this is deprecated!)

**Investigation:**
1. Check junction table has required foreign keys
2. Verify RLS policies on junction table itself
3. Check if join query includes junction table

---

## Form State Issues

### Form Not Submitting

**Investigation Steps:**
1. Check browser console for validation errors
2. Verify all required fields have values
3. Check if form is in "pristine" state (no changes detected)
4. Look for disabled submit button conditions

**Common Causes:**
- Hidden required field with no default
- Validation error not visible (off-screen)
- Form reset after submission attempt

### Default Values Not Applied

**Pattern:** Use `zodSchema.partial().parse({})` for defaults

```typescript
// Correct - gets defaults from schema
const defaultValues = opportunitySchema.partial().parse({});

// Wrong - hardcoded defaults that drift from schema
const defaultValues = { stage: 'new_lead', ... };
```

### Form Shows Wrong Data

**Investigation Steps:**
1. Check if using correct record ID
2. Verify `key` prop on form component (forces remount on ID change)
3. Check for stale cache in React Query
4. Look for useEffect dependencies missing record ID

---

## Common Error Patterns

### "Cannot read property X of undefined"

**Investigation:**
1. Which variable is undefined?
2. Why is it undefined at this point in execution?
3. Is it a timing issue (data not loaded yet)?
4. Is it a missing relationship (junction table)?

**NOT the fix:** Adding `?.` everywhere. Find WHY it's undefined.

### "Unique constraint violation"

**Investigation:**
1. Which column(s) have the unique constraint?
2. What value is being duplicated?
3. Is this a race condition (double-submit)?
4. Is soft-delete hiding existing records?

### "Foreign key constraint violation"

**Investigation:**
1. Which foreign key is failing?
2. Does the referenced record exist?
3. Is the referenced record soft-deleted?
4. Are you using the correct ID field?

### TypeScript "Type X is not assignable to type Y"

**Investigation:**
1. Read the FULL error - TypeScript errors are precise
2. Check if types are out of sync with database
3. Verify Zod schema generates correct type
4. Look for snake_case vs camelCase issues

---

## Debugging Checklist

### Before Starting

- [ ] Can I reproduce the issue consistently?
- [ ] Have I checked the browser console?
- [ ] Have I checked the Network tab?
- [ ] Have I checked Supabase logs?

### For Data Issues

- [ ] Does the query work in Supabase SQL Editor?
- [ ] Is RLS filtering unexpectedly?
- [ ] Is `deleted_at` filtering correctly?
- [ ] Are junction tables queried correctly?

### For UI Issues

- [ ] Is the record loaded before render?
- [ ] Are all required props passed?
- [ ] Is the component registered in App?
- [ ] Are field names correct (case-sensitive)?

### For Form Issues

- [ ] Are default values applied from schema?
- [ ] Are validation errors visible?
- [ ] Is the submit handler connected?
- [ ] Is Zod validation passing?
