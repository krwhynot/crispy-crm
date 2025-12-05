# Pre-Launch Fixes Implementation Plan

**Date:** 2025-12-04
**Type:** Bug Fix
**Scope:** Cross-feature (Services + Edge Functions + Forms)
**Execution:** Parallel groups where possible
**Estimated Total Time:** ~85 minutes

---

## Plan Summary

| Issue | Area | Tasks | Est. Time |
|-------|------|-------|-----------|
| 3 silent failures in digest service | Code | 3 tasks | 15 min |
| Daily Digest needs auth | Edge Function | 2 tasks | 15 min |
| Overdue Tasks needs auth | Edge Function | 2 tasks | 10 min |
| User Management validation | Edge Function | 4 tasks | 30 min |
| Task form redundant validation | Code | 1 task | 5 min |
| Verification | Testing | 2 tasks | 10 min |

**Total Tasks:** 14 atomic tasks (2-5 min each)

---

## Task Status Summary (2025-12-05)

| Task Group | Status | Evidence |
|------------|--------|----------|
| Task 2.1-2.2: Daily Digest Auth | ✅ COMPLETE | `CRON_SECRET` at daily-digest/index.ts:77, auth check at line 189 |
| Task 3.1-3.2: Overdue Tasks Auth | ✅ COMPLETE | `CRON_SECRET` at check-overdue-tasks/index.ts:25, auth check at line 34 |
| Task 1.1-1.3: Silent Failures | ⚠️ PARTIAL | Throws found at lines 167, 201, 240 - verify fallback behavior |
| Task 4.x: User Management Zod | NOT VERIFIED | Need to check users Edge Function |
| Task 5.1: Task form resolver | NOT VERIFIED | |
| Task 6.x: Verification | NOT VERIFIED | |

---

## Architecture: Task Dependencies

```
PARALLEL GROUP A (Can run simultaneously):
├── Task 1.1: Fix getOverdueTasksForUser fallback
├── Task 1.2: Fix getTasksDueTodayForUser fallback
├── Task 1.3: Fix getStaleDealsForUser fallback
└── Task 5.1: Remove Task form resolver

PARALLEL GROUP B (Can run simultaneously):
├── Task 2.1: Add cron secret env var for daily-digest
├── Task 2.2: Add auth check to daily-digest POST
├── Task 3.1: Add cron secret env var for check-overdue-tasks
└── Task 3.2: Add auth check to check-overdue-tasks

SEQUENTIAL GROUP C (Must run in order):
├── Task 4.1: Create Zod schemas for users function
├── Task 4.2: Add request size validation
├── Task 4.3: Apply Zod validation to inviteUser
└── Task 4.4: Apply Zod validation to patchUser

FINAL (After all above complete):
├── Task 6.1: Run TypeScript check
└── Task 6.2: Run build verification
```

---

## PARALLEL GROUP A: Fail-Fast Fixes

### Task 1.1: Fix getOverdueTasksForUser Fallback

**File:** `src/atomic-crm/services/digest.service.ts`
**Lines:** 163-170
**Time:** 3 min

**Current Code (WRONG):**
```typescript
if (!parsed.success) {
  console.warn("[DigestService] Overdue tasks validation warning", {
    salesId,
    errors: parsed.error.errors,
  });
  // Return raw data if validation fails (graceful degradation)
  return (data || []) as OverdueTask[];
}
```

**Replace With (CORRECT - Fail Fast):**
```typescript
if (!parsed.success) {
  const errorDetails = parsed.error.errors
    .map(e => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  throw new Error(`Overdue tasks validation failed: ${errorDetails}`);
}
```

**Constitution Checklist:**
- [x] Fail-fast: Throws instead of silent fallback
- [x] No retry logic added
- [x] Detailed error message for debugging

---

### Task 1.2: Fix getTasksDueTodayForUser Fallback

**File:** `src/atomic-crm/services/digest.service.ts`
**Lines:** 199-206
**Time:** 3 min

**Current Code (WRONG):**
```typescript
if (!parsed.success) {
  console.warn("[DigestService] Tasks due today validation warning", {
    salesId,
    errors: parsed.error.errors,
  });
  // Return raw data if validation fails (graceful degradation)
  return (data || []) as TodayTask[];
}
```

