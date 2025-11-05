---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Products Module
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Products table schema (simplified, no pricing)
- 🎨 [Design System](./15-design-tokens.md) - List views and forms
- 🔗 [Opportunities Module](./06-opportunities-module.md) - Product associations via junction table
- 📊 [Import/Export](./13-import-export.md) - CSV import/export patterns
- 📝 [Architecture Decision](../database/migration-business-rules.md) - Pricing removal rationale
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | 🚧 **95%** |
| **Confidence** | 🟢 **HIGH** - Production ready |
| **Files** | 12 total (implementation only) |
| **CRUD Operations** | ✅ List, Show, Edit, Create all complete |
| **Database Schema** | ✅ Full schema with pricing removed (per CLAUDE.md) |
| **Validation** | ✅ Zod schemas (productSchema, opportunityProductSchema) |
| **Advanced Features** | ✅ Grid/List views, Filtering, F&B specific fields |

**Completed Requirements:**
- ✅ List view with grid and list layouts (ProductList.tsx, ProductGridList.tsx)
- ✅ Product catalog: name, SKU, category, description, status
- ✅ Simple association tracking (NO pricing per Constitution)
- ✅ Principal/supplier and distributor references
- ✅ F&B specific fields (certifications, allergens, ingredients, nutritional_info, marketing_description)
- ✅ Opportunity-products junction table (association + optional notes only)
- ✅ CRUD operations (ProductCreate, ProductEdit, ProductShow)
- ✅ Filtering by category, status, principal (ProductListFilter.tsx)
- ✅ Database migrations (pricing removal migration `20251028040008`, category TEXT, search triggers)
- ✅ Registered in CRM.tsx (line 149)
- ✅ Product card display (ProductCard.tsx)
- ✅ Empty states (ProductEmpty.tsx)
- ✅ Validation schemas in validation/products.ts

**Unfinished Tasks:**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Add test coverage for CRUD operations | ❌ Missing | 🟢 HIGH | 1 day |
| CSV Import/Export for products | ❌ Missing | 🟡 MEDIUM | 2 days |

**Details:**
- **Tests:** No test files found - should add unit tests for ProductList, ProductCreate, ProductEdit
- **Import/Export:** Organizations and Contacts have CSV import/export, Products could benefit from same pattern for bulk product catalog management

**Blockers:** None

---

# 3.5 Products Module

**Note:** Pricing functionality was removed from products (October 2025). Products now track catalog items only, with simple associations to opportunities. See migration `20251028040008_remove_product_pricing_and_uom.sql` for details.

## Product List View

**Layout:**
- Simple responsive table
- Columns:
  - **Product Name** (primary, linked to detail)
  - **Principal** (brand)
  - **Category**
  - **Active** (toggle switch, updates immediately)
  - **# Active Opportunities** (count, linked to filtered opportunity list)
- Sort by any column, default: Product Name (A-Z)

**Search:**
- Search box above table (within module)
- Searches: Product Name, Principal, Category
- Real-time filtering

**Filtering:**
- Filter toolbar:
  - **Active Status** (toggle: Active/Inactive/All)
  - **Principal** (multi-select dropdown)
  - **Category** (multi-select dropdown)
- Applied filters as chips

**Actions:**
- "Add Product" button (primary, top-right)
- Per-row actions (hover): Edit (pencil icon), View Usage (chart icon)

## Product Detail View

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Products > [Product Name]                       │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐    │
│  │ Product Information Card                            │    │
│  │  Product Name                                       │    │
│  │  Principal: [Brand Name]                            │    │
│  │  Category: [Category]                               │    │
│  │  Status: [Active/Inactive Toggle]                   │    │
│  │  ─────────────────────────────────────────────────│    │
│  │  Description:                                       │    │
│  │  [Product description text]                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Related Opportunities                                │    │
│  │  [Table: All opportunities using this product]      │    │
│  │  Columns: Organization, Opp Name, Status, Stage,    │    │
│  │           Volume, Deal Owner                         │    │
│  │  Filter by: Status, Stage                            │    │
│  │  Sort by: Any column                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Edit Product Button] [Action Menu ▼]                      │
└─────────────────────────────────────────────────────────────┘
```

**Actions:**
- **Edit Product**: Opens edit modal/form
- **Deactivate** (vs. Delete): Preserves historical data in opportunities
  - Confirmation: "Deactivate '[Product Name]'? It will no longer be available for new opportunities but existing opportunities will be preserved. [Cancel] [Deactivate]"
- **View Usage Report**: Shows metrics (future feature):
  - Total opportunities using this product
  - Win rate (SOLD-7 / Total)
  - Average volume
  - Average days to close

## Create/Edit Form

**Form Structure:**
- Modal or slide-over panel
- Fields:

**1. Basic Information**
- Product Name* (text input, unique validation)
- Principal (Brand) (dropdown with common brands + "Other" for free text)
- Category (dropdown: Proteins, Fries, Condiments, Prepared Foods, Beverages, Equipment, Other)

**2. Description**
- Description (multi-line text area, optional)

**3. Status**
- Active (checkbox, default checked)

**Form Validation:**
- Required: Product Name
- Unique: Product Name (case-insensitive)
- Success toast: "Product '[Product Name]' created successfully"

## Import/Export

**CSV Import:**
- "Import Products" button in list view toolbar
- Upload CSV with columns: Product Name, Principal, Category, Description
- Column mapping interface
- Validation: Check for duplicates, required fields
- Bulk import with error report

**CSV Export:**
- "Export Products" button
- Exports all products or filtered subset
- Filename: `products_export_YYYY-MM-DD.csv`

**Template Download:**
- "Download Template" link provides empty CSV with correct headers

## Product Management

**Deactivate vs. Delete:**
- **Deactivate** (preferred): Sets active=false
  - Product no longer appears in opportunity product dropdown
  - Existing opportunities retain the product reference
  - Can be reactivated later
  - Use case: Seasonal products, discontinued items
- **Delete** (admin-only, discouraged): Permanently removes product
  - Only allowed if no opportunities reference this product
  - Confirmation: "Delete '[Product Name]'? This action cannot be undone. [Cancel] [Delete]"

**Bulk Operations:**
- Select multiple products → "Activate" or "Deactivate" (bulk toggle)
