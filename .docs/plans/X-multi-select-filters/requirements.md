# Multi-Select Filters Feature Requirements

## Executive Summary
Enable multi-select filtering capabilities on the Opportunities List page, allowing users to select multiple values for Stage, Category, Priority, and Customer Organization filters. This improves filtering flexibility, especially for viewing closed opportunities alongside active ones.

## User Story
As a sales user, I want to select multiple filter values (e.g., both "Closed Won" and "Closed Lost" stages) so that I can view specific subsets of opportunities without having to toggle between individual filter values.

## Scope
- **In Scope**: Stage, Category, Priority, Customer Organization filters on OpportunityList
- **Out of Scope**: Other resource lists, OnlyMine toggle, Search input, other single-select filters

## Technical Stack Compatibility
✅ **Verified Compatible**:
- React 19.1.0 with React Admin 5.10.0
- PostgREST IN operator with enum/text columns
- Existing MultiSelectInput component
- ra-supabase-core array filter support

## User Experience Design

### Filter UI Components
1. **Multi-Select Dropdowns**
   - Replace existing `SelectInput` components with `MultiSelectInput`
   - Display dropdown with checkboxes for each option
   - Show "(X selected)" text when collapsed
   - Include "Clear all" option as first item in each dropdown

2. **Visual Indicators**
   - Active filters highlighted with `--primary` CSS variable color
   - Badge count showing number of selected values
   - Color-coded dropdown button when filters are active

3. **Filter Chips Panel**
   - **Location**: Collapsible panel between filter toolbar and data list
   - **Behavior**: Auto-expand when filters are active
   - **Content**: Display active filters as dismissible chips (e.g., "Stage: Qualified, Proposal")
   - **Actions**: Each chip has an 'x' to remove that specific filter

### Default Behavior
1. **Initial Load**
   - All stages shown EXCEPT "Closed Won" and "Closed Lost"
   - Other filters: No selection (show all)

2. **User Preferences**
   - Store hidden stage preferences in localStorage: `opportunity_hidden_stages`
   - Format: `["closed_won", "closed_lost"]`
   - Users can modify defaults via filter selection

3. **Navigation Behavior**
   - Reset to default filters when navigating away and returning
   - Preserve filter state only through URL parameters for bookmarking/sharing

## Technical Implementation

### Component Modifications

#### 1. OpportunityList.tsx
```typescript
// Current implementation (single-select)
<SelectInput source="stage" choices={OPPORTUNITY_STAGE_CHOICES} />

// New implementation (multi-select)
<MultiSelectInput
  source="stage"
  choices={OPPORTUNITY_STAGE_CHOICES}
  defaultValue={getDefaultVisibleStages()} // Exclude hidden stages from localStorage
/>
```

#### 2. Filter Data Flow
```typescript
// React Admin filter format
filterValues = {
  stage: ["new_lead", "qualified", "proposal"],
  category: ["enterprise", "mid_market"],
  priority: ["high", "medium"],
  customer_organization_id: [123, 456]
}

// Data provider converts to PostgREST
// Automatic conversion by ra-supabase-core:
// stage=in.(new_lead,qualified,proposal)
// category=in.(enterprise,mid_market)
// priority=in.(high,medium)
// customer_organization_id=in.(123,456)
```

#### 3. Default Stage Management
```typescript
// Helper function for default stages
const getDefaultVisibleStages = () => {
  const hiddenStages = JSON.parse(
    localStorage.getItem('opportunity_hidden_stages') ||
    '["closed_won", "closed_lost"]'
  );

  return OPPORTUNITY_STAGE_CHOICES
    .map(choice => choice.id)
    .filter(stage => !hiddenStages.includes(stage));
};

// Update preferences when user changes selection
const handleStageFilterChange = (selectedStages: string[]) => {
  const allStages = OPPORTUNITY_STAGE_CHOICES.map(c => c.id);
  const hiddenStages = allStages.filter(s => !selectedStages.includes(s));

  if (hiddenStages.includes('closed_won') || hiddenStages.includes('closed_lost')) {
    localStorage.setItem('opportunity_hidden_stages', JSON.stringify(hiddenStages));
  }
};
```

