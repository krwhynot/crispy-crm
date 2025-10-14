# Kanban Depth Enhancement - Shared Architecture

**Feature**: Visual hierarchy and depth improvements for Opportunities Kanban board
**Date**: 2025-10-10
**Status**: Ready for implementation

---

## Overview

The Kanban depth enhancement is a **visual-only feature** that adds elevation, shadows, and interactive states to the existing Opportunities Kanban board. This is a pure frontend enhancement with no database changes, no API modifications, and no architectural refactoring required. The implementation leverages existing semantic CSS variables, Tailwind utilities, and React Admin patterns to create a layered, interactive Kanban board experience.

**Key Architecture**: The Kanban board is a custom React Admin list view that transforms flat opportunity data into a stage-based column visualization. It uses React Admin's `ListContext` for data fetching and state management while presenting a domain-specific Kanban UI instead of a traditional table.

**Implementation Scope**: 4 component files, 1 bug fix, ~32 lines of CSS class changes, zero breaking changes.

---

## Relevant Files

### Core Kanban Components
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`: React Admin List wrapper, configures data fetching (100 opportunities, no pagination), filter management, and layout structure
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Stage grouping logic, transforms flat opportunity array into stage-grouped columns using `getOpportunitiesByStage()`, renders visible stage columns
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`: Individual stage column component, displays stage header and opportunity cards, **PRIMARY TARGET for depth enhancement** (column elevation, stage color underline)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`: Individual opportunity card component, shows avatar/name/priority/badges, **SECONDARY TARGET** (card elevation, hover states, touch feedback)

### Stage Configuration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`: Centralized stage definitions (8 stages), color mappings, helper functions (`getOpportunityStageLabel`, `getOpportunityStageColor`), **CONTAINS BUG** (lines 45, 51: undefined `--purple` and `--blue` variables)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`: Data transformation logic (`getOpportunitiesByStage` function), groups opportunities by stage, sorts by `index` field within columns

### Design System
- `/home/krwhynot/Projects/atomic/src/index.css`: Complete semantic color system (OKLCH format), Tailwind CSS 4 integration, light/dark mode definitions, shadow utilities, **DOES NOT CONTAIN** elevation variants referenced in requirements (--background-alt, --border-muted, etc.)

### Supporting Components
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`: shadcn/ui Card primitive, base styles for card surfaces
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`: shadcn/ui Badge component with variants (default, destructive, secondary, outline)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationAvatar.tsx`: Avatar component used in OpportunityCard (shows organization logo/fallback)

