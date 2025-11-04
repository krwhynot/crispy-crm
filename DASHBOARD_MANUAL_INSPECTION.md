# Dashboard Manual Inspection Checklist
**Created**: November 4, 2025
**Purpose**: Visual verification of ultra-compact dashboard layout

---

## Quick Access

**Dashboard URL**: http://localhost:5173/#/
**Login**: admin@test.com / password123

---

## Inspection Checklist

### 1. Overall Layout ✓
- [ ] Dashboard header visible and readable
- [ ] Refresh button functional
- [ ] All widgets visible without horizontal scrolling
- [ ] Vertical scrolling required? (Should be minimal/none)

### 2. Metrics Grid (Top Section)
**Expected**: 3 cards in a row, ultra-compact (64-80px height)

- [ ] Total Contacts card displays correctly
- [ ] Total Organizations card displays correctly
- [ ] Activities This Week card displays correctly
- [ ] Icons visible (inline, small size ~16-20px)
- [ ] Numbers readable
- [ ] Text not truncated

**Potential Issues to Check**:
- Icons too small?
- Text overlapping?
- Cards too cramped?
- Values hard to read?

### 3. Phase 4 Widgets (6-widget grid)
**Expected**: 2 columns on md, 3 columns on lg, height 60-80px

Widgets:
1. [ ] My Open Opportunities
2. [ ] Overdue Tasks
3. [ ] This Week's Activities
4. [ ] Opportunities by Principal
5. [ ] Pipeline by Stage (spans 2 columns, chart height 60px)
6. [ ] Recent Activities

**Potential Issues**:
- Widget titles truncated with "..."?
- Icons missing or too small?
- Content not centered?
- Text unreadable (too small)?
- Widgets too short (content cut off)?
- Chart illegible?

### 4. Pipeline by Stage Chart
**Expected**: Ultra-compact bar chart, 60px height, Y-axis 80px wide

- [ ] Chart visible
- [ ] Bars clickable
- [ ] Stage labels readable (9px font)
- [ ] Tooltip appears on hover
- [ ] Chart not squished vertically
- [ ] All stages visible

**Known Trade-offs**:
- X-axis hidden to save space
- Very small font size (9px)
- Minimal margins

### 5. Text Readability
**Font Sizes**:
- Widget titles: 10px (base) → 12px (md)
- Widget values: 24px (base) → 30px (lg)
- Metrics labels: 9-10px
- Chart text: 9px

**Check**:
- [ ] Can you read widget titles?
- [ ] Can you read the numbers?
- [ ] Can you read chart labels?
- [ ] Is any text completely illegible?

### 6. Spacing and Gaps
**Expected**: Ultra-tight spacing
- Section gaps: 8px
- Widget gaps: 6-8px
- Internal padding: 8-12px

**Check**:
- [ ] Widgets too close together?
- [ ] Content touching edges?
- [ ] Feels too cramped?
- [ ] Uncomfortable to scan?

### 7. Touch Targets (If on Touch Device)
**Minimum**: 44×44px Apple HIG standard

- [ ] Can you tap widgets easily?
- [ ] Buttons easy to press?
- [ ] Chart bars tappable?
- [ ] No accidental taps?

### 8. Responsive Breakpoints

**iPad Portrait (768px)**:
- [ ] Single column layout
- [ ] All content visible
- [ ] Minimal scrolling
- [ ] Touch targets adequate

**iPad Landscape (1024px)**:
- [ ] 2-3 column layout
- [ ] Everything fits in viewport
- [ ] No horizontal scroll
- [ ] Comfortable density

**Desktop (1440px+)**:
- [ ] 3 column layout
- [ ] Appropriate scaling
- [ ] Not too sparse
- [ ] Good use of space

---

## Common Issues to Report

### Layout Issues
1. **Widgets overlapping** - borders touching, content bleeding
2. **Text truncation** - important text cut off with "..."
3. **Scroll required** - vertical scroll needed to see all widgets
4. **Horizontal scroll** - page wider than viewport

### Readability Issues
5. **Font too small** - can't read widget titles/values
6. **Icons too small** - can't distinguish icon types
7. **Chart illegible** - can't read stage labels or values
8. **Poor contrast** - text hard to see against background

### Functional Issues
9. **Widgets not clickable** - navigation broken
10. **Chart not interactive** - tooltips not showing
11. **Data incorrect** - wrong counts displayed
12. **Layout broken** - widgets stacked incorrectly

### Aesthetic Issues
13. **Too cramped** - uncomfortable information density
14. **Unbalanced** - some widgets much larger than others
15. **Inconsistent spacing** - gaps vary weirdly
16. **Visual hierarchy lost** - can't tell what's important

---

## How to Report Issues

When you see something wrong, please describe:

1. **What's wrong**: Brief description
2. **Where**: Which widget/section
3. **Expected**: What you expected to see
4. **Actual**: What you actually see
5. **Severity**: Critical / Major / Minor

**Example**:
```
Issue: Pipeline chart is illegible
Where: Pipeline by Stage widget (bottom row, spans 2 columns)
Expected: Readable stage labels and bar values
Actual: Text is too small (9px), can barely read "Prospecting"
Severity: Major - defeats the purpose of the chart
```

---

## Screenshots to Capture

If possible, take screenshots of:
1. Full dashboard view (scroll to top)
2. Metrics grid (top 3 cards)
3. Any widget that looks broken
4. Pipeline chart specifically
5. Browser console (F12) if there are errors

---

## Next Steps

Based on your feedback, I can:
1. **Increase specific sizes** - make particular elements bigger
2. **Adjust spacing** - add more breathing room
3. **Restore previous sizes** - rollback the 80% reduction
4. **Hybrid approach** - some widgets compact, others normal
5. **Add density toggle** - let users choose compact/comfortable/spacious

---

**Please review the dashboard at http://localhost:5173/#/ and let me know what specific issues you're seeing.**
