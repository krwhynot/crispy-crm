# Activity Types Reference

**Last Updated:** 2025-11-27
**Total Types:** 12 implemented + 1 planned = 13 total

---

## Overview

Crispy-CRM tracks sales activities using a typed enum system. Activities are categorized into two groups:
- **Interactions** - Activities linked to an opportunity
- **Engagements** - Activities linked to a contact/organization without a specific opportunity

The `interaction_type` enum defines what kind of activity occurred.

---

## Implemented Activity Types (12)

### 1. Call
| Property | Value |
|----------|-------|
| **DB Value** | `call` |
| **Display Name** | Call |
| **Icon** | Phone |
| **QuickLog** | Yes |
| **When to Use** | Phone conversations with contacts |

**Typical Use Cases:**
- Prospecting calls to new leads
- Follow-up calls after meetings
- Pricing discussions
- Product inquiries
- Check-in calls with existing accounts

**Example Notes:**
> "Called John to discuss McCRUM product line. He's interested in the new frozen entrees for their hospital cafeteria. Will send samples next week."

---

### 2. Email
| Property | Value |
|----------|-------|
| **DB Value** | `email` |
| **Display Name** | Email |
| **Icon** | Mail |
| **QuickLog** | Yes |
| **When to Use** | Email correspondence with contacts |

**Typical Use Cases:**
- Product information requests
- Quote/pricing emails
- Meeting confirmations
- Follow-up after calls
- Sending collateral materials

**Example Notes:**
> "Emailed updated pricing sheet for Rapid Rasoi line. Buyer asked for volume discount at 500+ cases."

---

### 3. Meeting
| Property | Value |
|----------|-------|
| **DB Value** | `meeting` |
| **Display Name** | Meeting |
| **Icon** | Calendar |
| **QuickLog** | Yes |
| **When to Use** | In-person or video meetings |

**Typical Use Cases:**
- Scheduled presentations
- Product demos at buyer location
- Trade show meetings
- Lunch-and-learn sessions
- Quarterly business reviews

**Example Notes:**
> "Met with Sysco purchasing team at their Denver DC. Presented Kaufholds line. Strong interest in pretzel products for stadium accounts."

---

### 4. Demo
| Property | Value |
|----------|-------|
| **DB Value** | `demo` |
| **Display Name** | Demo |
| **Icon** | FileText (default) |
| **QuickLog** | No (via opportunities) |
| **When to Use** | Product demonstrations |

**Typical Use Cases:**
- In-kitchen product demos
- Taste tests with chef/buyer
- Menu application presentations
- Product comparison sessions
- Line cuttings

**Example Notes:**
> "Conducted Rapid Rasoi demo at Aramark commissary. Chef was impressed with heat-and-serve convenience. Requesting 50-case trial."

---

### 5. Proposal
| Property | Value |
|----------|-------|
| **DB Value** | `proposal` |
| **Display Name** | Proposal |
| **Icon** | FileText (default) |
| **QuickLog** | No (via opportunities) |
| **When to Use** | Formal quotes or proposals submitted |

**Typical Use Cases:**
- Pricing proposals
- Contract bids
- Program submissions
- RFP responses
- Menu development proposals

**Example Notes:**
> "Submitted pricing proposal for healthcare accounts. 12-SKU program with quarterly volume commitments. Decision expected in 2 weeks."

---

### 6. Follow-up
| Property | Value |
|----------|-------|
| **DB Value** | `follow_up` |
| **Display Name** | Follow-up |
| **Icon** | FileText (default) |
| **QuickLog** | Yes |
| **When to Use** | Any follow-up action after previous activity |

**Typical Use Cases:**
- Checking on sample status
- Following up on proposals
- Reminder calls
- Status updates
- Pending decision check-ins

**Example Notes:**
> "Follow-up on sample sent last week. Buyer tried products, positive feedback on flavor profile. Moving to pricing discussion."

---

