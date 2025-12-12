# Issue Report: Sales SlideOver Edit Returns 400 Error

**Date:** 2025-12-12
**Status:** Root Cause Identified, Fix Pending
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

## Lessons Learned

1. **Zod `.nullish()` does NOT accept empty strings** - only `null` and `undefined`
2. **`!== undefined` check lets empty strings through** - use truthy checks for optional strings
3. **Edge Function 400 errors need payload inspection** - the error message "Invalid avatar URL" wasn't visible in logs
4. **Defense in depth:** Service layer should sanitize data even if forms should do it too

## Related Issues

- RLS policy migration: `20251212021008_fix_update_sales_policy_role.sql` (already applied, not the root cause)
- Trigger: `enforce_sales_column_restrictions_trigger` (not involved - error occurs before trigger fires)
