# E2E Manual Testing Workflow: Contact Forms

## Purpose
Step-by-step guide to manually test the complete contact creation, editing, and viewing flows across all contact form surfaces in Crispy CRM. Use this to identify UX issues, validate form behavior, and verify the contact management experience for MFB account managers.

**Business Context:** Contacts in Crispy CRM represent people at Distributors, Principals, and Operators (customer organizations) that MFB sales reps interact with. Every contact must belong to an organization (no orphan contacts allowed).

---

## WHAT TO OBSERVE & NOTE WHILE TESTING

### Performance Notes
- [ ] How long does the Organization autocomplete take to load?
- [ ] Any lag when adding/removing email or phone entries?
- [ ] Does the Manager autocomplete filter correctly?
- [ ] Do SlideOver tabs switch smoothly without visible loading?
- [ ] Does smart email parsing trigger instantly on blur/paste?

### UX Friction Points
- [ ] Were required fields clearly marked with asterisk (*)?
- [ ] Did you understand that at least one email is required on create?
- [ ] Was the email/phone array input intuitive (add/remove entries)?
- [ ] Did error messages explain HOW to fix issues?
- [ ] Did tab order make sense (keyboard navigation)?
- [ ] Were department type options clear for distributor staff?
- [ ] Was LinkedIn URL format guidance visible?

### Form Behavior
- [ ] Did Account Manager default to current user?
- [ ] Did smart email parsing work (john.doe@example.com → First: John, Last: Doe)?
- [ ] Did the email type default to "work"?
- [ ] Did "unsaved changes" warning appear when navigating away?
- [ ] Was the Manager dropdown excluding the current contact (no self-reference)?
- [ ] Did FormProgressProvider update as fields were filled?

### Accessibility
- [ ] Could you complete the form with keyboard only?
- [ ] Were touch targets large enough (44x44px minimum)?
- [ ] Did focus states appear clearly on all inputs?
- [ ] Did `aria-invalid` attributes appear on validation errors?
- [ ] Did `role="alert"` announce errors to screen readers?

---

## WORKFLOW A: FULL CONTACT CREATE FORM

### Pre-Requisites
1. Login to Crispy CRM as any user
2. Navigate to **Contacts** in sidebar
3. Click **"Create"** button (top right)

---

### STEP 1: Name Section (Required)

**Goal:** Enter contact's first and last name, optionally test smart email parsing.

| Action | What to Note |
|--------|--------------|
| 1. Observe the Name section | Is "First Name *" and "Last Name *" clearly marked as required? |
| 2. Leave first_name empty, try to submit | Does validation error appear? Is error message helpful? |
| 3. Fill in both names | Is form progress indicator updating? |
| 4. Check avatar upload control | Is it visible and touch-friendly (44x44px)? |

**Field Values:**

| Field | Enter This Value | Required? | Note |
|-------|------------------|-----------|------|
| First Name | "Maria" | YES | Was it auto-focused on page load? |
| Last Name | "Testcontact" | YES | Max 100 chars - test with long name |
| Avatar | Click to upload (optional) | NO | ImageEditorField component used |

---

### STEP 2: Organization Section (Required)

**Goal:** Link the contact to an existing organization (no orphan contacts allowed).

| Action | What to Note |
|--------|--------------|
| 1. Click Organization field | Does autocomplete load quickly (<1s)? |
| 2. Search for an organization | Does type-ahead search work? Results filtered? |
| 3. Leave empty and try to submit | Does it show "Organization is required"? |
| 4. Select a Distributor (e.g., "Sysco") | Does dropdown show organization type icons? |

**Field Values:**

| Field | Enter This Value | Required? | Note |
|-------|------------------|-----------|------|
| Organization | Select "Sysco" or any distributor | YES | AutocompleteOrganizationInput component |
| Account Manager | Should default to current user | YES | Filtered to active users with user_id |

---

### STEP 3: Contact Info Section

**Goal:** Add at least one email (required for create) and optionally phone numbers.

