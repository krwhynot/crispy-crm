# Kanban Depth Enhancement - Parallel Implementation Plan

**Feature**: Visual hierarchy and depth improvements for Opportunities Kanban board
**Status**: Ready for parallel execution
**Total Estimated Time**: 3-5 hours (parallelizable to ~2 hours with concurrent execution)
**Date**: 2025-10-10

---

## High-Level Overview

This is a **visual-only enhancement** that adds elevation, shadows, and interactive states to the existing Opportunities Kanban board. The implementation adds subtle depth cues through:

1. **Three-layer elevation system**: Board container → Stage columns → Opportunity cards
2. **Interactive feedback**: Hover shadows, active scale effects, border glows
3. **Stage color indicators**: 2px underline accents using semantic CSS variables
4. **Bug fix**: Corrects undefined color variable references in `stageConstants.ts`

**Critical Path**: The bug fix (Task 1.1) MUST complete before any stage color implementation (Task 3.1).

**Scope**: 4 component files, ~32 lines changed, zero database/API modifications, zero breaking changes.

---

## Critically Relevant Files and Documentation

### Component Files (Implementation Targets)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx` - Stage column component (PRIMARY TARGET: column elevation + stage color underline)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx` - Individual opportunity cards (SECONDARY TARGET: card interactivity + hover states)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx` - Board container (TERTIARY TARGET: board surface separation)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts` - Stage definitions (BUG FIX TARGET: undefined color variables)

### Supporting Files (Read-Only Reference)
- `/home/krwhynot/Projects/atomic/src/index.css` - Semantic CSS variables (tag colors, state colors, shadows)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts` - Stage grouping logic (do NOT modify)
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx` - shadcn/ui Card primitive (reference for existing patterns)
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx` - Badge variants (priority indicators)

### Documentation (Must Read Before Implementation)
- `.docs/plans/kanban-depth-enhancement/requirements.md` - Complete technical specification with exact CSS classes
- `.docs/plans/kanban-depth-enhancement/shared.md` - Architecture overview and critical bug documentation
- `.docs/plans/kanban-depth-enhancement/design-system.research.md` - Complete CSS variable inventory
- `.docs/plans/kanban-depth-enhancement/stage-system.research.md` - Stage color mappings and bug analysis
- `CLAUDE.md` - Engineering Constitution (Rules #1, #2, #8 compliance required)

---

## Implementation Plan

### Phase 1: Critical Bug Fix & Validation

#### Task 1.1: Fix Undefined Color Variables in stageConstants.ts **[Depends on: none]**

**READ THESE BEFORE TASK**
- `.docs/plans/kanban-depth-enhancement/stage-system.research.md` (lines 124-198: bug details)
- `.docs/plans/kanban-depth-enhancement/shared.md` (lines 136-160: critical bug section)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts` (lines 45, 51: broken code)
- `/home/krwhynot/Projects/atomic/src/index.css` (lines 118-127: tag color variables)

**Files to Modify**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`

**Instructions**

Fix undefined CSS variable references that break stage color rendering:

1. **Line 45**: Change `color: "var(--purple)"` to `color: "var(--tag-purple-bg)"`
2. **Line 51**: Change `color: "var(--blue)"` to `color: "var(--tag-blue-bg)"`

**Why This is Critical**:
- Currently 2 out of 8 stages (`awaiting_response`, `feedback_logged`) reference undefined variables
- Breaks stage color underline feature in requirements
- Violates Engineering Constitution Rule #8 (semantic colors only)
- Blocks all stage color implementation work (Task 3.1 depends on this)

**Validation Steps**:
```bash
npm run build       # TypeScript check must pass
npm run lint        # ESLint must pass
npm run validate:colors  # WCAG validation must pass
```

**Expected Outcome**: All 8 stages now use defined semantic CSS variables with light/dark mode support.

**Gotchas**:
- Do NOT add new CSS variables to `index.css` - use existing `--tag-purple-bg` and `--tag-blue-bg`
- Do NOT modify any other fields in the stage objects (value, label, description)
- Ensure no trailing spaces or syntax errors

---

### Phase 2: Column Elevation & Visual Hierarchy

#### Task 2.1: Add Column Container Elevation **[Depends on: 1.1]**

**READ THESE BEFORE TASK**
- `.docs/plans/kanban-depth-enhancement/requirements.md` (lines 55-75: OpportunityColumn changes)
- `.docs/plans/kanban-depth-enhancement/component-architecture.research.md` (lines 135-198: OpportunityColumn analysis)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx` (current implementation)

