# Phase 3: Developer Quick Start Guide

**Start here if you're beginning Phase 3 implementation.**

---

## 📚 Documentation Index

1. **phase3-opportunities.md** (42 KB) - Complete task breakdown with 61 detailed tasks
2. **phase3-summary.md** (11 KB) - Executive summary and high-level overview
3. **phase3-checklist.md** (10 KB) - Simple checklist for tracking progress
4. **phase3-dependencies.md** (16 KB) - Visual dependencies and critical path
5. **phase3-quickstart.md** (this file) - Getting started guide

---

## 🎯 What is Phase 3?

**Goal:** Complete the Opportunities & Sales module with full pipeline management

**Key Features:**
- ⭐ **Principal tracking** (MOST IMPORTANT) - Every opportunity linked to ONE brand/manufacturer
- **Kanban board** with drag-and-drop stage management
- **Trade show workflow** - Multiple opportunities per principal, campaign grouping
- **Products filtering** by principal organization
- **Junction tables** for M:N relationships (opportunity-products, opportunity-contacts)
- **Audit trail** for field-level change tracking
- **Advanced filtering** and bulk actions

**Timeline:** 3.5-4 weeks with 2 developers
**Total Tasks:** 61 tasks (~139 hours)

---

## 🚀 Before You Start

### 1. Read the PRD
**Location:** `/home/krwhynot/projects/crispy-crm/docs/PRD.md`

**Critical Sections:**
- Section 3.4: Opportunities Module (lines 916-1256)
- Section 3.5: Products Module (lines 1322-1446)
- Trade Show Handling (lines 1257-1293)
- Principal tracking requirements (marked with ⭐ throughout)

### 2. Review Existing Implementation
**What's already built:**
- ✅ Opportunities CRUD (list, detail, create, edit)
- ✅ Organizations module (Customer, Principal, Distributor)
- ✅ Contacts module
- ✅ Products module (basic)
- ✅ opportunity_products junction table (schema exists)
- ✅ Activity log functionality
- ✅ Validation schemas (Zod)

**Key Files to Understand:**
```
src/atomic-crm/opportunities/
  - OpportunityList.tsx          # List view
  - OpportunityShow.tsx          # Detail page
  - OpportunityInputs.tsx        # Form inputs
  - OpportunityRowListView.tsx   # Table rows
  - OpportunityCard.tsx          # Kanban card (already exists!)

src/atomic-crm/validation/
  - opportunities.ts             # Zod schemas

supabase/migrations/
  - 20251029051540_create_opportunity_products_table.sql
```

### 3. Understand the Database Schema
**Current opportunities table has:**
- customer_organization_id (FK)
- principal_organization_id (FK) ⭐
- distributor_organization_id (FK)
- contact_ids (BIGINT[]) ← Will be replaced with junction table
- tags (TEXT[])
- stage, status, priority
- next_action, next_action_date, decision_criteria

**What we need to add:**
- campaign (TEXT) - for grouping related opportunities
- related_opportunity_id (FK) - for linking opportunities
- notes (TEXT) - general notes
- opportunity_contacts junction table
- audit_trail table

---

## 📋 Week 1: Getting Started (Days 1-5)

### Day 1: Spikes & Decisions (Both Developers)

**Complete these 3 spikes FIRST:**

#### 1. Drag-Drop Library Evaluation (3 hours)
**Task:** P3-E2-S1-T1
**Goal:** Choose between dnd-kit, react-beautiful-dnd, react-dnd

**Evaluation Criteria:**
- React 19 compatibility
- TypeScript support
- Accessibility (keyboard navigation)
- Touch device support (iPad critical)
- Performance with 100+ cards
- Bundle size

**Recommended:** dnd-kit (modern, accessible, maintained)

**Deliverable:** `docs/spikes/drag-drop-library-evaluation.md`

#### 2. Campaign Grouping Design (2 hours)
**Task:** P3-E3-S1-T1
**Goal:** Decide: TEXT field vs separate campaigns table

