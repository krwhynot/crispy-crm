# Troubleshooting Guide: Data Validation Errors in Atomic CRM

## Overview

This guide addresses validation failures when creating or updating records in Atomic CRM. The error manifests as `[DataProvider Error] Validation failed` in the browser console, typically occurring during contact, organization, or opportunity creation/editing.

**System Component**: `unifiedDataProvider.ts:101` (Data Provider Layer)
**Error Pattern**: Validation failures at API boundary before database interaction
**Severity**: P2 (High) - User cannot complete their intended action

---

## Error Signature

```javascript
unifiedDataProvider.ts:101 [DataProvider Error] {
  method: 'create',
  resource: 'contacts',
  params: {…},
  timestamp: '2025-09-30T10:02:28.008Z'
}
{
  error: 'Validation failed',
  stack: undefined,
  validationErrors: {…},
  fullError: {…}
}
```

**Key Indicators:**
- Error originates from `unifiedDataProvider.ts:101` (logError function)
- Message: `"Validation failed"`
- Contains `validationErrors` object with field-specific errors
- Occurs during `create` or `update` operations

---

## Architecture Context

### Validation Flow

```
User Form Submission
    ↓
React Admin Form
    ↓
unifiedDataProvider.create/update (line 330+)
    ↓
processForDatabase() (line 164)
    ├─→ transformData() (line 150) - Handle file uploads, timestamps
    └─→ validateData() (line 114) - Zod schema validation ★
         ↓
    ValidationService.validate()
         ↓
    Resource-specific validator (e.g., validateCreateContact)
         ↓
    Zod Schema Parse (contacts.ts:317)
         ↓
    [SUCCESS] → Proceed to Supabase insert
    [FAILURE] → Throw formatted error → logError (line 101)
```

★ **Critical Point**: All validation happens at API boundary per Engineering Constitution #2

### Key Files

| File | Line(s) | Purpose |
|------|---------|---------|
| `unifiedDataProvider.ts` | 101 | Error logging point (where you see the error) |
| `unifiedDataProvider.ts` | 114-141 | validateData wrapper function |
| `unifiedDataProvider.ts` | 334-352 | create method entry point |
| `contacts.ts` | 100-233 | Contact validation schema (Zod) |
| `contacts.ts` | 304-332 | validateCreateContact function |
| `ValidationService.ts` | N/A | Validation orchestration service |

---

## Common Issues and Solutions

### 1. Missing Required Fields

**Symptom:**
```javascript
validationErrors: {
  "first_name": "First name is required",
  "last_name": "Last name is required",
  "sales_id": "Account manager is required"
}
```

**Root Cause:**
Contact creation requires:
- `first_name` (min 1 character)
- `last_name` (min 1 character)
- `sales_id` (cannot be empty/null)
- At least one email address
- At least one organization relationship

**Diagnostic Steps:**
```bash
# 1. Check browser console for specific validationErrors object
# 2. Inspect form data being submitted
console.log(params.data) // in unifiedDataProvider.ts:338

# 3. Verify form inputs are bound correctly
# Check ContactInputs.tsx for proper React Admin field names
```

**Solutions:**

**A. Frontend Form Fix:**
```typescript
// In ContactCreate.tsx or ContactEdit.tsx
<SimpleForm>
  <TextInput source="first_name" label="First Name" required />
  <TextInput source="last_name" label="Last Name" required />
  <ReferenceInput source="sales_id" reference="sales" required>
    <SelectInput optionText="name" />
  </ReferenceInput>
  {/* Ensure EmailInput properly populates email array */}
</SimpleForm>
```

**B. Check Field Bindings:**
```typescript
// Email field must be JSONB array structure
email: [
  { value: "user@example.com", type: "work" }
]

// NOT this:
email: "user@example.com" // ✗ Wrong format
```

**File Locations:**
- Frontend forms: `src/atomic-crm/contacts/ContactInputs.tsx`
- Validation rules: `src/atomic-crm/validation/contacts.ts:103-120`

---

### 2. Organization Relationship Errors

**Symptom:**
```javascript
validationErrors: {
  "organizations": "At least one organization relationship is required",
  "organizations": "One organization must be designated as primary"
}
```

