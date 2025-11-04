# Sprint Planning: Attachment Upload Feature

**Status**: Ready for sprint planning (tomorrow 9am)
**Prepared by**: Frontend Engineer
**Time spent**: 3 hours
**Date**: 2025-11-02

---

## What's in This Folder

This folder contains all artifacts needed for tomorrow's sprint planning meeting:

### 1. **Architecture Decision Record (ADR)**
**File**: `adr-attachment-upload-service.md`
**Purpose**: Technical decisions and architecture for attachment upload system
**Audience**: Engineering team

**Key Decisions**:
- Presigned URL strategy for direct S3 upload
- Asynchronous virus scanning with status tracking
- AWS S3 Malware Scan (initially, migrate to ClamAV if needed)
- Polymorphic attachments table for reusability

**Read this if**: You need to understand the technical approach and trade-offs

---

### 2. **Full Task Breakdown**
**File**: `attachment-upload-sprint-tasks.md`
**Purpose**: Complete list of tasks with estimates, acceptance criteria, and dependencies
**Audience**: All engineers, QA

**Contents**:
- 11 backend tasks (BE-1 through BE-11)
- 6 frontend tasks (FE-1 through FE-6)
- 3 QA tasks (QA-1 through QA-3)
- Dependency graph
- Capacity planning
- Risk mitigation

**Read this if**: You need detailed task descriptions and acceptance criteria

---

### 3. **Quick Checklist**
**File**: `attachment-upload-checklist.md`
**Purpose**: One-page sprint checklist organized by day
**Audience**: Daily standup reference

**Contents**:
- Day-by-day task checklist
- Critical path highlights
- Deferred items
- Success metrics

**Read this if**: You need a quick reference during daily standups

---

### 4. **Executive Summary**
**File**: `attachment-upload-executive-summary.md`
**Purpose**: One-page summary for CTO answering "When can we start coding?"
**Audience**: CTO, Product Manager, stakeholders

**Key Messages**:
- We can start coding TODAY (frontend) and TOMORROW (backend)
- Core feature ships THIS WEEK if backend completes critical path
- Preview thumbnails deferred to next sprint

**Read this if**: You need to brief non-technical stakeholders

---

### 5. **Sprint Planning Agenda**
**File**: `sprint-planning-agenda.md`
**Purpose**: Meeting agenda with discussion points and decisions needed
**Audience**: Sprint planning attendees

**Contents**:
- 10-section agenda (60 minutes)
- Architecture walkthrough
- Open decisions (virus scanning service, job trigger, preview priority)
- Risk review
- Pre-meeting homework

**Read this if**: You're attending tomorrow's sprint planning

---

### 6. **Visual Timeline**
**File**: `attachment-upload-timeline.md`
**Purpose**: Day-by-day timeline with milestones and capacity allocation
**Audience**: Project managers, team leads

**Contents**:
- ASCII timeline showing parallel work
- Milestone checkpoints (End of Day 2, 3, 4, 5)
- Resource allocation by day
- Contingency plans
- Communication plan

**Read this if**: You need to track sprint progress or manage risk

---

## Quick Start Guide

### For Tomorrow's Sprint Planning (9am)

1. **Review in this order** (30 minutes):
   - Executive Summary (5 min) - Get the big picture
   - ADR (10 min) - Understand architecture
   - Sprint Planning Agenda (15 min) - Prepare for discussion

2. **Have these open during meeting**:
   - Sprint Planning Agenda (for discussion flow)
   - Quick Checklist (for task commitment)

3. **After meeting**:
   - Use Full Task Breakdown to create Jira/Linear tickets
   - Share Quick Checklist with team for standups
   - Pin Timeline to team Slack channel

---

## Key Decisions for Tomorrow

### Must Decide:
1. **Virus scanning service**: AWS ($0.50/GB) or ClamAV (free, ops cost)?
   - **Recommendation**: AWS for speed
2. **Preview thumbnails**: Include this sprint or defer?
   - **Recommendation**: Defer (backend constraint)

### Nice to Decide:
3. **Scan job trigger**: Webhook or pg_cron polling?
4. **Thumbnail storage**: Same bucket or separate?

---

## Critical Path Summary

**Backend Engineer (Must Complete This Week)**:
```
Day 1-2: Database + Presigned URL API
Day 2-3: Virus scanning service + background job
Day 3-4: Status API + integration tests
```

**Frontend Engineer (Parallel Work)**:
```
Day 1-2: Validation + Uploader component
Day 2-3: List component + polling hook
Day 3-4: Show view integration + unit tests
```

**QA Engineer**:
```
Day 4: Happy path + error cases + performance testing
Day 5: Regression + sign-off
```

---

## Success Metrics (from PRD)

- [ ] <300ms p95 latency for metadata write (load test Day 2)
- [ ] 95% upload success rate (UX test Day 4)
- [ ] Virus scan <60 seconds (performance test Day 4)

---

## What Happens After This Sprint?

**Next Sprint** (after backend engineer returns from vacation):
- Preview thumbnail generation (PDF + images)
- Download audit logging
- Performance tuning based on usage data

**Estimated**: 3 days (11 hours + buffer)

---

## Questions?

**Before Sprint Planning**:
- Slack: #sprint-attachments
- Email: [frontend-engineer]@example.com

**During Sprint**:
- Daily standup: 9:30am
- Mid-sprint sync: Wednesday 3pm
- Emergency: Tag CTO in Slack

---

## Document Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-02 | Initial sprint planning artifacts created | Frontend Engineer |
| | - ADR finalized | |
| | - Task breakdown with 20 tasks | |
| | - Timeline with 4 checkpoints | |
| | - Sprint planning agenda prepared | |

---

## Appendix: Time Breakdown

**Total Time Spent**: 3 hours

| Activity | Time | Output |
|----------|------|--------|
| Quick assessment | 5 min | Problem understanding |
| Architecture decisions | 15 min | Key trade-offs identified |
| ADR writing | 45 min | `adr-attachment-upload-service.md` |
| Task breakdown | 90 min | `attachment-upload-sprint-tasks.md` |
| Quick checklist | 30 min | `attachment-upload-checklist.md` |
| Executive summary | 15 min | `attachment-upload-executive-summary.md` |
| Sprint planning agenda | 15 min | `sprint-planning-agenda.md` |
| Visual timeline | 15 min | `attachment-upload-timeline.md` |
| This README | 10 min | `README.md` |

**Total**: 3h 20min (slightly over, but well-prepared!)

---

## Success Criteria for Sprint Planning

Tomorrow's meeting is successful if:
- ✅ Sprint goal approved by Product
- ✅ Architecture decisions finalized by Engineering
- ✅ Task commitments from all engineers
- ✅ Open decisions resolved (scanning service, preview priority)
- ✅ Risk mitigation owners assigned
- ✅ Team leaves with clear "what to code first"

**We're ready to ship this feature by Friday!** 🚀