### Data Provider & Validation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified data provider for all CRUD operations, integrates Zod validation, handles filter processing and response normalization
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`: Zod schema for opportunity validation (stage, priority, amount, probability), used at API boundaries

---

## Relevant Tables

### opportunities
Primary table for sales pipeline data:
- **stage** (OpportunityStageValue): Pipeline stage (new_lead, initial_outreach, etc.)
- **index** (number): Ordering position within stage column (lower = higher position)
- **priority** (enum): critical | high | medium | low
- **customer_organization_id** (FK): Links to organizations table for avatar display
- **principal_organization_id** (FK, nullable): Principal organization relationship
- **deleted_at** (timestamp, nullable): Soft delete flag (filtered out via `"deleted_at@is": null`)

### organizations
Referenced for avatar display in OpportunityCard:
- **id** (PK): Organization identifier
- **name** (string): Organization name (used for avatar fallback)
- **avatar_url** (string, nullable): Logo/avatar image URL

**Note**: No table changes required for this enhancement. The Kanban board reads existing data only.

---

## Relevant Patterns

**React Admin List Pattern**: Custom list view using `<List>` wrapper → `<ListBase>` context provider → `useListContext()` hook in child components. Kanban board consumes `data`, `isPending`, and `filterValues` from context without prop drilling. See `OpportunityListContent.tsx:19-23`.

**Semantic Color System**: 100% CSS variable-based colors in OKLCH format. All colors defined in `index.css` with light/dark mode variants. Pattern: `bg-[var(--semantic-name)]` or Tailwind utility classes like `bg-primary`. Enforced by Engineering Constitution Rule #8 (no hex codes). Validation: `npm run validate:colors`.

**Shadow Depth System**: Tailwind utilities with progression: `shadow-xs` (subtle) → `shadow-sm` (rest) → `shadow-md` (hover) → `shadow-lg` (elevated). Combined with transitions: `transition-all duration-200`. See `OpportunityCard.tsx:66` for current implementation (`shadow-sm hover:shadow-md`).

**Stage Grouping Transform**: Flat opportunity array → stage-grouped object via `getOpportunitiesByStage()`. Creates empty arrays for all 8 stages, groups by `opportunity.stage`, sorts by `opportunity.index` ascending. Returns `Record<OpportunityStageValue, Opportunity[]>`. See `stages.ts:6-45`.

**Filter Chips Pattern**: Active filters displayed as removable chips via `FilterChipsPanel`. Uses `useFilterManagement()` hook for add/remove/toggle operations. Multi-select array filters with automatic cleanup when empty. Stage filter persisted to localStorage via `saveStagePreferences()`. See `OpportunityList.tsx:53,64-67`.

**Single Source of Truth (Stage Config)**: All stage definitions in `OPPORTUNITY_STAGES` array (stageConstants.ts). Helper functions (`getOpportunityStageLabel`, `getOpportunityStageColor`) search this array. No duplicate definitions across codebase. Follows Engineering Constitution Rule #2.

**Component Wrapper Pattern**: Many components use wrapper/content split for null checks. Example: `OpportunityCard` (wrapper) → `OpportunityCardContent` (renders UI). Prevents render errors with cleaner separation. See `OpportunityCard.tsx:8-16,18-96`.

**Lazy Loading Resources**: All React Admin resource views lazy-loaded via `React.lazy()` in `opportunities/index.ts`. Improves initial bundle size and enables code splitting. Standard pattern across all CRM resources.

---

## Relevant Docs

**`.docs/plans/kanban-depth-enhancement/requirements.md`**: You _must_ read this when implementing depth enhancements, defining styling changes, understanding success metrics, or planning implementation phases. Contains complete technical specification including exact CSS classes to add, shadow values, color variables, component changes, and QA criteria.

**`.docs/plans/kanban-depth-enhancement/component-architecture.research.md`**: You _must_ read this when understanding component hierarchy, analyzing current styling, reviewing data flow, identifying limitations, or planning refactoring. Documents 4-level component tree, complete Tailwind class inventory, and architectural patterns.

**`.docs/plans/kanban-depth-enhancement/design-system.research.md`**: You _must_ read this when working with colors, applying shadows, using semantic variables, implementing dark mode, or validating WCAG compliance. Complete inventory of 200+ CSS variables with light/dark mode values and usage examples.

**`.docs/plans/kanban-depth-enhancement/stage-system.research.md`**: You _must_ read this when fixing the color variable bug, implementing stage color underlines, understanding stage configuration, or using helper functions. Documents the critical bug (lines 45, 51 in stageConstants.ts) and all 8 stage definitions.

**`.docs/plans/kanban-depth-enhancement/react-admin-integration.research.md`**: You _must_ read this when understanding data fetching, integrating with React Admin context, working with filters, or planning future enhancements (drag-and-drop, pagination). Explains how Kanban board consumes React Admin's ListContext.

**`CLAUDE.md`**: You _must_ read this when following engineering principles, understanding project structure, using build commands, or ensuring constitution compliance. Contains Engineering Constitution (9 rules including NO OVER-ENGINEERING, SINGLE SOURCE OF TRUTH, COLORS semantic-only).

---

## Component Hierarchy

```
OpportunityList (React Admin List wrapper)
  └─> List (React Admin component)
      └─> ListBase (provides ListContext)
          └─> OpportunityLayout (conditional renderer)
              └─> OpportunityListContent (stage container) [BOARD SURFACE TARGET]
                  └─> OpportunityColumn (×8 stage columns) [PRIMARY ENHANCEMENT TARGET]
                      └─> OpportunityCard (×N opportunities) [SECONDARY ENHANCEMENT TARGET]
                          ├─> Card (shadcn/ui primitive)
                          ├─> ReferenceField (React Admin)
                          │   └─> OrganizationAvatar
                          └─> Badge (×1-2 per card)
