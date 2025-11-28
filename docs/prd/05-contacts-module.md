---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 6 (Contacts) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Feature Module:** Contacts Module
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Contacts table schema
- 🎨 [Design System](./15-design-tokens.md) - List views, forms, and detail pages
- 🔗 [Organizations Module](./04-organizations-module.md) - Parent entity relationship
- 🔗 [Opportunities Module](./06-opportunities-module.md) - Contact associations
- 📊 [Import/Export](./13-import-export.md) - CSV import/export patterns
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | 🚧 **95%** |
| **Confidence** | 🟢 **HIGH** - Production ready, minor polish needed |
| **Files** | 32 total (28 implementation, 4 tests) |
| **CRUD Operations** | ✅ List, Show, Edit, Create all complete |
| **Database Schema** | ✅ Full schema with RLS policies |
| **Validation** | ✅ Comprehensive Zod schemas (465 lines) |
| **Advanced Features** | ✅ JSONB arrays, Multi-org, CSV Import/Export |

**Completed Requirements:**
- ✅ List view with responsive table/cards
- ✅ Advanced filtering (Organization, Position, Account Manager, Priority)
- ✅ Search functionality (name, organization, position, email)
- ✅ Bulk actions (Export CSV, Assign Manager)
- ✅ Detail view with organization relationships
- ✅ CRUD operations with validation
- ✅ JSONB arrays (email/phone with types)
- ✅ Multi-organization support
- ✅ CSV Import/Export with smart column mapping
- ✅ Database migrations with RLS
- ✅ Validation layer (emailAndTypeSchema, phoneNumberAndTypeSchema)
- ✅ Test coverage for critical paths

**Unfinished Tasks:**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Polish multi-org UI edge cases | 🚧 Partial | 🟢 HIGH | 1 day |
| CSV import edge case testing | ❌ Missing | 🟡 MEDIUM | 1 day |

**Details:**
- **Multi-org UI polish:** Minor UX improvements for contact-organization junction table display
- **CSV edge cases:** Need test coverage for malformed data, duplicate detection, validation errors

**Blockers:** None

---

# 3.3 Contacts Module

## List View Features

**Layout:**
- Responsive table (desktop/iPad landscape) or cards (iPad portrait)
- Columns:
  - Full Name (primary, bold, linked)
  - Organization (linked)
  - Position
  - Email (click to compose: mailto:)
  - Phone (tel: link for calling)
  - Account Manager

**Search:**
- Combined search field (within module)
- Searches: Name, Organization, Position, Email
- Real-time filtering

**Filtering:**
- Filter panel (collapsible sidebar or slide-over)
- Filters:
  - **Organization** (searchable multi-select)
  - **Position** (multi-select checkboxes)
  - **Account Manager** (searchable multi-select)
  - **Has Email** (toggle: Yes/No/All)
  - **Organization Priority** (inherit from org, multi-select)
- Applied filters as removable chips
- Filter presets: "My Contacts", "High Priority Orgs", "Missing Email"

**Sorting:**
- Sort by any column
- Default sort: Name (A-Z)

**Bulk Actions:**
- Select multiple contacts
- Actions:
  - Export to CSV
  - Assign Account Manager
  - Send Bulk Email (future phase)

## Detail View

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Contacts > [Contact Name]                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Contact Card                                         │   │
│  │  Full Name                                           │   │
│  │  Position at [Organization] (linked) [Priority]      │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  ✉️ Email (mailto:)  📞 Phone (tel:)  🔗 LinkedIn   │   │
│  │  📍 Address                                          │   │
│  │  👤 Account Manager                                  │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  📝 Notes (expandable)                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Related Opportunities                                │   │
│  │  (Opportunities for this contact's organization)     │   │
│  │  [Mini table with Status, Stage, Product, Owner]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Activity Feed                                        │   │
│  │  (Activities tagged to this contact)                 │   │
│  │  [Reverse chronological list]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Edit Contact Button] [Action Menu ▼]                      │
└─────────────────────────────────────────────────────────────┘
```

## Create/Edit Forms

**Form Structure:**
- Modal or slide-over panel
- Sections:

**1. Basic Information**
- Full Name* (text input)
- Organization* (searchable dropdown with "Add New Organization" link)
- Position (dropdown with common values: Owner, Manager, Chef, etc. + "Other" with free text)

**2. Contact Methods**
- Email (email input with validation)
- Phone (text input with format validation)
- LinkedIn URL (URL input with validation)

**3. Address**
- Street Address (text input)
- City (text input)
- State (dropdown)
- ZIP Code (5-digit validation)

**4. Management**
- Account Manager (searchable dropdown of Users, defaults to organization's primary manager)

**5. Notes**
- Multi-line text area

**Form Behavior:**
- Required fields: Full Name, Organization
- Real-time validation
- Success toast: "Contact created successfully"
- Option to "Add Another Contact" after creation
