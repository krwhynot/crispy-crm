# Data Provider Architecture Research

Comprehensive analysis of the Atomic CRM data provider architecture, focusing on Supabase integration, resource configuration, and deals-to-opportunities migration logic.

## Data Provider Architecture

The Atomic CRM implements a layered data provider architecture built on React Admin's DataProvider interface, with Supabase as the backend database. The architecture supports both a unified data provider (under development) and the current production implementation.

### Core Architecture Components
- **Base Provider**: `ra-supabase-core` providing PostgreSQL integration via Supabase
- **Resource Mapping**: Centralized configuration for database table/view mapping
- **Lifecycle Callbacks**: Pre/post operation hooks for data transformation and validation
- **Backward Compatibility**: Deprecated deals endpoints with migration to opportunities

## Supabase Provider Implementation

### Primary Data Provider (`/src/atomic-crm/providers/supabase/dataProvider.ts`)

**Key Features:**
- Built on `supabaseDataProvider` from `ra-supabase-core`
- Resource name mapping through `getResourceName()` function
- Summary view optimization for list/detail operations
- Full-text search support with configurable fields
- Lifecycle callbacks for data processing

**Resource Name Mapping:**
```typescript
// Uses summary views for optimized queries
if (resource === "opportunities") {
  return baseDataProvider.getList("opportunities_summary", params);
}
if (resource === "companies") {
  return baseDataProvider.getList("companies_summary", params);
}
if (resource === "contacts") {
  return baseDataProvider.getList("contacts_summary", params);
}
```

**Custom Methods:**
- `salesCreate()` / `salesUpdate()` - User management via Edge Functions
- `unarchiveOpportunity()` - Opportunity workflow management
- `getActivityLog()` - Activity tracking integration
- Junction table support for many-to-many relationships:
  - `getContactOrganizations()` / `addContactToOrganization()` / `removeContactFromOrganization()`
  - `getOpportunityParticipants()` / `addOpportunityParticipant()` / `removeOpportunityParticipant()`
  - `getOpportunityContacts()` / `addOpportunityContact()` / `removeOpportunityContact()`

### Unified Data Provider (`/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`)

**Purpose:**
Consolidates transformation logic and error logging into a single provider layer, reducing the provider chain from 4+ layers to maximum 2 layers.

