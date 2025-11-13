# Dashboard Uncrowding Design

**Date:** 2025-11-13
**Status:** Planning
**Priority:** P1 (UX Improvement)
**Design Source:** Pipedrive dashboard patterns + Atomic CRM design system

## Problem Statement

The Principal Dashboard feels crowded and overwhelming:
- 4 widgets stacked in right sidebar with minimal breathing room
- No progressive disclosure (everything shown at once)
- Fixed max-heights force scrolling within widgets
- No user customization (can't hide/collapse/reorder)
- Recent spacing token reductions (section: 32→24px) reduced breathing room

**Screenshot Reference:** `docs/screenshots/crowded-dashboard.png`

## Pipedrive Research Findings

Key patterns from Pipedrive dashboard design (via Perplexity research):

1. **Widget-Based Layout & Grid System** - Modular grid with resizable/movable widgets
2. **White Space Utilization** - Ample spacing around and between widgets
3. **Progressive Disclosure** - Hide less essential details, expand on demand
4. **Collapsible Sections** - Users can collapse widgets they don't need
5. **Widget Sizing Strategy** - Main KPIs get larger sizes, secondary data smaller
6. **Customizable Visibility** - Hide widgets entirely with single click
7. **Consistent Visual Hierarchy** - Color, typography, sizing guide attention

## Design Goals

### Must Have (P1)
1. ✅ Collapsible widgets with expand/collapse controls
2. ✅ Increased spacing using semantic tokens (restore pre-reduction values)
3. ✅ Remove fixed max-heights (let widgets breathe naturally)
4. ✅ Progressive disclosure patterns (summary → expand for details)
5. ✅ localStorage persistence of collapsed states

### Should Have (P2)
6. 🔲 Widget visibility toggle (show/hide entire widgets)
7. 🔲 Reorderable widgets (drag-and-drop or up/down buttons)
8. 🔲 Widget size options (compact/normal/expanded)

### Nice to Have (P3)
9. 🔲 Resizable widgets (user-draggable handles)
10. 🔲 Dashboard layout presets (compact/balanced/detailed)
11. 🔲 Per-widget customization menu

## Proposed Layout Changes

### Spacing Token Adjustments

**Problem:** Recent reductions made dashboard feel cramped.

**Solution:** Restore or increase key spacing tokens in `src/index.css`:

```css
/* Current (Too Tight) */
--spacing-section: 24px;         /* Between major sections */
--spacing-widget: 16px;          /* Between widgets */
--spacing-content: 12px;         /* Within widget content */
--spacing-widget-padding: 12px;  /* Widget internal padding */

/* Proposed (Breathing Room) */
--spacing-section: 32px;         /* Restore original */
--spacing-widget: 24px;          /* Restore original */
--spacing-content: 16px;         /* Restore original */
--spacing-widget-padding: 20px;  /* Restore original */
```

**Impact:** More white space between widgets reduces visual crowding.

### Collapsible Widget Pattern

**Component:** `CollapsibleDashboardWidget.tsx`

```typescript
interface CollapsibleDashboardWidgetProps {
  title: string | React.ReactNode;
  defaultCollapsed?: boolean;
  storageKey: string; // For localStorage persistence
  children: React.ReactNode;
  className?: string;
  badge?: number; // Optional badge count (shown when collapsed)
}

export function CollapsibleDashboardWidget({
  title,
  defaultCollapsed = false,
  storageKey,
  children,
  className,
  badge,
}: CollapsibleDashboardWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    `dashboard.${storageKey}.collapsed`,
    defaultCollapsed
  );

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader className="cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
            {badge !== undefined && badge > 0 && (
              <Badge variant="secondary" className="ml-2">
                {badge}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="w-11 h-11"  // 44px touch target
            aria-label={isCollapsed ? "Expand widget" : "Collapse widget"}
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="px-widget py-content">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
```

**Key Features:**
- ✅ Click header to toggle collapsed state
- ✅ Chevron icon indicates expand/collapse direction
- ✅ Badge count visible when collapsed (e.g., "19 tasks")
- ✅ localStorage persistence via custom hook
- ✅ 44px touch target for accessibility
- ✅ Smooth transitions for expand/collapse

### Widget Visibility Control (P2)

**Component:** `DashboardCustomizer.tsx`

Add customization menu to dashboard header:

```typescript
<div className="flex items-center gap-2">
  <h1>Principal Dashboard</h1>

  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <Settings className="w-4 h-4 mr-2" />
        Customize
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-64">
      <DropdownMenuLabel>Widget Visibility</DropdownMenuLabel>
      <DropdownMenuSeparator />

      {AVAILABLE_WIDGETS.map((widget) => (
        <DropdownMenuCheckboxItem
          key={widget.id}
          checked={visibleWidgets.includes(widget.id)}
          onCheckedChange={() => toggleWidget(widget.id)}
        >
          {widget.label}
        </DropdownMenuCheckboxItem>
      ))}

      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={resetToDefaults}>
        Reset to Defaults
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

### Progressive Disclosure Pattern

**Problem:** Widgets show all details at once (e.g., all tasks, all activities).

**Solution:** Show summary → click to expand details.

**Example: MyTasksThisWeek Widget**

```typescript
// Current: Shows all tasks (forced scrolling with max-h-[300px])
<CardContent className="max-h-[300px] overflow-y-auto">
  {tasks.map(task => <TaskItem key={task.id} task={task} />)}
</CardContent>

// Proposed: Show summary + expand for full list
<CardContent>
  {/* Summary View */}
  <div className="space-y-compact">
    <div className="flex justify-between text-sm">
      <span>Due Today:</span>
      <span className="font-bold text-destructive">{todayCount}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>This Week:</span>
      <span className="font-bold">{weekCount}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Overdue:</span>
      <span className="font-bold text-warning">{overdueCount}</span>
    </div>
  </div>

  {/* Expand/Collapse for Details */}
  <Button
    variant="ghost"
    size="sm"
    className="w-full mt-content"
    onClick={() => setShowDetails(!showDetails)}
  >
    {showDetails ? "Hide Details" : "Show All Tasks"}
  </Button>

  {/* Detailed View (collapsed by default) */}
  {showDetails && (
    <div className="mt-content space-y-compact border-t border-border pt-content">
      {tasks.map(task => <TaskItem key={task.id} task={task} />)}
    </div>
  )}
</CardContent>
```

**Impact:**
- Default view shows high-level summary (no scrolling)
- User can expand to see full details when needed
- Reduces initial visual overload

### Remove Fixed Max-Heights

**Problem:** Forces scrolling within widgets (`max-h-[300px]`).

**Solution:** Let widgets grow naturally with content, rely on page scrolling.

```typescript
// ❌ Current (forced scrolling)
<CardContent className="max-h-[300px] overflow-y-auto space-y-section">
  {/* content */}
</CardContent>

// ✅ Proposed (natural flow)
<CardContent className="space-y-section">
  {/* content - let page scroll naturally */}
</CardContent>
```

**Rationale:**
- Page scrolling is more natural than widget scrolling
- Eliminates nested scrollbar confusion
- Aligns with Pipedrive pattern (no forced widget heights)

## Layout Responsive Behavior

### Desktop (1440px+)
- Grid: 70% main content (left) + 30% sidebar (right)
- All widgets visible by default
- Generous spacing (32px section, 24px widget)

### iPad Landscape (1024-1440px)
- Grid: 65% main + 35% sidebar
- Maintain spacing (no cramping)
- Consider collapsing secondary widgets by default

### iPad Portrait (768-1024px)
- Stack to single column
- Widgets full-width
- Default collapse "Recent Activity" and "Pipeline Summary"
- Keep critical widgets expanded (My Principals, Tasks)

### Mobile (<768px)
- Single column, full-width widgets
- More aggressive default collapsing
- Only "My Principals" expanded by default

## Implementation Plan

### Phase 1: Collapsible Widgets (P1)
1. Create `useLocalStorage` hook for persistence
2. Create `CollapsibleDashboardWidget` component
3. Migrate existing widgets to use new component
4. Test collapsed states persist across page loads

### Phase 2: Spacing Improvements (P1)
1. Restore spacing tokens in `src/index.css`
2. Audit all dashboard components for spacing classes
3. Update to use semantic spacing utilities
4. Test responsive behavior on iPad viewport

### Phase 3: Progressive Disclosure (P1)
1. Refactor `MyTasksThisWeek` to summary + expand pattern
2. Refactor `ActivityFeed` to summary + expand pattern
3. Remove fixed `max-h-[300px]` heights
4. Test natural page scrolling

### Phase 4: Widget Visibility (P2)
1. Create `DashboardCustomizer` component
2. Add "Customize" menu to dashboard header
3. Implement widget show/hide toggle
4. localStorage persistence of hidden widgets

### Phase 5: Widget Reordering (P2)
1. Evaluate drag-and-drop library (react-beautiful-dnd vs @dnd-kit)
2. Implement reorder functionality
3. localStorage persistence of widget order
4. Add "Reset to Defaults" button

## Accessibility Requirements

- ✅ 44x44px minimum touch targets for collapse/expand buttons
- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ ARIA labels for collapse/expand states
- ✅ Focus indicators on interactive elements
- ✅ Screen reader announcements for collapsed/expanded state changes

## Design System Compliance

- ✅ Semantic spacing tokens only (no hardcoded px values)
- ✅ Semantic color utilities (text-muted-foreground, bg-card, border-border)
- ✅ iPad-optimized responsive (md: breakpoint primary)
- ✅ Touch-friendly targets (w-11 h-11 minimum)
- ✅ Consistent with existing Card/CardHeader/CardContent patterns

## Success Metrics

**User Experience:**
- Reduce visual overwhelm (subjective feedback)
- Faster time to find relevant information
- Increased user satisfaction with dashboard

**Technical:**
- No layout shift (CLS) during collapse/expand
- Smooth transitions (no jank)
- Preferences persist across sessions
- Responsive behavior works iPad-first

## References

- Pipedrive dashboard patterns: https://www.pipedrive.com/en/features/sales-dashboard
- Design System: `docs/architecture/design-system.md`
- Spacing Tokens: `src/index.css` lines 76-100
- Engineering Constitution: `docs/claude/engineering-constitution.md`

## Open Questions

1. Should "Upcoming Events" widget be default collapsed or expanded?
2. Which widgets are most critical to keep visible on iPad portrait?
3. Do we need per-rep customization (stored in DB) or per-browser (localStorage)?
4. Should we add widget resize handles (Pipedrive has this) or just size presets?

## Next Steps

1. Review design with stakeholders
2. Get feedback on default collapsed states
3. Prioritize P1 vs P2 features
4. Begin Phase 1 implementation (collapsible widgets)
