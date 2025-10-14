# Kanban Depth Enhancement – Requirements

**Feature:** Visual hierarchy and depth improvements for Opportunities Kanban board
**Status:** Requirements defined
**Target:** MVP implementation (3-7 days)
**Date:** 2025-10-10

---

## 1. Feature Summary

Enhance the Opportunities Kanban board with visual depth, elevation, and interactive feedback to improve readability and usability across desktop and iPad devices. The enhancement introduces subtle shadows, rounded surfaces, and hover/touch states while maintaining the minimal aesthetic and semantic color system. No architectural changes required—purely visual polish using existing design tokens.

**Core Problem:** The current Kanban board lacks visual hierarchy, making columns and cards feel flat and indistinguishable. Users cannot easily identify clickable elements or distinguish between pipeline stages, especially in dark mode.

**Solution:** Apply layered elevation through shadows, borders, and interactive states while introducing subtle stage color indicators (underline accents only).

---

## 2. User Stories

### Primary Users: Sales Reps & Internal Teams

**US-1: Visual Hierarchy**
*As a sales rep reviewing the pipeline,*
*I want to see clear separation between columns and cards,*
*So that I can quickly scan opportunities across different stages without visual fatigue.*

**US-2: Interactive Affordance**
*As a user on desktop or iPad,*
*I want visual feedback when hovering/touching cards,*
*So that I know which elements are clickable and can navigate confidently.*

**US-3: Stage Identification**
*As a sales manager monitoring the pipeline,*
*I want subtle color cues for each stage,*
*So that I can quickly identify which phase of the sales cycle I'm looking at.*

**US-4: Cross-Theme Consistency**
*As a user who switches between light and dark mode,*
*I want the visual hierarchy to work equally well in both themes,*
*So that my experience is consistent regardless of environment.*

**US-5: iPad Performance**
*As a field sales rep using an iPad,*
*I want smooth, responsive interactions (<200ms),*
*So that I can navigate the Kanban efficiently during client meetings.*

---

## 3. Technical Approach

### 3.1 Component Changes

