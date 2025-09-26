# Opportunities Module Research

Comprehensive analysis of the opportunities module implementation in Atomic CRM, revealing a well-structured React Admin-based system with drag-and-drop Kanban functionality, multi-organization relationship support, and robust state management.

## Module Structure

- `/src/atomic-crm/opportunities/index.ts`: Basic React Admin resource configuration (only exports list component)
- `/src/atomic-crm/opportunities/opportunity.ts`: Core type definitions and utility functions
- `/src/atomic-crm/opportunities/stages.ts`: Stage management utilities for Kanban board organization
- `/src/atomic-crm/opportunities/opportunityUtils.ts`: Date formatting utilities for relative time display

## Component Architecture

### Primary CRUD Components
- `/src/atomic-crm/opportunities/OpportunityList.tsx`: Main list container with routing logic and filter definitions
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx`: Dialog-based create form with index management for stage ordering
- `/src/atomic-crm/opportunities/OpportunityEdit.tsx`: Dialog-based edit form with pessimistic mutation mode
- `/src/atomic-crm/opportunities/OpportunityShow.tsx`: Comprehensive detail view with archive/unarchive functionality
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Shared form inputs organized into sections (Info, Linked To, Misc)

### Display & Interaction Components
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Kanban board implementation with drag-and-drop via @hello-pangea/dnd
- `/src/atomic-crm/opportunities/OpportunityColumn.tsx`: Kanban column with total amount calculation and stage header
- `/src/atomic-crm/opportunities/OpportunityCard.tsx`: Draggable card component with company avatar and priority indicators
- `/src/atomic-crm/opportunities/OpportunityEmpty.tsx`: Empty state with conditional contact dependency check
- `/src/atomic-crm/opportunities/OpportunityArchivedList.tsx`: Separate view for deleted/archived opportunities

### Utility Components
- `/src/atomic-crm/opportunities/ContactList.tsx`: Contact display within opportunity context
- `/src/atomic-crm/opportunities/OnlyMineInput.tsx`: Filter toggle for sales_id filtering

## Data Models and Types

### Core Opportunity Type (`/src/atomic-crm/types.ts`)
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
  amount: number;
  probability: number;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number; // For Kanban ordering
  deleted_at?: string; // Soft delete support
}
```

### Stage Management Types
- `OpportunityStage`: Simple value/label pair for stage definitions
- `OpportunitiesByStage`: Record mapping stages to opportunity arrays for Kanban organization

## React Admin Integration

### Resource Registration
Registered in `/src/atomic-crm/root/CRM.tsx` as:
```typescript
<Resource name="opportunities" {...opportunities} />
```

### Data Provider Integration
- Uses unified Supabase data provider for all CRUD operations
- Implements custom `unarchiveOpportunity` method for archived opportunity restoration
- Supports filtering with contains, in, and or operators via custom transform functions

### Form Integration
- Uses React Admin's Form components with validation via `required()` validator
- Integrated with `@/components/admin` form layer for consistency
- Default values provided for create operations (sales_id, priority: 'medium', stage: 'lead')

## Business Logic and Features

### Stage Management & Kanban Board
- Eight predefined stages: lead → qualified → needs_analysis → proposal → negotiation → closed_won/closed_lost/nurturing
- Drag-and-drop reordering with complex index management for both intra-column and cross-column moves
- Real-time total amount calculation per column
- Optimistic UI updates with server persistence via Promise.all batch operations

### Multi-Organization Relationships
- Primary customer organization (required)
- Optional principal and distributor organizations
- Visual indicators for principal relationships in card view

### Archive/Unarchive System
- Soft delete via `deleted_at` timestamp
- Separate archived list view with restore functionality
- Archive action updates `deleted_at`, unarchive calls custom data provider method

### Priority & Status Management
- Four priority levels (low/medium/high/critical) with visual Badge variants
- Probability percentage (0-100%) for deal forecasting
- Expected closing date with visual "Past" indicators

### Filtering & Search
- Search input with `q` parameter for general text search
- Customer organization autocomplete filter
- Category selection from configuration context
- Priority and stage dropdowns with predefined choices
- "Only opportunities I manage" toggle for sales_id filtering

## Dependencies and Imports

### External Libraries
- `@hello-pangea/dnd`: Drag-and-drop functionality for Kanban board
- `@tanstack/react-query`: Query client for cache management
- `date-fns`: Date formatting and validation
- `lodash/isEqual`: Deep equality checking for state updates
- `lucide-react`: Icons (Archive, ArchiveRestore)

### Internal Dependencies
- `@/components/admin`: React Admin integrated components
- `@/components/ui`: shadcn/ui base components (Card, Badge, Button, Dialog, Separator, Switch, Label, Progress)
- `@/hooks/use-mobile`: Responsive design hook
- `../companies/CompanyAvatar`: Company logo display
- `../notes`: Note creation and display functionality
- `../root/ConfigurationContext`: Application configuration (opportunityCategories)
- `../layout/TopToolbar`: Navigation component
- `../misc`: Utility functions and hooks

## Integration Points

### React Admin Resource System
- Follows standard React Admin resource pattern with list/create/edit/show components
- Integrated with React Admin's routing system via `matchPath` and `useLocation`
- Uses React Admin's data provider abstraction for backend communication

### Authentication & Authorization
- Sales person assignment via `sales_id` field
- Identity-based filtering for "only mine" functionality
- No explicit role-based access control beyond sales ownership

### Configuration System
- Opportunity categories loaded from ConfigurationContext
- Stage definitions hardcoded but consistent across all components
- Customizable via CRM component props in parent application