**Options:**
- **Option A:** Simple TEXT field (easier MVP, flexible)
- **Option B:** Separate campaigns table (normalized, structured)

**Recommended:** TEXT field (defer normalization until needed)

**Deliverable:** `docs/spikes/campaign-grouping-design.md`

#### 3. Audit Trail Approach (3 hours)
**Task:** P3-E7-S3-T1
**Goal:** PostgreSQL triggers vs application-level tracking

**Options:**
- **Option A:** PostgreSQL triggers (automatic, reliable, see ADR-0006)
- **Option B:** Application-level (flexible, easier debugging)

**Recommended:** PostgreSQL triggers (per ADR-0006)

**Deliverable:** `docs/spikes/audit-trail-implementation.md`

---

### Day 2: Database Migrations

**Team A: Core Fields (4 hours)**
```bash
# Create migrations
npx supabase migration new add_campaign_and_related_opportunity
npx supabase migration new add_opportunity_notes_field

# Implementation:
# P3-E1-S1-T1: Add campaign TEXT field (nullable)
# P3-E1-S1-T2: Add related_opportunity_id BIGINT (FK, nullable)
# P3-E1-S1-T3: Update opportunities_with_orgs view
# P3-E1-S3-T1: Add notes TEXT field

# Test locally
npm run db:local:reset
# Verify fields exist in opportunities table
```

**Team B: Product Principal Index (1 hour)**
```bash
# P3-E4-S1-T1: Index products.principal for filtering
npx supabase migration new index_products_principal

# Create index on products(principal)
# Verify query plan uses index
```

---

### Day 3: Junction Tables & Critical Features

**Team A: opportunity_contacts Junction (5 hours)**
```bash
# P3-E1-S2-T1: Create junction table (2h)
npx supabase migration new create_opportunity_contacts_junction

# Table structure:
# - id BIGSERIAL PRIMARY KEY
# - opportunity_id BIGINT FK (ON DELETE CASCADE)
# - contact_id BIGINT FK (ON DELETE CASCADE)
# - is_primary BOOLEAN DEFAULT false
# - created_at TIMESTAMPTZ
# - UNIQUE(opportunity_id, contact_id)
# - RLS policies for authenticated users

# P3-E1-S2-T2: Migrate existing contact_ids array (2h)
# CRITICAL: Backup data first!
# First contact becomes is_primary=true

# Manual verification step (1h)
# Check counts match, no data lost
```

**Team B: ⭐ Products Filtered by Principal (5 hours)**
```typescript
// P3-E4-S1-T2: HIGHEST PRIORITY TASK
// Location: src/atomic-crm/opportunities/hooks/useFilteredProducts.ts

// Requirements:
// 1. Product dropdown ONLY shows products matching selected principal
// 2. Dropdown disabled until principal selected
// 3. If principal changes, clear incompatible products
// 4. Confirmation modal if products would be removed
// 5. 95%+ test coverage

// Example implementation:
const useFilteredProducts = (principalOrgId: number | null) => {
  const { data: products, isLoading } = useGetList('products', {
    filter: principalOrgId
      ? { principal: principalOrgId }
      : {},
  });

  return { products, isLoading, isReady: !!principalOrgId };
};

// Update OpportunityInputs.tsx to use this hook
// Add confirmation modal for principal changes
```

---

### Days 4-5: Kanban Foundation

**Team A: Kanban Layout (2 days)**
```bash
# Install dependencies
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Create components:
# - src/atomic-crm/opportunities/KanbanBoard.tsx
# - src/atomic-crm/opportunities/KanbanColumn.tsx
# - src/atomic-crm/opportunities/dnd/DndContext.tsx

# Update OpportunityCard.tsx for draggable functionality
```

**Team B: Product Features + Auto-Name (2 days)**
```typescript
// Complete Epic 4 tasks:
// - ProductAssociationList component (ArrayInput pattern)
// - Products table on OpportunityShow
// - opportunity_products sync in data provider

// Start Epic 5:
// - generateOpportunityName utility
// - Auto-generate button in form
// - Naming convention helper text
```

