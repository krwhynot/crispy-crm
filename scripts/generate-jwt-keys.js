import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { readFileSync } from "fs";

// Read JWT secret from config.toml
const configContent = readFileSync("supabase/config.toml", "utf-8");
const jwtSecretMatch = configContent.match(/jwt_secret\s*=\s*"([^"]+)"/);

if (!jwtSecretMatch) {
  console.error("Could not find jwt_secret in supabase/config.toml");
  process.exit(1);
}

const jwtSecret = jwtSecretMatch[1];

console.log("JWT Secret found:", jwtSecret.substring(0, 20) + "...\n");

// Generate anon key
const anonPayload = {
  iss: "supabase-demo",
  role: "anon",
  exp: 1983812996, // Far future expiration
};

const anonKey = jwt.sign(anonPayload, jwtSecret);
console.log("ANON KEY (JWT):");
console.log(anonKey);
console.log("");

// Generate service_role key
const serviceRolePayload = {
  iss: "supabase-demo",
  role: "service_role",
  exp: 1983812996, // Far future expiration
};

const serviceRoleKey = jwt.sign(serviceRolePayload, jwtSecret);
console.log("SERVICE_ROLE KEY (JWT):");
console.log(serviceRoleKey);
console.log("");

// Print .env format
console.log("=".repeat(80));
console.log("Add these to your .env file:");
console.log("=".repeat(80));
console.log(`VITE_SUPABASE_ANON_KEY=${anonKey}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`);

process.exit(0);
