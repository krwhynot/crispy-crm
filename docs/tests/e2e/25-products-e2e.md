# Products Module E2E Test Checklist

Manual E2E testing checklist for the Products module. Tests cover CRUD operations, principal-scoped product management, click-to-filter badges, and slide-over functionality.

## Test Environment Setup

- **Browser:** Chrome (with DevTools open)
- **URL:** http://localhost:5173
- **Credentials:** admin@test.com / password123
- **Prerequisite:** Seed data loaded (`just seed-e2e`)
- **Required Seed Data:** At least one Principal-type organization

---

## Section 1: CRUD Operations

### Test 1.1: Navigate to Products List

**Objective:** Verify Products list page loads correctly.

**Steps:**
1. Log in with admin credentials
2. Navigate to `/#/products` via sidebar or URL

**Expected Results:**
- [ ] Products list page loads within 5 seconds
- [ ] Datagrid displays with columns: Name, Category, Status, Principal, Certifications
- [ ] No console errors (red text in Console tab)
- [ ] Floating create button visible in bottom-right

---

### Test 1.2: Create Product - Minimal Required Fields

**Objective:** Create a product with only required fields.

**Test Data:**
- Name: `Test Product 2025-12-31-143022` (use current timestamp)
- Principal: Select any Principal organization from seed data
- Category: `Beverages` (default)
- Status: `Active` (default)

**Steps:**
1. Navigate to `/#/products`
2. Click floating create button (or navigate to `/#/products/create`)
3. Wait for create form to load
4. Fill in Product Name field
5. Click Principal/Supplier autocomplete
   - Type first few letters of a Principal name
   - Select from dropdown
6. Leave Category as default (`Beverages`)
7. Leave Status as default (`Active`)
8. Click "Save & Close"

**Expected Results:**
- [ ] Form accepts required fields
- [ ] Redirects to product show page after save
- [ ] No RLS errors in console
- [ ] No React errors in console
- [ ] Product appears in list with correct data

---

### Test 1.3: Create Product - All Details Tab Fields

**Objective:** Create a product with all fields in Details tab.

**Test Data:**
- Name: `Full Product 2025-12-31-143022`
- Principal: Select any Principal organization
- Category: `Frozen` (select from dropdown)
- Status: `Coming Soon` (select from dropdown)
- Description: `Test product description for E2E testing purposes.`

**Steps:**
1. Navigate to `/#/products/create`
2. Stay on "Product Details" tab
3. Fill in all fields:
   - Name: Enter product name
   - Principal/Supplier: Select from autocomplete
   - Category: Select "Frozen" from dropdown
   - Status: Select "Coming Soon" from dropdown
   - Description: Enter description text
4. Click "Save & Close"

**Expected Results:**
- [ ] All fields accept input correctly
- [ ] Category dropdown shows formatted options (e.g., "Fresh Produce" not "fresh_produce")
- [ ] Status dropdown shows "Coming Soon" not "coming_soon"
- [ ] Product saves successfully
- [ ] Redirects to show page
- [ ] No console errors

---

### Test 1.4: Create Product - Custom Category

**Objective:** Verify custom category creation via autocomplete.

**Test Data:**
- Name: `Custom Category Product 2025-12-31-143022`
- Principal: Select any Principal organization
- Category: `specialty_items` (type custom value)

**Steps:**
1. Navigate to `/#/products/create`
2. Fill in Name
3. Select Principal
4. In Category autocomplete:
   - Type `specialty_items`
   - Look for "Add custom category: specialty_items" option
   - Click to create custom category
5. Click "Save & Close"

**Expected Results:**
- [ ] Custom category input is accepted
- [ ] "Add custom category" option appears when typing non-existing category
- [ ] Product saves with custom category
- [ ] No validation errors

---

### Test 1.5: Read Product via Slide-Over

**Objective:** Verify product details display in slide-over panel.

**Steps:**
1. Navigate to `/#/products`
2. Click on any product row in the datagrid
3. Wait for slide-over panel to open

**Expected Results:**
- [ ] Slide-over opens from right (40vw width)
- [ ] URL updates to include `?view=[product_id]`
- [ ] Two tabs visible: "Details" and "Relationships"
- [ ] Product name displays in header
- [ ] Details tab shows: Name, Principal, Category, Status, Description
- [ ] Mode toggle button visible (View/Edit)
- [ ] Close button (X) functional

---

### Test 1.6: Update Product via Slide-Over Edit Mode

**Objective:** Edit product using slide-over edit mode.

