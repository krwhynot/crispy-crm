# E2E Manual Testing Workflow: Create Opportunity with New Contact & Organization

## Purpose
Step-by-step guide to manually test the complete opportunity creation flow, including creating new contacts and organizations from scratch. Use this to identify UX issues and verify form completion.

---

## WHAT TO OBSERVE & NOTE WHILE TESTING

### Performance Notes
- [ ] How long does each dropdown/autocomplete take to load?
- [ ] Any lag when switching between form sections?
- [ ] Do inline create dialogs open smoothly?

### UX Friction Points
- [ ] Were any required fields not clearly marked?
- [ ] Did you get confused about what to enter in any field?
- [ ] Were error messages helpful or cryptic?
- [ ] Did tab order make sense (keyboard navigation)?
- [ ] Did any field lack placeholder text that would help?

### Form Behavior
- [ ] Did defaults populate correctly?
- [ ] Did dependent fields filter properly (contacts by org, products by principal)?
- [ ] Did "unsaved changes" warning appear when navigating away?
- [ ] Did duplicate detection warnings trigger?

### Accessibility
- [ ] Could you complete the form with keyboard only?
- [ ] Were touch targets large enough (44x44px minimum)?
- [ ] Did focus states appear clearly?

---

## WORKFLOW A: FULL OPPORTUNITY CREATE FORM

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Opportunities** in sidebar
3. Click **"Create"** button (top right)

---

### STEP 1: Create New Customer Organization (Inline)

**Goal:** Create a brand new organization that doesn't exist in the system.

| Action | What to Note |
|--------|--------------|
| 1. Click **"Customer Organization"** field | Does autocomplete load quickly? |
| 2. Type a unique name like "Test Acme Foods 2024" | Does it search as you type? Any lag? |
| 3. Look for "No results" or "Create new" option | Is it obvious how to create new? |
| 4. Click **"+ New Customer"** button | Does dialog open smoothly? |

**In the New Organization Dialog:**

| Field | Enter This Value | Required? | Note |
|-------|------------------|-----------|------|
| Name | "Test Acme Foods 2024" | YES | Was it pre-filled from your search? |
| Organization Type | Select "Customer" | NO (default: prospect) | Was "customer" auto-selected since you're adding as customer? |
| Priority | Leave as default | NO (default: C) | What was the default? |
| Account Manager | Your name | NO | Was it pre-selected to you? |
| Address | "123 Test Street" | NO | Easy to enter? |
| City | "Chicago" | NO | Does autocomplete work? |
| State | "IL" | NO | Did it auto-fill from city selection? |
| Postal Code | "60601" | NO | Any format validation? |
| Website | "testacme.com" | NO | Does it auto-add https://? |

| 5. Click **"Save"** | Does dialog close? Is org now selected? |

**Issues to Report:**
- Was it clear you could create inline?
- Did the organization persist and select properly?
- Any confusing labels or missing guidance?

---

### STEP 2: Create New Principal Organization (Inline)

**Goal:** Create a principal (manufacturer) organization.

| Action | What to Note |
|--------|--------------|
| 1. Click **"Principal Organization"** field | Does it filter to show only principals? |
| 2. Type "Test Principal Mfg 2024" | |
| 3. Click **"+ New Principal"** button | Different button than customer? Clear distinction? |

**In the New Principal Dialog:**

| Field | Enter This Value | Note |
|-------|------------------|------|
| Name | "Test Principal Mfg 2024" | |
| Organization Type | Should be "Principal" | Was it pre-selected? |
| (Complete other fields similarly) | | |

| 4. Click **"Save"** | Does it save and select? |

---

### STEP 3: Create New Contact (Inline)

**Goal:** Create a contact linked to your new customer organization.

| Action | What to Note |
|--------|--------------|
| 1. Expand **"Contacts & Products"** section | Was it already expanded? Clear toggle? |
| 2. Look at the Contacts field | Is it filtered to show only contacts from "Test Acme Foods"? |
| 3. Should show "No contacts found" (new org) | Is it clear you need to create one? |
| 4. Click **"+ New Contact"** button | Is button visible? Easy to find? |

