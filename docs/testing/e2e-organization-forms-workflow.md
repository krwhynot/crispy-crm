# E2E Manual Testing Workflow: Organization Forms

## Purpose
Step-by-step guide to manually test all organization form touchpoints in Crispy CRM: Create, Edit, SlideOver, List, Hierarchy, and Duplicate Detection. Use this to identify UX issues, verify form completion, and validate the complete organization lifecycle.

**Scope:** All 4 organization types (Customer, Prospect, Principal, Distributor) with type-specific behaviors.

---

## WHAT TO OBSERVE & NOTE WHILE TESTING

### Performance Notes
- [ ] How long does each dropdown/autocomplete take to load?
- [ ] Any lag when switching between form sections?
- [ ] Does the SlideOver open smoothly?
- [ ] Are list filters responsive?
- [ ] Does duplicate detection API call cause visible delay?

### UX Friction Points
- [ ] Were any required fields not clearly marked?
- [ ] Did you get confused about what to enter in any field?
- [ ] Were error messages helpful or cryptic?
- [ ] Did tab order make sense (keyboard navigation)?
- [ ] Did any field lack placeholder text that would help?
- [ ] Was organization type selection intuitive?

### Form Behavior
- [ ] Did defaults populate correctly (Priority: C, Account Manager: you)?
- [ ] Did dependent fields work properly (segment options by org type)?
- [ ] Did "unsaved changes" warning appear when navigating away?
- [ ] Did duplicate detection warnings trigger appropriately?
- [ ] Did website auto-prefix with `https://`?

### Accessibility
- [ ] Could you complete the form with keyboard only?
- [ ] Were touch targets large enough (44x44px minimum)?
- [ ] Did focus states appear clearly?
- [ ] Did error messages have proper ARIA attributes?

---

## WORKFLOW A: FULL ORGANIZATION CREATE FORM

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Organizations** in sidebar
3. Click **"Create"** button (top right)

---

### STEP 1: Basic Information Section

**Goal:** Enter required and core classification fields.

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Name** | "Test Organization 2024" | YES | Only required field. Was it auto-focused? |
| **Organization Type** | Select "Customer" | NO (default: prospect) | Are all 4 types visible? Clear distinction? |
| **Priority** | Leave as default | NO (default: C) | What was the default? A/B/C/D badge styling? |

**Type Options to Test:**
| Type | Color Badge | When to Use |
|------|-------------|-------------|
| Customer | Clay Orange (tag-warm) | Active paying customer |
| Prospect | Olive Green (tag-sage) | Potential customer in pipeline |
| Principal | Eggplant (tag-purple) | Manufacturer MFB represents |
| Distributor | Teal (tag-teal) | Sysco, USF, etc. |

---

### STEP 2: Account & Segment Section

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Account Manager** | Your name | NO | Was it pre-selected to current user? |
| **Segment** | Select any segment | NO | Did options match org type? (Playbook for Dist/Principal, Operator Segments for Customer/Prospect) |

**Segment Behavior by Type:**
- Customer/Prospect → Shows Operator Segment choices
- Distributor/Principal → Shows Playbook Category choices

---

### STEP 3: Address Section

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Street Address** | "123 Test Street" | NO | Max 500 chars. Character limit visible? |
| **City** | "Chicago" | NO | Max 100 chars. Autocomplete? |
| **State** | "IL" | NO | Max 100 chars. StateCombobox input? |
| **Postal Code** | "60601" | NO | Max 20 chars. Format validation? |

---

### STEP 4: Additional Details Section (Collapsible)

**Goal:** Test the collapsible "Additional Details" section.

