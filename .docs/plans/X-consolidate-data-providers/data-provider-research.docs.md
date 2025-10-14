# Data Provider Research

Comprehensive analysis of the existing and unified data provider implementations in Atomic CRM, revealing architectural patterns, custom methods, and consolidation opportunities.

## Relevant Files
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`: Current production provider with lifecycle callbacks (607 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Experimental consolidated provider with validation integration (386 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping and configuration (115 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/index.ts`: Provider exports (3 lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/types.ts`: Type definitions (1 line)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/activity.ts`: Shared activity log functionality (50+ lines)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.test.ts`: Test suite for unified provider
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.spec.ts`: Test suite for current provider

## Architectural Patterns

### Current dataProvider.ts Architecture
- **Base Provider**: Uses `supabaseDataProvider` from `ra-supabase-core` as foundation (lines 41-46)
- **Lifecycle Callbacks**: Utilizes `withLifecycleCallbacks` wrapper for pre/post operation hooks (lines 386-528)
- **Custom Methods Extension**: Adds 20+ custom methods to base React Admin DataProvider interface (lines 89-382)
- **Resource Mapping**: Maps React Admin resources to actual database tables/views via `getResourceName()` (lines 92-153)
- **Summary Views Optimization**: Auto-routes list queries to optimized summary views for performance (lines 96-127)
- **File Upload Integration**: Handles Supabase Storage uploads with `uploadToBucket()` (lines 565-606)

### Experimental unifiedDataProvider.ts Architecture
- **Validation-First Approach**: Built-in Zod validation registry per resource (lines 44-85)
- **Error Logging Integration**: Centralized error logging with context (lines 99-120)
- **Transformation Pipeline**: Structured for future data transformations (currently validation-only)
- **Simplified Layer Structure**: Single provider layer vs 4+ layers in current implementation
- **Resource Configuration**: Leverages same resource mapping from `resources.ts`

### Resource Configuration System
- **Resource Mapping**: Central mapping from React Admin resources to database entities (lines 7-36)
- **Search Configuration**: Defines searchable fields per resource type (lines 41-49)
- **Soft Delete Support**: Identifies resources supporting soft delete patterns (lines 54-61)
- **Lifecycle Config**: Metadata for attachment, avatar, and validation features (lines 66-93)

## Key Differences Between Providers

### dataProvider.ts (Current Production)
**Strengths:**
- Mature lifecycle callback system with 27 different callbacks
- Rich custom method library (20+ methods)
- Full feature parity with existing application
- Comprehensive file upload and avatar processing
- Junction table support for many-to-many relationships

**Architecture:**
- Base provider → Custom methods wrapper → Lifecycle callbacks wrapper → Final provider
- File processing integrated into lifecycle callbacks
- Search functionality via `applyFullTextSearch()` helper (lines 530-563)

### unifiedDataProvider.ts (Experimental)
**Strengths:**
- Cleaner separation of concerns with validation registry
- Built-in error logging and context tracking
- Structured for future transformation additions
- Simpler call chain (2 layers max vs 4+)
- Better testability with mocked validation functions

**Limitations:**
- Missing all custom methods from production provider
- No lifecycle callback support
- No file upload or avatar processing
- Limited to basic CRUD + validation

## Custom Methods Inventory

### Business Logic Methods (dataProvider.ts lines 155-241)
- `salesCreate(body: SalesFormData)`: User management via edge functions (lines 155-167)
- `salesUpdate(id, data)`: Update user profiles (lines 168-197)
- `updatePassword(id)`: Password reset functionality (lines 198-213)
- `unarchiveOpportunity(opportunity)`: Complex reordering logic for Kanban (lines 214-238)
- `getActivityLog(companyId?)`: Activity timeline aggregation (lines 239-241)

### Junction Table Methods (dataProvider.ts lines 242-381)
**Contact-Organization Relationships:**
- `getContactOrganizations(contactId)`: Fetch contact's organizations (lines 243-253)
- `addContactToOrganization(contactId, organizationId, params)`: Add relationship (lines 254-275)
- `removeContactFromOrganization(contactId, organizationId)`: Remove relationship (lines 276-288)

**Opportunity Participants:**
- `getOpportunityParticipants(opportunityId)`: Multi-stakeholder support (lines 290-300)
- `addOpportunityParticipant(opportunityId, organizationId, params)`: Add participant (lines 301-323)
- `removeOpportunityParticipant(opportunityId, organizationId)`: Remove participant (lines 324-336)

**Opportunity Contacts:**
- `getOpportunityContacts(opportunityId)`: Contact associations (lines 338-348)
- `addOpportunityContact(opportunityId, contactId, params)`: Add contact (lines 349-368)
- `removeOpportunityContact(opportunityId, contactId)`: Remove contact (lines 369-381)

## Provider Export Patterns

### Current Export Structure
```typescript
// src/atomic-crm/providers/supabase/index.ts
export { authProvider } from "./authProvider";
export { dataProvider } from "./dataProvider";

// src/atomic-crm/providers/types.ts
export type { CrmDataProvider } from "./supabase/dataProvider";
```

### Consumer Usage Pattern
```typescript
// src/atomic-crm/root/CRM.tsx (lines 14-16)
import {
  authProvider as supabaseAuthProvider,
  dataProvider as supabaseDataProvider,
} from "../providers/supabase";

// Components use via React Admin hooks
const dataProvider = useDataProvider(); // Typed as CrmDataProvider
```

## Lifecycle Callbacks Pattern

### File Processing Callbacks (lines 390-419)
- `contactNotes.beforeSave`: Attachment upload processing
- `opportunityNotes.beforeSave`: Attachment upload processing
- `sales.beforeSave`: Avatar upload processing

### Avatar/Logo Processing (lines 420-468)
- `contacts.beforeCreate/beforeUpdate`: Auto-generate avatars from email
- `organizations.beforeCreate/beforeUpdate`: Logo processing and timestamp injection

### Search Enhancement (lines 428-501)
- `*.beforeGetList`: Full-text search parameter transformation
- Supports FTS columns for email/phone fields
- Auto-applies soft delete filtering

### Validation Callbacks (lines 504-526)
- `tags.beforeCreate/beforeUpdate`: Semantic color validation
- Integrated with tag color system validation

## Current Usage Patterns

### Direct DataProvider Usage
Components access provider through React Admin's `useDataProvider()` hook:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/useContactImport.tsx`: Bulk import operations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityShow.tsx`: Custom opportunity operations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Kanban drag-drop functionality

### Resource Registration
All resources registered in `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` with lazy-loaded components, React Admin auto-generates routes and navigation.

## Edge Cases & Gotchas

### Resource Mapping Complexity
- Summary views automatically selected for list operations (opportunities, organizations, contacts)
- Resource name mapping handles legacy compatibility while preventing backward compatibility fallbacks
- Search field configuration varies by resource type with special FTS column handling

### File Upload Dependencies
- File processing tightly coupled to lifecycle callbacks
- Upload path generation uses random filenames with timestamp-based logic
- Supabase Storage integration requires specific bucket configuration ("attachments")

### Junction Table Pattern
- Many-to-many relationships handled via custom methods rather than standard React Admin patterns
- Each junction table has its own CRUD method trio (get/add/remove)
- Composite key patterns using string concatenation (`${id1}-${id2}`)

### Kanban Reordering Complexity
- `unarchiveOpportunity` performs complex index reordering across all opportunities in same stage
- Requires full stage query + batch updates for proper positioning
- Index-based ordering system for drag-drop functionality

## Validation Integration Approaches

### Current Approach (dataProvider.ts)
- Validation scattered across lifecycle callbacks
- Tag color validation in beforeCreate/beforeUpdate hooks
- Form-level validation handled separately in component layer

### Unified Approach (unifiedDataProvider.ts)
- Centralized validation registry with Zod schema integration
- Resource-specific validation functions called before database operations
- Structured error formatting for React Admin compatibility
- Future-ready for data transformation pipeline integration

## Performance Considerations

### Summary View Optimization
Both providers automatically route list queries to optimized database views:
- `opportunities_summary` instead of `opportunities` table
- `organizations_summary` instead of `organizations` table
- `contacts_summary` instead of `contacts` table

### Search Performance
- Full-text search columns (email_fts, phone_fts) for optimized queries
- ILIKE pattern matching for other searchable fields
- Soft delete filtering applied automatically without explicit user action

## Testing Coverage

### Current Provider Tests (dataProvider.spec.ts)
- Mocked Supabase client and base provider
- Basic CRUD operation testing structure
- Environment variable validation

### Unified Provider Tests (unifiedDataProvider.test.ts)
- Validation integration testing with mocked Zod validators
- Error handling and logging verification
- Modular test structure for validation registry testing

## Relevant Docs
- [React Admin DataProvider Documentation](https://marmelab.com/react-admin/DataProviders.html) - Interface specification
- [Supabase Client Library](https://supabase.com/docs/reference/javascript) - Base provider functionality
- [Zod Documentation](https://zod.dev/) - Validation schema approach in unified provider