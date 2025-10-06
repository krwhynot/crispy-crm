# Environment & Authentication Research

Research findings for environment configuration and authentication patterns to support E2E test automation setup.

## Overview

The Atomic CRM uses a cloud-first development approach with Supabase for authentication and data storage. Authentication is implemented using `ra-supabase-core` which provides React Admin integration with Supabase's auth system. The application supports email/password authentication with password reset flows, and all routes except public auth pages require authentication via React Admin's `requireAuth` prop.

## Relevant Files

- `/home/krwhynot/Projects/atomic/.env`: Active environment configuration with Supabase credentials
- `/home/krwhynot/Projects/atomic/.env.example`: Template for environment variables
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/supabase.ts`: Supabase client initialization
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/authProvider.ts`: React Admin auth provider implementation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`: Main application entry point with auth configuration
- `/home/krwhynot/Projects/atomic/src/components/admin/login-page.tsx`: Login UI component
- `/home/krwhynot/Projects/atomic/src/components/supabase/set-password-page.tsx`: Password reset flow
- `/home/krwhynot/Projects/atomic/src/components/supabase/forgot-password-page.tsx`: Forgot password flow
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/canAccess.ts`: Role-based access control
- `/home/krwhynot/Projects/atomic/src/tests/integration/auth-flow.test.ts`: Existing auth flow integration tests
- `/home/krwhynot/Projects/atomic/vitest.config.ts`: Test configuration

## Environment Configuration

### Required Environment Variables

**Client-Side (VITE_* prefix - safe for browser exposure):**
```bash
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Anonymous key with RLS protection
VITE_INBOUND_EMAIL=your_inbound_email@example.com
```

**Server-Side (for MCP tools, migrations, and test automation):**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Full database access, never expose to client
DATABASE_URL=postgres://postgres.aaqnanddcqvfiwhshndl:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Application Configuration:**
```bash
OPPORTUNITY_DEFAULT_CATEGORY=new_business
OPPORTUNITY_DEFAULT_STAGE=lead
OPPORTUNITY_PIPELINE_STAGES=lead,qualified,needs_analysis,proposal,negotiation,closed_won,closed_lost,nurturing
OPPORTUNITY_MAX_AMOUNT=1000000
OPPORTUNITY_DEFAULT_PROBABILITY=50
```

**Test Configuration:**
```bash
TEST_DATABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
TEST_CLEANUP_ENABLED=true
TEST_SEQUENTIAL_EXECUTION=true
TEST_TIMEOUT=10000
```

**MCP Workflow Configuration:**
```bash
MCP_PROJECT_ID=aaqnanddcqvfiwhshndl
SUPABASE_PROJECT_ID=aaqnanddcqvfiwhshndl
MCP_VALIDATE_TYPES=true
MCP_MIGRATION_TIMEOUT=30000
MCP_RETRY_ATTEMPTS=3
```

### Environment Variable Patterns for Testing

For E2E tests, you need **both** client and service keys:
- **Client key (anon)**: For simulating browser authentication flows
- **Service key**: For test data setup/cleanup and admin operations

Load environment variables in test files:
```typescript
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" }); // or just ".env"

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

### Security Considerations

**CRITICAL SECURITY RULES:**
1. **VITE_* variables are exposed to client** - only use for public keys
2. **Service role key bypasses RLS** - server-side only, never in VITE_* variables
3. **Anon key uses RLS policies** - safe for client-side with proper database policies
4. **Never commit .env files** - already in .gitignore
5. **Bundle verification** - run `npm run build` and check dist/ for exposed secrets

## Supabase Client Setup

### Client Initialization (Browser Context)

Location: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

**Key characteristics:**
- Uses Vite's `import.meta.env` for environment variables
- Anonymous key provides RLS-protected access
- Single client instance shared across application
- Auto-handles session persistence via localStorage

### Service Client Initialization (Server/Test Context)

Location: `/home/krwhynot/Projects/atomic/supabase/functions/_shared/supabaseAdmin.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
```

**For E2E tests, use Node.js version:**
```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Anonymous client (simulates browser)
const supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Service client (for test setup/cleanup)
const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

## Authentication Flow

### Login Implementation

**Auth Provider:** `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/authProvider.ts`

The auth provider wraps `ra-supabase-core`'s `supabaseAuthProvider` with custom logic:

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
    };
  },
});

