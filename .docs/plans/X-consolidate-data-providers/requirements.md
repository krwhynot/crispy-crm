# Data Provider Consolidation Requirements

## Executive Summary

Consolidate two existing data providers (`dataProvider.ts` and `unifiedDataProvider.ts`) into a single, unified provider that adheres to the Engineering Constitution's principles. This consolidation will establish a clean, maintainable foundation for all data operations before the application goes live.

**Effort**: 8-10 hours
**Risk**: High (touches all data operations)
**Approach**: Big bang migration (complete replacement in one go)

## Current State

### Two Competing Providers

1. **`dataProvider.ts` (Active/Legacy)**
   - 607 lines of production code
   - Uses `withLifecycleCallbacks` pattern from `ra-supabase-core`
   - Contains all business functionality
   - Mixed concerns (validation, transformation, file uploads in callbacks)
   - 15+ custom methods for specialized operations
   - Handles file uploads, avatar processing, junction tables

2. **`unifiedDataProvider.ts` (Experimental/Unused)**
   - 386 lines of cleaner architecture
   - Direct `DataProvider` implementation
   - Validation registry pattern
   - Better error logging with context
   - Missing critical functionality (file uploads, custom methods)
   - Not currently imported or used

### Constitution Violations
- **Principle #1**: "Single unified data provider" - violated by having two providers
- **Principle #3**: "Zod schemas at API boundary only" - partially violated by scattered validation
- **Principle #35**: Single Responsibility - violated by mixed concerns in lifecycle callbacks

## Target Architecture

### Single Unified Provider

Build upon `unifiedDataProvider.ts` as the foundation, extending it with:

1. **Validation Registry** (existing)
   - Centralized validation at API boundary
   - Zod schemas for all resources
   - Clean separation from business logic

2. **Transformer Registry** (new)
   - Centralized data transformation
   - Resource-specific transformations
   - Handles avatars, logos, file processing

3. **Service Layer** (new)
   - Custom business operations moved out of provider
   - Service functions that use the provider
   - Supabase RPC for complex operations where appropriate

4. **File Upload Utilities** (extracted)
   - Separate module for Supabase Storage operations
   - Called by transformer registry as needed
   - Reusable across the application

## Implementation Plan

### Phase 1: Prepare Foundation (2 hours)

1. **Create Service Layer Structure**
   ```
   src/atomic-crm/services/
   ├── sales.service.ts         # salesCreate, salesUpdate, updatePassword
   ├── opportunities.service.ts # unarchiveOpportunity
   ├── activities.service.ts    # getActivityLog
   └── junctions.service.ts     # All junction table operations
   ```

2. **Create File Upload Utilities**
   ```
   src/atomic-crm/utils/
   └── storage.utils.ts         # uploadToBucket, avatar processing
   ```

3. **Create Transformer Registry**
   - Add transformer registry to `unifiedDataProvider.ts`
   - Define transformer interface
   - Implement resource-specific transformers

### Phase 2: Port Functionality (4-5 hours)

1. **Port Custom Methods to Service Layer**
   - `salesCreate`, `salesUpdate`, `updatePassword` → `sales.service.ts`
   - `unarchiveOpportunity` → `opportunities.service.ts`
   - `getActivityLog` → `activities.service.ts`
   - Junction operations → `junctions.service.ts`

2. **Port Transformations to Registry**
   - Organizations: logo processing, timestamps
   - Contacts: avatar processing
   - Notes: attachment uploads
   - Opportunities: archive handling
   - Tags: color validation

3. **Port File Upload Logic**
   - Extract `uploadToBucket` to `storage.utils.ts`
   - Extract avatar/logo processing functions
   - Update transformer registry to use utilities

4. **Port Search and Filter Logic**
   - Full-text search handling
   - Summary view optimizations
   - Soft delete filtering

### Phase 3: Update Consumers (2-3 hours)

1. **Update Provider Export**
   - Modify `src/atomic-crm/providers/supabase/index.ts`
   - Export `unifiedDataProvider` as `dataProvider`