| Action | What to Note |
|--------|--------------|
| 1. Observe Email section | Is it clear that array input allows multiple entries? |
| 2. Click add button for first email | Is "work" type pre-selected? |
| 3. Enter email address | Does validation occur on blur (not on every keystroke)? |
| 4. Add a second email with "home" type | Can you add multiple entries easily? |
| 5. Try to submit with no email | Does error "At least one email is required" appear? |
| 6. Test smart parsing: paste "jane.smith@company.com" | Do First/Last name fields auto-populate to "Jane" and "Smith"? |
| 7. Remove an email entry | Is remove button visible and touch-friendly? |

**Email Values:**

| Email Value | Type | Note |
|-------------|------|------|
| "maria.test@sysco.com" | work | Primary work email (max 254 chars) |
| "maria.personal@gmail.com" | home | Secondary email |

**Phone Values:**

| Phone Value | Type | Note |
|-------------|------|------|
| "(312) 555-1234" | work | Format guidance shown? (max 30 chars) |
| "(312) 555-0000" | other | Mobile or secondary |

**JSONB Array Structure:**
```json
{
  "email": [{"value": "maria.test@sysco.com", "type": "work"}],
  "phone": [{"value": "(312) 555-1234", "type": "work"}]
}
```

---

### STEP 4: Additional Details Section

**Goal:** Fill optional professional and social fields.

| Action | What to Note |
|--------|--------------|
| 1. Expand Additional Details section | Is it collapsed by default? Clear toggle? |
| 2. Enter job title | Any autocomplete or suggestions? |
| 3. Select department from dropdown | Are 11 department choices visible? |
| 4. Select department_type (distributor role) | Are role categories relevant to food distribution? |
| 5. Enter LinkedIn URL | Does it validate linkedin.com domain? |
| 6. Enter notes | Is multiline textarea visible? Character count shown? |

**Field Values:**

| Field | Enter This Value | Max Length | Note |
|-------|------------------|------------|------|
| Job Title | "Regional Sales Director" | 100 | Free text |
| Department | "Sales" | 100 | Free text |
| Department Type | "sales_management" | enum | 7 distributor role options |
| LinkedIn URL | "https://linkedin.com/in/mariatest" | URL | Must be linkedin.com domain |
| Notes | "Key contact for Midwest region. Very responsive." | 5000 | HTML sanitized via sanitizeHtml() |

**Department Type Options (for Distributors):**
- senior_management
- sales_management
- district_management
- area_sales
- sales_specialist
- sales_support
- procurement

---

### STEP 5: Organization & Territory Section

**Goal:** Set up manager hierarchy and territory assignment.

| Action | What to Note |
|--------|--------------|
| 1. Click "Reports To" manager field | Does autocomplete search contacts? |
| 2. Search for a contact | Are results filtered correctly? |
| 3. (In edit mode) Try to select self | Is current contact excluded from dropdown? |
| 4. Enter district code | Format hint shown (e.g., D1, D73)? |
| 5. Enter territory name | Any autocomplete or predefined list? |

**Field Values:**

| Field | Enter This Value | Max Length | Note |
|-------|------------------|------------|------|
| Reports To | Leave empty or select another contact | N/A | manager_id FK, self-reference prevented |
| District Code | "D42" | 10 | Example format: D1, D73 |
| Territory | "Western Suburbs" | 100 | Free text |

---

### STEP 6: Save the Contact

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Button location clear? In FormToolbar? |
| 2. Watch for validation errors | Which fields (if any) failed? FormErrorSummary visible? |
| 3. If successful, note redirect | Should redirect to list (redirect="list") |
| 4. Verify contact appears in list | Is all data visible in list columns? |

**After Save Verification:**
- [ ] Contact appears in contacts list?
- [ ] `first_seen` and `last_seen` timestamps set to current time?
- [ ] `tags` array initialized to empty `[]`?
- [ ] Can you click row to open SlideOver and see all data?
- [ ] Cache keys invalidated: contacts, activities, opportunities?

---

## WORKFLOW B: CONTACT EDIT FORM