export const authProvider: AuthProvider = {
  ...baseAuthProvider,
  login: async (params) => {
    const result = await baseAuthProvider.login(params);
    cachedSale = undefined; // Clear cache on login
    return result;
  },
  checkAuth: async (params) => {
    // Allow public auth pages without checking auth
    if (window.location.pathname === "/set-password" ||
        window.location.hash.includes("#/set-password")) {
      return;
    }
    if (window.location.pathname === "/forgot-password" ||
        window.location.hash.includes("#/forgot-password")) {
      return;
    }
    return baseAuthProvider.checkAuth(params);
  },
  canAccess: async (params) => {
    const sale = await getSaleFromCache();
    if (sale == null) return false;

    const role = sale.is_admin ? "admin" : "user";
    return canAccess(role, params);
  },
};
```

**Key Auth Flow Steps:**

1. **User submits credentials** via `/home/krwhynot/Projects/atomic/src/components/admin/login-page.tsx`
2. **Login handler calls** `useLogin()` from React Admin
3. **Auth provider executes** `signInWithPassword` via Supabase
4. **Session established** with access_token and refresh_token
5. **User data fetched** from `sales` table via `getSaleFromCache()`
6. **Identity returned** with user details (id, fullName, avatar)

### Session Management

**Session Retrieval:**
```typescript
const { data: dataSession, error: errorSession } =
  await supabase.auth.getSession();

const user = dataSession?.session?.user;
```

**Session Structure:**
```typescript
{
  access_token: string,
  refresh_token: string,
  expires_at: number,  // Unix timestamp
  token_type: "bearer",
  user: {
    id: string,
    email: string,
    created_at: string,
    confirmed_at: string,
    email_confirmed_at: string,
  }
}
```

**Token Expiry Detection:**
```typescript
const now = Date.now();
const isExpired = now >= (session.expires_at * 1000);
```

**Session Refresh:**
```typescript
const { data, error } = await supabase.auth.refreshSession();
```

### Logout Implementation

```typescript
const { error } = await supabase.auth.signOut();
```

Clears session from localStorage and Supabase auth state.

## Auth Context & State Management

### React Admin Auth Context

React Admin provides auth state via context:
- `useLogin()`: Triggers login flow
- `useLogout()`: Triggers logout flow
- `useAuthState()`: Returns auth status (loading, authenticated, error)
- `useGetIdentity()`: Fetches current user identity

### User Identity Cache Pattern

Location: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/authProvider.ts`

```typescript
let cachedSale: any;

const getSaleFromCache = async () => {
  if (cachedSale != null) return cachedSale;

  const { data: dataSession, error: errorSession } =
    await supabase.auth.getSession();

  if (dataSession?.session?.user == null || errorSession) {
    return undefined;
  }

  const { data: dataSale, error: errorSale } = await supabase
    .from("sales")
    .select("id, first_name, last_name, avatar_url, is_admin")
    .match({ user_id: dataSession?.session?.user.id })
    .maybeSingle();

  if (dataSale == null || errorSale) {
    return undefined;
  }

  cachedSale = dataSale;
  return dataSale;
};
```

**Cache invalidation:**
- On login: `cachedSale = undefined`
- On logout: Implicitly cleared when session is destroyed

## Protected Routes

### Route Protection Mechanism

Main configuration in `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`:

```typescript
<Admin
  dataProvider={dataProvider}
  authProvider={authProvider}
  store={localStorageStore(undefined, "CRM")}
  layout={Layout}
  loginPage={StartPage}
  i18nProvider={i18nProvider}
  dashboard={Dashboard}
  requireAuth  // ← Enables auth protection for all routes
  disableTelemetry
>
  <CustomRoutes noLayout>
    <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
    <Route path={ForgotPasswordPage.path} element={<ForgotPasswordPage />} />
  </CustomRoutes>

  <CustomRoutes>
    <Route path={SettingsPage.path} element={<SettingsPage />} />
  </CustomRoutes>

  <Resource name="opportunities" {...opportunities} />
  <Resource name="contacts" {...contacts} />
  {/* ... more resources ... */}
</Admin>
```

**Route Types:**

1. **Public routes** (noLayout): `/set-password`, `/forgot-password`, `/login`
2. **Protected routes**: All resources and custom routes requiring authentication
3. **Role-based routes**: Sales resource restricted to admins only

### Role-Based Access Control