**In the New Contact Dialog:**

| Field | Enter This Value | Required? | Note |
|-------|------------------|-----------|------|
| First Name | "John" | YES | Auto-focused? |
| Last Name | "Testuser" | YES | |
| Organization | Should show "Test Acme Foods 2024" | YES | Was it pre-filled since you're creating from that org context? |
| Email | Add "john.test@acmefoods.com" | YES (at least 1) | Is the array/multi-value UI clear? |
| Email Type | "Work" | | Easy to select type? |
| Phone | "(555) 123-4567" | NO | Phone format guidance? |
| Title | "Sales Director" | NO | |
| Account Manager | Your name | YES | Pre-selected? |

| 5. Click **"Save"** | Does contact appear in the contacts list? |

**Issues to Report:**
- Was the organization pre-filled correctly?
- Was it clear at least one email is required?
- Could you easily add multiple emails/phones?

---

### STEP 4: Complete Core Opportunity Fields

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Opportunity Name** | "Test Acme Q1 2025 Deal" | YES | Any auto-generate option? Character limit visible? |
| **Stage** | Leave as "New Lead" | YES | What was default? |
| **Priority** | Change to "High" | YES | What was default (should be "medium")? |
| **Estimated Close Date** | Leave as default | YES | What date was pre-filled? (should be +30 days) |
| **Account Manager** | Your name | NO | Was it pre-selected to you? |
| **Distributor** | Leave empty for now | NO | Clear that it's optional? |

---

### STEP 5: Add Products

| Action | What to Note |
|--------|--------------|
| 1. In **"Contacts & Products"** section, find Products | Is it clear at least 1 product required? |
| 2. Click product dropdown | Are products filtered by principal "Test Principal Mfg"? |
| 3. If no products exist for principal | Does it show "No products available"? Can you proceed? |
| 4. (If products exist) Select one | Is selection smooth? |
| 5. Add optional product notes | Is the notes field obvious? |

**POTENTIAL BLOCKER:** If no products exist for your new principal, you may not be able to save. Note if this happens!

---

### STEP 6: Optional Classification Fields

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Lead Source | Select "Trade Show" | Dropdown options clear? |
| Campaign | "Q1 2025 Test Campaign" | Free text? Suggestions? |
| Tags | Add "test", "demo" | Is tag input intuitive? |

---

### STEP 7: Optional Additional Details

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Description | "Testing opportunity creation flow" | Multiline? Character count? |
| Next Action | "Schedule discovery call" | |
| Next Action Date | Tomorrow's date | Date picker usability? |
| Decision Criteria | "Budget approval by March" | |
| Notes | "Created for E2E testing" | Separate from activity log? |

---

### STEP 8: Save the Opportunity

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Button location clear? |
| 2. Watch for validation errors | Which fields (if any) failed? Were error messages helpful? |
| 3. Watch for duplicate warning | Did similar opportunity warning trigger? |
| 4. If successful, note redirect | Where did it go? List? Detail view? |

**After Save:**
- [ ] Does opportunity appear in list?
- [ ] Is all entered data visible in slide-over/detail view?
- [ ] Are the linked contact and organizations showing correctly?

---

## WORKFLOW B: QUICK ADD FORM (Booth Visitor/Trade Show)

### Pre-Requisites
1. Navigate to **Opportunities**
2. Look for **"Quick Add"** or **"Booth Visitor"** button
3. Click to open the quick add dialog

---

### STEP 1: Pre-fill Settings (Persist Across Entries)

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Campaign | "Trade Show Demo 2025" | Does it save to localStorage? |
| Principal | Select any existing principal | Does it filter product options? |
| Products | Select 1-2 products | Multi-select combobox usability? |

---

