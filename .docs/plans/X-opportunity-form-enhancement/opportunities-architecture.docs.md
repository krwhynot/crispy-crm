# Opportunity Architecture Research

## Current File Structure

### Core Module Files
- **index.ts**: Lazy-loads React Admin resource components (list, create, edit, show)
- **opportunity.ts**: Helper functions for stage label lookup (uses centralized stageConstants)
- **stageConstants.ts**: Centralized stage definitions with 8 stages, field visibility config, and helper functions
- **stages.ts**: Utility for organizing opportunities by stage value (used by kanban board)
- **opportunityUtils.ts**: Date formatting utilities (getRelativeTimeString)

### Form Components
- **OpportunityCreate.tsx**: Create form with index management for kanban board positioning
- **OpportunityEdit.tsx**: Edit form with header showing organization avatar
- **OpportunityInputs.tsx**: Shared form inputs used by both create and edit
  - Main fields (name, description)
  - Linked entities (customer org, principal org, distributor org, contacts)
  - Misc fields (category, stage, priority, amount, probability, expected_closing_date)
  - Stage-specific conditional fields (sample, demo, feedback, closing fields)

### Display Components
- **OpportunityShow.tsx**: Detail view with archive/unarchive functionality
- **OpportunityList.tsx**: List view with filters and kanban board layout
- **OpportunityListContent.tsx**: Kanban board content renderer (no drag-drop per recent refactor)
- **OpportunityColumn.tsx**: Single stage column for kanban board
- **OpportunityCard.tsx**: Card displayed in kanban columns (shows name, priority, amount, category, probability)
- **ContactList.tsx**: Display contacts associated with opportunity
- **OpportunityEmpty.tsx**: Empty state component
- **OpportunityArchivedList.tsx**: Archived opportunities display

### Filter & Choice Files
- **filterChoices.ts**: Filter option definitions
- **priorityChoices.ts**: Priority level choices
- **OnlyMineInput.tsx**: Filter to show only current user's opportunities

### Test Files
- **OpportunityCreate.spec.ts**: Create form tests
- **OpportunityInputs.spec.tsx**: Input components tests
- **OpportunityList.spec.tsx**: List view tests
- **OpportunityShow.spec.tsx**: Show view tests
- **OpportunityWorkflows.spec.tsx**: Workflow tests
- **opportunityUtils.spec.ts**: Utility function tests

## Form Patterns

### Create Flow (OpportunityCreate.tsx)
1. **Component Structure**:
   - Uses `CreateBase` wrapper from React Admin
   - Wraps `Form` with default values
   - Contains `OpportunityInputs` for all form fields
   - Custom `FormToolbar` with CancelButton and SaveButton

2. **Default Values**:
   ```typescript
   {
     sales_id: identity?.id,        // Current user
     contact_ids: [],                // Empty array
     index: 0,                       // First position in kanban
     priority: "medium",             // Default priority
     probability: 50,                // Default 50%
     stage: "new_lead"              // Starting stage
   }
   ```

3. **Index Management for Kanban**:
   - Fetches all opportunities on load (`useGetList`)
   - On success, filters opportunities in same stage
   - Increments index of existing opportunities to make room at position 0
   - Updates React Query cache with new index values
   - New opportunity always inserted at top of its stage column

4. **Success Handling**:
   - Shows notification
   - Redirects to show page: `/opportunities/${id}/show`

### Edit Flow (OpportunityEdit.tsx)
1. **Component Structure**:
   - Uses `EditBase` with `redirect="show"` and `mutationMode="pessimistic"`
   - No custom actions (actions={false})
   - Shows organization avatar in header
   - Uses same `OpportunityInputs` as create form

2. **Form Toolbar**:
   - DeleteButton on left
   - CancelButton and SaveButton on right

3. **Header Component**:
   - Displays customer organization avatar using ReferenceField
   - Shows "Edit {opportunity.name}" title

### Shared Inputs (OpportunityInputs.tsx)
1. **Layout Structure**:
   - Three main sections with responsive flex layout
   - Uses `useIsMobile()` hook to switch between row/column layouts
   - Separators between sections

2. **Input Sections**:
   - **OpportunityInfoInputs**: name (required), description
   - **OpportunityLinkedToInputs**: customer org, principal org (optional), distributor org (optional), contacts (required, min 1)
   - **OpportunityMiscInputs**: category, stage, priority, amount, probability (0-100), expected_closing_date

3. **Stage-Specific Inputs** (OpportunityStageSpecificInputs):
   - Conditionally rendered based on `stage` value using `useWatch`
   - Uses `getStageFieldsConfig(stage)` to determine visibility
   - Four field groups:
     - **Sample/Visit**: sampleType, visitDate, sampleProducts (comma-separated)
     - **Demo**: demoDate (required for demo_scheduled), attendees, demoProducts
     - **Feedback**: feedbackNotes (required for feedback_logged), sentimentScore (1-5), nextSteps
     - **Closing**:
       - Won: finalAmount (required), contractStartDate, contractTermMonths
       - Lost: lossReason (required), competitorWon, lossNotes
       - Both: actual_close_date (required)

