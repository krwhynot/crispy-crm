import { createClient } from "@supabase/supabase-js";

// Debug logging for environment variables
console.log('🔍 [SUPABASE INIT] Environment variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  allEnv: import.meta.env,
});

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('❌ [SUPABASE INIT] VITE_SUPABASE_URL is not defined!');
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
