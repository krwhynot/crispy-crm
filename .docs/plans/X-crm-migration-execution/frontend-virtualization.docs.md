# Frontend Virtualization Research

Analysis of current list rendering implementations and virtualization opportunities in the Atomic CRM codebase.

## Current List Implementations

### Opportunities/Deals List (Kanban Board)
- **OpportunityList.tsx**: Uses React Admin's `<List>` with `perPage={100}` and `pagination={null}`
- **OpportunityListContent.tsx**: Implements drag-and-drop kanban board using `@hello-pangea/dnd`
- **OpportunityColumn.tsx**: Renders opportunities in columns with `<Droppable>` containers
- **Performance Concern**: Loads up to 100 opportunities without pagination, renders all cards simultaneously

### Contacts List
- **ContactList.tsx**: Uses React Admin's `<List>` with `perPage={25}` (paginated)
- **ContactListContent.tsx**: Simple list rendering with manual `.map()` over contacts array
- **Performance**: Better controlled with pagination, but still renders all 25 items at once

### Companies List (Grid View)
- **CompanyList.tsx**: Uses React Admin's `<List>` with `perPage={25}` and pagination
- **GridList.tsx**: Grid layout with `gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))"`
- **Performance**: Pagination helps, but grid layout could benefit from virtual scrolling

### Dashboard Lists
- **TasksList.tsx**: Multiple filtered task lists
- **TasksListFilter.tsx**: Uses `perPage: 100` with "Load more" functionality
- **HotContacts.tsx**: Limited to `perPage: 10`
- **Performance**: Tasks list loads 100 items initially, incrementally loads +10 more

## Existing Virtualization Code

### VirtualizedList Component
- **Location**: `/src/components/ui/VirtualizedList.tsx`
- **Status**: Implemented but NOT CURRENTLY USED anywhere in codebase
- **Dependencies**: Imports from `react-window` but package is NOT installed
- **Features**:
  - Supports both `FixedSizeList` and `VariableSizeList`
  - Includes `useVirtualizedListHeight` hook for dynamic sizing
  - Type-safe with generic support
  - Configurable overscan count

### Missing Dependencies
- `react-window` is imported but not in package.json
- No `@tanstack/react-virtual` or similar virtualization libraries found
- Component appears to be prepared for virtualization but dependencies missing

## Performance Bottlenecks

### High-Volume Data Scenarios
1. **Opportunities Kanban**: 100 items × 8 columns = 800+ DOM elements
2. **Activity Logs**: Uses `perPage: 250` in multiple places
3. **Archived Lists**: Uses `perPage: 1000` for archived opportunities/deals
4. **Company Search**: Fetches all companies for autocomplete without limits

### Rendering Issues
1. **No Virtual Scrolling**: All items render simultaneously
2. **Heavy DOM**: Complex card components multiply DOM impact
3. **Drag Performance**: DnD with many items causes lag
4. **Mobile Impact**: Grid layouts especially problematic on mobile

## Components Needing Virtualization

### High Priority (100+ items)
1. **OpportunityColumn.tsx**: Each stage column with many opportunities
2. **Activity Log Components**: Uses 250 item batches
3. **ContactListContent.tsx**: When contacts exceed 25-50 items
4. **ArchivedList Components**: Handle up to 1000 archived items

### Medium Priority (50-100 items)
1. **GridList.tsx**: Company grid view
2. **TasksIterator.tsx**: Task lists in dashboard
3. **AutocompleteInput**: Large datasets in dropdowns

### Pagination-Protected (Currently Safe)
1. **ContactList**: Limited to 25 items with pagination
2. **CompanyList**: Limited to 25 items with pagination
3. **HotContacts**: Limited to 10 items

## Drag-and-Drop Integration Points

### Current DnD Implementation
- **Library**: `@hello-pangea/dnd` (installed)
- **Pattern**: Kanban board with `<DragDropContext>`, `<Droppable>`, `<Draggable>`
- **Files**:
  - `OpportunityListContent.tsx`: Main DnD logic
  - `OpportunityColumn.tsx`: Drop zones
  - `OpportunityCard.tsx`: Draggable items

### Virtualization Challenges
1. **Virtual Items**: DnD libraries expect real DOM elements
2. **Scroll Synchronization**: Virtual scrolling conflicts with drag scrolling
3. **Drop Zone Calculation**: Virtual containers complicate drop detection
4. **Performance**: Virtual + DnD requires careful optimization

### Integration Strategy
- Consider `@dnd-kit/core` as alternative (better virtual support)
- Implement virtual scrolling per column rather than across entire board
- Use windowing with buffer zones for drag operations
- Maintain physical DOM for currently dragged items

## Key Files and Locations

### Core List Components
- `/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Main kanban implementation
- `/src/atomic-crm/opportunities/OpportunityColumn.tsx`: Column rendering
- `/src/atomic-crm/contacts/ContactListContent.tsx`: Contact list rendering
- `/src/atomic-crm/companies/GridList.tsx`: Company grid view

### Virtualization Infrastructure
- `/src/components/ui/VirtualizedList.tsx`: Prepared but unused virtual list
- `/src/atomic-crm/simple-list/SimpleList.tsx`: Basic list component

### Configuration Points
- **perPage Values**: Found throughout codebase (25, 100, 250, 1000)
- **Pagination Settings**: React Admin List components
- **Data Fetching**: Supabase provider with configurable limits

### Performance Monitoring
- `/src/lib/monitoring/performance.ts`: Performance tracking utilities
- `/src/tests/performance/`: Performance test directory

## Implementation Recommendations

1. **Install Dependencies**: Add `react-window` or `@tanstack/react-virtual`
2. **Start with ContactListContent**: Easiest virtualization target
3. **Kanban Virtualization**: Per-column virtual scrolling for opportunities
4. **Measure Impact**: Use existing performance monitoring tools
5. **Progressive Enhancement**: Implement virtualization thresholds (>50 items)