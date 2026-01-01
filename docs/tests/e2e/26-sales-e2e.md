# Sales (User Management) - Manual E2E Test Checklist

Manual E2E testing checklist for the Sales/User Management module. This covers team member CRUD operations, role-based permissions, and user deactivation workflows.

## Test Environment Setup

### Prerequisites
- **Browser:** Chrome (recommended), Firefox, or Safari
- **URL:** http://localhost:5173
- **DevTools:** Open Console tab (F12) for error monitoring throughout all tests

### Test Users
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password123 |
| Manager | manager@mfbroker.com | password123 |
| Rep | rep@mfbroker.com | password123 |

### Seed Data Requirements
Run `just db-reset` to ensure test data exists:
- At least 3 users with different roles (admin, manager, rep)
- Users with various statuses (active, disabled)

### Console Error Patterns to Monitor
Throughout all tests, watch for these error patterns:
- **RLS Errors:** "permission denied", "row-level security", "42501", "policy"
- **React Errors:** "Uncaught", "React", stack traces
- **Network Errors:** 403, 401, 500 status codes
- **Supabase Auth Errors:** "Not authenticated", "JWT expired"

### Test Data Naming Convention
Use timestamps for uniqueness: `Test Sales Rep 2025-12-31-143022`

---

## Section A: CRUD Operations

### Test A1: View Sales List (Admin)

**Objective:** Verify Admin can view all team members in the Sales list.

**Prerequisites:**
- [ ] Logged out of any existing session
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to http://localhost:5173
2. Clear browser console
3. Login with `admin@test.com` / `password123`
4. Wait for dashboard to load
5. Navigate to Sales via sidebar or URL: `/#/sales`
6. Wait for the Sales list to load completely

**Expected Results:**
- [ ] Login succeeds without errors
- [ ] Sales list loads without errors
- [ ] Team members are displayed with columns: First Name, Last Name, Email, Role, Status
- [ ] Role badges display correctly (Admin=primary, Manager=success, Rep=muted)
- [ ] Status badges display correctly (Active=success, Disabled=warning)
- [ ] Default filter shows Active users only
- [ ] No RLS errors in console
- [ ] No "permission denied" errors

**Pass/Fail:** [ ]

---

### Test A2: Create Sales User (Admin)

**Objective:** Verify Admin can create a new team member via the create form.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales`
2. Clear browser console
3. Click the floating "+" button or navigate to `/#/sales/create`
4. Wait for create form to load
5. Verify 2 tabs are visible: "General" and "Permissions"
6. Fill in General tab:
   - First Name: `Test Sales Rep [Timestamp]`
   - Last Name: `E2E Test`
   - Email: `test.salesrep.[timestamp]@test.com`
7. Click "Permissions" tab
8. Verify role dropdown shows: Rep, Manager, Admin
9. Leave role as default "Rep"
10. Click "Save" button
11. Wait for form submission to complete
12. Verify redirect to sales list

**Expected Results:**
- [ ] Create form loads with 2 tabs (General, Permissions)
- [ ] General tab shows First Name, Last Name, Email fields
- [ ] All fields are editable
- [ ] Permissions tab shows Role dropdown
- [ ] Form submits successfully
- [ ] Notification appears: "User created. They will soon receive an email to set their password."
- [ ] Redirects to `/sales` list
- [ ] New user appears in the list
- [ ] No RLS errors in console
- [ ] No validation errors

**Pass/Fail:** [ ]

---

### Test A3: Create Sales User - Validation Errors

**Objective:** Verify form validation prevents submission with missing required fields.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales/create`
2. Clear browser console
3. Leave all fields empty
4. Observe the Save button state

**Expected Results:**
- [ ] Save button is disabled when form is empty
- [ ] Form displays required field indicators (asterisks on labels)
- [ ] Form stays on create page (no submission)

**Additional Validation:**
1. Click into First Name field
2. Click out of the field (blur)
3. Enter invalid email format (e.g., "invalid-email")
4. Click out of the email field

**Expected Results:**
- [ ] First Name shows "Required field" or similar validation message
- [ ] Email shows "Must be a valid email address" error
- [ ] Save button remains disabled
- [ ] No console errors during validation

**Pass/Fail:** [ ]

---

### Test A4: View Sales User via Slide-Over

**Objective:** Verify clicking a user opens the slide-over panel with correct data.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] At least one user exists in the list

**Steps:**
1. Navigate to `/#/sales`
2. Clear browser console
3. Click on any user row in the list
4. Wait for slide-over panel to open from the right

