# Phase 3: Opportunities & Sales - Executive Summary

**Document:** Detailed task breakdown for completing Opportunities module
**Location:** `/home/krwhynot/projects/crispy-crm/plans/phase3-opportunities.md`
**Total Tasks:** 61 tasks (~139 hours, ~3.5 weeks with 2 developers)

---

## 🎯 Top Priority: Principal Tracking ⭐

**Why this matters:** Principal tracking is marked with ⭐ throughout the PRD as the #1 most important feature. Every opportunity represents a deal with ONE specific brand/manufacturer (principal). This enables:

- Multi-brand sales reps to manage separate pipelines
- Accurate reporting by brand
- Trade show tracking (separate opportunities per principal)
- Commission and performance tracking per brand

**Key Requirements:**
- 90%+ test coverage for principal features
- Principal field REQUIRED for all opportunities
- Products filtered by selected principal
- Principal displayed prominently in ALL views
- "By Principal" reports and groupings

---

## Epic Breakdown (8 Epics)

### Epic 1: Database Schema & Junction Tables (7 tasks, ~9 hours)
**Focus:** Campaign field, related_opportunity field, opportunity_contacts junction table

**Critical Tasks:**
- Replace contact_ids array with proper M:N junction table
- Add campaign TEXT field for trade show grouping
- Add related_opportunity_id for linking opportunities

**Risk:** Contact_ids migration needs careful testing (85% confidence)

---

### Epic 2: Kanban Board with Drag-and-Drop (12 tasks, ~30 hours)
**Focus:** Visual pipeline board with stage management

**Critical Tasks:**
- Drag-drop library evaluation spike (recommend: dnd-kit)
- Kanban board layout with 8 stage columns
- Drag-and-drop with confirmation modal
- Principal filter (TOP priority in filter toolbar)
- Stage change creates activity log

**Risks:**
- Drag-drop state management complexity (70% confidence)
- Performance with 200+ cards (need virtualization)

**Key Features:**
- Horizontal scrollable stage columns
- Visual feedback during drag (lift, shadow, highlight)
- Per-column sorting (by date, priority, principal name ⭐)
- Stage change confirmation with optional note

---

### Epic 3: Campaign Grouping & Trade Show Workflow (7 tasks, ~20 hours)
**Focus:** Multi-principal trade show opportunity tracking

**Critical Tasks:**
- Campaign field in form (text input with autocomplete)
- Campaign-grouped list view
- Related opportunity linking (parent-child)
- Quick add booth visitor workflow

**Business Scenario:**
- Sales rep meets customer about 3 principals at NRA Show
- Creates 3 separate opportunities (one per principal)
- Groups via campaign: "NRA Show 2025"
- Can link booth visitor minimal opps to full opportunities

**Risk:** Campaign UI grouping pattern is new (65% confidence)

---

### Epic 4: Products Module Enhancement (6 tasks, ~15 hours)
**Focus:** ⭐ Products filtered by principal (CRITICAL)

**Critical Tasks:**
- Products dropdown ONLY shows products matching selected principal
- Product dropdown disabled until principal selected
- Sync opportunity_products junction table
- Display products table on detail page

**Testing Priority:** 95%+ coverage (high risk if broken)

**Key Pattern:**
```
1. User selects Principal: "Ocean Hugger Foods"
2. Products dropdown shows ONLY Ocean Hugger products
3. If principal changes → clear incompatible products (with confirmation)
```

---

### Epic 5: Opportunity Auto-Generate Name (3 tasks, ~4.5 hours)
**Focus:** Automatic name generation from customer + principal + quarter

**Example:** "Nobu Miami - Ocean Hugger - Q1 2025"

**Features:**
- Refresh button next to name field
- Format: {Customer} - {Principal} - Q{quarter} {year}
- Naming convention helper text with examples
- User can edit generated name

---