| Action | What to Note |
|--------|--------------|
| 1. Find the "Additional Details" toggle | Is it expanded or collapsed by default? |
| 2. Expand the section | Smooth animation? |

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Website** | "testorg.com" | NO | Did it auto-add `https://`? |
| **Phone** | "(555) 123-4567" | NO | Max 30 chars. Format guidance? |
| **LinkedIn URL** | "linkedin.com/company/test" | NO | Did it validate LinkedIn domain? Auto-add https? |
| **Description** | "Test organization for E2E testing" | NO | Max 5000 chars. Multiline? HTML sanitized? |

**URL Auto-Prefix Behavior:**
- `testorg.com` → Should become `https://testorg.com`
- `http://testorg.com` → Should remain `http://testorg.com`
- `https://testorg.com` → Should remain unchanged

---

### STEP 5: Save the Organization

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Button location clear? Primary styling? |
| 2. Watch for validation errors | Which fields (if any) failed? Helpful messages? |
| 3. Watch for duplicate warning | Did DuplicateOrgWarningDialog appear? (See Workflow F) |
| 4. If successful, note redirect | Where did it go? List? Detail view? |

**After Save:**
- [ ] Does organization appear in list?
- [ ] Is all entered data visible in SlideOver?
- [ ] Are computed fields initialized (nb_contacts: 0, nb_opportunities: 0)?

---

## WORKFLOW B: EDIT ORGANIZATION (FULL PAGE)

### Pre-Requisites
1. Navigate to an existing organization
2. Open the full **Edit** page (not SlideOver)

---

### STEP 1: Verify Pre-filled Values

| Check | What to Note |
|-------|--------------|
| All fields populated correctly? | Compare to what was saved |
| Computed fields visible? | nb_contacts, nb_opportunities, nb_notes |
| Account manager correct? | Shows user name, not ID |
| Timestamps visible? | created_at, updated_at in sidebar? |

---

### STEP 2: Test Principal Type Change Warning

**CRITICAL TEST:** Changing organization_type FROM "Principal" triggers a warning.

| Action | Expected Behavior |
|--------|-------------------|
| 1. Edit a Principal organization | |
| 2. Change type to "Customer" | Warning dialog should appear |
| 3. Check warning message | "Cannot change type - products are assigned to this principal" |
| 4. Try to save | Should be blocked with PRINCIPAL_VALIDATION_REQUIRED error |

**Why This Matters:** Principals have products linked to them. Downgrading breaks product relationships.

---

### STEP 3: Edit Various Fields

| Field | Change To | What to Note |
|-------|-----------|--------------|
| Name | "Updated Test Org 2024" | Does duplicate check re-run? |
| Priority | Change A → D | Badge updates immediately? |
| Address fields | Update city/state | StateCombobox behavior? |
| Description | Add longer text | HTML sanitization working? |

---

### STEP 4: Save and Verify Cache Invalidation

| Action | What to Note |
|--------|--------------|
| 1. Save changes | Success message? |
| 2. Navigate to Organization List | Does updated data appear? |
| 3. Check Contacts list | Were contact organization names updated? |
| 4. Check Opportunities list | Were opportunity organization names updated? |

**Cache Invalidation:** The edit handler invalidates organizations, contacts, and opportunities caches.

---

## WORKFLOW C: SLIDEOVER QUICK EDIT

### Pre-Requisites
1. Navigate to **Organizations** list
2. Click on any organization row
3. SlideOver should open (40vw right panel, URL: `?view={id}`)

---

### STEP 1: Details Tab (Default)

| Check | What to Note |
|-------|--------------|
| Tab is active by default? | "Details" should be selected |
| View mode vs Edit mode toggle? | Is there a pencil/edit icon? |
| All fields displayed? | Name, type, priority, address, contact info |
| Edit button works? | Switches to inline edit mode? |

**In Edit Mode:**
| Action | What to Note |
|--------|--------------|
| 1. Change a field value | Does it update in real-time? |
| 2. Save changes | Does it persist? |
| 3. Cancel edit | Does it revert? |

---

### STEP 2: Contacts Tab

