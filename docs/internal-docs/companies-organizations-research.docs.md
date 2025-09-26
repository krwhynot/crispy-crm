# Companies/Organizations Research

Comprehensive analysis of the current companies/organizations implementation in Atomic CRM, covering database structure, component architecture, data flow, and opportunity pipeline configuration.

## Relevant Files
- `/src/atomic-crm/companies/index.ts`: React Admin resource configuration for companies
- `/src/atomic-crm/companies/CompanyList.tsx`: Main list view with grid layout and filtering
- `/src/atomic-crm/companies/CompanyShow.tsx`: Detail view with tabs for activity, contacts, and opportunities
- `/src/atomic-crm/companies/CompanyInputs.tsx`: Form components with organization type, priority, and validation
- `/src/atomic-crm/validation/organizations.ts`: Zod validation schemas for companies/organizations
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified data provider with validation integration
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping and configuration
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Kanban board with hardcoded stage configuration
- `/src/atomic-crm/opportunities/stages.ts`: Stage organization utilities for opportunities
- `/src/atomic-crm/types.ts`: TypeScript definitions for Company, Opportunity, and related types

## Database Structure

### Companies Table
The `companies` table serves as the central organization entity with the following key structure:
- **Primary Key**: `id` (bigint, auto-increment)
- **Core Fields**: `name` (required), `organization_type` (enum), `is_principal`, `is_distributor`
- **Organization Types**: customer, principal, distributor, prospect, vendor, partner, unknown
- **Priority Levels**: A (high), B (medium-high), C (medium), D (low)
- **Contact Info**: website, phone, email, linkedin_url with validation
- **Address**: full address breakdown (address, city, state, postal_code, country)
- **Business Info**: segment, industry, annual_revenue, employee_count, founded_year
- **Relationships**: parent_company_id for hierarchical organizations
- **System Fields**: created_at, updated_at, deleted_at (soft deletes), search_tsv (full-text search)

### Foreign Key Relationships
The companies table is referenced by multiple entities:
- **Opportunities**: customer_organization_id, principal_organization_id, distributor_organization_id, company_id
- **Contacts**: company_id (primary organization for backward compatibility)
- **Contact Organizations**: organization_id (many-to-many contact↔company relationships)
- **Products**: principal_id (companies acting as product principals)
- **Activities**: organization_id (activities linked to organizations)
- **Tasks**: company_id (tasks associated with companies)
- **Opportunity Participants**: organization_id (multi-stakeholder opportunities)

### Database Views
- **companies_summary**: Optimized view with calculated fields including opportunity_count and total_revenue from closed_won opportunities

### Key Indexes and Performance
- Multiple indexes for performance including GIN indexes for full-text search
- RLS (Row Level Security) enabled with simple authenticated user policy
- Search vectors automatically updated via database triggers

## Component Architecture

### Three-Tier Component System
1. **Resource Level** (`/companies/index.ts`): Exports standard React Admin CRUD components
2. **Page Components**: List, Show, Create, Edit following React Admin patterns
3. **Form Components**: CompanyInputs with organized input sections

### Company List Implementation
- **Layout**: Grid-based view using ImageList component
- **Filtering**: CompanyListFilter for advanced filtering options
- **Sorting**: Supports name, created_at, nb_contacts fields
- **Pagination**: Configurable rows per page (10, 25, 50, 100)
- **Empty State**: Custom CompanyEmpty component when no data

### Company Show Page
- **Tabbed Interface**: Activity, Contacts, and Opportunities tabs
- **URL Routing**: Tabs controlled via URL parameters (/companies/:id/show/:tab)
- **Related Data**:
  - References contacts via contacts_summary view
  - References opportunities directly
  - Shows activity log for the company context

### Form Architecture
The CompanyInputs component is organized into logical sections:
1. **Display**: Logo upload and company name
2. **Contact**: Website, LinkedIn, phone with URL validation
3. **Context**: Organization type, priority, sector, segment, revenue
4. **Address**: Complete address information
5. **Additional**: Description, parent company, context links
6. **Account Manager**: Sales representative assignment

## Data Flow