**Expected Results:**
- [ ] Slide-over panel opens (40vw width)
- [ ] Two tabs visible: "Profile" (user icon), "Permissions" (shield icon)
- [ ] Profile tab shows:
  - [ ] Avatar with user initials
  - [ ] First Name (read-only)
  - [ ] Last Name (read-only)
  - [ ] Email (read-only)
  - [ ] Phone (read-only, may show "Not provided")
- [ ] URL updates to include `?view=[id]`
- [ ] No RLS errors in console
- [ ] No React errors

**Pass/Fail:** [ ]

---

### Test A5: Edit Sales User via Slide-Over

**Objective:** Verify Admin can edit a user via the slide-over panel.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] Slide-over is open for a user (not yourself)

**Steps:**
1. From the slide-over panel, locate the "Edit" button in the header
2. Click the "Edit" button
3. Wait for edit mode to activate
4. Verify Profile tab fields become editable
5. Modify the Last Name: append " - Edited"
6. Click the "Save Changes" button in the footer
7. Wait for save operation to complete

**Expected Results:**
- [ ] Edit button switches to edit mode
- [ ] Profile tab fields become editable inputs
- [ ] First Name, Last Name, Email, Phone, Avatar URL are editable
- [ ] Save operation succeeds
- [ ] Notification appears: "Profile updated successfully"
- [ ] Slide-over switches back to view mode
- [ ] Changes are reflected in the display
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test A6: Edit User Full-Page Form

**Objective:** Verify Admin can edit a user via the full-page edit form.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales`
2. Clear browser console
3. Locate the user created in Test A2
4. Navigate to edit form via `/#/sales/[id]/edit` or edit action
5. Wait for edit form to load

**Expected Results:**
- [ ] Edit form loads with 2 tabs (General, Permissions)
- [ ] User's current data is pre-populated
- [ ] Title shows "Edit [First Name] [Last Name]"
- [ ] Cancel button navigates back to list
- [ ] Save button submits changes
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

## Section B: Role Assignment Tests

### Test B1: Create User with Admin Role

**Objective:** Verify Admin can create a new user with Admin role.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales/create`
2. Fill in General tab:
   - First Name: `Test Admin [Timestamp]`
   - Last Name: `E2E Test`
   - Email: `test.admin.[timestamp]@test.com`
3. Click "Permissions" tab
4. Select "Admin" from Role dropdown
5. Click "Save" button

**Expected Results:**
- [ ] Form submits successfully
- [ ] User is created with Admin role
- [ ] User appears in list with Admin badge (primary color)
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test B2: Create User with Manager Role

**Objective:** Verify Admin can create a new user with Manager role.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales/create`
2. Fill in General tab:
   - First Name: `Test Manager [Timestamp]`
   - Last Name: `E2E Test`
   - Email: `test.manager.[timestamp]@test.com`
3. Click "Permissions" tab
4. Select "Manager" from Role dropdown
5. Click "Save" button

**Expected Results:**
- [ ] Form submits successfully
- [ ] User is created with Manager role
- [ ] User appears in list with Manager badge (success color)
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test B3: Change User Role (Admin to Rep)

**Objective:** Verify Admin can change a user's role via slide-over.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A test Admin user exists (from Test B1)

**Steps:**
1. Navigate to `/#/sales`
2. Click on the Admin user created in Test B1
3. Click "Permissions" tab in the slide-over
4. Click "Edit" button
5. Change Role dropdown from "Admin" to "Rep"
6. Observe the Administrator Access toggle updates
7. Click "Save Changes"

**Expected Results:**
- [ ] Permissions tab shows Role dropdown in edit mode
- [ ] Role changes to "Rep"
- [ ] Administrator Access toggle shows "Disabled"
- [ ] Save operation succeeds
- [ ] Notification appears: "Permissions updated successfully"
- [ ] Role badge updates in the list (now shows Rep badge)
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test B4: Administrator Toggle Sync

**Objective:** Verify Administrator toggle is synced with Admin role.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A test Rep user exists

**Steps:**
1. Navigate to `/#/sales`
2. Click on a Rep user
3. Click "Permissions" tab
4. Click "Edit" button
5. Toggle the "Administrator Access" switch ON
6. Observe the Role dropdown changes