| Check | What to Note |
|-------|--------------|
| Tab label shows count? | "Contacts (3)" format? |
| Related contacts listed? | Avatars, names displayed? |
| Click on contact | Opens contact SlideOver? URL: `/contacts?view={id}` |
| Empty state (new org) | "No contacts found" message? Guidance to create? |

---

### STEP 3: Opportunities Tab

| Check | What to Note |
|-------|--------------|
| Tab label shows count? | "Opportunities (5)" format? |
| Related opportunities listed? | Shows pipeline stage, expected close date? |
| Click on opportunity | Opens opportunity show page? |
| Filtering | Shows opportunities where this org is Customer, Principal, OR Distributor |

**Note:** Uses `@or` filter: `customer_organization_id.eq.X OR principal_organization_id.eq.X OR distributor_organization_id.eq.X`

---

### STEP 4: Notes Tab

| Check | What to Note |
|-------|--------------|
| Existing notes displayed? | Chronological order? |
| Add new note | Note creation form? |
| Edit existing note | Inline editing? |
| Delete note | Confirmation dialog? |

---

### STEP 5: Authorizations Tab (DISTRIBUTOR ONLY)

**This tab only appears for organizations with type="distributor".**

| Check | What to Note |
|-------|--------------|
| Tab visible? | Only for distributors |
| Principal authorizations listed? | Which principals this distributor carries |
| Add authorization | Can add principal authorization? |
| Authorization status | Active/inactive indicators? |
| Product exceptions | Exception management UI? |

**Test with Non-Distributor:**
| Action | Expected |
|--------|----------|
| Open Customer organization | Authorizations tab should NOT appear |
| Open Principal organization | Authorizations tab should NOT appear |
| Open Distributor organization | Authorizations tab SHOULD appear |

---

## WORKFLOW D: ORGANIZATION LIST & FILTERS

### Pre-Requisites
1. Navigate to **Organizations** in sidebar
2. View the list page

---

### STEP 1: List Display

| Column | Check | What to Note |
|--------|-------|--------------|
| Name | Sortable, max-width 250px | Click to open SlideOver |
| Type | Badge styling | Correct colors per type? |
| Priority | A/B/C/D badges | Variant styling correct? |
| Parent | Parent org name | Hidden on tablet? |
| Contacts | Count metric | Hidden on mobile? |
| Opportunities | Count metric | Hidden on mobile? |

---

### STEP 2: Search Bar

| Action | What to Note |
|--------|--------------|
| 1. Type in search bar | Searches name, city, state, sector (ILIKE) |
| 2. Search "Chicago" | Returns orgs with Chicago in name OR city |
| 3. Clear search | Returns to full list? |
| 4. Search non-existent | "No organizations found" empty state? |

---

### STEP 3: Filter Chip Bar

**Filter Configuration:**

| Filter | Type | Options |
|--------|------|---------|
| Type | Multiselect | Customer, Prospect, Principal, Distributor |
| Priority | Multiselect | A, B, C, D |
| Playbook/Segment | Reference | Segments list |
| Owner | Reference | Sales reps list |

| Action | What to Note |
|--------|--------------|
| 1. Click Type filter | Popover with checkboxes? |
| 2. Select "Customer" + "Prospect" | Multiple selection works? |
| 3. Apply filter | List updates? Chip shows active filter? |
| 4. Clear individual filter | X button on chip? |
| 5. Clear all filters | "Clear all" button? |

---

### STEP 4: Sidebar Filters

| Filter | Visibility | What to Note |
|--------|------------|--------------|
| Playbook Categories | Distributor/Principal | Shows for these types only |
| Operator Segments | Customer/Prospect | Shows for these types only |
| Account Manager | Always | Owner dropdown |

**Conditional Filter Test:**
| Action | Expected |
|--------|----------|
| Filter list to Distributors only | Playbook Categories filter appears in sidebar |
| Filter list to Customers only | Operator Segments filter appears in sidebar |

---

