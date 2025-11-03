# Opportunity Management Specifications
**Date:** November 3, 2025
**Version:** 1.0
**Status:** ✅ Complete

---

## Executive Summary

This document captures the detailed opportunity management specifications added to PRD v1.3 based on industry research (Perplexity) and expert recommendations (GPT-5). These specifications align with Salesforce and HubSpot patterns while being tailored for the food distribution industry.

---

## Key Decisions & Specifications

### 1. Form UI Pattern
**Decision:** Side Panel (Material-UI Drawer)
- **Rationale:** Industry standard for in-context editing
- **Implementation:**
  - Opens from right side
  - 600px width on desktop, 80% on iPad
  - Sticky header/footer
  - Scrollable content area

### 2. Opportunity Naming Convention
**Decision:** Helper text with examples + auto-generate button
- **Examples provided:**
  - Standard: "Roka Akor - Tuna Roll Program"
  - Trade shows: "NRA Show 2025 - {Customer} - {Principal}"
  - Multi-location: "Whole Foods - {Principal} - {Region}"
  - Trials: "{Customer} - {Principal} Trial Q1 2025"
- **Auto-generate pattern:** "{Customer} - {Principal} - Q{X} {YYYY}"

### 3. Required Fields
**Core Requirements:**
1. Customer Organization
2. Principal Organization ⭐ (Most Important)
3. Opportunity Name
4. Expected Close Date
5. Opportunity Owner
6. At least one Contact (from Customer Org)
7. At least one Product (filtered by Principal)

### 4. Stage Transitions
**Decision:** Flexible transitions (no restrictions)
- Users can move between any stages
- All transitions logged in activity feed
- No workflow rules blocking stage changes
- Industry standard: Trust users, audit everything

### 5. Trade Show Handling
**Decision:** Separate opportunities per principal (Industry Best Practice)

**Pattern:**
```
Scenario: Customer interested in Ocean Hugger AND Fishpeople at NRA Show
Action: Create TWO opportunities:
1. "NRA Show 2025 - Nobu Miami - Ocean Hugger"
2. "NRA Show 2025 - Nobu Miami - Fishpeople"
```

**Benefits:**
- Accurate pipeline tracking per brand
- Clear win/loss rates per principal
- Proper commission calculations
- Matches Salesforce/HubSpot patterns

### 6. Campaign Grouping
**Implementation:**
- Campaign field links related opportunities
- Enables "NRA Show 2025" grouping
- Visual grouping in list views
- Quick filtering by event

### 7. Opportunity-Products Relationship
**Decision:** Junction table with notes (Industry Standard)
- **Table:** `opportunity_products`
- **Fields:** `opportunity_id`, `product_id`, `notes`
- **No pricing fields** (removed per architecture decision)
- **Pattern matches:** Salesforce OpportunityLineItem, HubSpot Line Items

### 8. Multi-Brand Filtering
**Decision:** "All My Principals" default with easy filtering

**Implementation:**
1. **Default View:** Shows all principals (no auto-filtering)
2. **Principal Filter:** Prominent multi-select at top
3. **Visual Differentiation:** Principal badges on every card
4. **Saved Views:** Quick filters per principal
5. **Reports:** All reports group by principal

**Rationale (from GPT-5):**
- Users need full pipeline visibility
- Automatic filtering creates confusion
- Visual grouping provides context
- One-click filtering when needed

### 9. Contact Association
**Pattern:**
- Contacts filtered by Customer Organization
- Multi-select with at least one required
- "Add New Contact" button in form
- Shows: Full Name, Position

### 10. Product Filtering
**Pattern:**
- Products filtered by selected Principal
- Prevents selection of wrong brand's products
- Maintains data integrity

---

## Smart Defaults

All defaults follow the "rule-based, not ML" principle:

- **Stage:** new_lead
- **Status:** active
- **Priority:** medium
- **Expected Close Date:** today + 90 days
- **Opportunity Owner:** current user
- **Lead Source:** (no default - user selects)

---

## Visual Hierarchy

Principal tracking emphasized throughout:
- ⭐ marked in 11+ locations in PRD
- Principal column prominent in all views
- Principal badge on opportunity cards
- Principal filter at top of all lists
- Reports default to principal grouping

---

## Database Patterns

### Junction Tables
```sql
-- Standard pattern for many-to-many relationships
CREATE TABLE opportunity_products (
  opportunity_id BIGINT REFERENCES opportunities(id),
  product_id BIGINT REFERENCES products(id),
  notes TEXT,
  PRIMARY KEY (opportunity_id, product_id)
);

CREATE TABLE opportunity_contacts (
  opportunity_id BIGINT REFERENCES opportunities(id),
  contact_id BIGINT REFERENCES contacts(id),
  role TEXT, -- 'decision_maker', 'influencer', etc.
  PRIMARY KEY (opportunity_id, contact_id)
);
```

### Campaign Tracking
```sql
-- Opportunities table includes:
campaign TEXT, -- "NRA Show 2025"
related_to_id BIGINT REFERENCES opportunities(id), -- parent opportunity
```

---

## Industry Validation

**Research Sources:**
1. **Perplexity:** CRM industry standards research
2. **GPT-5:** Multi-brand filtering recommendations
3. **Pattern Matching:**
   - Salesforce: Separate opportunities per product line
   - HubSpot: Deal splitting for multi-product scenarios
   - Microsoft Dynamics: Campaign association patterns

**Key Finding:** Major CRMs universally use separate records for multi-brand/product opportunities rather than combining them. This enables accurate forecasting, commission calculation, and pipeline analysis.

---

## Implementation Priority

1. **Immediate (MVP):**
   - Side panel forms
   - Required field validation
   - Junction table for products
   - Principal filtering
   - Campaign field

2. **Phase 2:**
   - Visual campaign grouping
   - Saved filter views
   - Booth visitor quick-create

3. **Future:**
   - Color-coded principal badges
   - Advanced campaign analytics
   - Trade show ROI reporting

---

## Success Criteria

✅ Users can track opportunities by principal (brand)
✅ Trade show leads tracked separately per brand
✅ Products filtered by selected principal
✅ Contacts filtered by customer organization
✅ All transitions allowed with audit logging
✅ Campaign field groups related opportunities
✅ Side panel forms for better context
✅ Naming conventions help consistency

---

## References

- PRD v1.3: Section 3.4 (Opportunities Module)
- Industry Research: Perplexity queries on CRM patterns
- Expert Recommendation: GPT-5 on multi-brand filtering
- Code Review: `OpportunityInputs.tsx` current implementation
- Validation Schema: `opportunities.ts` field requirements

---

**Status:** ✅ All specifications documented and added to PRD
**Next Step:** Implementation following these specifications