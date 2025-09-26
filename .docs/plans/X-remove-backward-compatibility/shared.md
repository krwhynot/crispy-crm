# Remove Backward Compatibility - Shared Architecture Reference

This plan removes all backward compatibility fields and patterns from the Atomic CRM codebase following Engineering Constitution Principle #9: "Never maintain backward compatibility - fail fast". The system will transition from dual-pattern support to pure junction table relationships for contact-organization associations and clean opportunities-based schemas throughout.

## Relevant Files

### Validation Layer
- `/src/atomic-crm/validation/contacts.ts`: Contact validation with legacy fields on lines 75, 90, 104-109
- `/src/atomic-crm/validation/opportunities.ts`: Opportunity validation with legacy fields on lines 118-119
- `/src/atomic-crm/validation/organizations.ts`: Clean schema, minimal backward compatibility
- `/src/atomic-crm/validation/index.ts`: Main validation module exports and registry

### Data Provider Layer
- `/src/atomic-crm/providers/supabase/dataProvider.ts`: Unified provider with junction table methods and lifecycle callbacks
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Validation integration at API boundaries
- `/src/atomic-crm/providers/commons/activity.ts`: Activity aggregation requiring optimization (5+ queries)
- `/src/atomic-crm/tags/tag-colors.ts`: Legacy hex-to-semantic color migration utilities

### Component Layer - High Impact
- `/src/atomic-crm/contacts/MultiOrganizationInput.tsx`: Dual-mode form component (lines 45, 49, 63, 77, 100-133)
- `/src/atomic-crm/contacts/ContactShow.tsx`: Legacy field display (lines 38-48, 61-65, 81-85)
- `/src/atomic-crm/contacts/ContactList.tsx`: CSV export with legacy fields (lines 73, 83-84, 109)
- `/src/atomic-crm/contacts/ContactListContent.tsx`: List display with company_id (lines 66-75, 81-85)

### Type Definitions
- `/src/atomic-crm/types.ts`: Legacy field definitions (lines 73, 90, 110, 210-211, 251, 266)

### Test Files
- `/src/atomic-crm/contacts/ContactMultiOrg.spec.ts`: Backward compatibility tests (lines 342-396)
- `/tests/performance/junction-table-performance.spec.ts`: Junction table performance benchmarks

### Database Schema
- `/supabase/migrations/20250125000000_fresh_crm_schema.sql`: Complete schema with triggers maintaining backward compatibility

## Relevant Tables

### Primary Tables
- `contacts`: Contains legacy `company_id` field (to be removed)
- `companies`: Organizations with hierarchical relationships (clean)
- `opportunities`: Contains legacy `company_id` and `archived_at` fields (to be removed)

### Junction Tables
- `contact_organizations`: Many-to-many with is_primary logic and influence metrics
- `opportunity_participants`: Multi-principal support with role-based relationships
- `interaction_participants`: Activity participant tracking
- `contact_preferred_principals`: Principal advocacy strength tracking

## Relevant Patterns

### Core Patterns to Remove
**Legacy Field Pattern**: Direct foreign keys (`company_id`, `is_primary_contact`) replaced by junction table relationships - see `/src/atomic-crm/contacts/ContactShow.tsx:38-48`

**Dual-Mode Components**: Components supporting both patterns simultaneously must transition to single pattern - see `/src/atomic-crm/contacts/MultiOrganizationInput.tsx:100-133`

**Backward Compatibility Triggers**: Database triggers auto-sync legacy fields with junction tables - see `sync_primary_organization()` function in migration

**Hex Color Migration**: Tag system converts legacy hex colors to semantic names - see `/src/atomic-crm/tags/tag-colors.ts`

### Patterns to Preserve
**Single-Point Validation**: Zod schemas at API boundaries only per Constitution Principle #2 - see `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts:178-192`

**Junction Table Transactions**: Multi-table operations must be atomic per Principle #8 - see `unarchiveOpportunity()` in dataProvider

**Primary Relationship Enforcement**: Exactly one `is_primary = true` per contact validated in UI and database - see `/src/atomic-crm/contacts/ContactMultiOrg.tsx:validateOnePrimary()`

**Soft Delete Pattern**: Use `deleted_at` timestamps with exclusion constraints for data retention - all junction tables follow this pattern

## Relevant Docs

**`/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/requirements.md`**: You _must_ read this when working on the implementation plan, success criteria, and risk mitigation strategies.

**`/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/validation-research.docs.md`**: You _must_ read this when working on validation schema updates and understanding backward compatibility field locations.

**`/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/data-provider-research.docs.md`**: You _must_ read this when working on data provider updates, transaction patterns, and lifecycle callbacks.

**`/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/component-research.docs.md`**: You _must_ read this when working on component refactoring, understanding current vs desired patterns, and implementation order.

**`/home/krwhynot/Projects/atomic/.docs/plans/remove-backward-compatibility/junction-table-research.docs.md`**: You _must_ read this when working on junction table operations, understanding relationship management, and performance characteristics.

## Implementation Notes

### Critical Context
This atomic breaking change is only appropriate because the system is NOT in production. Future breaking changes on a live system will require multi-phase, schema-compatible rollouts per Constitution Principle #21.

### Performance Benchmarks
Based on testing with 500+ contacts and 1500+ junction records:
- Junction queries: 150-250ms for complex many-to-many operations
- Bulk inserts: ~500ms for 150 junction records
- Multi-table joins: ~400ms across multiple junction tables

### ESLint Prevention
Add rules to `.eslintrc.js` to prevent reintroduction of legacy fields per Constitution Principle #16 - see requirements.md lines 194-219 for specific configuration.