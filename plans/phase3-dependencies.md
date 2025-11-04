# Phase 3: Task Dependencies & Critical Path

**Visual guide to task dependencies and parallel work streams**

---

## Critical Path Visualization

```
START
  │
  ├─── [SPIKES - Week 1] ───────────────────────────────────┐
  │    │                                                      │
  │    ├─ P3-E2-S1-T1: Drag-drop library evaluation (3h)    │
  │    ├─ P3-E3-S1-T1: Campaign grouping design (2h)        │
  │    └─ P3-E7-S3-T1: Audit trail approach (3h)            │
  │                                                           │
  ├─── [DATABASE - Week 1] ─────────────────────────────────┤
  │    │                                                      │
  │    ├─ P3-E1-S1-T1: Add campaign field (1h)              │
  │    ├─ P3-E1-S1-T2: Add related_opportunity_id (1.5h)    │
  │    ├─ P3-E1-S1-T3: Update opps view (0.5h)              │
  │    ├─ P3-E1-S2-T1: Create opp_contacts junction (2h)    │
  │    ├─ P3-E1-S2-T2: Migrate contact_ids (2h) ⚠️          │
  │    ├─ P3-E1-S2-T3: Drop contact_ids column (0.5h)       │
  │    └─ P3-E1-S3-T1: Add notes field (0.5h)               │
  │                                                           │
  ├─── [KANBAN - Week 2] ───────────────────────────────────┤
  │    │                                                      │
  │    ├─ P3-E2-S1-T2: Install dnd-kit (1h)                 │
  │    ├─ P3-E2-S2-T1: KanbanBoard container (2h)           │
  │    ├─ P3-E2-S2-T2: KanbanColumn component (2h)          │
  │    ├─ P3-E2-S2-T3: Enhance OpportunityCard (3h)         │
  │    ├─ P3-E2-S3-T1: Drag handlers (4h) ⚠️                │
  │    ├─ P3-E2-S3-T2: Stage change modal (2h)              │
  │    ├─ P3-E2-S3-T3: Backend stage update (2h)            │
  │    ├─ P3-E2-S4-T1: ⭐ KanbanFilterToolbar (4h)          │
  │    ├─ P3-E2-S4-T2: Per-column sorting (2h)              │
  │    └─ P3-E2-S4-T3: Integrate filters (2h)               │
  │                                                           │
  ├─── [PRODUCTS ⭐ - Week 2] ──────────────────────────────┤
  │    │                                                      │
  │    ├─ P3-E4-S1-T1: Index products.principal (0.5h)      │
  │    ├─ P3-E4-S1-T2: ⭐ Filter products by principal (3h) │
  │    ├─ P3-E4-S1-T3: Principal column in list (1h)        │
  │    ├─ P3-E4-S2-T1: ProductAssociationList (3h)          │
  │    ├─ P3-E4-S2-T2: Products table on Show (2h)          │
  │    └─ P3-E4-S2-T3: opportunity_products sync (4h) ⚠️    │
  │                                                           │
  ├─── [AUTO-NAME - Week 2] ────────────────────────────────┤
  │    │                                                      │
  │    ├─ P3-E5-S1-T1: Generate name function (2h)          │
  │    ├─ P3-E5-S1-T2: Auto-generate button (2h)            │
  │    └─ P3-E5-S1-T3: Naming convention help (0.5h)        │
  │                                                           │
  ├─── [CAMPAIGN - Week 3] ─────────────────────────────────┤
  │    │                                                      │
  │    ├─ P3-E3-S1-T2: Campaign field in form (2h)          │
  │    ├─ P3-E3-S1-T3: Campaign filter (1.5h)               │
  │    ├─ P3-E3-S1-T4: Campaign grouped view (4h) ⚠️        │
  │    ├─ P3-E3-S2-T1: Related opp field in form (2h)       │
  │    ├─ P3-E3-S2-T2: Related opps on detail (2h)          │
  │    └─ P3-E3-S2-T3: Quick add booth visitor (3h) ⚠️      │
  │                                                           │
  ├─── [LIST VIEW - Week 3] ────────────────────────────────┤
  │    │                                                      │
  │    ├─ P3-E6-S1-T1: ⭐ Prominent principal column (1h)   │
  │    ├─ P3-E6-S1-T2: ⭐ Principal filter (1.5h)           │
  │    ├─ P3-E6-S2-T1: ⭐ "By Principal" view (3h) ⚠️       │
  │    ├─ P3-E6-S2-T2: "My Opportunities" view (1h)         │
  │    ├─ P3-E6-S2-T3: Additional preset views (2h)         │
  │    ├─ P3-E6-S3-T1: Bulk selection (2h)                  │
  │    ├─ P3-E6-S3-T2: Bulk actions toolbar (4h)            │
  │    └─ P3-E6-S3-T3: ⭐ Bulk CSV export (2h)              │
  │                                                           │
  ├─── [DETAIL VIEW - Week 3-4] ────────────────────────────┤
  │    │                                                      │
  │    ├─ P3-E7-S1-T1: ⭐ 3-org header display (2h)         │
  │    ├─ P3-E7-S1-T2: Workflow management section (3h)     │
  │    ├─ P3-E7-S2-T1: Quick add activity form (2h)         │
  │    ├─ P3-E7-S2-T2: Activity filtering (2h)              │
  │    ├─ P3-E7-S3-T2: Create audit_trail table (2h)        │
  │    ├─ P3-E7-S3-T3: Audit triggers (4h) ⚠️               │
  │    └─ P3-E7-S3-T4: ChangeLog tab (3h)                   │
  │                                                           │
  └─── [TESTING - Week 4] ──────────────────────────────────┘
       │
       ├─ P3-E8-S1-T1: ⭐ Test principal filtering (3h)
       ├─ P3-E8-S1-T2: Test drag-and-drop (4h)
       ├─ P3-E8-S1-T3: Test campaign grouping (2h)
       ├─ P3-E8-S1-T4: Test auto-generate name (1.5h)
       ├─ P3-E8-S2-T1: ⭐ E2E: Create with products (3h)
       ├─ P3-E8-S2-T2: E2E: Kanban drag-drop (3h) ⚠️
       ├─ P3-E8-S2-T3: E2E: Campaign workflow (2h)
       ├─ P3-E8-S3-T1: ⭐ Doc: Principal tracking (2h)
       ├─ P3-E8-S3-T2: Doc: Trade show workflow (2h)
       └─ P3-E8-S3-T3: Doc: Junction tables (1h)
       │
      END
```