### Epic 6: List View Enhancements (9 tasks, ~17 hours)
**Focus:** ⭐ Principal-centric filtering and views

**Critical Tasks:**
- Principal column prominent (3rd position, bold, icon)
- Principal filter at TOP of filter panel ⭐
- "By Principal" saved view (grouped list)
- Preset views: My Opps, Closing This Month, High Priority, Needs Action, Recent Wins
- Bulk actions: Change Status/Stage, Assign Owner, Add Tags
- CSV export with Principal column ⭐

---

### Epic 7: Detail View Enhancements (8 tasks, ~21 hours)
**Focus:** 3-organization display and audit trail

**Critical Tasks:**
- 3-org card: Customer, ⭐ Principal (prominent), Distributor
- Workflow section: tags, next action, decision criteria
- Quick add activity form
- Change log / audit trail tab (field-level history)

**Audit Trail Features:**
- Track ALL field changes (old → new)
- Filter by field, user, date
- Export to CSV
- Per ADR-0006 recommendations

**Risk:** Audit trail implementation needs spike (60% confidence on approach)

---

### Epic 8: Testing & Documentation (9 tasks, ~22.5 hours)
**Focus:** Comprehensive testing and user guides

**Test Coverage Goals:**
- ⭐ Principal tracking: 90%+
- Drag-and-drop: 85%+
- Junction tables: 85%+
- Campaign grouping: 80%+
- Overall: 80%+

**E2E Tests:**
- Create opportunity with principal and filtered products
- Kanban drag-drop workflow
- Campaign grouping for trade show

**Documentation:**
- Principal tracking user guide ⭐
- Trade show workflow guide
- Junction table architecture docs

---

## Task Distribution by Confidence

| Confidence | Count | Percentage |
|------------|-------|------------|
| High (90-100%) | 32 tasks | 52% |
| Medium (80-89%) | 19 tasks | 31% |
| Lower (60-79%) | 10 tasks | 17% |

**Lower Confidence Areas (Need Extra Attention):**
1. Drag-drop library spike (70%)
2. Drag-drop state management (70%)
3. Campaign grouping UI (65%)
4. Trade show workflow (70%)
5. Audit trail approach (60%)
6. Bulk actions transactions (85%)

---

## Critical Path (Must Complete First)

These tasks block other work and should be prioritized:

1. **P3-E1-S1-T1:** Add campaign field (blocks campaign features)
2. **P3-E1-S1-T2:** Add related_opportunity_id (blocks trade show linking)
3. **P3-E1-S2-T1:** Create opportunity_contacts junction (blocks contact migration)
4. **P3-E2-S1-T1:** Drag-drop library spike (blocks kanban development)
5. **P3-E4-S1-T2:** ⭐ Products filtered by principal (HIGH PRIORITY, blocks testing)
6. **P3-E7-S3-T1:** Audit trail spike (blocks change log feature)

---

## Dependencies & Prerequisites

### ✅ Already Completed (Verified)
- Organizations module with 3-org model (Customer, Principal, Distributor)
- Contacts module with organization associations
- Products module (basic CRUD)
- Opportunities module (basic CRUD, list, detail)
- opportunity_products junction table (schema exists)
- Activity log table and components
- Opportunity stages (8 stages defined)
- Validation schemas (Zod)

### ⚙️ Need to Add
- Campaign field to opportunities
- Related opportunity field
- opportunity_contacts junction table
- Audit trail table
- Drag-drop library (@dnd-kit)

---

## Success Criteria for Phase 3

Phase 3 is **COMPLETE** when:

### 1. ⭐ Principal Tracking (Highest Priority)
- [x] Every opportunity has exactly ONE principal
- [x] Products automatically filter by selected principal
- [x] Principal displayed prominently in list, kanban, detail views
- [x] "By Principal" grouped view works
- [x] CSV exports include principal column
- [x] 90%+ test coverage for principal features

