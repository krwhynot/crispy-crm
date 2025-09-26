# Data Provider Consolidation - Quick Reference Checklist

## Pre-Flight Check ✈️
- [ ] Git commit current state for easy rollback
- [ ] Ensure all tests pass before starting
- [ ] Have both provider files open side-by-side

## Core Methods to Port (Must Have All 20+)

### Standard CRUD Operations
- [ ] getList (with soft delete filtering)
- [ ] getOne
- [ ] create (with validation)
- [ ] update (with validation)
- [ ] delete
- [ ] deleteMany
- [ ] updateMany

### Custom Business Methods
- [ ] salesCreate
- [ ] salesUpdate
- [ ] updatePassword
- [ ] unarchiveOpportunity
- [ ] getActivityLog

### Junction Table Operations
- [ ] getContactOrganizations
- [ ] addContactOrganization
- [ ] removeContactOrganization
- [ ] getOpportunityParticipants
- [ ] addOpportunityParticipant
- [ ] removeOpportunityParticipant
- [ ] getContactPreferredPrincipals
- [ ] setContactPreferredPrincipal
- [ ] getInteractionParticipants
- [ ] addInteractionParticipant
- [ ] removeInteractionParticipant

### Critical Features to Preserve
- [ ] File upload via uploadToBucket
- [ ] Avatar processing for contacts
- [ ] Logo processing for organizations
- [ ] Full-text search enhancement
- [ ] Summary view routing (opportunities_summary)
- [ ] Soft delete filtering (deleted_at)
- [ ] Search vector updates

## Validation Registry Entries

```typescript
// All resources must have validation
const validationRegistry = {
  [ ] opportunities: validateOpportunityForm,
  [ ] organizations: validateOrganizationForSubmission,
  [ ] contacts: validateContactForm,
  [ ] tasks: validateTaskForm,
  [ ] tags: validateTagForm,
  [ ] notes: validateNoteForm,
  [ ] opportunityNotes: validateOpportunityNoteForm,
  [ ] activities: validateActivityForm,
  [ ] interactions: validateInteractionForm,
  // ... add all 24 resources
};
```

## Components Requiring Updates

### High Priority (Complex Logic)
- [ ] OpportunityShow.tsx - uses unarchiveOpportunity
- [ ] OpportunityListContent.tsx - drag-drop with batch updates
- [ ] SalesCreate.tsx - uses salesCreate
- [ ] SalesEdit.tsx - uses salesUpdate, updatePassword
- [ ] ContactImport.tsx - bulk operations

### Medium Priority (Custom Calls)
- [ ] ActivityLog.tsx - uses getActivityLog
- [ ] ContactMultiOrg.tsx - junction table operations
- [ ] AddTask.tsx - custom task creation
- [ ] SettingsPage.tsx - various custom calls
- [ ] BulkExport.tsx - export operations

### Low Priority (Standard CRUD)
- [ ] All other List/Show/Edit/Create components

## Test Coverage Verification

### Unit Tests
- [ ] Provider method tests compile
- [ ] Validation tests pass
- [ ] Mock provider updated in test files

### Integration Tests
- [ ] Opportunity lifecycle test passes
- [ ] User journey test passes
- [ ] Junction table performance test passes

### E2E Critical Paths
- [ ] Create opportunity → drag to reorder → archive
- [ ] Upload file attachment → view → download
- [ ] Add contact to organization → remove
- [ ] Search contacts by email/phone
- [ ] Soft delete → verify filtered from lists

## Final Validation Commands

```bash
# TypeScript compilation
npm run typecheck

# Lint check
npm run lint

# Unit tests
npm run test -- --run

# E2E tests (if time)
npm run test:e2e -- --run

# Check for orphaned imports
grep -r "from.*dataProvider" src/ | grep -v unified

# Verify single provider
ls src/atomic-crm/providers/supabase/*.ts | grep -c Provider
# Should output: 1
```

## Success Criteria 🎯

**Must Have:**
- [ ] Only ONE provider file exists
- [ ] TypeScript compiles with no errors
- [ ] All unit tests pass
- [ ] Opportunity drag-drop works
- [ ] File uploads work

**Nice to Have:**
- [ ] Service layer extracted
- [ ] All E2E tests pass
- [ ] Performance unchanged or better
- [ ] Clean git history

## If Something Breaks 🚨

```bash
# Quick rollback
git reset --hard HEAD
git clean -fd

# Or checkout specific files
git checkout -- src/atomic-crm/providers/

# Emergency bypass (temporarily use old)
cp dataProvider.backup.ts dataProvider.ts
```

## Time Management ⏰

| Hour | Focus | Skip If Behind |
|------|-------|----------------|
| 1 | Port all methods to unified | - |
| 2 | Service layer extraction | Skip - not critical |
| 3 | Update all components | Use find-replace |
| 4 | Delete old, test everything | Skip E2E, just unit |

**Remember:** Working code > Perfect architecture (for now)