**Files to Modify**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`

**Instructions**

Transform the column outer `<div>` (line 13) to add elevation and visual separation:

**Current** (line 13):
```tsx
<div className="flex-1 pb-8 min-w-[160px] max-w-[220px]">
```

**New** (replace line 13):
```tsx
<div className="flex-1 pb-8 min-w-[200px] max-w-[240px] bg-card border border-[var(--border)] rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out px-3">
```

**Key Changes**:
- Width: `min-w-[200px] max-w-[240px]` (increased from 160px/220px for better readability)
- Surface: `bg-card` (semantic card background)
- Border: `border border-[var(--border)]` (subtle definition)
- Corners: `rounded-2xl` (existing, keep it)
- Shadow: `shadow-[0_2px_6px_rgba(0,0,0,0.15)]` (base elevation)
- Hover: `hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]` (interactive lift)
- Transition: `transition-all duration-200 ease-in-out` (smooth animation)
- Padding: `px-3` (horizontal padding for internal content)

**Update Card Container** (line 19):
```tsx
<div className="flex flex-col rounded-2xl mt-2 gap-2 pb-3">
```
Add `pb-3` for bottom padding inside the column.

**Gotchas**:
- Do NOT use `--background-alt`, `--border-muted`, or other undefined variables from requirements.md
- Use `var(--border)` with inline style syntax for semantic variable access
- Ensure `rgba()` shadow values for GPU acceleration (not `oklch()`)
- Test hover state works in both light and dark mode

**Validation**:
- Columns should have visible elevation above board background
- Hover should smoothly increase shadow depth
- No layout shift during hover transition
- Columns maintain horizontal scrolling behavior

---

### Phase 3: Stage Color Indicators

#### Task 3.1: Add Stage Color Underlines to Column Headers **[Depends on: 1.1]**

**READ THESE BEFORE TASK**
- `.docs/plans/kanban-depth-enhancement/requirements.md` (lines 212-233: stage color system)
- `.docs/plans/kanban-depth-enhancement/stage-system.research.md` (lines 96-106: color mappings table)
- `.docs/plans/kanban-depth-enhancement/shared.md` (lines 283-303: usage example)

**Files to Modify**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`

**Instructions**

Add stage color underline to column headers using the `getOpportunityStageColor()` helper:

1. **Import the color helper** (add to line 3):
```tsx
import { getOpportunityStageLabel, getOpportunityStageColor } from "./stageConstants";
```

2. **Update header styling** (lines 14-18):

**Current**:
```tsx
<div className="flex flex-col items-center">
  <h3 className="text-base font-medium">
    {getOpportunityStageLabel(stage)}
  </h3>
</div>
```

**New**:
```tsx
<div className="flex flex-col items-center">
  <h3
    className="px-3 py-2 text-sm font-semibold uppercase tracking-wide"
    style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
  >
    {getOpportunityStageLabel(stage)}
  </h3>
</div>
```

**Key Changes**:
- Typography: `text-sm font-semibold uppercase tracking-wide` (more prominent stage labels)
- Padding: `px-3 py-2` (breathing room for underline)
- Inline Style: `borderBottom` using `getOpportunityStageColor(stage)` (dynamic color per stage)

**Stage Color Mapping** (for reference, do NOT hardcode):
- new_lead: `var(--info-subtle)` (light blue)
- initial_outreach: `var(--tag-teal-bg)` (teal)
- sample_visit_offered: `var(--warning-subtle)` (orange/yellow)
- awaiting_response: `var(--tag-purple-bg)` (purple) ✅ **FIXED in Task 1.1**
- feedback_logged: `var(--tag-blue-bg)` (blue) ✅ **FIXED in Task 1.1**
- demo_scheduled: `var(--success-subtle)` (green)
- closed_won: `var(--success-strong)` (dark green)
- closed_lost: `var(--error-subtle)` (red)

