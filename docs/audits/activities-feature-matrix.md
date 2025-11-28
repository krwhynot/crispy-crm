# Activities Resource Feature & CRUD Matrix

**Audit Date:** 2025-11-28
**Auditor:** Claude (AI-assisted)
**Status:** Validated with user decisions
**Industry Research:** Salesforce Activities (Tasks/Events), HubSpot Engagements (Perplexity Deep Research)

---

## Overview

This document captures the complete feature inventory for the Activities resource, comparing implemented code against PRD requirements and industry best practices (Salesforce, HubSpot). It includes user-validated decisions on implementation gaps.

---

## Industry Best Practices Research

### Salesforce Activity Model
- **Dual Objects**: Tasks (to-dos with due dates) + Events (calendar items with start/end times)
- **Entity Linking**: WhoID (Contact/Lead) + WhatID (Account/Opportunity/Campaign/Case)
- **Shared Activities**: Single activity can relate to multiple contacts (up to 50)
- **Dynamic Activity Composer**: Quick-action buttons embedded on record pages
- **Einstein Activity Capture**: Auto-logs emails/calendar events from user mailboxes
- **TaskSubType Field**: Controls Activity Timeline icon (call, email, etc.)
- **Subject Field**: Unique picklist that also accepts free text

### HubSpot Engagement Model
- **Activity Types**: Calls, Emails, Meetings, Notes, Tasks, SMS, WhatsApp, LinkedIn, Postal Mail (9+ types)
- **Custom Types**: Up to 30 custom call/meeting types and 30 custom outcomes per type
- **Auto-Association**: Activities auto-link to contact's primary company + 5 most recent deals
- **Inline Logging**: Chrome/Outlook extensions log activities without leaving email client
- **Task Follow-up**: Option to create follow-up task when logging any activity
- **Timeline Feed**: Unified chronological view on Contact/Company/Deal records

### Key Industry Patterns
1. **<30 second logging target** - Both platforms optimize for quick capture
2. **Outcome tracking** - Structured results (Connected, Left Voicemail, No Answer, etc.)
3. **Timeline-first viewing** - Activities shown in context on records, not standalone lists
4. **Auto-cascade associations** - Activity on deal auto-links to primary contact
5. **Follow-up creation** - Prompted or automatic follow-up task creation

