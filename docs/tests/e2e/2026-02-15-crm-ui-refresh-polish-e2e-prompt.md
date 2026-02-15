# CRM UI Refresh Polish E2E Prompt (Focused)

Use this prompt with Claude Chrome to validate the latest UI polish pass on list views and opportunities Kanban.

---

## Environment

- Base URL: `http://localhost:5173`
- Login: `admin@test.com / password123`
- Start from a clean browser session

---

## Claude Chrome Prompt (Copy/Paste)

You are validating a focused CRM UI polish release.  
Test only the areas below and produce a concise PASS/FAIL report with screenshots.

### 1) Contacts List: Row Actions Visibility (Desktop vs Tablet)

1. Open `{BASE_URL}/#/contacts` on desktop width (1440x900).
2. Verify row actions (`View`, `Edit`, `Delete`) are NOT visible on non-hovered rows.
3. Hover a row: verify actions become visible for that row.
4. Focus a row using keyboard (`Tab` into row/actions): verify actions become visible on focus.
5. Resize to tablet width (1024x768) and reload.
6. Verify actions are visible without hover at tablet/mobile breakpoint.

Expected:
- Desktop: hover/focus reveal behavior works.
- Tablet/mobile: actions remain visible.

### 2) Contacts List: Comfortable Density + Name Hierarchy

1. Stay on Contacts list in `Comfortable` mode.
2. Verify row height/padding feels roomier than compact.
3. Verify Name column has stronger hierarchy than metadata (name text visually larger/bolder than email).
4. Toggle to `Compact` and back to `Comfortable`; verify spacing changes and preference persists on reload.

Expected:
- Comfortable rows clearly less dense than compact.
- Name text has stronger visual priority.

### 3) Pagination Footer Spacing

1. On Contacts list, inspect footer controls around `Prev`, `Page X of Y`, count text, and `Next`.
2. Verify `Page` input group has clear spacing and does not feel cramped.
3. Enter an invalid page (`999999`) and press Enter.
4. Verify input clamps to valid max page and list updates without errors.

Expected:
- Footer controls are visually separated and readable.
- Page input clamping works.

### 4) Filter Sidebar Collapse/Affordance

1. In desktop Contacts list, collapse the filter sidebar.
2. Verify a clear `Show filters` affordance appears when collapsed.
3. Re-open sidebar using that control.
4. Verify header control clearly communicates `Hide` action.

Expected:
- Collapse/expand affordance is obvious in both states.

### 5) Opportunities Kanban Polish

1. Open `{BASE_URL}/#/opportunities`.
2. Switch to Kanban view if needed.
3. Verify column headers remain sticky while scrolling within a column.
4. Verify each stage header shows count total.
5. Drag a card across columns and observe drag-over feedback.
6. Verify card appearance: roomier padding + subtle elevation.

Expected:
- Sticky headers work.
- Stage totals visible.
- Drag-over feedback is clear and smooth.

### 6) Regression Guardrails

For all flows above:
- Capture console errors/warnings.
- Capture failed network requests.
- Confirm no broken navigation or stuck overlays.

---

## Output Format

Return:

1. Overall status: `PASS` or `FAIL`
2. Section-by-section results (1-6), each with:
   - `PASS`/`FAIL`
   - one-line evidence
   - screenshot reference
3. Defects table (if any):
   - Severity (`High`/`Medium`/`Low`)
   - Repro steps
   - Expected vs Actual
   - Screenshot