**Gotchas**:
- Task 1.1 MUST be completed first or two stages will have undefined colors
- Use inline `style` prop for dynamic CSS variable access
- Do NOT use `className` with template literals for border color (not supported in Tailwind)
- Test all 8 stages render with correct colors in both light/dark mode

**Validation**:
- All 8 stages display 2px colored underline
- Colors match design system (use DevTools to inspect computed values)
- Underlines adapt to light/dark mode theme changes
- No console errors about undefined variables

---

### Phase 4: Card Interactivity & Hover States

#### Task 4.1: Enhance OpportunityCard Elevation and Interactions **[Depends on: none]**

**READ THESE BEFORE TASK**
- `.docs/plans/kanban-depth-enhancement/requirements.md` (lines 81-100: OpportunityCard changes)
- `.docs/plans/kanban-depth-enhancement/component-architecture.research.md` (lines 200-348: OpportunityCard analysis)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx` (current implementation)

**Files to Modify**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`

**Instructions**

Update the `<Card>` component (line 66) to add enhanced elevation and interactive feedback:

**Current** (line 66):
```tsx
<Card className="py-2 transition-all duration-200 shadow-sm hover:shadow-md">
```

**New** (replace line 66):
```tsx
<Card className="py-2 p-3 transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.25)] hover:shadow-[0_3px_8px_rgba(0,0,0,0.35)] hover:border-[var(--primary)] active:scale-[0.98] touch-manipulation border border-[var(--input)]">
```

**Key Changes Breakdown**:
- Padding: `p-3` (consistent spacing, replaces `py-2` + `px-3` in CardContent)
- Transition: `duration-150` (snappier from 200ms for more responsive feel)
- Base Shadow: `shadow-[0_1px_2px_rgba(0,0,0,0.25)]` (card at rest elevation)
- Hover Shadow: `hover:shadow-[0_3px_8px_rgba(0,0,0,0.35)]` (lifted on hover)
- Hover Border: `hover:border-[var(--primary)]` (primary color glow on hover)
- Active Scale: `active:scale-[0.98]` (tactile press feedback for iPad)
- Touch Optimization: `touch-manipulation` (prevents 300ms tap delay on mobile)
- Base Border: `border border-[var(--input)]` (subtle card outline)

**Update CardContent** (line 67):
Remove `px-3` since it's now on the Card:
```tsx
<CardContent className="flex">
```

**Why These Values**:
- `rgba()` shadows: Better GPU acceleration than `oklch()` for performance
- `0.98` scale: Subtle enough to feel natural, large enough to be noticeable
- `var(--primary)`: Semantic variable ensures theme consistency
- `150ms`: Faster than column hover (200ms) for responsive hierarchy

**Gotchas**:
- Do NOT use `--background-elevated` or `--border-subtle` (not defined in index.css)
- Ensure hover border glow doesn't cause layout shift (border exists in base state)
- Test active scale on both desktop (mouse click) and iPad (touch)
- Verify `touch-manipulation` doesn't break click events

**Validation**:
- Cards have visible elevation above column surface
- Hover increases shadow and adds primary border glow
- Clicking/tapping triggers scale-down animation
- No layout shift during interactions
- 60fps performance on iPad (use DevTools Performance tab)

---

### Phase 5: Board Container Surface Separation

#### Task 5.1: Add Board Container Background **[Depends on: none]**

**READ THESE BEFORE TASK**
- `.docs/plans/kanban-depth-enhancement/requirements.md` (lines 102-111: OpportunityListContent changes)
- `.docs/plans/kanban-depth-enhancement/component-architecture.research.md` (lines 67-132: OpportunityListContent analysis)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx` (current implementation)

**Files to Modify**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`

**Instructions**

Update the board container `<div>` (line 46) to add background separation from page:

**Current** (line 46):
```tsx
<div className="flex gap-4 overflow-x-auto">
```

**New** (replace line 46):
```tsx
<div className="flex gap-4 overflow-x-auto p-6 bg-muted rounded-3xl border border-[var(--border)] shadow-inner">
```