---

## 🎯 Critical Path Tasks (Must Complete Early)

### Priority 1: Database Foundation
- [ ] Campaign field added
- [ ] Related_opportunity_id added
- [ ] opportunity_contacts junction created
- [ ] Contact_ids migrated (with verification)

### Priority 2: ⭐ Principal Features
- [ ] Products filtered by principal (95%+ tests)
- [ ] Principal column prominent in list
- [ ] Principal filter in Kanban/list views

### Priority 3: Kanban Board
- [ ] Drag-drop library installed
- [ ] Basic Kanban layout
- [ ] Drag-and-drop working
- [ ] Stage change modal

---

## 🧪 Testing Strategy

### Unit Tests (Target: 80%+ coverage)
```bash
# Test files to create:
src/atomic-crm/opportunities/hooks/
  - useFilteredProducts.test.ts      # ⭐ 95%+ coverage
  - useDragAndDrop.test.ts           # 85%+ coverage
  - useKanbanData.test.ts

src/atomic-crm/opportunities/utils/
  - generateOpportunityName.test.ts  # 100% coverage

# Run tests:
npm test -- opportunities
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# Test files to create:
tests/e2e/opportunities/
  - create-with-products.spec.ts     # ⭐ Principal filtering
  - kanban-drag-drop.spec.ts         # Stage changes
  - campaign-workflow.spec.ts        # Trade show flow

# Run E2E tests:
npm run test:e2e
```

### Coverage Goals
- ⭐ Principal filtering: 95%+
- Drag-and-drop: 85%+
- Junction tables: 85%+
- Campaign grouping: 80%+
- Overall Phase 3: 80%+

---

## 🔍 Code Review Checklist

Before marking a task complete, verify:

### For All Tasks
- [ ] TypeScript types are correct (no `any`)
- [ ] Zod validation schema updated if needed
- [ ] Tests written with good coverage
- [ ] No console.logs left in code
- [ ] Comments explain "why", not "what"
- [ ] Follows Engineering Constitution principles

### For Database Migrations
- [ ] Migration has both UP and DOWN (rollback)
- [ ] RLS policies created
- [ ] Indexes added for foreign keys
- [ ] Tested on local database
- [ ] Backup instructions documented

### For UI Components
- [ ] iPad responsive (Constitution: iPad-first)
- [ ] Touch targets 44x44px minimum
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (ARIA labels)
- [ ] Loading states implemented
- [ ] Error states handled gracefully

### For ⭐ Principal Features (Extra Scrutiny)
- [ ] Principal field REQUIRED in validation
- [ ] Principal displayed prominently
- [ ] Products filter by principal correctly
- [ ] CSV exports include principal column
- [ ] 90%+ test coverage
- [ ] E2E test covers full workflow

---

## 🐛 Common Pitfalls & How to Avoid

### 1. Contact_ids Migration Data Loss
**Risk:** Losing contact associations during migration
**Mitigation:**
- Backup database before migration
- Run migration on dev/staging first
- Manual verification step (compare counts)
- Prepare rollback script
- DO NOT drop contact_ids column until verified

### 2. Drag-Drop Performance Issues
**Risk:** Sluggish UI with 100+ cards
**Mitigation:**
- Virtualize lists if > 200 cards per column
- Use React.memo for OpportunityCard
- Optimize re-renders (useMemo, useCallback)
- Test with realistic data volume

### 3. Products Filtering Breaks Form
**Risk:** Users can't select products, blocking opportunity creation
**Mitigation:**
- Feature flag to disable new filtering
- Comprehensive error handling
- Clear error messages
- E2E test catches regression
- Staged rollout (beta users first)

### 4. Audit Trigger Performance
**Risk:** Opportunity updates become slow
**Mitigation:**
- Benchmark trigger overhead (target: <50ms)
- Exclude noisy fields (updated_at, search_tsv)
- Consider async logging if too slow
- Add monitoring for slow queries