### STEP 5: Bulk Actions & Export

| Action | What to Note |
|--------|--------------|
| 1. Select multiple rows | Checkbox column? |
| 2. Bulk action toolbar appears? | What actions available? |
| 3. Click Export/CSV | Downloads organizations.csv? |
| 4. Verify export data | Flattened fields? Related names resolved? |

---

### STEP 6: Keyboard Navigation

| Key | Expected Behavior |
|-----|-------------------|
| ArrowDown | Move to next row |
| ArrowUp | Move to previous row |
| Enter | Open selected organization |

---

## WORKFLOW E: PARENT-CHILD HIERARCHY

### Pre-Requisites
1. Have at least one organization to use as parent
2. Navigate to Organizations > Create

---

### STEP 1: Create Branch Organization

| Action | What to Note |
|--------|--------------|
| 1. From parent org SlideOver, click "Add Branch" | Pre-fills parent_organization_id? |
| 2. Or: In create form, select Parent Organization | Reference input works? |
| 3. Fill required fields | |
| 4. Save | Branch linked to parent? |

---

### STEP 2: Verify Hierarchy Display

| Check | What to Note |
|-------|--------------|
| Parent column in list | Shows parent org name? |
| Parent link | Clickable to navigate? |
| Child org sidebar | Shows "Parent: [Name]" section? |
| Parent org sidebar | Shows "Branches" section with children? |

---

### STEP 3: Hierarchy Scope Testing

| Scope | Meaning | What to Note |
|-------|---------|--------------|
| National | Brand/HQ level | Scope badge displayed? |
| Regional | Regional operating company | |
| Local | Single location | |

**Test for Distributors:**
| Action | What to Note |
|--------|--------------|
| Create national distributor | Set org_scope = "national" |
| Create regional child | Set org_scope = "regional", parent = national |
| Create local child | Set org_scope = "local", parent = regional |
| Verify hierarchy display | Chain visible in UI? |

---

### STEP 4: Edge Case: Self-Reference Prevention

| Action | Expected |
|--------|----------|
| Edit organization | |
| Set parent_organization_id = self | Should be prevented or error on save |

---

## WORKFLOW F: DUPLICATE DETECTION

### Pre-Requisites
1. Know the name of an existing organization
2. Navigate to Organizations > Create

---

### STEP 1: Trigger Duplicate Warning

| Action | What to Note |
|--------|--------------|
| 1. Enter existing org name exactly | |
| 2. Tab out of name field (onBlur) | Does API call trigger? |
| 3. Wait for response | Loading indicator? |
| 4. DuplicateOrgWarningDialog appears | Soft warning, not blocking |

---

### STEP 2: Duplicate Dialog Behavior

| Element | What to Note |
|---------|--------------|
| Dialog title | "Potential Duplicate Found" or similar? |
| Matched organization shown | Name and details of existing org? |
| "View Existing" option | Opens existing org? |
| "Create Anyway" button | Proceeds with creation? |
| "Change Name" option | Closes dialog, focuses name field? |

---

### STEP 3: Test Case-Insensitivity

| Input | Existing Name | Should Trigger? |
|-------|---------------|-----------------|
| "Acme Foods" | "Acme Foods" | YES |
| "acme foods" | "Acme Foods" | YES (case-insensitive) |
| "ACME FOODS" | "Acme Foods" | YES |
| "Acme Food" | "Acme Foods" | Maybe (partial match?) |

---

### STEP 4: Proceed Despite Duplicate

| Action | What to Note |
|--------|--------------|
| 1. Click "Create Anyway" | Dialog closes |
| 2. Hidden submit button triggers | Form submits |
| 3. Organization created | Despite duplicate warning |
| 4. Both orgs now exist | Verify in list |

---

## WORKFLOW G: VALIDATION EDGE CASES

### TEXT FIELD LIMITS