---

## Parallel Work Streams

### Stream 1: Database Foundation (Days 1-3)
**Team Member A:**
```
Day 1: Spikes (drag-drop, campaign, audit)
Day 2: Database migrations (campaign, related_opp)
Day 3: Junction tables (opportunity_contacts)
```

**Dependencies:** None (can start immediately)

---

### Stream 2: Kanban Board (Days 4-8)
**Team Member A:**
```
Day 4: Setup dnd-kit, KanbanBoard container
Day 5: KanbanColumn, OpportunityCard enhancement
Day 6: Drag handlers implementation
Day 7: Stage change modal, backend integration
Day 8: Filter toolbar, sorting, data fetching
```

**Dependencies:**
- Requires: Database migrations complete
- Requires: Drag-drop spike complete

---

### Stream 3: Products & Principal Filtering ⭐ (Days 4-8)
**Team Member B (HIGHEST PRIORITY):**
```
Day 4: Index products.principal
Day 5: Product dropdown filtering by principal
Day 6: ProductAssociationList component
Day 7: Products table on detail page
Day 8: opportunity_products sync logic + testing
```

**Dependencies:**
- Requires: Database migrations complete
- **CRITICAL:** Must complete before testing phase

---

### Stream 4: Auto-Generate Name (Days 7-8)
**Team Member B:**
```
Day 7 PM: Generate name function + tests
Day 8 AM: Auto-generate button in form
Day 8 PM: Naming convention helper text
```

**Dependencies:**
- Requires: Basic opportunity form exists (already done)

---

### Stream 5: Campaign Features (Days 9-12)
**Team Member A:**
```
Day 9: Campaign field in form, campaign filter
Day 10: Campaign grouped list view
Day 11: Related opportunity linking
Day 12: Quick add booth visitor workflow
```

**Dependencies:**
- Requires: Campaign database fields (E1-S1)
- Requires: Campaign spike decision

---