### 5. Campaign Grouping UI Confusion
**Risk:** Users don't understand how to group opportunities
**Mitigation:**
- Clear helper text in form
- Example: "NRA Show 2025"
- Autocomplete shows existing campaigns
- User guide with screenshots
- Training session before rollout

---

## 📊 Progress Tracking

### Daily Standup Questions
1. What did you complete yesterday? (reference task IDs: P3-E#-S#-T#)
2. What are you working on today?
3. Any blockers? (see phase3-dependencies.md for critical path)

### Weekly Review
- Epic completion percentage (see phase3-checklist.md)
- Testing coverage trends
- Bugs discovered and fixed
- Open questions for product owner

### Definition of Done (Epic Level)
- [ ] All tasks in epic complete
- [ ] Tests written with target coverage
- [ ] Code reviewed and merged
- [ ] Documented (inline comments + user guides)
- [ ] Manually tested on dev environment
- [ ] No known critical bugs

---

## 🆘 Getting Help

### Internal Resources
1. **PRD Questions:** Clarify with product owner
2. **Technical Design:** Review `docs/claude/architecture-essentials.md`
3. **Database Questions:** See `docs/supabase/WORKFLOW.md`
4. **Testing Help:** See `docs/claude/testing-quick-reference.md`

### External Resources
1. **dnd-kit Docs:** https://docs.dndkit.com/
2. **React Admin Docs:** https://marmelab.com/react-admin/
3. **Supabase Docs:** https://supabase.com/docs
4. **Zod Validation:** https://zod.dev/

### Code Examples
**Junction table sync pattern:**
- `src/atomic-crm/opportunities/diffProducts.ts` (already implemented)

**JSONB array handling:**
- `src/atomic-crm/contacts/ContactInputs.tsx` (email/phone arrays)

**React Admin patterns:**
- `src/atomic-crm/organizations/OrganizationList.tsx` (advanced filtering)
- `src/atomic-crm/opportunities/OpportunityShow.tsx` (detail page layout)

---

## 📈 Success Metrics

### Technical Metrics
- **Test Coverage:** 90%+ for principal, 85%+ for drag-drop, 80%+ overall
- **Performance:** Kanban renders in < 500ms for 1000 opportunities
- **Bugs:** < 5 critical bugs in production first month
- **Code Quality:** All TypeScript strict mode passing

### User Metrics
- **Principal Tracking:** 100% of opportunities have principal assigned
- **Kanban Adoption:** 80% of users use Kanban view weekly
- **Trade Show Workflow:** Successfully used at first trade show
- **Data Entry Speed:** Faster than Excel (user feedback)

---

## 🎉 Phase 3 Complete When...

### Must Have (Blocking Launch)
- [x] ⭐ Every opportunity has ONE principal (required field)
- [x] ⭐ Products automatically filter by selected principal
- [x] ⭐ Principal displayed prominently in all views
- [x] Kanban board drag-and-drop works smoothly
- [x] Stage changes create activity logs
- [x] Junction tables reliable (no data loss)
- [x] 90%+ test coverage for principal features
- [x] All E2E tests passing

### Nice to Have (Can Be Post-Launch)
- [ ] Audit trail implemented (can use activity log as fallback)
- [ ] Campaign grouped view polished
- [ ] Bulk actions for >100 opportunities
- [ ] Advanced filters saved as user preferences

---

## 🚀 Next Steps

1. **Read the full breakdown:** `phase3-opportunities.md`
2. **Review dependencies:** `phase3-dependencies.md`
3. **Start Week 1 spikes:** Complete 3 spikes on Day 1
4. **Track progress:** Update `phase3-checklist.md` daily
5. **Ask questions:** Clarify anything unclear BEFORE starting

---

**Good luck! Remember: Principal tracking is #1 priority. Test it thoroughly!**

**Last Updated:** 2025-11-03
**Status:** Ready to Begin
**Estimated Completion:** 3.5-4 weeks from start
