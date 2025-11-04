# Phase 3: Opportunities & Sales - Implementation Checklist

**Quick reference for tracking Phase 3 progress**
**Total Tasks:** 61 | **Estimated Hours:** 139 | **Timeline:** 3.5-4 weeks

---

## 🔴 CRITICAL PATH (Complete First)

- [ ] **P3-E2-S1-T1** - SPIKE: Evaluate drag-drop libraries (3h) ⚠️
- [ ] **P3-E3-S1-T1** - SPIKE: Campaign grouping data model (2h) ⚠️
- [ ] **P3-E7-S3-T1** - SPIKE: Audit trail implementation approach (3h) ⚠️
- [ ] **P3-E1-S1-T1** - Add campaign field to opportunities (1h)
- [ ] **P3-E1-S1-T2** - Add related_opportunity_id field (1.5h)
- [ ] **P3-E1-S2-T1** - Create opportunity_contacts junction table (2h)
- [ ] **P3-E4-S1-T2** - ⭐ Products filtered by principal (3h) **HIGHEST PRIORITY**

---

## Epic 1: Database Schema & Junction Tables (7 tasks, 9h)

### S1: Campaign & Trade Show Support
- [ ] P3-E1-S1-T1: Add campaign field to opportunities (1h) [95%]
- [ ] P3-E1-S1-T2: Add related_opportunity_id field (1.5h) [90%]
- [ ] P3-E1-S1-T3: Update opportunities view with campaign data (0.5h) [95%]

### S2: Opportunity-Contacts Junction Table
- [ ] P3-E1-S2-T1: Create opportunity_contacts junction table (2h) [90%]
- [ ] P3-E1-S2-T2: Migrate existing contact_ids to junction (2h) [85%] ⚠️
- [ ] P3-E1-S2-T3: Drop contact_ids array column (0.5h) [95%]

### S3: Enhanced Opportunity Fields
- [ ] P3-E1-S3-T1: Add notes field to opportunities (0.5h) [95%]

**Epic 1 Progress:** ☐☐☐☐☐☐☐ (0/7)

---

## Epic 2: Kanban Board with Drag-and-Drop (12 tasks, 30h)

### S1: Drag-and-Drop Library Research & Setup
- [ ] P3-E2-S1-T1: SPIKE - Evaluate drag-drop libraries (3h) [70%] ⚠️ **CRITICAL**
- [ ] P3-E2-S1-T2: Install and configure dnd-kit (1h) [90%]

### S2: Kanban Board Layout
- [ ] P3-E2-S2-T1: Create KanbanBoard container component (2h) [85%]
- [ ] P3-E2-S2-T2: Create KanbanColumn component (2h) [90%]
- [ ] P3-E2-S2-T3: Enhance OpportunityCard for Kanban view (3h) [85%]

### S3: Drag-and-Drop Logic
- [ ] P3-E2-S3-T1: Implement drag handlers in KanbanBoard (4h) [70%] ⚠️
- [ ] P3-E2-S3-T2: Create stage change confirmation modal (2h) [90%]
- [ ] P3-E2-S3-T3: Implement backend stage update with activity logging (2h) [85%]

### S4: Kanban Filtering & Sorting
- [ ] P3-E2-S4-T1: Create KanbanFilterToolbar component (4h) [85%] ⭐ PRINCIPAL
- [ ] P3-E2-S4-T2: Implement per-column sorting dropdown (2h) [90%]
- [ ] P3-E2-S4-T3: Integrate filters with data fetching (2h) [85%]

**Epic 2 Progress:** ☐☐☐☐☐☐☐☐☐☐☐☐ (0/12)

---

## Epic 3: Campaign Grouping & Trade Show Workflow (7 tasks, 20h)

### S1: Campaign Management
- [ ] P3-E3-S1-T1: SPIKE - Campaign grouping data model (2h) [60%] ⚠️ **CRITICAL**
- [ ] P3-E3-S1-T2: Add campaign field to OpportunityInputs form (2h) [85%]
- [ ] P3-E3-S1-T3: Create campaign filter in list/kanban views (1.5h) [90%]
- [ ] P3-E3-S1-T4: Create "Campaign View" grouped list (4h) [65%] ⚠️

### S2: Trade Show Opportunity Linking
- [ ] P3-E3-S2-T1: Add related_opportunity field to OpportunityInputs (2h) [80%]
- [ ] P3-E3-S2-T2: Display related opportunities section on detail page (2h) [85%]
- [ ] P3-E3-S2-T3: Create "Quick Add Booth Visitor" workflow (3h) [70%] ⚠️

