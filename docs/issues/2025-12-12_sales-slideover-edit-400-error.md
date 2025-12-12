# Issue Report: Sales SlideOver Edit Returns 400 Error

**Date:** 2025-12-12
**Status:** ✅ FIXED
**Severity:** High (blocks user self-edit functionality)

## Problem Statement

`admin@test.com` cannot edit self (or any user) in the Sales SlideOver panel. The save operation fails silently with a 400 error from the Edge Function.

## Investigation Timeline

### Initial Hypothesis (Incorrect)
RLS policy `update_sales` was granting to `{public}` instead of `{authenticated}`, blocking authenticated users from updating sales records.

**Actions Taken:**
- Created migration `20251212021008_fix_update_sales_policy_role.sql`
- Applied via `npx supabase db reset`
- Verified policy now grants to `{authenticated}`

**Result:** Issue persisted - 400 error still occurring.

### Deep Investigation

Traced the full data flow from UI to database:

```
SalesSlideOver.tsx
  └── SalesProfileTab.tsx (useUpdate hook)
       └── unifiedDataProvider.update()
            └── salesService.salesUpdate()
                 └── dataProvider.invoke("users", { method: "PATCH", body })
                      └── Edge Function /functions/v1/users
                           └── Zod patchUserSchema.safeParse(body)
                                └── 400 ERROR HERE!
```

### Root Cause Identified

**Empty String vs Nullish Mismatch**

1. `SalesProfileTab.tsx` initializes form state with empty string defaults:
   ```typescript
   const [formData, setFormData] = useState({
     avatar_url: record?.avatar_url || "",  // Empty string when no avatar
   });
   ```

2. `sales.service.ts` includes the field if not undefined:
   ```typescript
   if (avatar_url !== undefined) body.avatar_url = avatar_url;
   // "" !== undefined is TRUE, so body.avatar_url = ""
   ```

3. Edge Function Zod schema rejects empty strings:
   ```typescript
   avatar_url: z.string().url("Invalid avatar URL").max(500).nullish()
   // .url() requires valid URL format
   // .nullish() allows null or undefined, NOT empty string
   // "" fails .url() validation!
   ```

**The Mismatch:**
| Source | Sends | Schema Accepts |
|--------|-------|----------------|
| Form default | `""` (empty string) | |
| Schema | | `null`, `undefined`, valid URL |
| **Result** | **400 Validation Error** | |

## Proposed Fix

**File:** `src/atomic-crm/services/sales.service.ts`

**Change:** Use truthy checks instead of `!== undefined` for optional string fields.

```typescript
// BEFORE (buggy):
if (avatar_url !== undefined) body.avatar_url = avatar_url;

// AFTER (fixed):
if (avatar_url) body.avatar_url = avatar_url;
```

**Why This Works:**
- Empty string `""` is falsy in JavaScript
- Truthy check excludes both `undefined` AND `""`
- Valid URLs are truthy and will be included
- `null` is also falsy, so won't be sent

**Fields to Update:**
```typescript
const body: Record<string, unknown> = { sales_id: id };
if (email) body.email = email;                    // String - use truthy
if (first_name) body.first_name = first_name;    // String - use truthy
if (last_name) body.last_name = last_name;       // String - use truthy
if (phone) body.phone = phone;                   // String - use truthy
if (role !== undefined) body.role = role;        // Enum - keep !== undefined
if (disabled !== undefined) body.disabled = disabled;  // Boolean - keep !== undefined
if (avatar_url) body.avatar_url = avatar_url;    // URL String - use truthy
if (deleted_at) body.deleted_at = deleted_at;    // Timestamp - use truthy
```

## Alternative Fixes Considered

### Option A: Fix Schema (Not Recommended)
```typescript
avatar_url: z.string().url().or(z.literal("")).max(500).nullish()
```
**Rejected:** Empty string in database is worse than null. Schema should enforce data quality.

### Option B: Fix Form Defaults (Partial Fix)
```typescript
avatar_url: record?.avatar_url ?? undefined,  // undefined instead of ""
```
**Rejected:** Would need to update all forms. Service layer fix is more defensive.

### Option C: Fix Service Layer (Recommended)
Use truthy checks in service layer - catches all empty strings regardless of form implementation.

## Test Plan

1. Login as `admin@test.com`
2. Open Sales SlideOver (click own name in sales list)
3. Edit `first_name` field
4. Click "Save Changes"
5. Verify success notification (no error)
6. Refresh page, verify change persisted

## Files Modified

| File | Change |
|------|--------|
| `src/atomic-crm/services/sales.service.ts` | Update conditionals on lines 86-93 |

## Debugging Attempts Timeline

### Attempt 1: RLS Policy Fix (INCORRECT HYPOTHESIS)
**Date:** 2025-12-12 ~02:00
**Hypothesis:** RLS policy `update_sales` grants to `{public}` instead of `{authenticated}`
**Action:** Created migration `20251212021008_fix_update_sales_policy_role.sql`
**Result:** ❌ Issue persisted - 400 error still occurring
**Learning:** RLS errors return 403, not 400. This was a red herring.

