# ADR-004: Supabase as Backend Platform

## Status

**Accepted** - 2025-12-30

## Date

Original: 2024-10 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Crispy CRM requires a backend platform for:
- **Relational data storage**: Contacts, organizations, opportunities, and their many-to-many relationships
- **Authentication**: Email/password login with role-based access (admin, manager, rep)
- **Authorization**: Row-level security ensuring users only see permitted data
- **File storage**: Avatars, document attachments
- **Background jobs**: Daily digest notifications, overdue task detection
- **User management APIs**: Operations requiring service role privileges

### Constraints

1. **Solo developer** - Limited time for infrastructure management
2. **Pre-launch MVP** - Speed of development over enterprise features
3. **Small scale** - 6 users, ~1000 records (not hyperscale)
4. **Relational data model** - CRM entities have complex many-to-many relationships

### Alternatives Considered

| Platform | Pros | Cons |
|----------|------|------|
| **Supabase** (chosen) | PostgreSQL + Auth + Storage + Edge Functions; ra-supabase-core integration; RLS for authorization; generous free tier | Vendor dependency; learning curve for RLS |
| **Firebase** | Real-time sync; mature ecosystem | NoSQL (poor for relational CRM); no RLS equivalent; vendor lock-in |
| **AWS Amplify** | Enterprise-grade; flexible | Complex setup; overkill for 6 users; higher learning curve |
| **Custom Backend** (Node/Express/PostgreSQL) | Full control; no vendor lock-in | Maintenance burden; auth from scratch; deployment complexity |

---

## Decision

Use **Supabase** as the unified backend platform with:

1. **PostgreSQL 17** for relational data with row-level security (RLS)
2. **Supabase Auth** for authentication with JWT tokens
3. **Supabase Storage** for file uploads (avatars)
4. **Edge Functions (Deno)** for business logic requiring service role privileges
5. **ra-supabase-core 3.5.1** for native React Admin integration

### Decision Drivers

1. **PostgreSQL for relational CRM data** - Contacts, organizations, opportunities have many-to-many relationships requiring joins, foreign keys, and referential integrity
2. **RLS at database layer** - Authorization enforced at the database level, not in application code (see [ADR-008](./ADR-008-rls-security.md))
3. **ra-supabase-core integration** - Native React Admin data provider, eliminating custom adapter code
4. **Edge Functions** - TypeScript/Deno for user management, daily digest (see [ADR-015](../tier-2-data-layer/ADR-015-edge-functions.md))
5. **Single platform** - Auth, database, storage, and functions in one dashboard = faster development
6. **Generous free tier** - Sufficient for MVP development and initial launch

---

## Implementation

### Client Initialization (Fail-Fast)

**File:** `src/atomic-crm/providers/supabase/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

// SECURITY: Only log minimal info in development, never log keys
if (import.meta.env.DEV) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const projectId = url?.split(".")[0]?.split("//")[1] || "unknown";
  console.debug("[SUPABASE] Initializing project:", projectId);
  // Never log API keys, even partially
}

// Validate required environment variables (fail fast)
const requiredEnvVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);

if (missing.length > 0) {
  const message = `Missing required environment variables: ${missing.join(", ")}`;
  console.error("[SUPABASE] Configuration error:", message);
  throw new Error(message);
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
```

**Key Points:**
- **Fail-fast validation** - Missing env vars throw immediately, no silent failures
- **Never log keys** - Only project ID logged in development
- **Session persistence** - Tokens survive page refresh
- **Detect session in URL** - Handles magic link and OAuth callbacks

### Auth Provider with Identity Cache

**File:** `src/atomic-crm/providers/supabase/authProvider.ts`

