# Sample Tracking Workflow

Product sampling is critical to MFB's sales process. This guide explains how to track samples from sending through feedback collection.

## Overview

Samples follow a simple workflow:

```
Sent → Received → Feedback Given
                      │
                      ├── Positive (proceed to demo/close)
                      ├── Negative (document why, adjust approach)
                      ├── Pending (waiting for response)
                      └── No Response (follow up needed)
```

## When to Send Samples

Samples are typically sent during the **Sample/Visit Offered** pipeline stage. Common scenarios:

- Customer expresses interest in a product
- Distributor wants to evaluate before authorization
- Trade show follow-up
- New product introduction

## Recording a Sample Send

### Step 1: Log the Sample Activity

1. Click the **Log Activity** button (floating button, bottom right)
2. Select **Sample** as the activity type
3. Fill in required fields:
   - **Contact** - Who's receiving the sample
   - **Organization** - Automatically filled from contact
   - **Opportunity** - Link to the deal (if applicable)
   - **Notes** - What product was sampled, quantity, shipping details

### Step 2: Add Sample Details

In the notes field, include:
- Product name and SKU (if applicable)
- Quantity sent
- Ship date
- Tracking number (if available)
- Any special instructions given to recipient

**Example Note:**
```
Sent 2 cases of Rapid Rasoi Paneer Tikka Masala (SKU: RR-PTM-24)
Ship date: 11/15
Expected delivery: 11/18
Told customer to sample at lunch service, will follow up Monday.
```

### Step 3: Create Follow-Up Task

1. Check the **Create follow-up task** toggle in the activity form
2. Set the follow-up date (typically 3-7 days after expected delivery)
3. Add notes about what to follow up on

## Tracking Sample Status

### Status Workflow

| Status | Meaning | Next Action |
|--------|---------|-------------|
| **Sent** | Sample shipped, awaiting delivery | Wait for confirmation |
| **Received** | Customer confirmed receipt | Schedule feedback call |
| **Feedback Pending** | Customer tried product, waiting for formal feedback | Follow up |
| **Positive** | Customer likes it! | Move to next stage |
| **Negative** | Customer doesn't like it | Document reasons, consider alternatives |
| **No Response** | Can't reach customer | Escalate follow-up |

### Updating Sample Status

When you learn the sample status has changed:

1. Navigate to the **Opportunity** or **Contact**
2. Click **Log Activity** → **Sample**
3. Update the notes with new status information
4. If positive: Consider advancing the opportunity stage
5. If negative: Document the feedback for future reference

## Following Up on Samples

### The Follow-Up Call

When your follow-up task comes due:

1. Call the contact
2. Ask about their experience with the sample
3. Log the call activity with detailed feedback
4. Update the opportunity stage if appropriate

### Recording Feedback

**Positive Feedback Example:**
```
Follow-up call with Chef Mike.
Sample feedback: POSITIVE
- Loved the flavor profile
- Portion size works for their menu
- Asked about pricing and minimum orders
- Ready to schedule a meeting with the purchasing manager

Moving to Demo Scheduled stage.
```

**Negative Feedback Example:**
```
Follow-up call with Chef Mike.
Sample feedback: NEGATIVE
- Found the spice level too high for their customer base
- Liked the quality but won't work for their menu

Discussed milder alternative products. Will send Korma samples next week.
```

## Sample Follow-Up Reminders

The system helps you track samples that need attention:

### Visual Indicators

- **Green border** - Sample sent in last 7 days (fresh)
- **Yellow border** - Sample sent 8-14 days ago (needs follow-up)
- **Red border** - Sample sent 14+ days ago (stale - urgent follow-up needed)

### Dashboard Alerts

The Pipeline Table on your dashboard shows momentum indicators:
- Opportunities with pending samples will show decay indicators
- Check the "Sample/Visit Offered" stage for deals needing attention

## Best Practices

### Do's

- Log the sample send immediately (don't wait until end of day)
- Include tracking numbers when available
- Set realistic follow-up dates (account for shipping + trial time)
- Document ALL feedback, even negative
- Use the notes field liberally - future you will thank present you

### Don'ts

- Don't send samples without logging them
- Don't forget to create a follow-up task
- Don't skip documenting negative feedback (it helps pattern recognition)
- Don't let samples go more than 14 days without follow-up

## Common Scenarios

### Scenario 1: Multiple Samples to Same Customer

Log each sample as a separate activity so you can track feedback individually:
- Activity 1: "Sent Fryer Oil samples"
- Activity 2: "Sent Paneer Tikka samples"

### Scenario 2: Sample for Multiple Contacts

If sending samples to multiple people at the same customer:
1. Log primary activity on the main contact
2. Note in the description who else received samples
3. The activity auto-cascades to the opportunity timeline

### Scenario 3: Sample Without Opportunity

Sometimes you send samples before creating an opportunity (trade shows, exploratory):
1. Log the activity on the Contact record
2. Note there's no active opportunity yet
3. If positive response → Create the opportunity and link future activities

### Scenario 4: Re-Sampling After Negative Feedback

After negative feedback, if sending alternative products:
1. Update the original sample activity notes with final outcome
2. Log a new sample activity for the new product
3. Keep the opportunity in "Sample/Visit Offered" stage

## Sample Tracking Checklist

Use this checklist for every sample:

- [ ] Logged sample send activity
- [ ] Included product details in notes
- [ ] Created follow-up task (3-7 days out)
- [ ] Confirmed delivery (update notes when received)
- [ ] Made follow-up call
- [ ] Recorded feedback (positive/negative/pending)
- [ ] Updated opportunity stage based on outcome

---

*Remember: Well-documented sample feedback helps the whole team understand what works with different customer types.*
