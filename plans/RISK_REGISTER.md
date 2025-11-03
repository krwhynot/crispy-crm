# Risk Register - Low Confidence Tasks
**Generated:** November 3, 2025
**Risk Threshold:** Tasks with <70% confidence
**Total Risk Items:** 23 tasks
**Highest Risk Phase:** Phase 4 (Advanced Search)

---

## Critical Risk Items (<50% Confidence)

### 🔴 P4-E2-S1-T2: Search Operator Parser Design
- **Phase:** 4 - User Experience
- **Confidence:** 45%
- **Estimate:** 2 hours
- **Risk:** Complex parsing logic for AND/OR/quotes/exclusions
- **Impact:** Core search functionality blocked
- **Mitigation:**
  - Research existing parser libraries
  - Consider simplified operators initially
  - Fallback: Basic keyword search only
- **Spike Required:** Yes (P4-E2-S1-T1)

---

## High Risk Items (50-60% Confidence)

### Phase 3: Opportunities

#### P3-E3-S2-T1: Campaign Grouping UI Design
- **Confidence:** 55%
- **Estimate:** 3 hours
- **Risk:** New UI pattern not in existing codebase
- **Impact:** Trade show workflow affected
- **Mitigation:** Research CRM patterns, create mockups first
- **Spike:** P3-E3-S1-T1 (required)

### Phase 4: User Experience

#### P4-E2-S4-T1: Search History Schema Design
- **Confidence:** 55%
- **Estimate:** 1 hour
- **Risk:** Storage strategy unclear
- **Impact:** History feature may be dropped
- **Mitigation:** Start with localStorage, migrate to DB later

#### P4-E2-S5-T1: Saved Searches Implementation
- **Confidence:** 55%
- **Estimate:** 3 hours
- **Risk:** Complex state management
- **Impact:** Feature could be post-MVP
- **Mitigation:** Ship without, add in Phase 2

#### P4-E2-S3-T4: Fuzzy Matching Implementation
- **Confidence:** 60%
- **Estimate:** 3 hours
- **Risk:** Performance implications unclear
- **Impact:** Could affect search speed
- **Mitigation:** Make configurable, tune in production

### Phase 5: Data & Reports

#### P5-E4-S2-T3: Intelligent Column Matching
- **Confidence:** 60%
- **Estimate:** 3 hours (after spike)
- **Risk:** Algorithm complexity
- **Impact:** Manual mapping fallback needed
- **Mitigation:** Start with exact match, enhance later

#### P5-E4-S1-T1: Column Mapping UI Research
- **Confidence:** 60%
- **Estimate:** 2 hours
- **Risk:** UX pattern unclear
- **Impact:** Affects entire import flow
- **Mitigation:** Study existing tools (Zapier, etc.)

---

## Medium Risk Items (61-69% Confidence)

### Phase 2: Core Entities

#### P2-E1-S2-T3: Flexible Segment Implementation
- **Confidence:** 65%
- **Estimate:** 3 hours
- **Risk:** Combo box pattern complex
- **Impact:** May use simple dropdown initially
- **Mitigation:** Use existing library (downshift)
- **Spike:** P2-E1-S0-T1 (research patterns)

### Phase 3: Opportunities

#### P3-E3-S3-T1: Trade Show Quick Entry
- **Confidence:** 65%
- **Estimate:** 3 hours
- **Risk:** Workflow needs validation
- **Impact:** May need user feedback
- **Mitigation:** Build basic version, iterate

#### P3-E2-S1-T2: Drag-Drop Integration
- **Confidence:** 65%
- **Estimate:** 4 hours
- **Risk:** Library integration complex
- **Impact:** Could use buttons instead
- **Mitigation:** dnd-kit has good docs
- **Spike:** P3-E2-S1-T1 (library evaluation)

#### P3-E3-S4-T1: Campaign Analytics View
- **Confidence:** 65%
- **Estimate:** 3 hours
- **Risk:** Visualization requirements unclear
- **Impact:** Could be simple list initially
- **Mitigation:** Start basic, enhance later

### Phase 4: User Experience

#### P4-E2-S2-T2: Full-Text Search Implementation
- **Confidence:** 65%
- **Estimate:** 3 hours (after spike)
- **Risk:** Supabase limitations unknown
- **Impact:** Core feature at risk
- **Mitigation:** Use pg_trgm extension
- **Spike:** P4-E2-S1-T1 (required)

