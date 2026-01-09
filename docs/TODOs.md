# Master Execution Plan: System Integrity Remediation

**Date:** 2026-01-08
**Source:** [Provider Audit Report](./PROVIDER_AUDIT_REPORT.md)
**Scope:** 56 Findings (22 Critical) across Application, Database, and Provider Layers
**Core Theme:** Eliminating "Silent Fallbacks"—places where the system hides errors, corrupts data, or bypasses security checks to avoid crashing.

---

## Pre-Flight Checklist

> **Do not start Phase 1 without completing these items.**

- [ ] **1. Database Snapshot**
  You will be modifying Foreign Key constraints and RLS views. A bad migration here is destructive.
  **Action:** Create a manual backup in the Supabase dashboard.

- [ ] **2. Test User Account**
  Create a standard "Sales Rep" user.
  **Action:** You cannot verify Security fixes (RLS) using an Admin/Service Role account. Ensure you have the login credentials ready.

- [ ] **3. Access to Production Logs**
  **Action:** Keep your Sentry or Supabase Logs dashboard open in a separate tab. Enabling validation [Item 1] may cause a spike in rejected errors that you need to monitor.

---

## Phase 1: Invisible Hardening (Security & Correctness)

**Goal:** Fix active security holes and data leaks. These changes are invisible to valid user workflows but stop bad actors and bad data.
**Risk:** Low (Unlikely to break UI for legitimate users).

---

### Item 1: Fix Validation Service Casing [CRITICAL-001]

- [ ] **Complete**

#### The Context
The `ValidationService` registry uses `camelCase` keys (e.g., `contactNotes`), but the Data Provider sends `snake_case` resource names (`contact_notes`).

#### The Silent Failure
The service looks up `validationRegistry["contact_notes"]`, finds `undefined`, and returns silently.
**Result:** Notes are entering the database with ZERO validation.

#### The Fix
Update `src/atomic-crm/providers/supabase/services/ValidationService.ts`. Add `snake_case` aliases to the registry pointing to the existing validators.

#### Manual Test Required

1. **Action:** Create a temporary test file (e.g., `test-validation.ts`).
2. **Code:** Import `ValidationService` and call `validate('contact_notes', { bad_field: true })`.
3. **Verify:** Assert that it **throws** a Validation Error. (Currently, it returns void).
4. **Cleanup:** Delete the test file.

#### Troubleshooting
Valid forms will continue to work. Bots or broken scripts sending malformed data will now fail (HttpError 400).

---

### Item 2: Fix IDOR in `getMany` [SF-C09]

- [ ] **Complete**

#### The Context
The `getMany` method (used by React Admin for reference arrays, e.g., "List of Contacts") accepts an array of IDs. It fetches them directly from Supabase.

#### The Silent Failure
It does **not** apply the Tenancy/Ownership filter that `getList` does. A user can fetch a competitor's Contact if they guess the ID.

#### The Fix
Modify `src/atomic-crm/providers/supabase/composedDataProvider.ts`. Inject the `applySearchParams` or explicit tenancy filter into the `getMany` and `getManyReference` handlers.

#### Manual Test Required

1. **Action:** Log in as "User A". Find a Contact ID belonging to "User B" (competitor).
2. **Action:** Open your browser console (F12) and manually call:
   ```javascript
   dataProvider.getMany('contacts', { ids: ['USER_B_CONTACT_ID'] })
   ```
3. **Verify:** The result array should be **empty** or throw an error. If you get data back, the fix failed.

#### Troubleshooting
If dropdowns (e.g., "Assign to Contact") appear empty, the new filter might be too strict (e.g., filtering out "Shared/Public" contacts).

---

### Item 3: Fix Security Definer Views [SF-C01]

- [ ] **Complete**

#### The Context
6 Database Views (including `dashboard_principal_summary`) are defined with `SECURITY DEFINER`.

#### The Silent Failure
These views run with the permissions of the **Creator** (the Admin), bypassing Row Level Security (RLS). Any authenticated user can see the Global Pipeline Summary.

#### The Fix
Run a SQL migration to alter these views to `SECURITY INVOKER`.

#### Manual Test Required

1. **Action:** Log in to the App as your restricted "Sales Rep" test user.
2. **Action:** Navigate to the Dashboard.
3. **Verify:** You should **only** see pipeline numbers for that specific user. If you see the global company total, the view is still leaking data.

#### Troubleshooting
If dashboards show *zero* data, check the RLS policies on the underlying tables (Sales, Opportunities). The user may need a specific `SELECT` policy added.