**Key Changes**:
- Background: `bg-muted` (semantic muted surface - lighter than page background)
- Padding: `p-6` (24px internal spacing for contained module feeling)
- Corners: `rounded-3xl` (softer, more separated from page edges)
- Border: `border border-[var(--border)]` (subtle container definition)
- Shadow: `shadow-inner` (inset shadow for contained workspace effect)

**Why NOT Use Variables from requirements.md**:
- ❌ `--surface-variant`: Not defined in `index.css`
- ❌ `--border-muted`: Not defined in `index.css`
- ✅ `--muted`: Existing semantic variable for muted surfaces
- ✅ `--border`: Existing semantic border color

**Gotchas**:
- Ensure overflow-x scrolling still works with padding applied
- Test with all 8 stages visible (horizontal scroll behavior)
- Verify `shadow-inner` doesn't conflict with column shadows
- Check light/dark mode color separation is visible

**Validation**:
- Board feels like a contained module separated from page
- Horizontal scrolling works smoothly with padding
- Inner shadow creates subtle depth without overwhelming columns
- No performance degradation with large number of cards

---

### Phase 6: Quality Assurance & Validation

#### Task 6.1: Cross-Browser and Theme Testing **[Depends on: 2.1, 3.1, 4.1, 5.1]**

**READ THESE BEFORE TASK**
- `.docs/plans/kanban-depth-enhancement/requirements.md` (lines 253-310: success metrics)
- `.docs/plans/kanban-depth-enhancement/shared.md` (lines 307-338: implementation checklist)

**Files to Test** (read-only verification)
- All 4 modified component files

**Instructions**

Perform comprehensive visual and functional testing:

**1. Visual Quality Checks** (requirements.md Section 5.1):
- [ ] Columns visually distinct from board background in light mode
- [ ] Columns visually distinct from board background in dark mode
- [ ] Cards visually distinct from columns in both themes
- [ ] Stage color underlines visible and correct for all 8 stages
- [ ] No "wall of grey/black boxes" effect
- [ ] Clear clickable affordances on cards

**2. Performance Testing** (requirements.md Section 5.2):
```bash
# Start dev server
npm run dev

# Open Chrome DevTools → Performance tab
# Record interaction with Kanban board:
# - Hover over columns
# - Hover over cards
# - Click cards
# - Scroll horizontally
# - Toggle light/dark mode

# Validation criteria:
# - All transitions complete within 200ms
# - 60fps scrolling on iPad Safari (test on real device if available)
# - Shadow rendering CPU usage < 5%
# - No layout shift during hover/active states
```

**3. Accessibility Validation** (requirements.md Section 5.3):
```bash
# Color contrast validation
npm run validate:colors  # Must pass

# Lighthouse audit
# Chrome DevTools → Lighthouse → Accessibility
# Score must be ≥90

# Manual checks:
# - [ ] Focus states visible on cards (tab navigation)
# - [ ] Interactive elements ≥44px touch targets
# - [ ] Stage colors maintain 4.5:1 contrast ratios
```

**4. Theme Parity Check** (requirements.md Section 5.4):
- [ ] Toggle light/dark mode in UI
- [ ] All shadows adapt appropriately
- [ ] Stage colors render correctly in both themes
- [ ] Border colors visible in both themes
- [ ] No broken CSS variables in console

**5. Functional Regression** (requirements.md Section 5.5):
- [ ] Card navigation to show view works
- [ ] Stage filtering still functional
- [ ] Filter chips panel works
- [ ] Archived opportunities dialog works
- [ ] Create/Edit/Delete operations work
- [ ] No console errors introduced

**Gotchas**:
- iPad testing requires real device or accurate simulator
- Color validation may fail if Task 1.1 was not completed
- Performance profiling requires production build (`npm run build && npm run preview`)

**Validation Commands**:
```bash
npm run build              # Must pass (TypeScript check)
npm run lint               # Must pass (ESLint + Prettier)
npm run validate:colors    # Must pass (WCAG AA compliance)
```

**Deliverable**: Before/after screenshots in both light and dark mode for documentation.

---

#### Task 6.2: Documentation and Memory Storage **[Depends on: 6.1]**

**READ THESE BEFORE TASK**
- `CLAUDE.md` (lines 421-471: Memory Management Protocol)

**Files to Create** (optional)
- None (memory storage via MCP tools)

