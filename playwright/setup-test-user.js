#!/usr/bin/env node

/**
 * Setup Test User for E2E Tests
 *
 * This script creates a test user in Supabase for E2E testing.
 * Run this before running E2E tests for the first time.
 *
 * Usage: node playwright/setup-test-user.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load playwright .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const testEmail = process.env.TEST_USER_EMAIL || 'test@gmail.com';
const testPassword = process.env.TEST_USER_PASSWORD || 'password';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestUser() {
  console.log('🔧 Setting up test user for E2E tests...\n');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔒 Password: ${testPassword}\n`);

  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find(u => u.email === testEmail);

    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Created: ${new Date(existingUser.created_at).toLocaleString()}`);
      console.log('\n✨ You can now run E2E tests with: npm run test:e2e\n');
      return;
    }

    // Create new test user
    console.log('📝 Creating new test user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Test User',
        role: 'tester'
      }
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log('✅ Test user created successfully!');
    console.log(`   User ID: ${newUser.user.id}`);
    console.log(`   Email: ${newUser.user.email}`);
    console.log('\n✨ You can now run E2E tests with: npm run test:e2e\n');

  } catch (error) {
    console.error('❌ Error setting up test user:', error.message);
    console.error('\n💡 Manual setup instructions:');
    console.error('   1. Go to Supabase Dashboard → Authentication → Users');
    console.error(`   2. Click "Add User"`);
    console.error(`   3. Email: ${testEmail}`);
    console.error(`   4. Password: ${testPassword}`);
    console.error('   5. Auto Confirm User: Yes\n');
    process.exit(1);
  }
}

setupTestUser();