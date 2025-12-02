// supabase/functions/crm-mcp/shared/supabaseClient.ts

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);
