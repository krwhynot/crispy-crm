# SRS: Import/Export Module Completion

**Created:** 2025-11-05
**Status:** 70% Complete - Finishing Remaining Modules
**Complexity:** Medium (Follow Existing Patterns)
**Estimate:** 7-8 days

---

## Executive Summary

Complete the Import/Export module by adding Opportunities import and Products import/export. Leverage existing infrastructure from Contacts/Organizations (column mapping, validation, error handling) and apply same patterns to remaining modules.

---

## Current State Analysis

### ✅ What Exists (70% Complete):

**Fully Implemented (Contacts & Organizations):**
- ✅ Drag-and-drop file upload UI
- ✅ Interactive column mapping with smart auto-matching
- ✅ Live preview (first 5 rows)
- ✅ Validation preview with error highlighting
- ✅ Batch processing (10 records/batch) with progress tracking
- ✅ Caching system for lookups (85% API call reduction)
- ✅ Row-level error reporting with CSV line numbers
- ✅ UTF-8 encoding auto-detection
- ✅ Continue-on-error mode
- ✅ CSV export from list views (respects filters)
- ✅ Template downloads (Contacts only)

**Implementation Files:**
- ✅ `ContactImportDialog.tsx` (691 lines) - Full import wizard
- ✅ `ContactImportPreview.tsx` (862 lines) - Column mapping UI
- ✅ `contactColumnAliases.ts` - Smart column matching
- ✅ `OrganizationImportDialog.tsx` (915 lines) - Full import wizard
- ✅ `organizationColumnAliases.ts` - Smart column matching
- ✅ `export-button.tsx` (105 lines) - Generic export button
- ✅ `bulk-export-button.tsx` (79 lines) - Bulk export
- ✅ `useBulkExport.tsx` - Reusable export hook
- ✅ `ContactExportTemplateButton.tsx` (95 lines) - Template generator
- ✅ `useExportOpportunities.ts` (104 lines) - Opportunities export hook

**Partial Implementation:**
- ⚠️ Opportunities: Export only (no import)
- ❌ Products: Zero implementation

### ❌ What's Missing (30%):

**Missing: Opportunities Import**
- ❌ OpportunityImportDialog.tsx
- ❌ OpportunityImportPreview.tsx
- ❌ opportunityColumnAliases.ts
- ❌ Validation logic for opportunity-specific fields
- ❌ Principal lookup/caching

**Missing: Products Import/Export**
- ❌ ProductImportDialog.tsx
- ❌ ProductImportPreview.tsx
- ❌ productColumnAliases.ts
- ❌ Product export button in list view
- ❌ Product export hook

**Missing: Quality Improvements**
- ❌ Duplicate detection for Contacts import
- ❌ Export header consistency (company vs organization_name)
- ❌ Template downloads for Organizations
- ❌ Comprehensive test coverage (currently 2 test files)

---

## Functional Requirements

### FR-1: Opportunities Import

**Purpose:** Import opportunities from CSV to populate CRM with existing pipeline data.

**Location:** Opportunities List View → "Import" button → Dialog

**CSV Format Expectations:**
```csv
Opportunity Name,Customer Organization,Principal,Stage,Status,Expected Close Date,Account Manager,Description,Value
Sample Visit at Restaurant A,Restaurant A,Fishpeople Seafood,Sample Visit Offered,Active,2025-12-01,john@example.com,Initial sample visit,5000
New Lead - Restaurant B,Restaurant B,Ocean Hugger Foods,New Lead,Active,2025-12-15,jane@example.com,Inbound inquiry,3000
...
```

**Column Mapping:**
- Required fields:
  - Opportunity Name → `name`
  - Customer Organization → `organization_id` (lookup by name)
  - Principal → `principal_id` (lookup by name)
  - Stage → `stage` (enum validation)
  - Status → `status` (enum validation)
- Optional fields:
  - Expected Close Date → `expected_close_date` (date validation)
  - Account Manager → `sales_id` (lookup by email or name)
  - Description → `description`
  - Value → `value` (numeric validation)