**Epic 3 Progress:** ☐☐☐☐☐☐☐ (0/7)

---

## Epic 4: Products Module Enhancement (6 tasks, 15h)

### S1: Product-Principal Filtering
- [ ] P3-E4-S1-T1: Add principal field index to products (0.5h) [95%]
- [ ] P3-E4-S1-T2: ⭐ Update product dropdown to filter by principal (3h) [85%] **CRITICAL**
- [ ] P3-E4-S1-T3: Add principal column to products list view (1h) [95%]

### S2: Opportunity-Products Junction UI
- [ ] P3-E4-S2-T1: Create ProductAssociationList component (3h) [80%]
- [ ] P3-E4-S2-T2: Display products table on OpportunityShow (2h) [90%]
- [ ] P3-E4-S2-T3: Implement opportunity_products sync in data provider (4h) [75%] ⚠️

**Epic 4 Progress:** ☐☐☐☐☐☐ (0/6)

---

## Epic 5: Opportunity Auto-Generate Name (3 tasks, 4.5h)

### S1: Name Generation Logic
- [ ] P3-E5-S1-T1: Implement auto-generate name function (2h) [90%]
- [ ] P3-E5-S1-T2: Add auto-generate button to OpportunityInputs (2h) [85%]
- [ ] P3-E5-S1-T3: Add naming convention helper text to form (0.5h) [95%]

**Epic 5 Progress:** ☐☐☐ (0/3)

---

## Epic 6: List View Enhancements (9 tasks, 17h)

### S1: Principal Column Enhancement
- [ ] P3-E6-S1-T1: ⭐ Make principal column prominent in OpportunityRowListView (1h) [95%]
- [ ] P3-E6-S1-T2: ⭐ Add principal filter to OpportunityList filters (1.5h) [90%]

### S2: Saved Filter Views
- [ ] P3-E6-S2-T1: ⭐ Create "By Principal" saved view (3h) [70%] ⚠️
- [ ] P3-E6-S2-T2: Create "My Opportunities" saved view (1h) [95%]
- [ ] P3-E6-S2-T3: Create additional preset views (2h) [90%]

### S3: Bulk Actions
- [ ] P3-E6-S3-T1: Add bulk selection checkboxes to list view (2h) [90%]
- [ ] P3-E6-S3-T2: Implement bulk actions toolbar (4h) [85%]
- [ ] P3-E6-S3-T3: Add bulk export to CSV (2h) [90%] ⭐ PRINCIPAL

**Epic 6 Progress:** ☐☐☐☐☐☐☐☐☐ (0/9)

---

## Epic 7: Detail View Enhancements (8 tasks, 21h)

### S1: Enhanced Header Section
- [ ] P3-E7-S1-T1: ⭐ Update OpportunityShow header with 3-org display (2h) [90%]
- [ ] P3-E7-S1-T2: Add workflow management section (3h) [85%]

### S2: Activity Timeline
- [ ] P3-E7-S2-T1: Enhance activity timeline with quick add form (2h) [85%]
- [ ] P3-E7-S2-T2: Add activity filtering to timeline (2h) [85%]

### S3: Change Log / Audit Trail
- [ ] P3-E7-S3-T1: SPIKE - Audit trail implementation approach (3h) [60%] ⚠️ **CRITICAL**
- [ ] P3-E7-S3-T2: Create audit_trail table (2h) [85%]
- [ ] P3-E7-S3-T3: Implement audit trail triggers for opportunities (4h) [75%] ⚠️
- [ ] P3-E7-S3-T4: Create ChangeLog tab component (3h) [85%]

**Epic 7 Progress:** ☐☐☐☐☐☐☐☐ (0/8)

---

## Epic 8: Testing & Documentation (9 tasks, 22.5h)

### S1: Unit Tests
- [ ] P3-E8-S1-T1: ⭐ Write tests for principal filtering (3h) [95%] **CRITICAL**
- [ ] P3-E8-S1-T2: Write tests for drag-and-drop logic (4h) [85%]
- [ ] P3-E8-S1-T3: Write tests for campaign grouping (2h) [85%]
- [ ] P3-E8-S1-T4: Write tests for auto-generate name (1.5h) [95%]