### 7. Trade Show
| Property | Value |
|----------|-------|
| **DB Value** | `trade_show` |
| **Display Name** | Trade Show |
| **Icon** | FileText (default) |
| **QuickLog** | No (via opportunities) |
| **When to Use** | Contacts made at industry trade shows |

**Typical Use Cases:**
- NRA Show contacts
- Regional food shows
- Distributor shows
- Principal showcases
- Industry conferences

**Example Notes:**
> "Met at NRA Show. Buyer for 15-location restaurant group looking for new frozen appetizers. Requested samples of McCRUM line."

---

### 8. Site Visit
| Property | Value |
|----------|-------|
| **DB Value** | `site_visit` |
| **Display Name** | Site Visit |
| **Icon** | FileText (default) |
| **QuickLog** | No (via opportunities) |
| **When to Use** | Visiting customer or distributor locations |

**Typical Use Cases:**
- Restaurant visits
- Distributor warehouse tours
- Kitchen assessments
- Menu audits
- Competitive analysis visits

**Example Notes:**
> "Visited GFS Denver DC. Toured warehouse, met with category manager. Good positioning on shelf placement for Kaufholds products."

---

### 9. Contract Review
| Property | Value |
|----------|-------|
| **DB Value** | `contract_review` |
| **Display Name** | Contract Review |
| **Icon** | FileText (default) |
| **QuickLog** | No (via opportunities) |
| **When to Use** | Contract negotiations or reviews |

**Typical Use Cases:**
- New account contracts
- Contract renewals
- Terms negotiations
- Pricing adjustments
- Volume commitment discussions

**Example Notes:**
> "Reviewed 2025 contract terms with USF. Negotiating 2% price increase. Buyer requested volume rebate tier structure."

---

### 10. Check-in
| Property | Value |
|----------|-------|
| **DB Value** | `check_in` |
| **Display Name** | Check-in |
| **Icon** | FileText (default) |
| **QuickLog** | No (via opportunities) |
| **When to Use** | Routine status checks with existing accounts |

**Typical Use Cases:**
- Monthly account reviews
- Order status checks
- Satisfaction surveys
- Issue resolution follow-up
- Relationship maintenance

**Example Notes:**
> "Quarterly check-in with Sysco buyer. Orders stable, no issues. Discussed new Rapid Rasoi SKUs launching Q2."

---

### 11. Social
| Property | Value |
|----------|-------|
| **DB Value** | `social` |
| **Display Name** | Social |
| **Icon** | FileText (default) |
| **QuickLog** | No (via opportunities) |
| **When to Use** | Social/networking interactions |

**Typical Use Cases:**
- LinkedIn connections
- Industry dinners
- Golf outings
- Customer appreciation events
- Holiday gatherings

**Example Notes:**
> "Dinner with PFG team at NRA. Informal discussion about 2025 category priorities. They're looking to expand ethnic frozen."

---

### 12. Note
| Property | Value |
|----------|-------|
| **DB Value** | `note` |
| **Display Name** | Note |
| **Icon** | FileText |
| **QuickLog** | Yes |
| **When to Use** | General notes that don't fit other categories |

**Typical Use Cases:**
- Internal reminders
- Account observations
- Market intelligence
- Competitor information
- General status updates

**Example Notes:**
> "Heard from distributor that competitor brand having supply issues. Good opportunity to push McCRUM alternatives."

---

## Planned Activity Type (1)

### 13. Sample (MVP Blocker)
| Property | Value |
|----------|-------|
| **DB Value** | `sample` |
| **Display Name** | Sample |
| **Icon** | Package (proposed) |
| **QuickLog** | Yes (planned) |
| **Status** | Not implemented |
| **When to Use** | Tracking product samples sent to prospects |

**Typical Use Cases:**
- Sample shipments to buyers
- In-person sample drops
- Trial orders for evaluation
- Menu development samples

**Additional Fields (Proposed):**
- `sample_feedback_status`: sent, received, positive, negative, pending, no_response
- `sample_product_id`: Reference to products table

**Example Notes:**
> "Sent 2 cases of McCRUM frozen entrees via UPS. Tracking #1Z999AA10123456784. Follow up in 1 week for feedback."