### STEP 2: Contact Information (Per Entry)

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| First Name | "Jane" | YES | Auto-focused on form reset? |
| Last Name | "Quicktest" | YES | |
| Phone | "(555) 987-6543" | NO* | Is it clear phone OR email required? |
| Email | "jane.quick@testco.com" | NO* | Validation on blur? |

*At least one of phone or email is required.

---

### STEP 3: Organization Information (Per Entry)

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Organization Name | "Quick Test Company LLC" | Creates new org atomically? |
| City | Start typing "San Francisco" | Autocomplete work? |
| State | Should auto-fill "CA" | Did it populate from city? |

---

### STEP 4: Optional Quick Note

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Quick Note | "Met at booth 42, interested in product demo" | Character limit? Multiline? |

---

### STEP 5: Save Options

| Action | Expected Result | What to Note |
|--------|-----------------|--------------|
| Click **"Save & Add Another"** | Form resets, campaign/principal stay | Did focus return to First Name? |
| (or) Click **"Save & Close"** | Dialog closes, opportunity saved | Confirmation message? |

**After Save:**
- [ ] Did it create Contact + Organization + Opportunity atomically?
- [ ] Can you find all three records in their respective lists?
- [ ] Are they linked correctly?

---

## WORKFLOW C: CLOSE AN OPPORTUNITY (Win/Loss Modal)

### Test Closing as Won

1. Open the opportunity you created in Workflow A
2. Change **Stage** to **"Closed Won"**
3. A modal should appear for **Win Reason**

| Modal Field | Enter This Value | What to Note |
|-------------|------------------|--------------|
| Win Reason | Select "Relationship" | Options clear? All 5 visible? |
| (If "Other") | "Custom win reason text" | Does notes field appear? |

4. Save and verify the opportunity shows as won

### Test Closing as Lost

1. Create or find another opportunity
2. Change **Stage** to **"Closed Lost"**
3. A modal should appear for **Loss Reason**

| Modal Field | Enter This Value | What to Note |
|-------------|------------------|--------------|
| Loss Reason | Select "Price too high" | All 7 options visible? |
| (If "Other") | "Customer went with competitor" | Notes field appears? |

4. Save and verify

---

## ISSUE REPORTING TEMPLATE

Use this format to report issues found:

```
### Issue: [Short Title]

**Location:** [Form name / Section / Field]
**Severity:** Critical | High | Medium | Low
**Type:** Bug | UX Issue | Missing Feature | Accessibility

**Steps to Reproduce:**
1. ...
2. ...

**Expected:** What should happen
**Actual:** What actually happened

**Screenshot:** (if applicable)

**Suggested Fix:** (optional)
```

---

## UX IMPROVEMENT CHECKLIST

After completing the workflows, evaluate:

### Form Design
- [ ] Required fields clearly marked with asterisk (*)?
- [ ] Optional fields clearly distinguishable?
- [ ] Logical grouping of related fields?
- [ ] Section headers descriptive?
- [ ] Collapsible sections start in correct state?

### Guidance & Help
- [ ] Placeholder text in empty fields?
- [ ] Tooltips or help icons for complex fields?
- [ ] Example text shown (e.g., email format)?
- [ ] Character limits visible before hitting them?

### Inline Creation
- [ ] "Create new" option discoverable?
- [ ] Pre-fills context from parent form?
- [ ] Returns to correct place after creation?
- [ ] Created entity immediately available in dropdown?