| Field | Max Length | Test This | Expected Result |
|-------|------------|-----------|-----------------|
| Name | 255 chars | Paste 300+ characters | Truncate or error before save |
| Phone | 30 chars | Type 35+ characters | Prevent or show error |
| Address/Street | 500 chars | Paste 600+ characters | Truncate or error |
| City | 100 chars | Type 110+ characters | Prevent or show error |
| State | 100 chars | Type 110+ characters | Prevent or show error |
| Postal Code | 20 chars | Type 25+ characters | Prevent or show error |
| Description | 5000 chars | Paste 6000+ characters | Show remaining or error |
| Notes | 5000 chars | Paste 6000+ characters | Show remaining or error |
| Tags | 1000 chars | Create many long tags | Prevent or show error |
| Tax Identifier | 50 chars | Type 60+ characters | Prevent or show error |
| Territory | 100 chars | Type 110+ characters | Prevent or show error |

---

### REQUIRED FIELD VALIDATION

| Scenario | Expected Error | What to Note |
|----------|----------------|--------------|
| Submit with empty Name | "Name is required" | Error near field? |
| Submit with whitespace-only Name | Should trim and error | Whitespace handling? |
| Name after trim is empty | "Name is required" | Trimming works? |

**Note:** Name is the ONLY required field for organizations.

---

### INVALID FORMAT VALIDATION

| Field | Invalid Input | Expected Error |
|-------|---------------|----------------|
| Email | "not-an-email" | "Invalid email format" |
| Email | "missing@domain" | Should reject |
| Website | "not a url" | Should sanitize or error |
| Website | "ftp://invalid.com" | Only http/https valid? |
| LinkedIn URL | "twitter.com/user" | "Must be a LinkedIn URL" |
| LinkedIn URL | "linkedin.com/in/user" | Should auto-add https:// |
| Founded Year | 1700 | Below 1800 minimum |
| Founded Year | 2030 | Above current year |
| Employee Count | -5 | Must be positive |
| Credit Limit | -100 | Must be non-negative |

---

### SPECIAL CHARACTERS & INJECTION

| Test | Input | Expected |
|------|-------|----------|
| HTML in Name | `<script>alert('xss')</script>` | Sanitize, not execute |
| HTML in Description | `<b>Bold</b><script>bad</script>` | Sanitize script, may allow safe HTML |
| SQL-like in Name | `'; DROP TABLE organizations; --` | Save as literal text |
| Unicode in Name | "Café Açaí 日本語" | Save correctly |
| Emoji in Name | "🏢 Test Corp 🎉" | Save correctly |
| Very long word | "aaaa...(500 a's)" | Handle without UI break |

---

### TYPE-SPECIFIC VALIDATION

| Scenario | Expected |
|----------|----------|
| Change Principal to Customer (has products) | Block with warning |
| Change Distributor to Prospect | Authorizations orphaned? Warning? |
| Delete organization with contacts | Soft delete? Warning? |
| Delete organization with opportunities | Soft delete? Warning? |

---

### REFERENCE FIELD EDGE CASES

| Scenario | Expected Behavior |
|----------|-------------------|
| Select parent that would create cycle | Prevent circular hierarchy |
| Select deleted parent organization | Should not be selectable |
| Parent deleted after child creation | Handle gracefully |
| Select same segment multiple times | Prevent duplicates |

---

### FORM STATE PRESERVATION

| Scenario | Expected | What to Note |
|----------|----------|--------------|
| Fill form, navigate away, come back | Unsaved changes warning | Data persists? |
| Fill form, refresh page | Data lost (no draft) | Any draft feature? |
| Validation error, fix it, submit | Submit successfully | Error state clears? |
| Submit, server error, retry | Form data preserved | No data loss? |

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
- [ ] Organization type selection prominent and clear?

### Guidance & Help
- [ ] Placeholder text in empty fields?
- [ ] Tooltips or help icons for complex fields?
- [ ] Example text shown (e.g., URL format)?
- [ ] Character limits visible before hitting them?
- [ ] Type-specific help (what is a Principal vs Distributor)?