Location: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/canAccess.ts`

```typescript
export const canAccess = <RecordType extends Record<string, any>>(
  role: string,
  params: CanAccessParams<RecordType>
) => {
  if (role === "admin") {
    return true;  // Admins can access everything
  }

  // Non-admins can't access the sales resource
  if (params.resource === "sales") {
    return false;
  }

  return true;  // All other resources accessible to users
};
```

**Role determination:**
```typescript
const role = sale.is_admin ? "admin" : "user";
```

**Resources and access:**
- `sales`: Admin only
- `opportunities`, `contacts`, `organizations`, `products`, `tasks`, `tags`: All authenticated users

## Creating Authenticated Test Sessions

### Pattern 1: Direct Supabase Authentication (Recommended for E2E)

```typescript
import { describe, test, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe("E2E Tests with Authentication", () => {
  let supabaseClient: SupabaseClient;
  let serviceClient: SupabaseClient;
  let testSession: any;

  beforeAll(async () => {
    // Client for simulating browser auth
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Service client for test data setup/cleanup
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create test user if doesn't exist
    const testEmail = "test@example.com";
    const testPassword = "test_password_123";

    // Attempt to sign in
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error && error.message.includes("Invalid login")) {
      // User doesn't exist, create via service client
      const { data: newUser, error: signUpError } =
        await serviceClient.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
        });

      if (signUpError) throw signUpError;

      // Create corresponding sales record
      await serviceClient.from("sales").insert({
        user_id: newUser.user.id,
        first_name: "Test",
        last_name: "User",
        is_admin: false,
      });

      // Now sign in
      const { data: loginData } = await supabaseClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      testSession = loginData.session;
    } else {
      testSession = data.session;
    }
  });

  afterAll(async () => {
    // Clean up session
    await supabaseClient.auth.signOut();
  });

  test("access protected resource", async () => {
    // Session is active, can make authenticated requests
    const { data, error } = await supabaseClient
      .from("opportunities")
      .select("*")
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### Pattern 2: Mock Window Location for Public Pages

```typescript
const mockLocation = {
  pathname: "/",
  hash: "",
  search: "",
  origin: "http://localhost:3000",
  href: "http://localhost:3000/",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Test set-password page access
mockLocation.pathname = "/set-password";
mockLocation.search = "?access_token=valid_token&refresh_token=valid_refresh";
```

### Pattern 3: Service Role for Admin Operations

```typescript
// Use service client to bypass RLS for test data setup
const { data: organization } = await serviceClient
  .from("organizations")
  .insert({ name: "Test Org" })
  .select()
  .single();

// Use regular client for testing user permissions
const { data, error } = await supabaseClient
  .from("organizations")
  .select("*")
  .eq("id", organization.id);
```

### Pattern 4: Playwright Browser Context Authentication

For Playwright E2E tests (future implementation):

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:5173/');

  // Fill login form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'test_password_123');

  // Submit and wait for redirect
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');

  // Verify logged in state
  await expect(page.locator('#main-content')).toBeVisible();
});

test('navigate to opportunities', async ({ page }) => {
  await page.click('a[href="#/opportunities"]');
  await expect(page).toHaveURL(/.*#\/opportunities/);
});
```

### Pattern 5: Reusable Auth State Storage

```typescript
// Save auth state after first login
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:5173/');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'test_password_123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');

  // Save storage state
  await context.storageState({ path: 'auth-state.json' });
  await context.close();
});

// Reuse auth state in subsequent tests
test.use({ storageState: 'auth-state.json' });
```

## Gotchas & Edge Cases

### Authentication Edge Cases

1. **Public page detection uses both pathname and hash**: Some pages use hash routing (`#/forgot-password`), others use pathname routing (`/forgot-password`)

2. **User identity requires sales table record**: Auth succeeds at Supabase level, but app requires a corresponding `sales` record with `user_id` matching auth user

3. **Cache invalidation timing**: User cache is cleared on login but not automatically refreshed - subsequent calls will re-fetch from database

4. **Token expiry handling**: Tokens expire but no explicit expiry warning in UI - relies on Supabase auto-refresh

5. **RLS policies require authenticated role**: Anonymous Supabase client with no session will be blocked by all RLS policies (`auth.role() = 'authenticated'`)

### Testing Edge Cases

1. **Environment variable naming**: Browser code uses `VITE_*` prefix, tests use `process.env`, Deno edge functions use `Deno.env.get()`

2. **Service role bypasses ALL security**: Using service key in tests means RLS policies are not tested - need both clients for comprehensive testing

3. **Session persistence in tests**: Supabase client persists session in localStorage by default - clean up between tests to avoid state pollution

4. **Password reset tokens in URL**: `/set-password` page expects `access_token` and `refresh_token` in query params - tests must mock or provide valid tokens

