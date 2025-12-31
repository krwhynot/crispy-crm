# ADR-015: Edge Functions for Background Jobs

**Status:** Accepted
**Date:** 2024-12
**Last Updated:** 2025-12-30

---

## Context

Crispy CRM requires background job processing for:
- **Daily digest notifications** - Aggregate tasks, overdue items, and stale deals per user
- **Overdue task detection** - Create notifications when tasks pass their due date
- **Dashboard snapshots** - Capture metrics for historical trending (planned)
- **User management APIs** - CRUD operations requiring service role privileges

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **pg_cron triggers** | Native PostgreSQL, no external calls | PL/pgSQL only, hard to test, no TypeScript, limited observability |
| **External cron (Vercel/Railway)** | Familiar, easy debugging | Additional infrastructure, cold starts, CORS complexity, network latency |
| **pg_notify + worker** | Real-time, event-driven | Requires persistent connection, deployment complexity, not serverless |
| **Supabase Edge Functions** | TypeScript/Deno, auto-scaling, built-in observability, process isolation | Cold starts (~200ms), Deno learning curve, debugging requires logs |

### Decision Drivers

1. **TypeScript everywhere** - Same language as frontend, shared types possible
2. **Testability** - Functions can be unit tested, mocked, and integration tested
3. **Process isolation** - Each invocation is isolated, no shared state bugs
4. **No infrastructure management** - Serverless, auto-scaling, built-in logging
5. **Supabase ecosystem** - Native auth integration, direct database access
6. **Fail-fast alignment** - Errors surface immediately via logs, no silent retries

---

## Decision

Use **Supabase Edge Functions (Deno runtime)** with three distinct invocation patterns:

### Pattern 1: Cron Functions

Scheduled via pg_cron, authenticated with `CRON_SECRET` or service role key.

**Examples:** `daily-digest`, `check-overdue-tasks`, `capture-dashboard-snapshots`

### Pattern 2: User-Facing APIs

Browser-callable endpoints with JWT authentication and dynamic CORS.

**Examples:** `users` (invite, patch operations)

### Pattern 3: Public Endpoints

No authentication required, returns HTML or handles webhooks.

**Examples:** `digest-opt-out` (email unsubscribe link)

---

## Implementation

### Architecture

```
+---------------------------------------------------------------------+
|                      Edge Functions (Deno)                          |
+---------------------------------------------------------------------+
|                                                                     |
|  +------------------+  +------------------+  +------------------+   |
|  |   daily-digest   |  | check-overdue-   |  |      users       |   |
|  |                  |  |     tasks        |  |                  |   |
|  |  (Cron Function) |  |  (Cron Function) |  |  (User-Facing)   |   |
|  +--------+---------+  +--------+---------+  +--------+---------+   |
|           |                     |                     |             |
|           +---------------------+---------------------+             |
|                                 |                                   |
|                                 v                                   |
|                    +------------------------+                       |
|                    |      _shared/          |                       |
|                    +------------------------+                       |
|                    | supabaseAdmin.ts       | <- Admin client       |
|                    | cors-config.ts         | <- Dynamic CORS       |
|                    +------------------------+                       |
|                                 |                                   |
+---------------------------------------------------------------------+
                                  |
                                  v
                    +------------------------+
                    |    Supabase Backend    |
                    |  (PostgreSQL + Auth)   |
                    +------------------------+
```

### Lazy Singleton Admin Client

Environment variables are not available at module load time in Deno Edge Functions. This requires lazy initialization with a Proxy for backward compatibility.

**File:** `supabase/functions/_shared/supabaseAdmin.ts`

```typescript
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Lazy initialization to ensure env vars are available at runtime
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    // LOCAL_ prefixed vars allow Docker container to use host.docker.internal
    // (Supabase CLI blocks SUPABASE_* prefixed vars in .env files for security)
    const url = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
                       Deno.env.get("SERVICE_ROLE_KEY") ||
                       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceKey) {
      throw new Error("Missing required environment variables for Supabase admin client");
    }

    _supabaseAdmin = createClient(url, serviceKey, {
      global: {
        headers: { Authorization: `Bearer ${serviceKey}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// Legacy export for backward compatibility - now uses lazy init
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});
```

**Why Lazy Singleton:**
- Deno Edge Functions load modules before environment variables are injected
- Eager initialization (`const client = createClient(...)` at module scope) fails
- Proxy pattern allows existing `supabaseAdmin.from()` calls to work without refactoring

**Why LOCAL_ Prefix:**
- Supabase CLI blocks `SUPABASE_*` prefixed variables in `.env` files for security
- Docker containers need `host.docker.internal` URLs, not `localhost`
- Fallback chain ensures both local and production environments work

### Dynamic CORS Configuration

**File:** `supabase/functions/_shared/cors-config.ts`

```typescript
const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const PRODUCTION_ORIGINS = [
  "https://crispy-crm.vercel.app",
  "https://www.crispy-crm.vercel.app",
];

function getAllAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  const origins = [...DEVELOPMENT_ORIGINS, ...PRODUCTION_ORIGINS];

  if (envOrigins) {
    const additionalOrigins = envOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
    origins.push(...additionalOrigins);
  }
  return origins;
}

export function createCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = getAllAllowedOrigins();

  let allowOrigin: string;
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  } else if (allowedOrigins.length > 0) {
    allowOrigin = allowedOrigins[0];
  } else {
    allowOrigin = "http://localhost:5173";
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}
```

**Why Dynamic CORS:**
- Wildcard `*` is a security risk (allows any origin to call API with credentials)
- Must echo back the request origin for credentialed requests (`withCredentials: true`)
- `ALLOWED_ORIGINS` env var extends allowlist at runtime for staging/preview environments

### Cron Function Pattern

**File:** `supabase/functions/check-overdue-tasks/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

// Authentication secrets
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SERVICE_ROLE_KEY = Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
                         Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    // Verify request is from authorized source (cron or service role)
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || (token !== CRON_SECRET && token !== SERVICE_ROLE_KEY)) {
      console.warn("Unauthorized access attempt to check-overdue-tasks");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Cron functions require authentication" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // ... business logic using supabaseAdmin ...

    return new Response(
      JSON.stringify({ success: true, count: 42 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Fail-fast: Log and surface error immediately
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**Key Points:**
- No CORS headers (not browser-callable)
- Dual auth: `CRON_SECRET` for pg_cron, `SERVICE_ROLE_KEY` for manual testing
- Uses `supabaseAdmin` only (bypasses RLS)
- Fail-fast error handling (no retries, no fallbacks)

### User-Facing API Pattern

**File:** `supabase/functions/users/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createCorsHeaders } from "../_shared/cors-config.ts";
import { z } from "npm:zod@3.22.4";

// Zod validation at API boundary (engineering constitution)
const userSchema = z.strictObject({
  email: z.string().email().max(254),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: z.enum(["admin", "manager", "rep"]).optional(),
});

Deno.serve(async (req: Request) => {
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Validate JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create user-context client (respects RLS)
  const supabaseClient = createClient(
    Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("LOCAL_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data?.user) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ... validated user logic using both supabaseClient (RLS) and supabaseAdmin ...
});
```

**Key Points:**
- CORS headers on ALL responses (including errors)
- OPTIONS preflight handler returns 204 No Content
- Two Supabase clients: `supabaseClient` (user context, RLS) and `supabaseAdmin` (service role, bypasses RLS)
- Zod validation with `z.strictObject()` at API boundary (mass assignment prevention)

### pg_cron Scheduling

Edge Functions are triggered via pg_cron calling `net.http_post()`:

```sql
-- supabase/migrations/XXXXXXXX_schedule_daily_digest.sql
SELECT cron.schedule(
  'daily-digest-7am',
  '0 7 * * *',  -- 7 AM UTC daily
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/daily-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## Consequences

### Positive

1. **TypeScript/Deno everywhere** - Same language as frontend, better developer experience
2. **Process isolation** - Each function invocation is isolated; no shared state bugs
3. **Auto-scaling** - Supabase handles scaling; no capacity planning required
4. **Built-in observability** - Logs, metrics, and traces in Supabase dashboard
5. **No external infrastructure** - No Vercel cron, no separate worker process
6. **Native Supabase integration** - Direct database access, auth token validation
7. **Fail-fast alignment** - Errors surface immediately in logs

### Negative

1. **Cold starts (~200ms)** - First request after idle period is slower
2. **Debugging complexity** - No local breakpoints; requires log analysis
3. **Deno learning curve** - JSR imports, `Deno.serve()`, `Deno.env.get()` differ from Node.js
4. **Limited execution time** - 150-second timeout (sufficient for our use cases)
5. **No persistent connections** - WebSockets require workarounds

### Neutral

1. **Version pinning** - JSR packages (`jsr:@supabase/supabase-js@2`) require explicit versions
2. **No `package.json`** - Dependencies resolved at runtime via URL imports
3. **pg_cron coupling** - Scheduling lives in database migrations, not function code

---

## Anti-Patterns

### 1. Wildcard CORS (Security Risk)

```typescript
// WRONG - utils.ts (deprecated)
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Allows ANY origin
  "Access-Control-Allow-Headers": "...",
};

// CORRECT - cors-config.ts
export function createCorsHeaders(requestOrigin?: string | null) {
  // Dynamic validation against allowlist
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  }
  // ...
}
```

**Why it matters:** Wildcard `*` allows any website to call your API with credentials, enabling CSRF attacks.

### 2. Eager Initialization (Module Load Failure)

```typescript
// WRONG - Fails if env vars not ready at import time
export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// CORRECT - Lazy initialization
let _supabaseAdmin: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(/* ... */);
  }
  return _supabaseAdmin;
}
```

**Why it matters:** Deno loads modules before injecting environment variables. Eager initialization causes `undefined` values.

### 3. Missing OPTIONS Preflight Handler

```typescript
// WRONG - Browser preflight fails with 405
Deno.serve(async (req) => {
  // Only POST/PATCH handlers
});

