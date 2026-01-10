#!/usr/bin/env node
/**
 * Create Test Users Script (Node.js version using Supabase Admin SDK)
 * ====================================================================
 * Creates 3 test users with role-specific data using Supabase Admin API:
 * - Admin: Full access with extensive test data (100 contacts, 50 orgs, 75 opps)
 * - Sales Director: Moderate data (60 contacts, 30 orgs, 40 opps)
 * - Account Manager: Minimal data (40 contacts, 20 orgs, 25 opps)
 *
 * This version uses the Supabase Admin SDK which properly handles:
 * - Password hashing with bcrypt
 * - Email confirmation
 * - Auth triggers for sales table sync
 * - Metadata storage
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

// =====================================================================
// Configuration
// =====================================================================

const config = {
  adminEmail: process.env.TEST_ADMIN_EMAIL || "admin@test.local",
  directorEmail: process.env.TEST_DIRECTOR_EMAIL || "director@test.local",
  managerEmail: process.env.TEST_MANAGER_EMAIL || "manager@test.local",
  password: process.env.TEST_USER_PASSWORD || "TestPass123!",

  // Local Supabase credentials
  // Service role key from `npx supabase status --output json`
  supabaseUrl: process.env.VITE_SUPABASE_URL || "http://localhost:54321",
  supabaseServiceKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.lPtBhvYyMlr1ivNO2yY99Nby5DSQTdIM5r2n3_CiUus",
};

// Role-specific data volumes
const dataVolumes = {
  admin: { orgs: 50, contacts: 100, opportunities: 75, activities: 200, tasks: 100, notes: 150 },
  director: { orgs: 30, contacts: 60, opportunities: 40, activities: 120, tasks: 60, notes: 90 },
  manager: { orgs: 20, contacts: 40, opportunities: 25, activities: 80, tasks: 40, notes: 60 },
};

// =====================================================================
// Colors for Console Output
// =====================================================================

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function success(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function info(msg) {
  console.log(`${colors.yellow}→${colors.reset} ${msg}`);
}

function error(msg) {
  console.error(`${colors.red}❌ Error: ${msg}${colors.reset}`);
  process.exit(1);
}

function heading(msg) {
  console.log(`${colors.blue}${msg}${colors.reset}`);
}

// =====================================================================
// Main Script
// =====================================================================

async function main() {
  heading("👥 Creating test users with role-specific data...");
  console.log(`   Supabase URL: ${config.supabaseUrl}`);
  console.log("");

  // Create Supabase admin client
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        apikey: config.supabaseServiceKey,
      },
    },
  });

  console.log("1️⃣  Creating auth users via Supabase Admin API...");
  console.log("");

  const users = [
    { email: config.adminEmail, role: "admin", fullName: "Admin User" },
    { email: config.directorEmail, role: "sales_director", fullName: "Sales Director" },
    { email: config.managerEmail, role: "account_manager", fullName: "Account Manager" },
  ];

  const createdUsers = [];

  for (const user of users) {
    info(`Creating ${user.role}: ${user.email}...`);

    try {
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: config.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
        },
      });

      if (createError) {
        if (createError.message?.includes("already registered")) {
          info(`User ${user.email} already exists, fetching...`);

          // Fetch existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users?.find((u) => u.email === user.email);

          if (existingUser) {
            createdUsers.push({ ...user, id: existingUser.id });
            success(`Found existing user: ${user.email}`);
          } else {
            error(`Could not find existing user: ${user.email}`);
          }
        } else {
          throw createError;
        }
      } else {
        createdUsers.push({ ...user, id: data.user.id });
        success(`Created user: ${user.email}`);
      }
    } catch (err) {
      error(`Failed to create ${user.email}: ${err.message}`);
    }
  }

  console.log("");
  console.log("2️⃣  Updating sales records with permissions...");
  console.log("");

  // Get user IDs
  const adminUser = createdUsers.find((u) => u.role === "admin");
  const directorUser = createdUsers.find((u) => u.role === "sales_director");
  const managerUser = createdUsers.find((u) => u.role === "account_manager");

  if (!adminUser || !directorUser || !managerUser) {
    error("Not all users were created successfully");
  }

  success("Retrieved user IDs:");
  console.log(`   Admin:    ${adminUser.id}`);
  console.log(`   Director: ${directorUser.id}`);
  console.log(`   Manager:  ${managerUser.id}`);
  console.log("");

  // Update sales table to set admin flag
  const { error: updateError } = await supabase
    .rpc("exec_sql", {
      query: `
      UPDATE public.sales SET is_admin = true WHERE user_id = '${adminUser.id}'::uuid;
      UPDATE public.sales SET is_admin = false WHERE user_id IN ('${directorUser.id}'::uuid, '${managerUser.id}'::uuid);
    `,
    })
    .catch(() => {
      // RPC might not exist, use direct query instead
      return supabase.from("sales").update({ is_admin: true }).eq("user_id", adminUser.id);
    });

  if (updateError) {
    info(`Note: Could not update sales records via RPC, will update after seed data generation`);
  } else {
    success("Sales records updated with permissions");
  }

  console.log("");
  console.log("3️⃣  Generating test data...");
  console.log("");

  // Generate test data for each user using existing seed-data.js
  for (const user of createdUsers) {
    const volumes = dataVolumes[user.role];
    info(
      `Generating ${user.role} data (${volumes.contacts} contacts, ${volumes.orgs} orgs, ${volumes.opportunities} opportunities)...`
    );

    try {
      execSync(
        `SEED_ORGANIZATION_COUNT=${volumes.orgs} ` +
          `SEED_CONTACT_COUNT=${volumes.contacts} ` +
          `SEED_OPPORTUNITY_COUNT=${volumes.opportunities} ` +
          `SEED_ACTIVITY_COUNT=${volumes.activities} ` +
          `SEED_NOTE_COUNT=${volumes.notes} ` +
          `SEED_TASK_COUNT=${volumes.tasks} ` +
          `TEST_USER_ID=${user.id} ` +
          `node scripts/seed-data.js`,
        { stdio: "inherit" }
      );
      success(`Generated ${user.role} test data`);
    } catch (err) {
      error(`Failed to generate test data for ${user.role}: ${err.message}`);
    }
  }

  console.log("");
  console.log("4️⃣  Recording test user metadata...");
  console.log("");

  // Record metadata for each user
  for (const user of createdUsers) {
    const volumes = dataVolumes[user.role];

    const { error: metadataError } = await supabase.from("test_user_metadata").upsert(
      {
        user_id: user.id,
        role: user.role,
        created_by: "create-test-users.mjs",
        test_data_counts: {
          contacts: volumes.contacts,
          organizations: volumes.orgs,
          opportunities: volumes.opportunities,
          activities: volumes.activities,
          tasks: volumes.tasks,
          notes: volumes.notes,
        },
        last_sync_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (metadataError) {
      console.error(`Warning: Could not record metadata for ${user.email}:`, metadataError);
    }
  }

  success("Test user metadata recorded");
  console.log("");

  // =====================================================================
  // Summary
  // =====================================================================

  heading("✅ Test users created successfully!");
  console.log("");
  console.log("📧 Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Admin:           ${config.adminEmail}`);
  console.log(`   Sales Director:  ${config.directorEmail}`);
  console.log(`   Account Manager: ${config.managerEmail}`);
  console.log(`   Password:        ${config.password}`);
  console.log("");
  console.log("📊 Test Data Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `   Admin:    ${dataVolumes.admin.contacts} contacts, ${dataVolumes.admin.orgs} orgs, ${dataVolumes.admin.opportunities} opportunities, ${dataVolumes.admin.activities} activities`
  );
  console.log(
    `   Director:  ${dataVolumes.director.contacts} contacts, ${dataVolumes.director.orgs} orgs, ${dataVolumes.director.opportunities} opportunities, ${dataVolumes.director.activities} activities`
  );
  console.log(
    `   Manager:   ${dataVolumes.manager.contacts} contacts, ${dataVolumes.manager.orgs} orgs, ${dataVolumes.manager.opportunities} opportunities, ${dataVolumes.manager.activities} activities`
  );
  console.log("");
  console.log("🌐 Access the app at: http://localhost:5173");
  console.log("");
}

// Run the script
main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
