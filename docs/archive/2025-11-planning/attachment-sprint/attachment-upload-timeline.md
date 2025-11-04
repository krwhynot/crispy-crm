# Attachment Upload - Sprint Timeline

**Sprint Duration**: 5 days (Mon-Fri)
**Team**: Backend Engineer, Frontend Engineer, QA Engineer

---

## Visual Timeline

```
DAY 1 (Monday)
===============================================
Backend:  [BE-1: Migration] [BE-2: Storage] [BE-3: Presigned URL API ──>
Frontend: [FE-1: Validation] [FE-2: Uploader Component ───────────────>
QA:       (Prep test cases)

DAY 2 (Tuesday)
===============================================
Backend:  ──> BE-3] [BE-4: Completion] [BE-5: Scan Service Setup ──>
Frontend: ──> FE-2] [FE-3: List Component ──────────────────────────>
QA:       (Prep EICAR test files)
          ⚠️  LOAD TEST: Presigned URL API (<300ms target)

DAY 3 (Wednesday)
===============================================
Backend:  ──> BE-5] [BE-6: Scan Background Job ────────────────────>
Frontend: ──> FE-3] [FE-5: Polling Hook] [FE-4: Show Integration]
QA:       (Monitor integration, prep test environment)
          🔄 MID-SPRINT SYNC: Review progress, address blockers

DAY 4 (Thursday)
===============================================
Backend:  ──> BE-6] [BE-7: Status API] [BE-11: Integration Tests]
Frontend: [FE-6: Unit Tests ─────────────────────────────────────>
QA:       [QA-1: Happy Path] [QA-2: Error Cases] [QA-3: Perf Test]
          🧪 TESTING BEGINS

DAY 5 (Friday)
===============================================
Backend:  [Code Review] [Bug Fixes from QA]
Frontend: ──> FE-6] [Code Review] [Bug Fixes]
QA:       [Regression Testing] [Final Sign-off]
          🚫 CODE FREEZE (bug fixes only)
          ✅ SPRINT REVIEW: Demo to Product/CTO
```

---

## Dependency Graph

```
Critical Path (Backend):
BE-1 ──> BE-2 ──> BE-3 ──> BE-4 ──> BE-5 ──> BE-6 ──> BE-7
 2h       1h       3h       2h       4h       4h       1h
                                                        │
                                                        ├──> BE-11 (Tests)
                                                        │     2h
                                                        │
                                                        └──> QA-1, QA-2, QA-3
                                                              6h total

Parallel Path (Frontend):
FE-1 ──> FE-2 ──────────────┬──> FE-4 ──> FE-6
 1h       6h                 │     2h       3h
                             │
         FE-3 ──────────────>┘
          3h

         FE-5 (depends on BE-7)
          2h   ────────────────┘
```

**Key Dependencies**:
- FE-2 (Uploader) needs BE-3 (Presigned URL API) by Day 2
- FE-5 (Polling Hook) needs BE-7 (Status API) by Day 3
- QA needs BE-7 + FE-4 complete by Day 4
- All tests must pass before Friday code freeze

---

## Daily Standup Focus

### Monday Standup
**Focus**: Kickoff, clarify requirements
- Backend: Starting BE-1 (migration)
- Frontend: Starting FE-1 (validation)
- **Blockers**: None expected

### Tuesday Standup
**Focus**: API integration readiness
- Backend: BE-3 (Presigned URL API) ready for frontend?
- Frontend: FE-2 waiting on BE-3
- **Blockers**: Performance concerns on BE-3?
- **Action**: Schedule load test for EOD Tuesday

### Wednesday Standup (Mid-Sprint Sync)
**Focus**: Critical path on track?
- Backend: BE-6 (Scan Job) progress
- Frontend: FE-4 (Show Integration) progress
- **Blockers**: Virus scanning service issues?
- **Decision**: Can we hit Friday deadline?

### Thursday Standup
**Focus**: Testing and bug triage
- Backend: BE-11 (Tests) complete?
- Frontend: FE-6 (Tests) complete?
- QA: What bugs found? Severity?
- **Action**: Prioritize P0/P1 bugs for Friday

### Friday Standup
**Focus**: Ship readiness
- Backend: All bugs fixed?
- Frontend: All bugs fixed?
- QA: Sign-off ready?
- **Decision**: Ship to production or defer?

---

## Milestone Checkpoints

### Checkpoint 1: End of Day 2 (Tuesday EOD)
**Goal**: Upload flow functional (no scanning yet)

**Deliverables**:
- ✅ Database migration deployed locally
- ✅ Presigned URL API working
- ✅ Frontend can request URL and upload to S3
- ✅ Load test shows <300ms p95 latency

**Go/No-Go**: If this fails, backend engineer may need to work extra hours

---

### Checkpoint 2: End of Day 3 (Wednesday EOD)
**Goal**: Virus scanning functional

**Deliverables**:
- ✅ Virus scanning service configured
- ✅ Background job running
- ✅ Status API working
- ✅ Frontend polling for status

**Go/No-Go**: If this fails, consider descoping preview thumbnails and reallocating backend time

---

### Checkpoint 3: End of Day 4 (Thursday EOD)
**Goal**: QA complete, bugs triaged

