# Sprint Tasks: Attachment Upload Service

**Sprint Goal**: Enable users to upload PDF/image attachments to CRM records with virus scanning

**Sprint Duration**: 1 week (backend engineer constraint)

**Team**:
- Backend Engineer (available this week only) - BE
- Frontend Engineer (you) - FE
- QA Engineer - QA

---

## Phase 1: Foundation (Days 1-2)

### Backend Tasks (Critical Path - Must Complete This Week)

#### BE-1: Database Migration for Attachments Table
**Owner**: Backend Engineer
**Priority**: P0 (blocker)
**Estimate**: 2 hours

**Acceptance Criteria**:
- [ ] Create migration: `npx supabase migration new add_attachments_table`
- [ ] Implement schema from ADR (attachments table with all fields)
- [ ] Add indexes: attachable polymorphic, scan_status, uploaded_by
- [ ] Enable RLS on attachments table
- [ ] Grant SELECT, INSERT, UPDATE, DELETE to authenticated role
- [ ] Create RLS policies (team shared access: `USING (true)`)
- [ ] Test locally: `npm run db:local:reset`
- [ ] Verify seed data compatible

**Dependencies**: None

**Technical Notes**:
```sql
-- Key constraints from ADR
CHECK (scan_status IN ('pending', 'scanning', 'clean', 'infected', 'scan_failed'))
CHECK (attachable_type IN ('contact', 'opportunity', 'organization'))
CHECK (file_size > 0 AND file_size <= 26214400)
```

---

#### BE-2: Supabase Storage Bucket Configuration
**Owner**: Backend Engineer
**Priority**: P0 (blocker)
**Estimate**: 1 hour

**Acceptance Criteria**:
- [ ] Create storage bucket: `crm-attachments`
- [ ] Configure bucket policies:
  - Max file size: 25MB
  - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`
- [ ] Set presigned URL expiration: 15 minutes
- [ ] Configure CORS for frontend domain
- [ ] Test bucket access with Supabase client

**Dependencies**: None

**Technical Notes**:
- Use Supabase Dashboard or SQL: `INSERT INTO storage.buckets ...`
- Reference: https://supabase.com/docs/guides/storage

---

#### BE-3: Presigned URL Generation API
**Owner**: Backend Engineer
**Priority**: P0 (blocker)
**Estimate**: 3 hours

**Acceptance Criteria**:
- [ ] Create Edge Function: `functions/generate-upload-url`
- [ ] Validate request:
  - filename, file_size, mime_type required
  - file_size <= 25MB
  - mime_type in allowed list
  - attachable_type and attachable_id valid
- [ ] Generate unique S3 key: `{attachable_type}/{attachable_id}/{timestamp}-{uuid}-{filename}`
- [ ] Create presigned upload URL (15 min expiration)
- [ ] Insert pending record in attachments table:
  - scan_status: 'pending'
  - uploaded_by: auth.uid() from sales table
- [ ] Return: presigned URL, attachment_id, s3_key
- [ ] Performance test: <300ms p95 latency
- [ ] Error handling: Return 400 for validation errors, 500 for system errors

**Dependencies**: BE-1, BE-2

**API Contract**:
```typescript
// Request
POST /functions/v1/generate-upload-url
{
  filename: string;
  file_size: number;
  mime_type: string;
  attachable_type: 'contact' | 'opportunity' | 'organization';
  attachable_id: number;
}

// Response 200
{
  presigned_url: string;
  attachment_id: number;
  s3_key: string;
  expires_at: string; // ISO timestamp
}

// Response 400
{
  error: "File size exceeds 25MB limit"
}
```

---

#### BE-4: Upload Completion Webhook
**Owner**: Backend Engineer
**Priority**: P0 (blocker)
**Estimate**: 2 hours

**Acceptance Criteria**:
- [ ] Create Edge Function: `functions/complete-upload`
- [ ] Validate attachment exists and is in 'pending' state
- [ ] Verify file exists in S3 bucket
- [ ] Update attachment record:
  - Confirm file_size matches uploaded file
  - Keep scan_status as 'pending' (scan job will update)
- [ ] Trigger virus scan job (queue or async call)
- [ ] Return success response
- [ ] Error handling: Handle missing files, invalid state transitions

**Dependencies**: BE-1, BE-2, BE-3

**API Contract**:
```typescript
// Request
POST /functions/v1/complete-upload
{
  attachment_id: number;
}

