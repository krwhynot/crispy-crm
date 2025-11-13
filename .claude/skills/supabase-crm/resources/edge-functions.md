# Edge Functions

## Purpose

Edge Functions are server-side Deno functions for complex operations requiring elevated privileges. This resource covers authentication validation, service role operations, transaction patterns, CORS handling, and webhook implementations.

## Core Pattern

### Basic Edge Function Structure

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "zod";

// 1. Define validation schema
const RequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  profile: z.object({
    first_name: z.string(),
    last_name: z.string(),
  }),
});

// 2. Helper for error responses
function createErrorResponse(
  status: number,
  message: string,
  corsHeaders: Record<string, string>
) {
  return new Response(
    JSON.stringify({ status, message }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status,
    }
  );
}

// 3. Main handler with Deno.serve
Deno.serve(async (req: Request) => {
  // Generate CORS headers
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 4. Validate and parse request
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    // 5. Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // ← Service role, not anon key
    );

    // 6. Execute business logic
    const result = await executeBusinessLogic(supabase, validated);

    // 7. Return success response
    return new Response(
      JSON.stringify({ data: result }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Edge Function error:", error);

    // 8. Handle errors consistently
    if (error.name === "ZodError") {
      return createErrorResponse(400, "Invalid request data", corsHeaders);
    }

    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }
});
```

**Why this pattern:**
- Service role bypasses RLS for admin operations
- Zod validates requests at edge
- CORS handled properly with preflight support
- Consistent error responses
- Logged errors for debugging

## Real-World Example: User Management

**From `supabase/functions/users/index.ts`:**

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createCorsHeaders } from "../_shared/cors-config.ts";

function createErrorResponse(
  status: number,
  message: string,
  corsHeaders: Record<string, string>
) {
  return new Response(
    JSON.stringify({ status, message }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status,
    }
  );
}

// Helper: Update sales record
async function updateSaleAdministrator(user_id: string, administrator: boolean) {
  const { data: sales, error: salesError } = await supabaseAdmin
    .from("sales")
    .update({ administrator })
    .eq("user_id", user_id)
    .select("*");

  if (!sales?.length || salesError) {
    console.error("Error updating user:", salesError);
    throw salesError ?? new Error("Failed to update sale");
  }

  return sales.at(0);
}

// Handler: Invite user (POST)
async function inviteUser(
  req: Request,
  currentUserSale: any,
  corsHeaders: Record<string, string>
) {
  const { email, password, first_name, last_name, disabled, administrator } =
    await req.json();

  // Authorization: Only admins can invite
  if (!currentUserSale.administrator) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }

  // Create auth user
  const { data, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { first_name, last_name },
  });

  if (!data?.user || userError) {
    console.error(`Error inviting user:`, userError);
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }

  // Send invitation email
  const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

  if (emailError) {
    console.error(`Error sending invitation:`, emailError);
    return createErrorResponse(500, "Failed to send invitation mail", corsHeaders);
  }

  try {
    // Update sales record with permissions
    await updateSaleDisabled(data.user.id, disabled);
    const sale = await updateSaleAdministrator(data.user.id, administrator);

    return new Response(
      JSON.stringify({ data: sale }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (e) {
    console.error("Error patching sale:", e);
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }
}

// Handler: Update user (PATCH)
async function patchUser(
  req: Request,
  currentUserSale: any,
  corsHeaders: Record<string, string>
) {
  const { sales_id, email, first_name, last_name, avatar, administrator, disabled } =
    await req.json();

  // Get sales record
  const { data: sale } = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("id", sales_id)
    .single();

  if (!sale) {
    return createErrorResponse(404, "Not Found", corsHeaders);
  }

  // Authorization: Users can only update their own profile unless admin
  if (!currentUserSale.administrator && currentUserSale.id !== sale.id) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }

  // Update auth user
  const { data, error: userError } = await supabaseAdmin.auth.admin.updateUserById(
    sale.user_id,
    {
      email,
      ban_duration: disabled ? "87600h" : "none",
      user_metadata: { first_name, last_name },
    }
  );

  if (!data?.user || userError) {
    console.error("Error patching user:", userError);
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }

  // Update avatar if provided
  if (avatar) {
    await updateSaleAvatar(data.user.id, avatar);
  }

  // Non-admins cannot change admin/disabled status
  if (!currentUserSale.administrator) {
    const { data: new_sale } = await supabaseAdmin
      .from("sales")
      .select("*")
      .eq("id", sales_id)
      .single();

    return new Response(
      JSON.stringify({ data: new_sale }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    // Update permissions (admin only)
    await updateSaleDisabled(data.user.id, disabled);
    const updatedSale = await updateSaleAdministrator(data.user.id, administrator);

    return new Response(
      JSON.stringify({ data: updatedSale }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (e) {
    console.error("Error patching sale:", e);
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Generate secure CORS headers
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Authenticate request
  const authHeader = req.headers.get("Authorization")!;
  const localClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data } = await localClient.auth.getUser();
  if (!data?.user) {
    return createErrorResponse(401, "Unauthorized", corsHeaders);
  }

  // Get current user's sales record
  const currentUserSale = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("user_id", data.user.id)
    .single();

  if (!currentUserSale?.data) {
    return createErrorResponse(401, "Unauthorized", corsHeaders);
  }

  // Route by method
  if (req.method === "POST") {
    return inviteUser(req, currentUserSale.data, corsHeaders);
  }

  if (req.method === "PATCH") {
    return patchUser(req, currentUserSale.data, corsHeaders);
  }

  return createErrorResponse(405, "Method Not Allowed", corsHeaders);
});
```

