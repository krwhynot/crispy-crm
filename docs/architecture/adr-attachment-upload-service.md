# ADR: Attachment Upload Service

**Date**: 2025-11-02
**Status**: Proposed
**Context**: Sprint planning tomorrow, backend engineer available this week only

## Problem Statement
Users cannot attach documents (PDFs, images) to CRM records (contacts, opportunities, organizations).

## Constraints
- 25MB max file size
- PDFs and images only (jpg, png, pdf)
- Virus scanning required
- <300ms p95 metadata write latency
- Backend engineer available this week only

## Architecture Decisions

### 1. Upload Flow: Presigned URL Strategy
**Decision**: Use S3 presigned URLs for direct client-to-S3 upload

**Rationale**:
- Reduces backend load (no proxy)
- Faster uploads (direct to S3)
- Meets <300ms metadata write requirement (metadata separate from upload)
- Simpler backend implementation (critical given time constraint)

**Flow**:
1. Client requests presigned URL from backend (with filename, size, type)
2. Backend validates, generates presigned URL, creates pending DB record
3. Client uploads directly to S3 using presigned URL
4. Client notifies backend of completion
5. Backend triggers virus scan and preview generation

### 2. Virus Scanning: Asynchronous Queue
**Decision**: Asynchronous scanning with status tracking

**Rationale**:
- Upload UX not blocked by scan (can take 5-30 seconds)
- Allows retry on scan failures
- Meets latency requirement
- Backend can use existing job queue or simple polling

**States**: pending → scanning → clean | infected | scan_failed

**Security**: Files marked "pending" or "scanning" not downloadable until "clean"

### 3. Preview Generation: Server-Side with Fallback
**Decision**: Server-side thumbnail generation, client-side fallback for images

**Rationale**:
- PDFs require server-side rendering (pdf-lib or similar)
- Images can use client-side Canvas API as fallback
- Lazy generation (on-demand, not blocking upload)

**Implementation**: Background job triggered after virus scan passes

### 4. Database Schema: New `attachments` Table
**Decision**: Dedicated table with polymorphic associations

```sql
CREATE TABLE attachments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- File metadata
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  s3_key TEXT NOT NULL UNIQUE,
  s3_bucket TEXT NOT NULL,

  -- Virus scan status
  scan_status TEXT NOT NULL DEFAULT 'pending',
    -- Values: pending, scanning, clean, infected, scan_failed
  scan_result JSONB,
  scanned_at TIMESTAMPTZ,

  -- Preview
  thumbnail_s3_key TEXT,
  preview_generated_at TIMESTAMPTZ,

  -- Polymorphic association
  attachable_type TEXT NOT NULL, -- 'contact', 'opportunity', 'organization'
  attachable_id BIGINT NOT NULL,

  -- Audit
  uploaded_by BIGINT REFERENCES sales(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (scan_status IN ('pending', 'scanning', 'clean', 'infected', 'scan_failed')),
  CHECK (attachable_type IN ('contact', 'opportunity', 'organization')),
  CHECK (file_size > 0 AND file_size <= 26214400) -- 25MB in bytes
);

CREATE INDEX idx_attachments_attachable ON attachments(attachable_type, attachable_id);
CREATE INDEX idx_attachments_scan_status ON attachments(scan_status);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
```

**Rationale**:
- Polymorphic pattern allows attachments on any resource
- Scan status tracking enables async workflow
- Indexes support common queries (all attachments for a contact, pending scans)
- Follows project's two-layer security model (GRANT + RLS)

### 5. Frontend Component Strategy
**Decision**: Reusable `<AttachmentUploader>` component with drag-and-drop

**Features**:
- Drag-and-drop zone
- File type/size validation before upload
- Progress indicator during upload
- Status badges (scanning, clean, infected)
- Preview thumbnails
- Download button (only for "clean" files)

**Integration Points**:
- `<ContactShow>`, `<OpportunityShow>`, `<OrganizationShow>`
- New tab in Show views: "Attachments"

## Technology Choices

### Backend
- **Virus scanning**: ClamAV (open source, self-hosted) or AWS GuardDuty/S3 Object Scan
- **Preview generation**:
  - PDFs: `pdf-lib` or `pdfjs-dist` (Node.js)
  - Images: Sharp (Node.js image processing)
- **Job queue**: Supabase Edge Functions with pg_cron or simple polling

### Frontend
- **Upload**: Native Fetch API with presigned URLs
- **Progress**: XHR or Fetch with ReadableStream
- **Validation**: Zod schema for file metadata
- **UI**: shadcn/ui components (Card, Badge, Button) + custom drag-drop zone

### Infrastructure
- **Storage**: Supabase Storage (built on S3)
- **CDN**: Supabase Storage includes CDN

## Open Questions for Sprint Planning

1. **Virus scanning service**: ClamAV container vs. AWS service? (Cost/maintenance trade-off)
2. **Job queue**: Use existing Supabase Edge Functions or add dedicated queue?
3. **Thumbnail storage**: Same bucket or separate bucket?
4. **Download security**: Presigned URLs or proxy through backend for audit trail?
5. **Retention policy**: Keep uploaded files forever or expire after X days?

## Non-Functional Requirements

- **Performance**: <300ms p95 for metadata write (presigned URL generation + DB insert)
- **Reliability**: Retry failed virus scans (3 attempts)
- **Security**:
  - Presigned URLs expire in 15 minutes
  - Files not downloadable until scan passes
  - RLS policies restrict access to team members only
- **Observability**: Log all scan results, track upload success rate

## Success Metrics (from PRD)
- <300ms p95 metadata write latency
- 95% task success rate in UX testing
- (Implied: 99% virus scan success rate)

## Implementation Phases

### Phase 1: Core Upload (Backend engineer, this week)
- Database migration (attachments table)
- Presigned URL generation endpoint
- Upload completion webhook
- Basic RLS policies

### Phase 2: Virus Scanning (Backend engineer, this week)
- ClamAV integration or AWS service setup
- Background job for scanning
- Status update workflow

### Phase 3: Frontend Upload UI (Frontend, can start in parallel)
- Attachment uploader component
- File validation
- Progress tracking
- Status display

### Phase 4: Preview Generation (Backend, next sprint)
- PDF thumbnail generation
- Image thumbnail generation
- Storage and retrieval

### Phase 5: Download & Security (Backend, next sprint)
- Download endpoint with auth check
- Audit logging
- Presigned URL generation for downloads

## Timeline Estimate
- **This week (backend engineer)**: Phases 1-2 (core upload + scanning)
- **This week (frontend)**: Phase 3 start (basic upload UI)
- **Next sprint**: Phases 4-5 (previews + downloads)

## Risk Mitigation
- **Backend engineer vacation**: Prioritize Phases 1-2 this week, defer preview generation
- **Virus scan complexity**: Start with simple AWS service, migrate to ClamAV later if needed
- **Performance**: Load test presigned URL generation early in sprint
