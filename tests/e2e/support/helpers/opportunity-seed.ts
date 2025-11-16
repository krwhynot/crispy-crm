import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export interface OpportunitySeedData {
  opportunityIds: number[];
  opportunities: {
    id: number;
    name: string;
    organization_id: number;
    stage: string;
  }[];
}

export interface OpportunitySeedHelper {
  client: SupabaseClient;
  seedData: OpportunitySeedData;
  cleanup: () => Promise<void>;
}

/**
 * Creates deterministic test opportunities for E2E testing
 * Uses admin@test.com credentials from seed.sql
 *
 * Creates 3 predictable opportunities:
 * - Test Opportunity Alpha (Qualification stage)
 * - Test Opportunity Beta (Proposal stage)
 * - Test Opportunity Gamma (Negotiation stage)
 */
export async function createOpportunitySeedHelper(): Promise<OpportunitySeedHelper> {
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

  // Get sales rep ID for admin@test.com (from seed.sql, id: 1)
  const { data: salesData, error: salesError } = await client
    .from('sales')
    .select('id')
    .eq('email', 'admin@test.com')
    .single();

  if (salesError || !salesData) {
    throw new Error('Failed to get sales rep ID for test user');
  }

  const salesId = salesData.id;

  // A&W organization from seed.sql (id: 12, customer type)
  const organizationId = 12;

  // Create deterministic test opportunities
  const opportunities = [
    {
      name: 'Test Opportunity Alpha',
      organization_id: organizationId,
      stage: 'Qualification',
      sales_id: salesId,
      value: 10000,
      probability: 25,
    },
    {
      name: 'Test Opportunity Beta',
      organization_id: organizationId,
      stage: 'Proposal',
      sales_id: salesId,
      value: 25000,
      probability: 50,
    },
    {
      name: 'Test Opportunity Gamma',
      organization_id: organizationId,
      stage: 'Negotiation',
      sales_id: salesId,
      value: 50000,
      probability: 75,
    },
  ];

  // First cleanup any existing test opportunities with these names
  await client
    .from('opportunities')
    .delete()
    .in('name', opportunities.map(o => o.name));

  // Insert test opportunities
  const { data: insertedData, error: insertError } = await client
    .from('opportunities')
    .insert(opportunities)
    .select('id, name, organization_id, stage');

  if (insertError || !insertedData) {
    throw new Error(`Failed to create test opportunities: ${insertError?.message}`);
  }

  const seedData: OpportunitySeedData = {
    opportunityIds: insertedData.map(o => o.id),
    opportunities: insertedData,
  };

  const cleanup = async () => {
    if (seedData.opportunityIds.length > 0) {
      await client
        .from('opportunities')
        .delete()
        .in('id', seedData.opportunityIds);
    }
  };

  return { client, seedData, cleanup };
}

/**
 * Quick cleanup function for test teardown
 * Removes all test opportunities by name pattern
 */
export async function cleanupTestOpportunities(client: SupabaseClient): Promise<void> {
  // Delete any opportunities starting with "Test Opportunity"
  await client
    .from('opportunities')
    .delete()
    .like('name', 'Test Opportunity%');

  // Also cleanup timestamp-based test data
  await client
    .from('opportunities')
    .delete()
    .or('name.like.%Test %,name.like.Complete Opportunity%,name.like.Read Test%,name.like.Update Test%,name.like.Delete Test%,name.like.Concurrent Test%');
}
