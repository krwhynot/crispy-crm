import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createCorsHeaders } from "../_shared/cors-config.ts";
import { z } from "npm:zod@3.22.4";

function createErrorResponse(status: number, message: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ status, message }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status,
  });
}

// Zod schemas following engineering constitution:
// - z.strictObject() at API boundary (mass assignment prevention)
// - .max() on all strings (DoS prevention)
// - z.coerce for type conversion

const inviteUserSchema = z
  .strictObject({
    email: z.string().email("Invalid email format").max(254, "Email too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long"),
    first_name: z.string().min(1, "First name required").max(100, "First name too long"),
    last_name: z.string().min(1, "Last name required").max(100, "Last name too long"),
    disabled: z.coerce.boolean().optional().default(false),
    // NEW: role field (preferred)
    role: z.enum(["admin", "manager", "rep"]).optional(),
    // DEPRECATED: Keep for backward compatibility
    administrator: z.coerce.boolean().optional(),
  })
  .transform((data) => {
    // Derive role from administrator if role not provided
    const role = data.role ?? (data.administrator ? "admin" : "rep");
    // Strip deprecated administrator field to avoid dual truth sources
    const { administrator: _deprecated, ...rest } = data;
    return { ...rest, role };
  });

const patchUserSchema = z
  .strictObject({
    sales_id: z.coerce.number().int().positive("Invalid sales ID"),
    email: z.string().email("Invalid email format").max(254).optional(),
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    avatar: z.string().url("Invalid avatar URL").max(500).optional(),
    // NEW: role field (preferred)
    role: z.enum(["admin", "manager", "rep"]).optional(),
    // DEPRECATED: Keep for backward compatibility
    administrator: z.coerce.boolean().optional(),
    disabled: z.coerce.boolean().optional(),
  })
  .transform((data) => {
    // Derive role from administrator if role not provided but administrator is
    let derivedRole = data.role;
    if (data.role === undefined && data.administrator !== undefined) {
      derivedRole = data.administrator ? "admin" : "rep";
    }
    // Strip deprecated administrator field to avoid dual truth sources
    const { administrator: _deprecated, ...rest } = data;
    return { ...rest, role: derivedRole };
  });

// Maximum request body size (1MB)
const MAX_REQUEST_SIZE = 1048576;

/**
 * Validate request body size and parse with Zod
 */
async function parseAndValidateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T> {
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
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(`Validation failed: ${errors}`);
  }

  return result.data;
}

async function updateSaleDisabled(user_id: string, disabled: boolean) {
  return await supabaseAdmin
    .from("sales")
    .update({ disabled: disabled ?? false })
    .eq("user_id", user_id);
}

async function updateSaleRole(user_id: string, role: "admin" | "manager" | "rep") {
  const { data: sales, error: salesError } = await supabaseAdmin
    .from("sales")
    .update({ role })
    .eq("user_id", user_id)
    .select("*");

  if (!sales?.length || salesError) {
    console.error("Error updating user role:", salesError);
    throw salesError ?? new Error("Failed to update sale role");
  }
  return sales.at(0);
}

