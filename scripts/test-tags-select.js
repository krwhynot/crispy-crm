import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("Testing SELECT from tags table...\n");

const { data, error } = await supabase.from("tags").select("*").limit(10);

if (error) {
  console.error("Error:", error);
} else {
  console.log(`Success! Found ${data.length} tags:`);
  data.forEach((tag) => {
    console.log(`- ${tag.name} (id: ${tag.id})`);
  });
}

process.exit(0);
