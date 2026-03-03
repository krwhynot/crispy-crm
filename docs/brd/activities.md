# BRD: Activities

**Status:** Reverse-Engineered | **Last Updated:** 2026-03-03 | **Source:** Zod schemas, handler logic, UI components

---

## 1. Domain Overview

Activities represent logged sales interactions between MFB representatives and their contacts or organizations. Each activity records a specific touchpoint — a phone call, email, meeting, sample delivery, or one of twelve other interaction types — against a contact, organization, and optionally an opportunity.

**Business role:** Activities are the primary mechanism through which sales reps document their engagement with operators and distributors. The KPI goal of 10+ activities per week per principal depends entirely on this domain. Activities feed the dashboard activity feed, Weekly Activity Summary report, and the entity timeline shown on contacts, organizations, and opportunities. Without activity logging, there is no visibility into sales motion.

**Note:** After a Single-Table Inheritance (STI) migration, the `activities` table also stores tasks (differentiated by `activity_type = 'task'`). This BRD covers the logged-activity side of that table. The Tasks domain BRD covers the task side. [INFERRED from `activityTypeSchema` in `src/atomic-crm/validation/activities/types.ts`]

---

## 2. Schema Fields

### Core Identity

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `id` | number or string | auto-increment | No |
| `activity_type` | enum | `"activity"` or `"task"`, defaults to `"activity"` | No (defaults) |
| `type` | enum | 15 interaction types, defaults to `"call"` | No (defaults) |
| `subject` | string | trim, min 1, max 255 | Yes |
| `activity_date` | date | coerce, defaults to today, no future dates | Yes (defaults to today) |
| `duration_minutes` | integer | positive, optional | No |
| `description` | string | trim, max 10000, HTML sanitized | No |

### Entity Relationships

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `contact_id` | number or string | max 50 chars if string | At least contact or organization required |
| `organization_id` | number or string | max 50 chars if string | At least contact or organization required |
| `opportunity_id` | number or string | max 50 chars if string | Optional |

### Follow-up

| Field | Type | Constraints |
|-------|------|-------------|
| `follow_up_required` | boolean | coerce, defaults to false |
| `follow_up_date` | date | coerce, required if `follow_up_required` is true |
| `follow_up_notes` | string | trim, max 10000, HTML sanitized |

### Sample Tracking

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `sample_status` | enum | `sent`, `received`, `feedback_pending`, `feedback_received` | Required when `type = "sample"` |

### Outcome and Context

| Field | Type | Constraints |
|-------|------|-------------|
| `outcome` | string | trim, max 2000, HTML sanitized |
| `sentiment` | enum | `positive`, `neutral`, `negative` |
| `location` | string | trim, max 255 |
| `attachments` | string[] | max 20 entries, each max 2048 chars |
| `attendees` | string[] | max 50 entries, each max 255 chars |
| `tags` | number[] or string[] | max 20 entries |

### Metadata

| Field | Type | Notes |
|-------|------|-------|
| `created_at` / `updated_at` | string | DB-managed timestamps |
| `created_by` / `updated_by` | number or string | Audit trail |
| `deleted_at` | string | Soft delete marker |
| `related_task_id` | number or string | Links activity to a task it completed |

### STI Task Fields (present on table, not used for logged activities)

`due_date`, `reminder_date`, `completed`, `completed_at`, `priority`, `sales_id`, `snooze_until`, `overdue_notified_at`

---

## 3. Business Rules

1. **Subject required** -- `subject` is required with minimum length of 1 character. Source: `src/atomic-crm/validation/activities/schemas.ts:25`

2. **Entity relationship required** -- At least one of `contact_id` or `organization_id` must be provided for logged activities (`activity_type = "activity"`). Standalone tasks are exempt. Source: `src/atomic-crm/validation/activities/schemas.ts:114-120`

3. **Follow-up date required when follow-up flagged** -- If `follow_up_required` is true, `follow_up_date` must be set. Source: `src/atomic-crm/validation/activities/schemas.ts:122-129`

4. **Sample status required for sample activities** -- When `type = "sample"`, `sample_status` must be provided. Source: `src/atomic-crm/validation/activities/schemas.ts:131-138`

5. **Sample status exclusive to sample type** -- `sample_status` must not be set on non-sample activity types. Source: `src/atomic-crm/validation/activities/schemas.ts:140-147`

6. **Active samples require follow-up** -- Sample activities with `sample_status` in `["sent", "received", "feedback_pending"]` (active statuses) must have `follow_up_required = true` and a `follow_up_date`. Source: `src/atomic-crm/validation/activities/schemas.ts:149-170` and `src/atomic-crm/validation/activities/constants.ts` (SAMPLE_ACTIVE_STATUSES)

7. **No future activity dates** -- The `activity_date` field disables future date selection in the UI. Source: `src/atomic-crm/activities/ActivitySinglePage.tsx:77` (`disableFuture` prop)

8. **HTML sanitization** -- `description`, `follow_up_notes`, and `outcome` fields are sanitized via `sanitizeHtml()` at the schema boundary. Source: `src/atomic-crm/validation/activities/schemas.ts:31-32`, `:59`, `:66-67`

9. **Draft persistence** -- Form data for unsaved activities is persisted to `localStorage` using a Zod-validated draft schema to prevent type confusion attacks. Source: `src/atomic-crm/activities/activityDraftSchema.ts`

