# Quick Logger - Manual Test Session Notes

**Date:** 2025-11-22
**Tester:** Claude Agent (via manual exploration)
**Status:** Bugs Found

---

## Summary of Findings

Two primary bugs were identified during a manual test of the Quick Logger feature when trying to log an activity with a contact that does not have an associated organization.

1.  **Organization Dropdown Bug:** The organization selection logic fails when the selected contact has no `organization_id`. The dropdown becomes empty instead of showing all available organizations.
2.  **Zod Validation Bug:** A form submission with an empty (but optional, per UI text) organization field triggers a misattributed Zod validation error on the `Notes` field.

---

## Bug 1: Organization Dropdown Logic

### Steps to Reproduce
1. Open the Quick Logger.
2. Select a contact that does not belong to any organization (e.g., "Borkovec Kyle").
3. Attempt to select an organization from the organization dropdown.

### Observed Behavior
- The organization dropdown is empty.
- A misleading message appears: "No other organizations (contact's org is selected)". This is incorrect because the contact has no organization.

### Hypothesis
The filtering logic incorrectly assumes the contact always has an `organization_id`. When the `organization_id` is `null` or `undefined`, the filter returns an empty array instead of falling back to show all organizations. This could also be a data loading race condition.

---

## Bug 2: Misattributed Zod Validation Error

### Steps to Reproduce
1. Follow the steps for Bug 1.
2. Fill out the "Notes" field.
3. Leave the "Organization" field empty (since the UI indicates "Select a contact OR organization").
4. Click "Save & Close".

### Observed Behavior
The form submission fails with a validation error: `"Invalid input: expected string, received undefined"`.

### Insight
This is a classic Zod + `react-hook-form` issue where validation errors are misattributed. The error message appears under the **Notes** field, but the root cause is almost certainly the **Organization** field being empty. This implies that the Organization field is required by the Zod schema, even though the UI suggests it is optional.
