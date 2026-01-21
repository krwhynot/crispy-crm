# E2E Test: ColumnsButton Refactor - Excel-Style UI

**Test Date:** 2026-01-20
**Component:** `ColumnsButton` (columns-button.tsx) + `FieldToggle` (field-toggle.tsx)
**Pattern Reference:** CheckboxColumnFilter UI structure
**Focus:** Visibility toggles, Show All/Reset, drag-to-reorder, focus management

---

## Pre-Test Setup

1. Start dev server: `just dev`
2. Open [http://localhost:5173](http://localhost:5173) in Claude Chrome
3. Navigate to any list view (e.g., **Contacts** or **Opportunities**)
4. Verify "Columns" button is visible in the toolbar

---

## Test Scenarios

### Scenario 1: Popover Structure & Styling
**Goal:** Verify new header/body/footer layout matches CheckboxColumnFilter pattern

**Steps:**
1. Click the "Columns" button to open popover
2. ✅ **Verify Header:**
   - Header shows "Columns" label
   - "Reset" button appears (only if any columns are hidden)
   - Header has border-bottom divider
3. ✅ **Verify Body:**
   - List of checkboxes displayed (one per column)
   - Each row has 44px minimum height
   - Each row has hover effect (subtle background color change)
   - Grip handle icon visible on right side (for drag-to-reorder)
4. ✅ **Verify Footer:**
   - "Show All" button on left
   - Counter displays "X of Y visible" on right
   - Footer has border-top divider

**Expected Result:** Layout matches CheckboxColumnFilter visual style

---

### Scenario 2: Column Visibility Toggles
**Goal:** Verify checkboxes control column visibility

**Steps:**
1. Open Columns popover
2. Identify a column that's currently **visible** (checkbox checked)
3. Click the checkbox to uncheck it
4. ✅ Verify the column **disappears** from the table
5. Reopen Columns popover
6. ✅ Verify the checkbox is now **unchecked**
7. Click the checkbox again to check it
8. ✅ Verify the column **reappears** in the table
9. ✅ Verify counter updated correctly

**Expected Result:** Clicking checkboxes immediately hides/shows columns

---

### Scenario 3: Show All Button
**Goal:** Verify Show All reveals all columns

**Steps:**
1. Open Columns popover
2. Hide at least 2-3 columns by unchecking checkboxes
3. ✅ Verify "Reset" button appeared in header
4. ✅ Verify counter shows partial count (e.g., "3 of 6 visible")
5. Click "Show All" button
6. ✅ Verify **all columns are now visible**
7. ✅ Verify counter shows full count (e.g., "6 of 6 visible")
8. ✅ Verify "Show All" button is now **disabled** (grayed out)

**Expected Result:** Show All reveals all columns and disables itself

---

### Scenario 4: Reset Button
**Goal:** Verify Reset restores default column visibility

**Steps:**
1. Open Columns popover
2. Hide several columns (uncheck checkboxes)
3. ✅ Verify "Reset" button appeared in header
4. Close and reopen popover to verify state persists
5. Click "Reset" button
6. ✅ Verify popover closes
7. Reopen Columns popover
8. ✅ Verify columns are back to **default state**
9. ✅ Verify "Reset" button is now **hidden** (only shows when columns differ from defaults)

**Expected Result:** Reset restores default hidden columns and hides the Reset button

---

### Scenario 5: Search Filter (if >5 columns)
**Goal:** Verify column search still works with new layout

**Steps:**
1. Navigate to a list with >5 columns (e.g., Contacts)
2. Open Columns popover
3. ✅ Verify search input field appears below header
4. Type partial column name (e.g., "name" or "email")
5. ✅ Verify list filters to only matching columns
6. Clear search field
7. ✅ Verify all columns reappear
8. Verify layout remains intact (header/body/footer positions)

**Expected Result:** Search filters columns; layout unchanged

---

### Scenario 6: Drag-to-Reorder Columns
**Goal:** Verify drag-and-drop reordering persists with new label structure

**Steps:**
1. Open Columns popover
2. Identify two adjacent column rows (e.g., "Name" and "Email")
3. ✅ Verify grip handles (≡ icon) visible on right side of each row
4. Click and drag the **first** column's grip handle down to **below the second** column
5. ✅ Verify rows visually reorder in the popover
6. Close popover
7. ✅ Verify table column order changed in grid
8. Refresh page (F5)
9. Open Columns popover
10. ✅ Verify new order **persisted** in localStorage

**Expected Result:** Drag-to-reorder works; order saves to localStorage

---

### Scenario 7: Focus Management (UI-04 Fix)
**Goal:** Verify popover doesn't trap focus or auto-focus incorrectly

**Steps:**
1. Click Columns button to open popover
2. ✅ Verify focus does **NOT** jump to first input/button
3. Press **Tab** key several times
4. ✅ Verify focus cycles through:
   - Checkboxes in the list
   - Show All button
   - Back to popover trigger or body (natural tab order)
5. Press **Escape** key
6. ✅ Verify popover closes
7. ✅ Verify focus returns to Columns button

**Expected Result:** Focus is manageable; no trap; Tab cycles naturally

---

### Scenario 8: Touch Targets (44px)
**Goal:** Verify all interactive elements meet accessibility target size

**Steps:**
1. Open Columns popover
2. Use Chrome DevTools (F12) → Inspector
3. Hover over each checkbox row
4. ✅ Inspect element and verify `min-height: 44px` in styles
5. Verify grip handle has adequate spacing
6. On a mobile/tablet device (if available):
   - Click a checkbox
   - ✅ Verify it's easy to tap (not cramped)
   - Drag a grip handle
   - ✅ Verify drag target is easy to grab

**Expected Result:** All clickable elements are ≥44px; mobile-friendly

---

### Scenario 9: Hover States
**Goal:** Verify visual feedback on hover

**Steps:**
1. Open Columns popover
2. Hover mouse over a checkbox row
3. ✅ Verify row background changes (subtle highlight)
4. ✅ Verify text color adjusts for contrast
5. Move mouse away
6. ✅ Verify hover state clears

**Expected Result:** Clear hover feedback; smooth transition

---

### Scenario 10: Multiple Column Lists
**Goal:** Verify behavior with varying column counts

**Test A - Few Columns (<5):**
1. Navigate to a resource with <5 columns
2. Open Columns popover
3. ✅ Verify search input **does NOT appear**
4. ✅ Verify other UI elements still visible (header, footer, checkboxes)

**Test B - Many Columns (>10):**
1. Navigate to a resource with >10 columns
2. Open Columns popover
3. ✅ Verify search input **appears**
4. ✅ Verify scrollbar appears on list (max-h-64 with overflow)
5. Scroll through list
6. ✅ Verify footer stays visible at bottom

**Expected Result:** Layout adapts correctly to column count

---

## Regression Tests (Ensure Existing Features Still Work)

### Regression 1: Switch to Checkbox Doesn't Break Toggle
- Open Columns popover
- ✅ Click checkbox (was previously Switch)
- ✅ Column visibility changes immediately
- ✅ No console errors

### Regression 2: Context Preservation
- Open Columns popover
- Hide columns
- Navigate to a different list resource
- ✅ Return to first list
- ✅ Hidden columns are still hidden (state preserved)

### Regression 3: No Focus Trap (UI-04)
- Open Columns popover multiple times
- Close with Escape
- ✅ Focus returns to button
- ✅ Can tab away from popover area

---

## Manual Verification Checklist

- [ ] Header displays "Columns" label
- [ ] Reset button appears only when columns hidden
- [ ] Checkboxes toggle column visibility
- [ ] Show All button reveals all columns
- [ ] Show All button disables when all visible
- [ ] Reset button restores defaults
- [ ] Counter shows "X of Y visible" correctly
- [ ] Search input appears for >5 columns
- [ ] Search filters column list
- [ ] Drag-to-reorder works with grip handles
- [ ] Reorder persists after page refresh
- [ ] Hover states visible on all rows
- [ ] 44px touch targets confirmed
- [ ] Focus management works (no trap)
- [ ] Tab navigation cycles naturally
- [ ] Escape closes popover
- [ ] No console errors
- [ ] Mobile/tablet interaction smooth

---

## Known Issues / Edge Cases

| Case | Expected Behavior | Status |
|------|-------------------|--------|
| All columns hidden | Show All enabled, Reset shows | ✅ By design |
| No columns modified | Reset button hidden | ✅ By design |
| Search with no matches | Empty list displayed | ✅ Expected |
| Drag outside container | Drag cancelled, order unchanged | ✅ Expected |

---

## Sign-Off

- **Tester:** [Your Name]
- **Date:** [Test Date]
- **Browser:** Chrome (Claude Chrome)
- **Device:** [Desktop/Tablet]
- **Result:** ✅ PASS / ❌ FAIL

### Notes:
[Add any observations, issues, or edge cases here]

---

## Related Files
- Implementation: `src/components/ra-wrappers/columns-button.tsx`
- Toggle Component: `src/components/ra-wrappers/field-toggle.tsx`
- Reference Pattern: `src/components/ra-wrappers/column-filters/CheckboxColumnFilter.tsx`
- UI-04 Task: Focus management on ColumnsButton popover