**Steps:**
1. Open any product in slide-over (click row)
2. Click mode toggle button to switch to Edit mode
3. Modify Description field: Add ` - Updated via E2E test`
4. Click Save button

**Expected Results:**
- [ ] Edit mode shows form inputs
- [ ] Description field is editable
- [ ] Save button is enabled after changes
- [ ] Changes save successfully
- [ ] Slide-over returns to view mode
- [ ] Updated description visible
- [ ] No console errors

---

### Test 1.7: Update Product via Edit Page

**Objective:** Edit product using full edit page.

**Steps:**
1. Navigate to `/#/products`
2. Navigate to `/#/products/[product_id]/edit` (or use edit action)
3. Change Status from "Active" to "Discontinued"
4. Click "Save Changes"

**Expected Results:**
- [ ] Edit page loads with current product data
- [ ] Form displays two tabs: "Product Details" and "Distribution"
- [ ] Status dropdown allows selection change
- [ ] Save button is visible and functional
- [ ] Redirects to show page after save
- [ ] Status badge shows "Discontinued" (with destructive styling)
- [ ] No console errors

---

### Test 1.8: Delete Product

**Objective:** Verify product deletion via edit page.

**Steps:**
1. Create a test product (or use existing test product)
2. Navigate to product's edit page
3. Click Delete button (bottom-left)
4. Confirm deletion in dialog (if prompted)

**Expected Results:**
- [ ] Delete button visible on edit page
- [ ] Confirmation dialog appears (if implemented)
- [ ] Product is removed after deletion
- [ ] Redirects to products list
- [ ] Deleted product no longer appears in list
- [ ] No console errors

---

## Section 2: Principal Scoping Tests

### Test 2.1: Principal Field Required

**Objective:** Verify Principal/Supplier is a required field.

**Steps:**
1. Navigate to `/#/products/create`
2. Fill in Name only: `Principal Test 2025-12-31-143022`
3. Leave Principal/Supplier empty
4. Attempt to submit form

**Expected Results:**
- [ ] Form prevents submission with empty Principal
- [ ] Validation message appears for Principal field
- [ ] Form stays on create page

---

### Test 2.2: Principal Autocomplete Filters to Principals Only

**Objective:** Verify autocomplete only shows Principal-type organizations.

**Steps:**
1. Navigate to `/#/products/create`
2. Click Principal/Supplier autocomplete
3. Type a few letters (e.g., "test")
4. Review dropdown results

**Expected Results:**
- [ ] Only organizations with type "Principal" appear
- [ ] Customer/Distributor organizations do NOT appear
- [ ] Dropdown shows organization names clearly

---

### Test 2.3: Principal Link in Slide-Over

**Objective:** Verify Principal reference is clickable in slide-over.

**Steps:**
1. Open a product with an assigned Principal
2. View Details tab in slide-over
3. Look for Principal/Supplier field

**Expected Results:**
- [ ] Principal name is displayed
- [ ] Principal name may be a clickable link (if implemented)
- [ ] No console errors when viewing

---

## Section 3: Click-to-Filter Badge Tests

### Test 3.1: Category Badge Click-to-Filter

**Objective:** Verify clicking category badge filters the list.

**Steps:**
1. Navigate to `/#/products`
2. Identify a product with category badge (e.g., "Beverages")
3. Click on the category badge in the datagrid

**Expected Results:**
- [ ] List filters to show only products with that category
- [ ] URL updates with filter parameter
- [ ] Filter is visible in filter UI (if filter sidebar present)
- [ ] Clicking badge again may toggle filter off

---

### Test 3.2: Status Badge Click-to-Filter

**Objective:** Verify clicking status badge filters the list.

**Steps:**
1. Navigate to `/#/products`
2. Identify a product with "Active" status badge
3. Click on the status badge

**Expected Results:**
- [ ] List filters to show only "Active" products
- [ ] URL updates with filter parameter
- [ ] Other status products are filtered out

---

### Test 3.3: Multiple Badge Filters

**Objective:** Verify multiple filters can be combined.

**Steps:**
1. Click on a Category badge to filter
2. Then click on a Status badge to add second filter

**Expected Results:**
- [ ] Both filters are applied
- [ ] List shows products matching BOTH filters
- [ ] URL contains both filter parameters
- [ ] Filters can be cleared to show all products

---

## Section 4: Relationships Tab Tests

### Test 4.1: Relationships Tab - No Opportunities

**Objective:** Verify empty state when product has no linked opportunities.

**Steps:**
1. Create a new product (or find one without opportunities)
2. Open product in slide-over
3. Click "Relationships" tab