5. **Mock vs Real Auth**: Integration tests use mocked Supabase responses, E2E tests should use real auth against shared dev database

## Architectural Patterns

### Single Provider Architecture

All authentication flows through one provider (`authProvider.ts`), ensuring:
- Consistent session management
- Centralized cache control
- Unified error handling
- Single source of truth for auth state

### Layered Security Model

1. **Supabase Auth Layer**: Email/password authentication, session management
2. **RLS Layer**: Database-level row security based on `auth.role()`
3. **Application Layer**: Role-based access control via `canAccess()`
4. **UI Layer**: Conditional rendering based on permissions

### Test Data Isolation

Pattern from existing tests:
```typescript
// Track test data for cleanup
const testData = {
  organizations: [] as number[],
  contacts: [] as number[],
  opportunities: [] as number[],
};

// Clean up in correct order (respect foreign keys)
afterAll(async () => {
  await supabase.from("tasks").delete().in("id", testData.tasks);
  await supabase.from("opportunities").delete().in("id", testData.opportunities);
  await supabase.from("contacts").delete().in("id", testData.contacts);
  await supabase.from("organizations").delete().in("id", testData.organizations);
});
```

## 🆕 Authorization (RBAC) Testing (Critical Gap)

### Overview

**CRITICAL GAP IDENTIFIED**: While authentication testing was planned, authorization testing was completely missing. The `sales` table has an `is_admin` boolean that determines resource access, but no tests verify this works correctly.

### RBAC Model

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/canAccess.ts`

```typescript
export const canAccess = <RecordType extends Record<string, any>>(
  role: string,
  params: CanAccessParams<RecordType>
) => {
  if (role === "admin") {
    return true;  // Admins can access everything
  }

  // Non-admins can't access the sales resource
  if (params.resource === "sales") {
    return false;
  }

  return true;  // All other resources accessible to users
};
```

**Role Determination**: `const role = sale.is_admin ? "admin" : "user";`

### Resources and Access Levels

| Resource | Admin Access | User Access |
|----------|--------------|-------------|
| sales | ✅ Full CRUD | ❌ No access |
| opportunities | ✅ Full CRUD | ✅ Full CRUD |
| contacts | ✅ Full CRUD | ✅ Full CRUD |
| organizations | ✅ Full CRUD | ✅ Full CRUD |
| products | ✅ Full CRUD | ✅ Full CRUD |
| tasks | ✅ Full CRUD | ✅ Full CRUD |
| tags | ✅ Full CRUD | ✅ Full CRUD |

### Creating Test Users with Different Roles

**Pattern 1: Service Client User Creation**

```typescript
import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create admin user
async function createAdminUser() {
  const { data: authUser, error } = await serviceClient.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'admin_password_123',
    email_confirm: true
  });

  if (error) throw error;

  // Create sales record with is_admin = true
  const { data: sale } = await serviceClient.from('sales').insert({
    user_id: authUser.user.id,
    first_name: 'Admin',
    last_name: 'User',
    is_admin: true  // ⭐ Admin role
  }).select().single();

  return { authUser, sale };
}