**Smart Auto-Matching:**
```typescript
const opportunityColumnAliases = {
  name: ['Opportunity Name', 'Name', 'Opportunity', 'Deal Name', 'Deal'],
  organization: ['Customer Organization', 'Organization', 'Company', 'Customer', 'Account'],
  principal: ['Principal', 'Brand', 'Manufacturer', 'Supplier'],
  stage: ['Stage', 'Pipeline Stage', 'Sales Stage'],
  status: ['Status', 'Opportunity Status'],
  expected_close_date: ['Expected Close Date', 'Close Date', 'Expected Close', 'Target Date'],
  account_manager: ['Account Manager', 'Sales Rep', 'Owner', 'Assigned To'],
  description: ['Description', 'Notes', 'Comments'],
  value: ['Value', 'Amount', 'Deal Value', 'Estimated Value'],
};
```

**Validation Rules:**
- Name: Required, max 200 chars
- Organization: Must exist in database (lookup by name)
- Principal: Must exist in database (lookup by name)
- Stage: Must match enum values (New Lead, Discovery Call, Sample Visit Offered, etc.)
- Status: Must match enum values (Active, Closed Won, Closed Lost, On Hold)
- Expected Close Date: Optional, must be valid date format
- Account Manager: Optional, lookup by email (fallback: current user)
- Value: Optional, must be numeric

**Import Workflow:**
1. **File Upload:** Drag-and-drop or file picker
2. **Column Mapping:** Auto-match columns, manual override available
3. **Preview & Validation:** Show first 10 rows with errors highlighted
4. **Batch Processing:** Process 10 opportunities at a time
5. **Result Summary:** "Imported 95 of 100 opportunities. 5 errors. [Download Error Report]"

**Error Handling:**
- Missing required fields: "Opportunity Name is required"
- Invalid organization: "Organization 'Restaurant Z' not found. Create it first or skip this row."
- Invalid principal: "Principal 'Unknown Brand' not found. Add to Principals or skip."
- Invalid stage: "Stage 'Invalid' not recognized. Must be one of: [New Lead, Discovery Call, ...]"
- Invalid status: "Status 'Pending' not recognized. Must be: Active, Closed Won, Closed Lost, On Hold"
- Invalid date format: "Expected Close Date '13/32/2025' is invalid. Use YYYY-MM-DD format."

**Performance:**
- Caching for organization lookups (reuse from Contacts/Organizations import)
- Caching for principal lookups (new, similar pattern)
- Batch size: 10 opportunities per batch
- Progress bar updates after each batch

**Behavior:**
- Continue-on-error: Skip invalid rows, continue processing
- Error report: Download CSV with failed rows and error messages
- Success toast: "Imported 95 opportunities successfully"

---

### FR-2: Products Import

**Purpose:** Import product catalog from existing spreadsheets.

**Location:** Products List View → "Import" button → Dialog

**CSV Format Expectations:**
```csv
Product Name,SKU,Principal,Category,Unit,Description
Wild Alaskan Salmon Fillet,WAS-001,Fishpeople Seafood,Seafood,lb,Fresh wild-caught salmon
Ahimi Plant-Based Tuna,APB-002,Ocean Hugger Foods,Plant-Based,lb,Tomato-based tuna alternative
...
```

**Column Mapping:**
- Required fields:
  - Product Name → `name`
  - SKU → `sku`
  - Principal → `principal_id` (lookup by name)
- Optional fields:
  - Category → `category`
  - Unit → `unit`
  - Description → `description`

**Smart Auto-Matching:**
```typescript
const productColumnAliases = {
  name: ['Product Name', 'Name', 'Product', 'Item Name', 'Item'],
  sku: ['SKU', 'Product Code', 'Item Code', 'Code', 'ID'],
  principal: ['Principal', 'Brand', 'Manufacturer', 'Supplier'],
  category: ['Category', 'Product Category', 'Type'],
  unit: ['Unit', 'Unit of Measure', 'UOM'],
  description: ['Description', 'Details', 'Notes'],
};
```