**Expected Results:**
- [ ] Toggling Administrator Access ON sets Role to "Admin"
- [ ] Toggling Administrator Access OFF sets Role to "Rep"
- [ ] Role and Administrator toggle remain in sync
- [ ] No console errors during toggle

**Pass/Fail:** [ ]

---

## Section C: Permissions Tab Tests

### Test C1: View Permissions Tab (View Mode)

**Objective:** Verify Permissions tab displays correctly in view mode.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales`
2. Click on any user (not yourself)
3. Click "Permissions" tab in the slide-over

**Expected Results:**
- [ ] Role displays as badge (Admin=primary, Manager=success, Rep=muted)
- [ ] Administrator Access shows "Yes" or "No"
- [ ] Account Status shows badge (Active=success, Disabled=warning)
- [ ] Danger Zone section visible (for admin users, on non-self records)
- [ ] "Remove User" button visible in Danger Zone
- [ ] No console errors

**Pass/Fail:** [ ]

---

### Test C2: Edit Permissions Tab

**Objective:** Verify Admin can edit permissions via the Permissions tab.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] Viewing a non-self user in slide-over

**Steps:**
1. From Permissions tab, click "Edit" button
2. Observe the Role dropdown becomes editable
3. Observe the Account Status toggle becomes editable
4. Change Role to a different value
5. Toggle Account Status (Disabled switch)
6. Click "Save Changes"

**Expected Results:**
- [ ] Role dropdown is editable
- [ ] Account Status toggle is editable
- [ ] Changes save successfully
- [ ] Notification appears: "Permissions updated successfully"
- [ ] Slide-over returns to view mode
- [ ] Changes reflected in view mode
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test C3: Self-Edit Prevention

**Objective:** Verify users cannot edit their own permissions.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales`
2. Find and click on "admin@test.com" (yourself)
3. Click "Permissions" tab
4. Click "Edit" button
5. Observe the form state

**Expected Results:**
- [ ] Warning message displays: "You cannot modify your own permissions."
- [ ] Role dropdown is disabled
- [ ] Account Status toggle is disabled
- [ ] "Remove User" button is NOT visible (Danger Zone hidden for self)
- [ ] Save button is disabled or form won't submit changes
- [ ] No console errors

**Pass/Fail:** [ ]

---

## Section D: User Deactivation Tests

### Test D1: Disable User Account

**Objective:** Verify Admin can disable a user account.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A test user exists that can be disabled

**Steps:**
1. Navigate to `/#/sales`
2. Click on a test user (not yourself)
3. Click "Permissions" tab
4. Click "Edit" button
5. Toggle "Account Status" switch to ON (Disabled)
6. Observe the warning message
7. Click "Save Changes"

**Expected Results:**
- [ ] Warning displays: "Disabling this account will prevent the user from logging in."
- [ ] Save operation succeeds
- [ ] Account Status shows "Disabled" badge (warning color)
- [ ] User row in list shows "Disabled" badge
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test D2: Re-enable User Account

**Objective:** Verify Admin can re-enable a disabled user account.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A disabled test user exists (from Test D1)

**Steps:**
1. Navigate to `/#/sales`
2. Remove the "Active only" filter to see disabled users
3. Click on the disabled test user
4. Click "Permissions" tab
5. Click "Edit" button
6. Toggle "Account Status" switch to OFF (Active)
7. Click "Save Changes"

**Expected Results:**
- [ ] Disabled user is visible when filter is removed
- [ ] Toggle switches to Active
- [ ] Warning message disappears
- [ ] Save operation succeeds
- [ ] Account Status shows "Active" badge (success color)
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test D3: Remove User (Soft Delete)

**Objective:** Verify Admin can remove a user via the Danger Zone.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A test user exists that can be removed

**Steps:**
1. Navigate to `/#/sales`
2. Click on a test user (not yourself)
3. Click "Permissions" tab
4. Scroll down to "Danger Zone" section
5. Click "Remove User" button
6. Wait for confirmation dialog to appear
7. Verify dialog shows user name and email
8. Click "Remove User" in the dialog

**Expected Results:**
- [ ] Confirmation dialog appears with user details
- [ ] Cancel button dismisses dialog without changes
- [ ] Remove button soft-deletes the user
- [ ] Notification appears: "User removed successfully"
- [ ] Redirects to `/sales` list
- [ ] User is no longer visible in the list
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

## Section E: Profile Tab Tests

### Test E1: View Profile Tab

