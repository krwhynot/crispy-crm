# Data Provider Consolidation - Parallel Execution Plan

This plan outlines the consolidation of two competing data providers (`dataProvider.ts` and `unifiedDataProvider.ts`) into a single, unified provider following Engineering Constitution principles. The consolidation establishes a clean architecture by extending the experimental `unifiedDataProvider.ts` with critical production functionality, moving custom business operations to a service layer, and extracting file upload utilities for better separation of concerns.

## Critically Relevant Files and Documentation

### Core Provider Files
- `/src/atomic-crm/providers/supabase/dataProvider.ts` - Current production provider (607 lines)
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Foundation for consolidation (386 lines)
- `/src/atomic-crm/providers/supabase/resources.ts` - Resource mapping configuration
- `/src/atomic-crm/providers/supabase/index.ts` - Provider exports

### Documentation
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Engineering Constitution principles
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/requirements.md` - Detailed implementation strategy
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/shared.md` - Shared architecture knowledge

## Implementation Plan

### Phase 1: Foundation Setup

#### Task 1.1: Create Service Layer Structure [Depends on: none]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 155-241 for business logic methods)
- `/src/atomic-crm/providers/commons/activity.ts` (existing service pattern)
- `/home/krwhynot/Projects/atomic/CLAUDE.md` (Engineering Constitution principles)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/data-provider-research.docs.md`

**Instructions**

Files to Create:
- `/src/atomic-crm/services/sales.service.ts`
- `/src/atomic-crm/services/opportunities.service.ts`
- `/src/atomic-crm/services/activities.service.ts`
- `/src/atomic-crm/services/junctions.service.ts`
- `/src/atomic-crm/services/index.ts`

Create service layer modules that wrap the data provider and implement custom business logic. Each service should:
- Accept a DataProvider instance in the constructor
- Implement methods matching the custom methods from `dataProvider.ts`
- Return properly typed responses
- Handle errors consistently

Focus on `salesCreate`, `salesUpdate`, `updatePassword` for sales service, `unarchiveOpportunity` for opportunities service, `getActivityLog` for activities service, and all junction table operations for junctions service.

#### Task 1.2: Extract File Upload Utilities [Depends on: none]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 565-606 for uploadToBucket)
- `/src/atomic-crm/providers/commons/getContactAvatar.ts` (avatar generation)
- `/src/atomic-crm/providers/commons/getOrganizationAvatar.ts` (logo processing)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/storage-research.docs.md`

**Instructions**

Files to Create:
- `/src/atomic-crm/utils/storage.utils.ts`
- `/src/atomic-crm/utils/avatar.utils.ts`

Files to Modify:
- None initially (new utilities)

Extract `uploadToBucket` function and related file processing logic into storage utilities. Include:
- File upload to Supabase Storage bucket
- Public URL generation
- Avatar/logo processing functions
- File type validation
- MIME type detection

Ensure utilities are pure functions that can be used by the transformer registry.

#### Task 1.3: Add Transformer Registry to Unified Provider [Depends on: none]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (current structure)
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 386-528 for lifecycle callbacks)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/requirements.md` (transformer pattern)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/validation-research.docs.md`

**Instructions**

Files to Modify:
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Add a transformer registry alongside the existing validation registry:
- Define `TransformerConfig` interface
- Create `transformerRegistry` object
- Integrate transformation pipeline in create/update operations
- Maintain backward compatibility with existing validation flow

The transformer should handle pre-save transformations like file uploads, avatar processing, and timestamp injection.

### Phase 2: Port Core Functionality

#### Task 2.1: Implement Sales Service Methods [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 155-213 for sales methods)
- `/src/atomic-crm/sales/SalesCreate.tsx` (usage patterns)
- `/src/atomic-crm/sales/SalesEdit.tsx` (usage patterns)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/component-research.docs.md`

**Instructions**

Files to Modify:
- `/src/atomic-crm/services/sales.service.ts`

Implement the three sales-related custom methods:
- `salesCreate(body: SalesFormData)` - Edge function integration for user creation
- `salesUpdate(id, data)` - Edge function for profile updates
- `updatePassword(id)` - Password reset via Edge function

Ensure proper error handling and response formatting to match current implementation.

#### Task 2.2: Implement Junction Table Services [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 242-381 for junction methods)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/junction-table-research.docs.md`
- `/src/atomic-crm/contacts/ContactMultiOrg.tsx` (usage patterns)
- `/supabase/migrations/20250926002021_add_set_primary_organization_rpc.sql` (RPC functions)

