/**
 * RLS Policy Integration Tests
 *
 * Tests Row Level Security policies using the Supabase test harness.
 *
 * What's tested:
 * 1. Admin-only UPDATE/DELETE policies (contacts, organizations, opportunities)
 * 2. Personal task filtering (users can only see their own tasks)
 * 3. INSERT policies (should work for all authenticated users)
 *
 * Reference: CLAUDE.md lines 104-109
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Override .env with .env.test values for integration tests
dotenv.config({ path: '.env.test', override: true });

interface TestUser {
  email: string;
  password: string;
  userId: string;
  salesId: number | null;
  isAdmin: boolean;
}

describe('RLS Policy Integration', () => {
  let adminClient: SupabaseClient;
  let repClient: SupabaseClient;
  let serviceRoleClient: SupabaseClient;

  const adminUser: TestUser = {
    email: 'admin@test.com',
    password: 'password123',
    userId: '',
    salesId: null,
    isAdmin: true,
  };

  const repUser: TestUser = {
    email: 'rep@test.com',
    password: 'password123',
    userId: '',
    salesId: null,
    isAdmin: false,
  };

  // Track created test data for cleanup
  const testData = {
    contactIds: [] as number[],
    organizationIds: [] as number[],
    opportunityIds: [] as number[],
    taskIds: [] as number[],
    userIds: [] as string[],
    salesIds: [] as number[],
  };

  beforeEach(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials in .env.test');
    }

    // Create service role client for user creation (admin operations)
    serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create admin client and authenticate
    adminClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: adminAuthData, error: adminAuthError } = await adminClient.auth.signInWithPassword({
      email: adminUser.email,
      password: adminUser.password,
    });

    if (adminAuthError) {
      throw new Error(`Admin authentication failed: ${adminAuthError.message}`);
    }

    adminUser.userId = adminAuthData.user!.id;

    // Get admin's sales record
    const { data: adminSales, error: adminSalesError } = await adminClient
      .from('sales')
      .select('id, is_admin')
      .eq('user_id', adminUser.userId)
      .single();

    if (adminSalesError || !adminSales) {
      throw new Error(`Failed to get admin sales record: ${adminSalesError?.message}`);
    }

    adminUser.salesId = adminSales.id;

    // Create non-admin rep user using service role client
    const { data: repAuthData, error: repSignUpError } = await serviceRoleClient.auth.admin.createUser({
      email: repUser.email,
      password: repUser.password,
      email_confirm: true,
    });

    if (repSignUpError || !repAuthData.user) {
      throw new Error(`Rep user creation failed: ${repSignUpError?.message}`);
    }

    repUser.userId = repAuthData.user.id;
    testData.userIds.push(repUser.userId);

    // Wait for trigger to create sales record
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get rep's sales record using service role client
    const { data: repSales, error: repSalesError } = await serviceRoleClient
      .from('sales')
      .select('id, is_admin')
      .eq('user_id', repUser.userId)
      .single();

    if (repSalesError || !repSales) {
      throw new Error(`Failed to get rep sales record: ${repSalesError?.message}`);
    }

    repUser.salesId = repSales.id;
    testData.salesIds.push(repUser.salesId);

    // Update rep's is_admin to false (ensure it's not admin)
    const { error: updateError } = await serviceRoleClient
      .from('sales')
      .update({ is_admin: false })
      .eq('id', repUser.salesId);

    if (updateError) {
      throw new Error(`Failed to set rep as non-admin: ${updateError.message}`);
    }

    // Create rep client and authenticate
    repClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: repAuthError } = await repClient.auth.signInWithPassword({
      email: repUser.email,
      password: repUser.password,
    });

    if (repAuthError) {
      throw new Error(`Rep authentication failed: ${repAuthError.message}`);
    }
  });

  afterEach(async () => {
    // Clean up test data in reverse dependency order using service role client
    if (testData.taskIds.length > 0) {
      await serviceRoleClient.from('tasks').delete().in('id', testData.taskIds);
      testData.taskIds = [];
    }

    if (testData.contactIds.length > 0) {
      await serviceRoleClient.from('contacts').delete().in('id', testData.contactIds);
      testData.contactIds = [];
    }

    if (testData.opportunityIds.length > 0) {
      await serviceRoleClient.from('opportunities').delete().in('id', testData.opportunityIds);
      testData.opportunityIds = [];
    }

    if (testData.organizationIds.length > 0) {
      await serviceRoleClient.from('organizations').delete().in('id', testData.organizationIds);
      testData.organizationIds = [];
    }

    // Clean up test users
    for (const userId of testData.userIds) {
      await serviceRoleClient.auth.admin.deleteUser(userId);
    }
    testData.userIds = [];
    testData.salesIds = [];

    // Sign out clients
    if (adminClient) {
      await adminClient.auth.signOut();
    }
    if (repClient) {
      await repClient.auth.signOut();
    }
  });

  describe('Contacts - Admin-only UPDATE/DELETE', () => {
    it('allows all authenticated users to INSERT contacts', async () => {
      // Rep can insert
      const { data: repContact, error: repError } = await repClient
        .from('contacts')
        .insert({ name: 'Rep Contact', first_name: 'Rep', last_name: 'Contact' })
        .select()
        .single();

      expect(repError).toBeNull();
      expect(repContact).toBeDefined();
      expect(repContact!.name).toBe('Rep Contact');
      testData.contactIds.push(repContact!.id);

      // Admin can insert
      const { data: adminContact, error: adminError } = await adminClient
        .from('contacts')
        .insert({ name: 'Admin Contact', first_name: 'Admin', last_name: 'Contact' })
        .select()
        .single();

      expect(adminError).toBeNull();
      expect(adminContact).toBeDefined();
      expect(adminContact!.name).toBe('Admin Contact');
      testData.contactIds.push(adminContact!.id);
    });

    it('allows admin to UPDATE contacts', async () => {
      // Create contact as admin
      const { data: contact, error: insertError } = await adminClient
        .from('contacts')
        .insert({ name: 'Test Contact', first_name: 'Test', last_name: 'Contact' })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.contactIds.push(contact!.id);

      // Admin can update
      const { data: updated, error: updateError } = await adminClient
        .from('contacts')
        .update({ name: 'Updated Contact' })
        .eq('id', contact!.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updated!.name).toBe('Updated Contact');
    });

    it('prevents non-admin from UPDATE contacts', async () => {
      // Create contact as admin
      const { data: contact, error: insertError } = await adminClient
        .from('contacts')
        .insert({ name: 'Test Contact', first_name: 'Test', last_name: 'Contact' })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.contactIds.push(contact!.id);

      // Rep cannot update
      const { data: updated, error: updateError } = await repClient
        .from('contacts')
        .update({ name: 'Hacked Contact' })
        .eq('id', contact!.id)
        .select();

      // Should return empty array (no rows updated) due to RLS policy
      expect(updated).toEqual([]);

      // Verify contact was not updated
      const { data: verified } = await adminClient
        .from('contacts')
        .select('name')
        .eq('id', contact!.id)
        .single();

      expect(verified!.name).toBe('Test Contact');
    });

    it('allows admin to DELETE contacts', async () => {
      // Create contact as admin
      const { data: contact, error: insertError } = await adminClient
        .from('contacts')
        .insert({ name: 'Test Contact', first_name: 'Test', last_name: 'Contact' })
        .select()
        .single();

      expect(insertError).toBeNull();
      const contactId = contact!.id;

      // Admin can delete
      const { error: deleteError } = await adminClient
        .from('contacts')
        .delete()
        .eq('id', contactId);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data: verified } = await adminClient
        .from('contacts')
        .select()
        .eq('id', contactId);

      expect(verified).toEqual([]);
    });

    it('prevents non-admin from DELETE contacts', async () => {
      // Create contact as admin
      const { data: contact, error: insertError } = await adminClient
        .from('contacts')
        .insert({ name: 'Test Contact', first_name: 'Test', last_name: 'Contact' })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.contactIds.push(contact!.id);

      // Rep cannot delete
      const { error: deleteError } = await repClient
        .from('contacts')
        .delete()
        .eq('id', contact!.id);

      // No error, but nothing deleted due to RLS policy
      expect(deleteError).toBeNull();

      // Verify contact still exists
      const { data: verified } = await adminClient
        .from('contacts')
        .select()
        .eq('id', contact!.id);

      expect(verified).toHaveLength(1);
    });
  });

  describe('Organizations - Admin-only UPDATE/DELETE', () => {
    it('allows all authenticated users to INSERT organizations', async () => {
      // Rep can insert
      const { data: repOrg, error: repError } = await repClient
        .from('organizations')
        .insert({ name: 'Rep Organization', type: 'customer' })
        .select()
        .single();

      expect(repError).toBeNull();
      expect(repOrg).toBeDefined();
      testData.organizationIds.push(repOrg!.id);

      // Admin can insert
      const { data: adminOrg, error: adminError } = await adminClient
        .from('organizations')
        .insert({ name: 'Admin Organization', type: 'customer' })
        .select()
        .single();

      expect(adminError).toBeNull();
      expect(adminOrg).toBeDefined();
      testData.organizationIds.push(adminOrg!.id);
    });

    it('allows admin to UPDATE organizations', async () => {
      const { data: org, error: insertError } = await adminClient
        .from('organizations')
        .insert({ name: 'Test Org', type: 'customer' })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.organizationIds.push(org!.id);

      const { data: updated, error: updateError } = await adminClient
        .from('organizations')
        .update({ name: 'Updated Org' })
        .eq('id', org!.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updated!.name).toBe('Updated Org');
    });

    it('prevents non-admin from UPDATE organizations', async () => {
      const { data: org, error: insertError } = await adminClient
        .from('organizations')
        .insert({ name: 'Test Org', type: 'customer' })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.organizationIds.push(org!.id);

      const { data: updated, error: updateError } = await repClient
        .from('organizations')
        .update({ name: 'Hacked Org' })
        .eq('id', org!.id)
        .select();

      expect(updated).toEqual([]);

      const { data: verified } = await adminClient
        .from('organizations')
        .select('name')
        .eq('id', org!.id)
        .single();

      expect(verified!.name).toBe('Test Org');
    });

    it('allows admin to DELETE organizations', async () => {
      const { data: org, error: insertError } = await adminClient
        .from('organizations')
        .insert({ name: 'Test Org', type: 'customer' })
        .select()
        .single();

      expect(insertError).toBeNull();
      const orgId = org!.id;

      const { error: deleteError } = await adminClient
        .from('organizations')
        .delete()
        .eq('id', orgId);

      expect(deleteError).toBeNull();

      const { data: verified } = await adminClient
        .from('organizations')
        .select()
        .eq('id', orgId);

      expect(verified).toEqual([]);
    });

    it('prevents non-admin from DELETE organizations', async () => {
      const { data: org, error: insertError } = await adminClient
        .from('organizations')
        .insert({ name: 'Test Org', type: 'customer' })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.organizationIds.push(org!.id);

      const { error: deleteError } = await repClient
        .from('organizations')
        .delete()
        .eq('id', org!.id);

      expect(deleteError).toBeNull();

      const { data: verified } = await adminClient
        .from('organizations')
        .select()
        .eq('id', org!.id);

      expect(verified).toHaveLength(1);
    });
  });

  describe('Opportunities - Admin-only UPDATE/DELETE', () => {
    let testOrgId: number;

    beforeEach(async () => {
      // Create organization for opportunities
      const { data: org, error: orgError } = await adminClient
        .from('organizations')
        .insert({ name: 'Test Organization', type: 'customer' })
        .select()
        .single();

      if (orgError) {
        throw new Error(`Failed to create test organization: ${orgError.message}`);
      }

      testOrgId = org!.id;
      testData.organizationIds.push(testOrgId);
    });

    it('allows all authenticated users to INSERT opportunities', async () => {
      // Rep can insert
      const { data: repOpp, error: repError } = await repClient
        .from('opportunities')
        .insert({
          name: 'Rep Opportunity',
          organization_id: testOrgId,
          stage: 'Prospecting',
          sales_id: repUser.salesId,
        })
        .select()
        .single();

      expect(repError).toBeNull();
      expect(repOpp).toBeDefined();
      testData.opportunityIds.push(repOpp!.id);

      // Admin can insert
      const { data: adminOpp, error: adminError } = await adminClient
        .from('opportunities')
        .insert({
          name: 'Admin Opportunity',
          organization_id: testOrgId,
          stage: 'Prospecting',
          sales_id: adminUser.salesId,
        })
        .select()
        .single();

      expect(adminError).toBeNull();
      expect(adminOpp).toBeDefined();
      testData.opportunityIds.push(adminOpp!.id);
    });

    it('allows admin to UPDATE opportunities', async () => {
      const { data: opp, error: insertError } = await adminClient
        .from('opportunities')
        .insert({
          name: 'Test Opportunity',
          organization_id: testOrgId,
          stage: 'Prospecting',
          sales_id: adminUser.salesId,
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.opportunityIds.push(opp!.id);

      const { data: updated, error: updateError } = await adminClient
        .from('opportunities')
        .update({ stage: 'Qualified' })
        .eq('id', opp!.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updated!.stage).toBe('Qualified');
    });

    it('prevents non-admin from UPDATE opportunities', async () => {
      const { data: opp, error: insertError } = await adminClient
        .from('opportunities')
        .insert({
          name: 'Test Opportunity',
          organization_id: testOrgId,
          stage: 'Prospecting',
          sales_id: adminUser.salesId,
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.opportunityIds.push(opp!.id);

      const { data: updated, error: updateError } = await repClient
        .from('opportunities')
        .update({ stage: 'Closed Won' })
        .eq('id', opp!.id)
        .select();

      expect(updated).toEqual([]);

      const { data: verified } = await adminClient
        .from('opportunities')
        .select('stage')
        .eq('id', opp!.id)
        .single();

      expect(verified!.stage).toBe('Prospecting');
    });

    it('allows admin to DELETE opportunities', async () => {
      const { data: opp, error: insertError } = await adminClient
        .from('opportunities')
        .insert({
          name: 'Test Opportunity',
          organization_id: testOrgId,
          stage: 'Prospecting',
          sales_id: adminUser.salesId,
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      const oppId = opp!.id;

      const { error: deleteError } = await adminClient
        .from('opportunities')
        .delete()
        .eq('id', oppId);

      expect(deleteError).toBeNull();

      const { data: verified } = await adminClient
        .from('opportunities')
        .select()
        .eq('id', oppId);

      expect(verified).toEqual([]);
    });

    it('prevents non-admin from DELETE opportunities', async () => {
      const { data: opp, error: insertError } = await adminClient
        .from('opportunities')
        .insert({
          name: 'Test Opportunity',
          organization_id: testOrgId,
          stage: 'Prospecting',
          sales_id: adminUser.salesId,
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.opportunityIds.push(opp!.id);

      const { error: deleteError } = await repClient
        .from('opportunities')
        .delete()
        .eq('id', opp!.id);

      expect(deleteError).toBeNull();

      const { data: verified } = await adminClient
        .from('opportunities')
        .select()
        .eq('id', opp!.id);

      expect(verified).toHaveLength(1);
    });
  });

  describe('Tasks - Personal Filtering (created_by)', () => {
    it('users can only SELECT their own tasks', async () => {
      // Admin creates a task
      const { data: adminTask, error: adminError } = await adminClient
        .from('tasks')
        .insert({
          title: 'Admin Task',
          created_by: adminUser.salesId,
        })
        .select()
        .single();

      expect(adminError).toBeNull();
      testData.taskIds.push(adminTask!.id);

      // Rep creates a task
      const { data: repTask, error: repError } = await repClient
        .from('tasks')
        .insert({
          title: 'Rep Task',
          created_by: repUser.salesId,
        })
        .select()
        .single();

      expect(repError).toBeNull();
      testData.taskIds.push(repTask!.id);

      // Admin can see their own task
      const { data: adminTasks } = await adminClient
        .from('tasks')
        .select()
        .eq('id', adminTask!.id);

      expect(adminTasks).toHaveLength(1);
      expect(adminTasks![0].title).toBe('Admin Task');

      // Admin cannot see rep's task
      const { data: adminCannotSeeRep } = await adminClient
        .from('tasks')
        .select()
        .eq('id', repTask!.id);

      expect(adminCannotSeeRep).toEqual([]);

      // Rep can see their own task
      const { data: repTasks } = await repClient
        .from('tasks')
        .select()
        .eq('id', repTask!.id);

      expect(repTasks).toHaveLength(1);
      expect(repTasks![0].title).toBe('Rep Task');

      // Rep cannot see admin's task
      const { data: repCannotSeeAdmin } = await repClient
        .from('tasks')
        .select()
        .eq('id', adminTask!.id);

      expect(repCannotSeeAdmin).toEqual([]);
    });

    it('users can only INSERT tasks for themselves', async () => {
      // Rep tries to create task for admin (should fail or auto-correct to rep's sales_id)
      const { data: task, error } = await repClient
        .from('tasks')
        .insert({
          title: 'Rep Task',
          created_by: repUser.salesId, // Should match current user
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(task!.created_by).toBe(repUser.salesId);
      testData.taskIds.push(task!.id);
    });

    it('users can only UPDATE their own tasks', async () => {
      // Create task as rep
      const { data: task, error: insertError } = await repClient
        .from('tasks')
        .insert({
          title: 'Rep Task',
          created_by: repUser.salesId,
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      testData.taskIds.push(task!.id);

      // Rep can update their own task
      const { data: updated, error: updateError } = await repClient
        .from('tasks')
        .update({ title: 'Updated Rep Task' })
        .eq('id', task!.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updated!.title).toBe('Updated Rep Task');

      // Admin cannot update rep's task
      const { data: adminUpdate, error: adminUpdateError } = await adminClient
        .from('tasks')
        .update({ title: 'Hacked Task' })
        .eq('id', task!.id)
        .select();

      expect(adminUpdate).toEqual([]);

      // Verify task was not updated by admin
      const { data: verified } = await repClient
        .from('tasks')
        .select('title')
        .eq('id', task!.id)
        .single();

      expect(verified!.title).toBe('Updated Rep Task');
    });

    it('users can only DELETE their own tasks', async () => {
      // Create task as rep
      const { data: task, error: insertError } = await repClient
        .from('tasks')
        .insert({
          title: 'Rep Task',
          created_by: repUser.salesId,
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      const taskId = task!.id;

      // Admin cannot delete rep's task
      const { error: adminDeleteError } = await adminClient
        .from('tasks')
        .delete()
        .eq('id', taskId);

      expect(adminDeleteError).toBeNull();

      // Verify task still exists
      const { data: stillExists } = await repClient
        .from('tasks')
        .select()
        .eq('id', taskId);

      expect(stillExists).toHaveLength(1);

      // Rep can delete their own task
      const { error: repDeleteError } = await repClient
        .from('tasks')
        .delete()
        .eq('id', taskId);

      expect(repDeleteError).toBeNull();

      // Verify task is deleted
      const { data: deleted } = await repClient
        .from('tasks')
        .select()
        .eq('id', taskId);

      expect(deleted).toEqual([]);
    });
  });
});
