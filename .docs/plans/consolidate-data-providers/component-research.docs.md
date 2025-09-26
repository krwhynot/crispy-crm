# Data Provider Component Research

Comprehensive analysis of data provider usage across the Atomic CRM codebase to inform consolidation strategy.

## Relevant Files

- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`: Main data provider with custom methods
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: New unified provider with validation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/useContactImport.tsx`: Bulk import hook using data provider
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityShow.tsx`: Custom method usage (unarchiveOpportunity)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Complex drag-drop with batch updates
- `/home/krwhynot/Projects/atomic/src/components/admin/export-button.tsx`: Export functionality with data provider
- `/home/krwhynot/Projects/atomic/src/hooks/useBulkExport.tsx`: Bulk export hook pattern
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/activity.ts`: Service layer using data provider
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`: Data provider registration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.spec.ts`: Comprehensive test mocking
- `/home/krwhynot/Projects/atomic/src/components/admin/bulk-delete-button.tsx`: Bulk operations via React Admin hooks

## Architectural Patterns

### Data Provider Usage Patterns

1. **React Admin Hook Pattern**: Most components use `useDataProvider()` hook from React Admin
   - Standard CRUD operations via React Admin hooks (useCreate, useUpdate, useDelete)
   - Direct data provider access for custom operations

2. **Custom Method Pattern**: Data provider extends base with custom methods
   - `salesCreate`, `salesUpdate`, `updatePassword` - User management
   - `unarchiveOpportunity` - Complex business logic with batch updates
   - Junction table methods: `getContactOrganizations`, `addContactToOrganization`, etc.
   - Activity log: `getActivityLog` - Service layer pattern

3. **Bulk Operations Pattern**: Multiple approaches for batch operations
   - React Admin `useDeleteMany`, `useUpdateMany` hooks
   - Direct data provider calls with `getMany`, `updateMany`
   - Custom bulk import/export functionality

4. **Service Layer Pattern**: Business logic separated from components
   - Activity log service uses data provider for multiple queries
   - Import service with caching and batch processing
   - Complex drag-drop reordering with index management

## Component Usage Analysis

### Direct useDataProvider Hook Usage (11 files)
- `/src/atomic-crm/contacts/useContactImport.tsx` - Bulk import with caching
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx` - Standard create operations
- `/src/atomic-crm/opportunities/OpportunityShow.tsx` - Custom unarchive method
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx` - Drag-drop with batch updates
- `/src/components/admin/export-button.tsx` - Export with getList
- `/src/hooks/useBulkExport.tsx` - Bulk export with getMany
- `/src/atomic-crm/activity/ActivityLog.tsx` - Activity service integration
- `/src/atomic-crm/tasks/AddTask.tsx` - Task creation
- `/src/atomic-crm/settings/SettingsPage.tsx` - Settings management
- `/src/atomic-crm/sales/SalesEdit.tsx` - Custom sales methods
- `/src/atomic-crm/sales/SalesCreate.tsx` - Custom sales methods

### React Admin Hook Usage (Standard Pattern)
Most components use React Admin's built-in hooks:
- `useCreate`, `useUpdate`, `useDelete` for CRUD operations
- `useDeleteMany`, `useUpdateMany` for bulk operations
- `useListContext` for list-based operations
- These hooks internally use the data provider but don't access it directly

### Custom Method Consumers
Components using custom data provider methods:

1. **Sales Management**:
   - `salesCreate()`, `salesUpdate()`, `updatePassword()` in sales components
   - Custom user management via Supabase Edge Functions

2. **Junction Table Operations**:
   - `getContactOrganizations()`, `addContactToOrganization()`, `removeContactFromOrganization()`
   - `getOpportunityParticipants()`, `addOpportunityParticipant()`, `removeOpportunityParticipant()`
   - `getOpportunityContacts()`, `addOpportunityContact()`, `removeOpportunityContact()`

3. **Business Logic**:
   - `unarchiveOpportunity()` - Complex reordering logic
   - `getActivityLog()` - Multi-table activity aggregation

