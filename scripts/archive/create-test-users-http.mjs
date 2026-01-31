#!/usr/bin/env node
/**
 * Create Test Users Script (HTTP API version)
 * ===================================================================
 * Creates 3 test users using direct Auth Admin API HTTP calls
 * Works around Supabase JS SDK JWT issues by calling the REST API directly
 */

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
  supabaseUrl: process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321",
  // JWT signed with jwt_secret from config.toml (generate via: node scripts/dev/generate-jwt.mjs)
  serviceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxOTgzODEyOTk2fQ.U0zvx3STRzPjpTCJk6YPwJovSK9XYb_bZNeRVNyoBMA",
};

// Role-specific data volumes
const dataVolumes = {
  admin: { orgs: 50, contacts: 100, opportunities: 75, activities: 200, tasks: 100, notes: 150 },
  sales_director: {
    orgs: 30,
    contacts: 60,
    opportunities: 40,
    activities: 120,
    tasks: 60,
    notes: 90,
  },
  account_manager: {
    orgs: 20,
    contacts: 40,
    opportunities: 25,
    activities: 80,
    tasks: 40,
    notes: 60,
  },
};

// =====================================================================
// Colors
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
// HTTP Helper Functions
// =====================================================================

async function createAuthUser(email, password, fullName, role) {
  const url = `${config.supabaseUrl}/auth/v1/admin/users`;
  const body = JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
    },
    body: body,
    // Disable automatic header manipulation
    redirect: "manual",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

function getUserIdFromDatabase(email) {
  const result = execSync(
    `docker exec supabase_db_crispy-crm psql -U postgres -d postgres -t -c "SELECT id FROM auth.users WHERE email = '${email}';"`,
    { encoding: "utf-8" }
  );
  return result.trim();
}

function updateSalesPermissions(userIds) {
  const { adminId, directorId, managerId } = userIds;

  execSync(
    `docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "UPDATE public.sales SET is_admin = true WHERE user_id = '${adminId}'::uuid; UPDATE public.sales SET is_admin = false WHERE user_id IN ('${directorId}'::uuid, '${managerId}'::uuid);"`,
    { stdio: "inherit" }
  );
}

function recordMetadata(userId, role, volumes) {
  execSync(
    `docker exec supabase_db_crispy-crm psql -U postgres -d postgres -c "INSERT INTO public.test_user_metadata (user_id, role, created_by, test_data_counts, last_sync_at) VALUES ('${userId}'::uuid, '${role}', 'create-test-users-http.mjs', '{\\"contacts\\":${volumes.contacts},\\"organizations\\":${volumes.orgs},\\"opportunities\\":${volumes.opportunities},\\"activities\\":${volumes.activities},\\"tasks\\":${volumes.tasks},\\"notes\\":${volumes.notes}}'::jsonb, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_sync_at = NOW(), test_data_counts = EXCLUDED.test_data_counts;"`,
    { stdio: "inherit" }
  );
}

// =====================================================================
// Main Script
// =====================================================================

async function main() {
  heading("👥 Creating test users with role-specific data...");
  console.log(`   Supabase URL: ${config.supabaseUrl}`);
  console.log(`   Using JWT: ${config.serviceRoleKey.substring(0, 50)}...`);
  console.log("");

  console.log("1️⃣  Creating auth users via HTTP Auth Admin API...");
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
      const result = await createAuthUser(user.email, config.password, user.fullName, user.role);
      createdUsers.push({ ...user, id: result.id });
      success(`Created user: ${user.email} (ID: ${result.id})`);
    } catch (err) {
      if (
        err.message.includes("already registered") ||
        err.message.includes("duplicate") ||
        err.message.includes("email_exists")
      ) {
        info(`User ${user.email} already exists, fetching ID...`);
        const userId = getUserIdFromDatabase(user.email);
        if (userId) {
          createdUsers.push({ ...user, id: userId });
          success(`Found existing user: ${user.email} (ID: ${userId})`);
        } else {
          error(`Could not find user ${user.email}`);
        }
      } else {
        error(`Failed to create ${user.email}: ${err.message}`);
      }
    }
  }

  console.log("");
  console.log("2️⃣  Updating sales records with permissions...");
  console.log("");

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

  updateSalesPermissions({
    adminId: adminUser.id,
    directorId: directorUser.id,
    managerId: managerUser.id,
  });

  success("Sales records updated with permissions");
  console.log("");

  console.log("3️⃣  Generating test data...");
  console.log("");

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
    } catch {
      error(`Failed to generate test data for ${user.role}`);
    }
  }

  console.log("");
  console.log("4️⃣  Recording test user metadata...");
  console.log("");

  for (const user of createdUsers) {
    const volumes = dataVolumes[user.role];
    recordMetadata(user.id, user.role, volumes);
  }

  success("Test user metadata recorded");
  console.log("");

  // Summary
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