### Error Handling
- [ ] Errors appear near the problematic field?
- [ ] Error messages explain HOW to fix (not just what's wrong)?
- [ ] Form doesn't lose data on validation failure?
- [ ] Can dismiss/retry without full re-entry?

### Performance
- [ ] Autocompletes load < 1 second?
- [ ] Form submits < 2 seconds?
- [ ] No visible jank when expanding sections?

### Accessibility
- [ ] All fields keyboard accessible?
- [ ] Tab order follows visual order?
- [ ] Focus visible on all interactive elements?
- [ ] Touch targets minimum 44x44px?
- [ ] Screen reader announces errors?

---

## SUGGESTED UX IMPROVEMENTS (Based on Form Analysis)

### High Priority

1. **Product Requirement Blocker**
   - If user creates new principal, there are no products for it
   - User cannot save opportunity without at least 1 product
   - **Suggestion:** Allow opportunity creation without products, or provide inline product creation

2. **Phone/Email Requirement Clarity (Quick Add)**
   - "Either phone OR email required" not obvious
   - **Suggestion:** Add helper text: "Provide at least one contact method"

3. **Contact Org Filtering Message**
   - When customer org is selected but has no contacts
   - **Suggestion:** Show "No contacts for [Org Name]. Create one?" with prominent CTA

### Medium Priority

4. **Auto-Generate Opportunity Name**
   - Name could default to "[Customer] - [Principal] - [Date]"
   - **Suggestion:** Add "Auto-generate" button or make it the default

5. **Form Section State**
   - Classification and Additional Details collapsed by default
   - **Suggestion:** Consider progressive disclosure with "Add more details" link

6. **Estimated Close Date Visibility**
   - Default +30 days may not be obvious
   - **Suggestion:** Show "(30 days from today)" hint next to field

### Nice to Have

7. **Quick Add Speed Optimizations**
   - City autocomplete should be fast for trade show use
   - **Suggestion:** Preload common US cities

8. **Save Confirmation**
   - After save, feedback could be more prominent
   - **Suggestion:** Toast notification with "View opportunity" link

---

## WORKFLOW D: VALIDATION EDGE CASES

Test these boundary conditions to ensure proper error handling.

---

### TEXT FIELD LIMITS

| Field | Max Length | Test This | Expected Result |
|-------|------------|-----------|-----------------|
| Opportunity Name | 255 chars | Paste 300+ characters | Should truncate or show error before save |
| Contact First Name | 100 chars | Type 110+ characters | Should prevent or show error |
| Contact Last Name | 100 chars | Type 110+ characters | Should prevent or show error |
| Organization Name | 255 chars | Paste 300+ characters | Should truncate or show error |
| Description | 2000 chars | Paste 2500+ characters | Should show remaining chars or error |
| Notes | 5000 chars | Paste very long text | Should show remaining chars or error |
| Next Action | 500 chars | Type 550+ characters | Should prevent or show error |
| Campaign | 100 chars | Type 110+ characters | Should prevent or show error |
| Tags (each) | 50 chars | Create tag with 60 chars | Should truncate or reject |
| Tags (count) | Max 20 tags | Try adding 25 tags | Should prevent adding more than 20 |

**What to Note:**
- Does the field prevent typing beyond limit OR show error on save?
- Is there a character counter visible?
- Is the max length documented anywhere in the UI?

---

### REQUIRED FIELD VALIDATION

| Scenario | Expected Error | What to Note |
|----------|----------------|--------------|
| Submit with empty Opportunity Name | "Name is required" or similar | Error location? Helpful message? |
| Submit with no Customer Organization | "Customer organization required" | Blocks save? Clear error? |
| Submit with no Contacts | Should allow (contacts optional in create) | Does it? |
| Submit with no Products | Should block - "At least 1 product required" | What happens? |
| Contact: empty First Name | "First name required" | |
| Contact: empty Last Name | "Last name required" | |
| Contact: no Email | "At least one email required" | Clear messaging? |
| Quick Add: no Phone AND no Email | "Phone or email required" | Is the "or" logic clear? |
| Quick Add: empty Organization Name | "Organization name required" | |
| Quick Add: empty City | "City required" | |
| Quick Add: empty State | "State required" | |

---

### INVALID FORMAT VALIDATION

| Field | Invalid Input | Expected Error |
|-------|---------------|----------------|
| Contact Email | "not-an-email" | "Invalid email format" |
| Contact Email | "missing@domain" | Should reject incomplete domain |
| Contact Email | "@nodomain.com" | Should reject missing local part |
| LinkedIn URL | "linkedin.com/in/user" | Should it auto-add https://? Or error? |
| LinkedIn URL | "https://twitter.com/user" | "Must be a LinkedIn URL" |
| Website | "not a url at all" | Error or auto-fix attempt? |
| Phone | "abc-def-ghij" | Should it validate format? Or accept anything? |
| Postal Code | "1234567890123456789" | Exceeds 20 char limit |

---

### SPECIAL CHARACTERS & INJECTION

| Test | Input | Expected |
|------|-------|----------|
| HTML in Name | `<script>alert('xss')</script>` | Should sanitize/escape, not execute |
| HTML in Description | `<b>Bold</b><script>bad</script>` | Sanitize script, may allow safe HTML |
| SQL-like in Name | `'; DROP TABLE opportunities; --` | Should save as literal text |
| Unicode in Name | "Café Açaí 日本語" | Should save correctly |
| Emoji in Name | "🍕 Pizza Deal 🎉" | Should save correctly |
| Very long word | "aaaa...(1000 a's)" | Should handle without breaking UI |

---

### BOUNDARY DATE VALUES

| Field | Test Value | Expected |
|-------|------------|----------|
| Estimated Close Date | Today | Should accept |
| Estimated Close Date | Yesterday | Should it warn about past dates? |
| Estimated Close Date | 10 years in future | Should accept or warn? |
| Next Action Date | Past date | Should it warn? Or accept? |
| Next Action Date | Clear/empty | Should clear properly |

---

### REFERENCE FIELD EDGE CASES

| Scenario | Expected Behavior |
|----------|-------------------|
| Select Contact from different Org than Customer | Should show mismatch warning |
| Select Distributor without Principal Authorization | Should show authorization warning |
| Create Contact, then change Customer Org | Should Contact selection clear? Or keep? |
| Select same Contact multiple times | Should prevent duplicates |
| Delete Organization while Opportunity form open | Handle gracefully? |

---

### QUICK ADD ATOMICITY TESTS

| Scenario | Expected |
|----------|----------|
| Network fails mid-save | All 3 records (Contact+Org+Opp) should NOT be created (rollback) |
| Close browser during save | No partial records |
| Duplicate org name detected | Warning but allow proceed? |
| Email already exists for different contact | Create new contact anyway? Or suggest existing? |

---

### FORM STATE PRESERVATION

| Scenario | Expected | What to Note |
|----------|----------|--------------|
| Fill form, navigate away, come back | Unsaved changes warning first? | Does data persist? |
| Fill form, refresh page | Data should be lost (or saved draft?) | Any draft functionality? |
| Fill form, open new tab, come back | Should preserve | Tabs isolated? |
| Validation error, fix it, submit | Should submit successfully | Does fixing clear error state? |
| Submit, server error, retry | Form data should still be there | No data loss? |

---

### CONCURRENT EDITING

| Scenario | Expected |
|----------|----------|
| Two users edit same Opportunity | Last save wins? Conflict warning? |
| Edit Opportunity while someone else deletes it | Graceful error on save? |

---

## VALIDATION TESTING RESULTS TEMPLATE

```
### Field: [Field Name]
**Form:** [Full Create / Quick Add / Edit Slide-Over]
**Test Type:** [Max Length / Required / Format / Special Chars]

| Input | Expected | Actual | Pass/Fail |
|-------|----------|--------|-----------|
| (test value) | (expected behavior) | (what happened) | ✅ / ❌ |

**Notes:** Additional observations
```

---

## COMPLETION CHECKLIST

- [ ] Workflow A completed (Full Create Form)
- [ ] Workflow B completed (Quick Add Form)
- [ ] Workflow C completed (Close Won/Lost)
- [ ] Workflow D completed (Validation Edge Cases)
- [ ] All issues documented using template
- [ ] UX improvement suggestions noted
- [ ] Performance observations recorded
- [ ] Accessibility items checked