**Root Cause:**
Contacts require multi-organization support with exactly one primary organization. Validation enforced in `contacts.ts:176-219`.

**Diagnostic Query:**
```sql
-- Check existing contact_organizations structure
SELECT * FROM contact_organizations
WHERE contact_id = <your_contact_id>
LIMIT 5;
```

**Solutions:**

**A. Frontend: Ensure Organization Array Structure:**
```typescript
// Correct structure:
organizations: [
  {
    organization_id: 123,
    is_primary_organization: true,
    purchase_influence: "High",
    decision_authority: "Decision Maker",
    role: "executive"
  }
]
```

**B. Validation Rules:**
- Minimum 1 organization required
- Exactly 1 must have `is_primary_organization: true`
- Each must have valid `organization_id`
- Cannot have multiple primary organizations

**Fix in ContactInputs.tsx:**
```typescript
// Ensure ContactMultiOrg component sets is_primary_organization
<ContactMultiOrg
  source="organizations"
  ensurePrimary={true}  // Custom logic to enforce one primary
/>
```

**File Locations:**
- Validation: `src/atomic-crm/validation/contacts.ts:176-219`
- Frontend component: `src/atomic-crm/contacts/ContactMultiOrg.tsx`

---

### 3. Email Validation Failures

**Symptom:**
```javascript
validationErrors: {
  "email.0.value": "Invalid email address",
  "email": "At least one email address is required"
}
```

**Root Cause:**
- Email format invalid (fails Zod email schema)
- Email array empty or missing
- Email object missing required `email` field

**Database Schema:**
```sql
-- contacts.email is JSONB array
email: jsonb DEFAULT '[]'::jsonb

-- Expected structure:
[{"value": "user@example.com", "type": "work"}]
```

**Diagnostic Steps:**
```javascript
// 1. Log email data structure before validation
console.log('Email data:', params.data.email);

// 2. Check if empty array
if (!params.data.email?.length) {
  console.error('No emails provided');
}

// 3. Validate each entry
params.data.email?.forEach((entry, i) => {
  console.log(`Email ${i}:`, entry.email);
});
```

**Solutions:**

**A. Ensure Email Array Structure:**
```typescript
// ✓ Correct
email: [
  { value: "valid@example.com", type: "work" }
]

// ✗ Wrong - missing array wrapper
email: { value: "valid@example.com", type: "work" }

// ✗ Wrong - empty object
email: [{ value: "", type: "work" }]
```

**B. Frontend Validation:**
```typescript
// In ContactInputs.tsx
<EmailInput
  source="email"
  validate={[required(), email()]}
  parse={value => {
    // Ensure array structure
    return Array.isArray(value) ? value : [value];
  }}
/>
```

**File Locations:**
- Validation: `src/atomic-crm/validation/contacts.ts:222-232`
- Email schema: `src/atomic-crm/validation/contacts.ts:63-66`

---

### 4. Sales ID (Account Manager) Missing

**Symptom:**
```javascript
validationErrors: {
  "sales_id": "Account manager is required"
}
```

**Root Cause:**
`sales_id` field is required but was `null`, `undefined`, or empty string.

**Validation Logic:**
```typescript
// contacts.ts:116-120
sales_id: z
  .union([z.string(), z.number()])
  .refine((val) => val !== undefined && val !== null && val !== "", {
    message: "Account manager is required"
  })
```

**Diagnostic Query:**
```sql
-- Check available sales people
SELECT id, name FROM sales WHERE deleted_at IS NULL;
```

**Solutions:**

**A. Ensure Default Value in Form:**
```typescript
// In ContactCreate.tsx
<Create>
  <SimpleForm defaultValues={{
    sales_id: getCurrentUserId() // or fetch from context
  }}>
    <ReferenceInput source="sales_id" reference="sales">
      <SelectInput optionText="name" />
    </ReferenceInput>
  </SimpleForm>
</Create>
```

**B. Check Database Constraint:**
```sql
-- Verify sales_id exists in sales table
SELECT EXISTS(
  SELECT 1 FROM sales WHERE id = <submitted_sales_id>
);
```

**File Location:**
- Validation: `src/atomic-crm/validation/contacts.ts:116-120`

---

### 5. Legacy Field Usage