---

### Item 4: Fix Storage Cleanup [SF-C10]

- [ ] **Complete**

#### The Context
When a record (Contact, Organization) is deleted, the file associated with it (Avatar, Logo) remains in S3 storage.

#### The Silent Failure
The app "forgets" the file, but it exists forever, costing money and violating "Right to be Forgotten" (GDPR).

#### The Fix
Add `afterDelete` callbacks to `contactsCallbacks.ts`, `organizationsCallbacks.ts`, etc., that verify if a file URL exists and call `dataProvider.storage.remove()`.

#### Manual Test Required

1. **Action:** Upload an avatar for a test Contact.
2. **Action:** Check the `storage.objects` table (Supabase Dashboard) to confirm the file exists.
3. **Action:** Delete the Contact in the UI.
4. **Verify:** Refresh the `storage.objects` table. The file should be **gone**.

---

## Phase 2: The "Loud" Logic (Data Integrity)

**Goal:** Stop silent corruption. Users will start seeing error messages (e.g., "Conflict", "Invalid"). This is intentional.
**Risk:** Medium (Requires user education).

---

### Item 5: Fix Optimistic Locking [SF-C12]

- [ ] **Complete**

#### The Context
The `opportunities` table has a `version` column and a Trigger to increment it. The `sync_opportunity_with_products` RPC accepts an `expected_version`.

#### The Silent Failure
`opportunitiesHandler.ts` **never passes** the version from the frontend to the service. It sends `undefined`. Consequently, the RPC disables its concurrency check. Users overwrite each other silently.

#### The Fix
Update `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts` (update method) to pass `params.previousData.version` as the 4th argument to `service.updateWithProducts`.

#### Manual Test Required

1. **Action:** Open the same Opportunity in two different browser tabs (Tab A and Tab B).
2. **Action:** In Tab A, change the status and Save. (Version increments from 1 → 2).
3. **Action:** In Tab B (which still has Version 1 loaded), try to change the Description and Save.
4. **Verify:** You must see a red error notification: **"Conflict: Record has been updated by another user."**

#### Troubleshooting
If users report "Conflict" on *their own* edits, the frontend cache isn't updating the local version number after a save. Verify `useMutation` returns the new version.

---

### Item 6: Fix Silent Stage Reclassification [SF-C04]

- [ ] **Complete**

#### The Context
If an Opportunity has an invalid stage (e.g., from a bad CSV import), the `StageGrouping` logic catches it.

#### The Silent Failure
Instead of erroring, it logs a `console.warn` and **mutates** the stage to "New Lead". This corrupts pipeline data.

#### The Fix
In `src/atomic-crm/opportunities/constants/stages.ts`, remove the fallback. Replace with `throw new Error("Invalid stage: " + stage)`.

#### Manual Test Required

1. **Action:** In your code, temporarily hardcode a bad stage value (e.g., `stage: "INVALID"`) in a test component.
2. **Verify:** The App (or that component) should crash with a clear Error Boundary message, NOT silently render the Opportunity in the "New Lead" column.

#### Troubleshooting
Import scripts might fail if your CSV data is dirty. This forces you to clean the data source.

---

### Item 7: Fix Digest Service Casts [SF-C02]

- [ ] **Complete**

#### The Context
`DigestService` validates data using `zodSchema.safeParse`.

#### The Silent Failure
If validation fails, it logs a warning but returns the **invalid input** cast `as UserDigestSummarySchema`. This crashes the UI downstream.

#### The Fix
Change logic in `src/atomic-crm/services/digest.service.ts`: `if (!result.success) throw new Error(...)`.

#### Manual Test Required

1. **Action:** Create a unit test passing invalid JSON to `DigestService`.
2. **Verify:** Ensure the service throws an error immediately.

---

## Phase 3: Structural Changes (The Danger Zone)

**Goal:** Prevent Orphaned Records.
**Risk:** High

> **CRITICAL DEPENDENCY:** You **MUST** complete Items 8, 9, and 10 **BEFORE** Item 11.
> If you enable DB constraints (Item 11) before the UI/RPCs handle them, the App will crash when users try to delete things.

---

### Item 8: UI: Add Child Counts [WF-C06]

- [ ] **Complete**

#### The Context
Admins use the "Delete" button. The current dialog says "Delete Organization?". It does not warn that 50 Contacts will also be orphaned/deleted.

