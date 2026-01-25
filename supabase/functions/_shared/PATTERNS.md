# Edge Function Shared Patterns

Standard patterns for Supabase Edge Functions in Crispy CRM.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Edge Functions (Deno)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   daily-digest   │  │ check-overdue-   │  │      users       │  │
│  │                  │  │     tasks        │  │                  │  │
│  │  (Cron Function) │  │  (Cron Function) │  │  (User-Facing)   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │            │
│           └─────────────────────┼─────────────────────┘            │
│                                 │                                  │
│                                 ▼                                  │
│                    ┌────────────────────────┐                      │
│                    │      _shared/          │                      │
│                    ├────────────────────────┤                      │
│                    │ supabaseAdmin.ts       │ ← Admin client       │
│                    │ cors-config.ts         │ ← Dynamic CORS       │
│                    │ utils.ts (deprecated)  │ ← Legacy utilities   │
│                    └────────────────────────┘                      │
│                                 │                                  │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │    Supabase Backend    │
                    │  (PostgreSQL + Auth)   │
                    └────────────────────────┘
```

---

## Pattern A: Admin Client Initialization

For accessing Supabase with service role privileges (bypasses RLS).

```ts
// supabase/functions/_shared/supabaseAdmin.ts
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Lazy initialization to ensure env vars are available at runtime
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    // LOCAL_ prefixed vars allow Docker container to use host.docker.internal
    // (Supabase CLI blocks SUPABASE_* prefixed vars in .env files for security)
    const url = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
    const serviceKey =
      Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
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

**When to use**: Any Edge Function that needs to bypass RLS (admin operations, cron jobs, cross-user queries).

**Key points:**

- Lazy singleton prevents initialization errors when env vars aren't ready
- `LOCAL_` prefix enables Docker/local development (Supabase CLI blocks `SUPABASE_*` in .env)
- Proxy pattern maintains backward compatibility with direct `supabaseAdmin` imports
- Auth disabled (no refresh, no session) - service role is stateless

---

## Pattern B: CORS Configuration

For handling cross-origin requests in user-facing Edge Functions.

> **DEPRECATION WARNING**: `utils.ts` contains wildcard CORS (`Access-Control-Allow-Origin: *`) which is a security risk. **Do not use `corsHeaders` from `utils.ts`**. Always use `createCorsHeaders()` from `cors-config.ts` instead.
>
> **PRE-LAUNCH TRADEOFF**: The wildcard CORS in `utils.ts` remains active as a known tradeoff during pre-launch development. This allows rapid testing across environments without constant origin configuration. **Before production launch**, all functions must migrate to `createCorsHeaders()` and `utils.ts` should be deleted. Track this in the launch checklist.

### Dynamic CORS (Recommended)

```ts
// supabase/functions/_shared/cors-config.ts
const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const PRODUCTION_ORIGINS = ["https://crispy-crm.vercel.app", "https://www.crispy-crm.vercel.app"];

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

### Usage in Edge Functions

```ts
// supabase/functions/users/index.ts
import { createCorsHeaders } from "../_shared/cors-config.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ... function logic ...

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
```

**When to use**: User-facing APIs called from the browser (not cron jobs or internal functions).

**Key points:**

- Echo back the request origin if it's in the allowlist (required for credentialed requests)
- `ALLOWED_ORIGINS` env var extends the allowlist at runtime
- Always handle OPTIONS preflight with 204 No Content
- Include `Access-Control-Allow-Credentials: true` for auth cookies

### Helper Functions

Additional utility functions are available in `cors-config.ts`:

```ts
// supabase/functions/_shared/cors-config.ts

/**
 * Get the full list of allowed origins for debugging/logging purposes.
 * Combines DEVELOPMENT_ORIGINS, PRODUCTION_ORIGINS, and ALLOWED_ORIGINS env var.
 *
 * @returns Array of all allowed origins currently configured
 */
export function getAllowedOrigins(): string[] {
  return getAllAllowedOrigins(); // Merges all configured origins
}

/**
 * Legacy/Deprecated: Direct CORS headers object
 *
 * @deprecated Use createCorsHeaders() instead for dynamic origin validation
 * Maintained for backward compatibility with older Edge Functions
 */
