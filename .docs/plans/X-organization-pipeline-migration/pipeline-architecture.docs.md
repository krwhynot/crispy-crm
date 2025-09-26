# Opportunity Pipeline Architecture Research

Comprehensive analysis of the current opportunity pipeline implementation in Atomic CRM, focused on understanding the architecture that will need updating for the new 8-stage food service workflow.

## Relevant Files
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Core kanban board implementation with drag-drop logic
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`: Individual stage column rendering with totals
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`: Opportunity card display with priority badges
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`: Helper functions for grouping opportunities by stage
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/opportunity.ts`: Stage label lookup utilities
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Form inputs with stage dropdown configuration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`: List view with stage filters
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`: Zod validation schemas including stage enum
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`: TypeScript type definitions for Opportunity model
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/001_phase_1_1_foundation_setup.sql`: Database schema with opportunity_stage enum
- `/home/krwhynot/Projects/atomic/docs/merged/migrations/stage1/003_phase_1_3_opportunity_enhancements.sql`: Enhanced opportunity features

## Current Stage Implementation

### 1. Opportunity Stages Definition
Current 8-stage pipeline is hardcoded in multiple locations:
```typescript
// Defined in OpportunityListContent.tsx, OpportunityColumn.tsx, OpportunityInputs.tsx, OpportunityList.tsx
const opportunityStages = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'needs_analysis', label: 'Needs Analysis' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'nurturing', label: 'Nurturing' }
];
```

### 2. Database Schema
- **Enum Type**: `opportunity_stage` enum in PostgreSQL with 8 values
- **Column**: `opportunities.stage` field of type `opportunity_stage`
- **Validation**: Database CHECK constraints enforce enum values
- **Default**: 'lead' stage for new opportunities

### 3. TypeScript Type System
- **Union Type**: `stage: 'lead' | 'qualified' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurturing'`
- **Zod Schema**: `opportunityStageSchema` validates stage values at API boundary
- **Validation Functions**: `validateOpportunityForm`, `validateCreateOpportunity`, `validateUpdateOpportunity`

## Kanban Board Architecture

### 1. Drag-Drop Implementation
- **Library**: `@hello-pangea/dnd` (successor to react-beautiful-dnd)
- **Context**: `DragDropContext` wraps entire board
- **Columns**: Each stage is a `Droppable` area
- **Cards**: Each opportunity is a `Draggable` item

### 2. State Management
- **Local State**: `opportunitiesByStage` tracks current arrangement
- **Data Provider**: Updates persisted through React Admin's unified data provider
- **Index Field**: Opportunities have numeric `index` for ordering within stages

### 3. Stage Movement Logic
Complex reordering logic in `updateOpportunityStage` function:
- **Same Column**: Adjusts index values of affected opportunities
- **Cross Column**: Updates stage and reorders both source/destination columns
- **Database Sync**: Fetches all opportunities in affected stages to handle filtered views
- **Batch Updates**: Uses Promise.all for concurrent index updates

### 4. Real-time Updates
- **Optimistic Updates**: Local state updated immediately for smooth UX
- **Database Sync**: Async persistence with refetch on completion
- **Error Handling**: Fallback to refetch if updates fail

## Stage-Specific Features

### 1. Visual Representation
- **Column Headers**: Stage name and total dollar amount
- **Column Styling**: `bg-muted` highlight when dragging over
- **Card Styling**: Priority-based badge colors (destructive/default/secondary/outline)
- **Drag State**: Rotation and shadow effects during drag

### 2. Priority System
- **Values**: 'low', 'medium', 'high', 'critical'
- **Visual Mapping**: Badge variants for different priority levels
- **Default**: 'medium' priority for new opportunities

### 3. Amount Aggregation
- **Column Totals**: Sum of all opportunity amounts in each stage
- **Formatting**: Compact currency notation with minimum 3 significant digits
- **Real-time**: Updates as opportunities move between stages

## Stage-Specific Fields and Behavior

### 1. Stage-Independent Fields
All fields available regardless of stage:
- Basic info: name, description, amount, probability
- Relationships: customer_organization_id, principal_organization_id, distributor_organization_id
- Contacts: contact_ids array
- Metadata: category, priority, expected_closing_date

### 2. Current Limitations
- **No Stage-Specific Fields**: All form fields available in all stages
- **No Stage Validation**: No business rules preventing invalid stage transitions
- **No Automatic Progression**: Manual stage changes only

