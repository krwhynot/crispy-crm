# CRM Implementation Master Plan
**Generated:** November 3, 2025
**PRD Version:** 1.5
**Total Duration:** 10 weeks
**Total Tasks:** ~226 tasks
**Overall Confidence:** 84.95%

---

## Executive Summary

This master plan coordinates the implementation of Crispy-CRM across 6 phases, transforming a 3,900-line PRD into actionable tasks. The plan emphasizes **Principal tracking** ⭐ as the #1 priority while maintaining "radical simplicity" throughout.

---

## Phase Overview

| Phase | Name | Duration | Tasks | Hours | Confidence | Status |
|-------|------|----------|-------|-------|------------|--------|
| **[Phase 1](phase1-foundation.md)** | Foundation | Weeks 1-2 | 40 | 92h | 82% | ✅ Complete* |
| **[Phase 2](phase2-core-entities.md)** | Core Entities | Weeks 3-4 | 82 | 180h | 85% | 🔄 In Progress |
| **[Phase 3](phase3-opportunities.md)** | Opportunities ⭐ | Weeks 5-6 | 61 | 139h | 78% | 📋 Planned |
| **[Phase 4](phase4-user-experience.md)** | User Experience | Weeks 7-8 | 43 | 80h → 48h actual | 60% | 🔄 93% Complete** |
| **[Phase 5](phase5-data-reports.md)** | Data & Reports | Week 9 | 39 | 65h | 87% | 📋 Planned |
| **[Phase 6](phase6-production.md)** | Production Ready | Week 10 | 24 | 40h | 75% | 📋 Planned |

*Note: Phase 1 already implemented in current codebase
**Note: Phase 4 is 93% complete - 4 of 6 epics done (Dashboard, Notifications, iPad Touch, Keyboard). Epic 2 (Advanced Search) skipped as redundant. Only ~6h remaining for Epic 4 (Activity: search & export).

---

## Critical Path

The following must be completed in sequence:

```
1. Foundation (Complete) ✅
   ↓
2. Core Entities - Organizations & Contacts
   ↓
3. Opportunities - Principal Tracking ⭐ (BLOCKING)
   ↓
4. Dashboard & Search (can parallelize)
   ↓
5. Reports (requires all entities)
   ↓
6. Production Optimization
```

---

## Confidence Heat Map

### High Confidence (>85%) ✅
- Phase 1: Authentication, layouts, routing
- Phase 5: Reports, CSV export
- Phase 6: Error handling, monitoring

### Medium Confidence (70-85%) ⚠️
- Phase 2: Flexible segments, JSONB arrays
- Phase 3: Kanban drag-drop
- Phase 4: Dashboard widgets

### Lower Confidence (<70%) 🔴
- **Advanced Search** (Phase 4): 55-65% - Complex full-text with operators
- **Campaign Grouping** (Phase 3): 60% - New UI pattern
- **Service Worker** (Phase 6): 65% - Offline mode complexity
- **CSV Column Mapping** (Phase 5): 60% - Interactive UI required

---

## Risk Mitigation Strategy

### 1. Research Spikes (11 total across phases)
- **Phase 2:** Flexible combo box (3h), JSONB arrays (3h)
- **Phase 3:** Drag-drop library (3h), Campaign design (3h), Audit trail (2h)
- **Phase 4:** Full-text search (3h), Operator parsing (2h), Search history (2h)
- **Phase 5:** Column mapping UI (2h), Encoding detection (2h), Field matching (3h)
- **Phase 6:** Performance profiling (2h), Service Worker (3h)

### 2. Progressive Enhancement
- Start with basic features, add complexity
- Example: Search can launch with exact match, add operators later

### 3. Fallback Plans
- Every <70% confidence task has documented fallback
- Example: If drag-drop complex, use button-based stage changes

---

## Resource Allocation

### Developer 1 (Senior)
- **Focus:** Complex features, architecture
- **Phases:** Lead on Phase 3 (Opportunities), Phase 4 (Search)
- **Key tasks:** Principal tracking ⭐, Advanced search, Kanban board

### Developer 2 (if available)
- **Focus:** Supporting features, testing
- **Phases:** Lead on Phase 2 (Entities), Phase 5 (Reports)
- **Key tasks:** CSV import/export, Reports, Data validation

### Solo Developer Strategy
- Complete phases sequentially
- Use confidence ratings to allocate buffer time
- Low confidence = +50% time buffer

