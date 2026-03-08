import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createCorsHeaders, getAllowedOrigins } from "../_shared/cors-config.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { z } from "npm:zod@3.22.4";

interface Sale {
  id: number;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "manager" | "rep";
  disabled: boolean;
  avatar_url?: string;
}

// Zod schemas following engineering constitution:
// - z.strictObject() at API boundary (mass assignment prevention)
// - .max() on all strings (DoS prevention)
// - z.coerce for type conversion

// Recovery link flow: Password is optional — if not provided, a random one is generated
// After creation, a recovery link is generated for the user to set their own password
const inviteUserSchema = z
  .strictObject({
    email: z.string().email("Invalid email format").max(254, "Email too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password too long")
      .optional(),
    first_name: z.string().min(1, "First name required").max(100, "First name too long"),
    last_name: z.string().min(1, "Last name required").max(100, "Last name too long"),
    disabled: z.coerce.boolean().optional().default(false),
    role: z.enum(["admin", "manager", "rep"]).optional(),
    administrator: z.coerce.boolean().optional(), // Deprecated: use role instead
  })
  .transform((data) => {
    const role = data.role ?? (data.administrator ? "admin" : "rep");
    const { administrator: _, ...rest } = data;
    // Generate random password if not provided (user will set their own via recovery link)
    const password = rest.password ?? crypto.randomUUID() + "Aa1!";
    return { ...rest, password, role };
  });

const patchUserSchema = z
  .strictObject({
    sales_id: z.coerce.number().int().positive("Invalid sales ID"),
    email: z.string().email("Invalid email format").max(254).nullish(),
    first_name: z.string().min(1).max(100).nullish(),
    last_name: z.string().min(1).max(100).nullish(),
    phone: z.string().max(50).nullish(),
    avatar_url: z.string().url("Invalid avatar URL").max(500).nullish(), // Renamed: matches DB column
    role: z.enum(["admin", "manager", "rep"]).nullish(),
    administrator: z.coerce.boolean().nullish(), // Deprecated: use role instead
    disabled: z.coerce.boolean().nullish(),
    deleted_at: z.string().datetime().nullish(), // Soft-delete timestamp (admin-only)
  })
  .transform((data) => {
    const role =
      data.role ??
      (data.administrator !== undefined ? (data.administrator ? "admin" : "rep") : undefined);
    const { administrator: _, ...rest } = data;
    return { ...rest, role };
  });