**Expected Results:**
- [ ] Tab displays "Related Opportunities" section
- [ ] Empty state message: "No opportunities using this product yet."
- [ ] Metadata section shows Created/Updated dates
- [ ] Principal/Supplier section shows linked principal

---

### Test 4.2: Relationships Tab - With Opportunities

**Objective:** Verify opportunities display when product is linked.

**Prerequisite:** Need a product linked to opportunities via `opportunity_products` table.

**Steps:**
1. Find a product that is used in opportunities
2. Open product in slide-over
3. Click "Relationships" tab

**Expected Results:**
- [ ] Related Opportunities section shows linked opportunities
- [ ] Each opportunity shows title
- [ ] Opportunity titles are clickable links (navigate to opportunity)
- [ ] Notes display if present on opportunity_product record

---

### Test 4.3: Relationships Tab Read-Only

**Objective:** Verify Relationships tab is read-only in both modes.

**Steps:**
1. Open product in slide-over (View mode)
2. Switch to Relationships tab
3. Toggle to Edit mode
4. Switch back to Relationships tab

**Expected Results:**
- [ ] Relationships tab shows same read-only content in both modes
- [ ] No edit controls on Relationships tab
- [ ] Content is informational only

---

## Section 5: Column Visibility Tests

### Test 5.1: Desktop View Columns (1440px+)

**Objective:** Verify all columns visible on desktop.

**Steps:**
1. Set browser width to 1440px or wider
2. Navigate to `/#/products`
3. Observe datagrid columns

**Expected Results:**
- [ ] Column 1: Name (always visible)
- [ ] Column 2: Category badge (always visible)
- [ ] Column 3: Status badge (always visible)
- [ ] Column 4: Principal (desktop only)
- [ ] Column 5: Certifications (desktop only)
- [ ] All columns render without horizontal scroll

---

### Test 5.2: Tablet View Columns (768px-1024px)

**Objective:** Verify column hiding on tablet viewport.

**Steps:**
1. Set browser width to 1024px (iPad landscape)
2. Navigate to `/#/products`
3. Observe datagrid columns

**Expected Results:**
- [ ] Name column visible
- [ ] Category column visible
- [ ] Status column visible
- [ ] Principal column hidden (desktopOnly)
- [ ] Certifications column hidden (desktopOnly)
- [ ] No horizontal scrolling required

---

### Test 5.3: Mobile View Behavior (Below 768px)

**Objective:** Verify responsive behavior on narrow viewports.

**Steps:**
1. Set browser width to 375px (mobile)
2. Navigate to `/#/products`
3. Observe list layout

**Expected Results:**
- [ ] Essential columns remain visible
- [ ] Layout adapts to narrow screen
- [ ] Touch targets remain accessible (44px minimum)
- [ ] No console errors

---

## Section 6: Validation Edge Cases

### Test 6.1: Empty Name Field

**Objective:** Verify name field validation.

**Steps:**
1. Navigate to `/#/products/create`
2. Leave Name field empty
3. Fill in Principal
4. Attempt to submit

**Expected Results:**
- [ ] Form prevents submission
- [ ] Name field shows validation error
- [ ] Error message indicates name is required

---

### Test 6.2: Name Length Limit (255 characters)

**Objective:** Verify name field has max length enforcement.

**Steps:**
1. Navigate to `/#/products/create`
2. Enter a name with 256+ characters
3. Fill in Principal
4. Attempt to submit

**Expected Results:**
- [ ] Either input is truncated to 255 chars, OR
- [ ] Validation error shown for name too long
- [ ] Form does not submit with oversized name

---

### Test 6.3: Description Length Limit (2000 characters)

**Objective:** Verify description field has max length enforcement.

**Steps:**
1. Navigate to `/#/products/create`
2. Fill in Name and Principal
3. Enter description with 2000+ characters
4. Attempt to submit

**Expected Results:**
- [ ] Either input is truncated, OR
- [ ] Validation error shown for description too long
- [ ] Error message clear about character limit

---

### Test 6.4: Status Transitions

**Objective:** Verify status can be changed through lifecycle.

**Steps:**
1. Create product with status "Coming Soon"
2. Edit product, change status to "Active"
3. Save and verify
4. Edit product, change status to "Discontinued"
5. Save and verify

**Expected Results:**
- [ ] Status: Coming Soon -> Active works
- [ ] Status: Active -> Discontinued works
- [ ] Badge styling updates appropriately:
  - Coming Soon: secondary variant
  - Active: default variant
  - Discontinued: destructive variant

---

### Test 6.5: Whitespace Handling in Name

**Objective:** Verify leading/trailing whitespace is trimmed.

