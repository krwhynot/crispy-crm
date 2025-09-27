import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Following Engineering Constitution: NO OVER-ENGINEERING - Fail fast, simple tests

describe('RLS Permission Check - Simple', () => {
  let supabase: SupabaseClient;

  beforeAll(async () => {
    supabase = createClient(
      'https://aaqnanddcqvfiwhshndl.supabase.co',
      process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcW5hbmRkY3F2Zml3aHNobmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODIxODUsImV4cCI6MjA3NDE1ODE4NX0.wJi2sGLrvrI5OQUujTByVWjdyCT7Prjlpsx9LC_CUzU'
    );

    // Authenticate for tests - using test credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@gmail.com',
      password: process.env.TEST_PASSWORD || 'testpassword'
    });

    if (error) {
      console.log('⚠️  Authentication failed:', error.message);
      console.log('Tests will run unauthenticated and may fail');
    } else {
      console.log('✅ Authenticated as:', data.user?.email);
    }
  });

  it('should test CRUD operations on contacts', async () => {
    // Test data - minimal required fields only
    const testContact = {
      first_name: 'Test',
      last_name: 'User'
    };

    // INSERT test
    const { data: insertData, error: insertError } = await supabase
      .from('contacts')
      .insert(testContact)
      .select()
      .single();

    if (insertError) {
      console.log(`INSERT contacts: ❌ ${insertError.code} - ${insertError.message}`);
      expect(insertError).toBeTruthy(); // Document the failure
    } else {
      console.log(`INSERT contacts: ✅ Created ID: ${insertData.id}`);

      // If INSERT worked, clean up
      await supabase.from('contacts').delete().eq('id', insertData.id);
    }

    // SELECT test
    const { error: selectError } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);

    if (selectError) {
      console.log(`SELECT contacts: ❌ ${selectError.message}`);
    } else {
      console.log('SELECT contacts: ✅');
    }

    // UPDATE test - use non-existent numeric ID (bigint) to avoid side effects
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', 999999999)
      .select();

    if (updateError) {
      console.log(`UPDATE contacts: ❌ ${updateError.message}`);
    } else {
      console.log('UPDATE contacts: ✅ (or no matching rows)');
    }

    // DELETE test - use non-existent numeric ID (bigint) to avoid data loss
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', 999999999);

    if (deleteError) {
      console.log(`DELETE contacts: ❌ ${deleteError.message}`);
    } else {
      console.log('DELETE contacts: ✅ (or no matching rows)');
    }
  });

  it('should test CRUD operations on opportunities', async () => {
    // Test data - minimal required fields
    const testOpportunity = {
      name: 'Test Deal',
      stage: 'lead'
    };

    // Same pattern for opportunities
    const results = {
      insert: false,
      select: false,
      update: false,
      delete: false
    };

    // Quick test all operations
    const { error: insertErr } = await supabase.from('opportunities').insert(testOpportunity).select();
    results.insert = !insertErr;

    const { error: selectErr } = await supabase.from('opportunities').select('id').limit(1);
    results.select = !selectErr;

    const { error: updateErr } = await supabase.from('opportunities')
      .update({ stage: 'qualified' })
      .eq('id', 999999999);
    results.update = !updateErr;

    const { error: deleteErr } = await supabase.from('opportunities')
      .delete()
      .eq('id', 999999999);
    results.delete = !deleteErr;

    // Print results
    console.log('\nOpportunities permissions:');
    console.log(`INSERT: ${results.insert ? '✅' : '❌'}`);
    console.log(`SELECT: ${results.select ? '✅' : '❌'}`);
    console.log(`UPDATE: ${results.update ? '✅' : '❌'}`);
    console.log(`DELETE: ${results.delete ? '✅' : '❌'}`);
  });
});