#### **OpportunityColumn.tsx** (Primary changes)
**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`

**Changes:**
1. **Container elevation:**
   - Add `bg-[var(--background-alt)]` for surface differentiation
   - Apply `border border-[var(--border-muted)]` for subtle definition
   - Add `rounded-2xl` for softer edges
   - Apply `shadow-[0_2px_6px_rgba(0,0,0,0.15)]` for base elevation
   - Add `hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]` for interactive lift
   - Include `transition-all duration-200 ease-in-out` for smooth animations

2. **Stage color indicator (header):**
   - Add inline style: `style={{ borderBottom: \`2px solid ${getStageColor(stage)}\` }}`
   - Apply existing typography: `px-3 py-2 text-sm font-semibold uppercase tracking-wide`
   - Use `getStageColor()` helper from `stageConstants.ts`

3. **Layout adjustments:**
   - Update min/max width: `min-w-[200px] max-w-[240px]` (from 160px/220px)
   - Add internal padding: `px-3 pb-3` to card container

**Bug Fix Required:**
- Fix undefined color variables in `stageConstants.ts:45,50`
- Change `var(--purple)` → `var(--tag-purple-bg)`
- Change `var(--blue)` → `var(--tag-blue-bg)`

#### **OpportunityCard.tsx** (Secondary changes)
**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`

**Changes:**
1. **Card elevation:**
   - Update to: `bg-[var(--background-elevated)]`
   - Apply: `border border-[var(--border-subtle)]`
   - Base shadow: `shadow-[0_1px_2px_rgba(0,0,0,0.25)]`
   - Hover shadow: `hover:shadow-[0_3px_8px_rgba(0,0,0,0.35)]`
   - Hover border: `hover:border-[var(--primary)]`

2. **Interactive feedback:**
   - Add: `active:scale-[0.98]` for tactile press feedback (iPad)
   - Add: `touch-manipulation` for optimal touch performance
   - Update transition: `transition-all duration-150` (from 200ms for snappier feel)

3. **Layout refinements:**
   - Update padding: `p-3` (consistent spacing)
   - Maintain: `rounded-xl cursor-pointer`

#### **OpportunityListContent.tsx** (Board container)
**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`

**Changes:**
1. **Board surface:**
   - Add: `bg-[var(--surface-variant)]` for separation from page background
   - Apply: `rounded-3xl border border-[var(--border-muted)]`
   - Add: `shadow-inner` for contained feeling
   - Maintain: `flex gap-4 overflow-x-auto p-6`

**Effect:** Board feels like a distinct interactive module separated from global layout.

#### **stageConstants.ts** (Bug fix + utility)
**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`

**Changes:**
1. **Fix undefined variables (Lines 45, 50):**
   ```typescript
   // Before (BROKEN):
   proposal: 'var(--purple)',
   qualified: 'var(--blue)',

   // After (FIXED):
   proposal: 'var(--tag-purple-bg)',
   qualified: 'var(--tag-blue-bg)',
   ```

2. **Export existing helper:**
   - Ensure `getStageColor(stage)` is exported for use in components
   - No changes needed to function logic

### 3.2 CSS Variable Dependencies

**Required semantic tokens** (all exist in `/home/krwhynot/Projects/atomic/src/index.css`):

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--background-alt` | `oklch(0.97 0 0)` | `oklch(0.19 0 0)` | Column background |
| `--background-elevated` | `oklch(1 0 0)` | `oklch(0.165 0 0)` | Card surface |
| `--border-muted` | `oklch(0.922 0 0)` | `oklch(0.25 0 0)` | Subtle borders |
| `--border-subtle` | `oklch(0.93 0 0)` | `oklch(0.22 0 0)` | Card borders |
| `--surface-variant` | `oklch(0.95 0 0)` | `oklch(0.17 0 0)` | Board container |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | Hover accents |

**Tag colors for stage indicators:**
- `--tag-teal-bg`, `--tag-blue-bg`, `--tag-purple-bg`, `--tag-green-bg`, etc.
- All have 4.5:1 contrast ratios (WCAG AA validated)

### 3.3 Shadow System

**Adaptive shadows** (work in both light/dark modes):

| State | Shadow Value | Usage |
|-------|-------------|--------|
| Base (column) | `0_2px_6px_rgba(0,0,0,0.15)` | Default column elevation |
| Hover (column) | `0_4px_12px_rgba(0,0,0,0.25)` | Column focus feedback |
| Base (card) | `0_1px_2px_rgba(0,0,0,0.25)` | Default card elevation |
| Hover (card) | `0_3px_8px_rgba(0,0,0,0.35)` | Card interaction feedback |
| Board container | `shadow-inner` (Tailwind default) | Contained module effect |

**Performance consideration:** All shadows use `rgba()` for better GPU acceleration than `oklch()`.

### 3.4 No Database Changes

✅ **No migrations required** – This is purely a frontend visual enhancement.

### 3.5 No API Changes

✅ **No backend modifications** – Uses existing data structures and helpers.

### 3.6 Validation

No new Zod schemas required. Existing validation in `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts` remains unchanged.

---

## 4. UI/UX Flow

### 4.1 Visual Hierarchy (Step-by-Step)

**Layer 1: Board Container** (Base surface)
- User navigates to Opportunities → Kanban view
- Sees rounded, bordered container (`bg-[var(--surface-variant)]`)
- Board feels like a contained workspace separated from global navigation

**Layer 2: Stage Columns** (Elevated surfaces)
- Each column has subtle shadow (`0_2px_6px`)
- Rounded corners (`rounded-2xl`) create soft, touchable surfaces
- Stage color underline (2px solid) provides subtle identity cue
- Hovering a column increases shadow depth (`0_4px_12px`) for focus feedback

**Layer 3: Opportunity Cards** (Interactive elements)
- Cards appear elevated above column surface (`shadow-[0_1px_2px]`)
- Clear border separation (`border-[var(--border-subtle)]`)
- Hovering increases shadow + adds primary color border glow
- Tapping/clicking triggers scale animation (`active:scale-[0.98]`)

### 4.2 Interaction Flow

**Desktop (Mouse):**
1. User hovers over column → shadow deepens (200ms transition)
2. User hovers over card → shadow lifts + border glows primary color (150ms)
3. User clicks card → slight scale-down feedback (0.98) → navigates to detail view

**iPad (Touch):**
1. User taps card → scale-down feedback (0.98) triggers immediately
2. `touch-manipulation` CSS ensures no 300ms tap delay
3. Shadow increase provides visual confirmation of tap registration
4. Navigation occurs within <200ms for smooth experience

### 4.3 Stage Color System

**Subtle underline only** (no full column tinting):

| Stage | Color Variable | Visual Effect |
|-------|---------------|---------------|
| New Lead | `var(--tag-teal-bg)` | Teal 2px underline |
| Sample/Visit | `var(--warning-subtle)` | Orange/yellow underline |
| Qualified | `var(--tag-blue-bg)` | Blue underline |
| Proposal | `var(--tag-purple-bg)` | Purple underline |
| Negotiation | `var(--tag-warm-bg)` | Warm orange underline |
| Closed Won | `var(--success-strong)` @ 40% opacity | Muted green (inactive) |
| Closed Lost | `var(--error-subtle)` @ 40% opacity | Muted red (inactive) |

**Implementation:**
```tsx
<h3
  className="px-3 py-2 text-sm font-semibold uppercase tracking-wide"
  style={{ borderBottom: `2px solid ${getStageColor(stage)}` }}
>
  {getOpportunityStageLabel(stage)}
</h3>
```

### 4.4 Responsive Behavior

**Desktop (1920px+):**
- Columns use `max-w-[240px]` to prevent over-stretching
- Horizontal scroll for >8 stages
- Hover states fully active

**Tablet/iPad (768px–1024px):**
- Columns use `min-w-[200px]` for comfortable touch targets
- Touch states replace hover (iOS ignores hover on first tap)
- Smooth scrolling with momentum (`overflow-x-auto`)

**Mobile (<768px):**
- Falls back to existing mobile view (if implemented)
- Kanban may not be primary view on small screens

---

## 5. Success Metrics

### 5.1 Visual Quality (Subjective)

✅ **Pass Criteria:**
- Columns and cards feel visually distinct in both light and dark mode
- Users can immediately identify clickable elements
- Stage colors are visible but not overwhelming
- No "wall of grey/black boxes" effect

**Validation Method:** Side-by-side before/after comparison in both themes

### 5.2 Performance (Objective)

✅ **Pass Criteria:**
- All transitions complete within 200ms
- No jank/stutter on iPad (60fps scrolling)
- No layout shift during hover/interaction
- Shadow rendering does not impact CPU >5%

**Validation Method:**
- Chrome DevTools Performance profiling
- iPad Safari testing with 20+ opportunity cards per column

### 5.3 Accessibility (WCAG AA)

✅ **Pass Criteria:**
- All stage colors maintain ≥4.5:1 contrast ratios (validated by `npm run validate:colors`)
- Focus states remain visible (existing ring utilities)
- Interactive elements meet ≥44px touch target size (cards are >44px height)

**Validation Method:**
- Run `npm run validate:colors` (must pass)
- Lighthouse accessibility audit (score ≥90)

### 5.4 Theme Parity

✅ **Pass Criteria:**
- Light and dark modes have equivalent visual hierarchy
- Shadows adapt appropriately (darker in light mode, lighter in dark mode)
- All semantic variables render correctly in both themes

**Validation Method:**
- Manual toggle between light/dark mode
- Screenshot comparison for consistency

### 5.5 Functional Regression

✅ **Pass Criteria:**
- No breaking changes to existing Kanban functionality
- Card navigation still works
- Filtering and stage visibility controls unchanged
- No console errors introduced

**Validation Method:**
- Manual QA of all existing Kanban features
- Visual regression testing (if available)

---

## 6. Out of Scope

### 6.1 Features NOT Included

❌ **Drag-and-Drop:**
- Not part of this enhancement
- Cards remain click-to-view only
- Future feature consideration

❌ **Column Customization:**
- No user-configurable column widths
- No collapsible/expandable columns
- Fixed layout as specified

❌ **Advanced Stage Indicators:**
- No full column background tinting
- No stage icons or badges
- Underline accent only

❌ **Loading States:**
- No skeleton cards during data fetch
- Uses existing loading indicators (if any)
- Out of scope for visual polish MVP

❌ **Empty State Enhancements:**
- No custom empty column illustrations
- Uses existing empty state handling
- Visual consistency only

❌ **Animations Beyond Hover/Active:**
- No entrance/exit animations for cards
- No confetti or celebration effects for won deals
- Simple, performant transitions only

### 6.2 Technical Decisions NOT Changing

❌ **No Backdrop Blur:**
- Removed for iPad performance (per specification)
- Elevation achieved through shadows only

❌ **No CSS File Changes:**
- All styling via Tailwind utility classes
- Inline styles for stage colors only

❌ **No New Components:**
- Modify existing OpportunityColumn/Card/ListContent only
- No new abstraction layers

❌ **No Global Theme Variables:**
- Uses existing semantic tokens only
- No additions to `index.css`

### 6.3 Backward Compatibility

❌ **Not a Concern:**
- Per Engineering Constitution Rule #1 (NO OVER-ENGINEERING)
- Breaking visual changes are acceptable
- No migration path needed

---

## 7. Implementation Phases

### Phase 1: Foundation (1-2 hours)
**Focus:** Bug fixes and basic elevation

1. ✅ Fix `stageConstants.ts` undefined color variables (lines 45, 50)
2. ✅ Add column container elevation (shadow + border + rounded corners)
3. ✅ Add card base elevation (shadow + border)
4. ✅ Test in light/dark mode

**Deliverable:** Columns and cards have visible depth

### Phase 2: Interactive States (2-3 hours)
**Focus:** Hover and touch feedback

5. ✅ Add column hover shadow increase
6. ✅ Add card hover shadow + border glow
7. ✅ Add card active scale-down feedback
8. ✅ Add `touch-manipulation` optimization
9. ✅ Test on iPad Safari

**Deliverable:** Interactive elements feel responsive

### Phase 3: Stage Differentiation (1-2 hours)
**Focus:** Subtle color indicators

10. ✅ Add stage color underline to column headers
11. ✅ Apply opacity reduction to closed stages (won/lost)
12. ✅ Verify color contrast with `npm run validate:colors`

**Deliverable:** Stages are visually distinguishable

### Phase 4: Board Container (1 hour)
**Focus:** Overall module separation

13. ✅ Add board background surface variant
14. ✅ Apply rounded container + shadow-inner
15. ✅ Verify overflow-x scrolling behavior

**Deliverable:** Kanban feels like a contained workspace

### Phase 5: QA & Polish (1-2 hours)
**Focus:** Cross-browser/device validation

16. ✅ Performance profiling (Chrome DevTools)
17. ✅ Accessibility audit (Lighthouse)
18. ✅ Visual regression check (before/after screenshots)
19. ✅ iPad field testing with sales team

**Deliverable:** Production-ready visual enhancement

---

## 8. File Changes Summary

| File | Lines Changed | Change Type |
|------|--------------|-------------|
| `OpportunityColumn.tsx` | ~15 | Styling (classes + inline style) |
| `OpportunityCard.tsx` | ~10 | Styling (classes only) |
| `OpportunityListContent.tsx` | ~5 | Styling (classes only) |
| `stageConstants.ts` | 2 | Bug fix (variable names) |

**Total:** ~32 lines changed across 4 files

**Risk Level:** Low (visual-only changes, no logic modifications)

---

## 9. Design System Compliance

### Constitution Adherence

✅ **Rule #1 (NO OVER-ENGINEERING):**
- Simple shadow/border elevation only
- No complex animation libraries
- Fail-fast approach (no fallbacks)

✅ **Rule #2 (SINGLE SOURCE OF TRUTH):**
- Uses existing semantic CSS variables only
- No duplicate color definitions

✅ **Rule #8 (COLORS):**
- Semantic variables only (`var(--primary)`, etc.)
- No hex codes in implementation
- Fixes existing violations in `stageConstants.ts`

✅ **Rule #6 (TYPESCRIPT):**
- No new types required (visual changes only)

✅ **Tailwind CSS 4 Conventions:**
- Utility-first approach
- Responsive design patterns
- Accessibility-focused classes

### Validation Commands

**Before merge:**
```bash
npm run validate:colors  # Must pass (WCAG AA compliance)
npm run lint             # Must pass (no ESLint errors)
npm run build            # Must pass (TypeScript check)
```

---

## 10. Reference Materials

### Related Files
- **Components:**
  - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`
  - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`
  - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`
  - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`

- **Constants:**
  - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`
  - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`

- **Design System:**
  - `/home/krwhynot/Projects/atomic/src/index.css` (CSS variables)
  - `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`
  - `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`

### Research Documents
- **Current Implementation:** `.docs/research/kanban-styling/current-implementation.md`
- **Enhancement Recommendations:** `.docs/research/kanban-styling/enhancement-recommendations.md`
- **Visual Reference:** `.docs/research/kanban-styling/visual-reference.md`
- **Color System Analysis:** (MCP agent research output from 2025-10-10)

### Constitution Reference
- `/home/krwhynot/Projects/atomic/CLAUDE.md` (Engineering Constitution)

---

## 11. Acceptance Criteria

### Definition of Done

✅ All 4 component files updated with specified styling
✅ Bug in `stageConstants.ts` fixed (undefined color variables)
✅ Visual hierarchy visible in both light and dark mode
✅ Hover/touch states work on desktop and iPad
✅ Stage color underlines display correctly for all 8 stages
✅ No performance degradation (<200ms transitions)
✅ `npm run validate:colors` passes
✅ No ESLint/TypeScript errors
✅ Before/after screenshots captured for documentation

### Sign-Off Requirements

- [ ] Developer: Visual implementation matches specification
- [ ] QA: Cross-browser/device testing complete
- [ ] Product: Meets user story acceptance criteria
- [ ] Performance: iPad testing confirms <200ms interactions

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
**Author:** Claude Code (requirements gathering)
**Approver:** User (specification provider)
