# Troubleshooting Guide: DataProvider Validation Errors

## Overview

This guide covers systematic debugging and resolution of validation errors in the Atomic CRM's unified data provider. The error stack trace indicates a validation failure during contact creation at `unifiedDataProvider.ts:101`.

## Error Signature

```
[DataProvider Error] {
  method: 'create',
  resource: 'contacts',
  error: 'Validation failed',
  validationErrors: {...}
}
```

## System Architecture

### Validation Flow

```
ContactForm (UI)
    ↓
React Admin Form
    ↓
unifiedDataProvider.create() [line 330-353]
    ↓
processForDatabase() [line 164-176]
    ↓
transformData() [line 150+] - Apply transformations first
    ↓
validateData() [line 114-145] - Then validate transformed data
    ↓
ValidationService.validate() [line 141-159]
    ↓
validateContactForm() [line 243-280 in contacts.ts]
    ↓
contactSchema.parse() [Zod validation]
```

**Key Principle**: Transformations occur **before** validation. This order matters because transformations may add or modify fields that validation depends on.

---

## Common Issues and Solutions

### 1. Missing Required Fields

#### Symptoms
- Error: "Validation failed"
- validationErrors contains field names with "required" messages
- Common fields: `first_name`, `last_name`, `sales_id`, `email`

#### Root Causes
- Empty form submissions
- Frontend didn't send required data
- Field name mismatch between frontend and backend

#### Diagnostic Steps

```bash
# Check browser console for the actual validation errors
# Look for the full error object logged at unifiedDataProvider.ts:101

# Verify the form data being sent
console.log('Form data:', params.data);
```

#### Solutions

**Fix 1: Frontend Validation**
```tsx
// In ContactInputs.tsx
<TextInput
  source="first_name"
  label="First Name *"
  helperText="Required field"
  validate={required()} // Add this
/>
```

**Fix 2: Check Sales ID**
```typescript
// sales_id is always required per contacts.ts:116-120
// Check ReferenceInput in ContactInputs.tsx:181-194

<ReferenceInput
  reference="sales"
  source="sales_id"
  validate={required()} // Add this
>
```

**Fix 3: Email Validation**
```typescript
// At least one email required for contact creation (contacts.ts:308-316)
// Check ArrayInput at ContactInputs.tsx:108-134

// Ensure at least one email entry exists
if (!data.email || data.email.length === 0) {
  // Validation will fail
}
```

---

### 2. Invalid Email Format

#### Symptoms
- Error: "Invalid email address"
- validationErrors path: `email.0.value` or similar

#### Root Cause
- Email doesn't match regex pattern
- Email field is empty string (contacts.ts:249-259)

#### Diagnostic Commands

```javascript
// In browser console
const testEmail = "invalid-email";
const emailSchema = z.string().email();
emailSchema.safeParse(testEmail); // { success: false, error: ... }
```

#### Solutions

**Fix 1: Frontend Email Validation**
```tsx
// Add immediate feedback in ContactInputs.tsx:115-123
<TextInput
  source="email"
  type="email" // Browser validation
  placeholder="Email (valid email required)"
  validate={[required(), email()]} // React Admin validators
/>
```

**Fix 2: Handle Empty Emails**
```typescript
// In contacts.ts, validateContactForm already checks (line 246-280)
// Ensure frontend filters out empty email entries before submission

// In form submit handler
const filteredEmails = data.email.filter(e => e.value && e.value.trim());
if (filteredEmails.length === 0) {
  throw new Error('At least one email address is required');
}
```

---

### 3. Organization Relationship Errors

#### Symptoms
- Error: "One organization must be designated as primary"
- Error: "Only one organization can be designated as primary"
- validationErrors path: `organizations`

#### Root Cause
- Multi-organization validation at contacts.ts:171-234
- No primary organization OR multiple primary organizations
- Missing organization_id in relationship

#### Diagnostic Steps

```typescript
// Check organizations array structure
console.log('Organizations:', data.organizations);

// Expected structure:
[
  {
    organization_id: "123",
    is_primary_organization: true,
    purchase_influence: "High",
    decision_authority: "Decision Maker",
    role: "decision_maker"
  }
]

// Count primary orgs
const primaryCount = data.organizations.filter(
  org => org.is_primary_organization
).length;
console.log('Primary org count:', primaryCount); // Should be exactly 1
```

