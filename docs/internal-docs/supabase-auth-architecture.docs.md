# Supabase Authentication Architecture Research

Complete analysis of authentication flow, configuration, and integration in the Crispy CRM codebase.

## Overview

This CRM uses a **Docker-based local Supabase** for development with email/password authentication via `@supabase/supabase-js` v2.39.0 and React Admin integration through `ra-supabase-core` v3.5.1. Authentication is managed through a custom authProvider that extends the base Supabase auth with role-based access control (RBAC) via the `sales` table. The system uses simple RLS policies (`auth.role() = 'authenticated'`) across all tables with no complex per-user policies.

## Relevant Files

### Core Authentication Files
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/supabase.ts` - Supabase client initialization (lines 3-6)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/authProvider.ts` - Custom auth provider with role-based access
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/index.ts` - Provider exports

### UI Components
- `/home/krwhynot/projects/crispy-crm/src/components/admin/login-page.tsx` - Login UI component
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/login/StartPage.tsx` - Entry point wrapper for login
- `/home/krwhynot/projects/crispy-crm/src/components/admin/authentication.tsx` - Auth callback and error handling

### Application Setup
- `/home/krwhynot/projects/crispy-crm/src/App.tsx` - Application entry point
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/root/CRM.tsx` - Main CRM component with Admin wrapper (lines 120-131)
- `/home/krwhynot/projects/crispy-crm/src/main.tsx` - React root mounting

### Configuration Files
- `/home/krwhynot/projects/crispy-crm/.env.local` - Local development environment (Docker Supabase)
- `/home/krwhynot/projects/crispy-crm/.env.example` - Environment template
- `/home/krwhynot/projects/crispy-crm/.env.production.example` - Production reference (remote Supabase)
- `/home/krwhynot/projects/crispy-crm/supabase/config.toml` - Local Supabase configuration
- `/home/krwhynot/projects/crispy-crm/vite.config.ts` - Build-time environment variable injection (lines 93-97)

### Database & Security
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251012000000_initial_schema.sql` - Consolidated schema with RLS policies (lines 670-720)
- `/home/krwhynot/projects/crispy-crm/supabase/functions/_shared/cors-config.ts` - CORS configuration for Edge Functions

### Testing
- `/home/krwhynot/projects/crispy-crm/src/tests/integration/auth-flow.test.ts` - Comprehensive auth integration tests
- `/home/krwhynot/projects/crispy-crm/src/debug-auth.ts` - Browser console debug helper

## Architectural Patterns

### 1. Environment-Based Configuration
**Pattern**: Docker-local vs Remote Supabase via environment files
- **Local Development** (`.env.local`):
  ```bash
  VITE_SUPABASE_URL=http://localhost:54321
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (local demo key)
  ```
- **Production** (`.env.production.example`):
  ```bash
  VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (production key)
  ```
- **Build-Time Injection**: Vite replaces `import.meta.env.*` at build time (vite.config.ts lines 93-97)
- **NO runtime environment switching** - environment is baked into the build

### 2. Supabase Client Initialization
**Location**: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/supabase.ts`
```typescript
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```
- **Single global instance** - imported and reused across the application
- **No client-side configuration** - relies entirely on environment variables
- **No auth persistence config** - uses Supabase defaults (localStorage)

### 3. Custom Auth Provider Pattern
**Location**: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/authProvider.ts`

**Base Provider Wrapping**:
```typescript
const baseAuthProvider = supabaseAuthProvider(supabase, {
  getIdentity: async () => {
    const sale = await getSaleFromCache();
    // Returns { id, fullName, avatar }
  },
});
```

**Custom Extensions**:
- **Login override** (line 28): Clears cached sale on login
- **checkAuth override** (line 34): Allows `/set-password` and `/forgot-password` routes
- **canAccess implementation** (line 52): Role-based access via `sales.is_admin` field
- **Caching pattern** (line 63): `cachedSale` singleton prevents repeated DB queries

**Data Flow**:
1. User logs in → Supabase auth creates session
2. `getIdentity()` called → Queries `sales` table by `user_id`
3. Returns `{ id, fullName, avatar }` from sales record
4. `canAccess()` checks `is_admin` flag for permissions

