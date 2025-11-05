# Implementation Tasks: Import/Export Module Completion

**Created:** 2025-11-05
**Total Estimate:** 7-8 days
**Dependencies:** Most tasks can run in parallel

---

## Task Breakdown

### Phase 1: Opportunities Import
**Estimate:** 3 days
**Dependencies:** None (copy from Contacts pattern)
**Assignable to:** Frontend developer

#### Task 1.1: Create Column Aliases File
- [ ] Create `src/atomic-crm/opportunities/opportunityColumnAliases.ts`
- [ ] Define aliases for:
  - name (Opportunity Name, Name, Deal Name, etc.)
  - organization (Customer Organization, Company, etc.)
  - principal (Principal, Brand, Manufacturer, etc.)
  - stage (Stage, Pipeline Stage, Sales Stage, etc.)
  - status (Status, Opportunity Status, etc.)
  - expected_close_date (Expected Close Date, Close Date, etc.)
  - account_manager (Account Manager, Sales Rep, Owner, etc.)
  - description (Description, Notes, Comments, etc.)
  - value (Value, Amount, Deal Value, etc.)
- [ ] **Verification:** Aliases match common CSV column names

#### Task 1.2: Create Import Dialog Component
- [ ] Create `src/atomic-crm/opportunities/OpportunityImportDialog.tsx`
- [ ] Copy structure from `ContactImportDialog.tsx` (691 lines)
- [ ] Adapt for opportunities:
  - File upload (drag-and-drop or picker)
  - CSV parsing with Papa Parse
  - Column detection
  - State management (idle/parsing/mapping/previewing/importing/complete)
- [ ] **Verification:** Dialog opens, file upload works

#### Task 1.3: Create Import Preview Component
- [ ] Create `src/atomic-crm/opportunities/OpportunityImportPreview.tsx`
- [ ] Copy structure from `ContactImportPreview.tsx` (862 lines)
- [ ] Adapt for opportunities:
  - Column mapping UI with dropdowns
  - Auto-match using aliases
  - Preview first 10 rows
  - Validation preview with error highlighting
- [ ] **Verification:** Column mapping UI works, auto-matching correct

#### Task 1.4: Implement Validation Logic
- [ ] Add validation for required fields:
  - Name (required, max 200 chars)
  - Organization (required, must exist in database)
  - Principal (required, must exist in database)
  - Stage (required, must match enum)
  - Status (required, must match enum)
- [ ] Add validation for optional fields:
  - Expected Close Date (valid date format)
  - Account Manager (lookup by email/name, fallback to current user)
  - Value (numeric, positive)
- [ ] Highlight validation errors in preview
- [ ] **Verification:** All validation rules working

#### Task 1.5: Implement Lookup Caching
- [ ] Cache principals at import start
- [ ] Cache organizations (reuse from Contacts/Organizations)
- [ ] Cache sales (Account Managers)
- [ ] Build lookup maps (name → id, email → id)
- [ ] **Verification:** Lookups work, no repeated database queries

#### Task 1.6: Implement Batch Processing
- [ ] Process 10 opportunities per batch
- [ ] Progress bar updates after each batch
- [ ] Handle errors (continue-on-error mode)
- [ ] Generate error report (CSV with failed rows)
- [ ] **Verification:** Import completes, progress bar accurate

#### Task 1.7: Add Import Button to List View
- [ ] Open `src/atomic-crm/opportunities/OpportunityList.tsx`
- [ ] Add "Import" button to toolbar
- [ ] Open OpportunityImportDialog on click
- [ ] **Verification:** Button appears, dialog opens

**Acceptance Criteria:**
- Opportunities import dialog functional
- Column mapping auto-matches correctly
- Validation catches invalid data
- Lookups work efficiently (cached)
- Batch processing completes successfully
- Error report downloadable

---

### Phase 2: Products Import & Export
**Estimate:** 3 days
**Dependencies:** None (can run parallel with Phase 1)
**Assignable to:** Frontend developer

#### Task 2.1: Create Column Aliases File
- [ ] Create `src/atomic-crm/products/productColumnAliases.ts`
- [ ] Define aliases for:
  - name (Product Name, Name, Product, Item Name, etc.)
  - sku (SKU, Product Code, Item Code, Code, etc.)
  - principal (Principal, Brand, Manufacturer, etc.)
  - category (Category, Product Category, Type, etc.)
  - unit (Unit, Unit of Measure, UOM, etc.)
  - description (Description, Details, Notes, etc.)
- [ ] **Verification:** Aliases match common CSV column names

