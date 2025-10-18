#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl);
console.log("Key:", supabaseServiceKey?.substring(0, 30) + "...");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test 1: Minimal insert WITHOUT .select()
console.log("\n=== Test 1: Insert WITHOUT .select() ===");
const minimal = {
  name: "Test Organization",
  organization_type: "customer",
};

const { data: data1, error: error1 } = await supabase
  .from("organizations")
  .insert(minimal);

if (error1) {
  console.error("ERROR:", error1);
} else {
  console.log("SUCCESS (no data returned):", data1);
}

// Test 1b: Minimal insert WITH .select()
console.log("\n=== Test 1b: Insert WITH .select() ===");
const minimal2 = {
  name: "Test Organization 2",
  organization_type: "customer",
};

const { data: data1b, error: error1b } = await supabase
  .from("organizations")
  .insert(minimal2)
  .select();

if (error1b) {
  console.error("ERROR:", error1b);
} else {
  console.log("SUCCESS:", data1b);
}

// Test 2: Add more fields gradually
console.log("\n=== Test 2: With priority ===");
const withPriority = {
  name: "Test Organization 2",
  organization_type: "customer",
  priority: "A",
};

const { data: data2, error: error2 } = await supabase
  .from("organizations")
  .insert(withPriority)
  .select();

if (error2) {
  console.error("ERROR:", error2);
} else {
  console.log("SUCCESS:", data2);
}

// Test 3: Full object like seed script
console.log("\n=== Test 3: Full object ===");
const full = {
  name: "Test Organization 3",
  organization_type: "customer",
  priority: "A",
  website: "https://test.com",
  address: "123 Main St",
  city: "Boston",
  state: "MA",
  postal_code: "02101",
  linkedin_url: "https://linkedin.com/company/test",
  phone: "(555) 555-5555",
  description: "Test company",
  context_links: ["https://example.com/test"],
  sales_id: null,
  created_by: null,
};

const { data: data3, error: error3 } = await supabase
  .from("organizations")
  .insert(full)
  .select();

if (error3) {
  console.error("ERROR:", error3);
} else {
  console.log("SUCCESS:", data3);
}
