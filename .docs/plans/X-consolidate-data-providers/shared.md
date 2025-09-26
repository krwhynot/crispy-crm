# Data Provider Consolidation - Shared Architecture

The data provider architecture consists of two competing providers: a production provider with 607 lines of complex lifecycle callbacks and custom methods, and an experimental unified provider with 386 lines implementing a cleaner validation registry pattern. The consolidation requires merging 20+ custom methods, lifecycle callbacks for file uploads, junction table operations, and validation schemas into a single provider following Engineering Constitution principles #1 (single unified provider) and #3 (Zod at API boundary).

## Relevant Files

### Core Provider Files
- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Current production provider with lifecycle callbacks and custom methods
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Experimental unified provider with validation registry
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping configuration for summary views
- `/src/atomic-crm/providers/supabase/index.ts`: Provider exports to the application

### Validation Layer
- `/src/atomic-crm/validation/opportunities.ts`: Complex opportunity validation with stage-specific fields
- `/src/atomic-crm/validation/organizations.ts`: Company validation with URL validators
- `/src/atomic-crm/validation/contacts.ts`: Multi-organization contact validation
- `/src/atomic-crm/validation/tasks.ts`: Task validation with date transformation
- `/src/atomic-crm/validation/tags.ts`: Semantic color enforcement
- `/src/atomic-crm/validation/notes.ts`: Note validation with attachment support

### Component Consumers (High Impact)
- `/src/atomic-crm/opportunities/OpportunityShow.tsx`: Uses custom unarchiveOpportunity method
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Complex drag-drop with batch updates
- `/src/atomic-crm/sales/SalesCreate.tsx`: Custom salesCreate method
- `/src/atomic-crm/sales/SalesEdit.tsx`: Custom salesUpdate and updatePassword methods
- `/src/atomic-crm/contacts/useContactImport.tsx`: Bulk operations with caching
- `/src/atomic-crm/contacts/ContactMultiOrg.tsx`: Junction table UI operations

### Service Layer Pattern
- `/src/atomic-crm/providers/commons/activity.ts`: Activity log aggregation service
- `/src/atomic-crm/providers/commons/getContactAvatar.ts`: Avatar generation utilities
- `/src/atomic-crm/providers/commons/getOrganizationAvatar.ts`: Logo processing utilities

### File Upload Components
- `/src/components/admin/file-input.tsx`: React Admin integrated file input
- `/src/atomic-crm/misc/ImageEditorField.tsx`: Avatar cropping component
- `/src/atomic-crm/notes/NoteAttachments.tsx`: Attachment display component

## Relevant Tables

### Core Entities
- `opportunities`: Sales pipeline with stage management
- `organizations`: Companies with hierarchy support
- `contacts`: People with JSONB email/phone arrays
- `opportunityNotes`: Communication history with attachments
- `tags`: Semantic color-based tagging system

### Junction Tables (Critical for Many-to-Many)
- `contact_organizations`: Contact-Organization relationships with roles and influence
- `opportunity_participants`: Multi-stakeholder opportunity management
- `contact_preferred_principals`: Contact advocacy tracking
- `interaction_participants`: Activity participant tracking

### Optimized Views
- `opportunities_summary`: Performance-optimized opportunity list view
- `organizations_summary`: Performance-optimized company list view
- `contacts_summary`: Performance-optimized contact list view

## Relevant Patterns

### **Lifecycle Callbacks Pattern**: Current provider wraps base with `withLifecycleCallbacks` for file uploads, avatar processing, and search enhancement. See examples in `/src/atomic-crm/providers/supabase/dataProvider.ts:386-528`.

### **Validation Registry Pattern**: Unified provider maps resources to validation functions, centralizing Zod schema validation at API boundary. Implementation at `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts:44-85`.

### **Junction Table Operations**: Custom methods for many-to-many relationships (getContactOrganizations, addOpportunityParticipant, etc). See `/src/atomic-crm/providers/supabase/dataProvider.ts:242-381`.

### **File Upload Integration**: uploadToBucket function handles all Supabase Storage operations with automatic processing. Located at `/src/atomic-crm/providers/supabase/dataProvider.ts:565-606`.

### **Resource Mapping**: Automatic routing to summary views for performance optimization. Configuration in `/src/atomic-crm/providers/supabase/resources.ts:7-36`.

### **Service Layer Pattern**: Business logic separated from provider using service functions. Example: `/src/atomic-crm/providers/commons/activity.ts`.

### **Soft Delete Filtering**: All queries automatically filter out soft-deleted records via deleted_at timestamps. Applied in lifecycle callbacks.

### **Full-Text Search**: FTS columns for optimized search on email/phone fields. Implementation at `/src/atomic-crm/providers/supabase/dataProvider.ts:530-563`.

## Relevant Docs

**`/home/krwhynot/Projects/atomic/CLAUDE.md`**: You _must_ read this when working on provider consolidation for Engineering Constitution principles, especially #1 (single unified provider), #3 (Zod at API boundary), and #9 (no backward compatibility).

**`/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/requirements.md`**: You _must_ read this when implementing the consolidation phases for detailed implementation plan and success criteria.

**`/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/data-provider-research.docs.md`**: You _must_ read this when understanding current provider architecture, custom methods inventory, and lifecycle callback patterns.

**`/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/validation-research.docs.md`**: You _must_ read this when implementing validation registry and consolidating scattered validation logic.

**`/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/junction-table-research.docs.md`**: You _must_ read this when migrating junction table operations and understanding many-to-many relationship patterns.

**`/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/storage-research.docs.md`**: You _must_ read this when extracting file upload utilities and implementing transformer registry for avatars/logos.

**`/home/krwhynot/Projects/atomic/.docs/plans/consolidate-data-providers/component-research.docs.md`**: You _must_ read this when updating component consumers and understanding impact analysis for migration.