#### Solutions

**Fix 1: Ensure One Primary**
```typescript
// In MultiOrganizationInput.tsx or form submit handler
const hasPrimary = organizations.some(org => org.is_primary_organization);
if (!hasPrimary && organizations.length > 0) {
  // Auto-set first as primary
  organizations[0].is_primary_organization = true;
}
```

**Fix 2: Prevent Multiple Primary**
```typescript
// In MultiOrganizationInput.tsx
const handlePrimaryToggle = (index: number) => {
  const updated = organizations.map((org, i) => ({
    ...org,
    is_primary_organization: i === index
  }));
  setValue('organizations', updated);
};
```

**Fix 3: Validate Organization IDs**
```typescript
// Ensure every org relationship has organization_id (contacts.ts:210-219)
organizations.forEach((org, index) => {
  if (!org.organization_id) {
    throw new Error(`Organization #${index + 1} is missing organization_id`);
  }
});
```

---

### 4. LinkedIn URL Format Errors

#### Symptoms
- Error: "URL must be from linkedin.com"
- validationErrors path: `linkedin_url`

#### Root Cause
- LinkedIn validation regex at contacts.ts:40-57
- URL doesn't match pattern: `http(s)://www.linkedin.com/...`

#### Diagnostic Steps

```javascript
// Test URL format
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin.com\//;
const url = "linkedin.com/in/user"; // Missing https://
LINKEDIN_URL_REGEX.test(url); // false
```

#### Solutions

**Fix 1: Frontend URL Normalization**
```typescript
// In ContactInputs.tsx:160-164
const normalizeLinkedInUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('linkedin.com')) {
    return `https://www.${url}`;
  }
  if (url.startsWith('www.linkedin.com')) {
    return `https://${url}`;
  }
  return url;
};

<TextInput
  source="linkedin_url"
  parse={normalizeLinkedInUrl}
/>
```

**Fix 2: Better Helper Text**
```tsx
<TextInput
  source="linkedin_url"
  label="LinkedIn URL"
  helperText="Format: https://linkedin.com/in/username"
  placeholder="https://www.linkedin.com/in/username"
/>
```

---

### 5. Legacy Field Errors

#### Symptoms
- Error: "Field 'company_id' is no longer supported"
- Error: "Field 'role' is no longer supported at contact level"
- Similar errors for: `department`, `is_primary_contact`, `purchase_influence`, `decision_authority`

#### Root Cause
- System migrated to multi-organization model
- Old code still sending legacy fields (contacts.ts:137-169)

#### Diagnostic Steps

```typescript
// Check form data for legacy fields
const LEGACY_FIELDS = [
  'company_id', 'role', 'department',
  'is_primary_contact', 'purchase_influence', 'decision_authority'
];

LEGACY_FIELDS.forEach(field => {
  if (field in data) {
    console.error(`Legacy field detected: ${field}`);
  }
});
```

#### Solutions

**Fix 1: Remove Legacy Fields**
```typescript
// Before validation, strip legacy fields
const LEGACY_FIELDS = [...];
const cleanData = { ...data };
LEGACY_FIELDS.forEach(field => delete cleanData[field]);
```

**Fix 2: Migration Helper**
```typescript
// In unifiedDataProvider.ts, before processForDatabase
const migrateContactData = (data: any) => {
  const migrated = { ...data };

  // Migrate company_id to organizations
  if (data.company_id) {
    migrated.organizations = [{
      organization_id: data.company_id,
      is_primary_organization: true,
      role: data.role || 'unknown',
      purchase_influence: data.purchase_influence || 'Unknown',
      decision_authority: data.decision_authority || 'End User'
    }];
    delete migrated.company_id;
    delete migrated.role;
    delete migrated.purchase_influence;
    delete migrated.decision_authority;
  }

  return migrated;
};
```

---

### 6. Database Constraint Errors

#### Symptoms
- Error: "duplicate key value violates unique constraint"
- Error: "foreign key constraint violation"
- Error: "null value in column violates not-null constraint"

#### Root Cause
- Validation passed but database rejected the data
- Missing or invalid foreign keys
- Unique constraint violations

#### Diagnostic Steps

```sql
-- Check for duplicate emails (via Supabase SQL editor)
SELECT email, COUNT(*)
FROM contacts
WHERE deleted_at IS NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Check foreign key references
SELECT id, first_name, last_name
FROM sales
WHERE disabled = false;
```

#### Solutions

**Fix 1: Check Foreign Keys**
```typescript
// Ensure sales_id exists
const validSalesIds = await dataProvider.getList('sales', {
  filter: { disabled: false },
  pagination: { page: 1, perPage: 100 }
});