**Symptom:**
```javascript
validationErrors: {
  "_error": "Field 'company_id' is no longer supported. Use contact_organizations relationship instead."
}
```

**Root Cause:**
Form is sending deprecated fields removed during "deals" → "opportunities" migration.

**Removed Fields:**
- `company_id` → Use `contact_organizations` array
- `role` (contact-level) → Use `role` in `contact_organizations`
- `department` → Define in `contact_organizations`
- `is_primary_contact` → Use `is_primary_organization`
- `purchase_influence` (contact-level) → Move to `contact_organizations`
- `decision_authority` (contact-level) → Move to `contact_organizations`

**Detection:**
```typescript
// Validation checks in contacts.ts:137-169
if ("company_id" in data) {
  throw new Error("Field 'company_id' is no longer supported...");
}
```

**Solutions:**

**A. Update Frontend Forms:**
```typescript
// Remove old fields:
- <ReferenceInput source="company_id" ... />
- <TextInput source="role" ... />

// Add new multi-org structure:
+ <ArrayInput source="organizations">
+   <SimpleFormIterator>
+     <ReferenceInput source="organization_id" reference="organizations">
+       <SelectInput optionText="name" />
+     </ReferenceInput>
+     <BooleanInput source="is_primary_organization" />
+     <SelectInput source="role" choices={contactRoleChoices} />
+   </SimpleFormIterator>
+ </ArrayInput>
```

**B. Data Migration Script (if needed):**
```sql
-- Migrate legacy company_id to contact_organizations
INSERT INTO contact_organizations (contact_id, organization_id, is_primary_organization)
SELECT id, company_id, true
FROM contacts
WHERE company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_organizations co
    WHERE co.contact_id = contacts.id
  );
```

**File Location:**
- Legacy field detection: `src/atomic-crm/validation/contacts.ts:137-169`

---

## Diagnostic Procedures

### Step-by-Step Investigation

#### 1. Identify the Error Context

```bash
# Check browser console for full error details
# Look for:
# - resource: 'contacts' | 'organizations' | 'opportunities'
# - method: 'create' | 'update'
# - validationErrors object
```

#### 2. Enable Detailed Logging

```typescript
// Temporarily add to unifiedDataProvider.ts:338
console.log('=== CREATE DEBUG ===');
console.log('Resource:', resource);
console.log('Params:', JSON.stringify(params, null, 2));
console.log('Data:', params.data);
```

#### 3. Check Validation Schema

```bash
# For contacts errors:
cat src/atomic-crm/validation/contacts.ts | grep -A 5 "export const contactSchema"

# Check required fields:
grep "required\|min(1)" src/atomic-crm/validation/contacts.ts
```

#### 4. Inspect Database Schema

```sql
-- Compare validation rules to database columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contacts'
ORDER BY ordinal_position;
```

#### 5. Test Validation Directly

```typescript
// In browser console (after opening DevTools):
import { validateCreateContact } from './validation/contacts';

const testData = {
  first_name: "John",
  last_name: "Doe",
  email: [{ value: "john@example.com", type: "work" }],
  sales_id: 1,
  organizations: [
    { organization_id: 1, is_primary_organization: true }
  ]
};

validateCreateContact(testData)
  .then(() => console.log('✓ Valid'))
  .catch(err => console.error('✗ Invalid:', err));
```

---

## Quick Reference Commands

### Check Logs
```bash
# View dev server console for server-side errors
npm run dev

# Check browser console for client-side validation errors
# Open DevTools → Console tab
```

### Database Inspection
```sql
-- View recent contact creation attempts
SELECT id, first_name, last_name, email, organizations
FROM contacts
ORDER BY created_at DESC
LIMIT 10;

-- Check contact_organizations relationships
SELECT
  c.id,
  c.first_name,
  c.last_name,
  co.organization_id,
  co.is_primary_organization,
  o.name as organization_name
FROM contacts c
LEFT JOIN contact_organizations co ON c.id = co.contact_id
LEFT JOIN organizations o ON co.organization_id = o.id
WHERE c.id = <contact_id>;
```

### Validation Testing
```bash
# Run validation unit tests
npm run test -- validation/contacts

# Check if tests exist
ls src/atomic-crm/validation/__tests__/contacts/
```

---

## Error Code Reference