**Objective:** Verify Profile tab displays user information correctly.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales`
2. Click on any user
3. Observe the Profile tab (default tab)

**Expected Results:**
- [ ] Avatar displays with user initials as fallback
- [ ] First Name displays correctly
- [ ] Last Name displays correctly
- [ ] Email displays correctly
- [ ] Phone displays or shows "Not provided"
- [ ] All fields are read-only in view mode
- [ ] No console errors

**Pass/Fail:** [ ]

---

### Test E2: Edit Profile Tab

**Objective:** Verify Admin can edit user profile information.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] Viewing a user in slide-over

**Steps:**
1. From Profile tab, click "Edit" button
2. Modify First Name: append " Updated"
3. Modify Phone: enter "555-123-4567"
4. Enter Avatar URL: `https://example.com/avatar.jpg`
5. Click "Save Changes"

**Expected Results:**
- [ ] Profile fields become editable inputs
- [ ] Avatar URL input appears in edit mode
- [ ] Changes save successfully
- [ ] Notification appears: "Profile updated successfully"
- [ ] Slide-over returns to view mode
- [ ] Changes reflected in the display
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

## Section F: Avatar Display Tests

### Test F1: Avatar Initials Fallback

**Objective:** Verify avatar displays user initials when no image is set.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales`
2. Click on a user without an avatar URL set
3. Observe the avatar in the Profile tab

**Expected Results:**
- [ ] Avatar displays a circular element
- [ ] Initials show first letter of first name + first letter of last name
- [ ] Initials are uppercase (e.g., "JD" for John Doe)
- [ ] No broken image icon
- [ ] No console errors

**Pass/Fail:** [ ]

---

### Test F2: Avatar Image Display

**Objective:** Verify avatar displays image when URL is set.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A user has a valid avatar_url set

**Steps:**
1. Navigate to `/#/sales`
2. Click on a user with an avatar URL
3. Observe the avatar in the Profile tab

**Expected Results:**
- [ ] Avatar displays the image from the URL
- [ ] Image fits within circular container
- [ ] No broken image icon (if URL is valid)
- [ ] Falls back to initials if image fails to load
- [ ] No console errors

**Pass/Fail:** [ ]

---

## Section G: Validation Edge Cases

### Test G1: Duplicate Email Prevention

**Objective:** Verify system prevents creating users with duplicate emails.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales/create`
2. Fill in General tab:
   - First Name: `Duplicate Test`
   - Last Name: `User`
   - Email: `admin@test.com` (existing user email)
3. Click "Save" button

**Expected Results:**
- [ ] Form submission fails
- [ ] Error notification appears: "A user with this email already exists."
- [ ] Form stays on create page
- [ ] Console may show 400 or duplicate error

**Pass/Fail:** [ ]

---

### Test G2: Email Format Validation

**Objective:** Verify email field validates email format.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales/create`
2. Fill in First Name and Last Name
3. Enter invalid emails and observe:
   - `notanemail`
   - `missing@domain`
   - `@nodomain.com`
   - `spaces in@email.com`

**Expected Results:**
- [ ] Each invalid email shows validation error
- [ ] Error message: "Must be a valid email address"
- [ ] Form prevents submission with invalid email
- [ ] Valid email (e.g., `valid@example.com`) clears the error
- [ ] No console errors during validation

**Pass/Fail:** [ ]

---

### Test G3: Name Length Limits

**Objective:** Verify name fields enforce maximum length.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales/create`
2. Enter a very long first name (100+ characters)
3. Enter a very long last name (100+ characters)
4. Observe the field behavior

**Expected Results:**
- [ ] Fields accept up to 100 characters
- [ ] Longer input shows validation error: "First name too long" / "Last name too long"
- [ ] Form prevents submission with oversized names
- [ ] No console errors

**Pass/Fail:** [ ]

---

### Test G4: Empty Name Validation

**Objective:** Verify name fields are required and cannot be whitespace-only.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales/create`
2. Enter only spaces in First Name: `   `
3. Enter only spaces in Last Name: `   `
4. Fill in a valid email
5. Attempt to submit

**Expected Results:**
- [ ] Whitespace-only names fail validation
- [ ] Error message: "First name is required" / "Last name is required"
- [ ] Form prevents submission
- [ ] Names are trimmed (leading/trailing spaces removed)
- [ ] No console errors

**Pass/Fail:** [ ]

---

## Section H: Viewport Testing

### Test H1: Desktop View (1440px+)

**Objective:** Verify Sales module displays correctly on desktop.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Browser window set to 1440px width or larger