async function updateSaleAvatar(user_id: string, avatar: string) {
  const { data: sales, error: salesError } = await supabaseAdmin
    .from("sales")
    .update({ avatar })
    .eq("user_id", user_id)
    .select("*");

  if (!sales?.length || salesError) {
    console.error("Error updating user:", salesError);
    throw salesError ?? new Error("Failed to update sale");
  }
  return sales.at(0);
}

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

  const { email, password, first_name, last_name, disabled, role } = validatedData;

  const { data, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { first_name, last_name },
  });

  const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

  if (!data?.user || userError) {
    console.error(`Error inviting user: user_error=${userError}`);
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }

  if (!data?.user || userError || emailError) {
    console.error(`Error inviting user, email_error=${emailError}`);
    return createErrorResponse(500, "Failed to send invitation mail", corsHeaders);
  }

  try {
    await updateSaleDisabled(data.user.id, disabled);
    const sale = await updateSaleRole(data.user.id, role);

    return new Response(
      JSON.stringify({
        data: sale,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (e) {
    console.error("Error patching sale:", e);
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }
}

async function patchUser(req: Request, currentUserSale: any, corsHeaders: Record<string, string>) {
  // Validate request body with Zod schema
  let validatedData;
  try {
    validatedData = await parseAndValidateBody(req, patchUserSchema);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return createErrorResponse(400, message, corsHeaders);
  }

  const { sales_id, email, first_name, last_name, avatar, role, disabled } = validatedData;

  const { data: sale } = await supabaseAdmin.from("sales").select("*").eq("id", sales_id).single();

  if (!sale) {
    return createErrorResponse(404, "Not Found", corsHeaders);
  }

  // Users can only update their own profile unless they are an administrator
  if (!currentUserSale.administrator && currentUserSale.id !== sale.id) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }

  const { data, error: userError } = await supabaseAdmin.auth.admin.updateUserById(sale.user_id, {
    email,
    ban_duration: disabled ? "87600h" : "none",
    user_metadata: { first_name, last_name },
  });

  if (!data?.user || userError) {
    console.error("Error patching user:", userError);
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }

  if (avatar) {
    await updateSaleAvatar(data.user.id, avatar);
  }

  // Only administrators can update the administrator and disabled status
  if (!currentUserSale.administrator) {
    const { data: new_sale } = await supabaseAdmin
      .from("sales")
      .select("*")
      .eq("id", sales_id)
      .single();
    return new Response(
      JSON.stringify({
        data: new_sale,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  try {
    await updateSaleDisabled(data.user.id, disabled);
    if (role) {
      await updateSaleRole(data.user.id, role);
    }
    const { data: updatedSale } = await supabaseAdmin
      .from("sales")
      .select("*")
      .eq("id", sales_id)
      .single();
    return new Response(
      JSON.stringify({
        data: updatedSale,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (e) {
    console.error("Error patching sale:", e);
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }
}

Deno.serve(async (req: Request) => {
  // Generate secure CORS headers based on request origin
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Extract and validate Authorization header
  const authHeader = req.headers.get("Authorization");
  console.log("[DEBUG] Auth header present:", !!authHeader);

  if (!authHeader) {
    console.log("[DEBUG] ERROR: No Authorization header provided");
    return createErrorResponse(401, "Unauthorized - No auth header", corsHeaders);
  }

  // Extract JWT token from "Bearer <token>" format
  const token = authHeader.replace("Bearer ", "");
  if (!token || token === authHeader) {
    console.log("[DEBUG] ERROR: Invalid Authorization header format");
    return createErrorResponse(401, "Unauthorized - Invalid auth format", corsHeaders);
  }

  // Validate JWT using supabaseAdmin (service role can validate any token)
  // This is the correct pattern for Edge Functions - pass token explicitly
  const { data, error: authError } = await supabaseAdmin.auth.getUser(token);
  console.log("[DEBUG] getUser result:", { hasUser: !!data?.user, error: authError?.message });

  if (!data?.user) {
    console.log("[DEBUG] ERROR: getUser failed -", authError?.message || "No user returned");
    return createErrorResponse(401, "Unauthorized - getUser failed", corsHeaders);
  }

  console.log("[DEBUG] User ID from token:", data.user.id);
  console.log("[DEBUG] User email:", data.user.email);

  // DEBUG: Log sales lookup
  const currentUserSale = await supabaseAdmin
    .from("sales")
    .select("*")
    .eq("user_id", data.user.id)
    .single();

  console.log("[DEBUG] Sales lookup:", { found: !!currentUserSale?.data, error: currentUserSale?.error?.message });

  if (!currentUserSale?.data) {
    console.log("[DEBUG] ERROR: User not found in sales table for user_id:", data.user.id);
    return createErrorResponse(401, "Unauthorized - Not in sales table", corsHeaders);
  }

  console.log("[DEBUG] Sales record found - id:", currentUserSale.data.id, "admin:", currentUserSale.data.administrator);
  if (req.method === "POST") {
    return inviteUser(req, currentUserSale.data, corsHeaders);
  }

  if (req.method === "PATCH") {
    return patchUser(req, currentUserSale.data, corsHeaders);
  }

  return createErrorResponse(405, "Method Not Allowed", corsHeaders);
});
