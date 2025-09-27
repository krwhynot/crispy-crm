import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Debug test to understand why INSERT/DELETE operations are being denied
 * despite having proper RLS policies and GRANT permissions
 */

describe('RLS Permission Debugging', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    const url = process.env.VITE_SUPABASE_URL || 'https://aaqnanddcqvfiwhshndl.supabase.co';
    const key = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
    supabase = createClient(url, key);
  });

  describe('Detailed Permission Tests', () => {
    it('should reveal why INSERT is failing for contacts', async () => {
      console.log('\n=== Testing INSERT on contacts table ===');

      // Try different INSERT scenarios to understand the failure
      const testCases = [
        {
          name: 'Empty insert (testing RLS)',
          data: {},
          description: 'Tests pure RLS without data constraints'
        },
        {
          name: 'Minimal valid data',
          data: {
            first_name: 'Test',
            last_name: 'User'
          },
          description: 'Only required fields'
        },
        {
          name: 'Complete data',
          data: {
            first_name: 'Test',
            last_name: 'User',
            email_addresses: { primary: 'test@example.com' },
            phone_numbers: { primary: '+1234567890' }
          },
          description: 'All common fields'
        }
      ];

      for (const testCase of testCases) {
        console.log(`\nTest: ${testCase.name}`);
        console.log(`Description: ${testCase.description}`);

        const { data, error } = await supabase
          .from('contacts')
          .insert(testCase.data)
          .select();

        if (error) {
          console.log(`❌ Failed: ${error.message}`);
          console.log(`   Code: ${error.code}`);
          console.log(`   Details: ${JSON.stringify(error.details || 'none')}`);
          console.log(`   Hint: ${error.hint || 'none'}`);

          // Analyze the error
          if (error.code === '42501') {
            console.log('   → This is a permission error (GRANT issue)');
          } else if (error.code === '23502') {
            console.log('   → NOT NULL constraint violation');
          } else if (error.code === '23503') {
            console.log('   → Foreign key constraint violation');
          } else if (error.message.includes('new row violates row-level security policy')) {
            console.log('   → RLS policy rejection');
          }
        } else {
          console.log(`✅ Success: Created record with ID ${data?.[0]?.id}`);

          // Clean up test data
          if (data?.[0]?.id) {
            await supabase.from('contacts').delete().eq('id', data[0].id);
          }
        }
      }
    });

    it('should reveal why DELETE is failing for contacts', async () => {
      console.log('\n=== Testing DELETE on contacts table ===');

      // First, try to create a record that we can delete
      const { data: insertData, error: insertError } = await supabase
        .from('contacts')
        .insert({ first_name: 'Delete', last_name: 'Test' })
        .select()
        .single();

      if (insertError) {
        console.log('Cannot test DELETE - INSERT failed first:', insertError.message);
        return;
      }

      const recordId = insertData?.id;
      console.log(`Created test record: ${recordId}`);

      // Now try to delete it
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        console.log(`❌ DELETE Failed: ${deleteError.message}`);
        console.log(`   Code: ${deleteError.code}`);
        console.log(`   Details: ${JSON.stringify(deleteError.details || 'none')}`);

        // Try to understand why
        if (deleteError.code === '42501') {
          console.log('   → Permission denied at table level');
        } else if (deleteError.message.includes('row-level security policy')) {
          console.log('   → RLS policy blocked the deletion');
        }
      } else {
        console.log('✅ DELETE succeeded');
      }
    });

    it('should test with a non-existent ID to see error behavior', async () => {
      console.log('\n=== Testing operations with non-existent IDs ===');

      const fakeId = '00000000-0000-0000-0000-000000000000';

      // UPDATE with fake ID
      const { data: updateData, error: updateError } = await supabase
        .from('contacts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', fakeId)
        .select();

      console.log('UPDATE with non-existent ID:');
      if (updateError) {
        console.log(`   Error: ${updateError.message}`);
      } else if (!updateData || updateData.length === 0) {
        console.log('   No error but no rows affected (this is normal)');
      }

      // DELETE with fake ID
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', fakeId);

      console.log('DELETE with non-existent ID:');
      if (deleteError) {
        console.log(`   Error: ${deleteError.message}`);
      } else {
        console.log('   No error (even though no rows were deleted)');
      }
    });

    it('should check the actual auth session and token', async () => {
      console.log('\n=== Checking Authentication Context ===');

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.log('❌ Auth error:', error.message);
        return;
      }

      if (!session) {
        console.log('❌ No active session - this explains the permission issues!');
        console.log('   The tests are running without authentication');
        return;
      }

      console.log('✅ Session found');
      console.log(`   User ID: ${session.user.id}`);
      console.log(`   Email: ${session.user.email}`);

      // Decode the JWT to check the role
      const token = session.access_token;
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log(`   Token Role: ${payload.role}`);
        console.log(`   Token Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);

        if (payload.role !== 'authenticated') {
          console.log('   ⚠️  Token role is not "authenticated" - this will cause issues!');
        }
      }
    });
  });

  describe('RLS Policy Verification', () => {
    it('should verify RLS is enabled on tables', async () => {
      console.log('\n=== Verifying RLS Status ===');

      // This query will fail if we're not authenticated properly
      const { data, error } = await supabase
        .rpc('get_table_rls_status', {
          table_names: ['contacts', 'opportunities', 'companies', 'tasks']
        })
        .single();

      if (error) {
        // Try a simpler approach
        const tables = ['contacts', 'opportunities', 'companies', 'tasks'];

        for (const table of tables) {
          const { error: tableError } = await supabase
            .from(table)
            .select('id')
            .limit(0);

          if (tableError && tableError.message.includes('row-level security')) {
            console.log(`✅ ${table}: RLS is enabled`);
          } else if (tableError) {
            console.log(`⚠️  ${table}: Error - ${tableError.message}`);
          } else {
            console.log(`✅ ${table}: Accessible`);
          }
        }
      }
    });
  });

  describe('Matrix Permission Test', () => {
    it('should test all CRUD operations systematically', async () => {
      console.log('\n=== CRUD Permission Matrix ===');

      const operations = [
        {
          name: 'SELECT',
          test: (table: string) => supabase.from(table).select('id').limit(1)
        },
        {
          name: 'INSERT',
          test: (table: string) => {
            const data = table === 'contacts'
              ? { first_name: 'Test', last_name: 'User' }
              : { name: 'Test Item' };
            return supabase.from(table).insert(data).select();
          }
        },
        {
          name: 'UPDATE',
          test: (table: string) => supabase
            .from(table)
            .update({ updated_at: new Date().toISOString() })
            .eq('id', '00000000-0000-0000-0000-000000000000')
            .select()
        },
        {
          name: 'DELETE',
          test: (table: string) => supabase
            .from(table)
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000')
        }
      ];

      const tables = ['contacts', 'opportunities'];

      console.log('Table        | SELECT | INSERT | UPDATE | DELETE |');
      console.log('-------------|--------|--------|--------|--------|');

      for (const table of tables) {
        const results: string[] = [];

        for (const op of operations) {
          const { error } = await op.test(table);

          if (!error || error.code === 'PGRST116') {
            // PGRST116 = "no rows returned" which is OK for our test
            results.push('  ✅  ');
          } else if (error.code === '42501' || error.message.includes('violates row-level security')) {
            results.push('  ❌  ');
          } else {
            results.push('  ⚠️  ');
          }
        }

        console.log(`${table.padEnd(12)} | ${results.join(' | ')} |`);
      }
    });
  });
});

// Helper to decode JWT tokens
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}