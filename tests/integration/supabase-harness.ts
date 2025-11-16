import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export interface TestHarness {
  client: SupabaseClient;
  cleanup: () => Promise<void>;
  seedData: {
    organizationIds: number[];
    contactIds: number[];
  };
}

export async function createTestHarness(): Promise<TestHarness> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env.test');
  }

  const client = createClient(supabaseUrl, supabaseKey);

  // Authenticate with test user (required for RLS policies)
  const { error: authError } = await client.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'password123',
  });

  if (authError) {
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  const seedData = {
    organizationIds: [] as number[],
    contactIds: [] as number[],
  };

  const cleanup = async () => {
    // Delete test data in reverse dependency order
    if (seedData.contactIds.length > 0) {
      await client.from('contacts').delete().in('id', seedData.contactIds);
    }
    if (seedData.organizationIds.length > 0) {
      await client.from('organizations').delete().in('id', seedData.organizationIds);
    }
  };

  return { client, cleanup, seedData };
}