4. **Resource Mapping**:
   - Summary views: `opportunities_summary`, `organizations_summary`, `contacts_summary`
   - Resource name mapping via `getResourceName()`

## Test File Mocking Patterns

### Comprehensive Mocking Strategy
Test files mock the entire data provider interface:

```typescript
const mockDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};
```

### Test Implementation Examples
- Mock responses based on resource and parameters
- Simulate pagination, filtering, and sorting
- Error handling scenarios
- Junction table query mocking
- View compatibility testing

### Test Coverage Areas
- CRUD operations with validation
- Filter transformations and complex queries
- Pagination and sorting behavior
- Error handling and edge cases
- Batch operations (getMany, updateMany, deleteMany)
- Custom method testing (junction tables, business logic)

## Service Layer Patterns

### Activity Service Pattern
- Located at `/src/atomic-crm/providers/commons/activity.ts`
- Uses data provider for multiple parallel queries
- Aggregates data from multiple resources
- Implements caching and optimization strategies

### Import Service Pattern
- Bulk data processing with caching
- Parallel operations for performance
- Error handling and rollback strategies
- Progress tracking and reporting

### Business Logic Services
- Complex operations abstracted from components
- Reusable across multiple UI components
- Testable independently of UI concerns

## Data Provider Architecture Analysis

### Current Architecture (Main Provider)
- Base: `supabaseDataProvider` from `ra-supabase-core`
- Extensions: Custom methods for business logic
- Lifecycle callbacks: File uploads, validation, search
- Resource mapping: Summary views and backward compatibility

### Unified Provider (New)
- Consolidates validation and error logging
- Integrated search and filtering
- Structured validation registry
- Simplified architecture (2 layers vs 4+)

### Provider Chain Complexity
Current: Base → Custom Methods → Lifecycle Callbacks → Error Handling
Proposed: Base → Unified (validation + errors + transformations)

## Impact Analysis for Consolidation

### High Impact Components
1. **Sales Components** - Heavy custom method usage
2. **Opportunity Management** - Complex business logic methods
3. **Contact Import** - Bulk operations and caching
4. **Activity Service** - Multi-resource aggregation
5. **Drag-Drop Operations** - Complex batch updates

### Medium Impact Components
1. **Export/Import Hooks** - Standard data provider methods
2. **Admin Components** - React Admin hook integration
3. **Junction Table Operations** - Custom relationship methods

### Low Impact Components
1. **Standard CRUD Forms** - React Admin hooks only
2. **List/Show Components** - React Admin built-ins
3. **Simple Admin Components** - Standard patterns

### Migration Considerations
1. **Custom Methods**: Need direct mapping in unified provider
2. **Junction Tables**: Complex relationship management
3. **Business Logic**: Service layer integration points
4. **Error Handling**: Consistent error propagation
5. **Validation**: Schema integration at provider level
6. **Testing**: Mock strategy updates required

### Recommended Consolidation Strategy
1. **Phase 1**: Implement unified provider alongside existing
2. **Phase 2**: Migrate low-impact components first
3. **Phase 3**: Update service layer integration
4. **Phase 4**: Migrate high-impact components with custom methods
5. **Phase 5**: Remove legacy provider and update tests

## Edge Cases & Gotchas

- **Resource Mapping**: Summary views require careful handling in unified provider
- **Lifecycle Callbacks**: File upload and processing must be preserved
- **Custom Methods**: Junction table operations are heavily used
- **Caching Strategy**: Import/export hooks implement their own caching
- **Error Propagation**: Different error handling between React Admin hooks and direct calls
- **Transaction Management**: Complex operations require careful sequencing
- **Performance**: Activity service makes multiple parallel queries
- **Testing**: Extensive mock strategy needs updating for unified provider

## Relevant Docs

- [React Admin DataProvider Documentation](https://marmelab.com/react-admin/DataProviders.html)
- [ra-supabase-core Documentation](https://github.com/marmelab/ra-supabase)
- Internal validation schemas at `/src/atomic-crm/validation/`
- Junction table patterns in main data provider implementation