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

console.log("Testing SELECT from sales table...\n");

const { data, error } = await supabase.from("sales").select("*").limit(10);

if (error) {
  console.error("Error:", error);
} else {
  console.log(`Success! Found ${data.length} sales records:`);
  data.forEach((sale) => {
    console.log(`- ${sale.first_name} ${sale.last_name} (id: ${sale.id})`);
  });
}

process.exit(0);