// Response 200
{
  success: true;
  attachment_id: number;
  scan_status: 'pending';
}

// Response 400
{
  error: "Attachment not found or already processed"
}
```

---

## Phase 2: Virus Scanning (Days 2-3)

### Backend Tasks (Critical Path - Must Complete This Week)

#### BE-5: Virus Scanning Service Setup
**Owner**: Backend Engineer
**Priority**: P0 (blocker)
**Estimate**: 4 hours

**Acceptance Criteria**:
- [ ] **Decision**: Choose scanning service (ClamAV vs AWS S3 Malware Scan)
  - ClamAV: Free, self-hosted, requires container
  - AWS: Paid, managed, simpler integration
  - **Recommendation**: Start with AWS for speed, migrate later if needed
- [ ] Configure chosen service
- [ ] Test with clean and infected sample files (EICAR test file)
- [ ] Document service credentials/endpoints in .env

**Dependencies**: BE-2

**Technical Notes**:
- EICAR test file for virus testing: https://www.eicar.org/download-anti-malware-testfile/
- If using ClamAV: Run in Docker container, expose REST API

---

#### BE-6: Virus Scan Background Job
**Owner**: Backend Engineer
**Priority**: P0 (blocker)
**Estimate**: 4 hours

**Acceptance Criteria**:
- [ ] Create Edge Function: `functions/scan-attachment`
- [ ] Query for attachments with scan_status = 'pending'
- [ ] Update status to 'scanning' before scan
- [ ] Download file from S3 (or pass S3 URL to scanner)
- [ ] Call virus scanning service
- [ ] Update attachment record based on result:
  - Clean: scan_status = 'clean', scanned_at = NOW()
  - Infected: scan_status = 'infected', scan_result = {details}
  - Error: scan_status = 'scan_failed', retry up to 3 times
- [ ] Log all scan results for audit
- [ ] Trigger preview generation for clean files (Phase 4)

**Dependencies**: BE-4, BE-5

**Error Handling**:
- Retry failed scans with exponential backoff
- Alert on 3 consecutive failures
- Keep infected files in S3 but mark in DB (for forensics)

**Job Scheduling Options**:
1. Supabase pg_cron (periodic polling)
2. Edge Function triggered by DB webhook
3. Manual trigger from BE-4 (simplest for MVP)

---

#### BE-7: Scan Status Query API
**Owner**: Backend Engineer
**Priority**: P1 (important)
**Estimate**: 1 hour

**Acceptance Criteria**:
- [ ] Create query endpoint: GET /attachments/:id/status
- [ ] Return current scan_status and metadata
- [ ] Used by frontend to poll for scan completion
- [ ] RLS enforced (only team members can query)

**Dependencies**: BE-1, BE-6

**API Contract**:
```typescript
// Response
{
  attachment_id: number;
  scan_status: 'pending' | 'scanning' | 'clean' | 'infected' | 'scan_failed';
  scanned_at?: string;
  file_size: number;
  filename: string;
}
```

---

## Phase 3: Frontend Upload UI (Days 1-4, Parallel)

### Frontend Tasks (Can Start Immediately)

#### FE-1: Attachment Validation Schema
**Owner**: Frontend Engineer
**Priority**: P0 (blocker)
**Estimate**: 1 hour

**Acceptance Criteria**:
- [ ] Create `src/atomic-crm/validation/attachments.ts`
- [ ] Define Zod schemas:
  - uploadRequestSchema (client validation before upload)
  - attachmentSchema (database record)
- [ ] Export allowed MIME types, max file size constants
- [ ] Add unit tests for validation edge cases

**Dependencies**: None (can start now)

**Example Schema**:
```typescript
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const MAX_FILE_SIZE = 26214400; // 25MB

