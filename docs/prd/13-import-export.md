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
