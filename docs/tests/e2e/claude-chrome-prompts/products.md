# E2E Field Validation Test: Products (Principal Products)

**URL:** http://localhost:5173/#/products
**Goal:** Verify all Product data fields display, accept input, validate, and persist correctly.

## Pre-Test Setup

1. Ensure dev server is running (`just dev`)
2. Confirm test data exists (`just seed-e2e` if needed)
3. Ensure at least one Principal organization exists (products require a principal)

---

## Test Sequence

### Phase 1: Product List Validation

- [ ] Navigate to http://localhost:5173/#/products
- [ ] Verify columns display: Name, Principal, Category, Status
- [ ] Check no "undefined", "null", or empty cells where data should exist
- [ ] Test text filter (search by name)
- [ ] Test principal filter dropdown
- [ ] Test category filter dropdown
- [ ] Test status filter (active, discontinued, coming_soon)
- [ ] Verify sorting on Name column
- [ ] Confirm row click opens detail/edit view
- [ ] Screenshot any display issues

### Phase 2: Create Product Form

- [ ] Click "Create" button
- [ ] Test each field:

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Name | empty, >255 chars | "Premium Coffee Blend" | **REQUIRED**, max length enforced |
| Principal/Supplier | empty | Select principal org | **REQUIRED** - only shows orgs with type="principal" |
| Category | empty, >100 chars | "beverages" | **REQUIRED**, max length enforced |
| Status | - | Select "active" | Default "active", dropdown: active, discontinued, coming_soon |
| Description | >2000 chars | "A rich, full-bodied..." | Max length enforced |
| Certifications | - | Add multiple | Array of strings, max 50 items, max 100 chars each |
| Allergens | - | Add multiple | Array of strings, max 50 items, max 100 chars each |
| Ingredients | >5000 chars | "Water, coffee beans..." | Max length enforced |
| Nutritional Info | - | Add key-value pairs | Record<string, string|number> |
| Marketing Description | >2000 chars | "Perfect for..." | Max length enforced |

**Distributor Assignment Fields:**
| Field | Test | Expected Behavior |
|-------|------|-------------------|
| distributor_ids | Multi-select distributors | Array of distributor org IDs |
| product_distributors | Vendor item numbers | Record<distributor_id, { vendor_item_number }> |

- [ ] Submit empty form - verify required field errors
- [ ] Verify error styling: red border, error text visible
- [ ] Verify `aria-invalid="true"` on invalid fields
- [ ] Fill all required fields and submit
- [ ] Confirm redirect and new product appears in list

### Phase 3: Edit Product Form

- [ ] Open existing product from list
- [ ] Verify all fields pre-populated correctly
- [ ] Test edit scenarios:
  - [ ] Change name -> Save -> Reload -> Verify persisted
  - [ ] Change status to "discontinued" -> Save -> Verify
  - [ ] Change category -> Save -> Verify
  - [ ] Add certification -> Save -> Verify array updated
  - [ ] Remove allergen -> Save -> Verify array updated
  - [ ] Add distributor assignment with vendor item number -> Verify persisted
- [ ] Test Cancel button doesn't save changes

### Phase 4: Product Detail View

- [ ] Click product to open detail view
- [ ] Verify displays:
  - [ ] Product name
  - [ ] Principal name (linked)
  - [ ] Category badge
  - [ ] Status badge
  - [ ] Description
- [ ] Check certifications display as tags/chips
- [ ] Check allergens display (important for F&B)
- [ ] Verify distributor assignments show:
  - [ ] Distributor names
  - [ ] Vendor item numbers

### Phase 5: Accessibility Audit

- [ ] Tab through form - all fields reachable
- [ ] Focus states visible on all inputs
- [ ] Array fields (certifications, allergens) keyboard accessible
- [ ] Add/remove buttons have proper ARIA labels
- [ ] Error messages have role="alert"
- [ ] Distributor multi-select accessible

### Phase 6: Edge Cases

- [ ] Create product with minimum required fields only (name, principal_id, category)
- [ ] Create product with all fields filled
- [ ] Test each status value:
  - [ ] active (default)
  - [ ] discontinued
  - [ ] coming_soon
- [ ] Test each category value:
  - [ ] beverages, dairy, frozen, fresh_produce
  - [ ] meat_poultry, seafood, dry_goods, snacks
  - [ ] condiments, baking_supplies, spices_seasonings
  - [ ] canned_goods, pasta_grains, oils_vinegars, sweeteners, other
- [ ] Test custom category (not in predefined list)
- [ ] Test max certifications (50 items)
- [ ] Test max allergens (50 items)
- [ ] Test nutritional info with mixed string/number values

---

## Expected Product Fields (from Zod Schema)

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| name | string | YES | min 1, max 255 |
| principal_id | number | YES | positive integer, FK to orgs with type="principal" |
| category | string | YES | min 1, max 100, default "beverages" |
| status | enum | NO | active (default), discontinued, coming_soon |
| description | text | NO | max 2000 |
| certifications | string[] | NO | max 50 items, max 100 chars each |
| allergens | string[] | NO | max 50 items, max 100 chars each |
| ingredients | text | NO | max 5000 |
| nutritional_info | Record | NO | keys max 50, values max 100 (string or number) |
| marketing_description | text | NO | max 2000 |
| distributor_ids | number[] | NO | array of distributor org IDs |
| product_distributors | Record | NO | { distributor_id: { vendor_item_number: string } } |

---

## F&B Product Categories

| Category ID | Display Name |
|------------|--------------|
| beverages | Beverages |
| dairy | Dairy |
| frozen | Frozen |
| fresh_produce | Fresh Produce |
| meat_poultry | Meat & Poultry |
| seafood | Seafood |
| dry_goods | Dry Goods |
| snacks | Snacks |
| condiments | Condiments |
| baking_supplies | Baking Supplies |
| spices_seasonings | Spices & Seasonings |
| canned_goods | Canned Goods |
| pasta_grains | Pasta & Grains |
| oils_vinegars | Oils & Vinegars |
| sweeteners | Sweeteners |
| other | Other |

---

## Report Issues As

```
**Field:** principal_id
**Issue:** Dropdown shows all organizations, not just principals
**Expected:** Only organizations with type="principal" should appear
**Actual:** Shows customers, prospects, distributors too
**Severity:** High - wrong data associations possible
```

---

## Success Criteria

- [ ] Name, principal_id, category enforce required validation
- [ ] Principal dropdown only shows principal-type organizations
- [ ] Category accepts both predefined and custom values
- [ ] Status transitions work correctly
- [ ] Array fields (certifications, allergens) support add/remove
- [ ] Distributor assignments with vendor item numbers save correctly
- [ ] All fields save and persist correctly
- [ ] No console errors during testing