**Replace With (CORRECT - Fail Fast):**
```typescript
if (!parsed.success) {
  const errorDetails = parsed.error.errors
    .map(e => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  throw new Error(`Tasks due today validation failed: ${errorDetails}`);
}
```

---

### Task 1.3: Fix getStaleDealsForUser Fallback

**File:** `src/atomic-crm/services/digest.service.ts`
**Lines:** 240-245
**Time:** 3 min

**Current Code (WRONG):**
```typescript
if (!parsed.success) {
  console.warn("[DigestService] Stale deals validation warning", {
    salesId,
    errors: parsed.error.errors,
  });
  return (data || []) as StaleDeal[];
}
```

**Replace With (CORRECT - Fail Fast):**
```typescript
if (!parsed.success) {
  const errorDetails = parsed.error.errors
    .map(e => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  throw new Error(`Stale deals validation failed: ${errorDetails}`);
}
```

---

### Task 5.1: Remove Task Form Resolver

**File:** `src/atomic-crm/tasks/TaskSlideOverDetailsTab.tsx`
**Line:** 101
**Time:** 5 min

**Current Code (WRONG - dual validation):**
```tsx
<Form onSubmit={handleSave} record={record} resolver={zodResolver(taskEditFormSchema)}>
```

**Replace With (CORRECT - validation at API boundary only):**
```tsx
<Form onSubmit={handleSave} record={record}>
```

**Also Remove (lines 4-9):**
```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { taskUpdateSchema } from "../validation/task";

// Form-specific schema: omit 'id' since we get it from record.id prop
// The taskUpdateSchema requires id, but form inputs don't include it
const taskEditFormSchema = taskUpdateSchema.omit({ id: true });
```

**Constitution Checklist:**
- [x] Single source of truth: Validation in unifiedDataProvider only
- [x] No form-level validation
- [x] Removed unused imports

---

## PARALLEL GROUP B: Edge Function Auth

### Task 2.1: Add Cron Secret Env Var (daily-digest)

**File:** `supabase/functions/daily-digest/index.ts`
**Location:** Top of file, after imports
**Time:** 2 min

**Add After Line 31:**
```typescript
// Cron authentication secret (set in Supabase dashboard)
const CRON_SECRET = Deno.env.get("CRON_SECRET");
```

---

### Task 2.2: Add Auth Check to Daily Digest POST

**File:** `supabase/functions/daily-digest/index.ts`
**Lines:** 176-188
**Time:** 8 min

**Current Code (WRONG - no auth on manual trigger):**
```typescript
// Check for manual trigger with specific user (for testing)
let specificSalesId: number | null = null;
if (req.method === "POST") {
  try {
    const body = await req.json();
    if (body.sales_id && typeof body.sales_id === "number") {
      specificSalesId = body.sales_id;
      console.log(`Manual trigger for specific user: ${specificSalesId}`);
    }
  } catch {
    // No body or invalid JSON, proceed with full digest
  }
}
```