### Pre-Requisites
1. Navigate to **Contacts** in sidebar
2. Have at least one existing contact in the system

---

### STEP 1: Access Edit Form

| Method | How to Access | What to Note |
|--------|---------------|--------------|
| Direct URL | Navigate to `/contacts/{id}/edit` | Does form load with existing data? |
| From List | Click row → Edit button in SlideOver | Does mode toggle work? |
| From Show | Click Edit button on show page | Redirect correct? |

---

### STEP 2: Modify Contact Fields

| Action | What to Note |
|--------|--------------|
| 1. Change First Name | Does form mark as "dirty"? |
| 2. Add a new email to existing array | Can you add to existing entries? |
| 3. Remove an existing phone entry | Is remove button visible (44x44px)? |
| 4. Change Organization | Does it allow switching organizations? |
| 5. Set manager to self | Is self-reference prevented by dropdown filter? |
| 6. Clear a required field | Does validation error appear on blur? |

**Manager Self-Reference Prevention:**
- In edit mode, the Manager dropdown should exclude the current contact
- Schema validation: "Contact cannot be their own manager"

---

### STEP 3: Save Changes

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Button in FormToolbar visible? |
| 2. Verify success notification | Toast message appears? |
| 3. Note redirect | Should go to show page (redirect="show") |
| 4. Verify cache invalidation | Were contacts, activities, opportunities caches invalidated? |

---

## WORKFLOW C: CONTACT SLIDE-OVER (View + Edit Modes)

### Pre-Requisites
1. Navigate to **Contacts** list
2. Have at least one contact with activities and notes

---

### STEP 1: View Mode - Details Tab

| Action | What to Note |
|--------|--------------|
| 1. Click any contact row | SlideOver opens at 40vw width? Smooth animation? |
| 2. Check header | Shows `${first_name} ${last_name}`? |
| 3. Observe Identity section | Avatar, name, gender, title displayed? |
| 4. Check Position section | Organization link clickable? Department visible? |
| 5. Review Contact Info | Email array rendered with icons? Phone array? LinkedIn link? |
| 6. Check Account section | first_seen, last_seen dates? Sales rep link? |
| 7. Verify Tags section | Tag badges rendered if tags exist? |
| 8. Read Notes section | Notes in card with max-height scroll? |

---

### STEP 2: View Mode - Activities Tab

| Action | What to Note |
|--------|--------------|
| 1. Click **Activities** tab | Tab switch smooth? Count badge accurate? |
| 2. Observe activity list | Fetches activities for this contact? |
| 3. Check empty state | Shows "No activities" message if none exist? |
| 4. Click an activity | Opens activity detail? |

---

### STEP 3: View Mode - Notes Tab

| Action | What to Note |
|--------|--------------|
| 1. Click **Notes** tab | Count badge (nb_notes) accurate? |
| 2. Observe notes list | Can view existing notes? |
| 3. Test note creation | Can create new note from this tab? |
| 4. Check note formatting | HTML rendered correctly? |

---

### STEP 4: Switch to Edit Mode

| Action | What to Note |
|--------|--------------|
| 1. Click **Edit** button | Button visible and accessible? |
| 2. Observe form transition | ContactInputs component renders in Details tab? |
| 3. Check form has existing values | All fields pre-filled correctly from record? |
| 4. Make a change | Form becomes dirty? |
| 5. Click **Cancel** | Returns to view mode? Changes discarded? |
| 6. Edit again and **Save** | Success notification? Returns to view mode with updated data? |

---

### STEP 5: Deep Link and Keyboard Testing

| Action | What to Note |
|--------|--------------|
| 1. Navigate directly to `/contacts?view=123` | SlideOver opens on page load? |
| 2. Press **ESC** key | SlideOver closes? URL updates (removes ?view)? |
| 3. Click backdrop (outside SlideOver) | Does it close? |
| 4. Click **Browser Back** | SlideOver closes? History preserved? |
| 5. Press **Tab** repeatedly | Focus stays within SlideOver (focus trap)? |
| 6. Press **Shift+Tab** | Reverse tab cycling works? |
| 7. Open SlideOver, switch tabs, close | Tab state preserved on reopen? |