### Duplicate Detection
- [ ] Warning appears at appropriate time (onBlur)?
- [ ] Clear options: view existing, create anyway, change name?
- [ ] Non-blocking (soft warning)?
- [ ] Case-insensitive matching works?

### Error Handling
- [ ] Errors appear near the problematic field?
- [ ] Error messages explain HOW to fix (not just what's wrong)?
- [ ] Form doesn't lose data on validation failure?
- [ ] Can dismiss/retry without full re-entry?

### SlideOver Experience
- [ ] Tabs clearly labeled with counts?
- [ ] Smooth transition between tabs?
- [ ] Edit mode obvious and easy to toggle?
- [ ] Close button accessible (X or click outside)?
- [ ] URL updates when opening/closing?

### Performance
- [ ] Autocompletes load < 1 second?
- [ ] Form submits < 2 seconds?
- [ ] No visible jank when expanding sections?
- [ ] Duplicate check completes quickly?
- [ ] SlideOver opens smoothly?

### Accessibility
- [ ] All fields keyboard accessible?
- [ ] Tab order follows visual order?
- [ ] Focus visible on all interactive elements?
- [ ] Touch targets minimum 44x44px?
- [ ] Screen reader announces errors (role="alert")?
- [ ] aria-invalid on fields with errors?
- [ ] aria-describedby linking inputs to error messages?

---

## SUGGESTED UX IMPROVEMENTS (Based on Form Analysis)

### High Priority

1. **Type Selection Clarity**
   - 4 types (Customer, Prospect, Principal, Distributor) may confuse new users
   - **Suggestion:** Add tooltip or help text explaining each type

2. **Segment Conditional Visibility**
   - Segment options change based on org type
   - **Suggestion:** Add helper text "Select organization type first to see relevant segments"

3. **Principal Change Warning**
   - Blocking error appears only after trying to save
   - **Suggestion:** Show inline warning immediately when type dropdown changes from Principal

### Medium Priority

4. **Duplicate Detection Timing**
   - Currently triggers onBlur
   - **Suggestion:** Consider debounced onChange for faster feedback

5. **Address Auto-Complete**
   - City/State/Zip could benefit from Google Places or similar
   - **Suggestion:** Add address autocomplete integration

6. **Hierarchy Visualization**
   - Parent-child relationships not visually obvious
   - **Suggestion:** Add tree view or breadcrumb for hierarchy

### Nice to Have

7. **Bulk Import**
   - CSV import functionality exists in types
   - **Suggestion:** Make bulk import accessible from UI

8. **Quick Organization Switcher**
   - Jump between orgs without returning to list
   - **Suggestion:** Add navigation arrows or quick search

---

## TESTING RESULTS TEMPLATE

```
### Field: [Field Name]
**Form:** [Create / Edit / SlideOver]
**Test Type:** [Max Length / Required / Format / Special Chars]

| Input | Expected | Actual | Pass/Fail |
|-------|----------|--------|-----------|
| (test value) | (expected behavior) | (what happened) | ✅ / ❌ |

**Notes:** Additional observations
```

---

## COMPLETION CHECKLIST

- [ ] Workflow A completed (Full Create Form)
- [ ] Workflow B completed (Full Page Edit)
- [ ] Workflow C completed (SlideOver Quick Edit - all 5 tabs)
- [ ] Workflow D completed (List & Filters)
- [ ] Workflow E completed (Parent-Child Hierarchy)
- [ ] Workflow F completed (Duplicate Detection)
- [ ] Workflow G completed (Validation Edge Cases)
- [ ] All issues documented using template
- [ ] UX improvement suggestions noted
- [ ] Performance observations recorded
- [ ] Accessibility items checked
- [ ] Type-specific behaviors verified (Principal warnings, Distributor authorizations)