#### Task 2.2: Create Import Dialog Component
- [ ] Create `src/atomic-crm/products/ProductImportDialog.tsx`
- [ ] Copy structure from `ContactImportDialog.tsx`
- [ ] Adapt for products (same workflow as Opportunities)
- [ ] **Verification:** Dialog opens, file upload works

#### Task 2.3: Create Import Preview Component
- [ ] Create `src/atomic-crm/products/ProductImportPreview.tsx`
- [ ] Copy structure from `ContactImportPreview.tsx`
- [ ] Adapt for products
- [ ] **Verification:** Column mapping UI works

#### Task 2.4: Implement Validation Logic
- [ ] Add validation for required fields:
  - Name (required, max 200 chars)
  - SKU (required, unique in database AND CSV)
  - Principal (required, must exist in database)
- [ ] Add validation for optional fields:
  - Category (max 100 chars)
  - Unit (max 50 chars)
  - Description (max 1000 chars)
- [ ] Check SKU uniqueness in database BEFORE processing
- [ ] Check for duplicate SKUs within CSV file
- [ ] **Verification:** SKU uniqueness validation works

#### Task 2.5: Implement Lookup Caching
- [ ] Cache principals at import start
- [ ] Cache existing SKUs for duplicate detection
- [ ] Build lookup maps
- [ ] **Verification:** Lookups work efficiently

#### Task 2.6: Implement Batch Processing
- [ ] Process 10 products per batch
- [ ] Progress bar updates
- [ ] Error handling
- [ ] Error report generation
- [ ] **Verification:** Import completes successfully

#### Task 2.7: Create Export Hook
- [ ] Create `src/atomic-crm/products/hooks/useExportProducts.ts`
- [ ] Copy structure from `useExportOpportunities.ts` (104 lines)
- [ ] Map product fields to CSV columns:
  - Product Name, SKU, Principal, Category, Unit, Description, Created At, Updated At
- [ ] Use `useBulkExport` hook
- [ ] **Verification:** Export hook returns CSV data

#### Task 2.8: Add Export Button to List View
- [ ] Open `src/atomic-crm/products/ProductList.tsx`
- [ ] Add "Export" button to toolbar (use existing `<ExportButton>` component)
- [ ] Wire up `useExportProducts` hook
- [ ] Test with filters applied
- [ ] **Verification:** Export button works, respects filters

#### Task 2.9: Add Import Button to List View
- [ ] Add "Import" button to toolbar
- [ ] Open ProductImportDialog on click
- [ ] **Verification:** Button appears, dialog opens

**Acceptance Criteria:**
- Products import dialog functional
- SKU uniqueness validation works (database + CSV)
- Products export functional
- Export respects filters
- Import/export buttons in list view

---

### Phase 3: Quality Improvements
**Estimate:** 1.5 days
**Dependencies:** Phases 1 & 2 complete
**Assignable to:** Any developer

#### Task 3.1: Add Duplicate Detection for Contacts Import
- [ ] Open `src/atomic-crm/contacts/ContactImportDialog.tsx`
- [ ] Before processing batch, query existing emails:
  ```typescript
  const existingEmails = await supabase
    .from('contacts')
    .select('email')
    .in('email', batchEmails);
  ```
- [ ] Mark duplicate rows in preview (yellow highlight)
- [ ] Add dropdown per row: `[Skip | Update Existing | Create Anyway]`
- [ ] Handle each action appropriately
- [ ] **Verification:** Duplicate detection works, actions execute correctly

#### Task 3.2: Fix Export Header Consistency
- [ ] Audit all export hooks:
  - `useExportOpportunities.ts`
  - `OrganizationListActions.tsx`
  - `ContactListActions.tsx`
  - New `useExportProducts.ts`
- [ ] Standardize headers to match import aliases:
  - "company" → "Organization Name"
  - "phone" → "Phone Number"
  - etc.
- [ ] Test: Export → Re-import without editing
- [ ] **Verification:** Exported CSVs can be re-imported without manual changes

#### Task 3.3: Add Template Download for Organizations
- [ ] Create `src/atomic-crm/organizations/OrganizationExportTemplateButton.tsx`
- [ ] Copy structure from `ContactExportTemplateButton.tsx` (95 lines)
- [ ] Define template with sample row:
  ```typescript
  const template = [{
    'Organization Name': 'Example Restaurant',
    'Website': 'https://example.com',
    'Phone': '(555) 123-4567',
    'Email': 'info@example.com',
    'Address': '123 Main St',
    'City': 'Portland',
    'State': 'OR',
    'Zip': '97201',
    'Country': 'USA',
  }];
  ```
- [ ] Add button to Organizations list view toolbar
- [ ] **Verification:** Template downloads, structure correct