### 4. React Admin Integration
**Location**: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/root/CRM.tsx`
```typescript
<Admin
  dataProvider={dataProvider}
  authProvider={authProvider}
  store={localStorageStore(undefined, "CRM")}
  layout={Layout}
  loginPage={StartPage}
  i18nProvider={i18nProvider}
  dashboard={Dashboard}
  requireAuth  // Enforces authentication on all routes
  disableTelemetry
>
```
- **requireAuth prop** - Enforces authentication globally
- **Custom loginPage** - Uses `StartPage` wrapper → `LoginPage` component
- **State persistence** - Uses localStorage with "CRM" prefix

### 5. Row-Level Security (RLS) Pattern
**Location**: `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251012000000_initial_schema.sql` (lines 670-720)

**Simple Authenticated Access**:
```sql
CREATE POLICY "Authenticated users can access all data" ON <table>
    FOR ALL USING (auth.role() = 'authenticated');
```

**Applied to all tables**:
- opportunities, contacts, organizations, products, sales
- tasks, contactNotes, opportunityNotes, tags, segments
- activities, interaction_participants, contact_organizations

**NO per-user policies** - all authenticated users have full CRUD access
**Role-based restrictions** handled in application layer via `canAccess()`

### 6. CORS Configuration Pattern
**Location**: `/home/krwhynot/projects/crispy-crm/supabase/functions/_shared/cors-config.ts`

**Dynamic Origin Validation**:
```typescript
const DEFAULT_DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
```

**Environment-Based**:
- Reads `ALLOWED_ORIGINS` environment variable
- Falls back to development origins in local mode
- **NO wildcard `*`** - explicit origin allowlist for security

### 7. Auth State Management Pattern
**Caching Strategy** (authProvider.ts lines 63-88):
```typescript
let cachedSale: any;
const getSaleFromCache = async () => {
  if (cachedSale != null) return cachedSale;

  // Query Supabase session
  const { data: dataSession } = await supabase.auth.getSession();

  // Query sales table
  const { data: dataSale } = await supabase
    .from("sales")
    .select("id, first_name, last_name, avatar_url, is_admin")
    .match({ user_id: dataSession?.session?.user.id })
    .maybeSingle();

  cachedSale = dataSale;
  return dataSale;
};
```

**Cache Invalidation**:
- Cleared on login (line 31)
- **NO automatic refresh** - persists for session duration
- **Potential stale data issue** if user role changes

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER VISITS APPLICATION                                       │
│    - Browser loads React app                                     │
│    - Vite injects VITE_SUPABASE_URL/ANON_KEY from .env.local    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SUPABASE CLIENT INITIALIZATION                                │
│    File: src/atomic-crm/providers/supabase/supabase.ts          │
│    - createClient(URL, ANON_KEY)                                 │
│    - Single global instance created                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. REACT ADMIN SETUP                                             │
│    File: src/atomic-crm/root/CRM.tsx                            │
│    - <Admin authProvider={authProvider} requireAuth>            │
│    - Checks if user is authenticated                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    NOT AUTHENTICATED
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. LOGIN PAGE DISPLAYED                                          │
│    Files:                                                        │
│    - src/atomic-crm/login/StartPage.tsx (wrapper)               │
│    - src/components/admin/login-page.tsx (UI)                   │
│    - User enters email/password                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. AUTHENTICATION REQUEST                                        │
│    File: src/atomic-crm/providers/supabase/authProvider.ts      │
│    - login() calls baseAuthProvider.login()                      │
│    - supabase.auth.signInWithPassword({ email, password })      │
│    - Sends to: http://localhost:54321/auth/v1/token            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SUPABASE AUTH SERVICE (Docker Local)                          │
│    - Validates credentials against auth.users table              │
│    - Returns JWT tokens (access_token, refresh_token)           │
│    - Stores session in localStorage (default)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    SUCCESS
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. IDENTITY RESOLUTION                                           │
│    File: src/atomic-crm/providers/supabase/authProvider.ts      │
│    - getIdentity() called                                        │
│    - getSaleFromCache() queries sales table:                     │
│      SELECT id, first_name, last_name, avatar_url, is_admin     │
│      FROM sales WHERE user_id = <session.user.id>               │
│    - Returns { id, fullName, avatar }                            │
│    - Caches result in cachedSale variable                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. ROLE-BASED ACCESS CONTROL                                     │
│    File: src/atomic-crm/providers/supabase/authProvider.ts      │
│    - canAccess() checks sales.is_admin flag                      │
│    - Computes role: 'admin' or 'user'                            │
│    - File: src/atomic-crm/providers/commons/canAccess.ts        │
│    - Validates permissions for requested action                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    AUTHORIZED
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. APPLICATION ACCESS GRANTED                                    │
│    - Dashboard displayed                                         │
│    - Resources loaded based on permissions                       │
│    - All API calls include Authorization: Bearer <token>        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. DATABASE ACCESS (RLS Enforced)                              │
│     - Every query checked against RLS policies                   │
│     - Policy: auth.role() = 'authenticated'                      │
│     - All authenticated users have full CRUD access              │
└──────────────────────────────────────────────────────────────────┘
```

