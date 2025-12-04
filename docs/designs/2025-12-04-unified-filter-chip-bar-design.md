# Unified Filter Chip Bar + Standardized Sidebar Design

**Date:** 2025-12-04
**Status:** Validated

## Problem Statement

The current filter UX in Crispy CRM has two critical issues:

1. **Active Filter Visibility**: Users can't easily see which filters are applied - visibility is poor in both the datagrid area AND the sidebar
2. **Inconsistency Across Features**: Organizations, Contacts, and Products have different:
   - Visual designs (buttons, badges, layouts)
   - Feature availability (Products lacks `SidebarActiveFilters`)
   - Interaction patterns (toggles vs dropdowns)
   - Clear/reset behaviors

**Success Metric:** Account Managers should instantly see what filters are active and clear them with one click, regardless of which list they're viewing.

## Decision

**Approach A: Unified Filter Chip Bar + Standardized Sidebar**

This is the modern e-commerce pattern (Amazon, Shopify, MUI X) adapted for CRM:

1. **Chip bar above datagrid**: Horizontal row showing all active filters as removable chips with a "Clear All" button - always visible where users look at data
2. **Standardized sidebar**: Extract shared `FilterSidebar` component used by Organizations, Contacts, AND Products with consistent categories, toggle behavior, and visual design
3. **Visual hierarchy**: Chip bar is primary feedback; sidebar is secondary (selection interface)

### Industry Standard Validation

| Design System | Pattern | Recommendation |
|---------------|---------|----------------|
| Material Design | Filter Chips | Removable chips with trailing × icon |
| MUI X Data Grid | Filter Bar | "Display active filter chips on the toolbar" |
| Ant Design | List Toolbar | "Common features for lists, highly recommended" |
| Shopify Polaris | Filter Badges | Badges show applied filters with clear naming |
| IBM Carbon | Filter States | "Indicator visible... option to clear without re-opening" |

## Alternatives Considered

### B: Sticky Active Filters in Sidebar
- Lower effort but visibility problem partially remains
- Users must look at sidebar, not data area

### C: Popover/Dropdown Style (Linear/Notion)
- Modern aesthetic but major departure from architecture
- Less suitable for 4-5 filter categories per feature

### D: Saved Queries + Quick Filters
- Addresses workflow but doesn't solve core visibility/consistency issues

## Design Details

### Architecture

```
src/atomic-crm/
├── filters/                          # ENHANCED - shared filter system
│   ├── FilterChipBar.tsx             # NEW - horizontal chip bar component
│   ├── FilterChip.tsx                # EXISTS - enhanced styling
│   ├── FilterSidebar.tsx             # NEW - unified sidebar wrapper
│   ├── FilterCategory.tsx            # EXISTS - keep as-is
│   ├── useFilterChipBar.ts           # NEW - chip bar state/formatting
│   ├── filterConfigSchema.ts         # NEW - Zod config validation
│   └── ...existing files...
│
├── organizations/
│   ├── OrganizationList.tsx          # MODIFIED - add FilterChipBar
│   ├── OrganizationListFilter.tsx    # MODIFIED - use FilterSidebar
│   └── organizationFilterConfig.ts   # NEW - filter configuration
│
├── contacts/
│   ├── ContactList.tsx               # MODIFIED - add FilterChipBar
│   ├── ContactListFilter.tsx         # MODIFIED - use FilterSidebar
│   └── contactFilterConfig.ts        # NEW - filter configuration
│
├── products/
│   ├── ProductList.tsx               # MODIFIED - add FilterChipBar
│   ├── ProductListFilter.tsx         # MODIFIED - use FilterSidebar
│   └── productFilterConfig.ts        # NEW - filter configuration
```

### Component Structure

```
OrganizationList / ContactList / ProductList
├── FilterChipBar                    # NEW - above datagrid
│   └── FilterChip (×N)              # One per active filter
│
├── FilterSidebar (aside)            # NEW wrapper
│   ├── SearchInput
│   └── FilterCategory (×N)          # Existing, unchanged
│       └── ToggleFilterButton (×N)  # Existing, unchanged
│
└── PremiumDatagrid                  # Existing
```

### Data Flow

```
USER INTERACTION
       │
       ├──→ FilterSidebar (select)
       ├──→ FilterChipBar (remove)
       └──→ URL (deep link)
              │
              ▼
    React Admin Context
    useListContext()
    - filterValues
    - setFilters()
              │
              ├──→ FilterChipBar (display)
              ├──→ FilterSidebar (highlight)
              └──→ URL Sync (persistence)
                      │
                      ▼
            unifiedDataProvider
            (Supabase query)
                      │
                      ▼
              PremiumDatagrid
             (filtered results)
```

### Key Components

#### FilterChipBar
- Horizontal bar above datagrid showing active filters
- Removable chips with × button (44px touch target)
- "Clear All" button when 2+ filters active
- ARIA toolbar role with keyboard navigation

#### FilterSidebar
- Standardized wrapper for all list filter UIs
- Contains SearchInput + FilterCategory children
- Active filters display REMOVED (now in ChipBar)

#### FilterChip
- Individual removable filter chip
- 44px minimum touch target for iPad
- aria-label for screen readers

#### useFilterChipBar Hook
- Reads from React Admin's useListContext().filterValues
- Transforms into labeled chips using filterConfig
- Fetches reference names (orgs, sales, tags) lazily
- Provides remove/clear callbacks

### Validation Strategy

| Layer | What | How | Failure Mode |
|-------|------|-----|--------------|
| Config (init) | Filter configs | Zod schema | Throws immediately |
| Hook (runtime) | React Admin context | Null check | Throws with message |
| Component (runtime) | Required props | Null check | Throws with message |
| Display (runtime) | Reference names | Try/catch | Degrades to ID |
| API Boundary | Filter values | unifiedDataProvider | Error propagates |

### Accessibility

- **Touch targets**: 44x44px minimum (`min-h-[2.75rem]`)
- **ARIA roles**: toolbar, list, listitem
- **Keyboard nav**: Arrow keys, Home, End
- **Screen reader**: Live announcements on filter changes
- **Focus visible**: `focus:ring-2 focus:ring-ring`

### Testing Approach

**Unit (Vitest):**
- FilterChipBar rendering, interactions, accessibility
- useFilterChipBar transformation, counting, removal
- FilterChip styling, touch targets

**E2E (Playwright):**
- Integration with sidebar
- Cross-feature consistency
- URL persistence
- Keyboard navigation

## Engineering Principles Applied

- [x] **Fail-fast** - No retry logic; config validation throws immediately
- [x] **Single source of truth** - unifiedDataProvider for data, useListContext for filter state
- [x] **Zod at API boundary only** - Config validated at init, not on every change
- [x] **interface for objects, type for unions** - TypeScript conventions followed
- [x] **44px touch targets** - iPad accessibility requirement met
- [x] **Semantic Tailwind colors** - No hardcoded hex values

## Open Questions

None - design validated through brainstorming session.

## Next Steps

1. Run `/write-plan` to create detailed implementation plan
2. Execute plan with parallel agents where possible
3. Verify with E2E tests across all three features
