# Data Provider Architecture Research

Research findings on the unified Supabase data provider structure, highlighting current backward compatibility patterns, junction table operations, and validation integration points that need to be addressed during the backward compatibility removal effort.

## Relevant Files
- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Main unified data provider with lifecycle callbacks and junction table methods
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping configuration with removed legacy resources
- `/src/atomic-crm/providers/commons/activity.ts`: Activity log aggregation requiring multiple queries - needs optimization
- `/src/atomic-crm/providers/commons/getContactAvatar.ts`: Contact avatar resolution from Gravatar/favicon services
- `/src/atomic-crm/providers/commons/getOrganizationAvatar.ts`: Organization logo fallback via favicon service
- `/src/atomic-crm/providers/commons/canAccess.ts`: Simple role-based access control for admin/non-admin users
- `/src/atomic-crm/types.ts`: Type definitions with extensive backward compatibility fields
- `/src/atomic-crm/tags/tag-colors.ts`: Legacy hex-to-semantic color migration utilities

## Architectural Patterns

- **Unified Provider Pattern**: Single `supabaseDataProvider` wrapped with lifecycle callbacks for file uploads, avatar processing, and full-text search
- **Resource Mapping Layer**: `getResourceName()` function handles resource name mapping, though legacy mappings are already removed
- **Summary View Optimization**: Uses dedicated `*_summary` views for list operations to optimize query performance
- **Junction Table Management**: Custom methods for managing many-to-many relationships (`contact_organizations`, `opportunity_participants`, `opportunity_contacts`)
- **Lifecycle Callback System**: React Admin's `withLifecycleCallbacks` for preprocessing data before CRUD operations
- **Soft Delete Support**: Automatic filtering via `deleted_at` field for supported resources
- **Full-Text Search**: Uses `@ilike` operators with specialized email/phone field handling (`email_fts`, `phone_fts`)

## Backward Compatibility Handling

### Tag Color Migration System
- **Legacy Hex Migration**: `isLegacyHexColor()` and `migrateHexToSemantic()` functions automatically convert old hex colors to semantic names
- **Validation Layer**: Tag creation/update callbacks check for legacy colors and migrate them during save operations
- **Mapping Table**: `HEX_TO_SEMANTIC_MAP` provides one-to-one hex-to-semantic conversions

### Contact Multi-Organization Support
- **Primary Organization Fields**: Contact type maintains `company_id` for backward compatibility alongside new multi-org structure
- **Junction Table Fields**: `ContactOrganization` includes `is_primary_contact` for legacy compatibility
- **Type Definitions**: Extensive backward compatibility fields in Contact type (lines 87-93, 209-211 in types.ts)

### Resource Name Handling
- **NO LEGACY MAPPINGS**: Resources config explicitly states "NO BACKWARD COMPATIBILITY" with removed deals/dealNotes mappings
- **Clean Resource Names**: All resources mapped directly without legacy aliases (organizations, contacts, opportunities)

## Transaction Patterns

### Multi-Table Operations
- **Opportunity Unarchiving**: Complex transaction updating multiple opportunity records with index reordering (`unarchiveOpportunity`)
- **Contact-Organization Management**: Direct Supabase calls for junction table operations without transactions
- **File Upload Integration**: Lifecycle callbacks handle file uploads before database operations

### Junction Table Query Patterns
- **Contact Organizations**: `getContactOrganizations()` with organization join via `companies(*)` expansion
- **Opportunity Participants**: Similar pattern for multi-stakeholder opportunity management
- **Opportunity Contacts**: Many-to-many contact-opportunity relationships

## Edge Cases & Gotchas

- **Activity Log Performance**: `getActivityLog()` requires 5+ large queries and needs server-side optimization (comment line 18-19)
- **Infinite Scroll Limitations**: Contact filtering by company limited to 250 contacts due to query structure (line 92 comment)
- **File Upload Race Conditions**: File processing happens in lifecycle callbacks before database operations, potential for orphaned files
- **Resource Summary Views**: List operations use summary views but detail operations use full tables, creating data consistency complexity
- **Soft Delete Filtering**: Applied automatically but can be bypassed with `includeDeleted` parameter, creating data visibility issues
- **Avatar Processing**: Contact avatar generation involves multiple external API calls (Gravatar, favicon) that can timeout
- **Index Management**: Opportunity kanban reordering requires careful index field management to maintain sort order

## Specific Functions Needing Updates

### Remove Backward Compatibility Fields
- **Contact Type**: Remove `company_id`, primary organization fields (lines 73, 87-93 in types.ts)
- **ContactOrganization Type**: Remove `is_primary_contact` field (line 110 in types.ts)
- **Opportunity Type**: Remove `company_id`, `archived_at` fields (lines 210-211 in types.ts)
- **Company Type Alias**: Remove `Company = Organization` alias (line 57 in types.ts)

### Tag Color Migration Removal
- **Data Provider Callbacks**: Remove hex color migration logic from tag lifecycle callbacks (lines 512-546)
- **Validation Functions**: Remove legacy hex support from `validateTagColor()` and related functions
- **Migration Utilities**: Remove `migrateHexToSemantic()`, `isLegacyHexColor()`, `getHexFallback()` functions

### Activity Log Optimization
- **Replace Multi-Query Pattern**: Current `getActivityLog()` needs consolidation into single server-side view
- **Remove Legacy Activity Types**: Clean up activity type constants and related type definitions

## Validation Integration Points

- **Zod Schema Boundary**: Validation happens at data provider level through lifecycle callbacks
- **File Upload Validation**: Attachment processing integrated into note creation callbacks
- **Avatar Processing**: Contact/organization avatar generation integrated into create/update callbacks
- **Color Validation**: Tag color validation with legacy migration happens during save operations
- **Search Field Validation**: Full-text search configuration tied to resource definitions

## Relevant Docs

- [React Admin DataProvider Documentation](https://marmelab.com/react-admin/DataProviders.html)
- [Supabase PostgREST API](https://postgrest.org/en/stable/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Internal validation schemas: `/src/atomic-crm/validation/`