### Stream 6: List View Enhancements (Days 9-13)
**Team Member B:**
```
Day 9: Principal column prominence + filter
Day 10: "By Principal" grouped view
Day 11: Preset views (My Opps, Closing This Month, etc.)
Day 12: Bulk selection checkboxes
Day 13: Bulk actions toolbar + CSV export
```

**Dependencies:**
- Requires: Basic list view exists (already done)
- Requires: Principal filter design

---

### Stream 7: Detail View Enhancements (Days 11-15)
**Team Member A:**
```
Day 11: 3-org header display
Day 12: Workflow management section
Day 13: Quick add activity + filtering
Day 14: Audit trail table + triggers
Day 15: ChangeLog tab component
```

**Dependencies:**
- Requires: Detail page exists (already done)
- Requires: Audit trail spike decision

---

### Stream 8: Testing & Documentation (Days 16-20)
**Both Team Members:**
```
Day 16: Unit tests (principal filtering, drag-drop)
Day 17: Unit tests (campaign grouping, auto-name)
Day 18: E2E tests (create with products, kanban)
Day 19: E2E test (campaign workflow)
Day 20: Documentation (principal tracking, trade show, architecture)
```

**Dependencies:**
- Requires: All features complete

---

## Task Dependency Matrix

### No Dependencies (Can Start Immediately)
- P3-E2-S1-T1: Drag-drop library spike
- P3-E3-S1-T1: Campaign grouping spike
- P3-E7-S3-T1: Audit trail spike
- P3-E1-S1-T1: Add campaign field
- P3-E1-S1-T2: Add related_opportunity_id
- P3-E1-S3-T1: Add notes field
- P3-E4-S1-T1: Index products.principal
- P3-E5-S1-T1: Generate name function

### Low Dependencies (1-2 prerequisites)
- P3-E1-S1-T3: Update opps view → Requires: E1-S1-T1, E1-S1-T2
- P3-E1-S2-T2: Migrate contact_ids → Requires: E1-S2-T1
- P3-E1-S2-T3: Drop contact_ids → Requires: E1-S2-T2
- P3-E2-S1-T2: Install dnd-kit → Requires: E2-S1-T1
- P3-E4-S1-T2: Filter products by principal → Requires: E4-S1-T1

### Medium Dependencies (3-4 prerequisites)
- P3-E2-S2-T1: KanbanBoard → Requires: E2-S1-T2, database migrations
- P3-E2-S2-T3: OpportunityCard → Requires: E2-S2-T1, E2-S2-T2
- P3-E3-S1-T2: Campaign field in form → Requires: E1-S1-T1, E3-S1-T1
- P3-E4-S2-T1: ProductAssociationList → Requires: E4-S1-T2
- P3-E6-S1-T1: Principal column → Requires: E4-S1-T2

### High Dependencies (5+ prerequisites)
- P3-E2-S3-T1: Drag handlers → Requires: All E2-S2 tasks
- P3-E2-S4-T1: KanbanFilterToolbar → Requires: E2-S2-T1
- P3-E3-S1-T4: Campaign grouped view → Requires: E3-S1-T2, E3-S1-T3
- P3-E4-S2-T3: opportunity_products sync → Requires: E4-S2-T1, E4-S2-T2
- P3-E8-S2-T1: E2E test products → Requires: All E4 tasks

### Testing Phase Dependencies
All Epic 8 tasks require their respective feature epics to be complete:
- E8-S1-T1 (principal tests) → Requires: Epic 4 complete
- E8-S1-T2 (drag-drop tests) → Requires: Epic 2 complete
- E8-S1-T3 (campaign tests) → Requires: Epic 3 complete
- E8-S2-T1 (E2E products) → Requires: Epic 4 complete
- E8-S2-T2 (E2E kanban) → Requires: Epic 2 complete
- E8-S2-T3 (E2E campaign) → Requires: Epic 3 complete

---

## Blocking Tasks (High Risk of Delaying Others)

### 🔴 Critical Blockers
1. **P3-E2-S1-T1** - Drag-drop library spike
   - **Blocks:** All of Epic 2 (Kanban)
   - **Impact:** 12 tasks, 30 hours
   - **Mitigation:** Complete in first 3 hours of Week 1

2. **P3-E4-S1-T2** - ⭐ Products filtered by principal
   - **Blocks:** Product association UI, testing
   - **Impact:** 6+ tasks
   - **Mitigation:** Highest priority, 95%+ test coverage