### Unified Data Provider Architecture
The system uses a single unified data provider (`unifiedDataProvider.ts`) that:
- **Validation Integration**: Automatically validates data using Zod schemas at API boundaries
- **Resource Mapping**: Maps logical resource names to database tables/views
- **Search Enhancement**: Applies full-text search across searchable fields
- **Error Handling**: Comprehensive error logging with context
- **Soft Delete Support**: Handles deleted_at filtering automatically

### Resource Configuration
- **Resource Name**: `companies` maps to database table `companies`
- **Summary View**: Uses `companies_summary` for list and detail operations
- **Searchable Fields**: name, phone_number, website, zipcode, city, stateAbbr, description, segment
- **Validation**: Uses `validateOrganizationForSubmission` function

### Validation Architecture
Located in `/validation/organizations.ts` with comprehensive Zod schemas:
- **URL Validation**: Custom validators for website and LinkedIn URLs
- **Organization Types**: Enum validation for all supported types
- **Priority Validation**: A, B, C, D priority levels
- **Company Size**: Predefined size categories (1, 10, 50, 250, 500)
- **Error Formatting**: Converts Zod errors to React Admin format

## Current Opportunity Pipeline

### Stage Configuration
The opportunity stages are currently **hardcoded** in `OpportunityListContent.tsx`:
1. **lead**: Initial prospect stage
2. **qualified**: Qualified opportunity
3. **needs_analysis**: Requirements analysis phase
4. **proposal**: Proposal submitted
5. **negotiation**: Active negotiations
6. **closed_won**: Successfully closed
7. **closed_lost**: Lost opportunity
8. **nurturing**: Long-term nurturing

### Stage Implementation Details
- **Database Enum**: Stored as `opportunity_stage` enum in PostgreSQL
- **UI Rendering**: Kanban board with drag-drop functionality using @hello-pangea/dnd
- **Stage Logic**: Complex index-based reordering for drag-drop operations
- **No Configuration UI**: Stages are fixed and cannot be modified through the interface

### Stage Management Gotchas
- **Index Field Complexity**: Each opportunity has an `index` field for ordering within stages
- **Cross-Stage Movement**: Requires recalculating indexes for both source and destination stages
- **Database Consistency**: Updates multiple records atomically when reordering
- **Performance Impact**: Drag operations trigger multiple database updates

## Architectural Patterns

### Multi-Organization Support
- **Junction Table**: `contact_organizations` enables many-to-many contact↔company relationships
- **Backward Compatibility**: Primary `company_id` field maintained on contacts table
- **Role Tracking**: Tracks contact roles, influence, and decision authority per organization
- **Principal Relationships**: `contact_preferred_principals` table for manufacturer relationships

### Organization Type System
- **Flexible Classification**: Supports customer, principal, distributor, vendor, partner types
- **Business Logic**: Boolean flags (`is_principal`, `is_distributor`) for quick filtering
- **Hierarchical Support**: Parent-child company relationships via `parent_company_id`

### Search and Performance
- **Full-Text Search**: PostgreSQL tsvector fields with automatic trigger updates
- **Summary Views**: Optimized views for list operations with calculated fields
- **Soft Deletes**: Consistent soft delete pattern across related entities

## Edge Cases & Gotchas

### Resource Name Aliasing
- File named `organizations.ts` but exports `Company` types for backward compatibility
- Data provider maps both `companies` and `organizations` resource names to same table
- TypeScript types use `Company` but validation uses `Organization` naming

### URL Validation Complexity
- Custom LinkedIn URL validation requires exact domain matching
- Generic URL regex validation for website fields
- Form validation happens at component level, Zod validation at API boundary

### Opportunity Stage Rigidity
- Stage configuration is hardcoded and cannot be customized per customer
- Adding/removing stages requires code changes and database migration
- Stage enum values are fixed in PostgreSQL schema

### Index Field Management
- Drag-drop operations require complex index recalculation logic
- Race conditions possible during rapid drag operations
- Index field must be maintained consistently across stage changes

### Multi-Organization Data Consistency
- Primary company relationship can become inconsistent with junction table data
- Contact organization roles may conflict with primary company role settings
- Soft deletes in junction tables require careful handling

## Configuration Dependencies

### Environment Variables
- Uses standard Supabase connection variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- No company-specific configuration variables

### External Dependencies
- React Admin for UI framework and data management
- Supabase for database operations and real-time features
- Zod for validation schemas and type safety
- @hello-pangea/dnd for drag-drop functionality in opportunity stages