See [MVP Blocker Implementation Tasks](/docs/plans/MVP_BLOCKER_IMPLEMENTATION_TASKS.md) for implementation details.

---

## QuickLogForm Availability

The QuickLogForm (FAB-triggered activity logger) currently supports 5 activity types:

| Type | Available in QuickLog |
|------|----------------------|
| Call | Yes |
| Email | Yes |
| Meeting | Yes |
| Follow-up | Yes |
| Note | Yes |
| Demo | No |
| Proposal | No |
| Trade Show | No |
| Site Visit | No |
| Contract Review | No |
| Check-in | No |
| Social | No |
| **Sample** | **Planned** |

Activity types not in QuickLog can be created via:
- Opportunity detail page
- Contact detail page
- Organization detail page
- Full activity create form

---

## Icon Mapping

Current icon mapping in `src/atomic-crm/utils/getActivityIcon.tsx`:

| Activity Type | Icon Component | Visual |
|---------------|----------------|--------|
| call | Phone | 📞 |
| email | Mail | ✉️ |
| meeting | Calendar | 📅 |
| note | FileText | 📄 |
| *All others* | FileText (default) | 📄 |

**Recommended Icon Additions (Post-MVP):**
| Activity Type | Proposed Icon | Visual |
|---------------|---------------|--------|
| demo | Presentation | 📊 |
| proposal | FileSpreadsheet | 📋 |
| trade_show | Users | 👥 |
| site_visit | MapPin | 📍 |
| contract_review | FileCheck | ✅ |
| check_in | Clock | ⏰ |
| social | MessageCircle | 💬 |
| sample | Package | 📦 |

---

## Database Schema

```sql
-- Enum definition (12 values, sample TBD)
CREATE TYPE interaction_type AS ENUM (
  'call',
  'email',
  'meeting',
  'demo',
  'proposal',
  'follow_up',
  'trade_show',
  'site_visit',
  'contract_review',
  'check_in',
  'social',
  'note'
);

-- Activities table uses this enum
CREATE TABLE activities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  activity_type activity_type NOT NULL,  -- 'engagement' or 'interaction'
  type interaction_type NOT NULL,         -- The actual activity type
  subject TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  outcome TEXT,
  -- FK relationships
  contact_id BIGINT REFERENCES contacts(id),
  organization_id BIGINT REFERENCES organizations(id),
  opportunity_id BIGINT REFERENCES opportunities(id),
  created_by BIGINT REFERENCES sales(id),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

---

## TypeScript Types

```typescript
// Generated from database
export type InteractionType =
  | "call"
  | "email"
  | "meeting"
  | "demo"
  | "proposal"
  | "follow_up"
  | "trade_show"
  | "site_visit"
  | "contract_review"
  | "check_in"
  | "social"
  | "note";

// QuickLogForm schema (subset)
export const activityTypeSchema = z.enum([
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Note",
]);

// Mapping display names to DB values
export const ACTIVITY_TYPE_MAP: Record<string, string> = {
  Call: "call",
  Email: "email",
  Meeting: "meeting",
  "Follow-up": "follow_up",
  Note: "note",
};
```

---

## Reporting Considerations

### Activity Type Breakdown Report
- Count activities by type per principal
- Filter by date range
- Show conversion rates (activities → won opportunities)

### Rep Activity Report
- Total activities logged per rep
- Breakdown by type
- Identify low-activity reps

### Principal Reports
Include activity summary with:
- Call count
- Email count
- Meeting count
- Sample status (after implementation)
- Total touchpoints

---

## Related Documentation

- [PRD - Activity Tracking](/docs/PRD.md#activity-tracking)
- [QuickLogForm UX Analysis](/docs/analysis/QUICKLOG_FORM_UX_ANALYSIS.md)
- [MVP Blocker Implementation Tasks](/docs/plans/MVP_BLOCKER_IMPLEMENTATION_TASKS.md)

---

*This reference document describes the activity types available in Crispy-CRM for tracking sales activities and customer interactions.*
