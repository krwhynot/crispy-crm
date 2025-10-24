# CSV Stage Mapping Guide - Business Decision Required

## Overview

Your legacy CSV contains **custom stage names** from your old sales process. Before we can import the 592 opportunities, you need to map each legacy stage to one of the **8 new semantic stages** in your CRM.

## The Problem

Your CSV has stage names like:
- "Sampled/Visited invite-3" (533 opportunities - 90% of your data!)
- "VAF BLITZ" (64 opportunities)
- "Contacted-phone/email-2" (60 opportunities)
- Plus dates, text fragments, and other invalid data

These don't match your new standardized pipeline stages.

---

## Your 8 New Pipeline Stages

Here's what's available in the new CRM:

| Stage Value | Display Name | Description |
|-------------|--------------|-------------|
| `new_lead` | New Lead | Initial prospect identification |
| `initial_outreach` | Initial Outreach | First contact and follow-up |
| `sample_visit_offered` | Sample/Visit Offered | Product sampling and visit scheduling |
| `awaiting_response` | Awaiting Response | Following up after sample delivery |
| `feedback_logged` | Feedback Logged | Recording customer feedback |
| `demo_scheduled` | Demo Scheduled | Planning product demonstrations |
| `closed_won` | Closed - Won | Successful deal completion |
| `closed_lost` | Closed - Lost | Lost opportunity |

---

## What YOU Need to Decide

For each legacy stage name below, decide which new stage it should map to:

### ✅ Valid Legacy Stages (Need Mapping)

**1. "Sampled/Visited invite-3" (533 opportunities - YOUR BIGGEST GROUP!)**
- What does this mean in your sales process?
- Suggested mapping: `sample_visit_offered` (since it mentions sampling/visiting)
- **YOUR DECISION:** `sample_visit_offered`

**2. "VAF BLITZ" (64 opportunities)**
- What campaign or activity is "VAF BLITZ"?
- Suggested mapping: `initial_outreach` (if it's a mass outreach campaign)
- **YOUR DECISION:** `initial_outreach` Add VAF BLITZ in the notes

**3. "Contacted-phone/email-2" (60 opportunities)**
- First contact attempt?
- Suggested mapping: `initial_outreach`
- **YOUR DECISION:** initial_outreach

**4. "Lead-discovery-1" (25 opportunities)**
- Initial lead identification?
- Suggested mapping: `new_lead`
- **YOUR DECISION:** `new_lead`

**5. "SOLD-7" (20 opportunities)**
- Deals that closed successfully?
- Suggested mapping: `closed_won`
- **YOUR DECISION:** `closed_won`

**6. "demo-cookup-6" (11 opportunities)**
- Demo or tasting scheduled?
- Suggested mapping: `demo_scheduled`
- **YOUR DECISION:** `demo_scheduled`

**7. "Follow-up-4" (11 opportunities)**
- Waiting for response after outreach?
- Suggested mapping: `awaiting_response`
- **YOUR DECISION:** `awaiting_response`

**8. "Feedback- received-5" (5 opportunities)**
- Customer provided feedback?
- Suggested mapping: `feedback_logged`
- **YOUR DECISION:** `feedback_logged`

**9. "order support-8" (1 opportunity)**
- Post-sale support?
- Suggested mapping: `closed_won`
- **YOUR DECISION:** `closed_won`

**10. "Open" / "open" (16 + 4 = 20 opportunities)**
- Generic open status?
- Suggested mapping: `new_lead` (or choose based on context)
- **YOUR DECISION:** `new_lead`

**11. "VAF Blitz" (1 opportunity - lowercase variant)**
- Same as #2 above
- Suggested mapping: Same as "VAF BLITZ"
- **YOUR DECISION:**  Same as "VAF BLITZ"

**12. "Swap" (1 opportunity)**
- Product swap/replacement deal?
- Suggested mapping: Choose based on context
- **YOUR DECISION:** _______________________

**13. "Phone" (1 opportunity)**
- Phone outreach?
- Suggested mapping: `initial_outreach`
- **YOUR DECISION:** `initial_outreach`

### ❌ Invalid Data (Will Be SKIPPED)

These rows have invalid data in the STAGE column and will be filtered out:
- **254 blank/empty** - No stage data
- **27 date values** (e.g., "3/10/2025", "1/27/2025") - Wrong column data
- **8 text fragments** (e.g., "and land lovers and better balance") - Data errors
- **1 "Kaufholds"** - Organization name in wrong column
- **1 "Loss Business. Reason?"** - Wrong field

**Total invalid rows: ~292** (will be skipped during import)
**Total valid rows: ~592** (will be imported after you provide mappings)

---

## How to Provide Your Decisions

### Option 1: Fill Out This Document

Edit this file and fill in your decisions above, then save it.

### Option 2: Create a JSON Mapping File

Create `data/stage_mapping.json` with your mappings:

```json
{
  "Sampled/Visited invite-3": "sample_visit_offered",
  "VAF BLITZ": "initial_outreach",
  "Contacted-phone/email-2": "initial_outreach",
  "Lead-discovery-1": "new_lead",
  "SOLD-7": "closed_won",
  "demo-cookup-6": "demo_scheduled",
  "Follow-up-4": "awaiting_response",
  "Feedback- received-5": "feedback_logged",
  "order support-8": "closed_won",
  "Open": "new_lead",
  "open": "new_lead",
  "VAF Blitz": "initial_outreach",
  "Swap": "new_lead",
  "Phone": "initial_outreach"
}
```

---

## Questions to Consider

When deciding mappings, ask yourself:

1. **"Sampled/Visited invite-3" (90% of your data!)**
   - Does the "-3" indicate step 3 in a numbered process?
   - Is this AFTER sending samples or BEFORE?
   - Have customers actually received samples, or are you offering them?

2. **"VAF BLITZ"**
   - Is this a specific campaign name?
   - What stage of the sales cycle does this represent?
   - Is it initial outreach or something later?

3. **Numbered stages (Lead-discovery-1, Contacted-2, Sampled-3, etc.)**
   - Did your old system use a numbered progression (1→2→3→4...)?
   - How do these numbers map to the new semantic names?

4. **"SOLD-7" and "order support-8"**
   - Are these both closed/won deals?
   - Or is order-support-8 something that happens AFTER the sale?

---

## Why This Matters

The migration script uses **FAIL FAST** validation:
- If ANY row has an unmapped stage, the entire import stops
- No partial imports (prevents data corruption)
- You'll see exactly which stage is missing

This forces you to make deliberate decisions about your data rather than guessing.

---

## Next Steps

1. **Fill out your decisions** in this document or create `stage_mapping.json`
2. **Review with your team** (especially for the 533 "Sampled/Visited invite-3" opportunities!)
3. **Save your decisions**
4. **Tell Claude**: "I've completed the stage mapping"
5. Claude will generate the migration script with your mappings

---

## Need Help Deciding?

Consider:
- Looking at a few example opportunities from each stage in the CSV
- Checking your sales process documentation
- Asking team members who used the old system
- Reviewing what "Sampled/Visited invite-3" meant in your workflow

The most important decision is **"Sampled/Visited invite-3"** since it's 90% of your data!