export const uploadRequestSchema = z.object({
  file: z.custom<File>(),
  attachable_type: z.enum(['contact', 'opportunity', 'organization']),
  attachable_id: z.number().positive(),
}).refine(
  (data) => data.file.size <= MAX_FILE_SIZE,
  { message: "File size must not exceed 25MB" }
).refine(
  (data) => ALLOWED_MIME_TYPES.includes(data.file.type as any),
  { message: "File type must be PDF, JPEG, or PNG" }
);
```

---

#### FE-2: Attachment Uploader Component (Core)
**Owner**: Frontend Engineer
**Priority**: P0 (blocker)
**Estimate**: 6 hours

**Acceptance Criteria**:
- [ ] Create `src/atomic-crm/shared/components/AttachmentUploader.tsx`
- [ ] Implement drag-and-drop zone (use shadcn/ui Card + custom drop handler)
- [ ] File input fallback (click to select)
- [ ] Client-side validation:
  - File type check (MIME type)
  - File size check (25MB)
  - Show validation errors
- [ ] Upload flow:
  1. Validate file locally
  2. Request presigned URL from backend (BE-3)
  3. Upload directly to S3 using presigned URL
  4. Show upload progress (0-100%)
  5. Call upload completion endpoint (BE-4)
  6. Poll for scan status (BE-7)
- [ ] UI states:
  - Idle (drag-drop zone)
  - Validating (spinner)
  - Uploading (progress bar)
  - Scanning (badge: "Scanning for viruses...")
  - Complete (badge: "Clean" or "Infected")
  - Error (error message)
- [ ] Accessibility: keyboard navigation, ARIA labels, focus management

**Dependencies**: BE-3, BE-4, FE-1

**Component API**:
```typescript
interface AttachmentUploaderProps {
  attachableType: 'contact' | 'opportunity' | 'organization';
  attachableId: number;
  onUploadComplete?: (attachmentId: number) => void;
  onUploadError?: (error: Error) => void;
}
```

---

#### FE-3: Attachment List Component
**Owner**: Frontend Engineer
**Priority**: P1 (important)
**Estimate**: 3 hours

**Acceptance Criteria**:
- [ ] Create `src/atomic-crm/shared/components/AttachmentList.tsx`
- [ ] Fetch attachments for given resource (contact/opportunity/org)
- [ ] Display list with:
  - Filename
  - File size (human-readable: KB, MB)
  - Upload date
  - Scan status badge (pending/scanning/clean/infected)
  - Download button (only for "clean" files)
  - Delete button (with confirmation)
- [ ] Empty state: "No attachments yet"
- [ ] Loading state
- [ ] Error state
- [ ] Responsive design (iPad-optimized per design system)

**Dependencies**: BE-1, BE-7

**Component API**:
```typescript
interface AttachmentListProps {
  attachableType: 'contact' | 'opportunity' | 'organization';
  attachableId: number;
}
```

---

#### FE-4: Integration into Show Views
**Owner**: Frontend Engineer
**Priority**: P1 (important)
**Estimate**: 2 hours

**Acceptance Criteria**:
- [ ] Add "Attachments" tab to ContactShow
- [ ] Add "Attachments" tab to OpportunityShow
- [ ] Add "Attachments" tab to OrganizationShow
- [ ] Each tab contains:
  - AttachmentUploader component
  - AttachmentList component
- [ ] Update navigation/layout to show attachment count badge (optional enhancement)

**Dependencies**: FE-2, FE-3

**Example Integration**:
```typescript
// In ContactShow.tsx
<TabbedShowLayout>
  <Tab label="Summary">...</Tab>
  <Tab label="Attachments">
    <AttachmentUploader attachableType="contact" attachableId={record.id} />
    <AttachmentList attachableType="contact" attachableId={record.id} />
  </Tab>