**Deliverables**:
- ✅ All QA test cases executed
- ✅ Bugs logged and prioritized
- ✅ P0/P1 bugs assigned

**Go/No-Go**: If >5 P0/P1 bugs, may need to defer ship date

---

### Checkpoint 4: End of Day 5 (Friday EOD)
**Goal**: Ship-ready

**Deliverables**:
- ✅ All P0/P1 bugs fixed
- ✅ All tests passing (backend + frontend)
- ✅ QA sign-off
- ✅ Code merged to main

**Go/No-Go**: If not ready, plan Monday hot fix

---

## Resource Allocation by Day

### Backend Engineer (8h/day)

| Day | Committed | Buffer | Tasks |
|-----|-----------|--------|-------|
| Mon | 6h | 2h | BE-1, BE-2, BE-3 (partial) |
| Tue | 5h | 3h | BE-3 (finish), BE-4, BE-5 (start) |
| Wed | 5h | 3h | BE-5 (finish), BE-6 |
| Thu | 3h | 5h | BE-7, BE-11 |
| Fri | 0h | 8h | Bug fixes, code review |

**Total Committed**: 19h | **Total Buffer**: 21h

---

### Frontend Engineer (8h/day)

| Day | Committed | Buffer | Tasks |
|-----|-----------|--------|-------|
| Mon | 4h | 4h | FE-1, FE-2 (partial) |
| Tue | 6h | 2h | FE-2 (finish), FE-3 |
| Wed | 4h | 4h | FE-5, FE-4 |
| Thu | 3h | 5h | FE-6 |
| Fri | 3h | 5h | Bug fixes, code review |

**Total Committed**: 20h | **Total Buffer**: 20h

---

### QA Engineer (8h/day)

| Day | Committed | Buffer | Tasks |
|-----|-----------|--------|-------|
| Mon | 1h | 7h | Test case prep |
| Tue | 1h | 7h | EICAR file prep, load test support |
| Wed | 1h | 7h | Integration monitoring |
| Thu | 6h | 2h | QA-1, QA-2, QA-3 |
| Fri | 6h | 2h | Regression, sign-off |

**Total Committed**: 15h | **Total Buffer**: 25h

---

## Capacity Contingency Plan

### If Backend Falls Behind (Day 2-3)

**Scenario**: BE-5 or BE-6 taking longer than expected

**Actions**:
1. Frontend helps with BE-11 (integration tests)
2. Defer BE-7 (Status API) to simple polling workaround
3. Frontend uses mock data temporarily
4. Add Saturday working session if critical

---

### If Frontend Falls Behind (Day 3-4)

**Scenario**: FE-2 (Uploader) more complex than expected

**Actions**:
1. Simplify drag-drop to basic file input
2. Defer FE-3 (List component) to show simple table
3. QA focuses on backend testing first
4. Backend helps with FE-6 (unit tests)

---

### If QA Finds Critical Bugs (Day 4-5)

**Scenario**: >5 P0/P1 bugs found on Thursday

**Actions**:
1. Triage: Must-fix vs. can-defer
2. Pair programming on critical bugs
3. Extend Friday to evening if needed
4. Plan Monday hot fix deploy if not ready

---

## Communication Plan

### Daily Standup (9:30am)
- **Format**: 15 minutes, async Slack update + sync call
- **Focus**: Yesterday's progress, today's plan, blockers

### Mid-Sprint Sync (Wednesday 3pm)
- **Format**: 30 minutes, video call
- **Focus**: On track for Friday? Need to descope anything?

### Sprint Review (Friday 4pm)
- **Format**: 30 minutes, demo to Product/CTO
- **Focus**: Show working upload flow, discuss next sprint (previews)

### Ad-Hoc Communication
- **Slack channel**: #sprint-attachments
- **Emergency escalation**: Tag CTO if critical blocker

---

## Success Criteria Tracking

### Performance Target: <300ms p95 Metadata Write
- **Measure**: Tuesday EOD load test
- **Tool**: Apache Bench or k6
- **Pass**: 95th percentile < 300ms for presigned URL generation
- **Fail**: Optimize DB queries, add caching

### Upload Success Rate: 95%
- **Measure**: Thursday QA testing
- **Tool**: Manual testing with 20 uploads (PDF, JPG, PNG)
- **Pass**: 19+ successful uploads
- **Fail**: Investigate failure patterns, add retry logic

### Virus Scan Time: <60 seconds
- **Measure**: Thursday performance test (QA-3)
- **Tool**: Time scan for 25MB file
- **Pass**: Scan completes in <60s
- **Fail**: Investigate scan service, consider async queue optimization

---

## End-of-Sprint Retrospective (Friday 5pm)

**Agenda** (30 minutes):
1. What went well?
2. What didn't go well?
3. What should we do differently next sprint?
4. Action items for next sprint (preview thumbnails)

**Expected Outcomes**:
- Lessons learned on backend time estimation
- Feedback on ADR process
- Ideas for improving frontend/backend sync
- Plan for next sprint (preview generation)

---

## Next Sprint Preview

**Deferred Items** (3-day sprint):
- BE-8: PDF thumbnail generation (4h)
- BE-9: Image thumbnail generation (2h)
- BE-10: Secure download endpoint (3h)
- FE-7: Preview thumbnail display (2h)

**Total**: ~11 hours (fits in 1 week with buffer)
