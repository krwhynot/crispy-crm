# Data Provider Patterns Research

Research findings on data provider architecture, patterns, and data access strategies in the Atomic CRM application built on React Admin and Supabase.

## Relevant Files

- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`: Main data provider with lifecycle callbacks and custom methods
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Newer unified provider with integrated validation and error logging
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/authProvider.ts`: Authentication provider with role-based access
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping and configuration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/supabase.ts`: Supabase client initialization
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`: Main app configuration with provider registration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/useContactImport.tsx`: Custom hook using dataProvider directly
- `/home/krwhynot/Projects/atomic/src/atomic-crm/activity/ActivityLog.tsx`: Component using custom dataProvider methods
- `/home/krwhynot/Projects/atomic/src/hooks/useBulkExport.tsx`: Utility hook wrapping dataProvider operations

## Architectural Patterns

- **React Admin DataProvider Interface**: Core abstraction implementing CRUD operations (getList, getOne, create, update, delete, etc.)
- **Supabase Provider Extension**: Built on ra-supabase-core with custom method extensions and lifecycle callbacks
- **Resource Mapping Layer**: Clean abstraction mapping React Admin resources to database tables/views via resources.ts
- **Summary View Optimization**: Uses optimized database views (opportunities_summary, contacts_summary, etc.) for list operations
- **Provider Composition**: Uses withLifecycleCallbacks to layer transformations and validations onto base provider
- **Custom Methods Pattern**: Extends standard DataProvider with domain-specific methods (salesCreate, unarchiveOpportunity, junction table operations)
- **Direct Supabase Access**: Some operations bypass provider abstraction for complex queries and edge functions

## Edge Cases & Gotchas

- **Dual Provider Architecture**: Both legacy dataProvider.ts and newer unifiedDataProvider.ts exist, creating potential confusion
- **Resource Name Mapping**: Resources like "opportunities" map to database views like "opportunities_summary" for reads but actual tables for writes
- **Mixed Access Patterns**: Components use both useDataProvider() hook and direct supabase.from() calls depending on complexity
- **File Upload Handling**: Special uploadToBucket logic integrated into lifecycle callbacks for attachments and avatars
- **Junction Table Support**: Custom methods for many-to-many relationships (contact_organizations, opportunity_participants) not handled by standard CRUD
- **Search Implementation**: Custom full-text search logic with special handling for email/phone FTS columns
- **Soft Delete Filter**: Automatically applies deleted_at filters unless explicitly disabled with includeDeleted flag
- **Validation Integration**: unifiedDataProvider includes Zod validation at API boundary while legacy provider relies on external lifecycle callbacks
- **Error Logging**: Consolidated error logging in unified provider vs scattered error handling in legacy approach
- **Authentication Caching**: Auth provider caches user data to avoid repeated database queries but requires manual cache invalidation

## Relevant Docs

- [React Admin DataProvider Documentation](https://marmelab.com/react-admin/DataProviders.html)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [ra-supabase-core Documentation](https://github.com/marmelab/ra-supabase)
- Internal validation schemas at `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/`