**Steps:**
1. Navigate to `/#/sales`
2. Observe the list layout
3. Click on a user to open slide-over
4. Navigate to create form

**Expected Results:**
- [ ] List shows all columns: First Name, Last Name, Email, Role, Status
- [ ] Sidebar filter visible on the left
- [ ] Slide-over opens at 40vw width (480-720px)
- [ ] Create form centered with max-width container
- [ ] All touch targets at least 44px
- [ ] No horizontal scrolling needed
- [ ] No layout shifts or overlaps

**Pass/Fail:** [ ]

---

### Test H2: iPad View (1024px)

**Objective:** Verify Sales module displays correctly on iPad.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Browser window set to 1024px width (or use DevTools device emulation)

**Steps:**
1. Navigate to `/#/sales`
2. Observe the list layout
3. Click on a user to open slide-over
4. Navigate to create form

**Expected Results:**
- [ ] List shows essential columns: First Name, Last Name, Role, Status
- [ ] Email column may be hidden (desktop-only)
- [ ] Slide-over adjusts to appropriate width
- [ ] All touch targets at least 44px (h-11 w-11)
- [ ] Tabs remain accessible
- [ ] Form inputs are usable
- [ ] No horizontal scrolling needed

**Pass/Fail:** [ ]

---

### Test H3: iPad View - Slide-Over Interaction

**Objective:** Verify slide-over is usable on iPad.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Browser window set to iPad size (1024px width)

**Steps:**
1. Navigate to `/#/sales`
2. Click on a user to open slide-over
3. Switch between Profile and Permissions tabs
4. Enter edit mode
5. Make a change and save
6. Close the slide-over

**Expected Results:**
- [ ] Tabs are tappable (44px touch targets)
- [ ] Tab icons and labels visible
- [ ] Edit button is tappable
- [ ] Form inputs are appropriately sized
- [ ] Save/Cancel buttons are tappable
- [ ] Close button (X) is visible and tappable
- [ ] ESC key closes slide-over (if keyboard attached)

**Pass/Fail:** [ ]

---

## Section I: Access Control Tests

### Test I1: Manager Cannot Access Sales Create

**Objective:** Verify Manager role cannot create new users.

**Prerequisites:**
- [ ] Logged out of Admin session
- [ ] Console tab open and cleared

**Steps:**
1. Login as `manager@mfbroker.com` / `password123`
2. Navigate to `/#/sales`
3. Look for Create/Add button
4. Attempt to navigate directly to `/#/sales/create`

**Expected Results:**
- [ ] Login succeeds as Manager
- [ ] Sales list loads (may show limited users)
- [ ] Create button is NOT visible OR
- [ ] Direct navigation to `/sales/create` shows warning
- [ ] Notification: "You don't have permission to create team members."
- [ ] Redirects to `/sales` list
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test I2: Rep Cannot Access Sales Module

**Objective:** Verify Rep role has appropriate access restrictions.

**Prerequisites:**
- [ ] Logged out of Manager session
- [ ] Console tab open and cleared

**Steps:**
1. Login as `rep@mfbroker.com` / `password123`
2. Navigate to `/#/sales`
3. Observe what is visible/accessible

**Expected Results:**
- [ ] Login succeeds as Rep
- [ ] Sales list access may be blocked OR
- [ ] Only own record is visible OR
- [ ] Create button is NOT visible
- [ ] Edit access limited to own profile
- [ ] No ability to change roles or disable accounts
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test I3: Admin Full Access Verification