## Local vs Cloud Configuration Differences

### Local Development (Docker Supabase)
**Environment**: `.env.local`
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

**Services**:
- API: http://127.0.0.1:54321
- Studio: http://localhost:54323
- Database: localhost:54322
- Email (Inbucket): http://localhost:54324

**Auth Configuration** (supabase/config.toml lines 68-92):
```toml
[auth]
site_url = "http://localhost:5173/"
additional_redirect_urls = ["https://localhost:5173/auth-callback.html"]
jwt_expiry = 3600
enable_signup = true
enable_confirmations = false  # No email confirmation required
```

**CORS**: Allows localhost:5173 by default (cors-config.ts lines 10-15)

### Production (Remote Supabase)
**Environment**: `.env.production.example`
```bash
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcW5hbmRkY3F2Zml3aHNobmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODIxODUsImV4cCI6MjA3NDE1ODE4NX0.wJi2sGLrvrI5OQUujTByVWjdyCT7Prjlpsx9LC_CUzU
```

**Services**: All hosted by Supabase Cloud
**Auth Configuration**: Managed via Supabase Dashboard
**CORS**: Must be explicitly configured via `ALLOWED_ORIGINS` environment variable

### Key Differences
| Aspect | Local Development | Production |
|--------|------------------|------------|
| **URL** | http://localhost:54321 | https://aaqnanddcqvfiwhshndl.supabase.co |
| **ANON_KEY** | Demo key (predictable) | Project-specific key |
| **Email Confirmation** | Disabled | Typically enabled |
| **Database Access** | Direct via localhost:54322 | Via Supabase proxy only |
| **Migrations** | Applied via `supabase db reset` | Applied via `supabase db push` |
| **Data Persistence** | Docker volumes (ephemeral) | Persistent cloud storage |
| **CORS Configuration** | Hardcoded defaults | Environment-based allowlist |

## Edge Cases & Gotchas

### 1. Cache Invalidation Issue
**Location**: authProvider.ts lines 63-88
- **Problem**: `cachedSale` is never invalidated except on login
- **Impact**: If a user's `is_admin` status changes, they must log out/in to see new permissions
- **Workaround**: Clear cache manually or implement TTL-based invalidation

### 2. Environment Variable Build-Time Baking
**Location**: vite.config.ts lines 88-99
- **Problem**: `VITE_SUPABASE_URL` is replaced at build time, not runtime
- **Impact**: A single build can only target ONE environment (local OR production)
- **Solution**: Must rebuild for different environments
- **Production deployment**: Must set env vars in CI/CD before build

### 3. RLS Policies Are Overly Permissive
**Location**: supabase/migrations/20251012000000_initial_schema.sql line 716
```sql
FOR ALL USING (auth.role() = 'authenticated')
```
- **Problem**: Any authenticated user can read/modify ANY data
- **Security Risk**: No data isolation between users/tenants
- **Current State**: Application-layer authorization via `canAccess()` is the only protection
- **Recommendation**: Consider adding user-specific RLS policies for sensitive data