**Key Features:**
- Integrated error logging with context
- Transformer registry for data format conversion
- Validation pipeline at API boundary
- Summary view routing for optimized queries
- Fail-fast error handling (no recovery attempts per Core Principle #9)

**Transformer Registry:**
```typescript
const transformerRegistry: Record<string, TransformerConfig<any, any>> = {
  opportunities: {
    transform: transformOpportunity,
    toDatabase: toOpportunityDatabase,
    transformBatch: transformOpportunities,
    validate: validateOpportunityForm,
  },
  // ... other resources
}
```

**Note**: Referenced transformer functions (`transformOpportunity`, `validateOpportunityForm`, etc.) are not yet implemented in the codebase.

## Resource Configuration

### Resource Mapping (`/src/atomic-crm/providers/supabase/resources.ts`)

**RESOURCE_MAPPING Configuration:**
```typescript
export const RESOURCE_MAPPING = {
  // Core entities
  companies: 'companies',
  contacts: 'contacts',
  opportunities: 'opportunities',
  // deals: REMOVED - use opportunities

  // Summary views for optimized queries
  companies_summary: 'companies_summary',
  contacts_summary: 'contacts_summary',
  opportunities_summary: 'opportunities_summary',

  // Junction tables
  contact_organizations: 'contact_organizations',
  opportunity_participants: 'opportunity_participants',
  opportunity_contacts: 'opportunity_contacts',

  // Other resources
  tasks: 'tasks',
  tags: 'tags',
  sales: 'sales',
  activities: 'activities',
} as const;
```

**Searchable Resources:**
- Companies: name, phone_number, website, zipcode, city, stateAbbr, description, segment
- Contacts: first_name, last_name, company_name, title, email, phone, background
- Opportunities: name, category, description, next_action

**Soft Delete Support:**
Resources supporting soft delete: companies, contacts, opportunities, contact_organizations, opportunity_participants, activities

### Lifecycle Configuration

**Resource-Specific Configurations:**
- `contactNotes` / `opportunityNotes`: Attachment handling via `uploadToBucket()`
- `contacts`: Avatar processing with `processContactAvatar()`
- `companies`: Logo processing with `processCompanyLogo()`
- `tags`: Color validation with semantic migration from hex values

## Data Transformations

### Current Implementation

**Full-Text Search Transformation:**
```typescript
const applyFullTextSearch = (columns: string[]) => (params: GetListParams) => {
  if (!params.filter?.q) return params;

  const { q, ...filter } = params.filter;
  const softDeleteFilter = params.filter?.includeDeleted ? {} : { deleted_at: null };

  return {
    ...params,
    filter: {
      ...filter,
      ...softDeleteFilter,
      "@or": columns.reduce((acc, column) => {
        if (column === "email") return { ...acc, [`email_fts@ilike`]: q };
        if (column === "phone") return { ...acc, [`phone_fts@ilike`]: q };
        return { ...acc, [`${column}@ilike`]: q };
      }, {}),
    },
  };
};
```

**File Upload Processing:**
- Attachments uploaded to Supabase Storage bucket "attachments"
- Public URL generation with path tracking
- MIME type preservation for file handling

### Planned Unified Transformations

The unified data provider references a comprehensive transformer system (not yet implemented):
- `transformOpportunity` / `toOpportunityDatabase`
- `transformOrganization` / `toDbCompany`
- `transformContact` / `contactToDatabase`
- `transformContactNote` / `toDbContactNote`
- `transformOpportunityNote` / `toDbOpportunityNote`
- `transformTag` / `tagToDatabase`
- Relationship transformers for junction tables

## React Admin Integration

### CRM Component Setup (`/src/atomic-crm/root/CRM.tsx`)

**Resource Registration:**
```typescript
<Resource name="deals" {...deals} />           // Deprecated, minimal implementation
<Resource name="opportunities" {...opportunities} />  // Primary sales pipeline
<Resource name="contacts" {...contacts} />
<Resource name="companies" {...companies} />
<Resource name="contactNotes" />               // No UI components
<Resource name="dealNotes" />                  // Deprecated
<Resource name="opportunityNotes" />           // No UI components
<Resource name="tasks" />                      // No UI components
<Resource name="sales" {...sales} />           // User management
<Resource name="tags" />                       // No UI components
```

**Data Provider Usage:**
- Default: `supabaseDataProvider` from `/src/atomic-crm/providers/supabase`
- Optional override via `dataProvider` prop
- Store: `localStorageStore(undefined, "CRM")` for persistence

## Migration-Related Code

### Deals-to-Opportunities Migration (`/src/atomic-crm/providers/commons/backwardCompatibility.ts`)

**Grace Period Management:**
- Deployment date: 2025-01-22
- Grace period: 30 days
- Automatic endpoint failure after grace period expires

**Transformation Logic:**
```typescript
// Opportunity → Deal (backward compatibility)
export function transformOpportunityToDeal(opportunity: Opportunity): Deal {
  return {
    id: opportunity.id,
    name: opportunity.name,
    company_id: opportunity.customer_organization_id || opportunity.company_id!,
    contact_ids: opportunity.contact_ids || [],
    category: opportunity.category,
    stage: opportunity.stage,
    description: opportunity.description || '',
    amount: opportunity.amount || 0,
    // ... field mappings
  };
}

// Deal → Opportunity (forward migration)
export function transformDealToOpportunity(deal: Deal): Opportunity {
  return {
    id: deal.id,
    name: deal.name,
    customer_organization_id: deal.company_id,
    company_id: deal.company_id, // backward compatibility
    stage: deal.stage as Opportunity['stage'] || 'lead',
    status: 'active' as Opportunity['status'],
    priority: 'medium' as Opportunity['priority'],
    probability: getDefaultProbabilityForStage(deal.stage),
    // ... enhanced fields with defaults
  };
}
```

**Deprecation Logging:**
- Analytics tracking via gtag events
- Console warnings in development mode
- Stack trace capture for debugging
- Usage analytics for migration monitoring

**URL Redirects:**
- Automatic `/deals/*` → `/opportunities/*` redirects
- History API integration to prevent back button issues
- Deprecation logging for URL usage tracking

### Type Definitions

**Deal Type (Legacy):**
```typescript
export type Deal = {
  name: string;
  company_id: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number;
} & Pick<RaRecord, "id">;
```

**Opportunity Type (Current):**
```typescript
export type Opportunity = {
  name: string;
  customer_organization_id: Identifier;
  principal_organization_id?: Identifier;
  distributor_organization_id?: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: 'lead' | 'qualified' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurturing';
  status: 'active' | 'on_hold' | 'nurturing' | 'stalled' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  amount: number;
  probability: number;
  estimated_close_date?: string;
  actual_close_date?: string;
  // Enhanced fields for complex sales scenarios
  next_action?: string;
  next_action_date?: string;
  competition?: string;
  decision_criteria?: string;
  // Backward compatibility
  company_id?: Identifier;
  archived_at?: string;
} & Pick<RaRecord, "id">;
```

## Summary

The Atomic CRM data provider architecture demonstrates a well-structured approach to database abstraction with clear separation of concerns. The current implementation provides production stability while the unified data provider represents the architectural direction for consolidating complexity. The deals-to-opportunities migration showcases a systematic approach to API evolution with proper backward compatibility and deprecation management.

**Key Architectural Decisions:**
1. **Single Data Provider**: Consolidation from multiple provider layers to unified implementation
2. **Summary View Optimization**: Database-level optimization for list operations
3. **Fail-Fast Error Handling**: No backward compatibility or recovery mechanisms (Core Principle #9)
4. **Lifecycle Integration**: React Admin callbacks for data processing and validation
5. **Junction Table Support**: Many-to-many relationship handling with dedicated methods
6. **Migration Strategy**: Graceful deprecation with analytics and automatic cutover