## Edge Function Patterns by Use Case

### Pattern 1: Authentication Validation

**Use for:** Verifying user identity and permissions

```typescript
Deno.serve(async (req: Request) => {
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  // 1. Extract Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return createErrorResponse(401, "Missing Authorization header", corsHeaders);
  }

  // 2. Create client with user's token (NOT service role)
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!, // ← Anon key for user validation
    { global: { headers: { Authorization: authHeader } } }
  );

  // 3. Validate token and get user
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    return createErrorResponse(401, "Invalid or expired token", corsHeaders);
  }

  // 4. Check user permissions (if needed)
  const { data: userProfile } = await supabaseAdmin
    .from("sales")
    .select("administrator, disabled")
    .eq("user_id", user.id)
    .single();

  if (userProfile?.disabled) {
    return createErrorResponse(403, "Account disabled", corsHeaders);
  }

  // 5. Continue with authenticated context
  const result = await handleAuthenticatedRequest(user, userProfile);

  return new Response(
    JSON.stringify({ data: result }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
});
```

### Pattern 2: Service Role Operations

**Use for:** Admin operations that bypass RLS

```typescript
// ⚠️ CRITICAL: Service role bypasses ALL RLS policies
// Only use for trusted admin operations

// Initialize service role client
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // ← Service role
);

// Examples of service role operations:

// 1. Create auth users (admin only)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: "user@example.com",
  password: "secure-password",
  user_metadata: { first_name: "John", last_name: "Doe" },
});

// 2. Update user metadata (admin only)
await supabaseAdmin.auth.admin.updateUserById(userId, {
  user_metadata: { role: "manager" },
});

// 3. Bulk operations without RLS checks
const { data: records } = await supabaseAdmin
  .from("table_name")
  .update({ status: "archived" })
  .in("id", recordIds);

// 4. Read deleted records (soft deletes)
const { data: deletedRecords } = await supabaseAdmin
  .from("organizations")
  .select("*")
  .not("deleted_at", "is", null);
```

**Security checklist:**
- ✅ Validate user authentication BEFORE using service role
- ✅ Check user permissions (admin, owner, etc.)
- ✅ Log service role operations for audit trail
- ❌ NEVER expose service role key to client
- ❌ NEVER skip authorization checks

### Pattern 3: Transaction Patterns

**Use for:** Multi-step operations that must succeed or fail together

```typescript
async function createOrganizationWithContacts(
  supabase: SupabaseClient,
  orgData: OrgData,
  contacts: ContactData[]
) {
  // Note: Supabase doesn't have native transactions, so we use error handling
  // and manual rollback

  let createdOrgId: string | null = null;
  const createdContactIds: string[] = [];

  try {
    // Step 1: Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert(orgData)
      .select()
      .single();

    if (orgError || !org) {
      throw new Error(`Failed to create organization: ${orgError?.message}`);
    }

    createdOrgId = org.id;

    // Step 2: Create contacts linked to organization
    for (const contactData of contacts) {
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          ...contactData,
          organization_id: createdOrgId,
        })
        .select()
        .single();

      if (contactError || !contact) {
        throw new Error(`Failed to create contact: ${contactError?.message}`);
      }

      createdContactIds.push(contact.id);
    }

    return {
      organization: org,
      contacts: createdContactIds,
    };
  } catch (error) {
    // Rollback: Delete created records
    console.error("Transaction failed, rolling back:", error);

    // Delete contacts
    if (createdContactIds.length > 0) {
      await supabase.from("contacts").delete().in("id", createdContactIds);
    }

    // Delete organization
    if (createdOrgId) {
      await supabase.from("organizations").delete().eq("id", createdOrgId);
    }

    throw error;
  }
}
```