**Instructions**

Store implementation details in Memory MCP for future reference:

1. **Create Architectural Decision Entity**:
```typescript
Entity: "kanban-depth-enhancement-2025-10-10"
Type: "architectural-decision"
Observations: [
  "2025-10-10",
  "Implemented three-layer elevation system for Opportunities Kanban board",
  "Column elevation: shadow-[0_2px_6px] with hover to shadow-[0_4px_12px]",
  "Card elevation: shadow-[0_1px_2px] with hover to shadow-[0_3px_8px]",
  "Board container: bg-muted with shadow-inner for contained module effect",
  "Stage color underlines: 2px solid using getOpportunityStageColor() helper",
  "Performance: 150ms card transitions, 200ms column transitions",
  "Accessibility: Maintained WCAG AA compliance, 60fps on iPad",
  "Files modified: OpportunityColumn.tsx, OpportunityCard.tsx, OpportunityListContent.tsx, stageConstants.ts",
  "Total changes: ~32 lines across 4 files"
]
Relations: [
  { from: "kanban-depth-enhancement-2025-10-10", to: "stageConstants-color-bug-fix", type: "required" }
]
```

2. **Create Bug Fix Entity**:
```typescript
Entity: "stageConstants-color-bug-fix"
Type: "bug-fix"
Observations: [
  "2025-10-10",
  "Fixed undefined color variables in stageConstants.ts lines 45, 51",
  "Symptom: awaiting_response and feedback_logged stages had undefined colors",
  "Root cause: Referenced var(--purple) and var(--blue) which don't exist in index.css",
  "Solution: Changed to var(--tag-purple-bg) and var(--tag-blue-bg)",
  "Impact: 25% of stages (2 out of 8) were broken",
  "File: /home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts"
]
```

3. **Update Kanban Board Knowledge**:
```typescript
Entity: "opportunities-kanban-board"
Type: "feature"
Observations: [
  "2025-10-10 - Enhanced with three-layer elevation system",
  "Component hierarchy: OpportunityList → OpportunityListContent → OpportunityColumn → OpportunityCard",
  "Data flow: React Admin ListContext → getOpportunitiesByStage() → column arrays",
  "Current limitations: No drag-and-drop, no virtualization, 100 opportunities max",
  "Stage color system: 8 stages with semantic CSS variable colors",
  "Shadow system: Uses rgba() for GPU acceleration, adaptive light/dark mode"
]
```

**Gotchas**:
- Only create memory entities if implementation is successful
- Include exact file paths and line numbers for bug fixes
- Tag observations with dates for historical tracking

---

## Advice for All Implementation Tasks

### Critical Success Factors

**1. Semantic Color Discipline**:
- **NEVER** use hex codes (e.g., `#FF0000`) - violates Constitution Rule #8
- **ALWAYS** use CSS variables with `var()` syntax (e.g., `var(--primary)`)
- **DO NOT** use undefined variables from requirements.md (`--background-alt`, `--border-muted`, `--surface-variant`)
- **USE** existing semantic variables: `--background`, `--card`, `--muted`, `--border`, `--input`, `--primary`

**2. Shadow Performance**:
- Use `rgba()` for shadow colors (better GPU acceleration than `oklch()`)
- Combine shadows with `transition-all duration-XXX` for smooth animations
- Test on iPad Safari (real device if available) for 60fps validation
- Monitor CPU usage in Chrome DevTools Performance tab (must stay <5%)

**3. Engineering Constitution Compliance**:
- **Rule #1 (NO OVER-ENGINEERING)**: Simple shadows/borders only, no complex animation libraries
- **Rule #2 (SINGLE SOURCE OF TRUTH)**: Use `getOpportunityStageColor()` helper, don't duplicate color logic
- **Rule #8 (COLORS)**: Semantic variables only, validated by `npm run validate:colors`
- **Boy Scout Rule**: These changes fix existing inconsistencies (stageConstants bug)

**4. Dark Mode Parity**:
- Test EVERY change in both light and dark mode
- Shadows should be slightly lighter in dark mode (automatic with Tailwind)
- Border colors must remain visible in both themes
- Stage colors have light/dark variants built-in (no manual switching needed)

