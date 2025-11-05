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

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ✅ **100% (MVP Scope)** |
| **Confidence** | 🟢 **HIGH** - Module-level search complete |
| **Files** | 32 total (filter components across modules) |
| **Module Search** | ✅ Complete - All 4 core modules |
| **Global Search** | ⏸️ Deferred to Post-MVP |
| **Filter Registry** | ✅ Complete - filterRegistry.ts with validation |
| **Advanced Features** | 🚧 Partial - Basic filtering only |

**Completed Requirements:**
- ✅ Module-level search in Organizations (OrganizationListFilter.tsx)
- ✅ Module-level search in Contacts (ContactListFilter.tsx)
- ✅ Module-level search in Opportunities (OpportunityListFilter.tsx)
- ✅ Module-level search in Products (ProductListFilter.tsx)
- ✅ Filter registry validation (filterRegistry.ts)
- ✅ Real-time filtering with debounce (300ms)
- ✅ Applied filters as removable chips
- ✅ Filter panels with collapsible sections
- ✅ Multi-select checkboxes for categories
- ✅ Searchable dropdowns for associations
- ✅ Case-insensitive search (PostgreSQL ILIKE)
- ✅ useFilterCleanup hook for stale filter handling

**Deferred to Post-MVP:**

| Feature | Status | Rationale |
|---------|--------|-----------|
| Global search bar in top navigation | ⏸️ Deferred | Module-level search sufficient for Excel replacement |
| Unified cross-module search results page | ⏸️ Deferred | Users know which module to search within |
| Search history (last 10, localStorage) | ⏸️ Deferred | Nice-to-have, not critical for MVP |
| Saved searches (database) | ⏸️ Deferred | Power user feature, defer until adoption proven |
| Advanced search operators (AND/OR, quotes) | ⏸️ Deferred | Simple search meets 95% of use cases |
| Fuzzy matching with typo tolerance | ⏸️ Deferred | Basic ILIKE search works well |
| Search suggestions as-you-type | ⏸️ Deferred | Performance cost not justified for MVP |
| Full-text search triggers | ⏸️ Deferred | ILIKE on indexed columns performs adequately |

**Details:**
- **MVP Scope:** Module-level search only (Organizations, Contacts, Opportunities, Products)
- **Module Search:** All 4 core modules have working search and filter panels
- **Global Search:** Deferred to Post-MVP (not needed for Excel replacement goal)
- **Filter Registry:** Well-implemented validation system prevents 400 errors from stale cached filters
- **Pattern Established:** Consistent filter UI pattern across modules makes future global search extension straightforward

**Blockers:** None

**Recommendation:** MVP ships with module-level search only. Add global search bar in Phase 2 if users request it after adoption.

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