10. **Cascade archive** -- When an opportunity is archived, its related activities are soft-deleted atomically via the `archive_opportunity_with_relations` RPC. Source: `src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts:209-260`

11. **Automatic activity on opportunity archive** -- When an opportunity is deleted/archived via the React Admin delete button path, an activity of type `"note"` with subject "Opportunity archived" is logged automatically. Source: `src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts:222-244`

---

## 4. Enums

- **`activityTypeSchema`**: `"activity"` | `"task"` -- distinguishes logged interactions from planned tasks in the STI table
- **`interactionTypeSchema`** (15 values): `call` | `email` | `meeting` | `demo` | `proposal` | `follow_up` | `trade_show` | `site_visit` | `contract_review` | `check_in` | `social` | `note` | `sample` | `administrative` | `other`
- **`sampleStatusSchema`**: `sent` | `received` | `feedback_pending` | `feedback_received`
- **`sentimentSchema`**: `positive` | `neutral` | `negative`

---

## 5. CRUD Operations

| Operation | Handler Pattern | Notes |
|-----------|----------------|-------|
| List | `activities` table with filter | Supports type, sample_status, date range, sentiment, created_by filters |
| GetOne | `activities` base table | |
| Create | `activities` base table | Requires `subject`; requires contact or organization |
| Update | `activities` base table | All fields partial via `updateActivitiesSchema` |
| Delete | Soft delete | Sets `deleted_at` via `withSkipDelete` |

**Wrapper chain:** `baseProvider -> withValidation -> withSkipDelete -> withLifecycleCallbacks -> withErrorLogging`

Source: `src/atomic-crm/providers/supabase/handlers/activitiesHandler.ts`

**Timeline read:** The `entity_timeline` table (or view) is queried by the shared `UnifiedTimeline` component to render chronological activity and task feeds per entity. Source: `docs/audit/baseline/feature-inventory.json` (feat-tml-001)

---

## 6. UI Views

- **ActivityList** -- Datagrid with filter chip bar; filters by type, sample_status, date range, sentiment, created_by
- **ActivityEdit** -- Form using `ActivityInputs` wrapper around `ActivitySinglePage`
- **ActivityShow** -- Read-only view of a single activity
- **ActivitySlideOver** -- 40vw slide-over panel with Details and Related tabs
- **ActivitySinglePage** -- Core form fields: Activity Details, Relationships, Follow-up, Outcome sections
- **ActivityTimelineEntry** -- Single entry rendering in timeline feeds

**Draft save:** `LogActivityFAB` and `QuickLogActivityDialog` (referenced in `activityDraftSchema.ts`) persist unsaved form state to localStorage across page navigations.

---

## 7. Filters

| Filter Key | Type | Notes |
|-----------|------|-------|
| `type` | multiselect | Interaction type choices from `INTERACTION_TYPE_OPTIONS` |
| `sample_status` | multiselect | Sample status choices from `SAMPLE_STATUS_OPTIONS` |
| `activity_date@gte` | date-range | Lower bound; paired with `lte` for range |
| `activity_date@lte` | date-range | Upper bound; paired with `gte` for range |
| `sentiment` | multiselect | Positive / neutral / negative |
| `created_by` | reference | References `sales` resource |

Source: `src/atomic-crm/activities/activityFilterConfig.ts`

---

## 8. Related Entities

| Relationship | Type | Entity |
|-------------|------|--------|
| `contact_id` | N:1 (required or org required) | contacts |
| `organization_id` | N:1 (required or contact required) | organizations |
| `opportunity_id` | N:1 (optional) | opportunities |
| `created_by` / `updated_by` | N:1 (audit) | sales |
| `sales_id` | N:1 (task-side STI only) | sales |
| `related_task_id` | N:1 (optional) | activities (self, task side) |
| `entity_timeline` | read view | Unified timeline across contacts, orgs, opportunities |

---

## 9. Data Flow: Sample Tracking Workflow

Sample activities follow a four-state workflow [INFERRED from `sampleStatusSchema`]:

1. **`sent`** -- Sample dispatched; follow-up required
2. **`received`** -- Operator confirmed receipt; follow-up required
3. **`feedback_pending`** -- Awaiting operator feedback; follow-up required
4. **`feedback_received`** -- Feedback collected; follow-up no longer mandatory

Active statuses (`sent`, `received`, `feedback_pending`) enforce `follow_up_required = true` and a `follow_up_date` via schema validation. The `SampleStatusBadge` component in `src/atomic-crm/components/SampleStatusBadge.tsx` renders the visual status indicator.

---

## 10. Open Questions

- Should `attachments` and `attendees` arrays be surfaced in the UI? They appear in the Zod schema but no corresponding form fields are visible in `ActivitySinglePage.tsx`.
- Is there a maximum age limit for backdating `activity_date`? The schema and UI only enforce no-future constraint, not a look-back window.
- Which role (Admin, Manager, Rep) can edit or delete another rep's logged activity? RLS policy details are not confirmed in application code.
- Should `tags` on activities be managed through the shared Tags domain, or are they free-form strings? The schema allows both numbers and strings.
- Is the `LogActivityFAB` (quick-log floating action button) currently deployed or still in development? It is referenced in `activityDraftSchema.ts` but no component file was found in the activities directory.