| Error Message | Field | Root Cause | Fix |
|---------------|-------|------------|-----|
| "First name is required" | `first_name` | Empty/null value | Ensure form field is populated |
| "Last name is required" | `last_name` | Empty/null value | Ensure form field is populated |
| "Account manager is required" | `sales_id` | Null/empty/undefined | Select sales person from dropdown |
| "At least one email address is required" | `email` | Empty array or missing | Add email entry with valid format |
| "Invalid email address" | `email.N.value` | Malformed email | Check email format (must be valid email) |
| "URL must be from linkedin.com" | `linkedin_url` | Invalid URL domain | Use LinkedIn URL or leave empty |
| "At least one organization relationship is required" | `organizations` | Empty array | Add organization with ContactMultiOrg |
| "One organization must be designated as primary" | `organizations` | No `is_primary_organization: true` | Set one org as primary |
| "Only one organization can be designated as primary" | `organizations` | Multiple primary orgs | Ensure only one has `is_primary_organization: true` |
| "Field 'company_id' is no longer supported..." | `company_id` | Using legacy field | Migrate to `organizations` array |

---

## Preventive Measures

### 1. Form Validation

**Add Client-Side Validation:**
```typescript
// In ContactInputs.tsx
import { required, email, minLength } from 'react-admin';

<TextInput
  source="first_name"
  validate={[required(), minLength(1)]}
/>

<TextInput
  source="last_name"
  validate={[required(), minLength(1)]}
/>

<ReferenceInput
  source="sales_id"
  reference="sales"
  validate={[required()]}
>
  <SelectInput optionText="name" />
</ReferenceInput>
```

### 2. Default Values

**Set Sensible Defaults:**
```typescript
// In ContactCreate.tsx
<Create>
  <SimpleForm defaultValues={{
    email: [],
    phone: [],
    organizations: [],
    has_newsletter: false,
    tags: []
  }}>
    {/* form inputs */}
  </SimpleForm>
</Create>
```

### 3. E2E Testing

**Add Validation Tests:**
```typescript
// In playwright/tests/contacts-crud.spec.ts
test('should validate required fields on contact creation', async ({ page }) => {
  await page.getByTestId('create-button').click();

  // Try to save without filling required fields
  await page.getByRole('button', { name: /save/i }).click();

  // Expect validation errors to appear
  await expect(page.locator('text=First name is required')).toBeVisible();
  await expect(page.locator('text=Last name is required')).toBeVisible();
});
```

### 4. Database Constraints

**Verify Constraints Match Validation:**
```sql
-- Ensure database allows what validation allows
ALTER TABLE contacts
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL;

-- Validation handles required fields, not DB constraints
-- This prevents confusing dual error sources
```

---

## Escalation Path

### Severity Levels

**Critical (P1):** Validation prevents all record creation
- Immediate response required
- Check for schema migration issues
- Verify ValidationService is registered

**High (P2):** Validation fails for specific fields
- Response within 2 hours
- Investigate field-specific schemas
- Check frontend form bindings

**Medium (P3):** Sporadic validation failures
- Response within 8 hours
- Review data transformation logic
- Check for race conditions in async validation

### Contact Points

1. **First Response**: Check validation schema for the resource
   - File: `src/atomic-crm/validation/<resource>.ts`
   - Look for recent changes in git history

2. **Second Level**: Investigate data transformation
   - File: `src/atomic-crm/providers/supabase/services/TransformService.ts`
   - Check if transforms modify validated fields

3. **Third Level**: Review database schema alignment
   - Run: `npm run migrate:status`
   - Compare DB columns to validation schema

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md#validation) - Engineering Constitution validation principles
- [unifiedDataProvider.ts](../../src/atomic-crm/providers/supabase/unifiedDataProvider.ts) - Data provider implementation
- [contacts.ts](../../src/atomic-crm/validation/contacts.ts) - Contact validation schemas
- [Supabase Schema](../../supabase/migrations/) - Database migrations

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-09-30 | Claude | Initial troubleshooting guide created |

---

## Feedback

Found this guide helpful? Have suggestions for improvement? Please update this document or create an issue.

**Note**: This guide is auto-generated based on the actual error trace and codebase analysis. It should be kept in sync with validation schema changes.