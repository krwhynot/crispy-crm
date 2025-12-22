# Crispy CRM Domain Terminology

> **Purpose:** Reference document for Claude.ai Project Knowledge. Defines business domain terms and relationships.

---

## Business Model

**MFB (the company)** is a **food broker** connecting three types of organizations:

```
Principal (Manufacturer) → Distributor → Operator (Restaurant)
        ↓                      ↓              ↓
   Makes products      Warehouses/delivers   Serves food
```

**Scale:** 6 account managers, 9 principals, 50+ distributors

---

## Core Entities

### Principal
- **What:** Food manufacturer MFB represents (e.g., Heinz, Tyson, Del Monte)
- **Why important:** If we lose a principal, we lose their entire product catalog
- **In CRM:** Organization with `type = 'principal'`
- **Count:** 9 principals

### Distributor
- **What:** Company that buys from principals and sells to operators
- **Why important:** They warehouse and deliver products; bridge between manufacturer and restaurant
- **In CRM:** Organization with `type = 'distributor'`
- **Count:** 50+ distributors

### Operator
- **What:** Restaurant, hotel, hospital, school — any foodservice end customer
- **Why important:** The final buyer; where food is served to consumers
- **In CRM:** Organization with `type = 'operator'`

### Opportunity
- **What:** A sales deal in the pipeline
- **Key constraint:** Each opportunity is tied to exactly ONE principal
- **Why:** Selling Heinz ketchup is different from selling Tyson chicken wings

### Authorization
- **What:** Agreement where a distributor agrees to carry a principal's products
- **Why important:** Without authorization, distributor can't legally sell that principal's products
- **In CRM:** Junction record linking `distributor_id` ↔ `principal_id`

### Activity
- **What:** Any logged customer interaction
- **Types:** Call, Email, Meeting, Demo, Proposal, Follow-up, Trade Show, Site Visit, Contract Review, Check-in, Social, Note, Sample
- **Goal:** 10+ activities per week per principal

---

## User Roles

| Role | Access | Primary Use |
|------|--------|-------------|
| **Account Manager (AM)** | Own opportunities, activities | Daily pipeline work |
| **Manager** | All reps' data, reports | Oversight, coaching |
| **Admin** | Full access, user management | System administration |

**Count:** 6 Account Managers

---

## Pipeline Stages (7)

```
1. new_lead
   ↓
2. initial_outreach
   ↓
3. sample_visit_offered
   ↓
4. feedback_logged
   ↓
5. demo_scheduled
   ↓
6. closed_won  OR  closed_lost
```

### Stage Definitions

| Stage | Meaning | Typical Actions |
|-------|---------|-----------------|
| `new_lead` | Fresh opportunity, no contact yet | Research, assign AM |
| `initial_outreach` | First contact made | Call, email, introduce products |
| `sample_visit_offered` | Samples sent or visit scheduled | Ship samples, coordinate visit |
| `feedback_logged` | Customer feedback received | Document reactions, address concerns |
| `demo_scheduled` | Demo/presentation scheduled | Prepare presentation, confirm details |
| `closed_won` | Deal won! | Celebrate, ensure fulfillment |
| `closed_lost` | Deal lost | Document reason, learn for next time |

---

## Win/Loss Reasons

### Win Reasons
- `relationship` - Strong existing relationship with customer
- `product_quality` - Superior product quality/fit
- `price_competitive` - Competitive pricing
- `timing` - Right timing for customer needs
- `other` - (requires notes)

### Loss Reasons
- `price_too_high` - Price not competitive
- `no_authorization` - Distributor not authorized for principal
- `competitor_relationship` - Customer has existing competitor relationship
- `product_fit` - Product doesn't meet customer needs
- `timing` - Bad timing (budget, seasonality)
- `no_response` - Customer became unresponsive
- `other` - (requires notes)

---

## Sample Tracking Workflow

Samples are critical in food sales. The workflow:

```
sent → received → feedback_pending → feedback_received
```

When `activity.type = 'sample'`, the `sample_status` field is required.

---

## The Key Question

> **"What is the ONE thing I have to do this week for each principal?"**

Account managers must answer this in **under 2 seconds**. This drives the entire CRM design.

---

## MVP Must-Haves

| Feature | Why |
|---------|-----|
| Principal-filtered views | See one principal's entire pipeline |
| Quick activity logging | <30 seconds per entry |
| Excel export | Weekly reports for principals |
| Sample tracking | Log samples + follow-ups |
| Mobile/tablet access | Field sales on iPads |
| Task management | Panel, snooze, daily digest |

**NOT MVP:** PDF export, volume/price tracking, external integrations, territory management

---

## Quick Reference

| Term | Definition |
|------|------------|
| **AM** | Account Manager |
| **Principal** | Food manufacturer |
| **Distributor** | Wholesaler/delivery company |
| **Operator** | Restaurant/foodservice |
| **Authorization** | Distributor permission to carry products |
| **Opportunity** | Sales deal (one principal each) |
| **Activity** | Logged interaction |
| **MFB** | The food broker company |
