# Junction Table Research

Comprehensive analysis of many-to-many relationships and junction table operations in the Atomic CRM codebase. Junction tables enable flexible, normalized data relationships between core entities.

## Relevant Files
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250125000000_fresh_crm_schema.sql`: Complete database schema with all junction table definitions
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`: Junction table operations in data provider (lines 240-333)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping for junction tables (lines 25-30)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactMultiOrg.tsx`: Multi-organization contact component with junction table UI
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/MultiOrganizationInput.tsx`: Alternative junction table input component
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`: TypeScript interfaces for junction entities (lines 101-124)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactMultiOrg.spec.ts`: Comprehensive junction table operation tests
- `/home/krwhynot/Projects/atomic/tests/performance/junction-table-performance.spec.ts`: Junction table performance benchmarking
- `/home/krwhynot/Projects/atomic/supabase/migrations/20250926002021_add_set_primary_organization_rpc.sql`: Atomic primary organization management function

## Junction Tables and Their Purposes

### Primary Junction Tables
- **contact_organizations**: Contact ↔ Organization many-to-many relationships
  - Purpose: Contacts can belong to multiple organizations with different roles
  - Key fields: `is_primary`, `role`, `purchase_influence`, `decision_authority`
  - Constraints: Exactly one primary organization per contact (enforced via trigger)

- **opportunity_participants**: Opportunity ↔ Organization many-to-many relationships
  - Purpose: Multi-stakeholder opportunities with customers, principals, distributors
  - Key fields: `role` (customer/principal/distributor/partner/competitor), `is_primary`, `commission_rate`
  - Constraints: One primary per role type (enforced via trigger)

- **contact_preferred_principals**: Contact ↔ Principal Organization relationships
  - Purpose: Track contact advocacy for different principals
  - Key fields: `advocacy_strength`, `last_interaction_date`
  - Validation: Ensures referenced organization is marked as principal

- **interaction_participants**: Activity ↔ Contact/Organization relationships
  - Purpose: Track who participated in meetings, calls, etc.
  - Key fields: `role` (organizer/attendee/optional)
  - Flexibility: Links either to contact OR organization (or both)

### Product-Related Junction Tables
- **opportunity_products**: Opportunity ↔ Product line items
- **product_distributor_authorizations**: Product ↔ Distributor authorizations
- **product_pricing_tiers**: Product ↔ Pricing tier configurations

## Current Implementation of Junction Operations

### Data Provider Junction Methods
Located in `/src/atomic-crm/providers/supabase/dataProvider.ts`:

**Contact-Organization Operations:**
- `getContactOrganizations(contactId)`: Retrieve all organizations for a contact with nested data
- `addContactToOrganization(contactId, organizationId, params)`: Create new relationship
- `removeContactFromOrganization(contactId, organizationId)`: Delete relationship (soft delete)

**Opportunity-Participant Operations:**
- `getOpportunityParticipants(opportunityId)`: Retrieve all participants with organization data
- `addOpportunityParticipant(opportunityId, organizationId, params)`: Add participant with role validation
- `removeOpportunityParticipant(opportunityId, organizationId)`: Remove participant

### Database-Level Junction Management
**RPC Functions:**
- `set_primary_organization(p_contact_id, p_organization_id)`: Atomically manage primary organization
- `create_opportunity_with_participants(p_opportunity_data, p_participants)`: Create opportunity with participants
- `get_contact_organizations(p_contact_id)`: Helper function for organization relationships
- `get_organization_contacts(p_organization_id)`: Helper function for contact relationships

**Trigger-Based Validation:**
- `validate_opportunity_participants()`: Ensures proper role validation and primary constraints
- `sync_primary_organization()`: Maintains single primary organization per contact
- `validate_principal_organization()`: Validates principal status for preferred principals

## Components That Interact with Junction Tables

### Contact Multi-Organization Components
**ContactMultiOrg.tsx:**
- ArrayInput with SimpleFormIterator for managing multiple organization relationships
- Custom validation ensuring exactly one primary organization
- PrimaryOrganizationCheckbox with mutual exclusion logic
- Form validation: "At least one organization relationship is required"

**MultiOrganizationInput.tsx:**
- Alternative implementation using AutocompleteOrganizationInput
- React Hook Form integration with useWatch for real-time validation
- Automatic primary organization assignment if none selected

### Form Integration Patterns
- Uses React Admin's ArrayInput and SimpleFormIterator
- ReferenceInput for organization selection with autocomplete
- SelectInput for role, influence, and authority levels
- BooleanInput/Checkbox for primary organization designation

### UI/UX Patterns
- Visual indication of primary relationships
- Role-based field grouping (role, influence, authority)
- Validation feedback for constraint violations
- Batch operations support for multiple relationships

## Database Structure and Relationships

### Schema Design Patterns
**Soft Delete Support:**
- All junction tables include `deleted_at` timestamp
- RLS policies filter out soft-deleted records
- Triggers maintain referential integrity with soft deletes

**Constraint Enforcement:**
- Primary organization uniqueness via triggers (not database constraints)
- Role validation for opportunity participants (customer/principal/distributor)
- Purchase influence and decision authority enum validation

**Performance Optimization:**
- Strategic indexing on junction table foreign keys and boolean flags
- Composite indexes for common query patterns (e.g., `contact_id + is_primary`)
- GIN indexes for JSONB fields and full-text search

### Key Database Constraints
```sql
-- Contact Organizations
CONSTRAINT unique_contact_organization_active
  EXCLUDE (contact_id WITH =, organization_id WITH =)
  WHERE (deleted_at IS NULL)

-- Opportunity Participants
CONSTRAINT unique_contact_principal_active
  UNIQUE(contact_id, principal_organization_id, deleted_at)
```

## Architectural Patterns

### Junction Table CRUD Pattern
1. **Create**: Insert with validation triggers
2. **Read**: Join queries with nested selects for related data
3. **Update**: Atomic updates with constraint checking
4. **Delete**: Soft delete with `deleted_at` timestamp

### Primary Relationship Management
- Trigger-based enforcement of single primary per entity
- RPC functions for atomic primary relationship changes
- UI components with mutual exclusion logic
- Form validation preventing multiple primaries

### Data Provider Integration
- Custom junction methods extending base Supabase provider
- Resource mapping for junction table names
- Lifecycle callbacks for complex operations
- Error handling with business rule validation

## Edge Cases & Gotchas

### Primary Organization Complexity
- Triggers automatically unset other primary flags when setting new primary
- Form components must handle primary designation changes carefully
- RPC function `set_primary_organization` provides atomic operation to avoid race conditions
- Database triggers can interfere with bulk operations - use RPC functions instead

### Opportunity Participants Validation
- Organization must be marked as principal/distributor for respective roles
- Only one primary participant allowed per role type
- Commission rates only applicable for distributor roles
- Validation happens in database triggers, not just form validation

### Performance Considerations
- Junction queries can become expensive with deep nesting
- Bulk operations require batching (100 records per batch recommended)
- Complex filters on junction data should use proper indexes
- Performance thresholds: Contact-org joins <200ms, Opportunity participants <250ms

### Backward Compatibility Issues
- Legacy contact.role and contact.purchase_influence fields removed
- No backward compatibility - fail fast principle
- Forms must use junction table approach exclusively
- Error messages guide developers to junction table usage

## Relevant Docs
- [Supabase Junction Tables Guide](https://supabase.com/docs/guides/database/tables#junction-tables)
- [React Admin ArrayInput Documentation](https://marmelab.com/react-admin/ArrayInput.html)
- [PostgreSQL Exclusion Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)
- Internal migration docs at `/docs/merged/migrations/stage1/`