#### P4-E2-S3-T5: Search Suggestions
- **Confidence:** 65%
- **Estimate:** 2 hours
- **Risk:** Performance concerns
- **Impact:** Could ship without
- **Mitigation:** Debounce, limit results

### Phase 6: Production Ready

#### P6-E2-S2-T1: Service Worker Implementation
- **Confidence:** 60%
- **Estimate:** 3 hours (after spike)
- **Risk:** Complex caching logic
- **Impact:** Offline mode at risk
- **Mitigation:** Use Workbox library
- **Spike:** P6-E2-S1-T1 (required)

#### P6-E2-S3-T1: IndexedDB Setup
- **Confidence:** 65%
- **Estimate:** 2 hours
- **Risk:** Data sync complexity
- **Impact:** Offline storage affected
- **Mitigation:** Use Dexie.js library

#### P6-E2-S4-T1: Offline UI Indicators
- **Confidence:** 68%
- **Estimate:** 2 hours
- **Risk:** State management complex
- **Impact:** UX confusion possible
- **Mitigation:** Simple banner approach

#### P6-E2-S5-T1: Cache Invalidation
- **Confidence:** 65%
- **Estimate:** 2 hours
- **Risk:** Strategy complexity
- **Impact:** Stale data possible
- **Mitigation:** Time-based expiry (24h)

---

## Risk Summary by Phase

| Phase | Total Tasks | Risk Tasks | Risk % | Highest Risk |
|-------|------------|------------|---------|--------------|
| Phase 1 | 40 | 0 | 0% | None |
| Phase 2 | 82 | 1 | 1.2% | Flexible segments |
| Phase 3 | 61 | 5 | 8.2% | Campaign UI |
| Phase 4 | 43 | 7 | 16.3% | Search parser |
| Phase 5 | 39 | 2 | 5.1% | Column mapping |
| Phase 6 | 24 | 8 | 33.3% | Service Worker |

---

## Risk Mitigation Strategy

### 1. Research Spikes First
All tasks <70% have associated spikes:
- Run spikes at phase start
- Time-boxed research (2-4 hours)
- Document findings before implementation

### 2. Progressive Enhancement
For all risk items:
- Build basic version first
- Enhance if time permits
- Ship without if needed

### 3. Fallback Plans
Every risk item has fallback:
- **Search:** Exact match only
- **Drag-drop:** Button-based
- **Offline:** Read from cache only
- **Column mapping:** Manual only

### 4. User Validation
For workflow risks:
- Build prototype
- Get user feedback
- Iterate before final

### 5. Library Solutions
Prefer proven libraries:
- **Parser:** Use PEG.js
- **Drag-drop:** Use dnd-kit
- **Offline:** Use Workbox
- **IndexedDB:** Use Dexie

---

## Risk Monitoring

### Daily
- Check confidence on current task
- Flag any new uncertainties
- Update estimates if needed

### Weekly
- Review upcoming risk tasks
- Schedule spikes appropriately
- Adjust timeline for buffers

### Phase End
- Document actual vs estimated
- Update confidence ratings
- Apply learnings to next phase

---

## Contingency Time

### Buffer Calculation
- High confidence (>85%): No buffer
- Medium (70-85%): +25% buffer
- Low (50-70%): +50% buffer
- Very Low (<50%): +100% buffer

### Phase Buffers Needed
- Phase 1: 0 hours (no risks)
- Phase 2: 1 hour (1 risk × 50%)
- Phase 3: 10 hours (5 risks × 50%)
- Phase 4: 15 hours (7 risks × various)
- Phase 5: 3 hours (2 risks × 50%)
- Phase 6: 12 hours (8 risks × 50%)

**Total Buffer Needed:** 41 hours (~1 week)

---

## Escalation Path

### If Risk Materializes
1. Try mitigation strategy
2. Attempt fallback plan
3. Consider deferring feature
4. Escalate to stakeholder

### Decision Authority
- **Drop feature:** Product Owner
- **Extend timeline:** Project Manager
- **Change approach:** Tech Lead
- **Accept technical debt:** Team consensus

---

## Success Metrics

### Risk Resolved When
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Performance acceptable
- [ ] No blocking issues
- [ ] Documentation updated

### Risk Monitoring Success
- [ ] No surprises in implementation
- [ ] Buffers sufficient
- [ ] Fallbacks not needed
- [ ] Timeline maintained

---

*Update this register as risks are resolved or new ones identified.*