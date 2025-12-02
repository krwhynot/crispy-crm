// supabase/functions/crm-mcp/middleware/auth.ts

import { createClient } from "jsr:@supabase/supabase-js@2";
import { MCPSession } from "../types/mcp.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthResult {
  success: boolean;
  session?: MCPSession;
  error?: string;
}

export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { success: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return { success: false, error: authError?.message || "Invalid token" };
    }

    // Get sales record for user
    const { data: sales, error: salesError } = await supabaseAdmin
      .from("sales")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (salesError || !sales) {
      return { success: false, error: "User not found in sales table" };
    }

    const sessionId = req.headers.get("X-MCP-Session-Id") || crypto.randomUUID();

    return {
      success: true,
      session: {
        sessionId,
        userId: user.id,
        salesId: sales.id,
        role: sales.role as "admin" | "manager" | "rep",
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