### 2. Kanban Board
- [x] Drag-and-drop between stages functional
- [x] Stage changes show confirmation modal
- [x] Activity log entries created automatically
- [x] Filters work (especially ⭐ Principal filter)
- [x] Performance: < 500ms render for 1000 opportunities

### 3. Trade Show Workflow
- [x] Campaign field groups related opportunities
- [x] Related opportunities link correctly (parent-child)
- [x] Quick add booth visitor works
- [x] Campaign-grouped list view displays correctly

### 4. Junction Tables
- [x] opportunity_products sync reliable (create/update/delete)
- [x] opportunity_contacts migration complete (no data loss)
- [x] Data integrity verified

### 5. Testing & Documentation
- [x] 90%+ coverage for principal features
- [x] 85%+ coverage for drag-drop
- [x] 80%+ coverage for junction tables
- [x] All E2E tests passing
- [x] User guides published

---

## Risk Mitigation Strategies

### Risk: Drag-drop complexity (70% confidence)
**Mitigation:**
- Complete library evaluation spike FIRST
- Build simple prototype before production implementation
- Implement thorough error handling and rollback
- Add optimistic UI updates with fallback

### Risk: Campaign grouping UI (65% confidence)
**Mitigation:**
- Create mockups and get user feedback early
- Start with simple list grouping before complex UI
- Make accordion/expansion pattern reusable
- Test with real trade show data

### Risk: Audit trail performance (75% confidence)
**Mitigation:**
- Complete implementation spike (PostgreSQL triggers vs app-level)
- Benchmark with 10k+ change records
- Add table partitioning if needed
- Index on (entity_id, changed_at) for query performance

### Risk: Products filtering breakage (85% confidence)
**Mitigation:**
- ⭐ HIGH PRIORITY: 95%+ test coverage
- Validation prevents saving invalid product-principal combinations
- Confirmation modal when principal change would clear products
- E2E test covers full workflow

---

## Open Questions (Need Product Owner Input)

1. **Campaign Table:** Start with TEXT field or create separate campaigns table?
   - **Recommendation:** TEXT field (simpler MVP), migrate later if needed

2. **Audit Trail:** Which fields need change tracking?
   - **Recommendation:** stage, status, priority, organizations, products, owner

3. **Bulk Actions:** Maximum opportunities for bulk operations?
   - **Recommendation:** 100 (prevents timeout/memory issues)

4. **Kanban Performance:** Card count before pagination needed?
   - **Recommendation:** 50 per column (100 total visible)

5. **Trade Show Workflow:** Any additional fields for booth visitors?
   - **Recommendation:** Start with minimal (existing fields sufficient)

---

## Delivery Timeline Estimate

**With 2 Full-Time Developers:**

### Week 1 (Days 1-5)
- Spikes: Drag-drop library, campaign grouping, audit trail
- Database migrations: Campaign, related_opp, junction tables
- Start Kanban layout

### Week 2 (Days 6-10)
- Complete Kanban board with drag-drop
- Products filtering by principal ⭐
- Campaign grouping UI

### Week 3 (Days 11-15)
- List view enhancements (filters, bulk actions)
- Detail view enhancements
- Trade show workflow

### Week 4 (Days 16-20)
- Audit trail implementation
- Comprehensive testing (unit + E2E)
- Documentation
- Bug fixes and polish

**Buffer:** 1 week for unforeseen issues

**Total:** 3.5-4.5 weeks

---

## Next Steps

1. **Review this breakdown** with product owner
2. **Answer open questions** (campaign table, audit fields, etc.)
3. **Prioritize spikes** (drag-drop, audit trail) - complete first
4. **Create GitHub issues** from tasks (use P3-E#-S#-T# IDs)
5. **Set up project board** with 8 epic columns
6. **Begin Week 1** with critical path tasks

---

**Document Version:** 1.0
**Created:** 2025-11-03
**Status:** Ready for Review
**Next Review:** Before implementation kickoff