if (!validSalesIds.data.find(s => s.id === data.sales_id)) {
  throw new Error('Invalid sales_id - account manager not found');
}
```

**Fix 2: Handle Unique Constraints**
```typescript
// Check for existing email before creation
const existing = await dataProvider.getList('contacts', {
  filter: { 'email@cs': JSON.stringify([{ email: newEmail }]) }
});

if (existing.total > 0) {
  throw new Error(`Contact with email ${newEmail} already exists`);
}
```

---

## Advanced Diagnostics

### Enabling Debug Mode

```typescript
// In unifiedDataProvider.ts:80-108
function logError(method, resource, params, error) {
  // Add this for detailed validation errors
  if (error?.errors) {
    console.error('[Validation Details]', {
      method,
      resource,
      submittedData: params.data,
      validationErrors: error.errors,
      errorPaths: Object.keys(error.errors)
    });
  }

  // Existing logging...
}
```

### Browser Console Commands

```javascript
// Check current form data (run in browser console)
// While on a contact form page:
const getFormData = () => {
  const inputs = document.querySelectorAll('input, select, textarea');
  const data = {};
  inputs.forEach(input => {
    if (input.name) data[input.name] = input.value;
  });
  return data;
};
console.table(getFormData());

// Monitor network requests for validation errors
// Open Network tab, filter by 'contacts', look for 400 responses

// Check localStorage for any cached form data
console.log('Form cache:', Object.keys(localStorage).filter(k => k.includes('form')));

// Inspect React Admin store state (if available in development)
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  console.log('Redux DevTools available - check state tree');
}
```

### Testing Validation Directly

```typescript
// In browser console or test file
import { validateContactForm } from '@/validation/contacts';

const testData = {
  first_name: 'John',
  last_name: 'Doe',
  sales_id: '1',
  email: [{ value: 'john@example.com', type: 'work' }],
  organizations: [{
    organization_id: '1',
    is_primary_organization: true
  }]
};

try {
  await validateContactForm(testData);
  console.log('✅ Validation passed');
} catch (error) {
  console.error('❌ Validation failed:', error);
}