#### 4. Filter Chips Component
```typescript
const FilterChipsPanel = () => {
  const { filterValues, setFilter } = useListContext();
  const hasActiveFilters = Object.keys(filterValues).length > 0;

  if (!hasActiveFilters) return null;

  return (
    <Collapsible defaultOpen={hasActiveFilters}>
      <div className="filter-chips-container">
        {Object.entries(filterValues).map(([key, value]) => (
          <FilterChip
            key={key}
            label={formatFilterLabel(key, value)}
            onRemove={() => removeFilter(key)}
          />
        ))}
      </div>
    </Collapsible>
  );
};
```

### Database & API Layer
- **No database changes required**
- PostgREST IN operator works with existing columns:
  - `stage` (opportunity_stage enum)
  - `category` (text)
  - `priority` (text)
  - `customer_organization_id` (uuid foreign key)

### URL State Management
```
# Single filter value (backward compatible)
/opportunities?filter={"stage":"qualified"}

# Multiple filter values (new)
/opportunities?filter={"stage":["qualified","proposal"],"priority":["high","medium"]}
```

## Implementation Steps

### Phase 1: Core Multi-Select Implementation
1. Replace SelectInput with MultiSelectInput for target filters
2. Verify data provider handles array conversion correctly
3. Test PostgREST query generation

### Phase 2: Default Stage Management
1. Implement localStorage preference storage
2. Add helper functions for default stage calculation
3. Wire up initial filter values on component mount

### Phase 3: Visual Enhancements
1. Add filter chips panel component
2. Implement collapsible behavior
3. Style active filter indicators with primary color

### Phase 4: User Experience Polish
1. Add "Clear all" option to dropdowns
2. Implement smooth transitions for chip panel
3. Ensure iPad-optimized spacing

## Testing Checklist

### Manual Testing Scenarios
- [ ] Select multiple stages and verify correct records display
- [ ] Select multiple categories and verify OR logic works
- [ ] Select multiple priorities and verify filtering
- [ ] Select multiple customer organizations via ReferenceInput
- [ ] Verify "Closed Won" and "Closed Lost" hidden by default
- [ ] Test localStorage persistence of hidden stage preferences
- [ ] Navigate away and back - verify reset to defaults
- [ ] Share filtered URL with colleague - verify filters apply
- [ ] Test filter chip removal individually
- [ ] Test "Clear all" within each dropdown
- [ ] Verify color coding of active filters
- [ ] Test on iPad for proper spacing and usability
- [ ] Verify no breaking changes to saved single-value filters

### Performance Validation
- [ ] Monitor network tab for correct PostgREST queries
- [ ] Verify no duplicate API calls when selecting multiple values
- [ ] Check query performance with multiple filters active
- [ ] Validate reasonable response times with complex filters

## Rollback Plan
Since we're pre-launch with no production users:
- No migration or backward compatibility needed
- Can modify implementation based on testing feedback
- No data migration required

## Success Metrics
- Users can efficiently filter opportunities by multiple criteria
- Reduced clicks to view both closed and active opportunities
- Improved visibility of active filters via chips panel
- Consistent multi-select behavior across all dropdown filters

## Engineering Constitution Compliance
✅ **NO OVER-ENGINEERING**: Simple localStorage for preferences, no complex state management
✅ **SINGLE SOURCE OF TRUTH**: Supabase remains sole data provider
✅ **BOY SCOUT RULE**: Updates existing components rather than creating new ones
✅ **VALIDATION**: No new validation needed (existing Zod schemas unchanged)
✅ **TYPESCRIPT**: Uses existing interfaces from generated types
✅ **FORMS**: Leverages existing admin layer components
✅ **COLORS**: Uses semantic `--primary` variable only
✅ **MIGRATIONS**: No database changes required

## Notes
- Leverages existing `MultiSelectInput` component from `src/components/admin/`
- Uses established PostgREST IN operator pattern from other parts of codebase
- React Admin 5.10 fully supports React 19 (verified compatibility)
- Pattern can be extended to other resource lists if successful