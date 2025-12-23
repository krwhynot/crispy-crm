# E2E Manual Testing Workflow: Product Forms

## Purpose
Step-by-step guide to manually test all product form touchpoints in Crispy CRM: Create, Edit, SlideOver, List, and Distribution Network Setup. Use this to identify UX issues, verify form completion, and validate the complete product lifecycle including principal relationships and distributor assignments.

**Scope:** Product management including principal association, category selection (with custom creation), status management, and distributor network setup with vendor item numbers (DOT# codes).

---

## WHAT TO OBSERVE & NOTE WHILE TESTING

### Performance Notes
- [ ] How long does the Principal autocomplete take to load options?
- [ ] How long does the Distributor multi-select take to populate?
- [ ] Any lag when switching between Details and Distribution tabs?
- [ ] Does the SlideOver open smoothly (40vw slide-in animation)?
- [ ] Are list filters responsive (debounce noticeable)?
- [ ] Does category autocomplete feel snappy?

### UX Friction Points
- [ ] Were required fields clearly marked (name, principal, category)?
- [ ] Was Principal/Supplier selection intuitive (only principals shown)?
- [ ] Was category selection clear (predefined vs. custom creation)?
- [ ] Did you understand how to add custom categories?
- [ ] Was the Distribution tab purpose clear?
- [ ] Did DOT# input fields appear/disappear smoothly when selecting distributors?
- [ ] Were error messages helpful or cryptic?
- [ ] Did tab order make sense (keyboard navigation)?

### Form Behavior
- [ ] Did status default to "active" correctly?
- [ ] Did custom category creation flow work intuitively?
- [ ] Did DOT# fields appear dynamically per distributor selection?
- [ ] Did "unsaved changes" warning appear when navigating away?
- [ ] Did form progress bar show during submission?
- [ ] Did validation errors scroll to first error field?

### Accessibility
- [ ] Could you complete the entire form with keyboard only?
- [ ] Were touch targets large enough (44x44px minimum)?
- [ ] Did focus states appear clearly on all interactive elements?
- [ ] Did error messages have proper ARIA attributes?
- [ ] Could you navigate tabs with keyboard (arrow keys)?
- [ ] Did the SlideOver trap focus appropriately?

---

## WORKFLOW A: FULL PRODUCT CREATE FORM

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Products** in sidebar
3. Click **"Create"** button (top right) or use FloatingCreateButton

---

### STEP 1: Product Details Tab (First Tab)

**Goal:** Enter required product information and classification.

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| Product Name | "Premium Arabica Coffee Blend - 5lb Bag" | Yes | Does it trim whitespace? Max 255 chars enforced? |
| Principal/Supplier | (Select from autocomplete - e.g., "Acme Foods") | Yes | Only organizations with type "principal" shown? Search works? |
| Category | "beverages" (from dropdown) | Yes | All 16 predefined options available? |
| Status | Keep default "Active" | Yes (default) | Is "Active" pre-selected? |
| Description | "Premium arabica coffee blend sourced from Colombian highlands. Rich, full-bodied flavor with notes of chocolate and citrus." | No | Multiline works? Preserves line breaks? |

**Principal Autocomplete Testing:**
- [ ] Type partial name → suggestions filter correctly
- [ ] Only Principal-type organizations appear (no Customers, Distributors, Prospects)
- [ ] Selection populates field correctly
- [ ] Can clear selection and choose different principal
- [ ] Required validation triggers if skipped

**Category Dropdown Testing:**
- [ ] All 16 predefined categories visible:
  - beverages, dairy, frozen, fresh_produce, meat_poultry, seafood
  - dry_goods, snacks, condiments, baking_supplies, spices_seasonings
  - canned_goods, pasta_grains, oils_vinegars, sweeteners, other
- [ ] Categories display in Title Case (e.g., "Fresh Produce")
- [ ] Selection is immediate (no lag)

**After completing Details tab:**
- [ ] All required fields have visible indicators (asterisk or similar)
- [ ] Tab can be navigated with keyboard
- [ ] Clicking Distribution tab works without saving

---

### STEP 2: Distribution Tab (Second Tab)

**Goal:** Configure which distributors carry this product and their vendor item numbers.

| Field | Enter This Value | Notes |
|-------|------------------|-------|
| Distributors | Select 2-3 distributors from multi-select | Only Distributor-type organizations shown? |
| Vendor Item Number (per distributor) | "USF-12345" for US Foods, "SYS-67890" for Sysco | Fields appear dynamically? |

**Multi-Distributor Selection Testing:**

1. **Initial State:**
   - [ ] Distribution tab shows multi-select input
   - [ ] Placeholder text explains purpose
   - [ ] No DOT# input fields visible initially

2. **Select First Distributor:**
   - [ ] Only Distributor-type organizations in dropdown
   - [ ] Selection adds chip/tag to input
   - [ ] DOT# input field appears for that distributor
   - [ ] Field is labeled with distributor name

3. **Select Additional Distributors:**
   - [ ] Each selection adds new chip
   - [ ] Each selection adds corresponding DOT# input
   - [ ] Fields are visually grouped by distributor

4. **Remove Distributor:**
   - [ ] Click X on chip removes it
   - [ ] Corresponding DOT# field disappears
   - [ ] Other distributors unaffected

5. **Enter DOT# Codes:**
   - [ ] Can enter alphanumeric codes (max 50 chars)
   - [ ] Field accepts: USF-12345, SYS-67890, GFS001234
   - [ ] Leading/trailing spaces trimmed

**DOT# Code Types (Vendor Item Numbers):**
| Distributor | Code Format Example |
|-------------|---------------------|
| US Foods (USF) | USF-12345 |
| Sysco | SYS-67890 |
| Gordon Food Service (GFS) | GFS001234 |
| PFG | PFG-ABC123 |
| Greco | GRECO-789 |
| GOFO | GOFO-456 |
| RDP | RDP-321 |
| Wilkens | WLK-654 |

---

### STEP 3: Custom Category Creation

**Goal:** Verify users can create custom product categories.

| Action | Expected Behavior |
|--------|-------------------|
| Open category dropdown | See all 16 predefined options |
| Type "specialty_sauces" (not in list) | Input shows typed value |
| Look for creation prompt | "Add custom category: specialty_sauces" option appears |
| Select custom option | Category field populates with custom value |
| Submit form | Custom category saved successfully |
| Edit product later | Custom category persists |
| Filter list by category | Custom category appears in filter options |

**Edge Cases:**
- [ ] Can create category with spaces: "specialty sauces"
- [ ] Can create category with special chars: "café & bakery"
- [ ] Max length enforced (100 chars)
- [ ] Empty custom category prevented

---

### STEP 4: Form Submission

**Goal:** Complete product creation and verify success.

| Action | Expected Behavior |
|--------|-------------------|
| Click "Save" button | Form progress indicator appears |
| Wait for submission | No double-submission on rapid clicks |
| Observe redirect | Redirects to Products list |
| Find new product | Product appears in list (possibly at top) |
| Click to open | SlideOver shows all entered data |

**Submission Verification:**
- [ ] Progress bar/spinner visible during save
- [ ] Success notification appears
- [ ] Redirects to list (not stays on form)
- [ ] New product visible in list
- [ ] All fields saved correctly (verify in SlideOver)
- [ ] Distributor assignments saved (check Relationships tab)

---

## WORKFLOW B: FULL PAGE EDIT

### Pre-Requisites
1. Have at least one product created
2. Navigate to **Products** list

---

### STEP 1: Navigate to Edit

| Method | Steps |
|--------|-------|
| From List | Click product row → SlideOver opens → Click "Edit" button |
| Direct URL | Navigate to `/products/{id}` |

---

### STEP 2: Verify Pre-Population

**Goal:** Ensure all previously saved data loads correctly.

| Field | Verification |
|-------|-------------|
| Product Name | Shows saved name exactly |
| Principal/Supplier | Shows selected principal |
| Category | Shows saved category (including custom) |
| Status | Shows correct status selection |
| Description | Shows saved description with formatting |
| Distributors | Shows all assigned distributors |
| DOT# Codes | Shows saved vendor item numbers per distributor |

**Pre-fill Checks:**
- [ ] All required fields populated
- [ ] Principal shows as selected (not just ID)
- [ ] Custom categories display correctly
- [ ] Distributor chips all present
- [ ] DOT# values match what was saved
- [ ] No "unsaved changes" warning on load

---

### STEP 3: Make Changes

**Goal:** Test that edits save correctly.

| Field Change | Test |
|--------------|------|
| Change Product Name | Append " - Updated" |
| Change Principal | Select different principal |
| Change Category | Switch from predefined to custom or vice versa |
| Change Status | Switch to "Discontinued" |
| Edit Description | Add new paragraph |
| Add Distributor | Select additional distributor |
| Remove Distributor | Remove one existing distributor |
| Change DOT# | Update existing vendor item number |

---

### STEP 4: Save and Verify

| Action | Expected |
|--------|----------|
| Click "Save" | Progress indicator shows |
| Observe success | Success notification |
| Check list view | Changes reflected immediately (cache invalidation) |
| Re-open product | All changes persisted |

**Cache Invalidation Checks:**
- [ ] List view updates without refresh
- [ ] Principal filter shows correct products
- [ ] Category filter reflects any changes
- [ ] Status badge updates in list

---

### STEP 5: Delete Flow

| Action | Expected |
|--------|----------|
| Click "Delete" button | Confirmation dialog appears |
| Read confirmation | Shows product name being deleted |
| Click "Cancel" | Dialog closes, no deletion |
| Click "Delete" again | Confirmation dialog |
| Click "Confirm Delete" | Product deleted |
| Observe redirect | Returns to Products list |
| Verify removal | Product no longer in list |

**Delete Restrictions (if any):**
- [ ] Can product with active opportunities be deleted?
- [ ] Warning shown if product has relationships?
- [ ] Soft delete (deleted_at) vs. hard delete?

---

## WORKFLOW C: SLIDEOVER QUICK VIEW/EDIT

### Pre-Requisites
1. Have products in the list
2. Navigate to **Products** list

---

### STEP 1: Open SlideOver

| Action | Expected |
|--------|----------|
| Click product row | SlideOver slides in from right |
| Observe width | 40vw (approximately 576px on 1440px screen) |
| Check URL | `?view={product_id}` appended |
| Default tab | "Details" tab selected |
| Default mode | View mode (not edit) |

**SlideOver Basics:**
- [ ] Smooth slide-in animation
- [ ] Product name in header
- [ ] Close button visible (X)
- [ ] ESC key closes SlideOver
- [ ] Click outside closes SlideOver
- [ ] Focus trapped within SlideOver

---

### STEP 2: Details Tab - View Mode

**Goal:** Verify read-only display of product information.

| Element | Expected Display |
|---------|------------------|
| Product Name | Large heading text |
| Description | Paragraph with preserved whitespace |
| Category | Badge with formatted label (Title Case) |
| Status | Semantic badge (green=active, red=discontinued, blue=coming_soon) |
| Principal | Clickable link to organization |
| Distributor Codes | Grid showing distributor name + DOT# (if any) |

**View Mode Checks:**
- [ ] All fields displayed (not editable)
- [ ] Principal shows as organization link
- [ ] Category badge styled correctly
- [ ] Status uses semantic colors:
  - Active: default/green styling
  - Discontinued: destructive/red styling
  - Coming Soon: secondary/blue styling
- [ ] Distributor codes section visible (if distributors assigned)
- [ ] Empty state if no distributors

---

### STEP 3: Details Tab - Edit Mode

| Action | Expected |
|--------|----------|
| Click "Edit" toggle button | Form inputs appear |
| Product Name | Text input with current value |
| Principal/Supplier | Autocomplete with current selection |
| Category | Dropdown/autocomplete with current value |
| Status | Select dropdown with current value |
| Description | Textarea with current value |

**Edit Mode Checks:**
- [ ] Toggle clearly indicates edit mode
- [ ] All fields become editable
- [ ] Current values pre-populated
- [ ] Save and Cancel buttons appear
- [ ] Can modify any field
- [ ] Cancel reverts to view mode without saving

**Save from Edit Mode:**
- [ ] Click "Save" → shows loading
- [ ] Success → returns to view mode
- [ ] Updated data displayed immediately
- [ ] Optimistic update visible in list

---

### STEP 4: Relationships Tab

| Action | Expected |
|--------|----------|
| Click "Relationships" tab | Tab content switches |
| View content | Read-only relationship display |

**Relationships Content:**

1. **Principal Organization Section:**
   - [ ] Shows principal name
   - [ ] Organization type badge (Principal)
   - [ ] Clickable link to organization page
   - [ ] Organization icon

2. **Related Opportunities Section:**
   - [ ] Header "Related Opportunities"
   - [ ] If opportunities exist: Shows up to 5 with links
   - [ ] Each shows opportunity title and notes
   - [ ] Links navigate to opportunity detail
   - [ ] If none: "No opportunities linked to this product"

3. **Metadata Section:**
   - [ ] Created date (formatted)
   - [ ] Last updated date (formatted)
   - [ ] Relative time display (e.g., "3 days ago")

**Empty States:**
- [ ] "No opportunities" message styled appropriately
- [ ] Principal always shows (required field)

---

### STEP 5: Tab Navigation

| Action | Expected |
|--------|----------|
| Click Details tab | Details content shows |
| Click Relationships tab | Relationships content shows |
| Use arrow keys (when tabs focused) | Navigate between tabs |
| Tab key | Moves focus through content |

**Keyboard Navigation:**
- [ ] Tab order logical within SlideOver
- [ ] Can reach all interactive elements
- [ ] Focus visible on all elements
- [ ] ESC closes SlideOver

---

## WORKFLOW D: LIST & FILTERS

### Pre-Requisites
1. Have multiple products (5+) with various categories, statuses, and principals

---

### STEP 1: Column Display

| Column | Desktop (1440px+) | Tablet (768px-1439px) | Sortable? |
|--------|-------------------|----------------------|-----------|
| Product Name | Visible | Visible | Yes |
| Category | Visible (badge) | Visible | Yes |
| Status | Visible (semantic badge) | Visible | Yes |
| Principal | Visible | Hidden | Yes |

**Column Behavior:**
- [ ] Default sort by name (ascending)
- [ ] Click column header to sort
- [ ] Sort indicator visible (arrow)
- [ ] Click again reverses sort direction
- [ ] Resize browser to see responsive hiding

---

### STEP 2: Search & Text Filters

**Name Column Filter:**

| Action | Expected |
|--------|----------|
| Click filter icon on Name column | Text input expands/appears |
| Type "coffee" | Debounce (300ms) then filter applies |
| Observe results | Only products containing "coffee" shown |
| Clear filter | All products return |

**Filter Behavior:**
- [ ] Debounce prevents excessive API calls
- [ ] Case-insensitive search
- [ ] Partial match works
- [ ] Filter chip appears when active
- [ ] Clear button in filter input

---

### STEP 3: Checkbox Filters

**Category Filter:**

| Action | Expected |
|--------|----------|
| Click filter icon on Category column | Popover with checkboxes appears |
| See options | All distinct categories from database |
| Check "beverages" | Filter applies |
| Check additional category | OR logic (shows both) |
| Observe chip | "Category: beverages, dairy" |
| Uncheck all | Filter removed |

**Status Filter:**

| Action | Expected |
|--------|----------|
| Click filter icon on Status column | Popover with 3 checkboxes |
| Options | Active, Discontinued, Coming Soon |
| Check "Active" | Only active products shown |
| Check "Discontinued" | Active OR Discontinued shown |

**Multi-Filter Combination:**
- [ ] Multiple column filters work together (AND logic)
- [ ] Filter chips show all active filters
- [ ] "Clear all" removes all filters
- [ ] URL updates with filter params (optional)

---

### STEP 4: Principal Sidebar Filter

**Goal:** Test principal toggle filter in sidebar.

| Action | Expected |
|--------|----------|
| Locate principal filter section | In sidebar/filter panel |
| See toggle buttons | One per principal |
| Click principal name | Filters to that principal's products |
| Click another principal | Switches filter (single select) |
| Click active principal again | Removes filter |

**Principal Filter Checks:**
- [ ] All principals with products shown
- [ ] Toggle styling clear (active vs. inactive)
- [ ] Filter applies immediately
- [ ] Combines with column filters

---

### STEP 5: Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Down | Move to next row |
| Arrow Up | Move to previous row |
| Enter or Space | Open selected product (SlideOver) |
| ESC | Close SlideOver (if open) |
| Tab | Move through interactive elements |

**Keyboard Behavior:**
- [ ] Visual focus indicator on selected row
- [ ] Can navigate entire list with arrows
- [ ] Enter opens SlideOver for selected row
- [ ] Works when SlideOver closed
- [ ] Disabled when SlideOver open (focus trap)

---

### STEP 6: Empty State

| Condition | Expected |
|-----------|----------|
| No products exist | "No Products Yet" card |
| Card content | Helpful message + icon |
| Action button | "Add First Product" → Create form |
| With filters (no results) | "No products match filters" message |

---

### STEP 7: Pagination

| Condition | Expected |
|-----------|----------|
| 25+ products | Pagination controls appear |
| Per page | 25 items default |
| Page navigation | Previous/Next or page numbers |
| Page in URL | Optional query param |

---

## WORKFLOW E: DISTRIBUTION NETWORK SETUP

### Pre-Requisites
1. Have multiple Distributor-type organizations created
2. Create or edit a product

---

### STEP 1: Initial Distribution Tab State

| Element | Expected State |
|---------|----------------|
| Tab label | "Distribution" |
| Multi-select input | Empty, placeholder text visible |
| DOT# input fields | None visible |
| Helper text | Explains purpose of distribution setup |

---

### STEP 2: Distributor Selection Flow

**Adding First Distributor:**

| Action | Expected |
|--------|----------|
| Click distributor input | Dropdown opens |
| See options | Only Distributor-type organizations |
| Type to search | Filters by name |
| Select distributor | Chip added to input |
| Observe form | DOT# input field appears |
| Field label | Shows distributor name |

**Adding Multiple Distributors:**

| Action | Expected |
|--------|----------|
| Click input again | Dropdown shows remaining options |
| Select 2nd distributor | 2nd chip added |
| Observe form | 2nd DOT# field appears |
| Repeat for 3rd | 3rd chip and field |

**Field Organization:**
- [ ] DOT# fields stacked vertically
- [ ] Each labeled with distributor name
- [ ] Fields appear in selection order
- [ ] Input placeholders explain expected format

---

### STEP 3: DOT# Code Entry

| Distributor | Enter Value | Expected |
|-------------|-------------|----------|
| US Foods | USF-12345 | Accepted, no validation error |
| Sysco | SYS-67890 | Accepted |
| GFS | GFS001234 | Accepted |

**DOT# Validation:**
- [ ] Max 50 characters enforced
- [ ] Alphanumeric + hyphens accepted
- [ ] Spaces trimmed
- [ ] Optional field (can be empty)
- [ ] No special format enforcement (free text)

---

### STEP 4: Distributor Removal

| Action | Expected |
|--------|----------|
| Click X on distributor chip | Chip removed |
| Observe form | Corresponding DOT# field disappears |
| Entered DOT# value | Lost (not preserved) |
| Other distributors | Unaffected |

**Re-adding Same Distributor:**
- [ ] Can re-select previously removed distributor
- [ ] DOT# field appears fresh (empty)
- [ ] Previous value NOT restored

---

### STEP 5: Save Distribution Setup

| Action | Expected |
|--------|----------|
| Enter DOT# for all distributors | Values in all fields |
| Click Save | Form submits |
| Observe success | Product saved with distributor data |
| Re-open product | Distribution tab shows saved assignments |
| Check database | product_distributors junction populated |

**Persistence Verification:**
- [ ] All selected distributors saved
- [ ] DOT# values saved correctly
- [ ] Removing all distributors works
- [ ] Can add distributors to existing product

---

### STEP 6: Distribution in SlideOver

**Details Tab - View Mode:**
- [ ] "Distributor Codes" section visible (if any assigned)
- [ ] Grid layout (2 columns)
- [ ] Shows: Distributor Name | DOT# Value
- [ ] Section hidden if no distributors

**Example Display:**
```
Distributor Codes
─────────────────
US Foods    USF-12345
Sysco       SYS-67890
GFS         GFS001234
```

---

## WORKFLOW F: VALIDATION EDGE CASES

### TEXT FIELD LIMITS

| Field | Max Length | Test Input | Expected Result |
|-------|------------|------------|-----------------|
| name | 255 | 300 character string | Error or truncation |
| description | 2000 | 2100 character string | Error message displayed |
| category | 100 | 110 character custom category | Error message |
| vendor_item_number | 50 | 60 character code | Error message |

**Test Long Input:**
```
Generate test string: "A".repeat(256) for name field
```

---

### REQUIRED FIELD VALIDATION

| Field | Test | Expected Error |
|-------|------|----------------|
| name | Leave empty | "Product name is required" |
| name | Whitespace only "   " | "Product name is required" |
| principal_id | Skip selection | "Principal/Supplier is required" |
| category | Clear selection | "Category is required" |

**Validation Timing:**
- [ ] Errors show on blur (not on keystroke)
- [ ] Errors show on submit attempt
- [ ] Error clears when valid value entered
- [ ] First error field focused on submit

---

### FORMAT VALIDATION

| Field | Invalid Input | Expected |
|-------|---------------|----------|
| name | Leading/trailing spaces | Trimmed automatically |
| name | Multiple internal spaces | Preserved (or normalized) |
| description | HTML tags | Escaped or stripped |
| category | Leading/trailing spaces | Trimmed |

---

### SPECIAL CHARACTERS & INJECTION

| Input | Field | Expected Result |
|-------|-------|-----------------|
| `<script>alert('xss')</script>` | name | Escaped, stored as text |
| `<b>Bold</b>` | description | Tags stripped or escaped |
| `'; DROP TABLE products; --` | name | Stored safely (no SQL injection) |
| `SELECT * FROM users` | description | Stored as plain text |
| `javascript:alert(1)` | name | Stored as text |
| `🍕 Pizza Supreme 🍕` | name | Emoji preserved |
| `Café & Bakery` | name | Special chars preserved |
| `日本語の製品` | name | Unicode preserved |
| `Product\nWith\nNewlines` | name | Newlines handled |

---

### PRINCIPAL VALIDATION

| Scenario | Test | Expected |
|----------|------|----------|
| No principals exist | Open category dropdown | Empty state message |
| Principal deleted | Edit product with orphan ref | Error or cleared |
| Same principal twice | N/A (single select) | Cannot select twice |

---

### CATEGORY EDGE CASES

| Scenario | Test | Expected |
|----------|------|----------|
| Empty custom category | Type nothing, try create | Prevented |
| Very long custom category | 101+ characters | Error message |
| Duplicate custom category | Create same as existing | Allowed (or deduplicated) |
| Custom with only spaces | "   " | Prevented or trimmed to empty |

---

### DISTRIBUTOR EDGE CASES

| Scenario | Test | Expected |
|----------|------|----------|
| No distributors exist | Open Distribution tab | Empty state, no options |
| Select same distributor twice | N/A (multi-select removes selected) | Cannot select already selected |
| Remove all distributors | Delete all chips | Valid, saves with no distributors |
| 50+ distributors | Select many | Performance acceptable |

---

### FORM STATE PRESERVATION

| Scenario | Test | Expected |
|----------|------|----------|
| Fill form, navigate away | Click sidebar link | "Unsaved changes" warning |
| Dismiss warning, stay | Click "Stay" | Form data preserved |
| Accept warning, leave | Click "Leave" | Data lost, navigation occurs |
| Fill form, refresh page | F5 or Cmd+R | Data lost (no localStorage) |
| Error on submit | Fix error | Other fields preserved |
| Network failure | Submit without internet | Error message, data preserved |

---

## WORKFLOW G: CROSS-ENTITY RELATIONSHIPS

### PRINCIPAL RELATIONSHIP

**From Product → Principal:**

| Action | Expected |
|--------|----------|
| Open product SlideOver | Details show Principal name |
| Click Principal link | Navigates to Organization page |
| View Organization | Product should appear in related products (if implemented) |

**Principal Change Impact:**

| Action | Expected |
|--------|----------|
| Edit product, change Principal | Old principal loses product |
| Save change | Product appears under new principal |
| Filter by old principal | Product no longer shown |
| Filter by new principal | Product now shown |

---

### OPPORTUNITY RELATIONSHIP

**Prerequisites:** Link product to an opportunity

**Adding Product to Opportunity:**

| Action | Expected |
|--------|----------|
| Navigate to Opportunity | Edit form |
| Find Products section | Multi-select for products |
| Select this product | Added to opportunity |
| Save Opportunity | Junction record created |

**Viewing Relationship from Product:**

| Action | Expected |
|--------|----------|
| Open product SlideOver | Go to Relationships tab |
| View Related Opportunities | Opportunity appears in list |
| Click opportunity link | Navigates to opportunity |

**Delete Constraints:**

| Scenario | Expected |
|----------|----------|
| Delete product with opportunities | Warning shown? Delete blocked? |
| Delete opportunity | Product remains unaffected |
| Soft delete product | Opportunity still references? |

---

### DISTRIBUTOR RELATIONSHIP

**From Product → Distributors:**

| Action | Expected |
|--------|----------|
| View product with distributors | Shows in Distribution tab |
| Distributor names | Link to organization (or plain text) |
| DOT# codes | Displayed per distributor |

**Distributor Deletion:**

| Scenario | Expected |
|----------|----------|
| Delete distributor organization | Product loses that distributor assignment |
| Edit product after deletion | Deleted distributor not shown |
| DOT# code for deleted distributor | Lost (cascade delete) |

---

## ISSUE REPORTING TEMPLATE

Use this template when documenting issues found during testing:

```markdown
### Issue: [Short Descriptive Title]

**Location:** [Products / Create Form / Distribution Tab / DOT# Input]
**Severity:** Critical | High | Medium | Low
**Type:** Bug | UX Issue | Missing Feature | Accessibility | Performance

**Steps to Reproduce:**
1. Navigate to Products → Create
2. Fill required fields
3. Go to Distribution tab
4. Select 3 distributors
5. [Describe triggering action]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Browser/Device:** [Chrome 120 / macOS 14 / 1440px viewport]

**Screenshot/Recording:** [Attach if applicable]

**Console Errors:** [Paste any JS errors]

**Suggested Fix:** [Optional - your recommendation]
```

---

## UX IMPROVEMENT CHECKLIST

Use this checklist to identify potential UX improvements:

### Form Design
- [ ] Required fields clearly marked with asterisk or "(required)" label
- [ ] Fields grouped logically (Details vs. Distribution)
- [ ] Tab labels descriptive
- [ ] Principal selection prominent (core relationship)
- [ ] Category dropdown shows all options without scrolling

### Guidance & Help
- [ ] Placeholder text in all inputs
- [ ] Helper text explains DOT# codes purpose
- [ ] Category creation prompt clear
- [ ] Character limits shown for text fields
- [ ] Examples for DOT# format provided

### Error Handling
- [ ] Errors appear next to relevant field
- [ ] Error messages are specific and actionable
- [ ] Form data preserved on error
- [ ] First error focused on submit
- [ ] Network error has retry option

### SlideOver Experience
- [ ] Tab icons intuitive
- [ ] Edit toggle clearly visible
- [ ] Save/Cancel buttons prominent in edit mode
- [ ] Close button accessible (X)
- [ ] Relationship links work correctly

### Performance
- [ ] Principal autocomplete loads < 500ms
- [ ] Category dropdown instant
- [ ] Distributor multi-select responsive
- [ ] Form submission < 2 seconds
- [ ] SlideOver animation smooth

### Accessibility
- [ ] Full keyboard navigation possible
- [ ] Tab order logical
- [ ] Focus states visible
- [ ] Touch targets ≥ 44x44px
- [ ] Screen reader announcements for errors
- [ ] ARIA attributes on form elements

---

## SUGGESTED UX IMPROVEMENTS

### High Priority

**1. DOT# Code Guidance**
- **Problem:** Users may not understand what vendor item numbers are
- **Current:** No explanation in UI
- **Suggested:** Add tooltip or help text: "Vendor Item Numbers (DOT#) are codes used by distributors to identify products in their ordering systems. Example: USF-12345"

**2. Principal Selection Clarity**
- **Problem:** May be unclear that only Principal-type organizations appear
- **Current:** Autocomplete with filtered results
- **Suggested:** Add subtitle "Only Principal/Manufacturer organizations shown"

**3. Custom Category Confirmation**
- **Problem:** Users may accidentally create typo categories
- **Current:** Creates on selection
- **Suggested:** Show confirmation before creating: "Create new category 'spceialty_sauces'?"

### Medium Priority

**4. Distribution Tab Empty State**
- **Problem:** Tab may seem broken if no distributors in system
- **Current:** Empty dropdown
- **Suggested:** Show message: "No distributors available. Create distributor organizations first."

**5. Relationship Tab Loading**
- **Problem:** May be slow if many opportunities
- **Current:** Fetches on tab click
- **Suggested:** Add loading skeleton or prefetch on SlideOver open

### Nice to Have

**6. DOT# Code Format Hints**
- **Problem:** Users don't know expected format
- **Current:** Free text input
- **Suggested:** Show placeholder per distributor type: "e.g., USF-12345"

**7. Batch Distributor Assignment**
- **Problem:** Adding many distributors is repetitive
- **Current:** One-by-one selection
- **Suggested:** "Select All" or import from spreadsheet

---

## TESTING RESULTS TEMPLATE

Use this format for documenting individual test results:

```markdown
### Test: [Test Name]
**Workflow:** [A/B/C/D/E/F/G]
**Form:** [Create / Edit / SlideOver / List]
**Field:** [Field name or N/A]

| Test Case | Input | Expected | Actual | Pass/Fail |
|-----------|-------|----------|--------|-----------|
| [Scenario 1] | [Value] | [Behavior] | [Result] | ✅/❌ |
| [Scenario 2] | [Value] | [Behavior] | [Result] | ✅/❌ |

**Notes:** [Any observations]
```

---

## COMPLETION CHECKLIST

Track your testing progress:

### Workflow A: Product Create Form
- [ ] Product Details Tab - all fields
- [ ] Principal autocomplete filtering
- [ ] Category dropdown (predefined)
- [ ] Custom category creation
- [ ] Status default behavior
- [ ] Distribution Tab - distributor selection
- [ ] Distribution Tab - DOT# entry
- [ ] Form submission and redirect
- [ ] New product verification

### Workflow B: Full Page Edit
- [ ] Navigate to edit
- [ ] Pre-population verification
- [ ] Field changes save correctly
- [ ] Cache invalidation
- [ ] Delete flow with confirmation

### Workflow C: SlideOver Quick View/Edit
- [ ] Open from list click
- [ ] Details Tab - View Mode
- [ ] Details Tab - Edit Mode toggle
- [ ] Edit Mode save and cancel
- [ ] Relationships Tab - Principal
- [ ] Relationships Tab - Opportunities
- [ ] Tab keyboard navigation
- [ ] SlideOver close methods (X, ESC, outside click)

### Workflow D: List & Filters
- [ ] Column display (desktop vs. tablet)
- [ ] Column sorting
- [ ] Name text filter (debounce)
- [ ] Category checkbox filter
- [ ] Status checkbox filter
- [ ] Principal sidebar filter
- [ ] Combined filters
- [ ] Keyboard navigation
- [ ] Empty state
- [ ] Pagination (if applicable)

### Workflow E: Distribution Network Setup
- [ ] Initial empty state
- [ ] Add first distributor
- [ ] DOT# field appears
- [ ] Add multiple distributors
- [ ] Enter DOT# codes
- [ ] Remove distributor
- [ ] Save and verify persistence
- [ ] View in SlideOver

### Workflow F: Validation Edge Cases
- [ ] Text field max lengths
- [ ] Required field errors
- [ ] Format validation
- [ ] Special characters & injection
- [ ] Principal edge cases
- [ ] Category edge cases
- [ ] Distributor edge cases
- [ ] Form state preservation

### Workflow G: Cross-Entity Relationships
- [ ] Product → Principal link
- [ ] Principal change impact
- [ ] Product → Opportunity link
- [ ] Opportunity → Product (adding)
- [ ] Delete constraints
- [ ] Product → Distributors display

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Author:** QA Team / Generated for Crispy CRM
