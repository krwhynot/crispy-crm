# Test Cleanup Checklist

**Goal:** Remove tests that verify third-party library behavior
**Keep:** Tests that verify custom business logic, transformations, and validation rules
**Date Started:** 2025-10-31
**Reviewer:** [Your Name]

---

## Decision Criteria

### ❌ Remove Tests That:
- Verify Zod validates email formats correctly
- Test that React Admin's dataProvider calls work
- Check if Supabase client connects
- Verify third-party UI components render
- Test library internals we don't control

### ✅ Keep Tests That:
- Verify YOUR custom validation rules (e.g., "name OR first_name/last_name required")
- Test YOUR data transformations (e.g., computing name from first_name + last_name)
- Check YOUR business logic (e.g., opportunity requires products)
- Verify YOUR custom components and hooks
- Test integration between YOUR components and services

---

## Test Files Review Checklist

### Core Provider Tests (`src/atomic-crm/tests/`)

#### ☐ `dataProviderSchemaValidation.test.ts`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Does it test Zod schema validation or YOUR business rules?
- Does it test ra-supabase-core or YOUR provider customizations?

**Tests to Remove:**
```typescript
// Example: Testing that Zod works
❌ it('should validate email format', () => {
  expect(z.string().email().safeParse('invalid')).success).toBe(false);
});
```

**Tests to Keep:**
```typescript
// Example: Testing YOUR validation rule
✅ it('should require either name or first_name/last_name', () => {
  const result = contactSchema.safeParse({});
  expect(result.success).toBe(false);
  expect(result.error.issues[0].path).toContain('name');
});
```

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `unifiedDataProvider.test.ts`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Does it test ra-supabase-core internals?
- Does it test YOUR custom provider logic (transformations, error handling)?

**Tests to Remove:**
```typescript
// Example: Testing that ra-supabase-core calls supabase correctly
❌ it('should call supabase.from().select()', () => {
  // Testing library implementation
});
```

**Tests to Keep:**
```typescript
// Example: Testing YOUR transformation logic
✅ it('should normalize JSONB arrays before saving', () => {
  const normalized = normalizeJsonbArrayFields({ email: [] });
  expect(normalized.email).toBeNull(); // Your custom logic
});
```

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `dataProviderErrors.test.ts`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Does it test error handling in general or YOUR specific error scenarios?
- Does it test Supabase error responses or YOUR error transformation logic?

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `httpErrorPatterns.test.ts`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Does it test HTTP libraries or YOUR error pattern matching?

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

### Component Tests (`src/components/admin/__tests__/`)

#### ☐ `select-input.test.tsx`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Does it test React Admin's SelectInput component?
- Or does it test YOUR custom SelectInput wrapper?

**Tests to Remove:**
```typescript
// Example: Testing that React Admin SelectInput renders
❌ it('should render SelectInput with options', () => {
  render(<SelectInput source="type" choices={[...]} />);
  expect(screen.getByRole('combobox')).toBeInTheDocument();
});
```

**Tests to Keep:**
```typescript
// Example: Testing YOUR custom behavior
✅ it('should filter options based on organization type', () => {
  // YOUR custom filtering logic
});
```

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `text-input.test.tsx`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Does it test React Admin's TextInput?
- Or YOUR custom text input validation/behavior?

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `form.test.tsx`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Does it test React Admin form rendering?
- Or YOUR custom form validation/submission logic?

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `test-ra-form.test.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `test-form-context.test.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

### Organization Tests (`src/atomic-crm/organizations/`)

#### ☐ `OrganizationType.spec.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `organizationImport.logic.test.ts`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Tests YOUR import transformation logic? → **KEEP**
- Tests PapaParse library? → **REMOVE**

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `OrganizationList.spec.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `OrganizationImportDialog.test.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `OrganizationInputs.test.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `organizationColumnAliases.test.ts`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

### Provider Tests (`src/atomic-crm/providers/`)

#### ☐ `getOrganizationAvatar.spec.tsx`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Tests YOUR avatar generation logic? → **KEEP**

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `getContactAvatar.spec.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `dataProvider.spec.ts`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `services.integration.test.ts`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Integration tests are valuable → **KEEP unless redundant**

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `dataProviderUtils.transform.test.ts`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Tests YOUR utility transformations? → **KEEP**

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

### Opportunity Tests (`src/atomic-crm/opportunities/`)

#### ☐ `OpportunityInputs.spec.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `OpportunityList.spec.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `OpportunityCreate.spec.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `OpportunityWorkflows.spec.tsx`
**Purpose:** [Describe what this file tests]

**Review Questions:**
- Tests YOUR workflow logic? → **KEEP**

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

#### ☐ `OpportunityShow.spec.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

### Contact Tests (`src/atomic-crm/contacts/`)

#### ☐ `ContactList.spec.tsx`
**Purpose:** [Describe what this file tests]

**Action Taken:**
- [ ] Reviewed
- [ ] Tests removed: [List]
- [ ] Tests kept: [List]
- [ ] Coverage verified: [ ]%

---

## Overall Summary

### Statistics
- **Total test files reviewed:** [ ] / 25+
- **Test files removed entirely:** [ ]
- **Test files modified:** [ ]
- **Test files kept as-is:** [ ]
- **Individual tests removed:** [ ]
- **Individual tests kept:** [ ]

### Coverage Impact
**Before cleanup:**
- Statements: [ ]%
- Branches: [ ]%
- Functions: [ ]%
- Lines: [ ]%

**After cleanup:**
- Statements: [ ]%
- Branches: [ ]%
- Functions: [ ]%
- Lines: [ ]%

**Coverage change:** [ ]+/-

### Time Saved
**Before:**
- Test run time: [ ] seconds
- Tests executed: [ ]

**After:**
- Test run time: [ ] seconds
- Tests executed: [ ]

**Time saved per test run:** [ ] seconds ([ ]%)

---

## Verification Commands

After each file cleanup:
```bash
# Run tests for modified file
npm test -- path/to/modified/file.test.ts

# Check overall coverage
npm run test:coverage

# Verify coverage >= 70%
```

After all cleanup:
```bash
# Full test suite
npm test

# Full coverage report
npm run test:coverage

# Build verification
npm run build

# Type check
npm run type-check
```

---

## Notes & Learnings

### Patterns Found
[Document any patterns you notice]

### Difficult Decisions
[Note tests where it wasn't clear whether to keep or remove]

### Quick Wins
[List obviously unnecessary tests that were easy to remove]

### Tests That Surprised You
[Tests you expected to remove but kept, or vice versa]

---

## Commit Message Template

```
test: remove third-party library verification tests

Removed tests that verify library behavior (Zod, React Admin, Supabase):
- dataProviderSchemaValidation.test.ts: Removed [X] Zod validation tests
- unifiedDataProvider.test.ts: Removed [X] ra-supabase-core tests
- components/admin/__tests__: Removed [X] React Admin component tests
- [Other files...]

Kept all tests that verify custom business logic and transformations:
- [List key business logic tests that were preserved]

Coverage impact: [before]% → [after]% (maintained >= 70% requirement)
Test run time: [before]s → [after]s ([X]% faster)
Tests removed: [X] individual test cases across [Y] files
```

---

## Sign-Off

- [ ] All test files reviewed
- [ ] Coverage verified >= 70%
- [ ] All tests passing
- [ ] Build successful
- [ ] Documentation updated
- [ ] Changes committed

**Completed by:** [Name]
**Date:** [Date]
**Total time spent:** [Hours]