**Acceptance Criteria:**
- Duplicate detection functional for Contacts
- All export headers consistent
- Exported CSVs re-importable
- Organization template available

---

### Phase 4: Testing
**Estimate:** 1.5 days
**Dependencies:** All phases complete
**Assignable to:** QA or any developer

#### Task 4.1: Unit Tests
- [ ] Test `opportunityColumnAliases` matching logic
- [ ] Test `productColumnAliases` matching logic
- [ ] Test validation functions (opportunities, products)
- [ ] Test lookup caching logic
- [ ] **Target:** 70% code coverage for new code

#### Task 4.2: Integration Tests - Opportunities Import
- [ ] Test valid CSV import (50 opportunities)
- [ ] Test invalid CSV (missing required fields)
- [ ] Test invalid organization (not found)
- [ ] Test invalid principal (not found)
- [ ] Test invalid stage/status (enum violation)
- [ ] Test error report download
- [ ] **Verification:** All scenarios work correctly

#### Task 4.3: Integration Tests - Products Import/Export
- [ ] Test valid CSV import (30 products)
- [ ] Test duplicate SKU detection (database)
- [ ] Test duplicate SKU detection (within CSV)
- [ ] Test invalid principal
- [ ] Test products export
- [ ] Test export → re-import workflow
- [ ] **Verification:** All scenarios work correctly

#### Task 4.4: Integration Tests - Quality Improvements
- [ ] Test contacts duplicate detection
- [ ] Test "Skip" action for duplicates
- [ ] Test "Update Existing" action
- [ ] Test "Create Anyway" action
- [ ] Test export header consistency (all modules)
- [ ] Test organization template download
- [ ] **Verification:** All improvements working

#### Task 4.5: Performance Testing
- [ ] Import 100 opportunities, measure time (<10 seconds target)
- [ ] Import 100 products, measure time (<10 seconds target)
- [ ] Verify caching reduces API calls (85% reduction)
- [ ] Test with concurrent imports (2 users importing simultaneously)
- [ ] **Verification:** Performance targets met

#### Task 4.6: Manual Testing
- [ ] Test with real CSV files (from Excel exports)
- [ ] Test with different encodings (UTF-8, UTF-16, ASCII)
- [ ] Test with large files (500+ rows)
- [ ] Test error handling (network failures)
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] **Verification:** No critical bugs found

**Acceptance Criteria:**
- 70% test coverage achieved
- All integration tests pass
- Performance targets met (<10 seconds for 100 rows)
- No critical bugs in manual testing

---

## Parallelization Strategy

**Can run in parallel:**
- Phase 1 (Opportunities Import) **← Worktree 3**
- Phase 2 (Products Import/Export) **← Worktree 3 (or separate developer)**

**Must run sequentially:**
- Phases 1 & 2 → Phase 3 (Quality Improvements)
- Phase 3 → Phase 4 (Testing)

**Optimal approach:**
1. Run Phases 1 & 2 in parallel - **3 days** (both are 3 days)
2. Complete Phase 3 (Quality) - **1.5 days**
3. Complete Phase 4 (Testing) - **1.5 days**

**Total: 6 days** with parallelization (vs 9 days sequential)

---

## Definition of Done

- [ ] All 4 phases complete
- [ ] All acceptance criteria met
- [ ] 70% test coverage achieved for new code
- [ ] No critical bugs found in manual testing
- [ ] Performance <10 seconds for 100 row imports
- [ ] Export → Re-import workflow works without editing
- [ ] Code reviewed and approved
- [ ] Deployed to staging for QA testing

---

## Notes

**Why Import/Export is Faster to Complete:**
- 70% already done (Contacts/Organizations)
- Proven patterns to copy (no R&D needed)
- No database migrations required
- Validation logic straightforward

**Key Risks:**
- SKU uniqueness check at scale (1000+ existing products)
  - **Mitigation:** Cache all SKUs at import start, check in-memory
- Enum validation for stages/statuses (if enums change in future)
  - **Mitigation:** Document enum values in validation code

**Technical Debt to Address:**
- Consider creating generic `useImport` hook to reduce code duplication across modules
  - **Future work:** Refactor after MVP proves patterns work

---

## Related Documentation

- **SRS:** `docs/planning/import-export-module/SRS.md`
- **Data Model:** `docs/planning/import-export-module/DATA-MODEL.md`
- **PRD:** `docs/prd/13-import-export.md`
- **Existing Pattern:** `src/atomic-crm/contacts/ContactImportDialog.tsx` (copy this)
- **Column Aliases Pattern:** `src/atomic-crm/contacts/contactColumnAliases.ts` (copy this)