**Validation Rules:**
- Name: Required, max 200 chars
- SKU: Required, unique within database
- Principal: Must exist in database (lookup by name)
- Category: Optional, max 100 chars
- Unit: Optional, max 50 chars
- Description: Optional, max 1000 chars

**Import Workflow:**
Same as Opportunities (File Upload → Column Mapping → Preview → Batch Processing → Summary)

**Error Handling:**
- Missing required fields: "Product Name is required"
- Duplicate SKU: "SKU 'WAS-001' already exists. Update existing product or use different SKU."
- Invalid principal: "Principal 'Unknown Brand' not found. Add to Principals or skip."

**Performance:**
- Caching for principal lookups (reuse from Opportunities import)
- Batch size: 10 products per batch
- Duplicate SKU check before insert (query database once, cache results)

---

### FR-3: Products Export

**Purpose:** Export product catalog to CSV for offline editing or backup.

**Location:** Products List View → "Export" button

**CSV Format:**
```csv
Product Name,SKU,Principal,Category,Unit,Description,Created At,Updated At
Wild Alaskan Salmon Fillet,WAS-001,Fishpeople Seafood,Seafood,lb,Fresh wild-caught salmon,2025-01-15,2025-11-01
...
```

**Features:**
- Export button in list view toolbar
- Respects current filters and search
- Filename: `products_YYYY-MM-DD_HH-mm.csv`
- UTF-8 BOM encoding for Excel compatibility

**Implementation:**
Reuse existing export infrastructure:
```typescript
// src/atomic-crm/products/hooks/useExportProducts.ts
export const useExportProducts = () => {
  const { exportData } = useBulkExport();

  const handleExport = (products) => {
    const csvData = products.map(p => ({
      'Product Name': p.name,
      'SKU': p.sku,
      'Principal': p.principal?.name || '',
      'Category': p.category || '',
      'Unit': p.unit || '',
      'Description': p.description || '',
      'Created At': p.created_at,
      'Updated At': p.updated_at,
    }));

    exportData({
      data: csvData,
      filename: `products_${Date.now()}.csv`,
    });
  };

  return { handleExport };
};
```

---

### FR-4: Quality Improvements

#### 4a. Duplicate Detection for Contacts Import

**Purpose:** Warn user when importing contact that already exists (by email).

**Behavior:**
- During preview, check if email already exists in database
- Highlight duplicate rows in yellow (warning, not error)
- Allow user to:
  - Skip duplicate
  - Update existing contact
  - Create anyway (if different person with same email)

**Implementation:**
```typescript
// Before processing batch, query existing emails
const existingEmails = await supabase
  .from('contacts')
  .select('email')
  .in('email', batchEmails);

// Mark rows as duplicates in preview
rows.forEach(row => {
  if (existingEmails.includes(row.email)) {
    row.isDuplicate = true;
    row.duplicateAction = 'skip'; // Default: skip
  }
});
```

#### 4b. Export Header Consistency

**Problem:** Export headers don't match import schema (e.g., "company" in export vs "organization_name" in import schema).

**Fix:**
- Standardize all export headers to match import column aliases
- Ensure exported CSV can be re-imported without manual editing

**Example:**
```typescript
// Before (inconsistent)
const csvData = { company: org.name };

// After (consistent)
const csvData = { 'Organization Name': org.name };
```

#### 4c. Template Downloads for Organizations

**Purpose:** Provide downloadable CSV template for organization imports.

**Implementation:**
Create `OrganizationExportTemplateButton.tsx` (copy from Contacts template):
```typescript
const template = [
  {
    'Organization Name': 'Example Restaurant',
    'Website': 'https://example.com',
    'Phone': '(555) 123-4567',
    'Email': 'info@example.com',
    'Address': '123 Main St',
    'City': 'Portland',
    'State': 'OR',
    'Zip': '97201',
    'Country': 'USA',
  },
];
```

---

## Non-Functional Requirements

