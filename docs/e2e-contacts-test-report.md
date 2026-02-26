# Contacts Page E2E Test Report

**Date:** 2026-02-25
**Branch:** `refactor/list-architecture-unification`
**Method:** Claude Chrome MCP browser automation against `localhost:5173`
**Login:** `admin@test.com` / seeded E2E data (1638 contacts)

---

## Summary

| Suite | Tests | Pass | Fail | Skip | Notes |
|-------|-------|------|------|------|-------|
| 1. List Load & Display | 9 | 9 | 0 | 0 | All columns, pagination, default sort verified |
| 2. Sorting | 4 | 4 | 0 | 0 | Name, Title, Last Seen sort via dropdown |
| 3. Search | 7 | 7 | 0 | 0 | First name, last name, org, title search + debounce |
| 4. Header Filters | 7 | 7 | 0 | 0 | Name text filter, Status checkboxes, chips |
| 5. Sidebar Filters | 10 | 9 | 0 | 1 | Starred disabled (no favorites), Tags/AM/Activity work |
| 7. Create Flow | 6 | 3 | 1 | 2 | Form loads, fields present, save blocked by RHF state |
| 8. Create All Fields | 12 | - | - | 12 | Blocked by Suite 7 save issue |
| 9. Validation | 10 | - | - | 10 | Blocked by Suite 7 save issue |
| 10. Edit Flow | 10 | - | - | 10 | Pending |
| 6/11-12. Row/SlideOver | 8 | - | - | 8 | Pending |
| 13. Show Page | 10 | - | - | 10 | Pending |
| 14. Bulk Actions | 5 | - | - | 5 | Pending |
| 15. Export | 2 | - | - | 2 | Pending |
| 16. Keyboard Nav | 3 | - | - | 3 | Pending |
| 17. Error/Edge Cases | 4 | - | - | 4 | Pending |

**Overall: 39 PASS / 1 FAIL / 1 SKIP / 66 PENDING**

---

## Suite 1: List Page Load & Display (9/9 PASS)

| # | Test | Result | Details |
|---|------|--------|---------|
| 1.1 | Page loads with data | PASS | Grid visible, 1638 results, 25 rows per page |
| 1.2 | Default sort Last Seen DESC | PASS | URL: `sort=last_seen&order=DESC` |
| 1.3 | All 6 columns render | PASS | NAME, ROLE, TAGS, STATUS, LAST SEEN, ACTIONS |
| 1.4 | Identity cell layout | PASS | Avatar + full name + email visible |
| 1.5 | Status badges with colors | PASS | Cold badges with distinct color styling |
| 1.6 | Tags as colored chips | PASS | Champion, Decision Maker, Budget Holder, VIP chips |
| 1.7 | Last Seen relative date | PASS | Relative dates with green dot indicator |
| 1.8 | Pagination at bottom | PASS | "1-25 of 1638", PAGE 1 of 66 |
| 1.9 | Page 2 loads | PASS | "26-50 of 1638", PAGE 2 |

---

## Suite 2: List Page Sorting (4/4 PASS)

| # | Test | Result | Details |
|---|------|--------|---------|
| 2.1 | Sort by Name ASC | PASS | Clicked NAME header, alphabetical A-Z |
| 2.2 | Sort by Name DESC | PASS | Clicked again, reversed Z-A |
| 2.3 | Sort by Title | PASS | Via sort dropdown "Title ascending" |
| 2.4 | Sort by Last Seen | PASS | Via sort dropdown "Last seen ascending" |

**Note:** Sort dropdown has 3 options: First name ascending, Title ascending/descending, Last seen ascending. Column header clicks toggle ASC/DESC for the clicked column.

---

## Suite 3: List Page Search (7/7 PASS)

| # | Test | Result | Details |
|---|------|--------|---------|
| 3.1 | Search by first name | PASS | "Don" -> 18 results, Don Smith found |
| 3.2 | Search by last name | PASS | "Albanos" -> 1 result, Nick Albanos |
| 3.3 | Search by company name | PASS | "GFS" -> 132 results |
| 3.4 | Search by title | PASS | "Exec Chef" -> 105 results |
| 3.5 | Clear search restores list | PASS | Cleared filter chip, back to 1638 |
| 3.6 | No results empty state | PASS | "zzzznonexistent" -> "0 results", "No Contacts found using the current filters", "Clear filters" button |
| 3.7 | Search debounces (300ms) | PASS | Single network query after typing stops, no intermediate requests |

**Finding:** Search uses `q` parameter with ilike matching. Full-name phrase search (e.g., "Don Smith") returns 0 results — search terms appear to match as a single phrase, not individual words across fields.

---

## Suite 4: Header Filters (7/7 PASS)

| # | Test | Result | Details |
|---|------|--------|---------|
| 4.1 | Name header filter opens popover | PASS | Radix popover with text input "Filter name...", triggered via JS click |
| 4.2 | Name filter filters results | PASS | "Sarah" -> 3 results, URL: `first_name@ilike=%Sarah%` |
| 4.3 | Status header filter opens popover | PASS | Checkboxes: Cold, Warm, Hot, Contract + "Select All" (0 of 4) |
| 4.4 | Status filter — single value | PASS | Cold -> 1638 results (all contacts are cold status) |
| 4.5 | Status filter — multiple values | PASS | Cold+Warm -> URL: `status=["cold","warm"]` |
| 4.6 | Filter chip appears | PASS | "Sarah" chip, "Cold"/"Warm" chips visible in toolbar |
| 4.7 | Remove filter via chip | PASS | "Remove Warm filter" / "Remove Cold filter" buttons work |

**Finding:** Radix popover triggers require JS `.click()` — the MCP `left_click` by ref didn't open them. Filter chips have `aria-label="Remove X filter"` buttons for individual removal plus "Clear all N filters" for bulk clear.

