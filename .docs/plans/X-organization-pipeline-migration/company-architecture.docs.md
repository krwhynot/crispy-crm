# Company Architecture Research

The Atomic CRM currently uses "companies" terminology throughout the application while the database schema and validation layer already support "organizations." This research documents all components, files, and references that need updating when migrating from "company" terminology to "organization" to create a consistent naming convention.

## Relevant Files

### Core Components Directory (`src/atomic-crm/companies/`)
- `/src/atomic-crm/companies/AutocompleteCompanyInput.tsx`: Autocomplete input component for selecting companies
- `/src/atomic-crm/companies/CompanyAside.tsx`: Sidebar component for company details
- `/src/atomic-crm/companies/CompanyAvatar.tsx`: Avatar display component for companies
- `/src/atomic-crm/companies/CompanyCard.tsx`: Card display component for company grid/list views
- `/src/atomic-crm/companies/CompanyCreate.tsx`: Create form component for new companies
- `/src/atomic-crm/companies/CompanyEdit.tsx`: Edit form component for existing companies
- `/src/atomic-crm/companies/CompanyEmpty.tsx`: Empty state component when no companies exist
- `/src/atomic-crm/companies/CompanyInputs.tsx`: Shared form input components for company data
- `/src/atomic-crm/companies/CompanyList.spec.ts`: Test file for CompanyList component
- `/src/atomic-crm/companies/CompanyList.tsx`: Main list view component with filtering and pagination
- `/src/atomic-crm/companies/CompanyListFilter.tsx`: Filter sidebar for company list view
- `/src/atomic-crm/companies/CompanyOrganizationType.spec.ts`: Test file for organization type functionality
- `/src/atomic-crm/companies/CompanyOrganizationType.tsx`: Component for selecting organization type
- `/src/atomic-crm/companies/CompanyShow.tsx`: Detail view component for individual companies
- `/src/atomic-crm/companies/GridList.tsx`: Grid layout component for company list
- `/src/atomic-crm/companies/index.ts`: Resource configuration export for React Admin
- `/src/atomic-crm/companies/sizes.ts`: Company size enumeration and utilities

### Data Layer & Configuration
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Maps companies to organizations in validation (lines 55-58)
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource mapping configuration with companies->companies mapping
- `/src/atomic-crm/validation/organizations.ts`: Validation schemas (already uses "organizations" naming with company aliases)
- `/src/atomic-crm/types.ts`: TypeScript definitions including Company type and related interfaces
- `/src/atomic-crm/root/CRM.tsx`: Main app registration of companies resource (line 148)
- `/src/atomic-crm/root/defaultConfiguration.ts`: Default company sectors configuration

### Integration Points
- `/src/atomic-crm/contacts/MultiOrganizationInput.tsx`: Multi-organization relationship management (references AutocompleteCompanyInput)
- `/src/atomic-crm/providers/commons/getCompanyAvatar.ts`: Utility function for company avatar generation
- `/src/atomic-crm/providers/commons/getCompanyAvatar.spec.ts`: Test file for avatar utility

### Activity & Event System
- `/src/atomic-crm/activity/ActivityLogCompanyCreated.tsx`: Activity log component for company creation events
- `/src/atomic-crm/consts.ts`: Activity event constants including COMPANY_CREATED

### Cross-Module References
- `/src/atomic-crm/dashboard/OpportunitiesPipeline.tsx`: Imports CompanyAvatar for pipeline display
- `/src/atomic-crm/notes/Note.tsx`: Imports CompanyAvatar for note displays
- `/src/atomic-crm/opportunities/OpportunityEdit.tsx`: Imports CompanyAvatar for opportunity forms
- `/src/atomic-crm/opportunities/OpportunityShow.tsx`: Imports CompanyAvatar for opportunity details
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Imports AutocompleteCompanyInput for organization selection
- `/src/atomic-crm/contacts/ContactShow.tsx`: Imports CompanyAvatar for contact organization display
- `/src/atomic-crm/activity/ActivityLogOpportunityNoteCreated.tsx`: Imports CompanyAvatar for activity logging

## Architectural Patterns

### Resource Registration Pattern
- **React Admin Resource Configuration**: Companies registered as `<Resource name="companies" {...companies} />` in CRM.tsx
- **Module Export Structure**: Each entity module exports `{ list, create, edit, show }` components from index.ts
- **Lazy Component Loading**: Components are imported directly in CRM.tsx, no lazy loading currently implemented