**5. Task Dependencies**:
```
Task 1.1 (Bug Fix)
  ↓
Task 3.1 (Stage Color Underlines) ← BLOCKED until 1.1 completes

Tasks 2.1, 4.1, 5.1 can run in parallel (no dependencies)

All → Task 6.1 (QA) → Task 6.2 (Documentation)
```

### Common Pitfalls to Avoid

❌ **Using Undefined Variables**:
```tsx
// BAD - not in index.css
className="bg-[var(--background-alt)]"
className="border-[var(--border-muted)]"

// GOOD - existing semantic variables
className="bg-muted"
className="border-[var(--border)]"
```

❌ **Inline Styles for Classes**:
```tsx
// BAD - doesn't work with Tailwind
className={`border-[${stageColor}]`}

// GOOD - use style prop for dynamic values
style={{ borderBottom: `2px solid ${stageColor}` }}
```

❌ **Layout Shift from Hover States**:
```tsx
// BAD - border appears on hover (causes shift)
<div className="hover:border">

// GOOD - border exists in base state
<div className="border hover:border-primary">
```

❌ **Forgetting touch-manipulation**:
```tsx
// BAD - 300ms tap delay on mobile
<Card className="active:scale-[0.98]">

// GOOD - instant touch response
<Card className="active:scale-[0.98] touch-manipulation">
```

### Testing Checklist for Each Task

After completing ANY task:
1. Run `npm run build` (TypeScript must compile)
2. Run `npm run lint` (ESLint must pass)
3. Visually inspect in browser (both light and dark mode)
4. Test interactive states (hover, active, focus)
5. Check browser console for errors

### Performance Targets

- **Transition Duration**: Cards 150ms, Columns 200ms (cards feel snappier)
- **Frame Rate**: 60fps during scrolling and hover interactions
- **Shadow Rendering**: <5% CPU usage (verify in Chrome DevTools)
- **Layout Stability**: Zero cumulative layout shift (CLS = 0)

### Accessibility Requirements

- **Contrast Ratios**: All stage colors ≥4.5:1 (WCAG AA) - verified by `npm run validate:colors`
- **Touch Targets**: Cards >44px height (already satisfied by current design)
- **Focus States**: Existing ring utilities preserved (do not remove)
- **Keyboard Navigation**: Tab, Enter, Space all work (existing functionality)

### File Change Summary

| File | Lines Changed | Risk Level | Breaking Changes |
|------|--------------|------------|------------------|
| `stageConstants.ts` | 2 | Low | None (bug fix) |
| `OpportunityColumn.tsx` | ~15 | Low | None (visual only) |
| `OpportunityCard.tsx` | ~10 | Low | None (visual only) |
| `OpportunityListContent.tsx` | ~5 | Low | None (visual only) |

**Total**: ~32 lines changed, 100% visual enhancements, zero logic modifications.

---

## Validation Summary

### Pre-Merge Checklist

```bash
# 1. TypeScript compilation
npm run build
# Expected: No errors, successful build

# 2. Linting and formatting
npm run lint
# Expected: No errors, all files pass

# 3. Color accessibility validation
npm run validate:colors
# Expected: All semantic colors pass WCAG AA (4.5:1 contrast)

# 4. Visual regression testing
npm run dev
# Manual: Compare before/after screenshots in light/dark mode

# 5. Performance profiling
npm run build && npm run preview
# Chrome DevTools Performance: All transitions <200ms, 60fps scrolling
```

### Success Criteria

✅ **Visual Hierarchy Achieved**:
- Three distinct elevation layers visible in both themes
- Stage color underlines render for all 8 stages
- Hover/active states provide clear interactive feedback

✅ **Performance Maintained**:
- No degradation in scrolling or rendering performance
- All transitions smooth and responsive
- iPad Safari maintains 60fps

✅ **Accessibility Preserved**:
- Lighthouse accessibility score ≥90
- All colors pass WCAG AA contrast validation
- Focus states remain visible and functional

✅ **No Breaking Changes**:
- All existing Kanban functionality works
- Filtering, navigation, card actions unchanged
- No console errors introduced

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Author**: Claude Code (parallel plan synthesis)
**Status**: Ready for execution
