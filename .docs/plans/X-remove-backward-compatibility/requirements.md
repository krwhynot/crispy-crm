# Remove Backward Compatibility Requirements

## Executive Summary

This document outlines the requirements for removing all backward compatibility from the Atomic CRM validation schemas and codebase. Following Engineering Constitution Principle #9 ("Never maintain backward compatibility - fail fast"), we will execute a single, coordinated change that removes all legacy fields and patterns.

**Effort:** 4-6 hours
**Risk:** High (mitigated by pre-production status)
**Status:** Not live - no production data or external systems

## Context & Motivation

### Current State
- 15+ components actively using legacy fields (`company_id`, `is_primary_contact`)
- Validation schemas contain backward compatibility fields marked for removal
- Migration scripts still reference old patterns
- Tests validate backward compatibility behavior

### Problems
1. **Constitution Violation**: Direct violation of Principle #9 - "Never maintain backward compatibility"
2. **Technical Debt**: Confusion about which patterns are correct
3. **Maintenance Burden**: Dual patterns increase complexity
4. **Data Integrity Risk**: Multiple ways to represent same relationships

### Critical Context
**This atomic, breaking change strategy is appropriate ONLY because the system is not in production.** For future breaking changes on a live system, a multi-phase, schema-compatible rollout will be required (Principle #21).

## Goals & Non-Goals

### Goals
- Remove ALL backward compatibility fields from validation schemas
- Update ALL components to use new patterns exclusively
- Establish ESLint rules to prevent reintroduction
- Ensure transaction integrity for junction table operations
- Provide helpful error messages for migration

### Non-Goals
- Maintain any transition period or soft deprecation
- Support external systems (none exist yet)
- Preserve migration scripts (will be deleted)

## User Flow Impact

### Before (Current State)
- Contacts can have `company_id` (single org) OR use `contact_organizations` (multi-org)
- Validation accepts both patterns
- Components inconsistently use old or new patterns

### After (Target State)
- Contacts ONLY use `contact_organizations` junction table
- Validation immediately rejects legacy fields with helpful errors
- All components use consistent multi-organization pattern

## Technical Implementation

### 1. Implementation Strategy

#### Approach: Single Coordinated Change
- One feature branch: `feature/remove-backward-compatibility`
- One atomic commit when complete
- No phased rollout or feature flags

#### Update Order (By Feature Module)
Following Engineering Constitution's existing module structure:

1. **Organizations Module** (foundational)
   - `src/atomic-crm/validation/organizations.ts`
   - `src/atomic-crm/organizations/*`

2. **Contacts Module** (complex junction relationships)
   - `src/atomic-crm/validation/contacts.ts`
   - `src/atomic-crm/contacts/*`

3. **Opportunities Module** (dependent on orgs/contacts)
   - `src/atomic-crm/validation/opportunities.ts`
   - `src/atomic-crm/opportunities/*`

4. **Remaining Modules** (activities, tasks, notes, etc.)

#### Per-Module Update Sequence
For each feature module:
1. Update Zod schema (remove backward compatibility fields)
2. Update data provider integration
3. Update all CRUD components (List, Show, Edit, Create, Inputs)
4. Update/remove related tests
5. Apply Boy Scout Rule to touched files

### 2. Validation Changes

#### Fields to Remove

**contacts.ts:**
```typescript
// REMOVE these fields:
company_id: z.number().optional(), // Line 90
is_primary_contact: z.boolean().optional(), // Line 75
role: z.string().optional(), // Line 105
department: z.string().optional(), // Line 106
purchase_influence: z.number().optional(), // Line 108
decision_authority: z.number().optional() // Line 109
```

**opportunities.ts:**
```typescript
// REMOVE these fields:
company_id: z.number().optional(), // Line 118
archived_at: z.string().optional() // Line 119
```

#### Error Messages
When validation rejects removed fields:
```
Field 'company_id' is no longer supported. Use contact_organizations relationship instead.
Field 'is_primary_contact' is deprecated. Use is_primary in contact_organizations junction.
```

### 3. Contact-Organization Relationship

#### Junction Table Structure
```typescript
contact_organizations {
  contact_id: number
  organization_id: number
  is_primary: boolean  // KEEP - relationship metadata
  role: string
  department: string
  purchase_influence: number
  decision_authority: number
}
```

**Decision:** `is_primary` stays in junction table as it's relationship metadata, not contact data (Single Responsibility Principle).

### 4. Data Provider Updates

#### Transaction Requirements
Per Principle #8: Multi-table operations must be transactional.

```typescript
// Example: Setting primary organization must be atomic
async function setPrimaryOrganization(contactId, orgId) {
  return db.transaction(async (tx) => {
    // Clear existing primary
    await tx.update(contact_organizations)
      .set({ is_primary: false })
      .where({ contact_id: contactId });

    // Set new primary
    await tx.update(contact_organizations)
      .set({ is_primary: true })
      .where({ contact_id: contactId, organization_id: orgId });
  });
}
```

### 5. Component Updates

#### Pattern Migration Examples

**Before:**
```tsx
// ContactShow.tsx
<TextField source="company_id" />
```

**After:**
```tsx
// ContactShow.tsx
<ReferenceField
  source="contact_organizations[0].organization_id"
  reference="organizations"
/>
```

### 6. Cleanup Actions

#### Files to Delete
- `scripts/migration-transform.js`
- `scripts/migration-dry-run.js`
- All backward compatibility test files

#### Tests to Remove
- `ContactMultiOrg.spec.ts` lines 342-396 (backward compatibility tests)
- `dataProvider.spec.ts` lines 392-427 (deals_summary view tests)

#### Performance Verification
Per Principle #18: Measure before optimizing.
- Verify indexes exist on `contact_organizations(contact_id, organization_id)`
- Profile common queries using the junction table
- Add indexes only if performance issues are measured

### 7. Prevention Measures

#### ESLint Rules (Principle #16)
Add to `.eslintrc.js`:
```javascript
{
  "rules": {
    "no-restricted-properties": [
      "error",
      {
        "object": "Contact",
        "property": "company_id",
        "message": "[DEPRECATED] Contact.company_id is removed. Use contact_organizations junction."
      },
      {
        "object": "Opportunity",
        "property": "company_id",
        "message": "[DEPRECATED] Use customer_organization_id instead."
      },
      {
        "object": "Opportunity",
        "property": "archived_at",
        "message": "[DEPRECATED] Use deleted_at for soft deletes."
      }
    ]
  }
}
```

### 8. Boy Scout Rule Application

While updating files (Principle #15):
- Fix TypeScript interface/type usage (Principle #6)
- Replace hex colors with semantic CSS variables (Principle #12)
- Ensure admin form layer usage (Principle #11)
- Consolidate to unified data provider (Principle #1)

## Testing Strategy

### Test Updates
1. **Delete** all backward compatibility tests
2. **Create** new tests validating rejection of legacy fields
3. **Update** fixtures to use only new patterns
4. **Verify** all E2E journeys work with new patterns

### Validation Tests
```typescript
// Example: Ensure legacy fields are rejected
it('should reject legacy company_id field', async () => {
  const result = contactSchema.safeParse({
    name: 'John Doe',
    company_id: 123 // Should fail
  });

  expect(result.success).toBe(false);
  expect(result.error.message).toContain('no longer supported');
});
```

## Assumptions & Constraints

### Assumptions
1. No production data exists
2. No external API consumers
3. All team members aware of breaking changes
4. Migration scripts have already been run if needed

### Constraints
1. Must complete in single sprint (4-6 hours)
2. Cannot be partially deployed
3. All tests must pass before merge
4. Must follow Engineering Constitution strictly

## Success Criteria

- [ ] All validation schemas reject backward compatibility fields with helpful errors
- [ ] All 15+ components updated to use new patterns
- [ ] Contact-organization relationships use junction table exclusively
- [ ] All backward compatibility tests deleted
- [ ] All test fixtures use new patterns
- [ ] ESLint rules prevent reintroduction of legacy fields
- [ ] Performance verified for new JOIN-based queries
- [ ] No references to legacy fields remain in codebase
- [ ] All tests pass (unit, integration, E2E)
- [ ] Code review confirms Engineering Constitution compliance

## Risk Mitigation

### High Risk: Breaking Changes
**Mitigation:** Not live yet - perfect timing for breaking changes

### Medium Risk: Missed References
**Mitigation:** ESLint rules + comprehensive search before merge

### Low Risk: Performance Impact
**Mitigation:** Verify indexes exist, profile before optimizing

## Implementation Checklist

### Phase 1: Preparation
- [ ] Create feature branch `feature/remove-backward-compatibility`
- [ ] Set up ESLint rules
- [ ] Document changes for team

### Phase 2: Organizations Module
- [ ] Update organizations.ts validation
- [ ] Update organization components
- [ ] Update organization tests
- [ ] Apply Boy Scout Rule

### Phase 3: Contacts Module
- [ ] Remove legacy fields from contacts.ts
- [ ] Update contact components for multi-org
- [ ] Ensure transaction integrity in data provider
- [ ] Delete backward compatibility tests
- [ ] Update contact fixtures

### Phase 4: Opportunities Module
- [ ] Remove company_id and archived_at fields
- [ ] Update opportunity components
- [ ] Update opportunity tests

### Phase 5: Remaining Modules
- [ ] Update activities
- [ ] Update tasks
- [ ] Update notes
- [ ] Update other dependent modules

### Phase 6: Cleanup & Verification
- [ ] Delete migration scripts
- [ ] Run full test suite
- [ ] Verify performance
- [ ] Search for any remaining legacy references
- [ ] Code review
- [ ] Merge as single commit

## Notes

- This approach is only valid pre-production per Principle #21
- Future breaking changes will require schema-compatible rollouts
- The "fail fast" principle guides every decision in this plan
- Boy Scout Rule applies within scope of touched files only