---

## WORKFLOW D: INLINE CONTACT CREATION (From Opportunity Form)

### Pre-Requisites
1. Navigate to **Opportunities** > **Create**
2. Select a Customer Organization first (required for contact filtering)

---

### STEP 1: Access Inline Contact Dialog

| Action | What to Note |
|--------|--------------|
| 1. In Contacts & Products section, look for **"+ New Contact"** | Button visible only after selecting customer org? |
| 2. Note button state before org selection | Is it disabled or hidden? |
| 3. Select a Customer Organization | Does button become enabled? |
| 4. Click **"+ New Contact"** button | Dialog opens smoothly? |
| 5. Check dialog title | Shows "Create new Contact"? |

---

### STEP 2: Verify Context Pre-fill

| Field | Expected Pre-fill | What to Note |
|-------|-------------------|--------------|
| Organization | Customer org from parent form | Was organization_id pre-filled? Locked/readonly? |
| Account Manager | Current user's sales_id | Was sales_id pre-filled? |
| first_seen | Current timestamp | Set automatically in transform? |
| last_seen | Current timestamp | Set automatically in transform? |

---

### STEP 3: Complete Inline Form

| Action | What to Note |
|--------|--------------|
| 1. Fill First Name: "Bob" | Required field validation? |
| 2. Fill Last Name: "Inlinetest" | Required field validation? |
| 3. Add Email: "bob.test@customer.com" | At least one required? |
| 4. Leave other fields as default | Optional fields skip cleanly? |
| 5. Click **Save** | Dialog closes? Loading state shown? |

---

### STEP 4: Return to Parent Form

| Action | What to Note |
|--------|--------------|
| 1. Check Contacts field in Opportunity form | New contact auto-selected in dropdown? |
| 2. Verify contact appears in autocomplete | Can search and find "Bob Inlinetest"? |
| 3. Continue opportunity creation | Form state preserved? No data loss? |
| 4. Open Contacts list in new tab | New contact visible in list? |

---

## WORKFLOW E: VALIDATION EDGE CASES

Test these boundary conditions to ensure proper error handling.

---

### TEXT FIELD LIMITS

| Field | Max Length | Test This | Expected Result |
|-------|------------|-----------|-----------------|
| first_name | 100 chars | Type 110+ characters | Should prevent or show error |
| last_name | 100 chars | Type 110+ characters | Should prevent or show error |
| title | 100 chars | Type 110+ characters | Should prevent or show error |
| department | 100 chars | Type 110+ characters | Should prevent or show error |
| notes | 5000 chars | Paste very long text | Should show remaining chars or error |
| district_code | 10 chars | Type "ABCDEFGHIJK" (11 chars) | Should prevent or show "District code too long" |
| territory_name | 100 chars | Type 110+ characters | Should prevent or show error |
| email value | 254 chars | Paste 260+ character email | Should reject with "Email too long" |
| phone value | 30 chars | Type 35+ characters | Should reject with "Phone too long" |
| tags (each) | 100 chars | Create tag with 110+ chars | Should truncate or reject |

**What to Note:**
- Does the field prevent typing beyond limit OR show error on save?
- Is there a character counter visible?
- Is the max length documented anywhere in the UI?

---

### REQUIRED FIELD VALIDATION

| Scenario | Expected Error | What to Note |
|----------|----------------|--------------|
| Submit with empty First Name | "First name is required" | Error location? Helpful message? |
| Submit with empty Last Name | "Last name is required" | |
| Submit with no Organization | "Organization is required - contacts cannot exist without an organization" | |
| Submit with no Account Manager | "Account manager is required" | |
| Submit with no Email (create only) | "At least one email address is required" | |
| Submit with empty email value in array | "Email address is required" | Array item validation |
| Edit mode with no email | Should allow (email only required on create) | Different behavior edit vs create? |

---

### INVALID FORMAT VALIDATION