</TabbedShowLayout>
```

---

#### FE-5: Attachment Status Polling Hook
**Owner**: Frontend Engineer
**Priority**: P1 (important)
**Estimate**: 2 hours

**Acceptance Criteria**:
- [ ] Create `src/atomic-crm/shared/hooks/useAttachmentStatus.ts`
- [ ] Poll attachment status every 2 seconds while scan_status = 'pending' or 'scanning'
- [ ] Stop polling when status = 'clean', 'infected', or 'scan_failed'
- [ ] Return current status to component
- [ ] Cleanup interval on unmount
- [ ] Error handling: Stop polling after 30 attempts (60 seconds)

**Dependencies**: BE-7

**Hook API**:
```typescript
const { status, isPolling, error } = useAttachmentStatus(attachmentId);
```

---

## Phase 4: Preview Generation (Next Sprint - Defer)

### Backend Tasks (Can be done after engineer returns)

#### BE-8: PDF Thumbnail Generation
**Priority**: P2 (nice-to-have)
**Estimate**: 4 hours

**Acceptance Criteria**:
- [ ] Edge Function to generate PDF thumbnail (first page)
- [ ] Use pdf-lib or pdfjs-dist
- [ ] Save thumbnail to S3: `thumbnails/{attachment_id}.jpg`
- [ ] Update attachment record with thumbnail_s3_key
- [ ] Trigger after virus scan passes

---

#### BE-9: Image Thumbnail Generation
**Priority**: P2 (nice-to-have)
**Estimate**: 2 hours

**Acceptance Criteria**:
- [ ] Edge Function to generate image thumbnail (resized to 200x200)
- [ ] Use Sharp library
- [ ] Save to S3: `thumbnails/{attachment_id}.jpg`
- [ ] Update attachment record

---

## Phase 5: Download & Security (Next Sprint - Defer)

### Backend Tasks

#### BE-10: Secure Download Endpoint
**Priority**: P2 (nice-to-have)
**Estimate**: 3 hours

**Acceptance Criteria**:
- [ ] Create endpoint: GET /attachments/:id/download
- [ ] Verify scan_status = 'clean' (block pending/infected files)
- [ ] Generate presigned download URL (5 min expiration)
- [ ] Log download event for audit trail
- [ ] Return presigned URL to client

---

## Testing & QA Tasks

#### QA-1: Manual Testing - Happy Path
**Owner**: QA Engineer
**Priority**: P0
**Estimate**: 2 hours

**Test Cases**:
- [ ] Upload PDF to contact (success)
- [ ] Upload JPG to opportunity (success)
- [ ] Upload PNG to organization (success)
- [ ] Verify scan status updates (pending → scanning → clean)
- [ ] Download clean file
- [ ] Verify file integrity after download

---

#### QA-2: Manual Testing - Error Cases
**Owner**: QA Engineer
**Priority**: P1
**Estimate**: 2 hours

**Test Cases**:
- [ ] Upload file >25MB (should reject)
- [ ] Upload .exe file (should reject)
- [ ] Upload EICAR virus test file (should mark infected)
- [ ] Upload with network interruption (should handle gracefully)
- [ ] Try to download pending file (should block)
- [ ] Try to download infected file (should block)

---

#### QA-3: Performance Testing
**Owner**: QA Engineer
**Priority**: P1
**Estimate**: 2 hours

**Test Cases**:
- [ ] Measure presigned URL generation latency (target: <300ms p95)
- [ ] Upload 10 concurrent files (verify no crashes)
- [ ] Verify scan completes within 60 seconds for 25MB file

---

#### FE-6: Unit Tests for Components
**Owner**: Frontend Engineer
**Priority**: P1
**Estimate**: 3 hours

**Acceptance Criteria**:
- [ ] Test AttachmentUploader validation logic
- [ ] Test upload flow with mocked API
- [ ] Test error handling
- [ ] Test useAttachmentStatus hook polling logic
- [ ] Coverage >70% per project standards

---

#### BE-11: Integration Tests
**Owner**: Backend Engineer
**Priority**: P1
**Estimate**: 2 hours

**Acceptance Criteria**:
- [ ] Test presigned URL generation
- [ ] Test upload completion flow
- [ ] Test virus scan job
- [ ] Test RLS policies (team access)

---

## Task Dependency Graph

```
BE-1 (Migration) ──┬─→ BE-3 (Presigned URL) ─→ BE-4 (Completion) ─→ BE-6 (Scan Job)
                   │                                                      ↓
                   ├─→ BE-7 (Status API) ←────────────────────────────────┘
                   │
