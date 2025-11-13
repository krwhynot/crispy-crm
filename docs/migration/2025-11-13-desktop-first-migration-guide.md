# Desktop-First Design Migration Guide

**Created:** 2025-11-13
**Status:** Active Migration
**Goal:** Migrate Atomic CRM from iPad-first (md: primary) to desktop-first (lg: primary) responsive design

---

## Executive Summary

Atomic CRM's design system is shifting from iPad-optimized (768px-1024px primary) to desktop-first (1440px+ primary) while maintaining 44px touch targets across ALL screen sizes.

**Migration Strategy:** Boy Scout Rule - fix patterns incrementally while working on features. New code must use desktop-first patterns immediately.

---

## Quick Reference

### Breakpoint Conversion Table

| iPad-First (OLD) | Desktop-First (NEW) | Description |
|------------------|---------------------|-------------|
| `md:grid-cols-2` | `lg:grid-cols-2` | 2-column layout for desktop (1024px+) |
| `md:p-6` | `lg:p-widget` | Widget padding using semantic token |
| `p-4 md:p-5` | `p-content lg:p-widget` | Content (16px) → widget (20px) padding |
| `md:gap-4` | `lg:gap-section` | Section gap using semantic token |
| `h-40 md:h-48` | `h-48 lg:h-64` | Larger base size, enhanced for desktop |
| `min-h-[44px]` | `min-h-11` or `h-11 w-11` | Touch target (44px = 11 * 4) |

### Common Pattern Replacements

```typescript
// ❌ OLD - iPad-first pattern
className="grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"

// ✅ NEW - Desktop-first pattern
className="grid-cols-1 lg:grid-cols-3 gap-section"
```

```typescript
// ❌ OLD - Hardcoded pixel spacing
className="mb-4 p-4 md:p-6"

// ✅ NEW - Semantic spacing tokens
className="mb-section p-content lg:p-widget"
```

```typescript
// ❌ OLD - Arbitrary touch target
className="min-h-[44px] min-w-[44px]"

// ✅ NEW - Tailwind scale touch target
className="h-11 w-11"
```

---

## Migration Workflow

### Phase 1: New Code (Immediate - Required)

**RULE:** All new components MUST use desktop-first patterns.

**Before writing new UI code:**
1. Read updated `.claude/skills/crispy-design-system/SKILL.md`
2. Prototype on desktop (1440px+) viewport
3. Use `lg:` as primary breakpoint
4. Use semantic spacing tokens (`gap-section`, `p-widget`)
5. Test: Desktop (1440px) → Tablet (768px) → Mobile (375px)

**Example: New Dashboard Widget**
```typescript
export const NewWidget: React.FC = () => {
  return (
    <Card className="p-content lg:p-widget">
      <CardHeader>
        <CardTitle>Widget Title</CardTitle>
      </CardHeader>
      <CardContent className="space-y-section">
        {/* Desktop: 2 columns, Mobile: stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
          <div className="min-h-11">Item 1</div>
          <div className="min-h-11">Item 2</div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Phase 2: Boy Scout Rule (Ongoing - When Editing Existing Files)

**RULE:** When editing a file for ANY reason, fix responsive patterns you encounter.

**Steps:**
1. Open file for feature work
2. **Before making feature changes**, scan for iPad-first patterns
3. Apply desktop-first patterns (see Conversion Patterns below)
4. Test responsive behavior
5. Proceed with feature work
6. Commit both migration + feature changes together

**Example Commit Message:**
```
feat(contacts): Add bulk delete action