### 4. CORS Configuration Requires Manual Setup
**Location**: supabase/functions/_shared/cors-config.ts
- **Problem**: Edge Functions require explicit `ALLOWED_ORIGINS` environment variable
- **Impact**: Forgotten configuration causes CORS errors in production
- **Workaround**: Default to localhost in development, but production MUST set this

### 5. Special Route Handling in checkAuth
**Location**: authProvider.ts lines 34-48
```typescript
if (window.location.pathname === "/set-password" ||
    window.location.hash.includes("#/set-password")) {
  return; // Allow access without authentication
}
```
- **Problem**: Hardcoded route strings, fragile to URL changes
- **Better Approach**: Use a route allowlist constant

### 6. No Automatic Token Refresh
**Observation**: Uses Supabase default behavior (localStorage + auto-refresh)
- **Default**: Supabase SDK refreshes tokens automatically before expiry
- **Config**: `jwt_expiry = 3600` (1 hour) in config.toml
- **Risk**: If auto-refresh fails (network issues), user is logged out
- **No custom handling**: Application relies on Supabase SDK behavior

### 7. Service Client Not Used in Frontend
**Location**: src/atomic-crm/providers/supabase/supabase.ts
- **Problem**: Only exports anon-key client, no service role client
- **Impact**: Cannot perform admin operations from frontend (by design)
- **Correct Pattern**: Admin operations should be in Edge Functions with service role key

### 8. Auth Testing Uses .env.development Instead of .env.local
**Location**: src/tests/integration/auth-flow.test.ts line 24
```typescript
dotenv.config({ path: ".env.development" });
```
- **Problem**: Tests may connect to remote Supabase instead of local
- **Expected**: Should use `.env.local` for local testing
- **Impact**: Tests could pollute production data if misconfigured

## Potential Issues and Misconfigurations

### Environment Variable Mismatch
**Symptom**: "Connection refused" or "Invalid API key"
**Diagnosis**:
```bash
# Check current environment
cat .env.local | grep VITE_SUPABASE_URL
# Should show: http://localhost:54321

# Verify Supabase is running
npm run supabase:local:status
```
**Fix**: Ensure `.env.local` is used and Supabase containers are running

### RLS Policy Blocking Access
**Symptom**: "403 Forbidden" or "new row violates row-level security policy"
**Diagnosis**: Check RLS policies are applied correctly
```sql
-- Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'tasks';
```
**Common Cause**: RLS enabled but policies not created (happened in migration 20250926220000)

### CORS Errors in Edge Functions
**Symptom**: "Access-Control-Allow-Origin" errors
**Diagnosis**: Check CORS configuration
**Fix**: Set `ALLOWED_ORIGINS` environment variable:
```bash
npx supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://your-domain.com"
```

### Cached Sale Data Stale
**Symptom**: User permissions don't update after role change
**Diagnosis**: Check `cachedSale` variable
**Fix**: Force logout/login or implement cache invalidation

### Build Targets Wrong Environment
**Symptom**: Production build connects to localhost
**Diagnosis**: Check build-time environment variables
```bash
# Verify .env.production.example is correct
cat .env.production.example | grep VITE_SUPABASE_URL

# Rebuild with correct environment
NODE_ENV=production npm run build
```

## Relevant Docs

### Internal Documentation
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Engineering constitution and development workflow
- `/home/krwhynot/projects/crispy-crm/LOCAL_DEV_SETUP.md` - Local development setup guide
- `/home/krwhynot/projects/crispy-crm/docs/mcp-troubleshooting.md` - MCP tools and CORS troubleshooting

### External Documentation
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth) - Official auth guide
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security) - RLS policies and patterns
- [React Admin Auth Provider](https://marmelab.com/react-admin/AuthProviderWriting.html) - Custom auth provider guide
- [ra-supabase-core Documentation](https://github.com/marmelab/ra-supabase/tree/main/packages/ra-supabase-core) - Supabase React Admin integration

### Migration References
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251012000000_initial_schema.sql` - Full schema with RLS policies
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/RECONCILIATION_SUMMARY.md` - Migration consolidation notes