**Better approach with database-level transactions:**

```sql
-- Create RPC function for atomic operations
CREATE OR REPLACE FUNCTION create_organization_with_contacts(
  org_data JSONB,
  contacts_data JSONB[]
) RETURNS JSONB AS $$
DECLARE
  new_org_id UUID;
  result JSONB;
BEGIN
  -- Insert organization
  INSERT INTO organizations (name, org_type, ...)
  SELECT * FROM jsonb_populate_record(null::organizations, org_data)
  RETURNING id INTO new_org_id;

  -- Insert contacts
  INSERT INTO contacts (organization_id, first_name, last_name, ...)
  SELECT new_org_id, *
  FROM jsonb_populate_recordset(null::contacts, contacts_data);

  -- Return result
  SELECT jsonb_build_object(
    'organization_id', new_org_id,
    'contacts_created', array_length(contacts_data, 1)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Call RPC function (atomic operation)
const { data, error } = await supabase.rpc('create_organization_with_contacts', {
  org_data: { name: "Acme Corp", org_type: "customer" },
  contacts_data: [
    { first_name: "John", last_name: "Doe", email: "john@acme.com" },
    { first_name: "Jane", last_name: "Smith", email: "jane@acme.com" },
  ],
});
```

### Pattern 4: CORS Configuration

**Use for:** Secure cross-origin requests

```typescript
// Shared CORS configuration
// File: supabase/functions/_shared/cors-config.ts

const ALLOWED_ORIGINS = [
  "http://localhost:5173", // Local dev
  "http://localhost:3000", // Alternative local
  "https://your-app.com", // Production
  "https://staging.your-app.com", // Staging
];

export function createCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

// Usage in Edge Functions
Deno.serve(async (req: Request) => {
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // ... handle request

  // Return with CORS headers
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
```

### Pattern 5: Scheduled Functions (Cron)

**Use for:** Periodic tasks (cleanup, notifications, reports)

```typescript
// File: supabase/functions/check-overdue-tasks/index.ts

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Scheduled functions use Authorization header from Supabase
  const authHeader = req.headers.get("Authorization");

  // Verify it's a legitimate cron job
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Find overdue tasks
    const { data: overdueTasks, error } = await supabase
      .from("tasks")
      .select("id, title, due_date, sales_id")
      .lt("due_date", new Date().toISOString())
      .eq("completed", false)
      .is("deleted_at", null);

    if (error) {
      throw error;
    }

    // Create notifications for overdue tasks
    const notifications = overdueTasks.map((task) => ({
      user_id: task.sales_id,
      title: "Overdue Task",
      message: `Task "${task.title}" is overdue`,
      type: "warning",
      link: `/tasks/${task.id}`,
    }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: overdueTasks.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cron job failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**Setup cron schedule in Supabase Dashboard:**
```
0 9 * * * // Every day at 9 AM UTC
```

## Deployment

### Local Development

```bash
# Serve function locally
supabase functions serve users --env-file supabase/.env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/users' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","password":"password123"}'
```

### Deploy to Supabase

```bash
# Deploy single function
supabase functions deploy users

# Deploy all functions
supabase functions deploy

# Set environment secrets
supabase secrets set MY_SECRET=value

# View logs
supabase functions logs users
```

## Testing Edge Functions

### Integration Test Example

```typescript
import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("Edge Function - Create User", async () => {
  const response = await fetch("http://localhost:54321/functions/v1/users", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "test@example.com",
      password: "password123",
      profile: {
        first_name: "Test",
        last_name: "User",
      },
    }),
  });

  assertEquals(response.status, 200);

  const data = await response.json();
  assertEquals(data.data.email, "test@example.com");
});
```

## Best Practices

### DO
✅ Use service role key for admin operations only
✅ Validate user authentication before service role usage
✅ Validate request bodies with Zod
✅ Handle CORS properly with preflight support
✅ Log errors with context for debugging
✅ Use RPC functions for complex transactions
✅ Set environment variables via `supabase secrets`
✅ Test locally before deploying

### DON'T
❌ Expose service role key to client-side code
❌ Skip user authentication checks
❌ Use service role without authorization validation
❌ Return raw error messages to client
❌ Skip CORS preflight handling
❌ Hardcode secrets in function code
❌ Deploy without testing locally

## Related Resources

- [Service Layer](service-layer.md) - Calling Edge Functions from services
- [Validation Patterns](validation-patterns.md) - Request validation with Zod
- [Error Handling](error-handling.md) - Error responses in Edge Functions
- [RLS Policies](rls-policies.md) - Understanding service role bypass
