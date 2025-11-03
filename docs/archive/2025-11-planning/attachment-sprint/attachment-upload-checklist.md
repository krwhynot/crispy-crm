# Attachment Upload Sprint - Quick Checklist

**Sprint Goal**: Enable PDF/image uploads to CRM with virus scanning

**Duration**: 1 week (Backend engineer available THIS WEEK ONLY)

---

## Day 1-2: Foundation (CRITICAL PATH)

### Backend (Must Complete)
- [ ] **BE-1**: Database migration (attachments table) - 2h
- [ ] **BE-2**: Configure Supabase Storage bucket - 1h
- [ ] **BE-3**: Presigned URL generation API - 3h
- [ ] **BE-4**: Upload completion webhook - 2h

### Frontend (Parallel)
- [ ] **FE-1**: Attachment validation schema (Zod) - 1h
- [ ] **FE-2**: Start AttachmentUploader component - 3h (of 6h)

---

## Day 2-3: Virus Scanning (CRITICAL PATH)

### Backend (Must Complete)
- [ ] **BE-5**: Virus scanning service setup (AWS or ClamAV) - 4h
- [ ] **BE-6**: Virus scan background job - 4h
- [ ] **BE-7**: Scan status query API - 1h

### Frontend (Parallel)
- [ ] **FE-2**: Finish AttachmentUploader (upload + progress) - 3h
- [ ] **FE-3**: AttachmentList component - 3h
- [ ] **FE-5**: Polling hook for scan status - 2h

---

## Day 3-4: Integration & Testing

### Frontend
- [ ] **FE-4**: Add Attachments tab to Show views - 2h
- [ ] **FE-6**: Unit tests - 3h

### Backend
- [ ] **BE-11**: Integration tests - 2h

### QA
- [ ] **QA-1**: Happy path testing - 2h
- [ ] **QA-2**: Error case testing - 2h
- [ ] **QA-3**: Performance testing (<300ms p95) - 2h

---

## Day 5: Buffer & Polish

- [ ] Bug fixes from QA
- [ ] Performance tuning if needed
- [ ] Documentation updates
- [ ] Code review

---

## Deferred to Next Sprint (After Engineer Returns)

- [ ] **BE-8**: PDF thumbnail generation - 4h
- [ ] **BE-9**: Image thumbnail generation - 2h
- [ ] **BE-10**: Secure download endpoint with audit - 3h

---

## Sprint Planning Decisions Needed

1. **Virus scanning**: AWS ($0.50/GB) or ClamAV (free, needs ops)? → **Recommend AWS for speed**
2. **Job queue**: pg_cron polling or webhook trigger? → **Recommend webhook (simpler)**
3. **Defer previews**: OK to ship without thumbnails? → **Yes, add next sprint**

---

## Success Metrics (from PRD)

- [ ] <300ms p95 latency for metadata write
- [ ] 95% upload success rate in UX testing
- [ ] Virus scan completes within 60 seconds

---

## Risk Watch

🔴 **High**: Backend engineer vacation after this week → Prioritize BE-1 through BE-7
🟡 **Medium**: Performance regression → Load test on Day 2
🟢 **Low**: Scanning service complexity → Use AWS managed service