**Instructions**

Files to Modify:
- `/src/atomic-crm/services/junctions.service.ts`

Port all 9 junction table methods:
- Contact-Organization: `getContactOrganizations`, `addContactToOrganization`, `removeContactFromOrganization`
- Opportunity Participants: `getOpportunityParticipants`, `addOpportunityParticipant`, `removeOpportunityParticipant`
- Opportunity Contacts: `getOpportunityContacts`, `addOpportunityContact`, `removeOpportunityContact`

Use RPC functions where available for atomic operations.

#### Task 2.3: Implement Resource Transformers [Depends on: 1.2, 1.3]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 390-468 for processing callbacks)
- `/src/atomic-crm/validation/notes.ts` (attachment validation)
- `/src/atomic-crm/validation/tags.ts` (color validation)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/storage-research.docs.md`

**Instructions**

Files to Modify:
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Implement transformers in the registry for:
- `contactNotes` and `opportunityNotes`: Attachment upload processing
- `sales`: Avatar upload processing
- `contacts`: Auto-generate avatars from email
- `organizations`: Logo processing and timestamp injection
- `tags`: Semantic color validation and mapping

Each transformer should use the extracted utilities from Task 1.2.

#### Task 2.4: Port Search and Filter Logic [Depends on: 1.3]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 530-563 for search logic)
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 428-501 for filter callbacks)
- `/src/atomic-crm/providers/supabase/resources.ts` (search configuration)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/data-provider-research.docs.md`

**Instructions**

Files to Modify:
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Add search and filter functionality:
- Implement `applyFullTextSearch` helper function
- Add FTS column support for email/phone fields
- Integrate soft delete filtering for all queries
- Apply search transformation in getList operations

Ensure summary view optimization remains intact.

#### Task 2.5: Implement Opportunity Service [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (lines 214-238 for unarchiveOpportunity)
- `/src/atomic-crm/opportunities/OpportunityShow.tsx` (usage pattern)
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx` (drag-drop patterns)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/component-research.docs.md`

**Instructions**

Files to Modify:
- `/src/atomic-crm/services/opportunities.service.ts`

Implement `unarchiveOpportunity` method with complex reordering logic:
- Query all opportunities in the same stage
- Calculate new index positions
- Perform batch updates for proper Kanban positioning
- Handle edge cases for index management

This is critical for drag-drop functionality.

### Phase 3: Integration

#### Task 3.1: Extend Unified Provider with Custom Methods [Depends on: 2.1, 2.2, 2.5]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (current interface)
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (custom method signatures)
- `/src/atomic-crm/providers/types.ts` (CrmDataProvider type)
- All service files created in Phase 2

**Instructions**

Files to Modify:
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Extend the unified provider to include custom methods:
- Import all service classes
- Instantiate services with the base provider
- Add custom method delegates that call service methods
- Ensure type compatibility with CrmDataProvider interface

This creates a drop-in replacement for the current provider.

#### Task 3.2: Update Provider Exports [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/index.ts` (current exports)
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (to be replaced)
- `/src/atomic-crm/root/CRM.tsx` (provider usage)

**Instructions**

Files to Modify:
- `/src/atomic-crm/providers/supabase/index.ts`

Update exports to use unified provider:
- Export `unifiedDataProvider` as `dataProvider`
- Keep authProvider export unchanged
- Ensure backward compatibility for import paths

Files to Archive (not delete yet):
- Mark `/src/atomic-crm/providers/supabase/dataProvider.ts` as deprecated

### Phase 4: Component Updates

#### Task 4.1: Update Sales Components [Depends on: 2.1, 3.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/sales/SalesCreate.tsx` (current implementation)
- `/src/atomic-crm/sales/SalesEdit.tsx` (current implementation)
- `/src/atomic-crm/services/sales.service.ts` (new service)
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/component-research.docs.md`

**Instructions**

Files to Modify:
- `/src/atomic-crm/sales/SalesCreate.tsx`
- `/src/atomic-crm/sales/SalesEdit.tsx`

Update components to use service layer:
- Import sales service instead of using custom provider methods
- Update method calls to use service instance
- Maintain existing error handling and UI behavior

#### Task 4.2: Update Opportunity Components [Depends on: 2.5, 3.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/opportunities/OpportunityShow.tsx` (unarchive usage)
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx` (drag-drop)
- `/src/atomic-crm/services/opportunities.service.ts` (new service)

**Instructions**

Files to Modify:
- `/src/atomic-crm/opportunities/OpportunityShow.tsx`

Update opportunity components:
- Import opportunities service
- Replace direct `unarchiveOpportunity` calls with service method
- Ensure drag-drop functionality remains intact

#### Task 4.3: Update Activity Components [Depends on: 3.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/activity/ActivityLog.tsx` (if exists)
- `/src/atomic-crm/providers/commons/activity.ts` (current pattern)
- `/src/atomic-crm/services/activities.service.ts` (new service)