// Create regular user
async function createRegularUser() {
  const { data: authUser, error } = await serviceClient.auth.admin.createUser({
    email: 'user@test.com',
    password: 'user_password_123',
    email_confirm: true
  });

  if (error) throw error;

  // Create sales record with is_admin = false
  const { data: sale } = await serviceClient.from('sales').insert({
    user_id: authUser.user.id,
    first_name: 'Regular',
    last_name: 'User',
    is_admin: false  // ⭐ Regular user role
  }).select().single();

  return { authUser, sale };
}
```

### E2E Authorization Tests

**Flow 6: Authorization (RBAC) - MANDATORY**

```typescript
// tests/e2e/authorization.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authorization (RBAC)', () => {
  test('non-admin user cannot access sales resource', async ({ page }) => {
    // 1. Login as regular user
    await page.goto('/');
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByLabel('Password').fill('user_password_123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // 2. Wait for dashboard to load
    await page.waitForURL('**/');

    // 3. Verify sales menu item is NOT visible in navigation
    await expect(page.getByRole('link', { name: /sales/i })).not.toBeVisible();

    // 4. Attempt direct navigation to /sales
    await page.goto('/#/sales');

    // 5. Verify redirect to dashboard OR 403 error message
    await expect(page).toHaveURL(/.*#\//);  // Redirected to home
    // OR
    await expect(page.getByText(/access denied|forbidden|not authorized/i)).toBeVisible();

    // 6. Attempt direct API access (if applicable)
    const response = await page.request.get('/rest/v1/sales');
    expect(response.status()).toBe(403);
  });

  test('admin user can access all resources', async ({ page }) => {
    // 1. Login as admin user
    await page.goto('/');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password').fill('admin_password_123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // 2. Verify sales resource visible in navigation
    await expect(page.getByRole('link', { name: /sales/i })).toBeVisible();

    // 3. Navigate to /sales and verify list loads
    await page.click('text=Sales');
    await expect(page).toHaveURL(/.*#\/sales/);

    // 4. Verify can create sales record
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page).toHaveURL(/.*#\/sales\/create/);

    // 5. Fill and submit form
    await page.getByLabel('First Name').fill('New');
    await page.getByLabel('Last Name').fill('Salesperson');
    await page.getByRole('button', { name: /save/i }).click();

    // 6. Verify redirect to list
    await expect(page).toHaveURL(/.*#\/sales/);
  });

  test('user role is correctly displayed in UI', async ({ page }) => {
    // Login and verify role indicator in UI (if present)
    await page.goto('/');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password').fill('admin_password_123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for admin badge/indicator
    await expect(page.getByText(/admin/i)).toBeVisible();
  });
});
```

### Component Tests for RBAC

```typescript
describe('Resource List - RBAC', () => {
  it('hides create button for non-admin on sales resource', () => {
    const mockAuthProvider = {
      checkAuth: vi.fn().mockResolvedValue(undefined),
      getIdentity: vi.fn().mockResolvedValue({ id: 1, fullName: 'Regular User', is_admin: false })
    };

    render(
      <AdminContext authProvider={mockAuthProvider}>
        <ResourceContextProvider value="sales">
          <SalesList />
        </ResourceContextProvider>
      </AdminContext>
    );

    // Create button should not be rendered
    expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
  });

  it('shows create button for admin on sales resource', () => {
    const mockAuthProvider = {
      checkAuth: vi.fn().mockResolvedValue(undefined),
      getIdentity: vi.fn().mockResolvedValue({ id: 1, fullName: 'Admin User', is_admin: true })
    };

    render(
      <AdminContext authProvider={mockAuthProvider}>
        <ResourceContextProvider value="sales">
          <SalesList />
        </ResourceContextProvider>
      </AdminContext>
    );

    // Create button should be visible
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });
});
```

### Test Data Cleanup for RBAC Tests

```typescript
// Clean up test users created for RBAC testing
afterAll(async () => {
  // Delete sales records first (foreign key)
  await serviceClient
    .from('sales')
    .delete()
    .in('email', ['admin@test.com', 'user@test.com']);

  // Delete auth users
  const { data: users } = await serviceClient.auth.admin.listUsers();
  const testUsers = users?.users.filter(u =>
    u.email?.endsWith('@test.com')
  );

  for (const user of testUsers ?? []) {
    await serviceClient.auth.admin.deleteUser(user.id);
  }
});
```

### Testing Requirements for Authorization

**MANDATORY**: Test suite MUST include:
1. E2E test verifying non-admin cannot access `/sales`
2. E2E test verifying admin CAN access `/sales`
3. Component tests for conditional rendering based on role
4. Verification that API requests respect RLS policies
5. Test data factories supporting both admin and non-admin users

### Files to Review for RBAC Implementation

- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/authProvider.ts`: `canAccess()` integration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/canAccess.ts`: RBAC logic
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`: Resource registration with role checks
- Database migration defining `sales.is_admin` column

## Relevant Docs

### External Documentation
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth) - Official Supabase authentication guide
- [React Admin Authentication](https://marmelab.com/react-admin/Authentication.html) - React Admin auth provider documentation
- [ra-supabase NPM Package](https://www.npmjs.com/package/ra-supabase) - React Admin Supabase integration
- [Playwright Authentication Guide](https://playwright.dev/docs/auth) - Browser automation auth patterns

### Internal Documentation
- `/home/krwhynot/Projects/atomic/CLAUDE.md`: Engineering constitution and project guidelines
- `/home/krwhynot/Projects/atomic/.env.example`: Environment variable template with security guidelines
- `/home/krwhynot/Projects/atomic/src/tests/integration/auth-flow.test.ts`: Comprehensive auth flow test examples
- `/home/krwhynot/Projects/atomic/src/tests/e2e/user-journey.test.ts`: E2E test patterns with data setup/cleanup