### 3. Business Logic Gaps
- No required fields per stage
- No automatic probability adjustments based on stage
- No stage-specific form layouts

## Color Coding and Visual Design

### 1. Semantic CSS Variables
Following CLAUDE.md guidelines, uses semantic color variables:
- `--primary`: Main brand colors
- `--destructive`: Critical priority and errors
- `--muted-foreground`: Secondary text
- `--muted`: Background highlights

### 2. Priority Color Mapping
```typescript
const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
};
```

### 3. Stage-Agnostic Styling
- No stage-specific colors currently implemented
- Uniform card appearance across all stages
- Potential for enhancement with stage-based visual differentiation

## Movement and Transition Mechanics

### 1. Drag-Drop Constraints
- **Free Movement**: Any opportunity can move to any stage
- **No Validation**: No business rules preventing invalid transitions
- **Index Management**: Complex reindexing logic maintains sort order

### 2. Database Persistence Pattern
1. **Immediate Local Update**: UI reflects change instantly
2. **Fetch Affected Stages**: Get all opportunities in source/destination stages
3. **Calculate New Indices**: Determine proper ordering
4. **Batch Update**: Update all affected opportunity indices
5. **Refetch Data**: Ensure UI reflects database state

### 3. Performance Considerations
- **Pagination**: Limited to 100 opportunities per stage query
- **Filtering**: Must handle filtered views when reordering
- **Batch Operations**: Multiple database updates in parallel

## Architectural Patterns

### 1. Hardcoded Stage Configuration
- **Anti-Pattern**: Stage definitions duplicated across 4+ files
- **Impact**: Requires manual updates in multiple locations for changes
- **Risk**: Inconsistency between components

### 2. Separation of Concerns
- **Good**: Stage grouping logic isolated in `stages.ts`
- **Good**: Label lookup abstracted in `opportunity.ts`
- **Needs Improvement**: Stage definitions should be centralized

### 3. Data Provider Integration
- **Good**: Uses unified Supabase data provider following CLAUDE.md
- **Good**: Zod validation at API boundary
- **Good**: TypeScript type safety throughout

## Gotchas & Edge Cases

### 1. Index Management Complexity
- **Issue**: Complex reindexing logic when moving opportunities
- **Reason**: Supports filtered views where not all opportunities are visible
- **Impact**: Must fetch all opportunities in affected stages, not just visible ones

### 2. Stage Definition Duplication
- **Issue**: Same stage array defined in 4 separate files
- **Risk**: Inconsistencies if not updated together
- **Solution Needed**: Centralized stage configuration

### 3. Database Enum vs TypeScript Types
- **Issue**: Stage values exist in both database enum and TypeScript types
- **Coordination**: Both must be updated for stage changes
- **Migration Required**: Database enum changes need SQL migrations

### 4. Opportunity Card State Management
- **Issue**: Cards must handle both dragging and clickable states
- **Solution**: Careful event handling to prevent conflicts
- **Accessibility**: Keyboard navigation support alongside drag-drop

### 5. Real-time Data Consistency
- **Issue**: Optimistic updates can diverge from database state
- **Mitigation**: Refetch after database operations
- **Trade-off**: Performance vs consistency

## Migration Implications for New 8-Stage Food Service Workflow

### 1. Required Changes
- **Database Migration**: Update `opportunity_stage` enum with new values
- **TypeScript Updates**: Update type unions across all files
- **Component Updates**: Update hardcoded stage arrays in all 4+ locations
- **Validation Updates**: Update Zod schemas with new stage values

### 2. Enhancement Opportunities
- **Centralized Configuration**: Create single source of truth for stage definitions
- **Stage-Specific Fields**: Implement conditional form fields per stage
- **Business Rules**: Add validation for stage transitions
- **Visual Differentiation**: Add stage-specific colors or icons

### 3. Backward Compatibility
- **None Required**: CLAUDE.md principle of no backward compatibility
- **Clean Migration**: Fail fast approach allows complete replacement

## Relevant Docs

- [React Beautiful DND Migration Guide](https://github.com/hello-pangea/dnd) - Drag-drop library documentation
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) - Database security patterns used
- [React Admin Data Provider](https://marmelab.com/react-admin/DataProviders.html) - Data provider interface
- [Zod Validation](https://zod.dev/) - Schema validation library