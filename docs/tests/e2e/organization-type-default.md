# Manual Test: Default Organization Type Selection

**Feature:** Organizations default to type "prospect" on create form
**Last Updated:** 2026-01-03
**Test Duration:** ~5 minutes

---

## Prerequisites

- [ ] Local dev server running (`just dev`)
- [ ] Logged in as any user role (Admin, Manager, or Rep)
- [ ] At least one existing organization with type other than "prospect" (for edit test)

---

## Test 1: Create Form Shows Default Type

**Goal:** Verify new organization form pre-selects "Prospect" as the type

### Steps

1. Navigate to Organizations list (`/organizations`)
2. Click the "Create" button (top right)
3. **Observe the "Type" dropdown field**

### Expected Result

- [ ] The Type dropdown shows **"Prospect"** pre-selected (not empty/blank)
- [ ] The dropdown label shows "Type" (not "Type *" - it's not required since it has a default)

### Screenshot Location
`Type field in Basic Information section, second field after Organization Name`

---

## Test 2: Default Can Be Changed

**Goal:** Verify user can change the default type before saving

### Steps

1. From Test 1, with the create form open
2. Click the Type dropdown
3. Select a different type (e.g., "Customer")
4. Fill in required field: Organization Name = "Test Org [timestamp]"
5. Click "Create Organization"

### Expected Result

- [ ] Dropdown shows all 4 options: Customer, Prospect, Principal, Distributor
- [ ] Selected type ("Customer") is saved correctly
- [ ] Organization show page displays the selected type, not "Prospect"

---

## Test 3: Edit Form Shows Saved Value (Not Default)

**Goal:** Verify edit form preserves existing type, doesn't override with "prospect"

### Steps

1. Navigate to an existing organization that has type = "Customer" or "Distributor"
   - (If none exists, create one in Test 2 with type "Customer")
2. Click "Edit" button
3. **Observe the Type dropdown field**

### Expected Result

- [ ] Type dropdown shows the **saved value** (e.g., "Customer"), NOT "Prospect"
- [ ] The saved type is preserved, not overwritten by the schema default

---

## Test 4: Add Branch Inherits Default

**Goal:** Verify "Add Branch" action also gets the default type

### Steps

1. Navigate to any organization's show page
2. Find the hierarchy section (may need to scroll or expand)
3. Click "Add Branch" button
4. **Observe the Type dropdown on the new create form**

### Expected Result

- [ ] New branch form shows "Prospect" pre-selected
- [ ] Parent Organization field is pre-filled with the parent org

---

## Test 5: Form Submission Without Changing Default

**Goal:** Verify form can be saved with the default type (no explicit selection needed)

### Steps

1. Navigate to Organizations → Create
2. Fill in ONLY the required field: Organization Name = "Default Type Test [timestamp]"
3. **Do NOT touch the Type dropdown**
4. Click "Create Organization"

### Expected Result

- [ ] Form submits successfully (no validation errors)
- [ ] New organization is created with type = "Prospect"
- [ ] Organization show page confirms type is "Prospect"

---

## Edge Cases

### Test 6: Browser Refresh Preserves Default

1. Open organization create form
2. Refresh the browser (F5 or Cmd+R)
3. Verify Type dropdown still shows "Prospect" pre-selected

### Test 7: Priority Also Has Default

1. Open organization create form
2. Check the Priority dropdown
3. **Expected:** Shows "C" pre-selected (database default)

---

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Type shows blank | Form not using schema defaults | Check `OrganizationCreate.tsx` uses `organizationSchema.partial().parse({})` |
| Edit form shows "Prospect" instead of saved value | Edit form using schema defaults | Check `OrganizationEdit.tsx` uses `record` directly |
| Form validation error on type | Field marked required without default | Check schema has `.default("prospect")` |

---

## Related Files

- Schema: `src/atomic-crm/validation/organizations.ts:139`
- Create form: `src/atomic-crm/organizations/OrganizationCreate.tsx:238-244`
- Edit form: `src/atomic-crm/organizations/OrganizationEdit.tsx:46`
- Type input: `src/atomic-crm/organizations/PrincipalAwareTypeInput.tsx`
