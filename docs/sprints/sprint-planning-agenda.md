# Sprint Planning Agenda - Attachment Upload Feature

**Date**: Tomorrow, 9am
**Duration**: 60 minutes
**Attendees**: Backend Engineer, Frontend Engineer (you), QA Engineer, Product Manager, CTO (optional)

---

## Agenda

### 1. Sprint Goal Review (5 min)
**Goal**: Enable users to upload PDF/image attachments to CRM records with virus scanning

**Success Criteria**:
- Users can upload files up to 25MB
- Automatic virus scanning before download
- <300ms p95 metadata write latency
- 95% upload success rate

---

### 2. Architecture Overview (10 min)

**Present**: Architecture Decision Record (ADR)

**Key Decisions**:
1. **Presigned URLs** for direct S3 upload (faster, scalable)
2. **Asynchronous virus scanning** (better UX)
3. **AWS S3 Malware Scan** initially (faster implementation)
4. **Polymorphic attachments table** (reusable across resources)

**Walkthrough**: Upload flow diagram
```
Client → Request presigned URL → Backend creates DB record
      ↓
Client → Upload to S3 directly → Notify backend
      ↓
Backend → Trigger virus scan → Update status
      ↓
Client → Poll for status → Show "Clean" badge → Enable download
```

**Questions**:
- Any concerns with this approach?
- Security review needed?

---

### 3. Critical Path Discussion (10 min)

**Backend Engineer Constraint**: Available THIS WEEK ONLY (vacation for 2 weeks)

**Critical Path Tasks** (must complete this week):
1. BE-1: Database migration (2h)
2. BE-2: Storage bucket setup (1h)
3. BE-3: Presigned URL API (3h)
4. BE-4: Upload completion webhook (2h)
5. BE-5: Virus scanning service (4h)
6. BE-6: Scan background job (4h)
7. BE-7: Status query API (1h)

**Total**: 17 hours + 2 hours testing = 19 hours committed

**Question for Backend Engineer**:
- Comfortable with this estimate?
- Any concerns or blockers?

---

### 4. Parallel Frontend Work (5 min)

**Frontend can start immediately** (no backend dependencies for first day):
- FE-1: Validation schemas (1h)
- FE-2: Uploader component (6h)
- FE-3: List component (3h)

**Integration points** (need backend APIs):
- FE-2 depends on BE-3 (presigned URL) - Day 2
- FE-5 depends on BE-7 (status polling) - Day 3

**Question for Frontend Engineer (you)**:
- Can you start FE-1 today (before sprint planning)?
- Any UI/UX questions for Product?

---

### 5. Deferred Features (5 min)

**Deferred to Next Sprint** (after backend engineer returns):
- Preview thumbnail generation (4-6 hours)
- Download audit logging (3 hours)

**Rationale**: Core upload + scanning is MVP. Previews are enhancement.

**Question for Product Manager**:
- OK to ship without previews initially?
- Any user expectations we need to manage?

---

### 6. Open Decisions (15 min)

#### Decision 1: Virus Scanning Service
**Options**:
- **AWS S3 Malware Scan**: $0.50/GB, managed, fast to integrate
- **ClamAV**: Free, self-hosted, requires Docker + ops effort

**Recommendation**: Start with AWS, migrate to ClamAV if costs grow

**Questions**:
- Budget approval for AWS service?
- DevOps bandwidth for ClamAV setup (if needed later)?

---

#### Decision 2: Scan Job Trigger
**Options**:
- **Webhook from upload completion**: Immediate, simple
- **pg_cron polling**: Periodic (every 30s), more resilient
- **Supabase Realtime**: Event-driven, more complex

**Recommendation**: Webhook for MVP (simplest)

**Question**:
- Any concerns with webhook reliability?

---

#### Decision 3: Preview Generation Priority
**Options**:
- **Include in this sprint**: Adds 6-8 hours to backend work
- **Defer to next sprint**: Ship faster, iterate later

**Recommendation**: Defer (backend constraint)

**Question for Product**:
- Can we ship without preview thumbnails?
- What's the user impact?

