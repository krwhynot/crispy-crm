# Team Management Access & Control E2E Tests

Manual E2E testing checklist for verifying user management capabilities (Add, Edit, Delete) on the Team Management page based on user roles.

## Prerequisites

- **Tests 1-4 of RBAC suite passed.**
- **Environment:** Local (`http://localhost:5173`) or Production.
- **Test Users:**
    - Admin: `admin@test.com`
    - Manager: `manager@mfbroker.com`
    - Rep: `rep@mfbroker.com`

**Note on User Creation:** The system uses an invitation-based flow. Admins do not set temporary passwords; instead, users receive an invitation email to set their own credentials.

---

## Section A: Admin Access (Full Control)

### Test A1: Admin Can Create New Users (Invitation Flow)

**Goal:** Verify Admin can add new team members (Manager and Rep) and trigger invitation emails.

**Steps:**
1. Login as **Admin** (`admin@test.com`).
2. Navigate to **Sales** (Team Management) via sidebar.
3. Verify **"Create"** (or "Add User") button is visible.
4. **Create Manager User:**
    - Click "Create".
    - First Name: `New`
    - Last Name: `Manager`
    - Email: `newmanager@test.com`
    - Role: `Manager`
    - Verify message: "User will receive an invitation email to set their password" is visible.
    - Click **Save**.
    - Verify `New Manager` appears in the list.
5. **Create Rep User:**
    - Click "Create".
    - First Name: `New`
    - Last Name: `Rep`
    - Email: `newrep@test.com`
    - Role: `Rep`
    - Verify invitation message is present.
    - Click **Save**.
    - Verify `New Rep` appears in the list.

**Expected Result:**
- [ ] Create button visible.
- [ ] Form submits successfully.
- [ ] New users (`New Manager`, `New Rep`) appear in the list with correct names.
- [ ] Invitation flow confirmed (no password field, info message present).

**Known Issue:** Backend user creation may fail with "Edge function users failed" error.

### Test A2: Admin Can Edit User Role & Details

**Goal:** Verify Admin can modify existing users.

**Steps:**
1. Login as **Admin**.
2. Navigate to **Sales**.
3. Click on `New Rep` (created in A1).
4. Click **Edit** (if not already in edit mode).
5. Change Role to `Manager`.
6. Change First Name to `Updated`.
7. Change Last Name to `User`.
8. Click **Save**.
9. Verify success notification.
10. Refresh page/list and verify Role and Name are updated.

**Expected Result:**
- [ ] Edit access granted.
- [ ] Role and Name changes persist.

### Test A3: Admin Can Disable/Delete User

**Goal:** Verify Admin can remove access for a user.

**Steps:**
1. Login as **Admin**.
2. Navigate to **Sales**.
3. Select `Updated User` (was `New Rep`).
4. Locate **Delete** button or **Disabled** toggle.
5. Perform action (Delete or Disable).
6. Confirm action in dialog.
7. Verify user is removed from list OR marked as disabled.

**Expected Result:**
- [ ] Delete/Disable action available and functional.

---

## Section B: Manager Access (Read-Only)

### Test B1: Manager Access Restricted

**Goal:** Verify Manager has no access to Team Management (Current Implementation).

**Steps:**
1. Login as **Manager** (`manager@mfbroker.com`).
2. Check sidebar for **Sales** (Team) menu item.
3. Attempt to navigate to `/#/sales` directly via URL.

**Expected Result:**
- [ ] **Sales** menu item is **NOT** visible.
- [ ] Direct URL access redirects to `/access-denied`.

**Note:** Current implementation is stricter than the original "Read-Only" specification.

---

## Section C: Rep Access (No Access)

### Test C1: Rep Cannot Access Team Management

**Goal:** Verify Rep has no access to Team Management.

**Steps:**
1. Login as **Rep** (`rep@mfbroker.com`).
2. Check sidebar for **Sales** (Team) menu item.
3. Attempt to navigate to `/#/sales` directly via URL.

**Expected Result:**
- [ ] **Sales** menu item is **NOT** visible.
- [ ] Direct URL access redirects to Dashboard or shows "Access Denied".