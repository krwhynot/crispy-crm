---
**Part of:** Atomic CRM Product Requirements Document
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
  - Export to vCard (for phone import)
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
