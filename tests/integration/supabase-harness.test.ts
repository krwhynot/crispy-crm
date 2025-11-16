import { describe, it, expect, afterEach } from 'vitest';
import { createTestHarness } from './supabase-harness';

describe('Supabase Test Harness', () => {
  let harness: Awaited<ReturnType<typeof createTestHarness>>;

  afterEach(async () => {
    if (harness) {
      await harness.cleanup();
    }
  });

  it('creates and cleans up test organizations', async () => {
    harness = await createTestHarness();

    // Create test org
    const { data, error } = await harness.client
      .from('organizations')
      .insert({ name: 'Test Org', org_type: 'customer' })
      .select();

    console.log('Insert result:', { data, error });
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.[0]?.id).toBeDefined();
    harness.seedData.organizationIds.push(data![0].id);

    // Cleanup should remove it
    await harness.cleanup();

    const { data: check } = await harness.client
      .from('organizations')
      .select('id')
      .eq('id', data!.id)
      .maybeSingle();

    expect(check).toBeNull();
  });
});