const regenerateCodeSchema = z.strictObject({
  email: z.string().email("Invalid email format").max(254, "Email too long"),
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

async function updateSaleViaRPC(
  supabaseClient: ReturnType<typeof createClient>,
  user_id: string,
  updates: {
    role?: "admin" | "manager" | "rep";
    disabled?: boolean;
    avatar_url?: string; // Renamed: matches DB column
    deleted_at?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }
): Promise<Sale> {
  const { data: updatedSale, error } = await supabaseClient
    .rpc("admin_update_sale", {
      target_user_id: user_id,
      new_role: updates.role ?? null,
      new_disabled: updates.disabled ?? null,
      new_avatar: updates.avatar_url ?? null, // Maps avatar_url to RPC param new_avatar
      new_deleted_at: updates.deleted_at ?? null,
      new_first_name: updates.first_name ?? null,
      new_last_name: updates.last_name ?? null,
      new_email: updates.email ?? null,
      new_phone: updates.phone ?? null,
    })
    .single();

  if (error || !updatedSale) {
    console.error("Error updating sale via RPC:", error);
    throw error ?? new Error("Failed to update sale");
  }

  return updatedSale as Sale;
}

async function inviteUser(
  req: Request,
  currentUserSale: Sale,
  corsHeaders: Record<string, string>,
  supabaseClient: ReturnType<typeof createClient>
) {
  // Check admin authorization first (fast path)
  if (currentUserSale.role !== "admin") {
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

  // Idempotent find-or-create: handles orphaned auth users from prior failed attempts
  let userId: string;
  let isNewUser = false;

  const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  });

  if (createError) {
    if (!createError.message?.includes("already")) {
      console.error("Error creating user:", createError);
      const message = createError.message || "Failed to create user";
      const status = message.includes("invalid") ? 400 : 500;
      return createErrorResponse(status, message, corsHeaders);
    }

    // Email already exists in auth — attempt orphan recovery
    try {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });
      if (listError) {
        console.error("listUsers failed:", listError);
        return createErrorResponse(500, "Failed to look up existing users", corsHeaders);
      }
      const existingUser = listData?.users?.find((u) => u.email === email);

      if (!existingUser) {
        return createErrorResponse(
          409,
          "A user with this email address has already been registered",
          corsHeaders
        );
      }

      // Check if a sales record already exists for this auth user
      const { data: existingSale, error: saleCheckError } = await supabaseAdmin
        .from("sales")
        .select("id, deleted_at")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (saleCheckError) {
        console.error("Sale lookup failed:", saleCheckError);
        return createErrorResponse(500, "Failed to check existing sales record", corsHeaders);
      }

      if (existingSale && !existingSale.deleted_at) {
        // True duplicate — both auth user AND active sales record exist
        return createErrorResponse(
          409,
          "A user with this email address has already been registered",
          corsHeaders
        );
      }

      // Orphan recovery: auth user exists but no sales record (or soft-deleted)
      // Update auth metadata first
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { user_metadata: { first_name, last_name } }
      );
      if (updateError) {
        console.error("updateUserById failed:", updateError);
        return createErrorResponse(500, "Failed to update existing auth user", corsHeaders);
      }
      userId = existingUser.id;

      // Restore or create the sales record via admin RPC (bypasses service_role DML limits)
      const { error: restoreError } = await supabaseClient
        .rpc("admin_restore_sale", {
          target_user_id: userId,
          new_email: email,
          new_first_name: first_name,
          new_last_name: last_name,
        })
        .single();

      if (restoreError) {
        console.error("admin_restore_sale failed:", restoreError);
        return createErrorResponse(
          500,
          `Failed to restore sales record: ${restoreError.message}`,
          corsHeaders
        );
      }
    } catch (orphanErr) {
      console.error("Orphan recovery failed:", orphanErr);
      return createErrorResponse(500, "Orphan recovery failed", corsHeaders);
    }
  } else if (!data?.user) {
    return createErrorResponse(500, "Failed to create user", corsHeaders);
  } else {
    userId = data.user.id;
    isNewUser = true;
  }

  try {
    const sale = await updateSaleViaRPC(supabaseClient, userId, {
      role,
      disabled,
    });

    // Origin validation — fail-fast on misconfiguration (sec-004)
    const requestOrigin = req.headers.get("origin");
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.length === 0) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: no allowed origins" }),
        { status: 500, headers: corsHeaders }
      );
    }
    const productionOrigins = allowedOrigins.filter(
      (o) => !o.startsWith("http://localhost") && !o.startsWith("http://127.0.0.1")
    );
    if (Deno.env.get("SITE_URL") && productionOrigins.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Server misconfiguration: SITE_URL set but no production origins",
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    const redirectOrigin =
      requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : (productionOrigins[0] ?? allowedOrigins[0]);

    // Generate a recovery link so the new user can set their own password.
    // Uses direct GoTrue REST call instead of SDK's generateLink() because the
    // SDK sends redirect_to as a query param while GoTrue reads it from the
    // request body — causing the stored redirect to fall back to SITE_URL.
    let recoveryUrl: string | null = null;
    let emailOtp: string | null = null;
    try {
      const redirectTo = new URL("/auth-callback.html", redirectOrigin).toString();
      const supabaseUrl = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
      const serviceKey =
        Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
        Deno.env.get("SERVICE_ROLE_KEY") ||
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      const linkResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey!,
        },
        body: JSON.stringify({
          type: "recovery",
          email,
          redirect_to: redirectTo,
        }),
      });

      if (!linkResponse.ok) {
        const errBody = await linkResponse.text();
        console.error("Failed to generate recovery link:", errBody);
      } else {
        const payload = await linkResponse.json();
        recoveryUrl = payload.action_link ?? payload.properties?.action_link ?? null;
        emailOtp = payload.email_otp ?? null;
      }
    } catch (linkErr) {
      console.error("Error generating recovery link:", linkErr);
    }

    return new Response(
      JSON.stringify({
        data: sale,
        recoveryUrl,
        emailOtp,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("Error patching sale:", errMsg, e);
    // Only rollback auth user if we just created it (not orphan recovery)
    if (isNewUser) {
      await supabaseAdmin.auth.admin.deleteUser(userId).catch((deleteErr) => {
        console.error("Failed to rollback auth user after RPC failure:", deleteErr);
      });
    }
    return createErrorResponse(500, `Sale creation failed: ${errMsg}`, corsHeaders);
  }
}

async function patchUser(
  req: Request,
  currentUserSale: Sale,
  corsHeaders: Record<string, string>,
  supabaseClient: ReturnType<typeof createClient>
) {
  // Validate request body with Zod schema
  let validatedData;
  try {
    validatedData = await parseAndValidateBody(req, patchUserSchema);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return createErrorResponse(400, message, corsHeaders);
  }

  const { sales_id, email, first_name, last_name, phone, avatar_url, role, disabled, deleted_at } =
    validatedData;

  // Use SECURITY DEFINER RPC function instead of direct table access
  const { data: saleToUpdate, error: saleError } = await supabaseClient
    .rpc("get_sale_by_id", { target_sale_id: sales_id })
    .single();

  if (saleError || !saleToUpdate) {
    console.error("Sales lookup error:", saleError?.message ?? "User not found");
    return createErrorResponse(404, "Not Found", corsHeaders);
  }

  // Users can only update their own profile unless they are an administrator
  if (currentUserSale.role !== "admin" && currentUserSale.id !== saleToUpdate.id) {
    return createErrorResponse(401, "Not Authorized", corsHeaders);
  }

  // Only call auth admin API when there are meaningful auth changes
  const hasAuthChanges =
    email != null || first_name != null || last_name != null || disabled != null;

  if (hasAuthChanges) {
    const authUpdate: Record<string, unknown> = {};
    if (email != null) authUpdate.email = email;
    if (disabled != null) authUpdate.ban_duration = disabled ? "87600h" : "none";
    if (first_name != null || last_name != null) {
      authUpdate.user_metadata = {
        ...(first_name != null && { first_name }),
        ...(last_name != null && { last_name }),
      };
    }

    const { data, error: userError } = await supabaseAdmin.auth.admin.updateUserById(
      saleToUpdate.user_id,
      authUpdate
    );

    if (!data?.user || userError) {
      console.error("Error patching user:", userError);
      return createErrorResponse(500, "Internal Server Error", corsHeaders);
    }
  }

  // Only administrators can update the role and disabled status
  if (currentUserSale.role !== "admin") {
    try {
      // Non-admin self-edit: allow profile fields (RPC enforces self-edit restriction)
      const updatedSale = await updateSaleViaRPC(supabaseClient, saleToUpdate.user_id, {
        first_name: first_name ?? undefined,
        last_name: last_name ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
        avatar_url: avatar_url ?? undefined,
        // NOTE: role, disabled, deleted_at intentionally omitted - admin only
      });

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

  try {
    // Admin path: can update all fields including role, disabled, and soft-delete
    const updatedSale = await updateSaleViaRPC(supabaseClient, saleToUpdate.user_id, {
      first_name: first_name ?? undefined,
      last_name: last_name ?? undefined,
      email: email ?? undefined,
      phone: phone ?? undefined,
      role: role ?? undefined,
      disabled: disabled ?? undefined,
      avatar_url: avatar_url ?? undefined,
      deleted_at: deleted_at ?? undefined,
    });

    // Ban soft-deleted users from auth system
    if (deleted_at != null) {
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
        saleToUpdate.user_id,
        { ban_duration: "87600h" }
      );
      if (banError) {
        console.error("Warning: Failed to ban soft-deleted user:", banError);
        // Non-critical: DB soft-delete succeeded, log but don't fail the request
      }
    }

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

async function regenerateCode(
  req: Request,
  currentUserSale: Sale,
  corsHeaders: Record<string, string>
) {
  // Only admins can regenerate setup codes
  if (currentUserSale.role !== "admin") {
    return createErrorResponse(403, "Not Authorized", corsHeaders);
  }

  // Validate request body
  let validatedData;
  try {
    validatedData = await parseAndValidateBody(req, regenerateCodeSchema);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return createErrorResponse(400, message, corsHeaders);
  }

  const { email } = validatedData;

  // Verify target user exists in auth
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listError) {
    console.error("listUsers failed:", listError);
    return createErrorResponse(500, "Failed to look up users", corsHeaders);
  }
  const targetUser = listData?.users?.find((u) => u.email === email);
  if (!targetUser) {
    return createErrorResponse(404, "No user found with that email", corsHeaders);
  }

  // Generate a new recovery link + OTP
  try {
    const supabaseUrl = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
    const serviceKey =
      Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const requestOrigin = req.headers.get("origin");
    const allowedOrigins = getAllowedOrigins();
    const productionOrigins = allowedOrigins.filter(
      (o) => !o.startsWith("http://localhost") && !o.startsWith("http://127.0.0.1")
    );
    const redirectOrigin =
      requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : (productionOrigins[0] ?? allowedOrigins[0]);
    const redirectTo = new URL("/auth-callback.html", redirectOrigin).toString();

    const linkResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey!,
      },
      body: JSON.stringify({
        type: "recovery",
        email,
        redirect_to: redirectTo,
      }),
    });

    if (!linkResponse.ok) {
      const errBody = await linkResponse.text();
      console.error("Failed to generate recovery link:", errBody);
      return createErrorResponse(
        500,
        "Failed to generate setup code. Please try again.",
        corsHeaders
      );
    }

    const payload = await linkResponse.json();
    const emailOtp = payload.email_otp ?? null;
    const recoveryUrl = payload.action_link ?? payload.properties?.action_link ?? null;

    return new Response(JSON.stringify({ emailOtp, recoveryUrl }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Error generating setup code:", err);
    return createErrorResponse(
      500,
      "Failed to generate setup code. Please try again.",
      corsHeaders
    );
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return createErrorResponse(401, "Missing or invalid Authorization header", corsHeaders);
  }

  // LOCAL_ prefixed vars allow Docker container to use host.docker.internal
  const supabaseUrl = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey =
    Deno.env.get("LOCAL_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing environment variables");
    return createErrorResponse(500, "Server configuration error", corsHeaders);
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !data?.user) {
    console.error("Auth error:", authError?.message);
    return createErrorResponse(401, "Invalid or expired token", corsHeaders);
  }

  const { data: saleData, error: saleError } = await supabaseClient
    .rpc("get_sale_by_user_id", { target_user_id: data.user.id })
    .single();

  if (saleError || !saleData) {
    console.error("Sales lookup error:", saleError?.message ?? "User not found");
    return createErrorResponse(401, "User profile not found", corsHeaders);
  }

  const currentUserSale = saleData as Sale;
  if (req.method === "POST") {
    return inviteUser(req, currentUserSale, corsHeaders, supabaseClient);
  }

  if (req.method === "PATCH") {
    return patchUser(req, currentUserSale, corsHeaders, supabaseClient);
  }

  if (req.method === "PUT") {
    return regenerateCode(req, currentUserSale, corsHeaders);
  }

  return createErrorResponse(405, "Method Not Allowed", corsHeaders);
});