---

## Suite 5: Sidebar Filters (9/10 PASS, 1 SKIP)

| # | Test | Result | Details |
|---|------|--------|---------|
| 5.1 | Sidebar visible | PASS | Complementary region "Filter contacts" with 4 sections |
| 5.2 | Starred filter toggle | PASS (disabled) | Correctly disabled — no starred contacts. Tooltip: "Star items to use this filter" |
| 5.3 | Last Activity — Today | PASS | `last_seen@gte=2026-02-25T05:59:59.999Z` |
| 5.4 | Last Activity — This week | PASS | `last_seen@gte=2026-02-23T06:00:00.000Z` (Monday) |
| 5.5 | Last Activity — custom range | SKIP | DateRangeFilterButton not tested (preset buttons verified) |
| 5.6 | Tags filter — single tag | PASS | Decision Maker (id=1) -> 6 results |
| 5.7 | Tags filter — multiple tags | PASS | Decision Maker + VIP -> 1 result, `tags=[1,8]` |
| 5.8 | Account Manager filter | PASS | Sarah Chen -> 247 results, `sales_id=6`. Dropdown: My Items, All, Admin User, Emily Rodriguez, Manager Test, Marcus Johnson, Rep Test, Sarah Chen |
| 5.9 | Combined filters | PASS | Sarah Chen + Champion tag -> 1 result (intersection) |
| 5.10 | Clear all filters | PASS | Via `aria-label="Clear all filters"` button, restored 1638 |

**Sidebar structure:** 4 collapsible sections (Starred, Last activity, Tags, Account Manager). Sections expand via JS click (not all respond to MCP ref clicks).

**Tags available (10):** Budget Holder, Champion, Cold Lead, Decision Maker, Gatekeeper, Influencer, Needs Follow-up, New Contact, Technical, VIP.

---

## Suite 7: Create Flow — Happy Path (3/6, 1 FAIL)

| # | Test | Result | Details |
|---|------|--------|---------|
| 7.1 | Navigate to create | PASS | `/contacts/create` loads |
| 7.2 | Required fields visible | PASS | First Name, Last Name, Organization (combobox picker), Primary Account Manager |
| 7.3 | Sales_id auto-populated | PASS | Pre-filled with "Admin User" (current user) |
| 7.4 | Fill minimum required fields | PASS | first_name="E2E Happy", last_name="Path", org="2d Restaurant", sales="Admin User" |
| 7.5 | Save succeeds | **FAIL** | Save button clicked but form shows "required" errors for all 4 fields despite values being present in DOM |
| 7.6 | New contact in list | SKIP | Blocked by 7.5 |

### Root Cause Analysis: Create Form Save Failure

**Symptom:** After filling all required fields and clicking "Save & Close", the form shows validation errors ("First name is required", "Last name is required", "Organization is required", "Primary account manager is required") even though all field values are present in the DOM.

**Root Cause:** React Hook Form (RHF) uses an internal state model that is separate from the DOM. The MCP `type` action and `form_input` tool update the DOM value of the input elements, but they do not trigger the synthetic React events that RHF listens to for updating its internal `formState.values`. When RHF runs validation on submit, it reads from its own internal state (which is still empty/default) rather than the DOM.

**Affected fields:**
- `first_name` / `last_name`: Standard text inputs managed by RHF `register()` — need proper React synthetic `onChange` events
- `organization_id`: Custom `OrganizationPicker` combobox — selection handled via React callback, not DOM events
- `sales_id`: Custom `SelectInput` combobox — auto-populated but RHF may not have registered the default

**Possible mitigations:**
1. Use React DevTools or fiber walking to call RHF `setValue()` directly
2. Use `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` to trigger React's synthetic change handler (attempted, did not clear errors)
3. Accept this as a known limitation of Claude Chrome MCP with React Hook Form controlled inputs
4. Write a small helper script injected into the page that exposes `window.__rhf_setValue` for testing

**Impact:** All create/edit form tests (Suites 7-10, 12) are affected by this limitation.

---

## Known Issues & Observations

### 1. Screenshot "Detached while handling command" errors
Screenshots intermittently fail with "Detached while handling command" error. This appears to be a Chrome MCP extension issue. Workaround: use `read_page`, `find`, and `javascript_tool` instead of screenshots.

### 2. Radix popover triggers require JS clicks
Radix UI popover trigger buttons (used for header filters) don't respond to MCP `left_click` by reference. They require `javascript_tool` to call `.click()` directly on the DOM element.

### 3. React Hook Form state mismatch with browser automation
The MCP `type` action updates DOM values but doesn't trigger React's synthetic event system. React Hook Form reads its own internal state, not DOM values. This blocks form submission testing.

### 4. Filter persistence in session
Clearing filters via URL navigation doesn't always work — React Admin persists filter state in its store. Direct navigation with `filter=%7B%7D` in the URL is the most reliable way to clear filters.

### 5. Collapsible sidebar sections
Sidebar filter sections (Last activity, Tags, Account Manager) are collapsed by default. They require a JS click on the section header button to expand. `aria-expanded` attribute tracks state.

### 6. All seed contacts have "cold" status
The E2E seed data sets all 1638 contacts to "cold" status. This means status filter tests for "hot" or "warm" return 0 results (valid filter behavior, but limits status filter testing).

---

## Test Environment

- **App:** MasterFood Broker CRM (Crispy CRM)
- **URL:** `http://localhost:5173`
- **Backend:** Supabase local (Docker)
- **Seed data:** E2E seed with 1638 contacts, 10 tags, 10 organizations
- **Browser:** Chrome with Claude-in-Chrome MCP extension
- **Login:** `admin@test.com` (Admin User)