export const corsHeaders = createCorsHeaders();
```

**Exported Functions:**

| Function | Purpose | Use Case |
|----------|---------|----------|
| `createCorsHeaders(requestOrigin?)` | Generate dynamic CORS headers with origin validation | All user-facing Edge Functions |
| `getAllowedOrigins()` | Get list of configured allowed origins | Debugging CORS configuration, logging |
| `corsHeaders` | Static CORS headers object (deprecated) | Legacy functions only - don't use in new code |

**When to use**:

- `getAllowedOrigins()`: Debugging CORS issues, logging which origins are configured
- `createCorsHeaders()`: All user-facing Edge Functions that accept browser requests

**Example: Debugging CORS configuration**:

```ts
import { getAllowedOrigins, createCorsHeaders } from "../_shared/cors-config.ts";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  console.log(`Request origin: ${origin}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);

  const corsHeaders = createCorsHeaders(origin);
  // ...
});
```

---

## Pattern C: Edge Function Types

Three distinct types with different auth and response patterns.

### Type 1: Cron Functions

Scheduled tasks triggered by pg_cron. No CORS, secret-based auth.

**Daily Digest (v3.0)** - Reference implementation for cron functions:

- **Fail-Fast Per User**: Uses `Promise.allSettled` for parallel processing with isolated failures
- **Opt-In Preference**: Respects `digest_opt_in` user preference (skips opted-out users)
- **Empty Skip**: Skips users with no actionable items (tasks due, overdue, stale deals)
- **Per-Stage Stale Thresholds**: Uses PRD Section 6.3 thresholds (7-21 days by stage)
- **Error Isolation**: One user's error doesn't affect others; detailed per-user error reporting

```ts
// supabase/functions/check-overdue-tasks/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SERVICE_ROLE_KEY =
  Deno.env.get("LOCAL_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    // Verify cron/service role auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || (token !== CRON_SECRET && token !== SERVICE_ROLE_KEY)) {
      console.warn("Unauthorized access attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ... cron logic using supabaseAdmin ...

    return new Response(JSON.stringify({ success: true, count: 42 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

**When to use**: Scheduled jobs (daily digest, overdue checks, cleanup tasks).

### Type 2: User-Facing API

Browser-callable endpoints with JWT auth and CORS.

```ts
// supabase/functions/users/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createCorsHeaders } from "../_shared/cors-config.ts";
import { z } from "npm:zod@3.22.4";

// Zod validation at API boundary (engineering constitution)
const userSchema = z.strictObject({
  email: z.string().email().max(254),
  first_name: z.string().min(1).max(100),
  // ...
});

Deno.serve(async (req: Request) => {
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Validate JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create user-context client
  const supabaseClient = createClient(
    Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("LOCAL_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ... validated user logic ...
});
```

**When to use**: Any API endpoint called from the React frontend.

### Type 3: Public Endpoints

No auth required, returns HTML (email links, webhooks).

```ts
// supabase/functions/digest-opt-out/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return htmlResponse("Method Not Allowed", "Invalid Request", "...", false, 405);
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return htmlResponse("Missing Token", "Invalid Link", "...", false, 400);
  }

  // Validate HMAC-signed token via RPC
  const { data, error } = await supabaseAdmin.rpc("process_digest_opt_out", {
    p_token: token,
  });

  // Return styled HTML page (not JSON)
  return htmlResponse("Success", "Unsubscribed", "...", true, 200);
});

