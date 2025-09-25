# CRM Frontend Components Research

Comprehensive analysis of the Atomic CRM frontend architecture, React Admin integration patterns, and migration paths for the CRM schema evolution.

## Current Component Architecture

### React Admin Resource Pattern
The CRM follows a consistent resource module structure with standardized naming:

```
src/atomic-crm/[feature]/
├── index.ts           # Resource configuration and lazy loading
├── [Feature]List.tsx  # List view with filters and actions
├── [Feature]Show.tsx  # Detail view with read-only data
├── [Feature]Edit.tsx  # Edit form in dialog modal
├── [Feature]Create.tsx # Create form in dialog modal
└── [Feature]Inputs.tsx # Shared form inputs
```

### Key Resource Configurations
- **Deals**: `/home/krwhynot/Projects/atomic/src/atomic-crm/deals/index.ts` - Only exports `list` component (kanban board)
- **Contacts**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/index.tsx` - Full CRUD with custom `recordRepresentation`
- **Companies**: `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/index.ts` - Full CRUD operations
- **Sales**: `/home/krwhynot/Projects/atomic/src/atomic-crm/sales/index.ts` - User management module

### Component Loading Strategy
All list components use React.lazy() for code splitting:
```typescript
const DealList = React.lazy(() => import("./DealList"));
```

## Deal to Opportunity Migration Path

### Current Deal Structure
**Type Definition**: `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts` (lines 114-128)
```typescript
type Deal = {
  name: string;
  company_id: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: string;           // Maps to opportunity stages
  description: string;
  amount: number;
  archived_at?: string;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number;          // Kanban board positioning
}
```

### Key Components for Migration
1. **Deal List**: `/home/krwhynot/Projects/atomic/src/atomic-crm/deals/DealList.tsx`
   - Kanban board layout with stage columns
   - Filtering by company, category, and ownership
   - Archive functionality with `archived_at` field
   - Route-based modal system for CRUD operations

2. **Deal Inputs**: `/home/krwhynot/Projects/atomic/src/atomic-crm/deals/DealInputs.tsx`
   - Three-section layout: Info, Linked To, Misc
   - Uses configuration context for stages and categories
   - Multi-contact selection via `contact_ids` array
   - Company autocomplete integration

3. **Deal Show**: `/home/krwhynot/Projects/atomic/src/atomic-crm/deals/DealShow.tsx`
   - Archive/unarchive functionality
   - Expected closing date validation and warnings
   - Integrated notes system with `ReferenceManyField`
   - Contact list display

### Migration Considerations
- **Stage Management**: Current uses string-based stages, needs mapping to opportunity lifecycle
- **Kanban Board**: Index-based positioning system requires migration strategy
- **Archive Pattern**: Soft delete with `archived_at` timestamp
- **Multi-Contact**: Array-based contact relationships already support complex associations

## Contact Multi-Organization Support

### Current Contact Structure
**Type Definition**: `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts` (lines 83-103)
```typescript
type Contact = {
  company_id: Identifier;     // Single organization reference
  email_jsonb: EmailAndType[]; // Multiple emails with types
  phone_jsonb: PhoneNumberAndType[]; // Multiple phones with types
  tags: Identifier[];         // Flexible categorization
  nb_tasks?: number;          // Computed field
  company_name?: string;      // Denormalized for display
}
```

### Contact Components Analysis
1. **Contact Inputs**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactInputs.tsx`
   - Single company selection via `ReferenceInput`
   - Email auto-population logic for name fields
   - JSONB arrays for flexible email/phone storage
   - Account manager assignment

2. **Contact Show**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactShow.tsx`
   - Company avatar and link integration
   - Notes system with status support
   - Aside component for additional details

### Multi-Organization Migration Path
- **Schema Change**: `company_id` → `company_ids: Identifier[]` or junction table
- **UI Updates**: Replace single company input with multi-select
- **Display Logic**: Update show/list views to handle multiple organizations
- **Relationship Logic**: Modify data provider to handle array relationships

## Company Components Analysis

### Current Company Structure
**Type Definition**: `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts` (lines 50-71)
```typescript
type Company = {
  sector: string;            // Industry classification
  size: 1 | 10 | 50 | 250 | 500; // Employee count ranges
  sales_id: Identifier;      // Account manager
  nb_contacts?: number;      // Computed field
  nb_deals?: number;         // Computed field
  context_links?: string[];  // Additional URLs
}
```

### Company Inputs Analysis
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/companies/CompanyInputs.tsx`