### Data Flow Architecture
- **Unified Data Provider**: Single provider handles both "companies" and "organizations" resource names via aliases
- **Database Mapping**: Resources map to database tables via RESOURCE_MAPPING configuration
- **Validation Layer**: Zod schemas defined for organizations with company aliases for backward compatibility

### Multi-Organization Support
- **Junction Table**: `contact_organizations` table manages many-to-many relationships between contacts and companies
- **Primary Organization**: Backward compatibility maintained via `company_id` field on contacts table
- **Multi-Organization Input**: Complex form component manages both primary and additional organization relationships

### Avatar & Display Pattern
- **CompanyAvatar Component**: Reusable avatar component used across multiple modules (opportunities, contacts, activities)
- **Favicon Fallback**: Avatar system uses website favicon as fallback when no logo provided
- **Autocomplete Pattern**: Standardized autocomplete input component for company selection

## Edge Cases & Gotchas

### Backward Compatibility Layer
- **Dual Resource Names**: System supports both "companies" and "organizations" resource names in unifiedDataProvider (lines 55-58)
- **Legacy Field Names**: Contacts still use `company_id` for primary organization relationship for backward compatibility
- **Validation Aliases**: Organization validation schemas export company aliases to maintain existing API contracts

### Activity System Integration
- **Company Created Events**: Activity log specifically tracks "company.created" events that would need renaming
- **URL References**: Activity logs hardcode `/companies/${id}/show` routes that need updating
- **Cross-Module Avatar Usage**: CompanyAvatar component is imported in 8+ different modules creating widespread coupling

### Database Schema Assumptions
- **Table Name Mismatch**: Frontend uses "companies" while validation layer expects "organizations" (resolved via aliases)
- **Summary Views**: System uses `companies_summary` views for optimized list queries
- **Junction Table Names**: `contact_organizations` table name suggests organizations, but frontend references companies

### Form and Input Complexities
- **MultiOrganizationInput Component**: Complex component manages both primary company (backward compatibility) and additional organizations array
- **Organization Type vs Company Type**: Mixed terminology in form fields and validation schemas
- **Reference Field Mappings**: Multiple components reference "companies" resource that would need updating

## Database Schema Relationships

### Core Tables (Inferred)
- **`companies` table**: Main organization/company entity table
- **`companies_summary` view**: Optimized view for list operations with computed fields
- **`contact_organizations` table**: Junction table for many-to-many contact-organization relationships
- **`contacts` table**: Contains `company_id` field for primary organization relationship

### Key Relationships
- **One-to-Many**: Companies have many contacts via `company_id` foreign key
- **Many-to-Many**: Contacts can belong to multiple organizations via `contact_organizations` junction table
- **Self-Referential**: Companies support `parent_company_id` for hierarchical relationships
- **Opportunity Relationships**: Opportunities reference multiple organization types (customer, principal, distributor)

### Junction Table Fields (from types.ts)
```typescript
ContactOrganization = {
  contact_id: Identifier;
  organization_id: Identifier;
  is_primary_organization: boolean;
  purchase_influence: 'High' | 'Medium' | 'Low' | 'Unknown';
  decision_authority: 'Decision Maker' | 'Influencer' | 'End User' | 'Gatekeeper';
  role?: ContactRole;
}
```

## Migration Impact Analysis

### High Impact Changes (Directory/File Renames)
- **`/companies/` directory**: Entire directory needs renaming to `/organizations/`
- **All Component Files**: 17 component files need renaming from `Company*` to `Organization*`
- **Resource Registration**: `companies` resource name in CRM.tsx needs updating
- **Import Statements**: 10+ files importing from companies directory need path updates

### Medium Impact Changes (Internal References)
- **Component Names**: All component class/function names need updating from Company to Organization
- **Type Definitions**: Company type and related interfaces need renaming
- **Activity Constants**: COMPANY_CREATED constant needs updating to ORGANIZATION_CREATED
- **URL Routes**: Hardcoded `/companies/` routes in activity logs and navigation

### Low Impact Changes (Configuration)
- **Default Sectors**: `defaultCompanySectors` configuration variable
- **Resource Mapping**: Update RESOURCE_MAPPING if changing database table names
- **Test Files**: 2 test files need updating for new component names

### Validation Layer (Already Prepared)
- **Schemas Ready**: Organization validation schemas already exist with company aliases
- **Data Provider Ready**: UnifiedDataProvider already handles both resource names
- **Database Ready**: System assumes organizations table structure already in place