```

**Data Flow**: React Admin List → useListContext → OpportunityListContent (transforms via getOpportunitiesByStage) → OpportunityColumn (displays stage + cards) → OpportunityCard (renders individual opportunity)

---

## Architecture Insights

### Three-Layer Elevation System

The depth enhancement introduces a clear visual hierarchy through layered surfaces:

1. **Board Container** (`OpportunityListContent`): Base surface with `bg-[var(--surface-variant)]`, `shadow-inner`, rounded container - creates separated workspace feeling
2. **Stage Columns** (`OpportunityColumn`): Elevated surfaces with `shadow-[0_2px_6px]`, `rounded-2xl`, subtle borders - distinct from board background, soft touchable surfaces
3. **Opportunity Cards** (`OpportunityCard`): Most elevated with `shadow-[0_1px_2px]`, increased on hover to `shadow-[0_3px_8px]` - interactive feedback, clear clickable affordance

**Implementation Note**: Requirements.md references CSS variables (`--background-alt`, `--border-muted`, `--surface-variant`) that are **NOT currently defined** in `index.css`. You must either:
- Add these 5 variables to `:root` and `.dark` blocks in `index.css`
- OR update requirements to use existing variables (`--background`, `--card`, `--muted`, `--border`, `--input`)

### Critical Bug: Undefined Color Variables

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts:45,51`

**Problem**: Two stages reference undefined CSS variables:
- Line 45: `color: "var(--purple)"` (awaiting_response stage)
- Line 51: `color: "var(--blue)"` (feedback_logged stage)

**Fix Required**:
```typescript
// Line 45: Change to
color: "var(--tag-purple-bg)",

// Line 51: Change to
color: "var(--tag-blue-bg)",
```

**Impact**: 25% of active stages (2 out of 8) will fail to render stage color underlines until fixed. This is a **blocker** for implementing the stage color indicator feature in requirements.md.