#### The Fix
Update `src/components/admin/delete-confirm-dialog.tsx`. Before showing the dialog, query `getManyReference` for related tables (Contacts, Opportunities). Display: "Warning: This will also affect 15 related records."

#### Manual Test Required

1. **Action:** Find an Organization that has at least 3 Contacts.
2. **Action:** Click the "Delete" button.
3. **Verify:** The dialog must say **"Warning: This will also delete 3 related Contacts."** Do NOT proceed if this text is missing.

---

### Item 9: Logic: Implement Cascade RPCs [WF-C01/02]

- [ ] **Complete**

#### The Context
Currently, deleting a Contact or Organization uses a generic `update(deleted_at)` call. This **only** deletes the parent. The children (Activities, Tasks) remain active but orphaned.

#### The Fix

1. Create PostgreSQL RPCs: `archive_contact_with_relations` and `archive_organization_with_relations`. These functions should set `deleted_at` on the parent AND all related children.
2. Update `contactsHandler.ts` and `organizationsHandler.ts` to call these RPCs instead of the generic update.

#### Manual Test Required

1. **Action:** Run the SQL to create the RPCs.
2. **Action:** In the UI, delete a Contact that has Activities.
3. **Verify:** Query the DB:
   ```sql
   SELECT * FROM activities WHERE contact_id = [DELETED_ID];
   ```
   The `deleted_at` column must **NOT** be null.

---

### Item 10: Logic: Disabled User Workflow [WF-C04]

- [ ] **Complete**

#### The Context
Disabling a user (setting `disabled=true`) does not reassign their records. Their Opportunities become "Dead Revenue" owned by an inaccessible ID.

#### The Fix
Create a `BulkReassignButton` component. When disabling a user, redirect to a wizard: "You are disabling User X. To whom should we assign their 50 active deals?"

#### Manual Test Required

1. **Action:** Go to the User Management screen.
2. **Action:** Click "Disable" on a test user.
3. **Verify:** A "Reassign Records" modal or wizard appears.

---

### Item 11: DB: Final Lock (Constraints) [SF-C08]

- [ ] **Complete**

> **DEPENDENCY:** This relies on Items 8, 9, and 10. The RPCs must handle the soft deletion logic. If the App tries to Hard Delete after this change, it will throw a `Foreign Key Violation`.

#### The Context
The database currently uses `ON DELETE CASCADE`.

#### The Risk
If a bug (or admin) performs a **HARD DELETE** (SQL `DELETE`) on a Parent, Postgres silently wipes out the entire hierarchy. This defeats the purpose of "Soft Deletes."

#### The Fix
Run a Migration to **DROP** `ON DELETE CASCADE` and **ADD** `ON DELETE RESTRICT` for the 20 identified constraints (Activities, Notes, Tasks, etc.).

#### Manual Test Required

1. **Action:** In the Supabase SQL Editor, attempt to run:
   ```sql
   DELETE FROM contacts WHERE id = [ID_WITH_ACTIVITIES];
   ```
2. **Verify:** You MUST receive an error:
   `update or delete on table "contacts" violates foreign key constraint...`

#### Troubleshooting
**Critical:** If the UI Delete button breaks (throws 500) after this step, it means the Provider is attempting a Hard Delete instead of the Soft Delete RPC. Re-verify Items 8-10.

---

## Progress Tracking

| Phase | Items | Completed |
|-------|-------|-----------|
| Pre-Flight | 3 | 0/3 |
| Phase 1: Invisible Hardening | 4 | 0/4 |
| Phase 2: Loud Logic | 3 | 0/3 |
| Phase 3: Structural Changes | 4 | 0/4 |
| **Total** | **14** | **0/14** |

---

## Quick Reference: Finding IDs

| Item | Finding ID | Category |
|------|------------|----------|
| 1 | CRITICAL-001 | Validation |
| 2 | SF-C09 | Security (IDOR) |
| 3 | SF-C01 | Security (RLS Bypass) |
| 4 | SF-C10 | Data Leak (Storage) |
| 5 | SF-C12 | Data Integrity (Locking) |
| 6 | SF-C04 | Data Corruption |
| 7 | SF-C02 | Error Handling |
| 8 | WF-C06 | UX (Delete Warning) |
| 9 | WF-C01/02 | Data Integrity (Cascade) |
| 10 | WF-C04 | Workflow (User Disable) |
| 11 | SF-C08 | Database (Constraints) |

---

*Generated from Provider Audit Report - 2026-01-08*