4. **Field Visibility Matrix** (from stageConstants.ts):
   - new_lead: No extra fields
   - initial_outreach: No extra fields
   - sample_visit_offered: Sample fields
   - awaiting_response: Sample fields
   - feedback_logged: Sample + Feedback fields
   - demo_scheduled: Sample + Demo + Feedback fields
   - closed_won: All fields (Sample + Demo + Feedback + Closing)
   - closed_lost: All fields (Sample + Demo + Feedback + Closing)

5. **Validation Approach**:
   - Comment in code: "Validation removed per Engineering Constitution - single-point validation at API boundary only"
   - No client-side validation
   - Helper text indicates required fields
   - Actual validation happens in ValidationService

## Transform Patterns

### Data Provider Integration
Located in `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/`

1. **Validation Flow** (ValidationService.ts):
   - All validation at API boundary via `ValidationService`
   - Opportunities validated using `validateOpportunityForm` from `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`
   - Same validation for both create and update operations

2. **Transform Flow** (TransformService.ts):
   - No opportunity-specific transformations currently registered
   - Other resources have transforms (contacts: avatar processing, organizations: logo processing, notes: attachment uploads)
   - Opportunities flow through without transformation layer

3. **Unified Data Provider** (unifiedDataProvider.ts):
   - Single provider consolidating 4+ previous layers
   - Validation → Transform → Database operation
   - Error logging integrated
   - Uses `OpportunitiesService` for business logic

## Validation Integration

### Zod Schema (validation/opportunities.ts)
1. **Core Schema** (`opportunitySchema`):
   - Required fields: name, contact_ids (min 1), expected_closing_date
   - Defaults: stage="new_lead", priority="medium", amount=0, probability=50
   - Optional: customer_organization_id, principal_organization_id, distributor_organization_id
   - Probability: 0-100 range validation
   - Amount: min 0 validation

2. **Stage-Specific Refinements** (superRefine):
   - demo_scheduled: requires demoDate
   - feedback_logged: requires feedbackNotes
   - closed_won: requires finalAmount and actual_close_date
   - closed_lost: requires lossReason and actual_close_date

3. **Legacy Field Protection**:
   - Checks for removed "company_id" and "archived_at" fields
   - Throws helpful error messages guiding to new field names

4. **Specialized Schemas**:
   - `createOpportunitySchema`: Stricter requirements for creation
   - `updateOpportunitySchema`: More flexible, only requires id
   - Export validation functions: `validateCreateOpportunity`, `validateUpdateOpportunity`

## Key Components

### OpportunityCard
**Purpose**: Display opportunity in kanban column
**Key Features**:
- Click handler redirects to show page
- Keyboard navigation (Enter/Space)
- Priority badge with color variants (critical=destructive, high=default, medium=secondary, low=outline)
- Organization avatar via ReferenceField
- Amount formatted as compact currency
- Shows probability percentage
- "Principal" badge if principal_organization_id exists

### OpportunityColumn
**Purpose**: Render single stage column in kanban board
**Key Features**:
- Displays stage label from centralized stageConstants
- Shows total amount for all opportunities in column (compact currency format)
- Maps opportunities to OpportunityCard components
- Static layout (no drag-drop per recent refactor removing @hello-pangea/dnd)

### OpportunityListContent
**Purpose**: Render full kanban board layout
**Key Features**:
- Uses `useListContext` to get opportunities and filters
- Filters visible stages based on `filterValues.stage` array
- Groups opportunities by stage using `getOpportunitiesByStage` utility
- Horizontal scrolling container for stage columns
- Uses `OPPORTUNITY_STAGES_LEGACY` for stage definitions

### OpportunityList
**Purpose**: Main list view with filters and actions
**Key Features**:
- Filter system with 6 filters:
  1. SearchInput (q parameter)
  2. Customer Organization (autocomplete)
  3. Category (multi-select, dynamically fetched from last 6 months of opportunities)
  4. Priority (multi-select)
  5. Stage (multi-select with localStorage persistence)
  6. OnlyMineInput (sales_id filter)
- Stage visibility preferences stored in localStorage as "opportunity_hidden_stages"
- Default hidden stages: ["closed_won", "closed_lost"]
- Empty state shows OpportunityEmpty component
- Filter chips panel for active filters
- Actions: FilterButton, ExportButton, CreateButton