```typescript
import { supabaseAuthProvider } from "ra-supabase-core";
import { supabase } from "./supabase";

const baseAuthProvider = supabaseAuthProvider(supabase, {
  getIdentity: async () => {
    const sale = await getSaleFromCache();
    if (sale == null) throw new Error();

    return {
      id: sale.id,
      fullName: `${sale.first_name} ${sale.last_name}`,
      avatar: sale.avatar_url,
      role: sale.role || "rep",
    };
  },
});

// 15-minute identity cache for performance
let cachedSale: CachedSale | undefined;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

const getSaleFromCache = async () => {
  const now = Date.now();
  const isCacheExpired = now - cacheTimestamp > CACHE_TTL_MS;

  if (cachedSale != null && !isCacheExpired) return cachedSale;

  const { data: dataSession } = await supabase.auth.getSession();
  if (dataSession?.session?.user == null) return undefined;

  const { data: dataSale } = await supabase
    .from("sales")
    .select("id, first_name, last_name, avatar_url, is_admin, role")
    .match({ user_id: dataSession.session.user.id })
    .maybeSingle();

  cachedSale = dataSale;
  cacheTimestamp = Date.now();
  return dataSale;
};

export const authProvider = {
  ...baseAuthProvider,

  // Stale JWT detection (user deleted but token still valid)
  checkAuth: async (params) => {
    const { data: { session }, error } = await supabase.auth.getSession();

    // Auto-logout on auth errors (self-healing UX)
    if (error?.message?.includes('does not exist') ||
        error?.message?.includes('JWT')) {
      await supabase.auth.signOut();
      cachedSale = undefined;
      throw new Error('Session expired. Please log in again.');
    }

    if (!session || error) {
      if (isPublicPath(window.location.pathname)) return;
      throw new Error("Not authenticated");
    }

    return baseAuthProvider.checkAuth(params);
  },

  // Clear cache on login/logout
  login: async (params) => {
    const result = await baseAuthProvider.login(params);
    cachedSale = undefined;
    cacheTimestamp = 0;
    return result;
  },

  logout: async (params) => {
    const result = await baseAuthProvider.logout(params);
    cachedSale = undefined;
    cacheTimestamp = 0;
    return result;
  },
};
```

**Key Points:**
- **15-minute identity cache** - Reduces database queries for `getIdentity()` calls
- **Stale JWT detection** - Auto-logout when user deleted but token still valid (e.g., after DB reset)
- **Role-based access control** - `role` field determines admin/manager/rep permissions
- **Cache invalidation** - Cleared on login/logout for fresh data

### Two-Client Pattern in Edge Functions

Edge Functions use two Supabase clients for different authorization contexts:

**File:** `supabase/functions/users/index.ts`

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");

  // 1. User context client (respects RLS)
  // Use for: Reading data the user is authorized to see
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  // Verify the JWT and get user info
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data?.user) {
    return createErrorResponse(401, "Invalid token", corsHeaders);
  }

  // 2. Service role client (bypasses RLS)
  // Use for: Admin operations like creating users, updating roles
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    user_metadata: { first_name, last_name },
  });
});
```

**When to use each client:**

| Client | RLS | Use Cases |
|--------|-----|-----------|
| `supabaseClient` (user JWT) | Enforced | Reading/writing data user owns |
| `supabaseAdmin` (service role) | Bypassed | Creating users, system-wide queries, background jobs |

### Lazy Singleton Admin Client

**File:** `supabase/functions/_shared/supabaseAdmin.ts`

```typescript
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Lazy initialization - env vars not available at module load time in Deno
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    // LOCAL_ prefix for Docker compatibility (Supabase CLI blocks SUPABASE_* vars)
    const url = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
                       Deno.env.get("SERVICE_ROLE_KEY") ||
                       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceKey) {
      throw new Error("Missing required environment variables for Supabase admin client");
    }

    _supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// Proxy pattern for backward compatibility with existing imports
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});
```

**Why lazy initialization:**
- Deno Edge Functions load modules before environment variables are injected
- Eager initialization (`createClient()` at module scope) fails with `undefined` values
- Proxy pattern preserves existing `supabaseAdmin.from()` import syntax

### React Admin Data Provider Integration

**File:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

```typescript
import { supabaseDataProvider } from "ra-supabase-core";
import type { PostgRestSortOrder } from "@raphiniert/ra-data-postgrest";

const getBaseDataProvider = () => {
  return supabaseDataProvider({
    instanceUrl: import.meta.env.VITE_SUPABASE_URL,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseClient: supabase,
    sortOrder: "asc,desc.nullslast" as PostgRestSortOrder,
  });
};

const baseDataProvider = getBaseDataProvider();

