---
**Part of:** Atomic CRM Product Requirements Document
**Category:** Implementation & Operations
**Document:** 23-implementation-deviations.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🚀 [Roadmap](./22-roadmap.md) - Implementation timeline
- 🏗️ [Technical Architecture](./20-technical-architecture.md) - System design
- 🗄️ [Database Schema](./02-database-schema.md) - Data model details
- 🎯 [Features - Opportunities](./12-features-opportunities.md) - Core module specs
---

# 9. IMPLEMENTATION DEVIATIONS & ARCHITECTURAL DECISIONS

## Pragmatic Implementation Choices

This section documents where the actual implementation differs from the original specification, following a "code wins" philosophy with pragmatic adjustments.

### Database Schema Patterns

**Primary Keys:**
- **Specified:** entity_name_id (e.g., organization_id, contact_id)
- **Implemented:** id (PostgreSQL standard convention)
- **Decision:** Keep current implementation - follows database best practices

**Task Relationships (HubSpot Pattern):**
- **Original:** Polymorphic pattern with related_to_type and related_to_id
- **Implemented:** Separate foreign keys (contact_id, opportunity_id, organization_id)
- **Rationale:** Maintains referential integrity at database level, simpler queries, follows HubSpot/Pipedrive industry standard

**Organization Segments:**
- **Specified:** Reference to segments table with segment_id
- **Implemented:** Flexible text field allowing custom values
- **Decision:** Switch to flexible text field per PRD for user flexibility

### Module Implementations

**Tasks Module:**
- **Specified:** Full module with List/Show/Edit/Create views
- **Implemented:** Dashboard widget only with quick add/edit modals
- **Decision:** Keep minimal - users manage tasks through dashboard
- **Note:** No email notifications (users check tasks when logged in)

**Reports Module:**
- **Status:** To be implemented
- **Scope:** Three basic reports as specified (no advanced analytics)
  1. Opportunities by Principal (critical for business)
  2. Weekly Activity Summary
  3. Filtered List Exports (CSV)

**Activity Tracking:**
- **Specified:** Standalone module
- **Implemented:** Embedded in Opportunities/Contacts + Dashboard timeline
- **Decision:** Keep contextual approach - more intuitive for users

### Features Removed/Simplified

**Product Pricing:**
- **Removed:** list_price, currency_code, unit_of_measure columns
- **Rationale:** Pricing is dynamic per customer/distributor
- **Impact:** Simplified data model, products are catalog items only

**Email Notifications:**
- **Status:** Not implemented
- **Decision:** Skip for MVP - reduces infrastructure complexity

**Forecasting Features:**
- **Status:** Removed from MVP
- **Timeline:** Moved to Phase 3

**Mobile App:**
- **Status:** Not in MVP
- **Timeline:** Phase 3 consideration

### Technical Stack Decisions

**Authentication:** Supabase Auth (GoTrue)
**Database:** PostgreSQL with RLS policies
**Frontend:** React 19 + TypeScript + Vite
**UI Framework:** React Admin + shadcn/ui components
**State Management:** TanStack Query (server) + Zustand (client)
**Deployment:** Vercel + Supabase Cloud

## User Experience Patterns

### Data Import
- **CSV Import:** Nice-to-have feature (Q3: Occasionally useful)
- **Supported Entities:** Organizations and Contacts
- **Use Cases:** Initial migration from Excel, periodic bulk updates
- **Validation:** Preview with error highlighting before import
- **Mapping:** Auto-detect columns with manual override option

### Form Validation
- **Approach:** Real-time validation as user types (Q4: Real-time)
- **Implementation:** Zod schemas with immediate feedback
- **Error Display:** Inline below fields, red text with icons
- **Success Indicators:** Green checkmarks for valid fields
- **Performance:** Debounced validation (300ms) to avoid lag

### Navigation Pattern
- **Layout:** Top bar with horizontal tabs (current implementation)
- **Sections:** Dashboard | Contacts | Organizations | Opportunities | Products
- **Mobile:** Responsive tabs collapse to hamburger menu on small screens
- **Active State:** Border-bottom highlight on current section

### Dashboard Content Priority
**Primary Focus:** Tasks & Activities (Q6: Priority A)
1. **My Tasks Widget** - Shows overdue and upcoming tasks
2. **Personal Pipeline** - User's opportunities by stage
3. **Recent Activity** - Latest records and changes
4. **Quick Actions** - Add buttons for common tasks

### Data Management

**Data Retention Policy (30-Day Soft Delete):**
- **Phase 1:** Soft delete with `deleted_at` timestamp
- **Phase 2:** After 30 days, move to archive tables
- **Phase 3:** Hard delete from archive after 90 days total
- **Audit Trail:** Permanent retention of who deleted what and when

**Duplicate Detection (Prevent Creation):**
- **Organizations:** Check name + city combination
- **Contacts:** Check email or (first_name + last_name + organization)
- **Behavior:** Block creation with error message and link to existing record
- **Admin Override:** Admins can force create with reason

**Activity Logging (Comprehensive):**
- **Logged Actions:** Every create, read, update, delete operation
- **Stored Data:** User, timestamp, action, entity, changes (old/new values)
- **Performance:** Async logging to avoid UI blocking
- **Retention:** 90 days in main table, then archive

### Smart Defaults (Rule-Based, Not ML)

Following industry best practices from Salesforce/HubSpot research:

**Context-Aware Defaults:**
- **Due Date:** Tasks default to +3 days from today
- **Priority:** Medium for all new items
- **Owner:** Current user for new records
- **Stage:** "New Lead" for opportunities
- **Organization Segment:** Last-used value per user session

**Auto-Population Rules:**
- **Contact Organization:** Pre-fill when creating from org page
- **Opportunity Customer:** Pre-fill when creating from org context
- **Task Related Entity:** Auto-link when created from entity page

**Not Implemented (Avoiding Over-Engineering):**
- ❌ Machine learning predictions
- ❌ Complex multi-field dependencies
- ❌ Behavioral pattern learning
- ✅ Simple, predictable, fast

### Mobile Responsiveness
- **Priority:** Important for occasional mobile use (Q12)
- **Target Devices:** iPad (primary), iPhone (secondary), Android tablets
- **Breakpoints:** Desktop (1024px+), Tablet (768-1023px), Mobile (<768px)
- **Touch Targets:** Minimum 44x44px for all interactive elements
- **Responsive Tables:** Card view on mobile, table view on desktop/tablet

### Opportunity-Contact Relationships
- **Primary Pattern:** Single primary contact per opportunity (Q13)
- **Junction Table:** Supports multiple contacts when needed
- **Use Cases:** Primary decision maker + influencers
- **UI Display:** Show primary contact prominently, others as "Additional Contacts"

### Search Functionality
- **Scope:** Module-level search only (Q7: Confirmed)
- **No Global Search:** Each module has its own search box
- **Search Fields:**
  - Organizations: Name, City
  - Contacts: Name, Email
  - Opportunities: Name, Customer, Principal
  - Products: Name, SKU, Category
- **Performance:** Real-time filtering with 200ms debounce

### Performance Optimization (Speed First)

**Target Metrics (Q14: Speed First):**
- **Initial Load:** <2 seconds
- **List Views:** <500ms with 1000 records
- **Form Submit:** <300ms response
- **Search Results:** <200ms as-you-type

**Optimization Strategies:**
- Virtual scrolling for long lists
- Lazy loading for tabs and modals
- Optimistic UI updates
- Aggressive caching with React Query
- Database indexes on all foreign keys