// CORRECT
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  // ... other handlers
});
```

**Why it matters:** Browsers send OPTIONS preflight for cross-origin requests with custom headers. Missing handler blocks all browser calls.

### 4. Direct Env Access Without LOCAL_ Fallback

```typescript
// WRONG - Breaks in Docker local dev
const url = Deno.env.get("SUPABASE_URL");

// CORRECT - LOCAL_ prefix for Docker compatibility
const url = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
```

**Why it matters:** Supabase CLI blocks `SUPABASE_*` prefixed vars in `.env` files. Docker containers need different URLs (`host.docker.internal`).

### 5. Hardcoded Service Keys

```typescript
// WRONG - Security vulnerability
const supabase = createClient(url, "sbp_abc123...");

// CORRECT - Environment variable
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!serviceKey) throw new Error("Missing service key");
```

**Why it matters:** Hardcoded keys in source code are exposed in version control and logs.

### 6. Retry Logic in Background Jobs

```typescript
// WRONG - Violates fail-fast principle
async function processUser(userId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await doWork(userId);
    } catch (e) {
      await sleep(1000 * attempt);
    }
  }
}

// CORRECT - Fail fast, surface errors
async function processUser(userId: string) {
  try {
    return await doWork(userId);
  } catch (error) {
    console.error(`User ${userId} failed:`, error);
    throw error; // Let it surface
  }
}
```

**Why it matters:** Pre-launch philosophy is fail-fast. Retries mask underlying issues and delay error detection.

---

## Comparison Table

| Aspect | Cron Function | User-Facing API | Public Endpoint |
|--------|---------------|-----------------|-----------------|
| **Auth** | CRON_SECRET / SERVICE_ROLE_KEY | JWT (Bearer token) | Token in URL params |
| **CORS** | Not needed | Required (createCorsHeaders) | Not needed |
| **Client** | supabaseAdmin only | Both admin + user client | supabaseAdmin only |
| **Response** | JSON | JSON with CORS headers | HTML or JSON |
| **Trigger** | pg_cron schedule | Browser fetch | Email link click |
| **Validation** | Minimal | Zod at boundary | Token validation |
| **Example** | daily-digest | users | digest-opt-out |

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/PATTERNS.md` | Architecture patterns documentation |
| `supabase/functions/_shared/supabaseAdmin.ts` | Lazy-init service role client |
| `supabase/functions/_shared/cors-config.ts` | Dynamic origin validation |
| `supabase/functions/daily-digest/index.ts` | Cron function example (v3.0) |
| `supabase/functions/check-overdue-tasks/index.ts` | Simple cron function example |
| `supabase/functions/users/index.ts` | User API with JWT + Zod |

---

## Related ADRs

- **ADR-007: Soft Deletes** - Daily digest queries filter `deleted_at IS NULL`
- **ADR-004: Unified Data Provider** - Frontend uses data provider, not Edge Functions directly

---

## Changelog

| Date | Change |
|------|--------|
| 2024-12 | Initial decision: Edge Functions for background jobs |
| 2025-01 | Added daily-digest v3.0 with fail-fast per user |
| 2025-12-30 | Documented patterns, anti-patterns, and code examples |

---

*This ADR follows the [Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) with extensions for code examples and anti-patterns.*
