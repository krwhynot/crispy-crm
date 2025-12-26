# E2E Test Workflows

> Consolidated guide for end-to-end manual testing patterns in Crispy CRM

**Scope:** All form touchpoints, CRUD operations, and user interactions across desktop (1440px+) and tablet (768px-1439px) viewports.

---

## Table of Contents

1. [Overview & Common Patterns](#overview--common-patterns)
2. [Organizations](#organizations)
3. [Contacts](#contacts)
4. [Opportunities](#opportunities)
5. [Tasks](#tasks)
6. [Products](#products)
7. [Dashboard](#dashboard)
8. [Common Patterns Reference](#common-patterns-reference)

---

## Overview & Common Patterns

### What to Observe While Testing

Every workflow should include observation of these four areas:

#### Performance Notes
- How long does each dropdown/autocomplete take to load?
- Any lag when switching between form sections or tabs?
- Does the SlideOver open smoothly (40vw, right panel)?
- Are list filters responsive?
- Do drag-drop operations feel instant?

#### UX Friction Points
- Were required fields clearly marked with asterisk (*)?
- Did you get confused about what to enter in any field?
- Were error messages helpful or cryptic?
- Did tab order make sense (keyboard navigation)?
- Did any field lack placeholder text that would help?

#### Form Behavior
- Did defaults populate correctly (Priority, Account Manager)?
- Did dependent/conditional fields work properly?
- Did "unsaved changes" warning appear when navigating away?
- Did duplicate detection warnings trigger appropriately?

#### Accessibility
- Could you complete the form with keyboard only?
- Were touch targets large enough (44x44px minimum)?
- Did focus states appear clearly?
- Did error messages have proper ARIA attributes (`aria-invalid`, `aria-describedby`, `role="alert"`)?

### Standard Touch Points

| Surface | URL Pattern | Width |
|---------|-------------|-------|
| Create Form | `/[resource]/create` | Full page |
| Edit Form | `/[resource]/{id}` | Full page |
| SlideOver | `/[resource]?view={id}` | 40vw right panel |
| List | `/[resource]` | Full page with filters |

---

## Organizations

Step-by-step guide to test all organization form touchpoints: Create, Edit, SlideOver, List, Hierarchy, and Duplicate Detection.

**Scope:** All 4 organization types (Customer, Prospect, Principal, Distributor) with type-specific behaviors.

### Workflow A: Full Organization Create Form

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Organizations** in sidebar
3. Click **"Create"** button (top right)

#### STEP 1: Basic Information Section

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

#### STEP 2: Account & Segment Section

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Account Manager** | Your name | NO | Was it pre-selected to current user? |
| **Segment** | Select any segment | NO | Did options match org type? |

**Segment Behavior by Type:**
- Customer/Prospect → Shows Operator Segment choices
- Distributor/Principal → Shows Playbook Category choices

#### STEP 3: Address Section

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Street Address** | "123 Test Street" | NO | Max 500 chars |
| **City** | "Chicago" | NO | Max 100 chars |
| **State** | "IL" | NO | StateCombobox input? |
| **Postal Code** | "60601" | NO | Max 20 chars |

#### STEP 4: Additional Details Section (Collapsible)

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Website** | "testorg.com" | NO | Did it auto-add `https://`? |
| **Phone** | "(555) 123-4567" | NO | Max 30 chars |
| **LinkedIn URL** | "linkedin.com/company/test" | NO | Did it validate LinkedIn domain? |
| **Description** | "Test organization for E2E testing" | NO | Max 5000 chars. HTML sanitized? |

**URL Auto-Prefix Behavior:**
- `testorg.com` → Should become `https://testorg.com`
- `http://testorg.com` → Should remain `http://testorg.com`
- `https://testorg.com` → Should remain unchanged

#### STEP 5: Save the Organization

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Button location clear? Primary styling? |
| 2. Watch for validation errors | Which fields (if any) failed? |
| 3. Watch for duplicate warning | Did DuplicateOrgWarningDialog appear? |
| 4. If successful, note redirect | Where did it go? List? Detail view? |

**After Save:**
- [ ] Does organization appear in list?
- [ ] Is all entered data visible in SlideOver?
- [ ] Are computed fields initialized (nb_contacts: 0, nb_opportunities: 0)?

---

### Workflow B: Edit Organization (Full Page)

**Pre-Requisites:**
1. Navigate to an existing organization
2. Open the full **Edit** page (not SlideOver)

#### STEP 1: Verify Pre-filled Values

| Check | What to Note |
|-------|--------------|
| All fields populated correctly? | Compare to what was saved |
| Computed fields visible? | nb_contacts, nb_opportunities, nb_notes |
| Account manager correct? | Shows user name, not ID |
| Timestamps visible? | created_at, updated_at in sidebar? |

#### STEP 2: Test Principal Type Change Warning

**CRITICAL TEST:** Changing organization_type FROM "Principal" triggers a warning.

| Action | Expected Behavior |
|--------|-------------------|
| 1. Edit a Principal organization | |
| 2. Change type to "Customer" | Warning dialog should appear |
| 3. Check warning message | "Cannot change type - products are assigned to this principal" |
| 4. Try to save | Should be blocked with PRINCIPAL_VALIDATION_REQUIRED error |

**Why This Matters:** Principals have products linked to them. Downgrading breaks product relationships.

#### STEP 3: Edit Various Fields

| Field | Change To | What to Note |
|-------|-----------|--------------|
| Name | "Updated Test Org 2024" | Does duplicate check re-run? |
| Priority | Change A → D | Badge updates immediately? |
| Address fields | Update city/state | StateCombobox behavior? |
| Description | Add longer text | HTML sanitization working? |

#### STEP 4: Save and Verify Cache Invalidation

| Action | What to Note |
|--------|--------------|
| 1. Save changes | Success message? |
| 2. Navigate to Organization List | Does updated data appear? |
| 3. Check Contacts list | Were contact organization names updated? |
| 4. Check Opportunities list | Were opportunity organization names updated? |

**Cache Invalidation:** The edit handler invalidates organizations, contacts, and opportunities caches.

---

### Workflow C: SlideOver Quick Edit

**Pre-Requisites:**
1. Navigate to **Organizations** list
2. Click on any organization row
3. SlideOver should open (40vw right panel, URL: `?view={id}`)

#### STEP 1: Details Tab (Default)

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

#### STEP 2: Contacts Tab

| Check | What to Note |
|-------|--------------|
| Tab label shows count? | "Contacts (3)" format? |
| Related contacts listed? | Avatars, names displayed? |
| Click on contact | Opens contact SlideOver? URL: `/contacts?view={id}` |
| Empty state (new org) | "No contacts found" message? |

#### STEP 3: Opportunities Tab

| Check | What to Note |
|-------|--------------|
| Tab label shows count? | "Opportunities (5)" format? |
| Related opportunities listed? | Shows pipeline stage, expected close date? |
| Click on opportunity | Opens opportunity show page? |
| Filtering | Shows opportunities where this org is Customer, Principal, OR Distributor |

**Note:** Uses `@or` filter: `customer_organization_id.eq.X OR principal_organization_id.eq.X OR distributor_organization_id.eq.X`

#### STEP 4: Notes Tab

| Check | What to Note |
|-------|--------------|
| Existing notes displayed? | Chronological order? |
| Add new note | Note creation form? |
| Edit existing note | Inline editing? |
| Delete note | Confirmation dialog? |

#### STEP 5: Authorizations Tab (DISTRIBUTOR ONLY)

**This tab only appears for organizations with type="distributor".**

| Check | What to Note |
|-------|--------------|
| Tab visible? | Only for distributors |
| Principal authorizations listed? | Which principals this distributor carries |
| Add authorization | Can add principal authorization? |
| Authorization status | Active/inactive indicators? |

**Test with Non-Distributor:**

| Action | Expected |
|--------|----------|
| Open Customer organization | Authorizations tab should NOT appear |
| Open Principal organization | Authorizations tab should NOT appear |
| Open Distributor organization | Authorizations tab SHOULD appear |

---

### Workflow D: Organization List & Filters

**Pre-Requisites:**
1. Navigate to **Organizations** in sidebar
2. View the list page

#### STEP 1: List Display

| Column | Check | What to Note |
|--------|-------|--------------|
| Name | Sortable, max-width 250px | Click to open SlideOver |
| Type | Badge styling | Correct colors per type? |
| Priority | A/B/C/D badges | Variant styling correct? |
| Parent | Parent org name | Hidden on tablet? |
| Contacts | Count metric | Hidden on mobile? |
| Opportunities | Count metric | Hidden on mobile? |

#### STEP 2: Search Bar

| Action | What to Note |
|--------|--------------|
| 1. Type in search bar | Searches name, city, state, sector (ILIKE) |
| 2. Search "Chicago" | Returns orgs with Chicago in name OR city |
| 3. Clear search | Returns to full list? |
| 4. Search non-existent | "No organizations found" empty state? |

#### STEP 3: Filter Chip Bar

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

#### STEP 4: Sidebar Filters

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

#### STEP 5: Bulk Actions & Export

| Action | What to Note |
|--------|--------------|
| 1. Select multiple rows | Checkbox column? |
| 2. Bulk action toolbar appears? | What actions available? |
| 3. Click Export/CSV | Downloads organizations.csv? |
| 4. Verify export data | Flattened fields? Related names resolved? |

#### STEP 6: Keyboard Navigation

| Key | Expected Behavior |
|-----|-------------------|
| ArrowDown | Move to next row |
| ArrowUp | Move to previous row |
| Enter | Open selected organization |

---

### Workflow E: Parent-Child Hierarchy

**Pre-Requisites:**
1. Have at least one organization to use as parent
2. Navigate to Organizations > Create

#### STEP 1: Create Branch Organization

| Action | What to Note |
|--------|--------------|
| 1. From parent org SlideOver, click "Add Branch" | Pre-fills parent_organization_id? |
| 2. Or: In create form, select Parent Organization | Reference input works? |
| 3. Fill required fields | |
| 4. Save | Branch linked to parent? |

#### STEP 2: Verify Hierarchy Display

| Check | What to Note |
|-------|--------------|
| Parent column in list | Shows parent org name? |
| Parent link | Clickable to navigate? |
| Child org sidebar | Shows "Parent: [Name]" section? |
| Parent org sidebar | Shows "Branches" section with children? |

#### STEP 3: Hierarchy Scope Testing

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

#### STEP 4: Edge Case: Self-Reference Prevention

| Action | Expected |
|--------|----------|
| Edit organization | |
| Set parent_organization_id = self | Should be prevented or error on save |

---

### Workflow F: Duplicate Detection

**Pre-Requisites:**
1. Know the name of an existing organization
2. Navigate to Organizations > Create

#### STEP 1: Trigger Duplicate Warning

| Action | What to Note |
|--------|--------------|
| 1. Enter existing org name exactly | |
| 2. Tab out of name field (onBlur) | Does API call trigger? |
| 3. Wait for response | Loading indicator? |
| 4. DuplicateOrgWarningDialog appears | Soft warning, not blocking |

#### STEP 2: Duplicate Dialog Behavior

| Element | What to Note |
|---------|--------------|
| Dialog title | "Potential Duplicate Found" or similar? |
| Matched organization shown | Name and details of existing org? |
| "View Existing" option | Opens existing org? |
| "Create Anyway" button | Proceeds with creation? |
| "Change Name" option | Closes dialog, focuses name field? |

#### STEP 3: Test Case-Insensitivity

| Input | Existing Name | Should Trigger? |
|-------|---------------|-----------------|
| "Acme Foods" | "Acme Foods" | YES |
| "acme foods" | "Acme Foods" | YES (case-insensitive) |
| "ACME FOODS" | "Acme Foods" | YES |
| "Acme Food" | "Acme Foods" | Maybe (partial match?) |

#### STEP 4: Proceed Despite Duplicate

| Action | What to Note |
|--------|--------------|
| 1. Click "Create Anyway" | Dialog closes |
| 2. Hidden submit button triggers | Form submits |
| 3. Organization created | Despite duplicate warning |
| 4. Both orgs now exist | Verify in list |

---

### Workflow G: Organization Validation Edge Cases

#### TEXT FIELD LIMITS

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

#### REQUIRED FIELD VALIDATION

| Scenario | Expected Error | What to Note |
|----------|----------------|--------------|
| Submit with empty Name | "Name is required" | Error near field? |
| Submit with whitespace-only Name | Should trim and error | Whitespace handling? |
| Name after trim is empty | "Name is required" | Trimming works? |

**Note:** Name is the ONLY required field for organizations.

#### INVALID FORMAT VALIDATION

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

#### SPECIAL CHARACTERS & INJECTION

| Test | Input | Expected |
|------|-------|----------|
| HTML in Name | `<script>alert('xss')</script>` | Sanitize, not execute |
| HTML in Description | `<b>Bold</b><script>bad</script>` | Sanitize script, may allow safe HTML |
| SQL-like in Name | `'; DROP TABLE organizations; --` | Save as literal text |
| Unicode in Name | "Cafe Acai 日本語" | Save correctly |
| Emoji in Name | "Test Corp" | Save correctly |
| Very long word | "aaaa...(500 a's)" | Handle without UI break |

#### TYPE-SPECIFIC VALIDATION

| Scenario | Expected |
|----------|----------|
| Change Principal to Customer (has products) | Block with warning |
| Change Distributor to Prospect | Authorizations orphaned? Warning? |
| Delete organization with contacts | Soft delete? Warning? |
| Delete organization with opportunities | Soft delete? Warning? |

#### REFERENCE FIELD EDGE CASES

| Scenario | Expected Behavior |
|----------|-------------------|
| Select parent that would create cycle | Prevent circular hierarchy |
| Select deleted parent organization | Should not be selectable |
| Parent deleted after child creation | Handle gracefully |
| Select same segment multiple times | Prevent duplicates |

#### FORM STATE PRESERVATION

| Scenario | Expected | What to Note |
|----------|----------|--------------|
| Fill form, navigate away, come back | Unsaved changes warning | Data persists? |
| Fill form, refresh page | Data lost (no draft) | Any draft feature? |
| Validation error, fix it, submit | Submit successfully | Error state clears? |
| Submit, server error, retry | Form data preserved | No data loss? |

---

## Contacts

Step-by-step guide to test contact creation, editing, and viewing flows. Contacts represent people at Distributors, Principals, and Operators that MFB sales reps interact with.

**Business Context:** Every contact must belong to an organization (no orphan contacts allowed).

### Workflow A: Full Contact Create Form

**Pre-Requisites:**
1. Login to Crispy CRM as any user
2. Navigate to **Contacts** in sidebar
3. Click **"Create"** button (top right)

#### STEP 1: Name Section (Required)

| Field | Enter This Value | Required? | Note |
|-------|------------------|-----------|------|
| First Name | "Maria" | YES | Was it auto-focused on page load? |
| Last Name | "Testcontact" | YES | Max 100 chars |
| Avatar | Click to upload (optional) | NO | ImageEditorField component used |

#### STEP 2: Organization Section (Required)

| Field | Enter This Value | Required? | Note |
|-------|------------------|-----------|------|
| Organization | Select "Sysco" or any distributor | YES | AutocompleteOrganizationInput component |
| Account Manager | Should default to current user | YES | Filtered to active users with user_id |

| Action | What to Note |
|--------|--------------|
| 1. Click Organization field | Does autocomplete load quickly (<1s)? |
| 2. Search for an organization | Does type-ahead search work? |
| 3. Leave empty and try to submit | Does it show "Organization is required"? |
| 4. Select a Distributor (e.g., "Sysco") | Does dropdown show organization type icons? |

#### STEP 3: Contact Info Section

| Action | What to Note |
|--------|--------------|
| 1. Observe Email section | Is it clear that array input allows multiple entries? |
| 2. Click add button for first email | Is "work" type pre-selected? |
| 3. Enter email address | Does validation occur on blur (not on every keystroke)? |
| 4. Add a second email with "home" type | Can you add multiple entries easily? |
| 5. Try to submit with no email | Does error "At least one email is required" appear? |
| 6. Test smart parsing: paste "jane.smith@company.com" | Do First/Last name fields auto-populate? |
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

#### STEP 4: Additional Details Section

| Field | Enter This Value | Max Length | Note |
|-------|------------------|------------|------|
| Job Title | "Regional Sales Director" | 100 | Free text |
| Department | "Sales" | 100 | Free text |
| Department Type | "sales_management" | enum | 7 distributor role options |
| LinkedIn URL | "https://linkedin.com/in/mariatest" | URL | Must be linkedin.com domain |
| Notes | "Key contact for Midwest region." | 5000 | HTML sanitized |

**Department Type Options (for Distributors):**
- senior_management
- sales_management
- district_management
- area_sales
- sales_specialist
- sales_support
- procurement

#### STEP 5: Organization & Territory Section

| Field | Enter This Value | Max Length | Note |
|-------|------------------|------------|------|
| Reports To | Leave empty or select another contact | N/A | manager_id FK, self-reference prevented |
| District Code | "D42" | 10 | Example format: D1, D73 |
| Territory | "Western Suburbs" | 100 | Free text |

#### STEP 6: Save the Contact

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Button location clear? In FormToolbar? |
| 2. Watch for validation errors | Which fields (if any) failed? |
| 3. If successful, note redirect | Should redirect to list (redirect="list") |
| 4. Verify contact appears in list | Is all data visible in list columns? |

**After Save Verification:**
- [ ] Contact appears in contacts list?
- [ ] `first_seen` and `last_seen` timestamps set to current time?
- [ ] `tags` array initialized to empty `[]`?
- [ ] Can you click row to open SlideOver and see all data?
- [ ] Cache keys invalidated: contacts, activities, opportunities?

---

### Workflow B: Contact Edit Form

**Pre-Requisites:**
1. Navigate to **Contacts** in sidebar
2. Have at least one existing contact in the system

#### STEP 1: Access Edit Form

| Method | How to Access | What to Note |
|--------|---------------|--------------|
| Direct URL | Navigate to `/contacts/{id}/edit` | Does form load with existing data? |
| From List | Click row → Edit button in SlideOver | Does mode toggle work? |
| From Show | Click Edit button on show page | Redirect correct? |

#### STEP 2: Modify Contact Fields

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

#### STEP 3: Save Changes

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Button in FormToolbar visible? |
| 2. Verify success notification | Toast message appears? |
| 3. Note redirect | Should go to show page (redirect="show") |
| 4. Verify cache invalidation | Were contacts, activities, opportunities caches invalidated? |

---

### Workflow C: Contact SlideOver (View + Edit Modes)

**Pre-Requisites:**
1. Navigate to **Contacts** list
2. Have at least one contact with activities and notes

#### STEP 1: View Mode - Details Tab

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

#### STEP 2: View Mode - Activities Tab

| Action | What to Note |
|--------|--------------|
| 1. Click **Activities** tab | Tab switch smooth? Count badge accurate? |
| 2. Observe activity list | Fetches activities for this contact? |
| 3. Check empty state | Shows "No activities" message if none exist? |
| 4. Click an activity | Opens activity detail? |

#### STEP 3: View Mode - Notes Tab

| Action | What to Note |
|--------|--------------|
| 1. Click **Notes** tab | Count badge (nb_notes) accurate? |
| 2. Observe notes list | Can view existing notes? |
| 3. Test note creation | Can create new note from this tab? |
| 4. Check note formatting | HTML rendered correctly? |

#### STEP 4: Switch to Edit Mode

| Action | What to Note |
|--------|--------------|
| 1. Click **Edit** button | Button visible and accessible? |
| 2. Observe form transition | ContactInputs component renders in Details tab? |
| 3. Check form has existing values | All fields pre-filled correctly from record? |
| 4. Make a change | Form becomes dirty? |
| 5. Click **Cancel** | Returns to view mode? Changes discarded? |
| 6. Edit again and **Save** | Success notification? Returns to view mode with updated data? |

#### STEP 5: Deep Link and Keyboard Testing

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

### Workflow D: Inline Contact Creation (From Opportunity Form)

**Pre-Requisites:**
1. Navigate to **Opportunities** > **Create**
2. Select a Customer Organization first (required for contact filtering)

#### STEP 1: Access Inline Contact Dialog

| Action | What to Note |
|--------|--------------|
| 1. In Contacts & Products section, look for **"+ New Contact"** | Button visible only after selecting customer org? |
| 2. Note button state before org selection | Is it disabled or hidden? |
| 3. Select a Customer Organization | Does button become enabled? |
| 4. Click **"+ New Contact"** button | Dialog opens smoothly? |
| 5. Check dialog title | Shows "Create new Contact"? |

#### STEP 2: Verify Context Pre-fill

| Field | Expected Pre-fill | What to Note |
|-------|-------------------|--------------|
| Organization | Customer org from parent form | Was organization_id pre-filled? Locked/readonly? |
| Account Manager | Current user's sales_id | Was sales_id pre-filled? |
| first_seen | Current timestamp | Set automatically in transform? |
| last_seen | Current timestamp | Set automatically in transform? |

#### STEP 3: Complete Inline Form

| Action | What to Note |
|--------|--------------|
| 1. Fill First Name: "Bob" | Required field validation? |
| 2. Fill Last Name: "Inlinetest" | Required field validation? |
| 3. Add Email: "bob.test@customer.com" | At least one required? |
| 4. Leave other fields as default | Optional fields skip cleanly? |
| 5. Click **Save** | Dialog closes? Loading state shown? |

#### STEP 4: Return to Parent Form

| Action | What to Note |
|--------|--------------|
| 1. Check Contacts field in Opportunity form | New contact auto-selected in dropdown? |
| 2. Verify contact appears in autocomplete | Can search and find "Bob Inlinetest"? |
| 3. Continue opportunity creation | Form state preserved? No data loss? |
| 4. Open Contacts list in new tab | New contact visible in list? |

---

### Workflow E: Contact Validation Edge Cases

#### TEXT FIELD LIMITS

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

#### REQUIRED FIELD VALIDATION

| Scenario | Expected Error | What to Note |
|----------|----------------|--------------|
| Submit with empty First Name | "First name is required" | Error location? Helpful message? |
| Submit with empty Last Name | "Last name is required" | |
| Submit with no Organization | "Organization is required - contacts cannot exist without an organization" | |
| Submit with no Account Manager | "Account manager is required" | |
| Submit with no Email (create only) | "At least one email address is required" | |
| Submit with empty email value in array | "Email address is required" | Array item validation |
| Edit mode with no email | Should allow (email only required on create) | Different behavior edit vs create? |

#### INVALID FORMAT VALIDATION

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

#### EMAIL/PHONE TYPE VALIDATION

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

#### SMART EMAIL PARSING EDGE CASES

| Email Pasted | Expected First Name | Expected Last Name |
|--------------|---------------------|-------------------|
| "john.doe@company.com" | "John" | "Doe" |
| "jsmith@company.com" | "Jsmith" | "" (empty - only one part) |
| "john.middle.doe@company.com" | "John" | "Middle" (takes first two parts) |
| "JOHN.DOE@COMPANY.COM" | "John" | "Doe" (case normalized) |
| Already has first/last filled | Should NOT overwrite | Should NOT overwrite |
| "support@company.com" | "Support" | "" (generic, one part) |
| "first_last@company.com" | "First" | "Last" (underscore as separator) |

#### SELF-REFERENTIAL MANAGER PREVENTION

| Scenario | Expected Behavior |
|----------|-------------------|
| Create mode: manager dropdown | Should show all contacts (no self yet) |
| Edit mode: manager dropdown | Should exclude current contact from options |
| Bypass UI: set manager_id = id via API | Schema rejects: "Contact cannot be their own manager" |
| Edit: change contact, then set as own manager | Dropdown should dynamically update filter |

#### JSONB ARRAY EDGE CASES

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

## Opportunities

Step-by-step guide to test opportunity creation flow, including creating new contacts and organizations inline.

### Workflow A: Full Opportunity Create Form

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Opportunities** in sidebar
3. Click **"Create"** button (top right)

#### STEP 1: Create New Customer Organization (Inline)

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
| Organization Type | Select "Customer" | NO (default: prospect) | Was "customer" auto-selected? |
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

#### STEP 2: Create New Principal Organization (Inline)

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

#### STEP 3: Create New Contact (Inline)

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
| Organization | Should show "Test Acme Foods 2024" | YES | Was it pre-filled? |
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

#### STEP 4: Complete Core Opportunity Fields

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Opportunity Name** | "Test Acme Q1 2025 Deal" | YES | Any auto-generate option? |
| **Stage** | Leave as "New Lead" | YES | What was default? |
| **Priority** | Change to "High" | YES | What was default (should be "medium")? |
| **Estimated Close Date** | Leave as default | YES | What date was pre-filled? (should be +30 days) |
| **Account Manager** | Your name | NO | Was it pre-selected to you? |
| **Distributor** | Leave empty for now | NO | Clear that it's optional? |

#### STEP 5: Add Products

| Action | What to Note |
|--------|--------------|
| 1. In **"Contacts & Products"** section, find Products | Is it clear at least 1 product required? |
| 2. Click product dropdown | Are products filtered by principal? |
| 3. If no products exist for principal | Does it show "No products available"? |
| 4. (If products exist) Select one | Is selection smooth? |
| 5. Add optional product notes | Is the notes field obvious? |

**POTENTIAL BLOCKER:** If no products exist for your new principal, you may not be able to save.

#### STEP 6: Optional Classification Fields

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Lead Source | Select "Trade Show" | Dropdown options clear? |
| Campaign | "Q1 2025 Test Campaign" | Free text? Suggestions? |
| Tags | Add "test", "demo" | Is tag input intuitive? |

#### STEP 7: Optional Additional Details

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Description | "Testing opportunity creation flow" | Multiline? Character count? |
| Next Action | "Schedule discovery call" | |
| Next Action Date | Tomorrow's date | Date picker usability? |
| Decision Criteria | "Budget approval by March" | |
| Notes | "Created for E2E testing" | Separate from activity log? |

#### STEP 8: Save the Opportunity

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Button location clear? |
| 2. Watch for validation errors | Which fields (if any) failed? |
| 3. Watch for duplicate warning | Did similar opportunity warning trigger? |
| 4. If successful, note redirect | Where did it go? List? Detail view? |

**After Save:**
- [ ] Does opportunity appear in list?
- [ ] Is all entered data visible in slide-over/detail view?
- [ ] Are the linked contact and organizations showing correctly?

---

### Workflow B: Quick Add Form (Booth Visitor/Trade Show)

**Pre-Requisites:**
1. Navigate to **Opportunities**
2. Look for **"Quick Add"** or **"Booth Visitor"** button
3. Click to open the quick add dialog

#### STEP 1: Pre-fill Settings (Persist Across Entries)

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Campaign | "Trade Show Demo 2025" | Does it save to localStorage? |
| Principal | Select any existing principal | Does it filter product options? |
| Products | Select 1-2 products | Multi-select combobox usability? |

#### STEP 2: Contact Information (Per Entry)

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| First Name | "Jane" | YES | Auto-focused on form reset? |
| Last Name | "Quicktest" | YES | |
| Phone | "(555) 987-6543" | NO* | Is it clear phone OR email required? |
| Email | "jane.quick@testco.com" | NO* | Validation on blur? |

*At least one of phone or email is required.

#### STEP 3: Organization Information (Per Entry)

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Organization Name | "Quick Test Company LLC" | Creates new org atomically? |
| City | Start typing "San Francisco" | Autocomplete work? |
| State | Should auto-fill "CA" | Did it populate from city? |

#### STEP 4: Optional Quick Note

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Quick Note | "Met at booth 42, interested in product demo" | Character limit? Multiline? |

#### STEP 5: Save Options

| Action | Expected Result | What to Note |
|--------|-----------------|--------------|
| Click **"Save & Add Another"** | Form resets, campaign/principal stay | Did focus return to First Name? |
| (or) Click **"Save & Close"** | Dialog closes, opportunity saved | Confirmation message? |

**After Save:**
- [ ] Did it create Contact + Organization + Opportunity atomically?
- [ ] Can you find all three records in their respective lists?
- [ ] Are they linked correctly?

---

### Workflow C: Close an Opportunity (Win/Loss Modal)

#### Test Closing as Won

1. Open the opportunity you created in Workflow A
2. Change **Stage** to **"Closed Won"**
3. A modal should appear for **Win Reason**

| Modal Field | Enter This Value | What to Note |
|-------------|------------------|--------------|
| Win Reason | Select "Relationship" | Options clear? All 5 visible? |
| (If "Other") | "Custom win reason text" | Does notes field appear? |

4. Save and verify the opportunity shows as won

#### Test Closing as Lost

1. Create or find another opportunity
2. Change **Stage** to **"Closed Lost"**
3. A modal should appear for **Loss Reason**

| Modal Field | Enter This Value | What to Note |
|-------------|------------------|--------------|
| Loss Reason | Select "Price too high" | All 7 options visible? |
| (If "Other") | "Customer went with competitor" | Notes field appears? |

4. Save and verify

---

### Workflow D: Opportunity Validation Edge Cases

#### TEXT FIELD LIMITS

| Field | Max Length | Test This | Expected Result |
|-------|------------|-----------|-----------------|
| Opportunity Name | 255 chars | Paste 300+ characters | Should truncate or show error |
| Contact First Name | 100 chars | Type 110+ characters | Should prevent or show error |
| Contact Last Name | 100 chars | Type 110+ characters | Should prevent or show error |
| Organization Name | 255 chars | Paste 300+ characters | Should truncate or show error |
| Description | 2000 chars | Paste 2500+ characters | Should show remaining chars or error |
| Notes | 5000 chars | Paste very long text | Should show remaining chars or error |
| Next Action | 500 chars | Type 550+ characters | Should prevent or show error |
| Campaign | 100 chars | Type 110+ characters | Should prevent or show error |
| Tags (each) | 50 chars | Create tag with 60 chars | Should truncate or reject |
| Tags (count) | Max 20 tags | Try adding 25 tags | Should prevent adding more than 20 |

#### REQUIRED FIELD VALIDATION

| Scenario | Expected Error | What to Note |
|----------|----------------|--------------|
| Submit with empty Opportunity Name | "Name is required" | Error location? Helpful message? |
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

#### BOUNDARY DATE VALUES

| Field | Test Value | Expected |
|-------|------------|----------|
| Estimated Close Date | Today | Should accept |
| Estimated Close Date | Yesterday | Should it warn about past dates? |
| Estimated Close Date | 10 years in future | Should accept or warn? |
| Next Action Date | Past date | Should it warn? Or accept? |
| Next Action Date | Clear/empty | Should clear properly |

#### REFERENCE FIELD EDGE CASES

| Scenario | Expected Behavior |
|----------|-------------------|
| Select Contact from different Org than Customer | Should show mismatch warning |
| Select Distributor without Principal Authorization | Should show authorization warning |
| Create Contact, then change Customer Org | Should Contact selection clear? Or keep? |
| Select same Contact multiple times | Should prevent duplicates |
| Delete Organization while Opportunity form open | Handle gracefully? |

#### QUICK ADD ATOMICITY TESTS

| Scenario | Expected |
|----------|----------|
| Network fails mid-save | All 3 records (Contact+Org+Opp) should NOT be created (rollback) |
| Close browser during save | No partial records |
| Duplicate org name detected | Warning but allow proceed? |
| Email already exists for different contact | Create new contact anyway? Or suggest existing? |

---

## Tasks

Step-by-step guide to test all task form touchpoints: Create, Quick Add, Edit, SlideOver, List, Dashboard Kanban, and Completion Flow.

**Scope:** All 7 task types (Call, Email, Meeting, Follow-up, Demo, Proposal, Other) with 4 priority levels.

### Workflow A: Full Task Create Form

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Tasks** in sidebar
3. Click **"Create"** button (top right)

#### STEP 1: General Tab (Default)

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Title** | "Call John about Q1 proposal" | YES | Was it auto-focused? Max 500 chars. |
| **Description** | "Discuss pricing and timeline" | NO | Max 2000 chars. Multiline textarea? |
| **Due Date** | Select tomorrow | YES | Date picker UX? Default to today? |
| **Reminder Date** | Select day before due date | NO | Can be before or after due date? |

**Date Picker Behavior:**
- Does clicking input open calendar?
- Can you type date directly?
- Is today highlighted/selectable?
- Clear button available?

#### STEP 2: Details Tab

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Priority** | Select "high" | NO (default: medium) | Badge styling for each level? |
| **Type** | Select "Call" | YES | All 7 types visible? |
| **Assigned To** | Your name | YES | Pre-selected to current user? |
| **Contact** | Search and select any contact | NO | Autocomplete responsive? |
| **Opportunity** | Search and select any opportunity | NO | Shows opportunity name + stage? |
| **Organization** | Leave empty (inherits from contact) | NO | Auto-fills from contact? |

**Task Type Options:**

| Type | Icon | When to Use |
|------|------|-------------|
| Call | Phone icon | Phone conversations |
| Email | Mail icon | Email correspondence |
| Meeting | Calendar icon | In-person or virtual meetings |
| Follow-up | RotateCcw icon | Continuing previous conversation |
| Demo | Presentation icon | Product demonstrations |
| Proposal | FileText icon | Sending proposals/quotes |
| Other | MoreHorizontal icon | Miscellaneous tasks |

**Priority Badge Styling:**

| Priority | Color | Visual |
|----------|-------|--------|
| low | Muted/gray | Low contrast |
| medium | Default | Standard styling |
| high | Warning/amber | Attention-getting |
| critical | Destructive/red | Urgent styling |

#### STEP 3: Save the Task

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save & Close"** button | Button location clear? Primary styling? |
| 2. Watch for validation errors | Which fields (if any) failed? |
| 3. If successful, note redirect | Goes to task list? |

**Alternative Save Options:**

| Button | Behavior |
|--------|----------|
| **Cancel** | Prompts if unsaved changes, returns to list |
| **Save & Close** | Saves and navigates to task list |
| **Save & Add Another** | Saves and clears form for next task |

**After Save:**
- [ ] Does task appear in list?
- [ ] Is all entered data visible in SlideOver?
- [ ] Is assigned sales rep shown correctly?
- [ ] Is priority badge displayed?

---

### Workflow B: Quick Add Task Dialog

**Pre-Requisites:**
1. Navigate to a **Contact** detail view (SlideOver or full page)
2. Find the **"Add Task"** chip button in the sidebar

#### STEP 1: Open Quick Add Dialog (From Contact)

| Action | What to Note |
|--------|--------------|
| 1. Click the "Add Task" chip | Does dialog open smoothly? |
| 2. Check pre-filled fields | Is contact_id pre-filled? |
| 3. Check sales_id | Is current user pre-selected? |

**Pre-filled Values Expected:**

| Field | Expected Value |
|-------|----------------|
| Contact | Current contact (pre-selected) |
| Assigned To | Current user (you) |
| Due Date | Today (default) |

#### STEP 2: Complete Minimal Form

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| **Title** | "Follow up on meeting" | Required field |
| **Due Date** | Leave as today or change | Required field |
| **Type** | Select "Follow-up" | Required field |
| **Description** | Optional - leave empty | Not required |

#### STEP 3: Save and Verify

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Dialog closes? |
| 2. Check contact's task list | New task appears? |
| 3. Check contact's `last_seen` | Updated timestamp? |

**Post-Save Verification:**
- [ ] Task created with correct contact link
- [ ] Task appears in main task list
- [ ] Contact's `last_seen` timestamp updated
- [ ] Notification/toast shown?

#### STEP 4: Quick Add from Opportunity Context

Repeat the above from an **Opportunity** view:
1. Navigate to any Opportunity
2. Find task creation entry point
3. Verify opportunity context is captured

---

### Workflow C: Task SlideOver Panel

**Pre-Requisites:**
1. Navigate to **Tasks** list
2. Click on any task row
3. SlideOver should open (40vw right panel, URL: `?view={id}`)

#### STEP 1: Details Tab (Default - View Mode)

| Check | What to Note |
|-------|--------------|
| Tab is active by default? | "Details" should be selected |
| View mode vs Edit mode? | Is there a pencil/edit toggle icon? |
| All fields displayed? | Title, description, dates, priority, type |

**View Mode Field Display:**

| Section | Fields Shown |
|---------|--------------|
| **Header** | Title, completion checkbox (always active) |
| **Card** | Description (if any) |
| **Schedule** | Due Date, Reminder Date |
| **Classification** | Priority badge, Type badge |
| **Assignment** | Assigned To (sales rep name) |
| **Timeline** | Created at, Updated at |

#### STEP 2: Inline Completion Checkbox

**CRITICAL TEST:** Completion checkbox works even in view mode.

| Action | Expected Behavior |
|--------|-------------------|
| 1. Find checkbox in header | Should be 44x44px touch target |
| 2. Click to mark complete | Checkbox fills, completed_at set |
| 3. Check strikethrough styling | Title gets strikethrough? |
| 4. QuickLogActivity dialog | Should open automatically |
| 5. Skip or log activity | Dialog closes appropriately |
| 6. Uncheck to mark incomplete | Checkbox clears, completed_at nulled |

#### STEP 3: Edit Mode Toggle

| Action | What to Note |
|--------|--------------|
| 1. Click edit/pencil icon | Mode switches to edit |
| 2. Form inputs appear | TextInputs, DateInputs, SelectInputs |
| 3. Modify any field | Real-time typing works? |
| 4. Save changes | Persists correctly? |
| 5. Cancel edit | Reverts changes? |

**Edit Mode Fields:**

| Field | Input Type |
|-------|------------|
| Title | TextInput |
| Description | TextInput (multiline) |
| Due Date | DateInput |
| Reminder Date | DateInput |
| Priority | SelectInput (4 options) |
| Type | SelectInput (7 options) |
| Completed | BooleanInput |
| Assigned To | ReferenceInput (sales) |
| Contact | ReferenceInput |
| Opportunity | ReferenceInput |

#### STEP 4: Related Items Tab

| Check | What to Note |
|-------|--------------|
| Tab label | "Related Items" with link icon? |
| Organization link | If linked, shows org name with Building2 icon |
| Contact link | If linked, shows contact name with UserCircle icon |
| Opportunity link | If linked, shows opp name with Target icon |
| Sales Rep | Shows assignee with User icon |
| Click navigation | Links open respective detail views? |

**Empty State:**

| Scenario | Expected |
|----------|----------|
| No organization linked | Shows placeholder or empty |
| No contact linked | Shows placeholder or empty |
| No opportunity linked | Shows placeholder or empty |

#### STEP 5: Close Behaviors

| Action | Expected |
|--------|----------|
| Press ESC key | SlideOver closes |
| Click outside panel | SlideOver closes |
| Click X button | SlideOver closes |
| Check URL | `?view=` param removed |

---

### Workflow D: Task Edit & Postpone

**Pre-Requisites:**
1. Navigate to **Tasks** list or Dashboard
2. Find a task with the dropdown menu (three dots or more icon)

#### STEP 1: Edit from Dropdown Menu

| Action | What to Note |
|--------|--------------|
| 1. Click dropdown menu on task | Menu opens? |
| 2. Click "Edit" option | Edit dialog opens? |
| 3. Modify title | Change works? |
| 4. Save changes | Dialog closes, task updated? |

#### STEP 2: Postpone to Tomorrow

**Condition:** Only appears if task due date is today or earlier (overdue).

| Action | What to Note |
|--------|--------------|
| 1. Find overdue task | Due date <= today |
| 2. Open dropdown menu | "Postpone to tomorrow" visible? |
| 3. Click postpone option | Due date updates to tomorrow? |
| 4. Check list refresh | Task moves to correct position? |

#### STEP 3: Postpone to Next Week

**Condition:** Only appears if task due date is before next Monday.

| Action | What to Note |
|--------|--------------|
| 1. Find task due before next Monday | |
| 2. Open dropdown menu | "Postpone to next week" visible? |
| 3. Click postpone option | Due date updates to next Monday? |

**Postpone Logic:**

| Current Due Date | Tomorrow Option | Next Week Option |
|------------------|-----------------|------------------|
| Yesterday (overdue) | Shows | Shows |
| Today | Shows | Shows |
| Tomorrow | Hidden | Shows |
| Next Monday | Hidden | Hidden |
| Next Tuesday+ | Hidden | Hidden |

#### STEP 4: Delete with Undo

| Action | What to Note |
|--------|--------------|
| 1. Click "Delete" in dropdown | Confirmation? Or immediate? |
| 2. Task removed from list | Soft delete (deleted_at set) |
| 3. Undo notification appears | Duration (~5 seconds)? |
| 4. Click "Undo" | Task restored? |
| 5. Let undo expire | Task remains deleted |

---

### Workflow E: Dashboard Kanban

**Pre-Requisites:**
1. Navigate to **Dashboard**
2. Find the Tasks Kanban Panel
3. Ensure you have tasks with various due dates

#### STEP 1: Column Structure

| Column | Due Date Range | Accent Color |
|--------|----------------|--------------|
| **Overdue** | Before today | Destructive (red) |
| **Today** | Today | Primary |
| **This Week** | Tomorrow through +7 days | Muted |

**Column Verification:**

| Check | What to Note |
|-------|--------------|
| Column headers visible? | Title + task count badge |
| Empty state messages? | "No overdue tasks" etc. |
| Task cards in correct columns? | Based on due_date |

#### STEP 2: Task Card Display

| Element | What to Note |
|---------|--------------|
| Drag handle | GripVertical icon, cursor-grab |
| Completion checkbox | 44px, CheckCircle2 icon |
| Task title | Truncated if long? |
| Type icon | Matches task type |
| Related entity | Shows "-> Contact Name" format |
| Priority badge | Bottom-left, colored by priority |
| Due date label | Bottom-right |

#### STEP 3: Drag-Drop Due Date Update

| Action | Expected Behavior |
|--------|-------------------|
| 1. Grab task from "Overdue" column | Cursor changes to grabbing |
| 2. Drag to "Today" column | Visual drop indicator |
| 3. Release in "Today" column | Task stays in Today |
| 4. Check task's due_date | Updated to today |
| 5. Drag from "Today" to "This Week" | Due date updates to tomorrow |

**Drag-Drop Column Mapping:**

| Drop Target | New Due Date |
|-------------|--------------|
| Overdue | Yesterday (unusual case) |
| Today | Today |
| This Week | Tomorrow |

#### STEP 4: Inline Card Actions

| Action | Expected |
|--------|----------|
| Click checkbox | Marks complete, shows follow-up toast |
| Click snooze button (AlarmClock) | Opens snooze options? |
| Click more menu | View, Edit, Delete options |
| Click "View" | Opens task SlideOver |
| Click "Edit" | Opens edit dialog |
| Click "Delete" | Deletes with undo |

#### STEP 5: Mobile Layout (< 1024px)

| Check | What to Note |
|-------|--------------|
| Columns stack vertically | Not side-by-side |
| Touch targets still 44px+ | Usable on tablet |
| Drag-drop still works | May be different gesture |

---

### Workflow F: Task Completion Flow

**Pre-Requisites:**
1. Have an incomplete task ready
2. Know the task's type (for activity inference)

#### STEP 1: Toggle Completion Checkbox

| Location | Action | What to Note |
|----------|--------|--------------|
| Task List | Click checkbox in "Done" column | Row updates? |
| SlideOver | Click checkbox in header | View updates? |
| Dashboard Kanban | Click checkbox on card | Card updates? |

#### STEP 2: Verify completed_at Timestamp

| Check | Expected |
|-------|----------|
| completed field | Set to `true` |
| completed_at field | ISO timestamp of completion time |
| Visual indicator | Strikethrough on title? |

**Timestamp Format:** ISO 8601 (e.g., "2024-12-22T15:30:00.000Z")

#### STEP 3: QuickLogActivity Dialog

**Dialog appears automatically after marking task complete.**

| Element | What to Note |
|---------|--------------|
| Dialog title | "Log Activity" or similar? |
| Activity type grid | 13 types in groups? |
| Pre-selected type | Inferred from task type? |
| Notes pre-filled | "Completed task: {title}"? |
| Skip button | Closes without logging? |
| Save button | Creates activity record? |

**Activity Type Inference:**

| Task Type | Inferred Activity |
|-----------|-------------------|
| Call | call |
| Email | email |
| Meeting | meeting |
| Demo | demo |
| Proposal | proposal |
| Follow-up | check_in |
| Other | check_in |

#### STEP 4: Activity Type Groups

**Communication:**
- Call, Email, Check-in, Social

**Meetings:**
- Meeting, Demo, Site Visit, Trade Show

**Documentation:**
- Proposal, Contract Review, Follow-up, Note, Sample

#### STEP 5: Skip vs Log Activity

| Choice | Expected Result |
|--------|-----------------|
| Click "Skip" | Dialog closes, no activity created |
| Select type + "Save" | Activity created, linked to task |
| Close dialog (X) | Same as Skip |

**Activity Created Fields:**

| Field | Value |
|-------|-------|
| activity_type | "interaction" |
| type | Selected activity type |
| subject | "Completed: {task.title}" |
| related_task_id | Task ID |
| organization_id | From linked opportunity |
| follow_up_required | false |

#### STEP 6: Uncomplete Task

| Action | Expected |
|--------|----------|
| Uncheck completed checkbox | completed = false |
| completed_at cleared | Set to null |
| Strikethrough removed | Title normal again |
| QuickLogActivity | Does NOT appear on uncomplete |

---

### Workflow G: Task List & Filters

**Pre-Requisites:**
1. Navigate to **Tasks** in sidebar
2. Have multiple tasks with varying statuses, priorities, types

#### STEP 1: List Columns

| Column | Sortable? | Filter? | Visibility |
|--------|-----------|---------|------------|
| Done | No | No | Always |
| Title | Yes | Text (debounced) | Always |
| Due Date | Yes | No (use sidebar) | Always |
| Priority | Yes | Multi-select | Always |
| Type | Yes | Multi-select | Desktop only |
| Assigned To | Yes | Reference | Desktop only |
| Contact | No | No | Desktop only |
| Opportunity | No | No | Desktop only |

#### STEP 2: Sidebar Filters

| Filter Category | Options | What to Note |
|-----------------|---------|--------------|
| **Due Date** | Today, This Week, Overdue | ToggleFilterButton style |
| **Status** | Incomplete, Completed | ToggleFilterButton style |
| **Assigned To** | Sales rep dropdown | OwnerFilterDropdown |

**Due Date Filter Logic:**

| Option | Date Range |
|--------|------------|
| Today | startOfToday -> endOfToday |
| This Week | startOfToday -> +7 days |
| Overdue | Before today AND completed=false |

#### STEP 3: Column Filters

| Column | Filter Type | Behavior |
|--------|-------------|----------|
| Title | Text input | Debounced 300ms, expands on click |
| Priority | Checkbox popover | Multi-select: low, medium, high, critical |
| Type | Checkbox popover | Multi-select: Call, Email, Meeting, etc. |

**Test Filter Combinations:**

| Scenario | Expected |
|----------|----------|
| Overdue + High Priority | Shows only overdue high-priority tasks |
| Incomplete + Type: Call | Shows incomplete call tasks only |
| Today + Assigned To: You | Your tasks due today |

#### STEP 4: Search Bar

| Action | What to Note |
|--------|--------------|
| Type in search | Searches title and description |
| Search "proposal" | Returns tasks with "proposal" in title/description |
| Clear search | Returns to filtered list |
| Search non-existent | "No tasks found" empty state |

#### STEP 5: CSV Export

| Action | What to Note |
|--------|--------------|
| 1. Click Export button | Triggers download |
| 2. Check filename | tasks.csv or similar |
| 3. Open CSV | Columns match expected? |

**CSV Export Columns:**

| Column | Data |
|--------|------|
| id | Task ID |
| title | Task title |
| description | Task description |
| type | Task type |
| priority | Priority level |
| due_date | ISO date |
| completed | "Yes" or "No" |
| completed_at | Timestamp if completed |
| principal | Organization name (via opportunity) |
| opportunity_id | Linked opportunity |
| contact_id | Linked contact |
| created_at | Creation timestamp |

#### STEP 6: Keyboard Navigation

| Key | Expected Behavior |
|-----|-------------------|
| ArrowDown | Move to next row |
| ArrowUp | Move to previous row |
| Enter | Open selected task in SlideOver |

---

### Workflow H: Task Validation Edge Cases

#### TEXT FIELD LIMITS

| Field | Max Length | Test This | Expected Result |
|-------|------------|-----------|-----------------|
| Title | 500 chars | Paste 600+ characters | Truncate or error before save |
| Description | 2000 chars | Paste 2500+ characters | Truncate or error before save |

#### REQUIRED FIELD VALIDATION

| Scenario | Expected Error | What to Note |
|----------|----------------|--------------|
| Submit with empty Title | "Title is required" | Error near field? |
| Submit with whitespace-only Title | Should trim and error | Whitespace handling? |
| Submit without Due Date | "Due date is required" | Date picker error state? |
| Submit without Type | "Type is required" | Select shows error? |
| Submit without Assigned To | Should error (sales_id required) | Reference field error? |

#### DATE VALIDATION

| Scenario | Expected Behavior |
|----------|-------------------|
| Due date in past | Allowed (creates overdue task) |
| Reminder date without due date | N/A (due date required first) |
| Reminder after due date | Allowed (warning?) |
| Clear due date on edit | Should error on save |

#### COMPLETION EDGE CASES

| Scenario | Expected |
|----------|----------|
| Complete task with no contact | QuickLogActivity still opens |
| Complete task, skip activity, uncomplete | No orphan activity created |
| Complete same task twice rapidly | Idempotent (one completed_at) |
| Complete in offline mode | Queued and synced? Or error? |

---

## Products

Step-by-step guide to test all product form touchpoints: Create, Edit, SlideOver, List, and Distribution Network Setup.

**Scope:** Product management including principal association, category selection, status management, and distributor network setup with vendor item numbers (DOT# codes).

### Workflow A: Full Product Create Form

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Products** in sidebar
3. Click **"Create"** button (top right)

#### STEP 1: Product Details Tab (First Tab)

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| Product Name | "Premium Arabica Coffee Blend - 5lb Bag" | Yes | Max 255 chars enforced? |
| Principal/Supplier | (Select from autocomplete) | Yes | Only organizations with type "principal" shown? |
| Category | "beverages" (from dropdown) | Yes | All 16 predefined options available? |
| Status | Keep default "Active" | Yes (default) | Is "Active" pre-selected? |
| Description | "Premium arabica coffee blend..." | No | Multiline? Preserves line breaks? |

**Principal Autocomplete Testing:**
- [ ] Type partial name -> suggestions filter correctly
- [ ] Only Principal-type organizations appear
- [ ] Selection populates field correctly
- [ ] Can clear selection and choose different principal
- [ ] Required validation triggers if skipped

**Category Dropdown - 16 Predefined Options:**
- beverages, dairy, frozen, fresh_produce, meat_poultry, seafood
- dry_goods, snacks, condiments, baking_supplies, spices_seasonings
- canned_goods, pasta_grains, oils_vinegars, sweeteners, other

#### STEP 2: Distribution Tab (Second Tab)

| Field | Enter This Value | Notes |
|-------|------------------|-------|
| Distributors | Select 2-3 distributors from multi-select | Only Distributor-type organizations shown? |
| Vendor Item Number (per distributor) | "USF-12345" for US Foods | Fields appear dynamically? |

**Multi-Distributor Selection Testing:**

1. **Initial State:**
   - [ ] Distribution tab shows multi-select input
   - [ ] No DOT# input fields visible initially

2. **Select First Distributor:**
   - [ ] Only Distributor-type organizations in dropdown
   - [ ] Selection adds chip/tag to input
   - [ ] DOT# input field appears for that distributor

3. **Select Additional Distributors:**
   - [ ] Each selection adds new chip
   - [ ] Each selection adds corresponding DOT# input

4. **Remove Distributor:**
   - [ ] Click X on chip removes it
   - [ ] Corresponding DOT# field disappears

5. **Enter DOT# Codes:**
   - [ ] Can enter alphanumeric codes (max 50 chars)
   - [ ] Field accepts: USF-12345, SYS-67890, GFS001234

**DOT# Code Types (Vendor Item Numbers):**

| Distributor | Code Format Example |
|-------------|---------------------|
| US Foods (USF) | USF-12345 |
| Sysco | SYS-67890 |
| Gordon Food Service (GFS) | GFS001234 |
| PFG | PFG-ABC123 |
| Greco | GRECO-789 |
| GOFO | GOFO-456 |
| RDP | RDP-321 |
| Wilkens | WLK-654 |

#### STEP 3: Custom Category Creation

| Action | Expected Behavior |
|--------|-------------------|
| Open category dropdown | See all 16 predefined options |
| Type "specialty_sauces" (not in list) | Input shows typed value |
| Look for creation prompt | "Add custom category: specialty_sauces" option appears |
| Select custom option | Category field populates with custom value |
| Submit form | Custom category saved successfully |

**Edge Cases:**
- [ ] Can create category with spaces: "specialty sauces"
- [ ] Max length enforced (100 chars)
- [ ] Empty custom category prevented

#### STEP 4: Form Submission

| Action | Expected Behavior |
|--------|-------------------|
| Click "Save" button | Form progress indicator appears |
| Wait for submission | No double-submission on rapid clicks |
| Observe redirect | Redirects to Products list |
| Find new product | Product appears in list |

---

### Workflow B: Full Page Edit

**Pre-Requisites:**
1. Have at least one product created
2. Navigate to **Products** list

#### STEP 1: Navigate to Edit

| Method | Steps |
|--------|-------|
| From List | Click product row -> SlideOver opens -> Click "Edit" button |
| Direct URL | Navigate to `/products/{id}` |

#### STEP 2: Verify Pre-Population

| Field | Verification |
|-------|-------------|
| Product Name | Shows saved name exactly |
| Principal/Supplier | Shows selected principal |
| Category | Shows saved category (including custom) |
| Status | Shows correct status selection |
| Description | Shows saved description with formatting |
| Distributors | Shows all assigned distributors |
| DOT# Codes | Shows saved vendor item numbers per distributor |

#### STEP 3: Make Changes

| Field Change | Test |
|--------------|------|
| Change Product Name | Append " - Updated" |
| Change Principal | Select different principal |
| Change Category | Switch from predefined to custom or vice versa |
| Change Status | Switch to "Discontinued" |
| Edit Description | Add new paragraph |
| Add Distributor | Select additional distributor |
| Remove Distributor | Remove one existing distributor |
| Change DOT# | Update existing vendor item number |

#### STEP 4: Save and Verify

| Action | Expected |
|--------|----------|
| Click "Save" | Progress indicator shows |
| Observe success | Success notification |
| Check list view | Changes reflected immediately |
| Re-open product | All changes persisted |

#### STEP 5: Delete Flow

| Action | Expected |
|--------|----------|
| Click "Delete" button | Confirmation dialog appears |
| Read confirmation | Shows product name being deleted |
| Click "Cancel" | Dialog closes, no deletion |
| Click "Delete" again | Confirmation dialog |
| Click "Confirm Delete" | Product deleted |
| Observe redirect | Returns to Products list |

---

### Workflow C: SlideOver Quick View/Edit

**Pre-Requisites:**
1. Have products in the list
2. Navigate to **Products** list

#### STEP 1: Open SlideOver

| Action | Expected |
|--------|----------|
| Click product row | SlideOver slides in from right |
| Observe width | 40vw |
| Check URL | `?view={product_id}` appended |
| Default tab | "Details" tab selected |
| Default mode | View mode (not edit) |

**SlideOver Basics:**
- [ ] Smooth slide-in animation
- [ ] Product name in header
- [ ] Close button visible (X)
- [ ] ESC key closes SlideOver
- [ ] Click outside closes SlideOver
- [ ] Focus trapped within SlideOver

#### STEP 2: Details Tab - View Mode

| Element | Expected Display |
|---------|------------------|
| Product Name | Large heading text |
| Description | Paragraph with preserved whitespace |
| Category | Badge with formatted label (Title Case) |
| Status | Semantic badge (green=active, red=discontinued, blue=coming_soon) |
| Principal | Clickable link to organization |
| Distributor Codes | Grid showing distributor name + DOT# |

#### STEP 3: Details Tab - Edit Mode

| Action | Expected |
|--------|----------|
| Click "Edit" toggle button | Form inputs appear |
| Product Name | Text input with current value |
| Principal/Supplier | Autocomplete with current selection |
| Category | Dropdown/autocomplete with current value |
| Status | Select dropdown with current value |
| Description | Textarea with current value |

#### STEP 4: Relationships Tab

| Action | Expected |
|--------|----------|
| Click "Relationships" tab | Tab content switches |
| View content | Read-only relationship display |

**Relationships Content:**

1. **Principal Organization Section:**
   - [ ] Shows principal name
   - [ ] Organization type badge (Principal)
   - [ ] Clickable link to organization page

2. **Related Opportunities Section:**
   - [ ] Header "Related Opportunities"
   - [ ] If opportunities exist: Shows up to 5 with links
   - [ ] If none: "No opportunities linked to this product"

3. **Metadata Section:**
   - [ ] Created date (formatted)
   - [ ] Last updated date (formatted)
   - [ ] Relative time display (e.g., "3 days ago")

---

### Workflow D: List & Filters

**Pre-Requisites:**
1. Have multiple products (5+) with various categories, statuses, and principals

#### STEP 1: Column Display

| Column | Desktop (1440px+) | Tablet (768px-1439px) | Sortable? |
|--------|-------------------|----------------------|-----------|
| Product Name | Visible | Visible | Yes |
| Category | Visible (badge) | Visible | Yes |
| Status | Visible (semantic badge) | Visible | Yes |
| Principal | Visible | Hidden | Yes |

#### STEP 2: Search & Text Filters

**Name Column Filter:**

| Action | Expected |
|--------|----------|
| Click filter icon on Name column | Text input expands/appears |
| Type "coffee" | Debounce (300ms) then filter applies |
| Observe results | Only products containing "coffee" shown |
| Clear filter | All products return |

#### STEP 3: Checkbox Filters

**Category Filter:**

| Action | Expected |
|--------|----------|
| Click filter icon on Category column | Popover with checkboxes appears |
| See options | All distinct categories from database |
| Check "beverages" | Filter applies |
| Check additional category | OR logic (shows both) |

**Status Filter:**

| Action | Expected |
|--------|----------|
| Click filter icon on Status column | Popover with 3 checkboxes |
| Options | Active, Discontinued, Coming Soon |
| Check "Active" | Only active products shown |
| Check "Discontinued" | Active OR Discontinued shown |

#### STEP 4: Principal Sidebar Filter

| Action | Expected |
|--------|----------|
| Locate principal filter section | In sidebar/filter panel |
| See toggle buttons | One per principal |
| Click principal name | Filters to that principal's products |
| Click another principal | Switches filter (single select) |
| Click active principal again | Removes filter |

#### STEP 5: Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Down | Move to next row |
| Arrow Up | Move to previous row |
| Enter or Space | Open selected product (SlideOver) |
| ESC | Close SlideOver (if open) |

#### STEP 6: Empty State

| Condition | Expected |
|-----------|----------|
| No products exist | "No Products Yet" card |
| Card content | Helpful message + icon |
| Action button | "Add First Product" -> Create form |
| With filters (no results) | "No products match filters" message |

---

### Workflow E: Distribution Network Setup

**Pre-Requisites:**
1. Have multiple Distributor-type organizations created
2. Create or edit a product

#### STEP 1: Initial Distribution Tab State

| Element | Expected State |
|---------|----------------|
| Tab label | "Distribution" |
| Multi-select input | Empty, placeholder text visible |
| DOT# input fields | None visible |
| Helper text | Explains purpose of distribution setup |

#### STEP 2: Distributor Selection Flow

**Adding First Distributor:**

| Action | Expected |
|--------|----------|
| Click distributor input | Dropdown opens |
| See options | Only Distributor-type organizations |
| Type to search | Filters by name |
| Select distributor | Chip added to input |
| Observe form | DOT# input field appears |
| Field label | Shows distributor name |

**Adding Multiple Distributors:**

| Action | Expected |
|--------|----------|
| Click input again | Dropdown shows remaining options |
| Select 2nd distributor | 2nd chip added |
| Observe form | 2nd DOT# field appears |
| Repeat for 3rd | 3rd chip and field |

#### STEP 3: DOT# Code Entry

| Distributor | Enter Value | Expected |
|-------------|-------------|----------|
| US Foods | USF-12345 | Accepted, no validation error |
| Sysco | SYS-67890 | Accepted |
| GFS | GFS001234 | Accepted |

**DOT# Validation:**
- [ ] Max 50 characters enforced
- [ ] Alphanumeric + hyphens accepted
- [ ] Spaces trimmed
- [ ] Optional field (can be empty)

#### STEP 4: Distributor Removal

| Action | Expected |
|--------|----------|
| Click X on distributor chip | Chip removed |
| Observe form | Corresponding DOT# field disappears |
| Entered DOT# value | Lost (not preserved) |
| Other distributors | Unaffected |

#### STEP 5: Save Distribution Setup

| Action | Expected |
|--------|----------|
| Enter DOT# for all distributors | Values in all fields |
| Click Save | Form submits |
| Observe success | Product saved with distributor data |
| Re-open product | Distribution tab shows saved assignments |

---

### Workflow F: Product Validation Edge Cases

#### TEXT FIELD LIMITS

| Field | Max Length | Test Input | Expected Result |
|-------|------------|------------|-----------------|
| name | 255 | 300 character string | Error or truncation |
| description | 2000 | 2100 character string | Error message displayed |
| category | 100 | 110 character custom category | Error message |
| vendor_item_number | 50 | 60 character code | Error message |

#### REQUIRED FIELD VALIDATION

| Field | Test | Expected Error |
|-------|------|----------------|
| name | Leave empty | "Product name is required" |
| name | Whitespace only "   " | "Product name is required" |
| principal_id | Skip selection | "Principal/Supplier is required" |
| category | Clear selection | "Category is required" |

#### SPECIAL CHARACTERS & INJECTION

| Input | Field | Expected Result |
|-------|-------|-----------------|
| `<script>alert('xss')</script>` | name | Escaped, stored as text |
| `<b>Bold</b>` | description | Tags stripped or escaped |
| `'; DROP TABLE products; --` | name | Stored safely (no SQL injection) |
| `Cafe & Bakery` | name | Special chars preserved |
| `Japanese` | name | Unicode preserved |

---

### Workflow G: Cross-Entity Relationships

#### PRINCIPAL RELATIONSHIP

**From Product -> Principal:**

| Action | Expected |
|--------|----------|
| Open product SlideOver | Details show Principal name |
| Click Principal link | Navigates to Organization page |

**Principal Change Impact:**

| Action | Expected |
|--------|----------|
| Edit product, change Principal | Old principal loses product |
| Save change | Product appears under new principal |
| Filter by old principal | Product no longer shown |
| Filter by new principal | Product now shown |

#### OPPORTUNITY RELATIONSHIP

**Adding Product to Opportunity:**

| Action | Expected |
|--------|----------|
| Navigate to Opportunity | Edit form |
| Find Products section | Multi-select for products |
| Select this product | Added to opportunity |
| Save Opportunity | Junction record created |

**Viewing Relationship from Product:**

| Action | Expected |
|--------|----------|
| Open product SlideOver | Go to Relationships tab |
| View Related Opportunities | Opportunity appears in list |
| Click opportunity link | Navigates to opportunity |

---

## Dashboard

Step-by-step guide to test all interactive components on the Crispy CRM Dashboard: Activity Logging (Desktop FAB + Mobile Quick Actions), Task Management (Kanban board + Mobile completion), KPI Cards, Pipeline Table, and Tab Navigation.

**Scope:** All dashboard interactions across desktop (>=1024px) and mobile/tablet (<1024px) viewports.

### Workflow A: Activity Logging (Desktop)

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Dashboard** (should be default landing page)
3. Ensure viewport width is **>=1024px** (desktop mode)
4. Verify **LogActivityFAB** is visible at bottom-right (56px circular button)

#### STEP 1: FAB Visibility & Interaction

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Locate FAB | 56px circular button at bottom-right | Position fixed, always visible |
| Check draft indicator | No badge initially (no unsaved draft) | Badge appears only with draft |
| Click FAB | Sheet slides in from right | Animation should be smooth |
| Click outside sheet | Sheet closes | Backdrop dismisses sheet |
| Press Escape key | Sheet closes | Keyboard dismissal works |

#### STEP 2: QuickLogForm - Activity Type Section

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| Activity Type | Call | YES | Grouped: Communication / Meetings / Documentation |
| Outcome | Connected | YES | Options: Connected, Left Voicemail, No Answer, etc. |
| Duration | 15 | NO | Only shows for Call, Meeting, Demo, Site Visit, Trade Show |
| Sample Status | - | NO | Only shows when Activity Type = Sample |

**Conditional Field Tests:**

| Activity Type | Duration Field? | Sample Status Field? |
|---------------|-----------------|----------------------|
| Call | YES | NO |
| Email | NO | NO |
| Meeting | YES | NO |
| Sample | NO | YES |
| Note | NO | NO |
| Check-In | NO | NO |

#### STEP 3: Entity Selection (Cascading Behavior)

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Open Contact combobox | Shows searchable list | Debounced search |
| Search "John" | Filters to matching contacts | Response time |
| Select a contact | Organization auto-fills if contact has one | Cascading behavior |
| Open Organization combobox | Pre-filtered to contact's organization | Anchor filtering |
| Clear Contact selection | Organization remains selected | No cascade on clear |
| Open Opportunity combobox | Shows opportunities related to selected org | Filtered by org |
| Select with no Contact | All organizations available | No filtering |

#### STEP 4: Notes & Follow-up Section

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Notes | "Discussed Q1 product launch timeline" | 500 char limit, multiline |
| Create Follow-up | Toggle ON | Reveals date picker |
| Follow-up Date | Tomorrow | Past dates should be disabled |

**Follow-up Behavior:**

| Toggle State | Expected |
|--------------|----------|
| OFF (default) | Date picker hidden |
| ON | Date picker visible |
| ON -> Select date | Calendar popup |
| Select past date | Should be disabled |

#### STEP 5: Submit Behavior

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Click "Save & Close" | Activity created, sheet closes, draft cleared | Success toast |
| Click "Save & New" | Activity created, form resets, sheet stays open | Ready for next entry |
| Submit with missing required fields | Validation error shown | Error message clarity |
| Submit with network error | Error toast, form preserved | Data not lost |

#### STEP 6: Draft Persistence

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Partially fill form | Draft saves automatically (500ms debounce) | No visible indicator |
| Close sheet without saving | Draft badge appears on FAB | Warning color with pulse |
| Reopen sheet | Draft restored | All fields repopulated |
| Submit successfully | Draft cleared | Badge disappears |
| Wait 24+ hours | Draft expires and clears | Expiry cleanup |

---

### Workflow B: Activity Logging (Mobile)

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Resize viewport to **<1024px** (mobile/tablet mode)
4. Verify **FAB is hidden** and **MobileQuickActionBar is visible** at bottom

#### STEP 1: Quick Action Bar Visibility

| Check | Expected | What to Note |
|-------|----------|--------------|
| Bar location | Fixed at bottom of viewport | Sticky position |
| Button count | 6 action buttons | All visible without scrolling |
| Touch targets | Each button >=44px | WCAG AA compliance |
| Safe area | Respects notch/home indicator | No overlap on iPhone |

#### STEP 2: Quick Action Buttons

| Button | Icon | Pre-fills Activity Type | What to Note |
|--------|------|-------------------------|--------------|
| Check-In | MapPin | `check_in` | Quick location check |
| Sample | Package | `sample` | Opens sample status field |
| Call | Phone | `call` | Opens duration field |
| Meeting | Calendar | `meeting` | Opens duration field |
| Note | FileText | `note` | Notes-only activity |
| Complete | CheckCircle | Opens TaskCompleteSheet | Different flow |

#### STEP 3: Mobile Form Experience

| Check | Expected | What to Note |
|-------|----------|--------------|
| Sheet opens from bottom | Full-height slide-up | Different from desktop |
| Touch targets | All inputs >=44px height | Easy to tap |
| Keyboard handling | Form scrolls when keyboard opens | No hidden inputs |
| Combobox dropdowns | Touch-friendly option selection | Easy to select |
| Submit buttons | Full-width, stacked | Thumb-reachable |

---

### Workflow C: Task Kanban Board

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Click **"My Tasks"** tab
4. Ensure you have tasks in different due date states

#### STEP 1: Column Layout

| Column | Color Accent | Tasks Shown | What to Note |
|--------|--------------|-------------|--------------|
| Overdue | Destructive (red) | `due_date < today` | Past due tasks |
| Today | Primary | `due_date = today` | Today's tasks |
| This Week | Muted | `due_date` within 7 days | Upcoming tasks |

**Responsive Layout:**

| Viewport | Layout | What to Note |
|----------|--------|--------------|
| Desktop (>=1024px) | 3 columns horizontal | Side-by-side |
| Mobile (<1024px) | Stacked vertical | Scrollable |

#### STEP 2: Drag-and-Drop

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Drag task from Overdue to Today | Task moves, `due_date` updates | Optimistic UI |
| Drag task from Today to This Week | Task moves, `due_date` updates | Smooth animation |
| Drop on same column | Task stays, no changes | No API call |
| Drag and cancel | Task returns to original position | Escape or drop outside |
| Keyboard drag | Should work with focus + arrow keys | Accessibility |

#### STEP 3: Task Card Interactions

| Element | Action | Expected |
|---------|--------|----------|
| Task title | Click | Opens task slide-over |
| Priority badge | Display only | Critical (red), High (orange), Medium (blue), Low (gray) |
| Due date | Display only | Shows relative date, red if overdue |
| Complete button | Click | Task removed from board, success feedback |
| Snooze button | Click | Opens SnoozePopover |
| Delete button | Click | Confirmation prompt, then removal |

#### STEP 4: Snooze Popover

| Option | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Tomorrow | Sets `due_date` to tomorrow EOD | Quick option |
| Next Week | Sets `due_date` to next Monday | Quick option |
| Custom Date | Opens calendar picker | Full selection |
| Select past date | Should be disabled | Validation |
| Click outside | Closes popover | Dismissal |

#### STEP 5: Empty States & Edge Cases

| Scenario | Expected Display |
|----------|------------------|
| No tasks at all | "No tasks" message with "New Task" link |
| No overdue tasks | Empty Overdue column (collapsed or minimal) |
| All tasks completed | "All caught up!" message |
| "New Task" button | Navigates to `/tasks/create` |

---

### Workflow D: Task Completion (Mobile)

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Resize viewport to **<1024px** (mobile mode)
4. Ensure you have incomplete tasks

#### STEP 1: Opening TaskCompleteSheet

| Action | Expected |
|--------|----------|
| Click "Complete" button in quick action bar | Sheet slides up from bottom |
| Sheet appearance | Shows list of incomplete tasks |
| Task sorting | Sorted by urgency: Overdue -> Today -> This Week |

#### STEP 2: Task List Display

| Element | Expected | What to Note |
|---------|----------|--------------|
| Task title | Visible, truncated if long | Readability |
| Task type icon | Call, Email, Meeting, etc. | Recognizable |
| Priority badge | Color-coded | Semantic colors |
| Due date | Shown, red styling if overdue | Urgency indicator |
| Complete button | >=44px, tap-friendly | Easy to hit |

#### STEP 3: Task Completion

| Action | Expected | What to Note |
|--------|----------|--------------|
| Tap Complete on a task | Task disappears, success feedback | Optimistic UI |
| Complete all tasks | Shows "All caught up!" empty state | Celebratory |
| Close sheet | Tap outside or swipe down | Easy dismiss |

---

### Workflow E: KPI Cards Navigation

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Observe the **KPISummaryRow** at top of dashboard

#### STEP 1: Card Layout

| Viewport | Layout | What to Note |
|----------|--------|--------------|
| Desktop (>=1024px) | 4 cards horizontal row | Even spacing |
| Mobile (<1024px) | 2x2 grid | Stacked layout |

#### STEP 2: KPI Card Content

| Card | Icon | Metric | Click Destination |
|------|------|--------|-------------------|
| Open Opportunities | Briefcase | Count of open opps | `/opportunities` (filtered) |
| Overdue Tasks | AlertCircle | Count of overdue tasks | `/tasks?filter=overdue` |
| Activities This Week | Activity | Count of activities | `/reports` |
| Stale Deals | AlertTriangle | Count of stale opportunities | `/opportunities?filter=stale` |

#### STEP 3: Visual States

| Condition | Expected Styling | What to Note |
|-----------|------------------|--------------|
| Overdue Tasks > 0 | Red/destructive accent on card | Visual urgency |
| Overdue Tasks = 0 | Default/muted styling | No alarm |
| Stale Deals > 0 | Amber/warning accent | Attention needed |
| Stale Deals = 0 | Default styling | Normal |

#### STEP 4: Card Interactions

| Action | Expected | What to Note |
|--------|----------|--------------|
| Click "Open Opportunities" | Navigate to Opportunities list | Pre-filtered view |
| Click "Overdue Tasks" | Navigate to Tasks list with overdue filter | Correct filter applied |
| Click "Activities This Week" | Navigate to Reports page | Activity summary |
| Click "Stale Deals" | Navigate to Opportunities with stale filter | Correct filter |
| Touch target size | Each card >=44px height | Accessible |

---

### Workflow F: Pipeline Table

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Ensure **Pipeline** tab is active (default)
4. Have multiple principals with varying pipeline data

#### STEP 1: Search Input

| Action | Expected | What to Note |
|--------|----------|--------------|
| Type "Acme" | Table filters to matching principals | Debounced (no flicker) |
| Clear search | All principals shown | Reset behavior |
| Search with no results | Empty state message | Helpful message |
| Rapid typing | No multiple requests firing | Debounce working |

#### STEP 2: Momentum Filter

| Selection | Expected |
|-----------|----------|
| Select "Growing" | Only principals with growing momentum |
| Select "Stable" | Only principals with stable momentum |
| Select multiple | Combined filter (OR logic) |
| Clear all | All momentum levels shown |

#### STEP 3: "My Principals Only" Toggle

| State | Expected |
|-------|----------|
| OFF (default) | All principals visible |
| ON | Only principals assigned to you |
| Toggle ON with no matches | Empty state with message |

#### STEP 4: Column Sorting

| Column | First Click | Second Click | What to Note |
|--------|-------------|--------------|--------------|
| Principal Name | A -> Z | Z -> A | Alphabetical |
| Pipeline Count | Low -> High | High -> Low | Numeric |
| Weekly Activity | Low -> High | High -> Low | Numeric |
| Momentum | Enum order | Reverse enum | Categorical |

#### STEP 5: Row Drill-down

| Action | Expected |
|--------|----------|
| Click any row | PipelineDrillDownSheet opens |
| Sheet content | Shows opportunities by stage |
| Click opportunity | Navigate to opportunity detail |
| Close sheet | Click outside or X button |

---

### Workflow G: Tab Navigation

**Pre-Requisites:**
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Observe the 4-tab interface

#### STEP 1: Tab Switching

| Tab | Content Component | What to Note |
|-----|-------------------|--------------|
| Pipeline (default) | PrincipalPipelineTable | Active on load |
| My Tasks | TasksKanbanPanel | Task badge shows count |
| Performance | MyPerformanceWidget | Personal metrics |
| Team Activity | ActivityFeedPanel | Recent team activities |

#### STEP 2: State Preservation

| Test | Expected |
|------|----------|
| Apply filter on Pipeline tab | Filter value persisted |
| Switch to Tasks tab | Pipeline filter preserved in background |
| Return to Pipeline tab | Filter still applied |
| Scroll position | Preserved per tab |

#### STEP 3: Badge Indicators

| Tab | Badge Shows |
|-----|-------------|
| My Tasks | Count of pending (incomplete) tasks |
| Others | No badge |

#### STEP 4: Lazy Loading

| Observation | Expected |
|-------------|----------|
| First tab load | Shows skeleton while loading |
| Subsequent visits | Instant render (cached) |
| Tab content size | Reasonable load times |

---

### Workflow H: Dashboard Edge Cases & Validation

**Pre-Requisites:**
1. Complete Workflows A-G first
2. Have Chrome DevTools open for network inspection

#### STEP 1: Draft Persistence Edge Cases

| Test | Steps | Expected |
|------|-------|----------|
| Draft save timing | Fill form slowly, check localStorage | Saves after 500ms idle |
| Draft expiry | Set system clock forward 25 hours | Draft should be cleared |
| Multiple tabs | Open dashboard in 2 tabs, fill form in one | Draft isolated per tab |
| Browser close/reopen | Fill form, close browser, reopen | Draft restored (within 24h) |
| Successful submit | Complete activity, check localStorage | Draft key removed |

#### STEP 2: Keyboard Navigation

| Context | Key | Expected |
|---------|-----|----------|
| FAB focused | Enter | Opens sheet |
| Sheet open | Escape | Closes sheet |
| Form fields | Tab | Moves to next field |
| Combobox | Arrow Down | Opens dropdown |
| Combobox open | Enter | Selects option |
| Kanban task | Tab | Moves through tasks |
| Modal open | Tab | Trapped within modal |

#### STEP 3: Error States

| Scenario | How to Trigger | Expected |
|----------|----------------|----------|
| Network failure | Throttle to Offline in DevTools | Error toast, form preserved |
| Required field empty | Submit without activity type | Inline validation error |
| Server 500 error | Mock error response | Error toast with retry option |
| Concurrent edit | Edit same task in 2 tabs | Last write wins, no crash |

#### STEP 4: Responsive Breakpoints

| Width | Expected Layout Changes |
|-------|-------------------------|
| >=1440px | Full desktop, all columns visible |
| 1024-1439px | Desktop, may compress slightly |
| 768-1023px | Tablet, FAB hidden, Quick Action Bar visible |
| <768px | Mobile, stacked layouts, optimized touch |

#### STEP 5: Accessibility Checks

| Check | How to Verify | Expected |
|-------|---------------|----------|
| Touch targets | Measure buttons | All >=44px |
| Focus visibility | Tab through page | Clear focus rings |
| ARIA labels | Inspect elements | Descriptive labels |
| Screen reader | Enable VoiceOver/NVDA | Logical reading order |
| Color contrast | Use browser a11y tools | Meets WCAG AA |
| Keyboard-only | Unplug mouse | All features accessible |

---

## Common Patterns Reference

### Issue Reporting Template

Use this format to report issues found during testing:

```markdown
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

### Testing Results Template

```markdown
### Field: [Field Name]
**Form:** [Create / Edit / SlideOver]
**Test Type:** [Max Length / Required / Format / Special Chars]

| Input | Expected | Actual | Pass/Fail |
|-------|----------|--------|-----------|
| (test value) | (expected behavior) | (what happened) | Pass / Fail |

**Notes:** Additional observations
```

---

### UX Improvement Checklist

After completing workflows, evaluate:

#### Form Design
- [ ] Required fields clearly marked with asterisk (*)?
- [ ] Optional fields clearly distinguishable?
- [ ] Logical grouping of related fields?
- [ ] Section headers descriptive?
- [ ] Collapsible sections start in correct state?

#### Guidance & Help
- [ ] Placeholder text in empty fields?
- [ ] Tooltips or help icons for complex fields?
- [ ] Example text shown (e.g., URL format)?
- [ ] Character limits visible before hitting them?

#### Error Handling
- [ ] Errors appear near the problematic field?
- [ ] Error messages explain HOW to fix (not just what's wrong)?
- [ ] Form doesn't lose data on validation failure?
- [ ] Can dismiss/retry without full re-entry?

#### Performance
- [ ] Autocompletes load < 1 second?
- [ ] Form submits < 2 seconds?
- [ ] No visible jank when expanding sections?

#### Accessibility
- [ ] All fields keyboard accessible?
- [ ] Tab order follows visual order?
- [ ] Focus visible on all interactive elements?
- [ ] Touch targets minimum 44x44px?
- [ ] Screen reader announces errors (role="alert")?
- [ ] aria-invalid on fields with errors?
- [ ] aria-describedby linking inputs to error messages?

---

### Common Validation Patterns

#### Special Characters & Injection Testing

| Test | Input | Expected |
|------|-------|----------|
| HTML in text fields | `<script>alert('xss')</script>` | Sanitize, not execute |
| SQL injection | `'; DROP TABLE users; --` | Save as literal text |
| Unicode | "Cafe Acai Japanese" | Save correctly |
| Emoji | "Test" | Save correctly |
| Very long word | "aaaa...(500+ a's)" | Handle without UI break |

#### Form State Preservation

| Scenario | Expected |
|----------|----------|
| Fill form, navigate away | Unsaved changes warning |
| Fill form, refresh page | Data lost (no draft, unless Dashboard) |
| Validation error, fix, submit | Submit successfully |
| Submit, server error, retry | Form data preserved |

---

### File Reference

For developers investigating issues:

| Feature | Key Files |
|---------|-----------|
| Organizations | `src/atomic-crm/organizations/` |
| Contacts | `src/atomic-crm/contacts/` |
| Opportunities | `src/atomic-crm/opportunities/` |
| Tasks | `src/atomic-crm/tasks/` |
| Products | `src/atomic-crm/products/` |
| Dashboard | `src/atomic-crm/dashboard/v3/` |
| Validation Schemas | `src/atomic-crm/validation/` |
| Data Provider | `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` |

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Consolidated From:** 6 separate workflow files