### Attempt 2: Empty String Filtering in SalesService (CORRECT BUT INCOMPLETE)
**Date:** 2025-12-12 ~02:30
**Hypothesis:** Empty string `avatar_url: ""` fails Zod `.url()` validation in Edge Function
**Action:** Changed `sales.service.ts` conditionals from `!== undefined` to truthy checks
**Result:** ❌ Issue persisted - "nothing changed"
**Learning:** The fix was correct but never executed because validation happened earlier in the pipeline.

### Attempt 3: Trace Full Data Flow (ROOT CAUSE FOUND)
**Date:** 2025-12-12 ~08:30
**Investigation:** Traced data flow from SalesProfileTab through unifiedDataProvider
**Discovery:** `ValidationService.ts` calls `validateSalesForm()` for sales updates BEFORE `salesService.salesUpdate()` is reached
**Root Cause:**
- `validateSalesForm()` uses `salesSchema` which is `z.strictObject()`
- `avatar_url: z.string().url()` rejects empty string `""`
- Validation fails → 400 error → `salesService.salesUpdate()` never called
**Action:** Removed update validation for sales in ValidationService (Edge Function handles it)
**Result:** ✅ Fixed!

## Lessons Learned

1. **Zod `.nullish()` does NOT accept empty strings** - only `null` and `undefined`
2. **`!== undefined` check lets empty strings through** - use truthy checks for optional strings
3. **Edge Function 400 errors need payload inspection** - the error message "Invalid avatar URL" wasn't visible in logs
4. **Defense in depth:** Service layer should sanitize data even if forms should do it too
5. **Trace the FULL data flow** - fixes can be correct but unreachable if validation happens upstream
6. **Avoid duplicate validation** - having Zod validation in both data provider AND Edge Function creates sync issues
7. **`.partial()` doesn't help with empty strings** - it makes fields optional, but if provided, validators still run

## Actual Fix Applied (2025-12-12)

### Why The Initial Fix Didn't Work

The initial fix in `sales.service.ts` was **correct** but **never executed**. Here's why:

**Data Flow (before fix):**
```
SalesProfileTab → useUpdate()
  → unifiedDataProvider.update()
    → processForDatabase()
      → ValidationService.validate("sales", "update", data)
        → validateSalesForm() uses salesSchema (z.strictObject)
          → avatar_url: z.string().url() REJECTS empty string ""
            → 400 ERROR HERE!
    → salesService.salesUpdate() ← NEVER REACHED!
```

The validation happened **BEFORE** `salesService.salesUpdate()` could filter out empty strings!

### The Real Root Cause

`ValidationService.ts` was using `validateSalesForm()` for sales updates, which uses the strict `salesSchema`:
- `salesSchema` is `z.strictObject()` with `avatar_url: z.string().url()`
- Empty string `""` is a string, so `.url()` validator runs and **rejects it**
- Even `updateSalesSchema = salesSchema.partial()` has the same issue - `.partial()` makes fields optional, but if provided, validators still run

### Files Modified

| File | Change |
|------|--------|
| `src/atomic-crm/services/sales.service.ts` | Truthy checks for optional strings (lines 86-94) |
| `src/atomic-crm/providers/supabase/services/ValidationService.ts` | Removed update validation for sales - Edge Function handles it |

### Fix Details

**ValidationService.ts** - Removed local update validation for sales:
```typescript
sales: {
  create: async (data: unknown) => validateSalesForm(data),
  // INTENTIONALLY NO UPDATE VALIDATION - Edge Function handles it
  // update: undefined (intentionally omitted)
},
```

**Why this is correct:**
1. Edge Function `/users PATCH` already has Zod validation (`patchUserSchema`)
2. `salesService.salesUpdate()` filters empty strings with truthy checks
3. Duplicate validation was causing the 400 error before filtering could happen
4. Defense in depth: Edge Function is the authoritative validator

### Data Flow (after fix)
```
SalesProfileTab → useUpdate()
  → unifiedDataProvider.update()
    → processForDatabase()
      → ValidationService.validate() → NO update handler for sales → SKIP!
    → salesService.salesUpdate()
      → Truthy checks filter out avatar_url: ""
      → Edge Function receives clean payload
        → patchUserSchema validates → SUCCESS!
```

## Test Plan (Updated)

1. Login as `admin@test.com`
2. Open Sales SlideOver (click own name in sales list)
3. Edit `first_name` field
4. Click "Save Changes"
5. Verify success notification (no error)
6. Refresh page, verify change persisted
7. **Also test:** Leave avatar URL empty and save - should work

## Related Issues

- RLS policy migration: `20251212021008_fix_update_sales_policy_role.sql` (already applied, not the root cause)
- Trigger: `enforce_sales_column_restrictions_trigger` (not involved - error occurs before trigger fires)