- Implement bulk delete with confirmation dialog
- Migrate ContactList to desktop-first breakpoints (md: → lg:)
- Replace hardcoded spacing with semantic tokens
```

### Phase 3: Systematic Cleanup (Future - Dedicated Effort)

**When:** After 80% of files touched naturally via Boy Scout Rule

**Approach:**
1. Search for remaining `md:grid-cols`, `md:p-`, `md:gap-` patterns
2. Create cleanup PR per module (e.g., "refactor(opportunities): Desktop-first migration")
3. Test module thoroughly on Desktop (1440px), Tablet (768px), Mobile (375px)

---

## Conversion Patterns

### Pattern 1: Grid Layouts

```typescript
// ❌ BEFORE - iPad-first grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {widgets.map(w => <Widget key={w.id} {...w} />)}
</div>

// ✅ AFTER - Desktop-first grid with semantic spacing
<div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
  {widgets.map(w => <Widget key={w.id} {...w} />)}
</div>
```

**Rationale:**
- Desktop (1024px+) gets 2-column layout (primary view)
- Mobile/Tablet (<1024px) gets stacked layout
- `gap-section` (32px) instead of `gap-4` (16px)

### Pattern 2: Edge Padding

```typescript
// ❌ BEFORE - iPad-optimized padding
<div className="p-4 md:p-6 lg:p-8">
  <Content />
</div>

// ✅ AFTER - Semantic padding tokens
<div className="p-content lg:p-widget">
  <Content />
</div>
```

**Rationale:**
- `p-content` = 16px (mobile/tablet)
- `p-widget` = 20px (desktop 1024px+)
- Semantic tokens defined in `src/index.css` lines 72-96

### Pattern 3: Touch Targets

```typescript
// ❌ BEFORE - Arbitrary pixel values
<Button className="min-h-[44px] min-w-[44px]">
  <Icon />
</Button>

// ✅ AFTER - Tailwind scale (h-11 = 44px)
<Button className="h-11 w-11 p-0" aria-label="Action description">
  <Icon className="h-5 w-5" />
</Button>
```

**Rationale:**
- `h-11 w-11` = 44px clickable area (consistent with Tailwind scale)
- `p-0` prevents padding from expanding beyond 44px
- Add `aria-label` for icon-only buttons

### Pattern 4: Spacing Between Elements

```typescript
// ❌ BEFORE - Hardcoded Tailwind spacing
<div className="space-y-4">
  <Item1 />
  <Item2 />
  <Item3 />
</div>

// ✅ AFTER - Semantic spacing utilities
<div className="space-y-section">
  <Item1 />
  <Item2 />
  <Item3 />
</div>
```

**Rationale:**
- Semantic spacing utilities defined in `src/index.css` (see Task 0.5 of implementation plan)
- Available utilities: `space-y-section` (32px), `space-y-widget` (24px), `space-y-content` (16px), `space-y-compact` (12px)

### Pattern 5: Conditional Rendering

```typescript
// ❌ BEFORE - Different components per breakpoint
{isDesktop ? <DesktopView /> : <MobileView />}

// ✅ AFTER - Responsive classes (preferred)
<div className="flex flex-col lg:flex-row">
  {/* Mobile: stacked, Desktop: horizontal */}
  <Sidebar />
  <MainContent />
