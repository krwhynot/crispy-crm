# Junction Table Patterns Research

Research analysis of junction table implementation patterns, database relationships, and performance considerations in the Atomic CRM codebase.

## Relevant Files
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250125000000_fresh_crm_schema.sql`: Complete schema with junction table definitions
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`: Junction table support methods
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactMultiOrg.tsx`: UI component for managing contact-organization relationships
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactMultiOrg.spec.ts`: Junction table validation tests
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping configuration
- `/home/krwhynot/Projects/atomic/tests/performance/junction-table-performance.spec.ts`: Comprehensive performance benchmarks
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`: TypeScript types for junction relationships

## Architectural Patterns

### Primary Junction Tables
- **contact_organizations**: Many-to-many contact↔organization relationships with is_primary logic
- **opportunity_participants**: Multi-principal support for opportunities (customer, principal, distributor roles)
- **interaction_participants**: Activity participant tracking with contact/organization references
- **contact_preferred_principals**: Principal advocacy tracking with strength metrics

### Junction Table Schema Structure
Common patterns across all junction tables:
- **Composite Primary Key**: Surrogate `id` + unique constraint on relationship fields
- **is_primary Boolean Logic**: Ensures only one primary relationship per context
- **Soft Delete Support**: `deleted_at` timestamp for data retention
- **Audit Fields**: `created_at`, `updated_at`, `created_by` for change tracking
- **Role-Based Relationships**: Enum types for relationship roles and permissions

### Performance Index Strategy
- **Composite Indexes**: Multi-column indexes on frequently joined fields
- **Primary Key Indexes**: Optimized for `is_primary = true` queries
- **Deletion Indexes**: Partial indexes on `deleted_at IS NULL`
- **Role-Based Indexes**: Separate indexes for different relationship roles

## Contact Organizations Junction Table

### Schema Definition
```sql
CREATE TABLE contact_organizations (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    is_primary_decision_maker BOOLEAN DEFAULT false,
    is_primary_contact BOOLEAN DEFAULT false,
    role contact_role,
    purchase_influence SMALLINT CHECK (purchase_influence BETWEEN 0 AND 100),
    decision_authority SMALLINT CHECK (decision_authority BETWEEN 0 AND 100),
    relationship_start_date DATE DEFAULT CURRENT_DATE,
    relationship_end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by BIGINT REFERENCES sales(id),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_contact_organization_active
        EXCLUDE (contact_id WITH =, organization_id WITH =)
        WHERE (deleted_at IS NULL)
);
```

### Key Features
- **Exclusion Constraint**: Prevents duplicate active relationships
- **Tri-state Primary Logic**: `is_primary`, `is_primary_decision_maker`, `is_primary_contact`
- **Influence Metrics**: Numerical scoring (0-100) for purchase influence and decision authority
- **Temporal Tracking**: Start/end dates for relationship lifecycle

### Performance Indexes
- `idx_contact_organizations_contact`: Fast lookup by contact
- `idx_contact_organizations_organization`: Fast lookup by organization
- `idx_contact_organizations_primary`: Optimized primary relationship queries
- `idx_contact_organizations_decision_makers`: Decision maker filtering

## Relationship Management Patterns

### is_primary Enforcement
Primary relationship enforcement handled through database triggers:
```sql
CREATE OR REPLACE FUNCTION sync_primary_organization()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Update contacts.company_id for backward compatibility
        UPDATE contacts
        SET company_id = NEW.organization_id
        WHERE id = NEW.contact_id;

        -- Ensure only one primary per contact
        UPDATE contact_organizations
        SET is_primary = false
        WHERE contact_id = NEW.contact_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Data Provider Junction Methods
Specialized methods for junction table operations:
- `getContactOrganizations(contactId)`: Fetch all organization relationships
- `addContactToOrganization(contactId, organizationId, params)`: Create relationship
- `removeContactFromOrganization(contactId, organizationId)`: Delete relationship
- Similar patterns for opportunity participants and interaction participants

### UI Component Primary Logic
React components enforce single primary relationship through form validation:
```typescript
const validateOnePrimary = (value: ContactOrganization[]) => {
    const primaryCount = value.filter(org => org?.is_primary_organization).length;
    if (primaryCount > 1) {
        return 'Only one organization can be designated as primary.';
    }
    if (primaryCount === 0) {
        return 'One organization must be designated as primary.';
    }
    return undefined;
};
```

## Transaction Patterns for Relationship Updates

### Atomic Operations
Junction table updates use database-level atomicity:
- **Trigger-Based Consistency**: Primary relationship updates handled by PostgreSQL triggers
- **Constraint Enforcement**: Exclusion constraints prevent duplicate active relationships
- **Cascade Deletes**: `ON DELETE CASCADE` maintains referential integrity
- **Soft Delete Pattern**: Updates `deleted_at` instead of hard deletes

### Bulk Operations
Performance testing shows optimized patterns for bulk operations:
- **Batch Inserts**: 100-record batches for junction table inserts
- **Bulk Updates**: Single queries with `IN` clause for mass updates
- **Performance Thresholds**: 200ms for joins, 500ms for bulk inserts

## Other Junction Tables Following Similar Patterns

### opportunity_participants
- **Multi-Role Support**: customer, principal, distributor, partner, competitor roles
- **Primary Enforcement**: Only one primary per role per opportunity
- **Commission Tracking**: `commission_rate` for distributor relationships
- **Territory Management**: Geographic territory assignments

### interaction_participants
- **Activity Association**: Links contacts/organizations to specific activities
- **Role Tracking**: organizer, attendee, optional participant roles
- **Flexible References**: Either contact_id OR organization_id (not both required)

### contact_preferred_principals
- **Advocacy Metrics**: `advocacy_strength` scoring (0-100)
- **Principal Validation**: Ensures referenced organization `is_principal = true`
- **Interaction Tracking**: `last_interaction_date` for relationship freshness

## Edge Cases and Gotchas

### Primary Relationship Complexity
- **Backward Compatibility**: `contacts.company_id` maintained automatically via triggers
- **Multiple Primary Types**: Separate boolean flags for different primary relationship contexts
- **UI/Database Mismatch**: Form field `is_primary_organization` vs database `is_primary`

### Soft Delete Considerations
- **Unique Constraint Exclusion**: `WHERE (deleted_at IS NULL)` prevents constraint violations on soft-deleted records
- **Index Optimization**: Partial indexes only on active records improve performance
- **Cascade Implications**: Soft deletes don't cascade; requires application-level handling

### Performance Characteristics
Based on performance testing with 500+ contacts and 1500+ junction records:
- **Join Operations**: ~150-250ms for complex many-to-many queries
- **Bulk Inserts**: ~500ms for 150 junction records
- **Complex Filtering**: ~300ms for nested condition queries
- **Multi-Table Joins**: ~400ms for queries spanning multiple junction tables

### Database Function Patterns
Several helper functions demonstrate transaction patterns:
- `get_contact_organizations()`: Returns structured relationship data
- `get_organization_contacts()`: Reverse relationship lookup
- `create_opportunity_with_participants()`: Atomic opportunity + participants creation
- `log_interaction()`: Activity logging with automatic participant creation

## Relevant Documentation
- PostgreSQL Exclusion Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION
- Supabase PostgREST Junction Tables: https://postgrest.org/en/stable/how-tos/joins.html
- React Admin Many-to-Many: https://marmelab.com/react-admin/ManyToManyReferenceField.html