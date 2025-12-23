# Organization Forms Investigation Results

*Investigation Date: 2025-12-23*
*E2E Testing revealed bugs in Organization forms - this document locates the relevant code.*

---

## 1. Search Logic (ILIKE Parse Error)

### Primary Location
- **File:** `src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts`
- **Function:** `transformQToIlikeSearch` (lines 74-101)
- **Searchable Fields:** `["name", "city", "state", "sector"]` (line 46)

### Current Pattern
```typescript
// Line 82-92 - Correctly wraps with wildcards
const searchTerm = `%${q}%`;

const orFilter = ORGANIZATIONS_SEARCH_FIELDS.reduce(
  (acc, field) => ({
    ...acc,
    [`${field}@ilike`]: searchTerm,  // e.g., "name@ilike": "%chicago%"
  }),
  {} as Record<string, string>
);
```

### Issue Location - Duplicate Check Hook
- **File:** `src/atomic-crm/organizations/useDuplicateOrgCheck.ts`
- **Line:** 82
- **Bug:** Missing wildcards in ILIKE pattern

```typescript
// Line 82 - CURRENT (BUG)
"name@ilike": name.trim(),  // Missing % wildcards!

// SHOULD BE
"name@ilike": `%${name.trim()}%`,  // or exact match: name.trim() without @ilike
```

### How Search Flow Works
1. User types in search box → `q` filter param
2. `organizationsCallbacks.beforeGetList` intercepts
3. `transformQToIlikeSearch` converts `q` to `@or` with ILIKE conditions
4. Sent to Supabase via ra-supabase-core data provider

---

## 2. Priority Dropdown

### Form Component
- **File:** `src/atomic-crm/organizations/OrganizationCompactForm.tsx`
- **Lines:** 47-55

```tsx
<FormFieldWrapper name="priority">
  <SelectInput
    source="priority"
    label="Priority"
    choices={PRIORITY_CHOICES}
    helperText={false}
    emptyText="Select priority"
  />
</FormFieldWrapper>
```

### SelectInput Implementation
- **File:** `src/components/admin/select-input.tsx`
- **Component Type:** Custom wrapper around Radix UI `<Select>`
- **Base UI:** `@/components/ui/select` (Radix primitives)

### Known Radix Issue (may cause click problems)
```typescript
// Line 225-231 - Workaround for Radix bug
<Select
  // FIXME https://github.com/radix-ui/primitives/issues/3135
  // Setting a key based on the value fixes an issue where onValueChange
  // was called with an empty string when the controlled value was changed.
  key={`select:${field.value?.toString() ?? emptyValue}`}
  value={field.value?.toString() || emptyValue}
  onValueChange={handleChangeWithCreateSupport}
>
```

### Priority Choices
- **File:** `src/atomic-crm/organizations/constants.ts`
- **Lines:** 41-46

```typescript
export const PRIORITY_CHOICES = [
  { id: "A", name: "A - High" },
  { id: "B", name: "B - Medium-High" },
  { id: "C", name: "C - Medium" },
  { id: "D", name: "D - Low" },
] as const;
```

### Potential Issue
The `handleChange` function (lines 143-154) may have issues with value type coercion. It finds the choice by string comparison:
```typescript
const choice = allChoices?.find((choice) => getChoiceValue(choice) === value);
```

---

## 3. Validation Schema (Whitespace Trim)

### Schema File
- **File:** `src/atomic-crm/validation/organizations.ts`
- **Lines:** 68-146 (main schema)

### Name Field Validation
- **Line:** 70
- **Current Implementation:** `.trim()` IS PRESENT

```typescript
name: z.string().trim().min(1, "Organization name is required").max(255, "Organization name too long"),
```

### URL Field Validations

**Website (line 50, used line 76):**
```typescript
const isValidUrl = z.string().url({ message: "Must be a valid URL" }).max(2048).or(z.literal(""));
// ...
website: isValidUrl.nullish(),
```