BE-2 (Storage) ────┴─→ BE-5 (Scan Service) ─→ BE-6

FE-1 (Validation) ─→ FE-2 (Uploader) ──┬─→ FE-4 (Integration)
                                        │
BE-1, BE-7 ─→ FE-3 (List) ─────────────┘

BE-7 ─→ FE-5 (Polling Hook) ─→ FE-2
```

**Critical Path** (must complete this week):
BE-1 → BE-2 → BE-3 → BE-4 → BE-5 → BE-6 → BE-7

**Parallel Work**:
- FE-1, FE-2, FE-3 can start immediately
- FE-4 waits for FE-2 and FE-3
- QA starts after BE-7 and FE-4 complete

---

## Sprint Capacity Planning

**Backend Engineer** (40 hours this week):
- BE-1: 2h
- BE-2: 1h
- BE-3: 3h
- BE-4: 2h
- BE-5: 4h
- BE-6: 4h
- BE-7: 1h
- BE-11: 2h
- Buffer: 21h (meetings, code review, debugging)
**Total: 19h committed, 21h buffer**

**Frontend Engineer** (40 hours this week):
- FE-1: 1h
- FE-2: 6h
- FE-3: 3h
- FE-4: 2h
- FE-5: 2h
- FE-6: 3h
- Code review: 3h
- Buffer: 20h
**Total: 20h committed, 20h buffer**

**QA Engineer** (40 hours this week):
- QA-1: 2h
- QA-2: 2h
- QA-3: 2h
- Regression testing: 4h
- Bug triage: 5h
- Buffer: 25h
**Total: 15h committed, 25h buffer**

---

## Definition of Done (Sprint)

**Must Have (MVP)**:
- [ ] Users can upload PDF/JPG/PNG files to contacts, opportunities, organizations
- [ ] Files are virus scanned before being marked downloadable
- [ ] Upload metadata write latency <300ms p95
- [ ] Infected files are blocked from download
- [ ] All backend tests pass
- [ ] All frontend tests pass (>70% coverage)
- [ ] Manual QA complete (happy path + error cases)

**Nice to Have (Defer to Next Sprint)**:
- [ ] Preview thumbnails
- [ ] Download audit logging
- [ ] Attachment count badges in navigation

---

## Risks & Mitigations

**Risk 1: Backend engineer vacation blocks preview generation**
- **Mitigation**: Defer preview to next sprint (Phases 4-5)
- **Impact**: Medium (nice-to-have feature)

**Risk 2: Virus scanning service complexity**
- **Mitigation**: Start with AWS managed service, migrate to ClamAV later
- **Impact**: Low (AWS service is quick to set up)

**Risk 3: Performance regression on presigned URL generation**
- **Mitigation**: Load test early (Day 2), optimize DB queries if needed
- **Impact**: High (blocks MVP)

**Risk 4: Frontend upload reliability (network failures)**
- **Mitigation**: Implement retry logic with exponential backoff
- **Impact**: Medium (UX degradation)

---

## Open Questions for Sprint Planning Meeting

1. **Virus scanning service**: AWS S3 Malware Scan ($0.50/GB) vs. ClamAV (free, requires ops)?
2. **Job queue**: pg_cron polling vs. webhook trigger from upload completion?
3. **Thumbnail priority**: Can we defer to next sprint?
4. **Download security**: Presigned URLs vs. proxy through backend?
5. **Retention policy**: Keep files forever or expire after X months?

---

## Post-Sprint Follow-Up (Next Sprint)

- [ ] Implement preview thumbnails (BE-8, BE-9)
- [ ] Add download audit logging (BE-10)
- [ ] Migrate to ClamAV if AWS costs too high
- [ ] Add attachment count badges to navigation
- [ ] Performance tuning based on real usage data