export const unifiedDataProvider: DataProvider = {
  async getList(resource, params) {
    // Validation, soft delete filtering, search params applied here
    const result = await baseDataProvider.getList(dbResource, searchParams);
    return { ...result, data: normalizeResponseData(resource, result.data) };
  },

  async create(resource, params) {
    // Zod validation at API boundary
    const processedData = await processForDatabase(resource, params.data, "create");
    return baseDataProvider.create(dbResource, { ...params, data: processedData });
  },

  // ... all CRUD methods wrap baseDataProvider with validation/transformation
};
```

**Key Points:**
- **Single entry point** - All database access flows through `unifiedDataProvider` (see [ADR-001](./ADR-001-unified-data-provider.md))
- **Zod validation** - Applied at API boundary before database operations
- **Soft delete handling** - Automatic `deleted_at` filtering
- **JSONB normalization** - Arrays parsed from JSONB on read

### Edge Functions Implemented

| Function | Purpose | Auth Pattern |
|----------|---------|--------------|
| `users/index.ts` | User invitation, CRUD | JWT + Admin role check |
| `daily-digest/index.ts` | Background job for task notifications | CRON_SECRET |
| `updatePassword/index.ts` | Password reset flow | JWT |
| `check-overdue-tasks/index.ts` | Background job for overdue detection | CRON_SECRET |

---

## Consequences

### Positive

1. **Single platform** - Auth, database, storage, and functions in one dashboard
2. **PostgreSQL power** - Joins, foreign keys, RLS, full-text search, JSONB
3. **RLS at database layer** - Authorization cannot be bypassed by application bugs
4. **Native React Admin integration** - `ra-supabase-core` eliminates custom adapter code
5. **TypeScript everywhere** - Frontend and Edge Functions share language
6. **Generous free tier** - 500MB database, 1GB storage, 2M Edge Function invocations/month
7. **Supabase Dashboard** - SQL editor, table viewer, logs, and metrics

### Negative

1. **Vendor dependency** - Migration to another platform requires significant effort
2. **RLS learning curve** - Policies can be complex for many-to-many relationships
3. **Edge Function cold starts** - ~200ms latency on first request after idle
4. **Limited database extensions** - Some PostgreSQL extensions not available
5. **No local SMTP** - Email invitations only work in production

### Neutral

1. **PostgREST layer** - All queries go through REST API, not direct SQL
2. **Row-level security complexity** - More upfront work, but eliminates authorization bugs
3. **Deno runtime** - Different from Node.js but well-documented

---

## Anti-Patterns

### 1. Direct Supabase Imports in Components

```typescript
// WRONG - Bypasses validation and centralized error handling
import { supabase } from "@/providers/supabase/supabase";

function ContactList() {
  const handleDelete = async (id) => {
    await supabase.from("contacts").delete().eq("id", id);  // NO soft delete!
  };
}

// CORRECT - Use data provider through React Admin hooks
import { useDataProvider } from "react-admin";

function ContactList() {
  const dataProvider = useDataProvider();
  const handleDelete = async (id) => {
    await dataProvider.delete("contacts", { id });  // Soft delete applied
  };
}
```

### 2. Hardcoded Service Role Key

```typescript
// WRONG - Security vulnerability
const supabase = createClient(url, "sbp_abc123...");

// CORRECT - Environment variable
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!serviceKey) throw new Error("Missing service key");
```

### 3. Eager Initialization in Edge Functions

```typescript
// WRONG - Fails if env vars not ready at import time
export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// CORRECT - Lazy initialization with getter function
let _supabaseAdmin: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(/* ... */);
  }
  return _supabaseAdmin;
}
```

### 4. Using Service Role Client for User Data

```typescript
// WRONG - Bypasses RLS, sees all data
const { data } = await supabaseAdmin.from("contacts").select("*");

// CORRECT - Use user context client for RLS enforcement
const supabaseClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data } = await supabaseClient.from("contacts").select("*");
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/atomic-crm/providers/supabase/supabase.ts` | Browser client initialization with fail-fast validation |
| `src/atomic-crm/providers/supabase/authProvider.ts` | Auth provider with identity cache, stale JWT detection |
| `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | Single entry point for all database operations |
| `supabase/functions/_shared/supabaseAdmin.ts` | Lazy singleton admin client for Edge Functions |
| `supabase/functions/_shared/cors-config.ts` | Dynamic CORS configuration |
| `supabase/functions/users/index.ts` | User management Edge Function |
| `supabase/functions/daily-digest/index.ts` | Background job for notifications |
| `supabase/migrations/` | Database schema and RLS policies |

---

## Related ADRs

- **[ADR-001: Unified Data Provider](./ADR-001-unified-data-provider.md)** - Single entry point pattern that wraps Supabase
- **[ADR-008: RLS at Database Layer](./ADR-008-rls-security.md)** - Row-level security implementation details
- **[ADR-015: Edge Functions for Background Jobs](../tier-2-data-layer/ADR-015-edge-functions.md)** - Edge Function patterns and anti-patterns
- **[ADR-016: RPC Functions for Atomic Operations](../tier-2-data-layer/ADR-016-rpc-functions.md)** - Database functions for complex transactions

---

## References

- Supabase Documentation: https://supabase.com/docs
- ra-supabase-core: https://github.com/marmelab/ra-supabase
- PostgREST: https://postgrest.org/
- Engineering Constitution: `CLAUDE.md`

---

*This ADR follows the [Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) with extensions for code examples and anti-patterns.*