**LinkedIn URL (lines 52-63, used line 75):**
```typescript
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin.com\//;

const isLinkedinUrl = z.string().refine(
  (url) => {
    if (!url) return true;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
    } catch {
      return false;
    }
  },
  { message: "Must be a valid LinkedIn organization URL" }
);
// ...
linkedin_url: isLinkedinUrl.nullish(),
```

### Missing (Potential Issues)
1. **LinkedIn URL length limit:** `isLinkedinUrl` does NOT have `.max()` constraint (DoS risk per constitution)
2. **URL trim:** Neither URL validator has `.trim()` - leading/trailing whitespace not normalized

### Validation Entry Points
- `validateOrganizationForSubmission` (line 158) - main validation
- `validateCreateOrganization` (line 205) - create-specific
- `validateUpdateOrganization` (line 224) - update-specific

---

## 4. Duplicate Detection Dialog

### Dialog Component
- **File:** `src/atomic-crm/organizations/DuplicateOrgWarningDialog.tsx`
- **Lines:** 1-81

### Current Buttons (lines 67-75)
```tsx
<AlertDialogFooter>
  <AlertDialogCancel onClick={onCancel}>Change Name</AlertDialogCancel>
  <AlertDialogAction
    onClick={onProceed}
    disabled={isLoading}
    className="bg-warning text-warning-foreground hover:bg-warning/90"
  >
    {isLoading ? "Creating..." : "Create Anyway"}
  </AlertDialogAction>
</AlertDialogFooter>
```

### Missing: "View Existing" Button
Need to add a third button that:
1. Closes dialog
2. Navigates to the existing organization's show/edit page
3. Uses `duplicateOrg.id` from props

### Duplicate Check Hook
- **File:** `src/atomic-crm/organizations/useDuplicateOrgCheck.ts`
- **Function:** `checkForDuplicate` (lines 60-113)

### Trigger Mechanism
```typescript
// Line 80-86 - Makes getList call to find duplicates
const { data } = await dataProvider.getList<Company>("organizations", {
  filter: {
    "name@ilike": name.trim(),  // BUG: Missing wildcards
  },
  pagination: { page: 1, perPage: 10 },
  sort: { field: "id", order: "ASC" },
});
```

### Props Interface (lines 32-43)
```typescript
interface DuplicateOrgWarningDialogProps {
  open: boolean;
  duplicateName?: string;
  onCancel: () => void;
  onProceed: () => void;
  isLoading?: boolean;
  // MISSING: duplicateId for navigation
}
```

---

## Summary of Bugs to Fix

| Issue | File | Line(s) | Fix Required |
|-------|------|---------|--------------|
| ILIKE missing wildcards | `useDuplicateOrgCheck.ts` | 82 | Add `%` wildcards OR use exact match |
| Priority dropdown click | `select-input.tsx` | 143-154 | Investigate value type handling |
| LinkedIn URL no max length | `organizations.ts` | 52-63 | Add `.max(2048)` to schema |
| URL fields no trim | `organizations.ts` | 50, 52-63 | Add `.trim()` before `.url()` |
| Missing "View Existing" | `DuplicateOrgWarningDialog.tsx` | 67-75 | Add third button + navigation |
| Dialog missing duplicateId | `DuplicateOrgWarningDialog.tsx` | 32-43 | Add `duplicateId` prop |

---

## Related Files for Context

- `src/atomic-crm/organizations/OrganizationCreate.tsx` - Form that uses duplicate check
- `src/atomic-crm/organizations/OrganizationInputs.tsx` - Form inputs wrapper
- `src/atomic-crm/organizations/OrganizationCompactForm.tsx` - Actual form fields
- `src/atomic-crm/providers/supabase/callbacks/organizationsCallbacks.ts` - Search transformation
- `src/components/ui/select.tsx` - Base Radix Select component (if exists)