**Instructions**

Files to Modify:
- Components using `getActivityLog` method

Update activity-related components:
- Import activities service
- Update method calls to use service
- Maintain caching strategy if present

#### Task 4.4: Update Import/Export Hooks [Depends on: 3.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/contacts/useContactImport.tsx` (bulk import)
- `/src/hooks/useBulkExport.tsx` (bulk export)
- `/src/components/admin/export-button.tsx` (export functionality)

**Instructions**

Files to Modify:
- `/src/atomic-crm/contacts/useContactImport.tsx`

These components use standard data provider methods and should work without changes, but verify:
- Bulk operations still function correctly
- Caching behavior is preserved
- Error handling remains consistent

### Phase 5: Testing and Cleanup

#### Task 5.1: Update Test Mocks [Depends on: 3.2]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.spec.ts` (current tests)
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.test.ts` (unified tests)
- `/src/atomic-crm/contacts/ContactMultiOrg.spec.ts` (junction tests)
- `/tests/performance/junction-table-performance.spec.ts` (performance tests)

**Instructions**

Files to Modify:
- All test files with data provider mocks

Update test mocks to reflect new architecture:
- Mock service layer methods where appropriate
- Update provider mock structure
- Ensure custom method mocks align with service pattern
- Verify junction table test coverage

#### Task 5.2: Remove Legacy Code [Depends on: all other tasks]

**READ THESE BEFORE TASK**
- `/src/atomic-crm/providers/supabase/dataProvider.ts` (to be removed)
- Verification that all tests pass
- Confirmation that all components work

**Instructions**

Files to Delete:
- `/src/atomic-crm/providers/supabase/dataProvider.ts`
- Any temporary compatibility shims created during migration

Files to Update:
- `/src/atomic-crm/providers/types.ts` - Update type export to use unified provider

Final cleanup of legacy implementation after full validation.

#### Task 5.3: Create Validation Script [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/requirements.md` (success criteria)
- `/scripts/` directory for script patterns
- Test file locations

**Instructions**

Files to Create:
- `/scripts/validate-provider-consolidation.ts`

Create comprehensive validation script that:
- Runs all unit tests
- Executes E2E tests
- Verifies CRUD operations for all resources
- Tests file upload functionality
- Validates junction table operations
- Checks TypeScript compilation
- Runs lint checks

Output clear pass/fail status for each criterion.

## Critical Implementation Advice

- **Preserve Exact Behavior**: The unified provider must be a drop-in replacement. Any behavior changes could break the entire application.

- **Service Layer Independence**: Services should depend only on the DataProvider interface, not implementation details. This allows future provider swaps.

- **Transformer Order Matters**: File uploads must happen before validation in the transformer pipeline to ensure uploaded URLs are validated correctly.

- **Junction Table Atomicity**: Use RPC functions for junction operations where available. The `set_primary_organization` RPC prevents race conditions.

- **Summary View Routing**: The resource mapping to summary views is performance-critical. Ensure `getResourceName()` logic is preserved exactly.

- **Error Format Consistency**: React Admin expects errors in the format `{ message: string, errors: Record<string, string> }`. All error transformations must output this format.

- **Soft Delete Filtering**: Must be applied automatically to all queries without explicit user action. Missing this will expose deleted records.

- **File Upload Path Generation**: Current system uses `Math.random()` for filenames which has collision risk. Consider using UUIDs but only after full migration.

- **Custom Method Type Safety**: The CrmDataProvider type extends the base DataProvider. Ensure all custom methods maintain proper TypeScript signatures.

- **Test Coverage First**: Run tests after each phase to catch issues early. The application has extensive test coverage that will catch most problems.

- **Backward Compatibility**: While we follow the "no backward compatibility" principle, the migration itself needs to maintain compatibility until cutover.

- **Search Performance**: FTS columns (email_fts, phone_fts) are database-level optimizations. The provider must use these columns for search queries.

- **Validation Timing**: Validation happens at the provider level, not the form level. Forms may have additional client-side validation for UX.

- **Activity Service Pattern**: The existing activity service at `/src/atomic-crm/providers/commons/activity.ts` shows the correct service pattern to follow.