</div>
```

**Rationale:**
- CSS-based responsiveness is faster and more maintainable
- Avoid JavaScript breakpoint detection when possible

---

## Files Requiring Migration

### High Priority (Core UI Components)

**Dashboard Module** (`src/atomic-crm/dashboard/`)
- ✅ `PrincipalDashboard.tsx` - Updated
- ✅ `CompactGridDashboard.tsx` - Updated
- ✅ `CompactDashboardHeader.tsx` - Updated
- ✅ `UpdateOpportunityStep.tsx` - Updated
- ✅ `SuccessStep.tsx` - Updated
- ⏳ `QuickLogActivityModal.tsx` - Needs update
- ⏳ Other modal components

**Opportunities Module** (`src/atomic-crm/opportunities/`)
- ⏳ `List.tsx` - Kanban board layout
- ⏳ `Show.tsx` - Detail view tabs
- ⏳ `Edit.tsx` - Form layout
- ⏳ `KanbanColumn.tsx` - Column sizing

**Organizations Module** (`src/atomic-crm/organizations/`)
- ⏳ `List.tsx` - Table layout
- ⏳ `Show.tsx` - Sidebar + main content
- ⏳ `Edit.tsx` - Tabbed form
- ⏳ `BranchLocationsSection.tsx` - Table layout
- ⏳ `ParentOrganizationSection.tsx` - Sidebar content

**Contacts Module** (`src/atomic-crm/contacts/`)
- ⏳ `List.tsx` - Grid/table view
- ⏳ `Show.tsx` - Contact detail
- ⏳ `Edit.tsx` - Tabbed form
- ⏳ `ContactImportModal.tsx` - Multi-step form

### Medium Priority (Supporting Components)

**Reports Module** (`src/atomic-crm/reports/`)
- ⏳ All report components (`OpportunitiesByPrincipal.tsx`, etc.)
- ⏳ Filter panels
- ⏳ Export buttons

**Tasks Module** (`src/atomic-crm/tasks/`)
- ⏳ `List.tsx` - Principal-grouped view
- ⏳ `Show.tsx` - Task detail
- ⏳ `TasksListFilter.tsx` - Filter panel

**Sales Module** (`src/atomic-crm/sales/`)
- ⏳ `List.tsx`
- ⏳ `Edit.tsx`
- ⏳ `Create.tsx`

### Low Priority (Can Wait)

**Authentication** (`src/atomic-crm/auth/`)
- ⏳ `Login.tsx` - Rarely changes
- ⏳ `Register.tsx` - Rarely changes

**Shared Components** (`src/components/`)
- ⏳ UI components that wrap shadcn (usually don't need changes)
- ⏳ Admin layout components

---

## Testing Checklist

After migrating a component, verify:

### Desktop (1440px+) - PRIMARY
- [ ] Layout displays correctly (multi-column if applicable)
- [ ] Spacing uses semantic tokens (32px sections, 20px widget padding)
- [ ] Touch targets are 44px minimum (h-11 w-11)
- [ ] No horizontal scroll
- [ ] Interactions work (clicks, hovers, keyboard nav)

### Tablet (768px)
- [ ] Layout adapts gracefully (may stack or reduce columns)
- [ ] Touch targets remain 44px minimum
- [ ] Content remains readable
- [ ] No horizontal scroll

### Mobile (375px)
- [ ] Layout stacks vertically
- [ ] Touch targets remain 44px minimum
- [ ] Content fits within viewport
- [ ] No horizontal scroll
- [ ] All features accessible (even if simplified)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader labels present (aria-label on icon buttons)
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

---

## Search/Replace Patterns (Use with Caution)

**⚠️ WARNING:** These are starting points. Manual review required after replacement.

### Find/Replace in VSCode (Regex Enabled)

**Pattern 1: Grid Columns**
- Find: `md:grid-cols-(\d+)`
- Replace: `lg:grid-cols-$1`
- Review: Check if `lg:` is appropriate for your layout

**Pattern 2: Padding**
- Find: `\bp-(\d+)\s+md:p-(\d+)`
- Replace: `p-content lg:p-widget`
- Review: Only use if values match 16px/20px pattern

**Pattern 3: Gap**
- Find: `gap-4`
- Replace: `gap-section`
- Review: Ensure 32px gap is appropriate

**Pattern 4: Touch Targets**
- Find: `min-h-\[44px\](\s+min-w-\[44px\])?`
- Replace: `h-11 w-11`
- Review: Ensure button variant doesn't add extra padding

---

## FAQ

### Q: Do I need to migrate all files immediately?
**A:** No. Use the Boy Scout Rule - fix patterns when you edit files for other reasons. Only new code MUST use desktop-first immediately.

### Q: What if a component looks fine on desktop without changes?
**A:** If it's using `md:` as the primary breakpoint, it should still be migrated for consistency. Test on 1024px to see if `lg:` breakpoint is triggered correctly.

### Q: Can I use `md:` for anything?
**A:** Rarely. `md:` (768px) should only be used if you need a specific tablet-only adjustment between mobile and desktop. Most layouts should go straight from base (mobile) to `lg:` (desktop).

### Q: What about touch targets on desktop?
**A:** Yes! 44px minimum applies to ALL screen sizes. Desktop users may have touchscreens, and larger click targets improve usability for everyone.

### Q: Do semantic spacing utilities exist yet?
**A:** Not yet (as of 2025-11-13). Task 0.5 in the implementation plan creates them. Until then, use existing Tailwind spacing (`gap-4`, `p-6`, etc.) but plan to migrate to semantic tokens when available.

### Q: What if I see `xl:` or `2xl:` breakpoints?
**A:** Those are for ultra-wide screens (>1280px, >1536px). Generally, avoid unless you have a specific enhancement for very large monitors.

---

## Related Documentation

- **Implementation Plan:** `docs/plans/2025-11-13-principal-dashboard-mvp.md` (Task 0.5 for semantic spacing utilities)
- **Design System Skill:** `.claude/skills/crispy-design-system/SKILL.md` (updated with desktop-first patterns)
- **CLAUDE.md:** Project root - See "Spacing System" section
- **Tailwind Config:** `tailwind.config.ts` - Breakpoint definitions

---

## Progress Tracking

**Estimated Files to Migrate:** ~100+ components

**Migration Started:** 2025-11-13

**Current Status:**
- ✅ Dashboard module (5 files migrated)
- ⏳ Opportunities module (0/4 files)
- ⏳ Organizations module (0/5 files)
- ⏳ Contacts module (0/4 files)
- ⏳ Reports module (0/10 files)
- ⏳ Tasks module (0/3 files)
- ⏳ Sales module (0/3 files)

**Completion Target:** Gradual (6-12 months via Boy Scout Rule)

---

## Appendix: Before/After Examples

### Example 1: Kanban Board

**Before (iPad-first):**
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 md:p-6">
  {columns.map(col => (
    <div key={col.id} className="min-h-[400px] bg-card p-3 md:p-4">
      <h3 className="text-sm md:text-base mb-4">{col.title}</h3>
      {col.items.map(item => (
        <div className="mb-2 min-h-[44px] p-2">{item.name}</div>
      ))}
    </div>
  ))}
</div>
```