| Field | Invalid Input | Expected Error |
|-------|---------------|----------------|
| Email value | "not-an-email" | "Invalid email address" |
| Email value | "missing@domain" | "Invalid email address" |
| Email value | "@nodomain.com" | "Invalid email address" |
| Email value | "spaces in@email.com" | "Invalid email address" |
| LinkedIn URL | "linkedin.com/in/user" | Should auto-add https:// OR error |
| LinkedIn URL | "https://twitter.com/user" | "URL must be from linkedin.com" |
| LinkedIn URL | "not-a-url-at-all" | Should fail URL parsing |
| Phone value | 40+ characters | "Phone number too long" (max 30) |

---

### EMAIL/PHONE TYPE VALIDATION

| Test | Input | Expected |
|------|-------|----------|
| Email type not in enum | Inject type="invalid" via API | Zod rejects (enum: work, home, other) |
| Email type uppercase | type="WORK" | Should fail - must be lowercase |
| Email type empty | type="" | Should default to "work" or reject |
| Phone type not in enum | Inject type="fax" via API | Should reject |

**Valid Types (lowercase only):**
- `"work"`
- `"home"`
- `"other"`

---

### SPECIAL CHARACTERS & INJECTION

| Test | Input | Expected |
|------|-------|----------|
| HTML in first_name | `<script>alert('xss')</script>` | Should sanitize/escape, not execute |
| HTML in notes | `<b>Bold</b><script>bad</script>` | Notes HTML sanitized via sanitizeHtml() |
| SQL-like in last_name | `'; DROP TABLE contacts; --` | Should save as literal text |
| Unicode in name | "Maria Acai Caf 日本語" | Should save correctly |
| Emoji in name | "Maria Testcontact 🎉" | Should save correctly |
| Very long word | "aaaa...(1000 a's)" in notes | Should handle without breaking UI |
| Newlines in title | "Director\nof\nSales" | Should preserve or strip newlines |

---

### SELF-REFERENTIAL MANAGER PREVENTION

| Scenario | Expected Behavior |
|----------|-------------------|
| Create mode: manager dropdown | Should show all contacts (no self yet) |
| Edit mode: manager dropdown | Should exclude current contact from options |
| Bypass UI: set manager_id = id via API | Schema rejects: "Contact cannot be their own manager" |
| Edit: change contact, then set as own manager | Dropdown should dynamically update filter |

---

### JSONB ARRAY EDGE CASES

| Scenario | Expected |
|----------|----------|
| Submit with empty email array `[]` (create) | Error: "At least one email required" |
| Submit with email entry missing value `{type:"work"}` | Error: "Email address is required" |
| Submit with 50 email entries | Should accept (no limit in schema) |
| Email entry with null type | Should default to "work" |
| Phone entry with empty value | Should accept (phone not required) |
| Phone array with 100 entries | Should accept |
| Duplicate email values | Should it warn or allow? |
| Mixed valid/invalid entries | Should reject only invalid ones? |

---

### SMART EMAIL PARSING EDGE CASES

| Email Pasted | Expected First Name | Expected Last Name |
|--------------|---------------------|-------------------|
| "john.doe@company.com" | "John" | "Doe" |
| "jsmith@company.com" | "Jsmith" | "" (empty - only one part) |
| "john.middle.doe@company.com" | "John" | "Middle" (takes first two parts) |
| "JOHN.DOE@COMPANY.COM" | "John" | "Doe" (case normalized) |
| Already has first/last filled | Should NOT overwrite | Should NOT overwrite |
| "support@company.com" | "Support" | "" (generic, one part) |
| "first_last@company.com" | "First" | "Last" (underscore as separator) |

---

### FORM STATE PRESERVATION

| Scenario | Expected | What to Note |
|----------|----------|--------------|
| Fill form, navigate away, come back | Unsaved changes warning first? | Does data persist after warning? |
| Fill form, refresh page | Data should be lost | Any draft functionality? |
| Validation error, fix it, submit | Should submit successfully | Does fixing clear error state? |
| Submit, server error, retry | Form data should still be there | No data loss on error? |
| SlideOver: edit, switch tabs, return | Edit state preserved? | Or reset to view mode? |

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
- [ ] Logical grouping of related fields (Name, Organization, Contact Info)?
- [ ] Section headers descriptive?
- [ ] FormProgressProvider updating as fields are filled?
- [ ] Collapsible sections start in correct state?