### Sources
- [Salesforce Activities Overview](https://help.salesforce.com/s/articleView?id=sales.activities.htm&language=en_US&type=5)
- [Salesforce Activity Timeline](https://help.salesforce.com/s/articleView?id=sales.activity_timeline_parent.htm&language=en_US&type=5)
- [HubSpot: Log Activities](https://knowledge.hubspot.com/records/manually-log-activities-on-records)
- [HubSpot: Associate Activities](https://knowledge.hubspot.com/records/associate-activities-with-records)
- [HubSpot: Custom Call/Meeting Outcomes](https://knowledge.hubspot.com/calling/create-custom-call-and-meeting-outcomes)

---

## Feature Matrix (Component-Level)

### QuickLogForm (Dashboard FAB)

| Feature | Code Status | PRD Requirement | Industry Standard | Notes |
|---------|-------------|-----------------|-------------------|-------|
| Activity type selection | ⚠️ **5 types only** | ✅ 13 types required | HubSpot: 9+ types | **MVP BLOCKER #52** |
| Outcome selection | ✅ Implemented | ❌ Not specified | Salesforce/HubSpot: Required | 5 outcomes (Connected, VM, No Answer, Completed, Rescheduled) |
| Duration tracking | ✅ Implemented | ❌ Not specified | Standard for calls/meetings | Conditional display for Call/Meeting |
| Contact association | ✅ Implemented | ✅ Required | Standard | Combobox with search |
| Organization association | ✅ Implemented | ✅ Required | Standard | Cascading filter from contact |
| Opportunity association | ✅ Implemented | ✅ Required | Standard | Optional, cascading filter |
| Notes field | ✅ Implemented | ✅ Required | Standard | Required, min 1 char |
| Create follow-up task toggle | ✅ Implemented | ❌ Not specified | HubSpot: Built-in | Checkbox + date picker |
| Draft persistence | ✅ Implemented | ❌ Not specified | N/A | localStorage, 24h expiry |
| Save & Close | ✅ Implemented | ✅ Required | Standard | Primary action |
| Save & New | ✅ Implemented | ❌ Not specified | Standard | Secondary action |
| <30 second target | ✅ Validated | ✅ Required (§6.2) | Industry standard | Passes performance target |

### QuickLogActivity (Task Completion Dialog)

| Feature | Code Status | PRD Requirement | Industry Standard | Notes |
|---------|-------------|-----------------|-------------------|-------|
| Activity type selection | ✅ 9 types | ✅ 13 required | Standard | Missing: trade_show, social, sample, note |
| Grouped type dropdown | ✅ Implemented | ❌ Not specified | Good UX | Communication, Meetings, Documentation groups |
| Pre-filled from task | ✅ Implemented | ✅ Required | Standard | Infers type from task title |
| Notes field | ✅ Implemented | ✅ Required | Standard | Pre-filled with "Completed: {task title}" |
| Skip option | ✅ Implemented | ✅ Required | Good UX | Optional activity logging |

### ActivityCreate (Full Form)

| Feature | Code Status | PRD Requirement | Industry Standard | Notes |
|---------|-------------|-----------------|-------------------|-------|
| Tabbed form layout | ✅ Implemented | ✅ Required | Standard | Details, Relationships, Follow-up tabs |
| 11 interaction types | ✅ Implemented | ✅ 13 required | Standard | Missing: sample, note (but note is in schema) |
| Subject field | ✅ Implemented | ✅ Required | Standard | Required, min 1 char |
| Description/notes | ✅ Implemented | ✅ Required | Standard | Multiline, optional |
| Activity date | ✅ Implemented | ✅ Required | Standard | Defaults to today |
| Duration | ✅ Implemented | ✅ Required | Standard | Optional, minutes |
| Opportunity link | ✅ Implemented | ✅ Required | Standard | Autocomplete |
| Contact link | ✅ Implemented | ✅ Required | Standard | Autocomplete |
| Organization link | ✅ Implemented | ✅ Required | Standard | Autocomplete |
| Follow-up required toggle | ✅ Implemented | ✅ Required | Standard | Boolean switch |
| Follow-up date | ✅ Implemented | ✅ Required | Standard | Conditional display |
| Follow-up notes | ✅ Implemented | ❌ Not specified | Good UX | Optional |
| Sentiment tracking | ✅ Implemented | ❌ Not specified | N/A | Positive/Neutral/Negative |
| Location field | ✅ Implemented | ❌ Not specified | SF Events: Yes | Optional |
| Outcome field | ✅ Implemented | ❌ Not specified | SF/HubSpot: Required | Free text |

### LogActivityFAB (Dashboard Button)

| Feature | Code Status | PRD Requirement | Industry Standard | Notes |
|---------|-------------|-----------------|-------------------|-------|
| FAB positioning | ✅ Implemented | ✅ Required | HubSpot pattern | Fixed bottom-right |
| Sheet slide-over | ✅ Implemented | ✅ Required | HubSpot pattern | Right-side panel |
| Draft indicator badge | ✅ Implemented | ❌ Not specified | Good UX | Warning pulse when draft exists |
| Lazy-loaded form | ✅ Implemented | ❌ Not specified | Performance | Skeleton fallback |
| Focus management | ✅ Implemented | ✅ Required | Accessibility | Returns focus to FAB on close |

### Activity Timeline View

| Feature | Code Status | PRD Requirement | Industry Standard | Notes |
|---------|-------------|-----------------|-------------------|-------|
| Timeline component | ❌ **NOT IMPLEMENTED** | ✅ Required (#53) | SF/HubSpot: Core feature | **MVP BLOCKER** |
| Activity cards | ❌ NOT IMPLEMENTED | ✅ Required | Standard | Type-specific rendering |
| Chronological sort | ❌ NOT IMPLEMENTED | ✅ Required | Standard | Most recent first |
| Filter by type | ❌ NOT IMPLEMENTED | ✅ Required | Standard | Multi-select |
| Embedded on records | ❌ NOT IMPLEMENTED | ✅ Required | SF/HubSpot pattern | Contact, Org, Opp pages |

### Activity Auto-Cascade

| Feature | Code Status | PRD Requirement | Industry Standard | Notes |
|---------|-------------|-----------------|-------------------|-------|
| Opp → Contact cascade | ❌ **NOT IMPLEMENTED** | ✅ Required (§6.2) | HubSpot: Auto-associates | **MVP BLOCKER #27** |
| Server-side trigger | ❌ NOT IMPLEMENTED | ✅ Required | Standard | PostgreSQL or Edge Function |

### Sample Tracking Workflow

| Feature | Code Status | PRD Requirement | Industry Standard | Notes |
|---------|-------------|-----------------|-------------------|-------|
| Sample activity type | ❌ **NOT IN SCHEMA** | ✅ Required (§4.4) | N/A (custom) | **MVP BLOCKER #4** |
| Sample status field | ❌ NOT IMPLEMENTED | ✅ Required (§4.4) | N/A (custom) | Sent→Received→Feedback |
| Status workflow UI | ❌ NOT IMPLEMENTED | ✅ Required (§4.4) | N/A (custom) | Status transitions |
| Follow-up reminders | ❌ NOT IMPLEMENTED | ✅ Required (§4.4) | Standard | System reminders |

---

## CRUD Matrix

### Operation-Level

| Operation | Component | Route/Action | Status | Gap | Required Action |
|-----------|-----------|--------------|--------|-----|-----------------|
| **CREATE** | ActivityCreate | `/activities/create` | ✅ Works | Missing sample type | Add sample to schema |
| **CREATE (Quick)** | QuickLogForm | Dashboard FAB | ⚠️ Partial | Only 5 types | Expand to 13 types |
| **CREATE (Task)** | QuickLogActivity | Task completion dialog | ✅ Works | — | None |
| **READ (List)** | N/A | N/A | ❌ **MISSING** | No list view | Timeline-focused per decision |
| **READ (Single)** | N/A | N/A | ❌ **MISSING** | No show view | Timeline-focused per decision |
| **READ (Timeline)** | N/A | N/A | ❌ **MISSING** | No timeline | **Create ActivityTimeline** |
| **READ (Aggregation)** | ActivitiesService | getActivityLog() | ✅ Works | — | Server-side UNION ALL |
| **UPDATE** | N/A | N/A | ❌ **MISSING** | No edit view | Timeline inline edit? |
| **DELETE** | activitiesCallbacks | Soft delete | ✅ Works | — | Sets deleted_at |
| **SEARCH** | N/A | N/A | ❌ MISSING | No search | Via timeline filter |
| **FILTER** | N/A | N/A | ❌ MISSING | No filter | Via timeline filter |

### Field-Level CRUD

| Field | Create | Read | Update | Required | Validation | Notes |
|-------|--------|------|--------|----------|------------|-------|
| `id` | Auto | ✅ | ❌ | Auto | BIGINT | Generated always |
| `activity_type` | ✅ | ✅ | ✅ | **Yes** | enum | "engagement" or "interaction" |
| `type` | ✅ | ✅ | ✅ | **Yes** | enum | 12 interaction types (needs sample) |
| `subject` | ✅ | ✅ | ✅ | **Yes** | min 1 char | Primary identifier |
| `description` | ✅ | ✅ | ✅ | No | text, nullable | Detailed notes |
| `activity_date` | ✅ | ✅ | ✅ | **Yes** | ISO date | Defaults to today |
| `duration_minutes` | ✅ | ✅ | ✅ | No | int, nullable | Optional |
| `contact_id` | ✅ | ✅ | ✅ | Conditional | FK, nullable | Required if no org |
| `organization_id` | ✅ | ✅ | ✅ | Conditional | FK, nullable | Required if no contact |
| `opportunity_id` | ✅ | ✅ | ✅ | Conditional | FK, nullable | Required for "interaction" type |
| `follow_up_required` | ✅ | ✅ | ✅ | No | boolean | Default false |
| `follow_up_date` | ✅ | ✅ | ✅ | Conditional | date, nullable | Required if follow_up_required |
| `follow_up_notes` | ✅ | ✅ | ✅ | No | text, nullable | Optional |
| `outcome` | ✅ | ✅ | ✅ | No | text, nullable | Free text result |
| `sentiment` | ✅ | ✅ | ✅ | No | enum, nullable | positive/neutral/negative |
| `location` | ✅ | ✅ | ✅ | No | text, nullable | Optional |
| `sample_status` | ❌ | ❌ | ❌ | Conditional | enum | **NEW: sent/received/feedback** |
| `created_by` | Auto | ✅ | ❌ | Auto | FK | Creator tracking |
| `created_at` | Auto | ✅ | ❌ | Auto | timestamp | — |
| `updated_at` | Auto | ✅ | Auto | Auto | timestamp | — |
| `deleted_at` | ❌ | ✅ | ✅ | No | timestamp | Soft delete |

---

## User-Validated Decisions

### Decision 1: QuickLogForm Activity Types

**Question:** QuickLogForm only exposes 5 activity types (Call, Email, Meeting, Follow-up, Note) but PRD specifies 13 types. How to address?

**User Decision:** Add all 13 types to QuickLogForm

**Rationale:** Full PRD compliance. Use grouped dropdown pattern like QuickLogActivity.

**Implementation:**
```
Communication: Call, Email, Check-in
Meetings: Meeting, Demo, Site Visit
Documentation: Proposal, Contract Review, Follow-up, Note
Sales: Trade Show, Social
Samples: Sample (NEW)
```

**Files to Update:**
- `src/atomic-crm/dashboard/v3/validation/activitySchema.ts` - Add missing types to enum
- `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` - Update Select with grouped options
- `src/atomic-crm/validation/activities.ts` - Add `sample` to interactionTypeSchema

### Decision 2: CRUD Components Strategy

**Question:** No ActivityList, ActivityShow, or ActivityEdit components exist. How to implement viewing?

**User Decision:** Timeline-focused (HubSpot pattern)

**Rationale:** Modern CRM trend - activities shown in context on records, not standalone lists. Aligns with PRD #53 "Recent Activity Feed".

**Implementation:**
1. Create `ActivityTimeline.tsx` reusable component
2. Add timeline to: ContactShow, OrganizationShow, OpportunityShow (as tab or section)
3. No standalone `/activities` list page
4. Inline editing within timeline cards

### Decision 3: Auto-Cascade to Contact

**Question:** PRD Section 6.2 requires auto-cascade from Opportunity to Contact. Not implemented.

**User Decision:** Implement server-side trigger

**Rationale:** PostgreSQL trigger ensures data integrity regardless of client (web, mobile, API).

**Implementation:**
1. Create PostgreSQL trigger on `activities` INSERT
2. When `opportunity_id IS NOT NULL AND contact_id IS NULL`:
   - Look up opportunity's primary contact
   - Set `contact_id` to that contact
3. Activity appears in both Opportunity and Contact timelines

**Migration File:**
```sql
CREATE OR REPLACE FUNCTION auto_cascade_activity_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.opportunity_id IS NOT NULL AND NEW.contact_id IS NULL THEN
    SELECT oc.contact_id INTO NEW.contact_id
    FROM opportunity_contacts oc
    WHERE oc.opportunity_id = NEW.opportunity_id
    ORDER BY oc.created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_auto_cascade
BEFORE INSERT ON activities
FOR EACH ROW EXECUTE FUNCTION auto_cascade_activity_to_contact();
```

### Decision 4: Sample Tracking Workflow

**Question:** Sample tracking with Sent→Received→Feedback workflow not implemented. MVP critical.

**User Decision:** Add sample as activity type + status field

**Rationale:** Extends existing schema rather than creating separate resource. Follows HubSpot custom activity type pattern.

**Implementation:**
1. Add `sample` to `interactionTypeSchema` enum in validation/activities.ts
2. Add `sample_status` enum: `'sent' | 'received' | 'feedback_pending' | 'feedback_received'`
3. Add `sample_status` column to activities table (nullable)
4. Conditional validation: if `type === 'sample'`, `sample_status` required
5. Add sample status field to ActivityCreate and QuickLogForm (conditional display)

**Migration File:**
```sql
-- Add sample_status enum
CREATE TYPE sample_status AS ENUM ('sent', 'received', 'feedback_pending', 'feedback_received');

-- Add column to activities
ALTER TABLE activities ADD COLUMN sample_status sample_status;

-- Add sample to interaction_type enum if not exists
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'sample';
```

---

## Implementation Gaps (MVP Blockers)

| # | Gap | PRD Reference | Priority | Est. Effort | Status |
|---|-----|---------------|----------|-------------|--------|
| 1 | QuickLogForm limited to 5 types | §6.1, MVP #52 | **Critical** | 3h | **NEW** |
| 2 | No ActivityTimeline component | §6.2, MVP #53 | **Critical** | 8h | **NEW** |
| 3 | No auto-cascade trigger | §6.2, MVP #27 | **High** | 2h | **NEW** |
| 4 | Sample type not in schema | §4.4, MVP #4 | **Critical** | 4h | **NEW** |
| 5 | Sample status workflow | §4.4, MVP #4 | **Critical** | 6h | **NEW** |
| 6 | Mobile quick actions | §9.3, MVP #29 | Medium | 8h | Existing |

**Total Estimated Effort:** 31 hours

---

## Activity Types Mapping

| PRD Activity Type | In Validation Schema | In QuickLogForm | In QuickLogActivity | In ActivityCreate |
|-------------------|---------------------|-----------------|---------------------|-------------------|
| `call` | ✅ | ✅ "Call" | ✅ | ✅ |
| `email` | ✅ | ✅ "Email" | ✅ | ✅ |
| `meeting` | ✅ | ✅ "Meeting" | ✅ | ✅ |
| `demo` | ✅ | ❌ | ✅ | ✅ |
| `proposal` | ✅ | ❌ | ✅ | ✅ |
| `follow_up` | ✅ | ✅ "Follow-up" | ✅ | ✅ |
| `trade_show` | ✅ | ❌ | ❌ | ✅ |
| `site_visit` | ✅ | ❌ | ✅ | ✅ |
| `contract_review` | ✅ | ❌ | ✅ | ✅ |
| `check_in` | ✅ | ❌ | ✅ | ✅ |
| `social` | ✅ | ❌ | ❌ | ✅ |
| `note` | ✅ | ✅ "Note" | ❌ | ✅ |
| `sample` | ❌ **MISSING** | ❌ | ❌ | ❌ |

---

## Alignment Summary

| Category | PRD | Code | Industry | Alignment |
|----------|-----|------|----------|-----------|
| Activity Types | 13 types | 12 types (missing sample) | HubSpot: 9+ | ⚠️ Need to add sample |
| Quick Logging | All types | 5 types | SF: Dynamic Composer | ⚠️ Expand to 13 |
| Timeline View | Required | Not implemented | SF/HubSpot: Core | ❌ Critical gap |
| Auto-cascade | Required | Not implemented | HubSpot: Built-in | ❌ Critical gap |
| Sample Workflow | Required | Not implemented | N/A (custom) | ❌ Critical gap |
| Outcome Tracking | Not specified | Implemented | SF/HubSpot: Standard | ✅ Exceeds PRD |
| Follow-up Task | Not specified | Implemented | HubSpot: Built-in | ✅ Exceeds PRD |
| Draft Persistence | Not specified | Implemented | N/A | ✅ Exceeds PRD |
| Sentiment Tracking | Not specified | Implemented | N/A | ✅ Exceeds PRD |

---

## PRD Updates Required

Add to PRD Section 16.2 (Resolved Questions):

| # | Question | Decision | Date |
|---|----------|----------|------|
| 103 | QuickLogForm activity types | Add all 13 types with grouped dropdown (Communication, Meetings, Documentation, Sales, Samples) | 2025-11-28 |
| 104 | Activity CRUD strategy | Timeline-focused (HubSpot pattern). No standalone list/show pages. Timeline on Contact/Org/Opp records | 2025-11-28 |
| 105 | Activity auto-cascade | Server-side PostgreSQL trigger. Opp activities auto-link to primary contact | 2025-11-28 |
| 106 | Sample tracking implementation | Add sample as activity type + sample_status enum field (sent/received/feedback_pending/feedback_received) | 2025-11-28 |

Update MVP Blocker count in Section 17.4: 53 → 57 (add 4 new activity blockers)

---

*Last updated: 2025-11-28 (Activities Feature Matrix audit)*