**Objective:** Verify Admin has full access to all Sales operations.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/sales`
2. Verify all users are visible
3. Create a new user
4. Edit any user's profile
5. Edit any user's permissions
6. Disable a user
7. Remove a user

**Expected Results:**
- [ ] All team members visible in list
- [ ] Create button visible and functional
- [ ] Can edit any user's profile
- [ ] Can change any user's role (except self)
- [ ] Can disable any user (except self)
- [ ] Can remove any user (except self)
- [ ] No RLS errors on any operation
- [ ] No "permission denied" errors

**Pass/Fail:** [ ]

---

## Console Monitoring Checklist

For all tests, verify the console is free of these error patterns:

### Critical Errors (Test MUST fail)
- [ ] No RLS errors: "permission denied", "row-level security", "42501"
- [ ] No React errors: "Uncaught Error", "React has detected..."
- [ ] No Supabase auth errors: "Not authenticated", "JWT expired"
- [ ] No 500 Internal Server Errors
- [ ] No 403 Forbidden on expected operations

### Acceptable Console Output
- [ ] `ResizeObserver` warnings (known browser quirk, ignore)
- [ ] Development mode warnings from Vite
- [ ] 403/401 errors when testing blocked operations (expected)

---

## Summary: Sales E2E Test Matrix

### CRUD Operations

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| A1 | View Sales List (Admin) | Success | [ ] |
| A2 | Create Sales User (Admin) | Success | [ ] |
| A3 | Create - Validation Errors | Blocked | [ ] |
| A4 | View via Slide-Over | Success | [ ] |
| A5 | Edit via Slide-Over | Success | [ ] |
| A6 | Edit Full-Page Form | Success | [ ] |

### Role Assignment

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| B1 | Create Admin | Success | [ ] |
| B2 | Create Manager | Success | [ ] |
| B3 | Change Role | Success | [ ] |
| B4 | Admin Toggle Sync | Success | [ ] |

### Permissions

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| C1 | View Permissions | Success | [ ] |
| C2 | Edit Permissions | Success | [ ] |
| C3 | Self-Edit Prevention | Blocked | [ ] |

### Deactivation

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| D1 | Disable User | Success | [ ] |
| D2 | Re-enable User | Success | [ ] |
| D3 | Remove User | Success | [ ] |

### Profile

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| E1 | View Profile | Success | [ ] |
| E2 | Edit Profile | Success | [ ] |

### Avatar

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| F1 | Initials Fallback | Success | [ ] |
| F2 | Image Display | Success | [ ] |

### Validation

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| G1 | Duplicate Email | Blocked | [ ] |
| G2 | Email Format | Blocked | [ ] |
| G3 | Name Length | Blocked | [ ] |
| G4 | Empty Name | Blocked | [ ] |

### Viewport

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| H1 | Desktop (1440px+) | Success | [ ] |
| H2 | iPad (1024px) | Success | [ ] |
| H3 | iPad Slide-Over | Success | [ ] |

### Access Control

| Test | Operation | Expected | Pass/Fail |
|------|-----------|----------|-----------|
| I1 | Manager Create (Blocked) | Blocked | [ ] |
| I2 | Rep Access (Restricted) | Blocked/Limited | [ ] |
| I3 | Admin Full Access | Success | [ ] |

---

## Pass Criteria

**All tests must pass** for Sales E2E to be considered successful.

### Critical Failures
The following failures indicate serious security issues:
- Rep or Manager able to create users
- Any user able to edit their own role
- Self-removal possible
- RLS errors on operations that should succeed

### Acceptable Results
- "Blocked" operations can manifest as: button hidden, button disabled, warning message, or redirect
- RLS errors in console for blocked operations are acceptable (indicates RLS working)
- 403/401 HTTP errors for blocked operations are acceptable

---

## Troubleshooting

### If Login Fails
1. Verify seed data was loaded: `just seed-e2e`
2. Check Supabase is running: `just dev` or `supabase status`
3. Verify user credentials in seed data

### If Create Button Missing
1. Check logged-in user's role (must be Admin)
2. Verify RBAC policies are configured correctly
3. Check `useCanAccess` hook in SalesCreate.tsx

### If Slide-Over Won't Open
1. Check for JavaScript errors in console
2. Verify `useSlideOverState` hook is working
3. Check URL updates with `?view=` parameter

### If Save Fails with No Error
1. Check Network tab for failed requests
2. Look for RLS policy violations
3. Verify Edge Function is running: `supabase functions status`

### If Self-Edit Not Blocked
1. **CRITICAL SECURITY ISSUE** - Document immediately
2. Check identity detection in SalesPermissionsTab
3. Verify `isSelfEdit` logic

---

## Notes

### Lazy Loading
The Sales module uses `React.lazy()` for code splitting. Initial load may show a brief loading state.

### Error Boundaries
Each view has error boundaries. If an error occurs, you may see a fallback UI instead of a crash.

### Keyboard Navigation
- Arrow keys navigate the list
- Enter opens slide-over
- ESC closes slide-over
- Tab navigates form fields

### URL Synchronization
- Slide-over state syncs with URL: `?view=[id]`
- Edit mode: `?view=[id]&mode=edit`
- Refreshing page should restore state

### Test Data Cleanup
- Tests create data with "Test" prefix and timestamps
- Clean up test data after completing the test suite
- Use `just db-reset` to reset to known state if needed