### S2: Integration Tests
- [ ] P3-E8-S2-T1: ⭐ E2E test: Create opportunity with principal and products (3h) [80%]
- [ ] P3-E8-S2-T2: E2E test: Kanban drag-and-drop workflow (3h) [75%] ⚠️
- [ ] P3-E8-S2-T3: E2E test: Campaign grouping workflow (2h) [75%]

### S3: Documentation
- [ ] P3-E8-S3-T1: ⭐ Document principal tracking workflows (2h) [95%]
- [ ] P3-E8-S3-T2: Document trade show opportunity workflow (2h) [95%]
- [ ] P3-E8-S3-T3: Update architecture docs for junction tables (1h) [95%]

**Epic 8 Progress:** ☐☐☐☐☐☐☐☐☐ (0/9)

---

## Overall Phase 3 Progress

**Completion Status:**
- Epic 1: ░░░░░░░░░░ 0% (0/7)
- Epic 2: ░░░░░░░░░░ 0% (0/12)
- Epic 3: ░░░░░░░░░░ 0% (0/7)
- Epic 4: ░░░░░░░░░░ 0% (0/6)
- Epic 5: ░░░░░░░░░░ 0% (0/3)
- Epic 6: ░░░░░░░░░░ 0% (0/9)
- Epic 7: ░░░░░░░░░░ 0% (0/8)
- Epic 8: ░░░░░░░░░░ 0% (0/9)

**Total: ░░░░░░░░░░ 0% (0/61 tasks)**

---

## Priority Legend

- ⭐ = Principal tracking (highest priority, 90%+ test coverage)
- ⚠️ = Lower confidence (<80%) - needs extra attention
- **CRITICAL** = Blocking other work (critical path)

---

## Weekly Goals

### Week 1: Foundation
**Target:** Complete all 3 spikes + database migrations
- [ ] All spikes completed (drag-drop, campaign, audit trail)
- [ ] Epic 1 complete (database schema)
- [ ] Kanban layout started

### Week 2: Core Features
**Target:** Kanban board + products filtering
- [ ] Epic 2 complete (Kanban with drag-drop)
- [ ] ⭐ Epic 4 complete (products filtered by principal)
- [ ] Epic 5 complete (auto-generate names)

### Week 3: Views & Workflow
**Target:** List enhancements + trade show workflow
- [ ] Epic 3 complete (campaign grouping)
- [ ] Epic 6 complete (list view enhancements)
- [ ] Epic 7 partial (detail view enhancements)

### Week 4: Testing & Polish
**Target:** Comprehensive testing + documentation
- [ ] Epic 7 complete (audit trail)
- [ ] Epic 8 complete (testing & docs)
- [ ] All tests passing (90%+ coverage for principal features)
- [ ] Bug fixes and polish

---

## Success Checklist

Phase 3 is **COMPLETE** when:

### ⭐ Principal Tracking (HIGHEST PRIORITY)
- [ ] Every opportunity has exactly ONE principal (required field)
- [ ] Products automatically filter by selected principal
- [ ] Principal displayed prominently in all views (list, kanban, detail)
- [ ] "By Principal" grouped view works correctly
- [ ] CSV exports include principal column
- [ ] 90%+ test coverage for principal features

### Kanban Board
- [ ] Drag-and-drop between stages works smoothly
- [ ] Stage changes show confirmation modal with note option
- [ ] Activity log entries created automatically on stage change
- [ ] All filters work (especially ⭐ Principal filter)
- [ ] Performance: < 500ms render for 1000 opportunities

### Trade Show Workflow
- [ ] Campaign field groups related opportunities
- [ ] Related opportunities link correctly (parent-child)
- [ ] Quick add booth visitor workflow functional
- [ ] Campaign-grouped list view displays correctly

### Junction Tables
- [ ] opportunity_products sync reliable (create/update/delete)
- [ ] opportunity_contacts migration complete with NO data loss
- [ ] Data integrity verified with manual testing

### Testing & Documentation
- [ ] 90%+ coverage for principal features
- [ ] 85%+ coverage for drag-drop logic
- [ ] 80%+ coverage for junction tables
- [ ] All E2E tests passing
- [ ] User guides published (principal tracking, trade show workflow)

---

## Notes Section

**Blockers:**
- (Track any blockers here)

**Decisions Made:**
- (Document key decisions as they're made)

**Risks & Mitigations:**
- (Track identified risks and how they were mitigated)

---

**Last Updated:** 2025-11-03
**Status:** Not Started
**Next Review:** End of Week 1