#### Current Features Suitable for Principal-Distributor
- **Flexible Address System**: Full address fields for geographic distribution
- **Context Links**: Array-based URL storage for partner portals
- **Size Classification**: Employee count ranges for partnership tiers
- **Account Manager**: Sales representative assignment
- **Logo Management**: Company branding support

#### Missing Features for Principal-Distributor
- **Relationship Type**: No field for principal/distributor classification
- **Hierarchy Support**: No parent-child company relationships
- **Territory Management**: No geographic coverage areas
- **Partnership Terms**: No commission/margin tracking
- **Certification Status**: No compliance tracking

### Principal-Distributor Extension Requirements
1. **Schema Extensions**:
   - `company_type: 'principal' | 'distributor' | 'customer'`
   - `parent_company_id?: Identifier` (for distributor hierarchies)
   - `territory_coverage?: string[]` (geographic regions)
   - `partnership_terms?: JSON` (commission structure)

2. **UI Components**:
   - Company type selector
   - Parent company reference input
   - Territory management interface
   - Partnership terms configuration

## Data Provider Patterns

### Dual Provider Architecture
**Configuration**: `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` (lines 24-26)
```typescript
const isDemoMode = import.meta.env.VITE_IS_DEMO === "true";
const defaultAuthProvider = isDemoMode ? supabaseAuthProvider : supabaseAuthProvider;
const defaultDataProvider = isDemoMode ? supabaseDataProvider : supabaseDataProvider;
```

### Supabase Provider Features
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`

#### Key Patterns:
1. **View Abstractions**:
   - `companies` → `companies_summary` for list operations
   - `contacts` → `contacts_summary` for optimized queries
   - Maintains compatibility while optimizing data access

2. **Lifecycle Callbacks**:
   - `beforeCreate/beforeUpdate`: Logo processing, avatar generation
   - `afterCreate/afterDelete`: Computed field updates
   - File upload handling for attachments

3. **Custom Methods**:
   - `unarchiveDeal()`: Complex board repositioning logic
   - `signUp()`: User registration with profile data
   - `getActivityLog()`: Cross-resource activity tracking

### Seed Data System Features
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/scripts/seed-datadataProvider.ts`

#### Key Patterns:
1. **In-Memory Data**: Generated via `/dataGenerator` for consistent demo experience
2. **Relationship Maintenance**: Manual foreign key updates and counters
3. **Supabase Compatibility**: Filter adapter for consistent query syntax
4. **User Management**: Local storage integration for session persistence

### Migration Strategy for Data Providers
- **Maintain Dual Support**: Keep both providers during transition
- **View Layer**: Use database views for complex queries
- **Computed Fields**: Handle via lifecycle callbacks or database triggers
- **Custom Methods**: Extend provider interface for CRM-specific operations

## Resource Configuration

### Central Resource Registry
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` (lines 159-166)
```typescript
<Resource name="deals" {...deals} />
<Resource name="contacts" {...contacts} />
<Resource name="companies" {...companies} />
<Resource name="contactNotes" />    // Notes-only resource
<Resource name="dealNotes" />       // Notes-only resource
<Resource name="tasks" />           // Tasks-only resource
<Resource name="sales" {...sales} />
<Resource name="tags" />            // Tags-only resource
```

### Resource Export Patterns
1. **Full CRUD Resources**: Export all components (list, show, edit, create)
2. **Specialized Resources**: Export only required components (deals only exports list)
3. **Data-Only Resources**: No component exports (notes, tasks, tags)

### Configuration Context Integration
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/root/ConfigurationContext.tsx`
- Deal stages and categories
- Company sectors and contact metadata
- Theme and branding configuration
- Runtime configuration for multi-tenant support

### Migration Considerations for Resources
- **Opportunity Resource**: New resource configuration for deal evolution
- **Organization Hierarchy**: New resources for principal-distributor relationships
- **Territory Management**: Geographic-based resource partitioning
- **Multi-Tenant**: Organization-scoped resource access patterns

## Key Architectural Patterns

### Modal-Based CRUD
- Dialog components for all edit/create operations
- Route-based modal state management
- Optimistic updates with conflict resolution

### Reference Field Patterns
- Autocomplete inputs for foreign key relationships
- Avatar components for visual relationship display
- Breadcrumb navigation for hierarchical data

### Configuration-Driven UI
- Central configuration context for business rules
- Dynamic form generation based on configuration
- Theme and branding customization support

### Activity Log Integration
- Cross-resource activity tracking
- Timeline-based display patterns
- Real-time updates via React Query

This architecture provides a solid foundation for the CRM migration with clear patterns for extending functionality while maintaining backward compatibility.