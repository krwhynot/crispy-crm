---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Data Import/Export
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Database schemas for import validation
- 🎨 [Design System](./15-design-tokens.md) - Import wizards and export buttons
- 🔗 [Organizations Module](./04-organizations-module.md) - CSV import/export examples
- 🔗 [Contacts Module](./05-contacts-module.md) - vCard export
- 🔗 [Products Module](./07-products-module.md) - Product import/export
- 📊 [Reports](./09-reports.md) - Report export patterns
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ⚠️ **70%** |
| **Confidence** | 🟢 **HIGH** - Contacts/Orgs production-ready, gaps in other modules |
| **Files** | 18 total (16 implementation, 2 test files) |
| **Import Coverage** | 🚧 Partial - 2 of 4 modules (Contacts, Organizations) |
| **Export Coverage** | 🚧 Partial - 3 of 4 modules (Contacts, Organizations, Opportunities) |
| **Advanced Features** | ✅ Column mapping, validation preview, caching, error handling |

**Completed Requirements:**

**CSV Import (Contacts & Organizations):**
- ✅ Drag-and-drop file upload (ContactImportDialog.tsx - 691 lines, OrganizationImportDialog.tsx - 915 lines)
- ✅ Interactive column mapping UI with dropdowns (ContactImportPreview.tsx - 862 lines)
- ✅ Smart auto-matching via column aliases (contactColumnAliases.ts, organizationColumnAliases.ts)
- ✅ Live preview with first 5 rows
- ✅ Validation preview with error highlighting
- ✅ Batch processing (10 records/batch) with progress tracking
- ✅ Caching system for organizations/tags (85% API call reduction)
- ✅ Row-level error reporting with CSV line numbers
- ✅ UTF-8 encoding auto-detection
- ✅ Continue-on-error mode

**CSV Export (3 modules):**
- ✅ Export button in list views (export-button.tsx - 105 lines, bulk-export-button.tsx - 79 lines)
- ✅ Respects active filters
- ✅ File naming: `{module}_{date}_{time}.csv`
- ✅ UTF-8 BOM (Excel-compatible)
- ✅ JSONB arrays flattened to CSV columns
- ✅ Opportunities export with custom hook (useExportOpportunities.ts - 104 lines)

**Template Downloads:**
- ✅ Template generator for Contacts (ContactExportTemplateButton.tsx - 95 lines)
- ✅ Canonical headers with sample row
- ✅ Inline help via tooltip

**Missing Requirements (30%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Implement Opportunities CSV import | ❌ Missing | 🟢 HIGH | 3 days |
| Implement Products CSV import | ❌ Missing | 🟢 HIGH | 3 days |
| Implement Products CSV export | ❌ Missing | 🟢 HIGH | 1 day |
| Implement vCard export for Contacts | ❌ Missing | 🟡 MEDIUM | 2 days |
| Add duplicate detection for Contacts import | ❌ Missing | 🟢 HIGH | 1 day |
| Fix export header consistency (company vs organization_name) | ❌ Missing | 🟢 HIGH | 4 hours |
| Add template downloads for Organizations | ❌ Missing | 🟢 HIGH | 2 hours |
| Expand test coverage | ❌ Missing | 🟢 HIGH | 2 days |

**Details:**
- **Strong Foundation:** Contacts and Organizations have production-ready import/export with advanced column mapping, validation, and error handling
- **vCard Gap:** PRD claims vCard export is complete (line 27, 33, 39) but no implementation found - no .vcf generation, no vCard libraries in package.json
- **Products Module:** Zero import/export implementation despite PRD specification
- **Opportunities Import:** Export exists but import missing
- **Architecture Strength:** Generic `usePapaParse` hook is reusable, state machine pattern prevents impossible UI states
- **Technical Debt:** Export headers don't match import schema (requires manual editing before re-import)

**Blockers:** None

**Recommendation:** Prioritize vCard export (marked complete but missing), then add Opportunities import following existing Contacts/Organizations patterns. Products import/export lower priority.

---

# 3.11 Data Import/Export

## CSV Import (Flexible with Column Mapping)

**Import Capabilities:**
- Available for: Organizations, Contacts, Opportunities, Products
- **Flexible CSV import with column mapping UI**
- No strict template required - any CSV accepted
- Intelligent column matching with manual override

**Import Workflow:**
1. **File Upload:**
   - Drag-and-drop or file picker
   - Accept .csv and .txt files
   - Max file size: 10MB
   - UTF-8, UTF-16, or ASCII encoding auto-detected

2. **Column Mapping UI:**
   - Two-column interface:
     - Left: CSV columns with sample data (first 3 rows)
     - Right: CRM fields grouped by category
   - Drag-and-drop or dropdown to map columns
   - Auto-match common column names:
     - "Company", "Organization", "Business" → Organization Name
     - "Email", "Email Address" → Email
   - Required fields highlighted in red until mapped
   - "Ignore column" option for unmapped CSV columns

3. **Data Preview & Validation:**
   - Show first 10 rows with mapped data
   - Validation errors highlighted in red:
     - Missing required fields
     - Invalid email/phone formats
     - Duplicate records (by name)
   - Options per error:
     - Skip row
     - Set default value
     - Fix and retry

4. **Import Execution:**
   - Progress bar with current row number
   - Real-time error log
   - Continue on error or stop on first error (user choice)
   - Summary: "Imported 245 of 250 records. 5 errors. [Download Error Report]"

**Bulk Operations (Delete Only):**
- **Bulk delete only** for cleanup purposes
- Select multiple records via checkboxes
- "Delete Selected" button with confirmation
- Shows count: "Delete 12 selected items?"
- Two-step confirmation for safety:
  1. "Are you sure? This cannot be undone."
  2. "Type DELETE to confirm"
- No bulk edit or bulk create in MVP

## CSV Export

**Export Capabilities:**
- All list views have "Export to CSV" button
- **CSV format only** (no Excel, PDF, or JSON)
- Respects current filters and search
- Includes all visible columns

**Export Options:**
- Filtered results only (default)
- All records (optional checkbox)
- File naming: `{module}_{date}_{time}.csv`
- Example: `opportunities_2025-11-03_14-30.csv`
- UTF-8 encoding with BOM for Excel compatibility