---

#### Decision 4: Thumbnail Storage
**If we do previews**:
- **Same S3 bucket**: Simpler, single storage location
- **Separate bucket**: Cleaner separation, easier to cache/CDN

**Recommendation**: Same bucket with `thumbnails/` prefix

---

### 7. Risk Review (5 min)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Backend vacation blocks critical work | 🔴 High | Prioritize BE-1 through BE-7 this sprint |
| Performance regression on API (<300ms) | 🟡 Medium | Load test early (Day 2), optimize if needed |
| Virus scanning complexity | 🟢 Low | Use AWS managed service |
| Frontend upload reliability (network) | 🟡 Medium | Implement retry with exponential backoff |

**Discussion**:
- Any other risks we should track?
- Who owns each mitigation?

---

### 8. Task Commitment (5 min)

**Review Task Board** (see: `attachment-upload-sprint-tasks.md`)

**Backend Engineer**:
- Commits to BE-1 through BE-7 (19 hours)
- 21 hours buffer for meetings, debugging, code review

**Frontend Engineer**:
- Commits to FE-1 through FE-6 (20 hours)
- 20 hours buffer

**QA Engineer**:
- Commits to QA-1 through QA-3 (6 hours)
- Regression testing (4 hours)
- 30 hours buffer for bug triage

**Question**: Any concerns with capacity?

---

### 9. Definition of Done (3 min)

**Must Have (MVP)**:
- [ ] Users can upload PDF/JPG/PNG to contacts, opportunities, organizations
- [ ] Files virus scanned before downloadable
- [ ] <300ms p95 metadata write latency
- [ ] Infected files blocked from download
- [ ] All tests pass (backend + frontend >70% coverage)
- [ ] QA sign-off (happy path + error cases)

**Nice to Have** (defer if time):
- [ ] Preview thumbnails
- [ ] Attachment count badges

**Agreement**: Clear on what "done" means?

---

### 10. Sprint Kickoff (2 min)

**Next Steps**:
1. Backend engineer starts BE-1 (database migration) immediately after meeting
2. Frontend engineer starts FE-1 (validation schema) today
3. Daily standup at 9:30am (focus on blockers)
4. Mid-sprint sync on Day 3 (after BE-7 complete)

**Key Dates**:
- **Day 2**: Load test presigned URL API (performance target)
- **Day 4**: QA testing starts
- **Day 5**: Code freeze, bug fixes only

**Questions**: Anything else before we start?

---

## Pre-Meeting Homework

**For Backend Engineer**:
- [ ] Review ADR (architecture decisions)
- [ ] Review BE-1 through BE-7 tasks
- [ ] Confirm AWS account access for S3 Malware Scan

**For Frontend Engineer (you)**:
- [ ] Review FE-1 through FE-6 tasks
- [ ] Review Zod validation patterns in codebase
- [ ] Prep questions on drag-drop UX (for Product)

**For QA Engineer**:
- [ ] Review QA-1 through QA-3 test cases
- [ ] Prep EICAR test file for virus scanning
- [ ] Review performance testing tools

**For Product Manager**:
- [ ] Review sprint goal and success metrics
- [ ] Decide on preview thumbnail priority
- [ ] Prep UX expectations for virus scanning delay

---

## Meeting Outputs

**Expected Deliverables**:
1. ✅ Sprint goal approved
2. ✅ Architecture decisions finalized
3. ✅ Task commitments from each engineer
4. ✅ Open decisions resolved (scanning service, job trigger, preview priority)
5. ✅ Risk mitigation owners assigned
6. ✅ Definition of Done agreed

**Post-Meeting**:
- Create Jira/Linear tickets from task list
- Share sprint board with team
- Schedule mid-sprint sync (Day 3)

---

## Quick Reference Links

- **Full Task Breakdown**: `attachment-upload-sprint-tasks.md`
- **Quick Checklist**: `attachment-upload-checklist.md`
- **Executive Summary**: `attachment-upload-executive-summary.md` (for CTO)
- **Architecture Decisions**: `adr-attachment-upload-service.md`