---

## Weekly Milestones

### Weeks 1-2: Foundation ✅
- Authentication, routing, layouts
- Steel thread (Contact CRUD)
- **Deliverable:** Working app shell

### Weeks 3-4: Core Entities
- Organizations complete with flexible segments
- Contacts with JSONB arrays
- **Deliverable:** Two functional modules

### Weeks 5-6: Opportunities ⭐
- Principal tracking throughout
- Kanban board operational
- Trade show workflow
- **Deliverable:** Core sales pipeline

### Weeks 7-8: User Experience
- Dashboard with 6 widgets
- Advanced search system
- Notifications, activity tracking
- **Deliverable:** Complete UX layer

### Week 9: Data & Reports
- 3 core reports (Principal ⭐, Activity, Exports)
- CSV import with mapping
- Bulk delete
- **Deliverable:** Data portability

### Week 10: Production
- Performance optimization (<2s load)
- Offline mode (read-only)
- Error handling system
- **Deliverable:** Production-ready application

---

## Success Criteria

### Must Have (MVP)
- [ ] Principal tracking on every opportunity ⭐
- [ ] Basic CRUD for all 4 entities
- [ ] CSV import/export
- [ ] 3 reports (Principal focus)
- [ ] Fixed dashboard
- [ ] Search (at minimum: module-level)

### Should Have
- [ ] Advanced search with operators
- [ ] Kanban drag-drop
- [ ] Campaign grouping
- [ ] Activity tracking
- [ ] In-app notifications

### Nice to Have
- [ ] Offline mode
- [ ] Keyboard shortcuts
- [ ] Search history
- [ ] Performance <2s everywhere

---

## Quality Gates

Each phase must pass before proceeding:

1. **Code Review:** Self-review via PR
2. **Testing:** 80% coverage minimum
3. **Documentation:** README updated
4. **Performance:** Targets met
5. **Accessibility:** WCAG 2.1 AA

---

## Dependencies Between Phases

```
Phase 1 → All phases (foundation required)
Phase 2 → Phase 3 (entities needed for opportunities)
Phase 2 → Phase 5 (entities needed for reports)
Phase 3 → Phase 4 (opportunities for dashboard)
Phase 3 → Phase 5 (opportunities for principal report)
Phase 4 → None (independent)
Phase 5 → Phase 6 (reports affect performance)
```

---

## Technology Stack Alignment

All phases use consistent stack:
- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS 4, OKLCH colors
- **State:** Zustand, TanStack Query
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Deployment:** Vercel + Supabase Cloud

---

## Budget & Timeline

### Time Budget
- **Total:** 596 hours (~15 weeks at 40h/week)
- **With parallelization:** ~10 weeks (2 developers)
- **Solo developer:** ~15 weeks
- **With confidence buffers:** +20% = 18 weeks realistic

### Complexity Budget
- **One complex system:** Advanced search (Phase 4)
- **Everything else:** Radical simplicity
- **No unnecessary features:** No API, no webhooks, no i18n

---

## Communication Plan

### Daily
- Update phase checklist
- Log blockers in DEPENDENCIES.md

### Weekly
- Review completed tasks
- Adjust confidence ratings
- Update RISK_REGISTER.md

### Phase Completion
- Demo to stakeholders
- Update master plan status
- Document lessons learned

---

## Next Steps

1. **Review all phase plans** with team
2. **Set up project board** with task IDs
3. **Complete Phase 2** (Core Entities) - currently in progress
4. **Begin Phase 3** - Opportunities with Principal tracking ⭐
5. **Schedule spikes** early in each phase

---

## Document Index

### Phase Plans
- [Phase 1: Foundation](phase1-foundation.md)
- [Phase 2: Core Entities](phase2-core-entities.md)
- [Phase 3: Opportunities](phase3-opportunities.md)
- [Phase 4: User Experience](phase4-user-experience.md)
- [Phase 5: Data & Reports](phase5-data-reports.md)
- [Phase 6: Production Ready](phase6-production.md)

### Supporting Documents
- [Dependencies Map](DEPENDENCIES.md)
- [Steel Thread Guide](STEEL_THREAD.md)
- [Risk Register](RISK_REGISTER.md)
- [Spike Tasks](SPIKE_TASKS.md)
- [Task Template](TASK_TEMPLATE.md)

---

*This master plan is a living document. Update weekly as implementation progresses.*