**Replace With (CORRECT - auth required for manual triggers):**
```typescript
// Check for manual trigger with specific user (for testing)
let specificSalesId: number | null = null;
if (req.method === "POST") {
  // Manual triggers require authentication
  const authHeader = req.headers.get("Authorization");

  // Check for cron secret (internal cron jobs)
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    console.log("Authenticated via cron secret");
  } else if (authHeader?.startsWith("Bearer ")) {
    // Verify JWT for manual API calls
    const localClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData } = await localClient.auth.getUser();

    if (!authData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Valid JWT required for manual triggers" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify admin role for manual triggers
    const { data: sale } = await supabaseAdmin
      .from("sales")
      .select("administrator")
      .eq("user_id", authData.user.id)
      .single();

    if (!sale?.administrator) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin role required for manual triggers" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Manual trigger by admin user: ${authData.user.id}`);
  } else {
    return new Response(
      JSON.stringify({ error: "Unauthorized - Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    if (body.sales_id && typeof body.sales_id === "number") {
      specificSalesId = body.sales_id;
      console.log(`Manual trigger for specific user: ${specificSalesId}`);
    }
  } catch {
    // No body or invalid JSON, proceed with full digest
  }
}
```

**Also Add Import (after line 1):**
```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";
```

---

### Task 3.1: Add Cron Secret Env Var (check-overdue-tasks)

**File:** `supabase/functions/check-overdue-tasks/index.ts`
**Location:** Top of file, after imports
**Time:** 2 min

**Add After Line 17:**
```typescript
// Cron authentication secret (set in Supabase dashboard)
const CRON_SECRET = Deno.env.get("CRON_SECRET");
```

---

### Task 3.2: Add Auth Check to Check Overdue Tasks

**File:** `supabase/functions/check-overdue-tasks/index.ts`
**Lines:** 24-26
**Time:** 8 min

**Current Code (WRONG - no auth):**
```typescript
Deno.serve(async (_req) => {
  try {
    console.log("Starting overdue tasks check...");
```

**Replace With (CORRECT - cron auth required):**
```typescript
Deno.serve(async (req) => {
  try {
    // Verify request is from authorized source (cron or admin)
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn("Unauthorized access attempt to check-overdue-tasks");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Cron functions require authentication" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Starting overdue tasks check...");
```

---

## SEQUENTIAL GROUP C: User Management Validation

### Task 4.1: Create Zod Schemas for Users Function

**File:** `supabase/functions/users/index.ts`
**Location:** After imports (line 5)
**Time:** 8 min

**Add After Line 4:**
```typescript
import { z } from "npm:zod@3.22.4";

// Zod schemas following engineering constitution:
// - z.strictObject() at API boundary (mass assignment prevention)
// - .max() on all strings (DoS prevention)
// - z.coerce for type conversion

const inviteUserSchema = z.strictObject({
  email: z.string().email("Invalid email format").max(254, "Email too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
  first_name: z.string().min(1, "First name required").max(100, "First name too long"),
  last_name: z.string().min(1, "Last name required").max(100, "Last name too long"),
  disabled: z.coerce.boolean().optional().default(false),
  administrator: z.coerce.boolean().optional().default(false),
});

const patchUserSchema = z.strictObject({
  sales_id: z.coerce.number().int().positive("Invalid sales ID"),
  email: z.string().email("Invalid email format").max(254).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  avatar: z.string().url("Invalid avatar URL").max(500).optional(),
  administrator: z.coerce.boolean().optional(),
  disabled: z.coerce.boolean().optional(),
});

// Maximum request body size (1MB)
const MAX_REQUEST_SIZE = 1048576;
```

---

### Task 4.2: Add Request Size Validation

**File:** `supabase/functions/users/index.ts`
**Location:** Add helper function after schemas
**Time:** 5 min

**Add After Schemas:**
```typescript
/**
 * Validate request body size to prevent DoS
 * Returns parsed JSON body or throws error
 */
async function parseAndValidateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  // Check content length
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    throw new Error("Request body too large (max 1MB)");
  }

  // Parse JSON
  const body = await req.json();

  // Validate with Zod
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }

  return result.data;
}
```

---

### Task 4.3: Apply Zod Validation to inviteUser

**File:** `supabase/functions/users/index.ts`
**Lines:** 48-64
**Time:** 8 min

**Current Code (WRONG - manual validation):**
```typescript
async function inviteUser(req: Request, currentUserSale: any, corsHeaders: Record<string, string>) {
  const { email, password, first_name, last_name, disabled, administrator } = await req.json();

  if (!currentUserSale.administrator) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }

  // Validate required fields - guardrail to prevent empty names
  if (!first_name?.trim()) {
    return createErrorResponse(400, "First name is required", corsHeaders);
  }
  if (!last_name?.trim()) {
    return createErrorResponse(400, "Last name is required", corsHeaders);
  }
  if (!email?.trim()) {
    return createErrorResponse(400, "Email is required", corsHeaders);
  }
```

**Replace With (CORRECT - Zod validation):**
```typescript
async function inviteUser(req: Request, currentUserSale: any, corsHeaders: Record<string, string>) {
  // Check admin authorization first (fast path)
  if (!currentUserSale.administrator) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }

  // Validate request body with Zod schema
  let validatedData;
  try {
    validatedData = await parseAndValidateBody(req, inviteUserSchema);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return createErrorResponse(400, message, corsHeaders);
  }

  const { email, password, first_name, last_name, disabled, administrator } = validatedData;
```

---

### Task 4.4: Apply Zod Validation to patchUser

**File:** `supabase/functions/users/index.ts`
**Lines:** 102-114
**Time:** 9 min

**Current Code (WRONG - no validation):**
```typescript
async function patchUser(req: Request, currentUserSale: any, corsHeaders: Record<string, string>) {
  const { sales_id, email, first_name, last_name, avatar, administrator, disabled } =
    await req.json();
  const { data: sale } = await supabaseAdmin.from("sales").select("*").eq("id", sales_id).single();

  if (!sale) {
    return createErrorResponse(404, "Not Found", corsHeaders);
  }

  // Users can only update their own profile unless they are an administrator
  if (!currentUserSale.administrator && currentUserSale.id !== sale.id) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }
```

**Replace With (CORRECT - Zod validation):**
```typescript
async function patchUser(req: Request, currentUserSale: any, corsHeaders: Record<string, string>) {
  // Validate request body with Zod schema
  let validatedData;
  try {
    validatedData = await parseAndValidateBody(req, patchUserSchema);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return createErrorResponse(400, message, corsHeaders);
  }

  const { sales_id, email, first_name, last_name, avatar, administrator, disabled } = validatedData;

  const { data: sale } = await supabaseAdmin.from("sales").select("*").eq("id", sales_id).single();

  if (!sale) {
    return createErrorResponse(404, "Not Found", corsHeaders);
  }

  // Users can only update their own profile unless they are an administrator
  if (!currentUserSale.administrator && currentUserSale.id !== sale.id) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }
```

---

## FINAL: Verification Tasks

### Task 6.1: Run TypeScript Check

**Command:**
```bash
npx tsc --noEmit
```

**Expected Output:**
```
(no errors)
```

**If Errors:** Fix any type errors before proceeding.

---

### Task 6.2: Run Build Verification

**Command:**
```bash
npm run build
```

**Expected Output:**
```
vite v5.x.x building for production...
✓ X modules transformed.
dist/index.html                   X.XX kB │ gzip: X.XX kB
dist/assets/...
✓ built in X.XXs
```

**If Errors:** Fix any build errors before deploying.

---

## Post-Implementation: Set CRON_SECRET

After deploying Edge Functions, set the CRON_SECRET in Supabase Dashboard:

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add secret: `CRON_SECRET` = `<generate-secure-random-string>`
3. Update pg_cron jobs to include Authorization header:

```sql
-- Update daily-digest cron job
SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := '<supabase-project-url>/functions/v1/daily-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <CRON_SECRET_VALUE>',
      'Content-Type', 'application/json'
    ),
    body := '{}'
  )
  $$
);

-- Update check-overdue-tasks cron job
SELECT cron.schedule(
  'check-overdue-tasks',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := '<supabase-project-url>/functions/v1/check-overdue-tasks',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <CRON_SECRET_VALUE>',
      'Content-Type', 'application/json'
    ),
    body := '{}'
  )
  $$
);
```

---

## Execution Summary

| Group | Tasks | Can Parallel | Dependencies |
|-------|-------|--------------|--------------|
| A | 1.1, 1.2, 1.3, 5.1 | Yes | None |
| B | 2.1, 2.2, 3.1, 3.2 | Yes | None |
| C | 4.1 → 4.2 → 4.3 → 4.4 | No | Sequential |
| Final | 6.1 → 6.2 | No | All above |

**Optimal Execution:**
1. Run Groups A + B in parallel (4 agents)
2. Run Group C sequentially (1 agent)
3. Run Final verification (after all complete)

---

## Constitution Compliance Checklist

All tasks verified against:
- [x] **Fail-fast:** No retry logic, circuit breakers, or graceful fallbacks
- [x] **Single source of truth:** Validation at API boundary only
- [x] **Zod patterns:** strictObject, .max() limits, z.coerce for forms
- [x] **TypeScript:** Proper type inference from Zod schemas
- [x] **Security:** Auth checks, request size limits, input validation

---

**Plan Author:** Claude Code
**Review Status:** Ready for execution