### Guidance & Help
- [ ] Helper text shown for required fields?
- [ ] LinkedIn URL format hint visible?
- [ ] District code example shown (e.g., D1, D73)?
- [ ] Character limits visible before hitting them?
- [ ] Email requirement (at least one) communicated?

### Array Input (Email/Phone)
- [ ] Add button discoverable and touch-friendly (44x44px)?
- [ ] Remove button visible on each entry?
- [ ] Type dropdown intuitive (work/home/other)?
- [ ] Can easily add multiple entries?
- [ ] Empty state clear when no entries exist?

### Inline Creation (From Opportunity)
- [ ] Organization pre-filled from parent context?
- [ ] Button state clear before/after org selection?
- [ ] Created contact immediately available in dropdown?
- [ ] Dialog closes and returns focus correctly?
- [ ] Parent form state preserved?

### Error Handling
- [ ] Errors appear via FormErrorSummary component?
- [ ] Error messages explain HOW to fix (not just what's wrong)?
- [ ] Form doesn't lose data on validation failure?
- [ ] `aria-invalid="true"` set on error fields?
- [ ] `aria-describedby` links input to error message?

### Performance
- [ ] Organization autocomplete loads < 1 second?
- [ ] Form submits < 2 seconds?
- [ ] SlideOver opens/closes smoothly (no jank)?
- [ ] Tab switching instant?
- [ ] Smart email parsing triggers immediately?

### Accessibility
- [ ] All fields keyboard accessible?
- [ ] Tab order follows visual order?
- [ ] Focus visible on all interactive elements?
- [ ] Touch targets minimum 44x44px (h-11 w-11)?
- [ ] Screen reader announces errors (role="alert")?
- [ ] Focus trap works in SlideOver?

---

## SUGGESTED UX IMPROVEMENTS (Based on Form Analysis)

### High Priority

1. **Email Requirement Clarity**
   - "At least one email required" not immediately obvious
   - **Suggestion:** Add helper text below email section or asterisk on first email field

2. **Smart Email Parsing Feedback**
   - When email auto-fills name, user may not notice
   - **Suggestion:** Brief toast or highlight on auto-filled fields

3. **Manager Self-Reference UX**
   - In edit mode, dropdown excludes self but no explanation
   - **Suggestion:** Show "(cannot select self)" hint in dropdown

### Medium Priority

4. **LinkedIn URL Auto-Fix**
   - Users often paste without https://
   - **Suggestion:** Auto-prepend https:// if missing, rather than error

5. **Department Type Context**
   - 7 options specific to distributor contacts
   - **Suggestion:** Show only when organization is a Distributor

6. **Notes Character Counter**
   - 5000 char limit not visible until exceeded
   - **Suggestion:** Show "X / 5000 characters" below notes field

### Nice to Have

7. **Email/Phone Reordering**
   - Cannot reorder array entries (SimpleFormIterator)
   - **Suggestion:** Add drag handles for reordering

8. **Avatar Cropping**
   - ImageEditorField may need crop guidance
   - **Suggestion:** Show recommended dimensions

---

## COMPLETION CHECKLIST

- [ ] Workflow A completed (Full Create Form)
- [ ] Workflow B completed (Edit Form)
- [ ] Workflow C completed (SlideOver View + Edit)
- [ ] Workflow D completed (Inline Creation from Opportunity)
- [ ] Workflow E completed (Validation Edge Cases)
- [ ] All issues documented using template
- [ ] UX improvement suggestions noted
- [ ] Performance observations recorded
- [ ] Accessibility items checked
- [ ] Smart email parsing tested
- [ ] JSONB array edge cases verified
- [ ] Self-referential manager prevention confirmed