**Steps:**
1. Navigate to `/#/products/create`
2. Enter Name with spaces: `  Whitespace Test  `
3. Fill in Principal
4. Submit form

**Expected Results:**
- [ ] Form submits successfully
- [ ] Product name is saved without leading/trailing spaces
- [ ] Product name displays as "Whitespace Test"

---

## Section 7: Viewport Testing Summary

### Desktop (1440px+)

| Feature | Expected |
|---------|----------|
| List columns | All 5 columns visible |
| Slide-over width | 40vw (576-720px) |
| Create form | Full width with sidebar space |
| Touch targets | N/A (mouse-primary) |

### iPad Landscape (1024px)

| Feature | Expected |
|---------|----------|
| List columns | 3 columns (Name, Category, Status) |
| Slide-over width | 40vw (min 480px) |
| Create form | Adapts to available width |
| Touch targets | 44x44px minimum |

### iPad Portrait (768px)

| Feature | Expected |
|---------|----------|
| List columns | 3 columns minimum |
| Slide-over | May be full-width |
| Create form | Single column layout |
| Touch targets | 44x44px minimum |

---

## Section 8: Console Monitoring Checklist

Monitor browser console throughout all tests for:

**RLS (Row Level Security) Errors:**
- [ ] No "permission denied" errors
- [ ] No "42501" PostgreSQL errors
- [ ] No "row-level security" violations

**React Errors:**
- [ ] No "Uncaught" exceptions
- [ ] No React hook violations
- [ ] No "Maximum update depth exceeded"
- [ ] No "Cannot update a component while rendering"

**Network Errors:**
- [ ] No 500 status codes
- [ ] No 403 forbidden responses
- [ ] No 401 unauthorized (after login)
- [ ] No failed Supabase requests

**Warnings (acceptable but note):**
- [ ] ResizeObserver warnings (known browser quirk)
- [ ] React Admin warnings (informational)

---

## Section 9: Form Tab Navigation Tests

### Test 9.1: Tab Switching on Create Form

**Objective:** Verify tab navigation between Details and Distribution tabs.

**Steps:**
1. Navigate to `/#/products/create`
2. Fill in some fields on "Product Details" tab
3. Click "Distribution" tab
4. Click back to "Product Details" tab

**Expected Results:**
- [ ] Tab content switches correctly
- [ ] Previously entered data persists when switching tabs
- [ ] No console errors during tab switch
- [ ] Active tab is visually indicated

---

### Test 9.2: Tab Switching on Slide-Over

**Objective:** Verify tab navigation in slide-over panel.

**Steps:**
1. Open any product in slide-over
2. Switch between "Details" and "Relationships" tabs
3. Switch to Edit mode
4. Switch between tabs

**Expected Results:**
- [ ] Tab icons display correctly (Package, Link2)
- [ ] Tab content updates on switch
- [ ] Edit mode persists across tab switches
- [ ] No data loss when switching tabs

---

## Pass Criteria

**All tests must pass** for the Products module to be considered production-ready.

### Critical Tests (Must Pass):
1. [ ] Test 1.2: Create Product - Minimal Required Fields
2. [ ] Test 1.5: Read Product via Slide-Over
3. [ ] Test 1.6: Update Product via Slide-Over Edit Mode
4. [ ] Test 2.1: Principal Field Required
5. [ ] Test 3.1: Category Badge Click-to-Filter
6. [ ] Test 5.1: Desktop View Columns

### Important Tests:
- All validation tests (Section 6)
- All viewport tests (Section 7)
- No console errors in any test

### If Any Test Fails:
1. Note the specific test number and failure
2. Capture screenshot
3. Copy relevant console errors
4. Document steps to reproduce
5. Report to development team

---

## Notes

### Timestamp Test Data
Always use timestamps in test data for uniqueness:
- Format: `YYYY-MM-DD-HHmmss`
- Example: `Test Product 2025-12-31-143022`

### Seed Data Requirements
Tests require:
- At least 1 Principal-type organization
- Admin user (admin@test.com)
- Run `just seed-e2e` before testing

### Form Navigation Patterns

**Tabbed Forms:**
- ProductCreate/Edit: "Product Details", "Distribution"
- ProductSlideOver: "Details", "Relationships"

**Autocomplete Interactions (shadcn/ui):**
- Click trigger to open dropdown
- Type to filter options
- Click option to select
- For custom categories, type and select "Add custom category" option

### Test Duration
Estimated time: 45-60 minutes for complete checklist

### Related Tests
- See `04-form-tests.md` for general form testing patterns
- See `01-smoke-tests.md` for application-level smoke tests