**Why It's a Problem**:
- Engineering Constitution violation (Rule #8: semantic colors only)
- No light/dark mode support for broken variables
- WCAG validation (`npm run validate:colors`) may fail
- Stage color underline feature will render incorrectly

**Priority**: Fix this BEFORE implementing stage color underlines in OpportunityColumn.tsx.

### Shadow System Best Practices

The project uses Tailwind's shadow utilities with a clear progression:

- **Base shadows**: `shadow-xs` (buttons, inputs) or `shadow-sm` (cards at rest)
- **Hover shadows**: Increase by one level (`shadow-sm` → `shadow-md`)
- **Active shadows**: Add `shadow-lg` for dragging/modal states
- **Transitions**: Always pair with `transition-all duration-200` for smooth animations
- **Performance**: Shadows use `rgba()` for better GPU acceleration than `oklch()`

**Example Pattern** (from OpportunityCard.tsx):
```typescript
className="py-2 transition-all duration-200 shadow-sm hover:shadow-md"
```

### React Admin ListContext Integration

The Kanban board does NOT use props drilling for data. Instead:

1. `OpportunityList` configures `<List>` with `perPage={100}`, filters, sort
2. `<List>` wraps content with `<ListBase>` context provider
3. `OpportunityListContent` calls `useListContext<Opportunity>()` to access:
   - `data`: Array of opportunities (already fetched via React Query)
   - `isPending`: Loading state boolean
   - `filterValues`: Current active filters object
4. No props passed between List → ListContent → Column → Card for opportunity data
5. Cards use `useRedirect()` hook for navigation (not onClick props)

**Benefit**: Clean separation, no prop threading, easy to add new context consumers.

### Type Safety & Validation

- **TypeScript**: `OpportunityStageValue` union type prevents invalid stage strings
- **Zod Schemas**: API boundary validation in `src/atomic-crm/validation/opportunities.ts`
- **React Admin**: Type inference via generics (`<List<Opportunity>>`, `useListContext<Opportunity>()`)
- **No Runtime Validation**: UI components trust data from React Admin context (validated at API boundary)

### Performance Characteristics

**Current Limits**:
- Fetches 100 opportunities per request (no pagination)
- No virtualization for long columns
- `isEqual` check prevents unnecessary re-grouping (OpportunityListContent:36)
- No memoization on OpportunityCard components

**Performance Targets** (from requirements.md):
- All transitions < 200ms
- 60fps scrolling on iPad
- Shadow rendering < 5% CPU impact
- No layout shift during interactions

**Recommended Monitoring**: Chrome DevTools Performance profiling during QA phase.

---

## Design System Summary

### Available CSS Variables (Existing in index.css)

**Foundation Colors**:
- `--background`, `--foreground`, `--card`, `--popover` (with `-foreground` pairs)
- `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive` (with `-foreground` pairs)
- `--border`, `--input`, `--ring` (borders and focus states)

**State Color Scales** (8 variants each: subtle, default, strong, bg, border, hover, active, disabled):
- Success: `--success-*` (green, hue 145)
- Warning: `--warning-*` (orange/yellow, hue 85)
- Info: `--info-*` (blue, hue 230)
- Error: `--error-*` (red, hue 25)

**Tag Colors** (bg/fg pairs):
- `--tag-warm-bg/fg`, `--tag-green-bg/fg`, `--tag-teal-bg/fg`, `--tag-blue-bg/fg`
- `--tag-purple-bg/fg`, `--tag-yellow-bg/fg`, `--tag-gray-bg/fg`, `--tag-pink-bg/fg`

**Loading States**:
- `--loading-surface`, `--loading-shimmer`, `--loading-skeleton`, `--loading-pulse`, etc.

**Chart & Sidebar**:
- `--chart-1` through `--chart-5`
- `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.

**All variables have light and dark mode variants with WCAG AA contrast ratios (4.5:1+).**

### Missing Variables (Referenced in requirements.md but not in index.css)

❌ `--background-alt` (column background)
❌ `--background-elevated` (card surface)
❌ `--border-muted` (subtle borders)
❌ `--border-subtle` (card borders)
❌ `--surface-variant` (board container)

**Action Required**: Either add these to `index.css` or update requirements to use existing equivalents.

### Shadow Utilities (Tailwind CSS)

- `shadow-xs` - Custom extra-small (most common in buttons/inputs)
- `shadow-sm` - Small (card base state)
- `shadow-md` - Medium (card hover, popovers)
- `shadow-lg` - Large (modals, sheets)
- `shadow-inner` - Inset shadow (contained surfaces)
- `shadow-none` - No shadow

**Adaptive Shadows** (work in light/dark): All Tailwind shadows automatically adapt to theme.

---

## Stage Configuration

### 8 Pipeline Stages (in order)

| # | Value | Label | Color Variable | Status |
|---|-------|-------|----------------|--------|
| 1 | `new_lead` | "New Lead" | `var(--info-subtle)` | ✅ Valid |
| 2 | `initial_outreach` | "Initial Outreach" | `var(--tag-teal-bg)` | ✅ Valid |
| 3 | `sample_visit_offered` | "Sample/Visit Offered" | `var(--warning-subtle)` | ✅ Valid |
| 4 | `awaiting_response` | "Awaiting Response" | `var(--purple)` | 🐛 **BUG** - undefined |
| 5 | `feedback_logged` | "Feedback Logged" | `var(--blue)` | 🐛 **BUG** - undefined |
| 6 | `demo_scheduled` | "Demo Scheduled" | `var(--success-subtle)` | ✅ Valid |
| 7 | `closed_won` | "Closed - Won" | `var(--success-strong)` | ✅ Valid |
| 8 | `closed_lost` | "Closed - Lost" | `var(--error-subtle)` | ✅ Valid |

### Helper Functions (stageConstants.ts)

- `getOpportunityStageLabel(stageValue)`: Returns display label (e.g., "New Lead")
- `getOpportunityStageColor(stageValue)`: Returns CSS color variable (e.g., "var(--info-subtle)")
- `getOpportunityStageDescription(stageValue)`: Returns stage description
- `isActiveStage(stageValue)`: Returns true if not closed_won/closed_lost
- `isClosedStage(stageValue)`: Returns true if closed_won or closed_lost

**Usage Example** (planned for OpportunityColumn.tsx):
```tsx
import { getOpportunityStageLabel, getOpportunityStageColor } from "./stageConstants";

<h3
  className="px-3 py-2 text-sm font-semibold uppercase tracking-wide"
  style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
>
  {getOpportunityStageLabel(stage)}
</h3>
```

---

## Implementation Checklist

### Phase 1: Bug Fix (REQUIRED FIRST)
- [ ] Fix `stageConstants.ts` line 45: Change `"var(--purple)"` → `"var(--tag-purple-bg)"`
- [ ] Fix `stageConstants.ts` line 51: Change `"var(--blue)"` → `"var(--tag-blue-bg)"`
- [ ] Run `npm run build` (TypeScript check)
- [ ] Run `npm run validate:colors` (WCAG check)

### Phase 2: Column Elevation
- [ ] Add container classes to OpportunityColumn outer div (shadow, border, rounded, bg)
- [ ] Add stage color underline to column header (import `getOpportunityStageColor`, apply inline style)
- [ ] Update column width constraints (min-w-[200px], max-w-[240px])
- [ ] Add internal padding (px-3, pb-3)

### Phase 3: Card Interactivity
- [ ] Update OpportunityCard shadow classes (base + hover increase)
- [ ] Add hover border glow (`hover:border-[var(--primary)]`)
- [ ] Add active scale feedback (`active:scale-[0.98]`)
- [ ] Add touch optimization (`touch-manipulation`)
- [ ] Reduce transition duration (150ms for snappier feel)

### Phase 4: Board Container
- [ ] Add OpportunityListContent wrapper classes (bg, rounded, border, shadow-inner)
- [ ] Verify overflow-x scrolling still works
- [ ] Test with all 8 stages visible

### Phase 5: QA & Validation
- [ ] Test light/dark mode visual parity
- [ ] Performance profiling (Chrome DevTools)
- [ ] iPad Safari testing (<200ms interactions)
- [ ] Accessibility audit (Lighthouse ≥90)
- [ ] Before/after screenshots for documentation

---

## Key Constraints

**No Database Changes**: Pure frontend enhancement, reads existing data only
**No API Changes**: Uses existing data provider and validation schemas
**No New Dependencies**: Uses Tailwind utilities and existing shadcn/ui components
**No Breaking Changes**: Existing functionality must remain intact (filtering, navigation, card actions)
**Engineering Constitution Compliance**: Must follow Rules #1 (NO OVER-ENGINEERING), #2 (SINGLE SOURCE OF TRUTH), #8 (COLORS semantic-only)
**Accessibility**: Maintain ≥4.5:1 contrast ratios, preserve focus states, keep 44px+ touch targets
**Performance**: All transitions <200ms, 60fps scrolling on iPad, no layout shift

---

## Future Enhancement Opportunities

**NOT in scope for this feature**, but documented for future planning:

1. **Drag-and-Drop**: Install `@dnd-kit`, implement `handleDragEnd`, update `index` field via RPC
2. **View Switching**: Add table/grid alternatives to Kanban view
3. **Infinite Scroll**: Replace `perPage={100}` with `useInfiniteGetList` for large datasets
4. **Column Customization**: Collapse/expand, reordering, width adjustment
5. **Card Detail Levels**: Toggle between compact/comfortable/spacious views
6. **Virtualization**: React Window for performance with 100+ cards per column

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Author**: Claude Code (research synthesis)
**Status**: Ready for implementation - blocked on stageConstants.ts bug fix
