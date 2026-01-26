# E2E Field Validation Test: Team (Sales/Users)

**URL:** http://localhost:5173/#/sales (or Settings -> Team)
**Goal:** Verify all Team/Sales user data fields display, accept input, validate, and persist correctly.

## Pre-Test Setup

1. Ensure dev server is running (`just dev`)
2. Login as Admin user (required for user management)
3. Confirm test data exists (`just seed-e2e` if needed)

---

## Test Sequence

### Phase 1: Team List Validation

- [ ] Navigate to http://localhost:5173/#/sales (or Settings -> Team)
- [ ] Verify columns display: Name, Email, Role, Status (disabled/enabled)
- [ ] Check no "undefined", "null", or empty cells
- [ ] Test text filter (search by name)
- [ ] Test role filter (admin, manager, rep)
- [ ] Verify role badges display with correct colors:
  - [ ] Admin: primary border
  - [ ] Manager: success border
  - [ ] Rep: muted-foreground border
- [ ] Verify disabled users show visual indicator
- [ ] Screenshot any display issues

### Phase 2: Invite/Create User Form

- [ ] Click "Invite User" or "Create" button
- [ ] Test each field:

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| First Name | empty, >100 chars | "John" | **REQUIRED**, max length enforced |
| Last Name | empty, >100 chars | "Smith" | **REQUIRED**, max length enforced |
| Email | empty, "notanemail", >254 chars | "john@company.com" | **REQUIRED**, valid email format |
| Password | <8 chars, >128 chars | "SecurePass123!" | Optional (user sets via invite email), min 8, max 128 |
| Role | - | Select "rep" | Default "rep", dropdown: admin, manager, rep |

- [ ] Submit empty form - verify required field errors
- [ ] Verify error styling: red border, error text visible
- [ ] Verify `aria-invalid="true"` on invalid fields
- [ ] Fill all required fields and submit
- [ ] Verify invite email sent (or user created if password provided)
- [ ] Confirm new user appears in list

### Phase 3: Edit User Form

- [ ] Open existing user from list
- [ ] **Profile Tab:**
  - [ ] Verify first_name pre-populated
  - [ ] Verify last_name pre-populated
  - [ ] Verify email pre-populated (may be read-only)
  - [ ] Verify phone pre-populated (if set)
  - [ ] Verify avatar_url displays image
  - [ ] Change first_name -> Save -> Verify persisted
  - [ ] Change phone -> Save -> Verify persisted
- [ ] **Permissions Tab:**
  - [ ] Verify current role selected
  - [ ] Change role from rep to manager -> Save -> Verify
  - [ ] Test disabled toggle -> Save -> Verify user disabled
  - [ ] Re-enable user -> Save -> Verify
- [ ] **Profile/Settings:**
  - [ ] Verify timezone field (default "America/Chicago") - saved with profile
  - [ ] Test digest_opt_in toggle (default: true) - saved with profile
  - [ ] Change timezone -> Save -> Verify persisted
  - [ ] Note: timezone and digest_opt_in persist with user profile, not separate preferences form

### Phase 4: User SlideOver/Detail View

- [ ] Click user to open SlideOver
- [ ] Verify displays:
  - [ ] Full name
  - [ ] Email
  - [ ] Role badge
  - [ ] Avatar (if set)
  - [ ] Phone (if set)
  - [ ] Enabled/Disabled status
- [ ] Verify Edit button opens edit form

### Phase 5: Accessibility Audit

- [ ] Tab through form - all fields reachable
- [ ] Focus states visible on all inputs
- [ ] Role badges have proper ARIA labels
- [ ] Disabled toggle accessible
- [ ] Error messages have role="alert"
- [ ] Tab navigation between Profile/Permissions tabs works

### Phase 6: Edge Cases & Permissions

- [ ] **Admin-only actions:**
  - [ ] Verify only admins can access user management
  - [ ] Test role changes (admin can change any role)
  - [ ] Test disabling users
- [ ] **Self-edit restrictions:**
  - [ ] Admin cannot disable themselves
  - [ ] Admin cannot demote themselves from admin
- [ ] **Email uniqueness:**
  - [ ] Try creating user with existing email -> Should fail
- [ ] **Invite flow:**
  - [ ] Create user without password -> Verify invite email triggered
  - [ ] User receives email and sets password
- [ ] **Timezone validation:**
  - [ ] Enter invalid timezone format -> Verify error
  - [ ] Valid format: "America/Chicago", "Europe/London"

---

## Expected Sales/User Fields (from Zod Schema)

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| first_name | string | YES | min 1, max 100 |
| last_name | string | YES | min 1, max 100 |
| email | string | YES | valid email, max 254 |
| password | string | NO | min 8, max 128 (for create) |
| role | enum | NO | admin, manager, rep (default "rep") |
| phone | string | NO | max length from constants |
| avatar_url | string | NO | valid URL, max length from constants |
| disabled | boolean | NO | default false |
| digest_opt_in | boolean | NO | default true |
| timezone | string | NO | regex pattern, default "America/Chicago" |
| user_id | UUID | NO | Supabase auth user ID |

---

## Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| admin | Full system access | Manage users, see all data, system settings |
| manager | Team oversight | See all data, manage team assignments |
| rep | Individual contributor | See own data only |

---

## Role Display Choices

```javascript
[
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "rep", name: "Rep" }
]
```

---

## Report Issues As

```
**Field:** role
**Issue:** Rep can access user management page
**Expected:** Only admin users should see Settings -> Team
**Actual:** Rep user can view and potentially edit other users
**Severity:** Critical - security/authorization issue
```

---

## Success Criteria

- [ ] First name, last name, email enforce required validation
- [ ] Role dropdown works with all 3 roles
- [ ] Invite flow works (password optional)
- [ ] Permission changes take effect immediately
- [ ] Disabled users cannot login
- [ ] Self-demotion/self-disable prevented for admins
- [ ] Email uniqueness enforced
- [ ] Timezone validation works
- [ ] No console errors during testing
