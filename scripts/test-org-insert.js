import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Service Key exists:", !!supabaseServiceKey);
console.log("Service Key length:", supabaseServiceKey?.length);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test 1: Minimal organization
console.log("\n=== Test 1: Minimal organization ===");
const minimalOrg = {
  name: "Test Organization 1",
  organization_type: "customer",
};

console.log("Inserting:", JSON.stringify(minimalOrg, null, 2));

const { data: data1, error: error1 } = await supabase
  .from("organizations")
  .insert(minimalOrg)
  .select();

if (error1) {
  console.error("Error:", error1);
} else {
  console.log("Success! Inserted organization:", data1);
}

// Test 2: Full organization like seed data
console.log("\n=== Test 2: Full organization (like seed data) ===");
const fullOrg = {
  name: "Test Organization 2",
  organization_type: "customer",
  priority: "A",
  website: "https://test.com",
  address: "123 Test St",
  city: "Test City",
  state: "MI",
  postal_code: "12345",
  linkedin_url: "https://linkedin.com/company/test",
  phone: "(555) 123-4567",
  description: "Test description",
  context_links: [],
  sales_id: null,
  created_by: null,
};

console.log("Inserting:", JSON.stringify(fullOrg, null, 2));

const { data: data2, error: error2 } = await supabase
  .from("organizations")
  .insert(fullOrg)
  .select();

if (error2) {
  console.error("Error:", error2);
} else {
  console.log("Success! Inserted organization:", data2);
}

// Test 3: Organization with non-empty context_links
console.log("\n=== Test 3: Organization with context_links ===");
const orgWithLinks = {
  name: "Test Organization 3",
  organization_type: "customer",
  context_links: [
    { url: "https://example.com", title: "Example" },
  ],
};

console.log("Inserting:", JSON.stringify(orgWithLinks, null, 2));

const { data: data3, error: error3 } = await supabase
  .from("organizations")
  .insert(orgWithLinks)
  .select();

if (error3) {
  console.error("Error:", error3);
} else {
  console.log("Success! Inserted organization:", data3);
}

process.exit(0);