### NFR-1: Performance
- Import 100 records in <10 seconds
- Column mapping UI responds in <100ms
- Caching reduces API calls by 85% (proven in Contacts/Organizations)

### NFR-2: Usability
- Reuse existing Contacts/Organizations patterns (users familiar with UI)
- Clear error messages with actionable suggestions
- Progress bar shows current row/total during import

### NFR-3: Data Integrity
- Validation before insert (prevent invalid data)
- Rollback on critical errors (if database constraints violated)
- Error report downloadable (users can fix and re-import)

---

## Technical Implementation

### Module Structure
```
src/atomic-crm/opportunities/
├── OpportunityImportDialog.tsx       ← NEW (copy pattern from ContactImportDialog)
├── OpportunityImportPreview.tsx      ← NEW (copy pattern from ContactImportPreview)
├── opportunityColumnAliases.ts       ← NEW (define column mappings)
└── hooks/
    └── useExportOpportunities.ts     ← EXISTS (already functional)

src/atomic-crm/products/
├── ProductImportDialog.tsx           ← NEW (copy pattern from ContactImportDialog)
├── ProductImportPreview.tsx          ← NEW (copy pattern from ContactImportPreview)
├── productColumnAliases.ts           ← NEW (define column mappings)
└── hooks/
    ├── useExportProducts.ts          ← NEW (copy pattern from useExportOpportunities)
    └── useImportProducts.ts          ← NEW (import logic)
```

### Reusable Infrastructure (Already Exists)
- `src/hooks/usePapaParse.ts` - CSV parsing
- `src/hooks/useBulkExport.tsx` - Export logic
- `src/components/admin/export-button.tsx` - Generic export button
- `src/components/admin/bulk-export-button.tsx` - Bulk export

---

## Open Questions

- [ ] **Q1:** Should Opportunities import support bulk assignment to Account Managers?
  - **Impact:** 2 hours additional UI work
  - **Recommendation:** No, assign to current user by default (can edit after import)

- [ ] **Q2:** Should Products import validate SKU uniqueness in CSV before processing?
  - **Impact:** 1 hour additional validation logic
  - **Recommendation:** Yes, prevents processing 90% of file then failing on duplicate

- [ ] **Q3:** Should we add "Update existing" mode for imports (vs "Create only")?
  - **Impact:** 3 days additional feature work
  - **Recommendation:** Defer to post-MVP, create-only is sufficient for MVP

---

## Assumptions

- Contacts/Organizations import patterns are proven and reusable
- Opportunities and Products schemas are stable (no migrations needed)
- Users have existing CSV files to import (Excel exports)
- Principals data is already in database (imported separately or manually entered)
- Account Managers (Sales) are already in database

---

## Dependencies

- ✅ CSV parsing infrastructure (`usePapaParse`)
- ✅ Export infrastructure (`useBulkExport`)
- ✅ Opportunities export hook (exists)
- ❌ Opportunities import components (need creation)
- ❌ Products import components (need creation)
- ❌ Products export hook (need creation)

---

## Success Criteria

**MVP Definition of Done:**
- [ ] Opportunities import functional
- [ ] Products import functional
- [ ] Products export functional
- [ ] Duplicate detection for Contacts working
- [ ] Export header consistency fixed
- [ ] Organization template download available
- [ ] Tests added (min 70% coverage)

**Acceptance Test:**
1. Import 50 opportunities from CSV
2. Verify column mapping auto-matches correctly
3. Verify validation catches invalid stages/statuses
4. Verify organizations and principals lookup correctly
5. Verify error report downloads with failed rows
6. Import 30 products from CSV
7. Verify SKU uniqueness validation works
8. Export products to CSV
9. Verify exported CSV can be re-imported without editing

---

## Related Documentation

- **PRD:** `docs/prd/13-import-export.md`
- **Existing Implementation:** `src/atomic-crm/contacts/ContactImportDialog.tsx` (pattern to copy)
- **Column Aliases:** `src/atomic-crm/contacts/contactColumnAliases.ts` (pattern to copy)
- **Export Hook:** `src/hooks/useBulkExport.tsx`