**After (Desktop-first):**
```typescript
<div className="grid grid-cols-1 lg:grid-cols-5 gap-section p-content lg:p-widget">
  {columns.map(col => (
    <div key={col.id} className="min-h-96 bg-card p-content lg:p-widget">
      <h3 className="text-sm lg:text-base mb-section">{col.title}</h3>
      {col.items.map(item => (
        <div className="mb-compact min-h-11 p-compact">{item.name}</div>
      ))}
    </div>
  ))}
</div>
```

### Example 2: Contact Detail Sidebar

**Before (iPad-first):**
```typescript
<div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4">
  <aside className="p-4 md:p-6 bg-card">
    <Button className="w-full min-h-[44px] mb-4">Edit Contact</Button>
    <div className="space-y-3">
      {/* Sidebar content */}
    </div>
  </aside>
  <main className="p-4 md:p-6">
    {/* Main content */}
  </main>
</div>
```

**After (Desktop-first):**
```typescript
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-section">
  <aside className="p-content lg:p-widget bg-card">
    <Button className="w-full h-11 mb-section">Edit Contact</Button>
    <div className="space-y-compact">
      {/* Sidebar content */}
    </div>
  </aside>
  <main className="p-content lg:p-widget">
    {/* Main content */}
  </main>
</div>
```

---

**Last Updated:** 2025-11-13
**Maintained By:** Engineering Team
**Questions?** Review `.claude/skills/crispy-design-system/SKILL.md` or ask in team chat.