3. **P3-E1-S2-T2** - Migrate contact_ids to junction
   - **Blocks:** Dropping old column, contact features
   - **Impact:** Data integrity risk
   - **Mitigation:** Manual verification before proceeding

### 🟡 Medium Blockers
4. **P3-E3-S1-T1** - Campaign grouping spike
   - **Blocks:** Campaign UI implementation
   - **Impact:** 6 tasks, 20 hours
   - **Mitigation:** Complete in Week 1

5. **P3-E7-S3-T1** - Audit trail spike
   - **Blocks:** Change log feature
   - **Impact:** 3 tasks, 9 hours
   - **Mitigation:** Can proceed with other work in parallel

---

## Recommended Task Sequence

### Week 1: Foundation (Days 1-5)
```
Day 1 (Both):
  - Complete all 3 spikes (8h total)
  - Decision: Drag-drop library, campaign approach, audit approach

Day 2 (Team A):
  - P3-E1-S1-T1: Campaign field (1h)
  - P3-E1-S1-T2: Related_opportunity_id (1.5h)
  - P3-E1-S1-T3: Update view (0.5h)
  - P3-E1-S3-T1: Notes field (0.5h)

Day 2 (Team B):
  - P3-E4-S1-T1: Index principal (0.5h)
  - P3-E4-S1-T2: ⭐ Filter products by principal (3h)
  - P3-E4-S1-T3: Principal column (1h)

Day 3 (Team A):
  - P3-E1-S2-T1: Create opp_contacts junction (2h)
  - P3-E1-S2-T2: Migrate contact_ids (2h)
  - Manual verification of migration (1h)

Day 3 (Team B):
  - P3-E4-S2-T1: ProductAssociationList (3h)
  - P3-E4-S2-T2: Products table on Show (2h)

Day 4-5 (Team A):
  - Start Epic 2 (Kanban board layout)

Day 4-5 (Team B):
  - P3-E4-S2-T3: opportunity_products sync (4h)
  - Start Epic 5 (Auto-generate name)
```

### Week 2: Core Features (Days 6-10)
```
Team A: Complete Epic 2 (Kanban + drag-drop)
Team B: Complete Epic 5 (Auto-name) + Start Epic 6 (List view)
```

### Week 3: Views & Workflow (Days 11-15)
```
Team A: Complete Epic 3 (Campaign) + Epic 7 (Detail view)
Team B: Complete Epic 6 (List view)
```

### Week 4: Testing & Polish (Days 16-20)
```
Both: Epic 8 (Testing + Documentation)
```

---

## Risk Mitigation for Dependencies

### Risk: Drag-drop spike takes longer than expected
**Impact:** Delays entire Epic 2 (30 hours of work)
**Mitigation:**
- Time-box spike to 3 hours max
- Have backup plan (simple state-based board without drag-drop)
- Can build Kanban layout while drag-drop is in progress

### Risk: Products filtering breaks existing functionality
**Impact:** High - this is ⭐ CRITICAL feature
**Mitigation:**
- Comprehensive testing (95% coverage target)
- Feature flag to enable/disable new filtering
- Staged rollout (test with subset of users first)

### Risk: Contact migration loses data
**Impact:** Very High - data integrity critical
**Mitigation:**
- Backup database before migration
- Manual verification step between T2 and T3
- Rollback script prepared
- Dry run on dev/staging first

### Risk: Audit trail impacts performance
**Impact:** Medium - could slow down all opportunity updates
**Mitigation:**
- Benchmark trigger overhead (target: <50ms)
- Make triggers optional via feature flag
- Consider async audit logging if synchronous is slow
- Table partitioning if needed

---

## Parallelization Opportunities

### Maximum Parallelization (2 developers)

**Week 1-2: 4 streams can run in parallel:**
1. Database migrations (Team A)
2. Products filtering ⭐ (Team B)
3. Kanban board (Team A, after migrations)
4. Auto-generate name (Team B, after products)

**Week 3: 2 streams can run in parallel:**
1. Campaign + Detail view (Team A)
2. List view enhancements (Team B)

**Week 4: Testing can be split:**
1. Unit tests + principal docs (Team A)
2. E2E tests + trade show docs (Team B)

---

**Last Updated:** 2025-11-03
**Status:** Planning Complete
**Next Action:** Review dependencies with team before kickoff