function htmlResponse(
  title: string,
  heading: string,
  message: string,
  isSuccess: boolean,
  status: number
): Response {
  return new Response(`<!DOCTYPE html>...`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
```

**When to use**: One-click email links, webhooks, public health checks.

---

## Pattern D: Deno TypeScript

Deno-specific imports and patterns for Edge Functions.

### Import Patterns

```ts
// Runtime type definitions (always first)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// JSR packages (preferred for Deno-native libraries)
import { createClient } from "jsr:@supabase/supabase-js@2";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

// npm packages (for Node.js libraries)
import { z } from "npm:zod@3.22.4";
```

### Environment Variables

```ts
// Always use fallback pattern for local dev compatibility
const supabaseUrl = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
const serviceKey =
  Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
  Deno.env.get("SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Fail-fast if required vars missing
if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing required environment variables");
}
```

### Request Handler

```ts
// Deno.serve is the standard entry point (not export default)
Deno.serve(async (req: Request) => {
  try {
    // Request handling
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Fail-fast: log and return error
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

**Key differences from Node.js:**

- `Deno.serve()` instead of Express/Fastify
- `Deno.env.get()` instead of `process.env`
- JSR (`jsr:`) and npm (`npm:`) URL imports instead of `node_modules`
- No `package.json` - dependencies resolved at runtime

---

## Comparison Table

| Aspect         | Cron Function                  | User-Facing API              | Public Endpoint     |
| -------------- | ------------------------------ | ---------------------------- | ------------------- |
| **Auth**       | CRON_SECRET / SERVICE_ROLE_KEY | JWT (Bearer token)           | Token in URL params |
| **CORS**       | Not needed                     | Required (createCorsHeaders) | Not needed          |
| **Client**     | supabaseAdmin only             | Both admin + user client     | supabaseAdmin only  |
| **Response**   | JSON                           | JSON with CORS headers       | HTML or JSON        |
| **Trigger**    | pg_cron schedule               | Browser fetch                | Email link click    |
| **Validation** | Minimal                        | Zod at boundary              | Token validation    |
| **Example**    | daily-digest (v3.0)            | users                        | digest-opt-out      |

---

## Anti-Patterns

### 1. Wildcard CORS (Security Risk)

```ts
// ❌ WRONG - utils.ts (deprecated)
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allows ANY origin
  "Access-Control-Allow-Headers": "...",
};

// ✅ CORRECT - cors-config.ts
export function createCorsHeaders(requestOrigin?: string | null) {
  // Dynamic validation against allowlist
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  }
  // ...
}
```

**Why it matters**: Wildcard `*` allows any website to call your API, enabling CSRF attacks.

### 2. Hardcoded Service Keys

```ts
// ❌ WRONG
const supabase = createClient(url, "sbp_abc123...");

// ✅ CORRECT
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!serviceKey) throw new Error("Missing service key");
```

### 3. Missing OPTIONS Handler

```ts
// ❌ WRONG - Browser preflight fails
Deno.serve(async (req) => {
  // POST/PATCH handlers only
});

// ✅ CORRECT
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  // ... other handlers
});
```

### 4. Direct Env Access Without Fallbacks

```ts
// ❌ WRONG - Breaks in Docker local dev
const url = Deno.env.get("SUPABASE_URL");

// ✅ CORRECT - LOCAL_ prefix for Docker compatibility
const url = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
```

### 5. Eager Initialization

```ts
// ❌ WRONG - Fails if env vars not ready at import time
export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ✅ CORRECT - Lazy initialization
let _supabaseAdmin: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(/* ... */);
  }
  return _supabaseAdmin;
}
```

---

## Migration Checklist

When adding a new Edge Function:

### 1. Create Function Directory

```bash
mkdir -p supabase/functions/my-function
touch supabase/functions/my-function/index.ts
```

### 2. Add Standard Imports

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
// If user-facing:
import { createCorsHeaders } from "../_shared/cors-config.ts";
// If validation needed:
import { z } from "npm:zod@3.22.4";
```

### 3. Implement Handler

- [ ] Add `Deno.serve(async (req) => { ... })`
- [ ] Choose auth pattern (cron secret, JWT, or token)
- [ ] Add CORS handling if user-facing
- [ ] Add Zod validation at API boundary
- [ ] Return proper Content-Type headers

### 4. Configure Environment

Add to `.env.local` (local dev):

```bash
LOCAL_SUPABASE_URL=http://host.docker.internal:54321
LOCAL_SERVICE_ROLE_KEY=your-local-key
LOCAL_SUPABASE_ANON_KEY=your-local-anon-key
```

### 5. Schedule (If Cron)

Create migration for pg_cron:

```sql
SELECT cron.schedule(
  'my-function-daily',
  '0 7 * * *',  -- 7 AM daily
  $$
  SELECT net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/my-function',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 6. Deploy

```bash
# Local testing
supabase functions serve my-function --env-file .env.local

# Deploy to Supabase
supabase functions deploy my-function
```

### 7. Verify

- [ ] Local: `curl -X POST http://localhost:54321/functions/v1/my-function`
- [ ] Prod: Check Supabase dashboard logs
- [ ] CORS: Test from browser DevTools
