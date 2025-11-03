# Attachment Upload - Executive Summary

**For**: CTO
**Question**: "When can we start coding on uploads?"
**Answer**: We can start coding TODAY (frontend) and TOMORROW MORNING (backend)

---

## What We're Building

Allow users to attach PDFs and images (up to 25MB) to contacts, opportunities, and organizations with:
- Automatic virus scanning
- Upload progress tracking
- Download only after scan passes

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **This Week** | 5 days | Core upload + virus scanning (MVP) |
| **Next Sprint** | 3 days | Preview thumbnails (enhancement) |

**We can ship the core feature THIS WEEK** if backend engineer completes critical path.

---

## Architecture Decisions (Key Trade-offs)

### 1. Upload Strategy: Direct to S3 (Presigned URLs)
- **Why**: Faster uploads, meets <300ms metadata write requirement
- **Trade-off**: Slightly more complex client logic vs. proxy through backend

### 2. Virus Scanning: Asynchronous
- **Why**: Don't block upload UX (scans take 5-30 seconds)
- **Trade-off**: Users must wait for "clean" status before downloading

### 3. Initial Service: AWS S3 Malware Scan
- **Why**: Faster to implement (critical with 1-week constraint)
- **Cost**: ~$0.50/GB scanned
- **Future**: Can migrate to self-hosted ClamAV if costs grow

---

## Team Capacity & Risk

### Backend Engineer (40h this week)
- **Committed**: 19 hours (7 critical tasks)
- **Buffer**: 21 hours (meetings, debugging, code review)
- **Risk**: ⚠️ On vacation next 2 weeks → **Must prioritize this sprint**

### Frontend Engineer (40h this week)
- **Committed**: 20 hours (6 tasks)
- **Buffer**: 20 hours
- **Risk**: ✅ Low (can continue work next sprint)

### QA Engineer (40h this week)
- **Committed**: 15 hours (testing + regression)
- **Risk**: ✅ Low

---

## Critical Path (Must Complete This Week)

```
Day 1-2: Database + Storage + Upload API
Day 2-3: Virus Scanning Service + Background Job
Day 3-4: Frontend Integration + Testing
Day 5: Buffer & Bug Fixes
```

**Blockers**: None if we start tomorrow morning

---

## Deferred to Next Sprint

- Preview thumbnail generation (4-6 hours)
- Download audit logging (3 hours)

**Rationale**: Core upload + scanning is the MVP. Previews are nice-to-have.

---

## Success Metrics (from PRD)

| Metric | Target | How We'll Measure |
|--------|--------|-------------------|
| Metadata write latency | <300ms p95 | Load test on Day 2 |
| Upload success rate | 95% | UX testing Day 4 |
| Virus scan completion | <60 seconds | Performance test Day 4 |

---

## Open Questions for You

1. **Budget approval**: AWS S3 Malware Scan costs ~$0.50/GB. Expected usage: ~$50-200/month. OK?
2. **Security review**: Need InfoSec sign-off before we deploy to production?
3. **Compliance**: Any regulatory requirements for virus scanning (e.g., SOC2, HIPAA)?

---

## Bottom Line

✅ **We can start coding tomorrow** (backend) and today (frontend)

✅ **We can ship core feature this week** if backend engineer completes critical path

⚠️ **Highest risk**: Backend engineer vacation → Must prioritize this sprint over other work

📊 **Recommendation**: Approve sprint plan, defer preview thumbnails to next sprint
