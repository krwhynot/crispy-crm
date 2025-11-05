---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Search & Filtering
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Searchable fields and indexes
- 🎨 [Design System](./15-design-tokens.md) - Search bars, filter panels, and chips
- ⚙️ [Technical Stack](./18-tech-stack.md) - Search implementation (PostgreSQL full-text)
- 🔗 [Opportunities Module](./06-opportunities-module.md) - Principal search ⭐
- 📊 [Filter Registry](../../src/atomic-crm/providers/supabase/filterRegistry.ts) - Valid filterable fields
---

# 3.9 Search & Filtering

## Search Strategy (Advanced Implementation)

**Cross-Module Advanced Search:**
- **Global search bar** in top navigation (always visible)
- **Module-level search** also available in each list view
- **Full-text search** across all searchable fields including notes and descriptions
- **Search history** with recent searches (last 10 per user, stored locally)
- **Saved searches** for frequently used queries (stored in database)

**Search Behavior:**
- **Real-time filtering** as user types (debounced 300ms)
- **Minimum 2 characters** before search activates
- **Searchable fields** per module:
  - **Organizations**: Name, City, Notes, Segment, Website, all text fields
  - **Contacts**: Full Name, Organization Name, Position, Email, Phone, Notes
  - **Opportunities**: Opportunity Name, Customer Organization Name, Principal ⭐ (MOST IMPORTANT), Product Names, Description, Notes, Tags
  - **Products**: Product Name, Principal, Category, Description
  - **Activities**: Description, Outcome, Participant names
- **Advanced search operators:**
  - Quotes for exact match: `"Nobu Miami"`
  - AND/OR operators: `Ocean Hugger AND Miami`
  - Field-specific search: `principal:Fishpeople`
  - Exclusion: `-closed` (exclude closed opportunities)
- **Case-insensitive** search
- **Fuzzy matching** with typo tolerance (1-2 character differences)
- **Search suggestions** as you type (based on index and history)

**Search Results:**
- **Unified results page** for global search showing all matching entities
- **Grouped by entity type** (Organizations, Contacts, Opportunities)
- **Preview snippets** showing matched text in context
- **Quick filters** to narrow by entity type, date, owner
- **Search analytics** tracked for improving search (anonymous)
- Results count displayed: "23 results for 'Ballyhoo' across all modules"
- No results state with suggestions: "No results for 'XYZ'. Did you mean 'ABC'? Try different keywords or [Clear Search]"

**Search History & Saved Searches:**
- **Recent searches dropdown** when clicking search box
- **Save search button** to store frequently used queries
- **Named saved searches** accessible from dropdown
- **Clear history** option in user preferences
- **Shared saved searches** for team-wide common queries (admin-created)

## Advanced Filtering

**Filter Panel:**
- **Location**: Collapsible sidebar (desktop/iPad landscape) or slide-over drawer (iPad portrait)
- **Toggle**: "Filters" button with badge showing active filter count
- **Structure**: Grouped by filter category with headers

**Filter Types:**

1. **Multi-Select (Checkboxes)**
   - Example: Priority, Segment, Status, Stage
   - Show count of available options: "Priority (5)"
   - Select All / Deselect All options
   - Search within filter (if >10 options)

2. **Single-Select (Radio Buttons)**
   - Example: Has Email (Yes/No/All)
   - Typically 2-5 mutually exclusive options

3. **Searchable Multi-Select (Dropdown)**
   - Example: Organization, Account Manager, Product
   - Type-ahead search within dropdown
   - Show selected count: "3 organizations selected"
   - Selected items shown as chips in dropdown header

4. **Date Range Picker**
   - Example: Expected Close Date, Next Action Date, Last Activity Date
   - Presets: Today, This Week, This Month, This Quarter, Custom
   - Custom: Two date inputs (From / To)

**Filter Application:**
- Filters apply immediately (no "Apply" button needed)
- Real-time list updates as filters change
- Applied filters shown as chips above list
- Each chip has X button to remove individual filter
- "Clear all filters" button removes all at once

**Filter Presets (Saved Views):**
- Pre-configured filter combinations
- System presets (available to all):
  - "My Open Opportunities"
  - "High Priority Accounts"
  - "Closing This Month"
  - "Weekly Priority"
  - "Recent Wins"
- User-created presets (MVP: Admin can create, all can use)
- Preset dropdown in toolbar
- "Save current filters as preset" button (admin-only in MVP)