// Quick validation test in browser console
// Copy this into DevTools console when on the CRM page:
const quickTest = async () => {
  const minimalValid = {
    first_name: 'Test',
    last_name: 'User',
    sales_id: '1',
    email: [{ value: 'test@example.com', type: 'work' }]
  };

  console.log('Testing minimal valid contact:', minimalValid);
  // Since validateContactForm isn't in global scope, test via form submission
  // or check network tab for validation errors
};
```

### Monitoring Validation Errors

```typescript
// Add to unifiedDataProvider.ts:114-145
async function validateData(resource, data, operation) {
  const startTime = performance.now();

  try {
    await validationService.validate(resource, operation, data);
    const duration = performance.now() - startTime;
    console.log(`✅ Validation passed for ${resource} (${duration.toFixed(2)}ms)`);
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ Validation failed for ${resource} (${duration.toFixed(2)}ms)`);

    // Log validation error details
    if (error.errors) {
      console.table(error.errors); // Pretty table in console
    }

    throw error;
  }
}
```

---

## Reference: Validation Schema Structure

### Contact Schema Overview (contacts.ts:100-234)

```typescript
contactSchema = z.object({
  // Required fields
  first_name: string (min 1)
  last_name: string (min 1)
  sales_id: string | number (not empty)

  // Optional arrays
  email: array of { value: string, type: "work" | "home" | "other" }
  phone: array of { value: string, type: "work" | "home" | "other" }
  organizations: array of organization relationships

  // Optional fields
  title, linkedin_url, gender, status, background, avatar
  has_newsletter, tags, organization_ids

  // Calculated fields (readonly)
  nb_tasks, company_name, total_organizations

  // System fields
  deleted_at
})
  .superRefine((data, ctx) => {
    // Multi-organization validation
    // - At least one org required (currently lenient)
    // - Exactly one primary org required
    // - Each org needs organization_id

    // Email format validation
    // - Each email must be valid format
  })
```

### Create vs Update Validation

```typescript
// CREATE (contacts.ts:283-297)
- Requires: first_name, last_name, sales_id
- Requires: at least one email (line 308-316)
- Omits: id, system fields, calculated fields

// UPDATE (contacts.ts:300-302)
- All fields optional except id
- More lenient than create
```

---

## Error Code Reference

### Validation Error Structure

```typescript
// React Admin expected format (unifiedDataProvider.ts:124-143)
{
  message: "Validation failed",
  errors: {
    "field_name": "Error message",
    "email.0.email": "Invalid email address",
    "organizations": "One organization must be designated as primary",
    "sales_id": "Account manager is required"
  }
}
```

### Common Error Paths

| Path | Meaning | Location |
|------|---------|----------|
| `first_name` | First name validation | contacts.ts:103 |
| `last_name` | Last name validation | contacts.ts:104 |
| `sales_id` | Account manager validation | contacts.ts:116-120 |
| `email` | Email array validation | contacts.ts:106, 308-316 |
| `email.0.value` | First email format | contacts.ts:224-232 |
| `organizations` | Multi-org validation | contacts.ts:176-220 |
| `organizations.0.organization_id` | First org ID | contacts.ts:210-219 |
| `linkedin_url` | LinkedIn format | contacts.ts:40-57 |

---

## Preventive Measures

### 1. Frontend Validation

```tsx
// Add React Admin validators to all required fields
import { required, email, minLength } from 'react-admin';

<TextInput source="first_name" validate={[required(), minLength(1)]} />
<TextInput source="email" validate={[required(), email()]} />
```

### 2. Form-Level Validation

```typescript
// In ContactCreate.tsx or ContactEdit.tsx
const validateContactForm = (values: any) => {
  const errors: any = {};

  if (!values.first_name) errors.first_name = 'Required';
  if (!values.last_name) errors.last_name = 'Required';
  if (!values.sales_id) errors.sales_id = 'Required';

  if (!values.email || values.email.length === 0) {
    errors.email = 'At least one email required';
  }

  if (values.organizations) {
    const primaryCount = values.organizations.filter(
      o => o.is_primary_organization
    ).length;
    if (primaryCount !== 1) {
      errors.organizations = 'Exactly one primary organization required';
    }
  }

  return errors;
};

<SimpleForm validate={validateContactForm}>
  {/* form inputs */}
</SimpleForm>
```

### 3. TypeScript Type Safety

```typescript
// Import types for compile-time checks
import type { Contact } from '@/atomic-crm/types';
import type { ContactInput } from '@/atomic-crm/validation/contacts';

// Use types in form handlers
const handleSubmit = (data: ContactInput) => {
  // TypeScript ensures data has required fields
};
```

### 4. Unit Tests

```typescript
// Create tests in src/atomic-crm/validation/__tests__/contacts/
describe('Contact Validation', () => {
  it('should require first_name, last_name, sales_id', async () => {
    const invalid = { email: [{ value: 'test@test.com', type: 'work' }] };

    await expect(validateContactForm(invalid))
      .rejects.toThrow('Validation failed');
  });

  it('should require valid email format', async () => {
    const invalid = {
      first_name: 'John',
      last_name: 'Doe',
      sales_id: '1',
      email: [{ value: 'not-an-email', type: 'work' }]
    };

    await expect(validateContactForm(invalid))
      .rejects.toThrow('Invalid email address');
  });

  it('should require exactly one primary organization', async () => {
    const invalid = {
      first_name: 'John',
      last_name: 'Doe',
      sales_id: '1',
      email: [{ value: 'john@example.com', type: 'work' }],
      organizations: [
        { organization_id: '1', is_primary_organization: false },
        { organization_id: '2', is_primary_organization: false }
      ]
    };

    await expect(validateContactForm(invalid))
      .rejects.toThrow('One organization must be designated as primary');
  });
});
```

---

## Troubleshooting Checklist

When encountering a validation error:

- [ ] **Check browser console** - Look for full error object with validationErrors
- [ ] **Identify error path** - Which field failed? (e.g., `email.0.email`)
- [ ] **Verify submitted data** - Log `params.data` before validation
- [ ] **Check required fields** - Ensure `first_name`, `last_name`, `sales_id`, `email` present
- [ ] **Validate email format** - Must be valid email address, not empty
- [ ] **Check organizations** - Exactly one primary, all have organization_id
- [ ] **Inspect LinkedIn URL** - Must start with `https://linkedin.com/`
- [ ] **Look for legacy fields** - Remove `company_id`, `role`, etc.
- [ ] **Test validation directly** - Use validateContactForm() in console
- [ ] **Check transformation** - Transformations run before validation
- [ ] **Review recent changes** - Did form inputs change? New fields added?

---

## Related Files

| File | Purpose | Line Reference |
|------|---------|----------------|
| `unifiedDataProvider.ts` | Main data provider, error logging | 101, 330-353 |
| `validation/contacts.ts` | Contact validation schemas | 100-320 |
| `ContactInputs.tsx` | Contact form UI | Full file |
| `ValidationService.ts` | Validation orchestration | 64-160 |
| `MultiOrganizationInput.tsx` | Organization relationships UI | - |

---

## Escalation

If validation errors persist after following this guide:

1. **Capture Full Context**
   ```typescript
   // In unifiedDataProvider.ts:101
   console.error('Full error context:', {
     method,
     resource,
     submittedData: params.data,
     validationErrors: error.errors,
     errorStack: error.stack,
     timestamp: new Date().toISOString()
   });
   ```

2. **Check Database Schema**
   ```bash
   npm run migrate:status
   # Ensure migrations are up to date
   ```

3. **Verify Environment**
   ```bash
   # Check Supabase connection
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

4. **Test with Minimal Data**
   ```typescript
   // Simplest valid contact
   const minimal = {
     first_name: 'Test',
     last_name: 'User',
     sales_id: '1',
     email: [{ value: 'test@example.com', type: 'work' }]
   };
   ```

5. **Contact Development Team**
   - Provide full error log from console
   - Include submitted data (sanitize sensitive info)
   - List steps to reproduce
   - Note browser/environment details

---

## Performance Notes

- Validation typically takes < 5ms
- Transformations (file uploads) can take 100ms+
- Total create operation: 200-500ms average
- Timeout threshold: 30 seconds

---

## Engineering Constitution Compliance

This troubleshooting guide follows the project's Engineering Constitution:

1. ✅ **NO OVER-ENGINEERING** - Simple, direct validation at API boundary
2. ✅ **SINGLE SOURCE OF TRUTH** - One validation layer (Zod schemas in `validation/`)
3. ✅ **BOY SCOUT RULE** - Fix inconsistencies when editing
4. ✅ **VALIDATION** - Zod schemas at API boundary only
5. ✅ **TYPESCRIPT** - Type-safe validation with Zod inference

---

## Quick Reference Card

### Most Common Fixes

| Error Message | Quick Fix |
|--------------|-----------|
| "First name is required" | Ensure `first_name` field is not empty |
| "Account manager is required" | Select a value in the Account Manager dropdown |
| "At least one email address is required" | Add at least one email entry |
| "Invalid email address" | Check email format (must be valid email) |
| "One organization must be designated as primary" | Toggle one organization as primary |
| "URL must be from linkedin.com" | Use format: `https://www.linkedin.com/in/username` |
| "Field 'company_id' is no longer supported" | Use organizations array instead |

### Debug Commands

```bash
# Check Supabase logs for errors
npm run supabase:logs

# Validate database schema is up to date
npm run migrate:status

# Test with minimal valid contact
curl -X POST $VITE_SUPABASE_URL/rest/v1/contacts \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","sales_id":"1","email":[{"value":"test@test.com","type":"work"}]}'
```

### Emergency Recovery

If validation is completely broken:

1. **Clear browser cache**: DevTools → Application → Clear Storage
2. **Check environment variables**: Ensure `VITE_SUPABASE_*` are set
3. **Verify migrations**: `npm run migrate:status`
4. **Test in incognito**: Rule out browser extensions/cache
5. **Rollback recent changes**: `git diff HEAD~1 src/atomic-crm/validation/`

---

*Last Updated: 2025-09-30*
*Version: 1.0*