2. **Update Custom Method Consumers**
   Components using custom methods need service imports:
   - `OpportunityShow.tsx` → import `opportunities.service.ts`
   - `SalesCreate.tsx`, `SalesEdit.tsx` → import `sales.service.ts`
   - `ActivityLog.tsx` → import `activities.service.ts`
   - Junction-related components → import `junctions.service.ts`

3. **Update Test Mocks**
   - Update all mock providers in test files
   - Ensure mocks reflect new structure
   - Add service layer mocks where needed

### Phase 4: Cleanup and Validation (1 hour)

1. **Delete Legacy Code**
   - Remove `dataProvider.ts`
   - Remove unused lifecycle callback code
   - Clean up any temporary compatibility shims

2. **Run Validation Suite**
   - Execute all unit tests
   - Run E2E tests
   - Verify all CRUD operations
   - Test file uploads
   - Validate junction operations

## Technical Specifications

### Validation Registry Pattern
```typescript
interface ValidationConfig<T> {
  validate: (data: Partial<T>, operation: 'create' | 'update') => Promise<void>;
}

const validationRegistry: Record<string, ValidationConfig<any>> = {
  opportunities: { validate: validateOpportunityForm },
  organizations: { validate: validateOrganizationForSubmission },
  // ... other resources
};
```

### Transformer Registry Pattern
```typescript
interface TransformerConfig<T> {
  transform: (data: Partial<T>, operation: 'create' | 'update') => Promise<Partial<T>>;
}

const transformerRegistry: Record<string, TransformerConfig<any>> = {
  organizations: {
    transform: async (data, operation) => {
      // Logo processing, timestamps, etc.
    }
  },
  // ... other resources
};
```

### Service Layer Pattern
```typescript
// opportunities.service.ts
export class OpportunitiesService {
  constructor(private dataProvider: DataProvider) {}

  async unarchive(id: string): Promise<void> {
    // Business logic using dataProvider
  }
}
```

## Affected Components

### Direct Provider Consumers (via useDataProvider)
- `OpportunityShow.tsx`
- `OpportunityCreate.tsx`
- `OpportunityListContent.tsx`
- `ContactImport.tsx`
- `ActivityLog.tsx`
- `AddTask.tsx`
- `SettingsPage.tsx`
- `SalesCreate.tsx`
- `SalesEdit.tsx`
- `BulkExport.tsx`
- `ExportButton.tsx`

### Test Files Requiring Updates
- All `.spec.ts` and `.spec.tsx` files with mock providers
- Integration tests in `tests/` directory

## Success Criteria

1. **Single Provider**: Only one data provider exists in the codebase
2. **All Features Working**: No regression in functionality
   - CRUD operations for all resources
   - File uploads functioning
   - Junction table operations working
   - Search and filtering operational
   - Custom business operations available

3. **Clean Architecture**:
   - Validation centralized in registry
   - Transformations centralized in registry
   - Custom operations in service layer
   - File handling in utilities
   - No mixed concerns

4. **Tests Passing**:
   - All unit tests green
   - All E2E tests passing
   - No TypeScript errors
   - Lint checks pass

5. **Constitution Compliance**:
   - Principle #1: Single unified provider ✓
   - Principle #3: Zod at API boundary only ✓
   - Principle #35: Single responsibility ✓
   - Principle #9: No backwards compatibility ✓

## Risk Mitigation

1. **High Touch Surface**: Every data operation affected
   - Mitigation: Comprehensive test coverage before and after
   - Big bang approach reduces partial state complexity

2. **Custom Method Migration**: Service layer pattern is new
   - Mitigation: Clear documentation and consistent patterns
   - TypeScript interfaces ensure correct usage

3. **File Upload Complexity**: Storage operations are critical
   - Mitigation: Test file uploads thoroughly
   - Keep upload logic identical, just relocated

## Post-Implementation

1. **Documentation**: Update any developer docs about data access patterns
2. **Team Communication**: Notify team of new service layer pattern
3. **Monitor**: Watch for any issues in development environment
4. **ESLint Rules**: Consider adding rules to prevent direct Supabase calls outside provider/services

## Notes

- No backwards compatibility needed (not live yet)
- Breaking changes are acceptable and encouraged for cleaner API
- Follow Boy Scout Rule for any additional cleanup opportunities discovered
- Consider future migration to Supabase RPC for complex operations