### OpportunityShow
**Purpose**: Detail view for single opportunity
**Key Features**:
- Archive/Unarchive functionality (soft delete via deleted_at timestamp)
- Organization avatars for customer, principal, distributor
- Badge variants for priority
- Date formatting with date-fns
- ReferenceManyField for opportunity notes
- Archive banner when deleted_at is set
- Uses OpportunitiesService.unarchiveOpportunity for restoring

## Integration Points

### Database Tables
- **opportunities**: Main table
- **organizations**: customer_organization_id, principal_organization_id, distributor_organization_id
- **contacts_summary**: contact_ids array (view, not table)
- **opportunityNotes**: Linked via opportunity_id

### Related Modules
1. **Organizations** (`/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/`):
   - OrganizationAvatar component used throughout
   - AutocompleteOrganizationInput for org selection

2. **Contacts** (`/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/`):
   - contacts_summary view for contact lookups
   - contactOptionText formatter for autocomplete

3. **Notes** (`/home/krwhynot/Projects/atomic/src/atomic-crm/notes/`):
   - NoteCreate component embedded in show view
   - NotesIterator for displaying note list

4. **Configuration** (`/home/krwhynot/Projects/atomic/src/atomic-crm/root/ConfigurationContext.tsx`):
   - `opportunityCategories` array from ConfigurationProvider
   - Used in category SelectInput

5. **Services** (`/home/krwhynot/Projects/atomic/src/atomic-crm/services/`):
   - OpportunitiesService: unarchiveOpportunity method

### Data Flow
1. **Create**: Form → OpportunityCreate → ValidationService → unifiedDataProvider → Database
2. **Update**: Form → OpportunityEdit → ValidationService → unifiedDataProvider → Database
3. **List**: Database → unifiedDataProvider → OpportunityList → OpportunityListContent → OpportunityColumn → OpportunityCard
4. **Show**: Database → unifiedDataProvider → OpportunityShow

### State Management
- React Admin store via `useListContext`, `useRecordContext`
- React Query for caching (explicitly updated in OpportunityCreate for index management)
- React Hook Form (`useWatch`) for stage-based field visibility
- localStorage for stage filter preferences

## Type System

### Opportunity Type (from types.ts)
```typescript
type Opportunity = {
  name: string;
  customer_organization_id: Identifier;
  principal_organization_id?: Identifier;
  distributor_organization_id?: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: "lead" | "qualified" | "needs_analysis" | "proposal" | "negotiation" | "closed_won" | "closed_lost" | "nurturing";
  status: "active" | "on_hold" | "nurturing" | "stalled" | "expired";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  amount: number;
  probability: number;
  estimated_close_date?: string;
  actual_close_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number;
  founding_interaction_id?: Identifier;
  stage_manual: boolean;
  status_manual: boolean;
  next_action?: string;
  next_action_date?: string;
  competition?: string;
  decision_criteria?: string;
} & Pick<RaRecord, "id">;
```

**Note**: Type definition shows different stages than stageConstants.ts
- Type definition: "lead", "qualified", "needs_analysis", "proposal", "negotiation", "closed_won", "closed_lost", "nurturing"
- stageConstants.ts: "new_lead", "initial_outreach", "sample_visit_offered", "awaiting_response", "feedback_logged", "demo_scheduled", "closed_won", "closed_lost"
- **INCONSISTENCY DETECTED**: This needs alignment

### Stage Type Definitions
- **OpportunityStage** (stageConstants.ts): value, label, color, description
- **OpportunityStageValue**: Union type of 8 stage values
- **StageFieldsConfig**: showSampleFields, showDemoFields, showCloseFields, showFeedbackFields, requiredFields

## Drag-Drop Kanban History

### Recent Refactor (per git history)
- Commit: "refactor: remove drag-and-drop from opportunity kanban board"
- Previously used `@hello-pangea/dnd` library
- Drag-drop functionality REMOVED
- Index field still maintained for column ordering
- OpportunityCard still accepts index parameter but doesn't use it

### Current Kanban Behavior
- Static display only
- No reordering within columns
- No moving between stages via drag
- Index managed on create (always 0 for new opportunities)
- Stage changes must be done via edit form

## Outstanding Issues & Observations

1. **Type Inconsistency**: Opportunity type definition stages don't match stageConstants.ts stages
2. **No Opportunity Transform**: Unlike contacts/organizations, opportunities don't have transformation layer (no file uploads, etc.)
3. **Index Management**: Still exists but only used for create (prepend to column), not for drag reordering
4. **Stage-Specific Fields**: Complex conditional rendering based on stage value - could be simplified or extracted
5. **Category Management**: Dynamically fetched from database (last 6 months) rather than using config-only
6. **Validation Comments**: Code explicitly mentions "Validation removed per Engineering Constitution" - validation moved to API boundary
7. **Archive vs Delete**: Uses soft delete pattern via deleted_at timestamp, but UI calls it "Archive"
