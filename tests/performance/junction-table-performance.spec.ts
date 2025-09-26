import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Performance thresholds for junction table operations (in milliseconds)
const JUNCTION_THRESHOLDS = {
  contactOrgJoin: 200,           // Contact-Organization many-to-many join
  opportunityParticipantJoin: 250, // Opportunity participants join
  interactionParticipantJoin: 150, // Interaction participants join
  multiTableJoin: 400,           // Multiple junction tables joined
  bulkInsert: 500,               // Bulk insert into junction table
  bulkUpdate: 600,               // Bulk update junction records
  complexFilter: 300,            // Complex filtering on junction data
};

interface JunctionPerformanceResult {
  operation: string;
  tableName: string;
  executionTime: number;
  recordCount: number;
  threshold: number;
  passed: boolean;
  joinComplexity: string;
}

describe('Junction Table Performance Tests', () => {
  const results: JunctionPerformanceResult[] = [];
  let testContactIds: string[] = [];
  let testOrgIds: string[] = [];
  let testOpportunityIds: string[] = [];
  let testActivityIds: string[] = [];
  let testSalesId: string;

  beforeAll(async () => {
    console.log('Setting up junction table test data...');

    // Create test sales person
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .insert([{
        first_name: 'Junction',
        last_name: 'Tester',
        email: 'junction.test@example.com'
      }])
      .select('id')
      .single();

    if (salesError) throw salesError;
    testSalesId = sales.id;

    // Create test organizations
    const organizations = Array(100).fill(null).map((_, i) => ({
      name: `Junction Test Org ${i}`,
      organization_type: ['customer', 'principal', 'distributor', 'partner'][i % 4],
      sector: faker.company.buzzNoun(),
      size: [1, 10, 50, 250, 500][i % 5],
      sales_id: testSalesId
    }));

    const { data: orgs, error: orgError } = await supabase
      .from('companies')
      .insert(organizations)
      .select('id');

    if (orgError) throw orgError;
    testOrgIds = orgs.map(o => o.id);

    // Create test contacts
    const contacts = Array(500).fill(null).map((_, i) => ({
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: [{ email: faker.internet.email(), type: 'Work' }],
      sales_id: testSalesId
    }));

    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .insert(contacts)
      .select('id');

    if (contactError) throw contactError;
    testContactIds = contactData.map(c => c.id);

    // Create contact-organization relationships (many-to-many)
    const contactOrgRelationships = [];
    for (let i = 0; i < testContactIds.length; i++) {
      // Each contact associated with 1-5 organizations
      const numOrgs = Math.floor(Math.random() * 5) + 1;
      const orgIndices = new Set<number>();

      while (orgIndices.size < numOrgs) {
        orgIndices.add(Math.floor(Math.random() * testOrgIds.length));
      }

      for (const orgIndex of orgIndices) {
        contactOrgRelationships.push({
          contact_id: testContactIds[i],
          organization_id: testOrgIds[orgIndex],
          is_primary: orgIndices.size === 1 || Math.random() > 0.7,
          purchase_influence: ['High', 'Medium', 'Low', 'Unknown'][Math.floor(Math.random() * 4)],
          decision_authority: ['Decision Maker', 'Influencer', 'End User', 'Gatekeeper'][Math.floor(Math.random() * 4)],
          role: ['decision_maker', 'influencer', 'buyer', 'end_user', 'gatekeeper', 'champion'][Math.floor(Math.random() * 6)]
        });
      }
    }

    // Insert contact-organization relationships in batches
    const batchSize = 100;
    for (let i = 0; i < contactOrgRelationships.length; i += batchSize) {
      const batch = contactOrgRelationships.slice(i, i + batchSize);
      const { error } = await supabase
        .from('contact_organizations')
        .insert(batch);

      if (error) console.error('Error inserting contact-org batch:', error);
    }

    console.log(`Created ${contactOrgRelationships.length} contact-organization relationships`);

    // Create test opportunities
    const opportunities = Array(200).fill(null).map((_, i) => ({
      name: `Junction Test Opportunity ${i}`,
      customer_organization_id: testOrgIds[i % testOrgIds.length],
      principal_organization_id: i % 3 === 0 ? testOrgIds[(i + 1) % testOrgIds.length] : null,
      distributor_organization_id: i % 4 === 0 ? testOrgIds[(i + 2) % testOrgIds.length] : null,
      stage: ['lead', 'qualified', 'proposal', 'negotiation'][i % 4],
      status: 'active',
      priority: ['low', 'medium', 'high', 'critical'][i % 4],
      amount: faker.number.float({ min: 1000, max: 100000 }),
      sales_id: testSalesId,
      expected_closing_date: faker.date.future().toISOString()
    }));

    const { data: oppData, error: oppError } = await supabase
      .from('opportunities')
      .insert(opportunities)
      .select('id');

    if (oppError) throw oppError;
    testOpportunityIds = oppData.map(o => o.id);

    // Create opportunity participants
    const opportunityParticipants = [];
    for (let i = 0; i < testOpportunityIds.length; i++) {
      // Each opportunity has 2-4 participants
      const numParticipants = Math.floor(Math.random() * 3) + 2;
      const usedOrgs = new Set<string>();

      for (let j = 0; j < numParticipants; j++) {
        const orgId = testOrgIds[(i * j) % testOrgIds.length];
        if (!usedOrgs.has(orgId)) {
          usedOrgs.add(orgId);
          opportunityParticipants.push({
            opportunity_id: testOpportunityIds[i],
            organization_id: orgId,
            role: ['customer', 'principal', 'distributor', 'partner', 'competitor'][j % 5],
            is_primary: j === 0,
            commission_rate: j === 1 ? faker.number.float({ min: 0, max: 20 }) : null,
            territory: faker.location.country(),
            notes: faker.lorem.sentence()
          });
        }
      }
    }

    // Insert opportunity participants in batches
    for (let i = 0; i < opportunityParticipants.length; i += batchSize) {
      const batch = opportunityParticipants.slice(i, i + batchSize);
      const { error } = await supabase
        .from('opportunity_participants')
        .insert(batch);

      if (error) console.error('Error inserting opportunity participants batch:', error);
    }

    console.log(`Created ${opportunityParticipants.length} opportunity participants`);

    // Create test activities
    const activities = Array(300).fill(null).map((_, i) => ({
      activity_type: i % 2 === 0 ? 'engagement' : 'interaction',
      type: ['call', 'email', 'meeting', 'demo'][i % 4],
      subject: `Test Activity ${i}`,
      activity_date: faker.date.recent().toISOString(),
      contact_id: testContactIds[i % testContactIds.length],
      organization_id: testOrgIds[i % testOrgIds.length],
      opportunity_id: i % 2 === 1 ? testOpportunityIds[i % testOpportunityIds.length] : null,
      created_by: testSalesId
    }));

    const { data: actData, error: actError } = await supabase
      .from('activities')
      .insert(activities)
      .select('id');

    if (actError) throw actError;
    testActivityIds = actData.map(a => a.id);

    // Create interaction participants
    const interactionParticipants = [];
    for (let i = 0; i < testActivityIds.length; i++) {
      // Each activity has 1-3 participants
      const numParticipants = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < numParticipants; j++) {
        interactionParticipants.push({
          activity_id: testActivityIds[i],
          contact_id: j % 2 === 0 ? testContactIds[(i + j) % testContactIds.length] : null,
          organization_id: testOrgIds[(i + j) % testOrgIds.length],
          role: ['organizer', 'attendee', 'optional'][j % 3],
          notes: faker.lorem.sentence()
        });
      }
    }

    // Insert interaction participants in batches
    for (let i = 0; i < interactionParticipants.length; i += batchSize) {
      const batch = interactionParticipants.slice(i, i + batchSize);
      const { error } = await supabase
        .from('interaction_participants')
        .insert(batch);

      if (error) console.error('Error inserting interaction participants batch:', error);
    }

    console.log(`Created ${interactionParticipants.length} interaction participants`);
  });

  afterAll(async () => {
    console.log('Cleaning up junction table test data...');

    // Clean up in reverse order of dependencies
    await supabase.from('interaction_participants').delete().in('activity_id', testActivityIds);
    await supabase.from('opportunity_participants').delete().in('opportunity_id', testOpportunityIds);
    await supabase.from('contact_organizations').delete().in('contact_id', testContactIds);
    await supabase.from('activities').delete().in('id', testActivityIds);
    await supabase.from('opportunities').delete().in('id', testOpportunityIds);
    await supabase.from('contacts').delete().in('id', testContactIds);
    await supabase.from('companies').delete().in('id', testOrgIds);
    await supabase.from('sales').delete().eq('id', testSalesId);

    // Print performance summary
    console.log('\n=== Junction Table Performance Summary ===\n');
    console.table(results.map(r => ({
      'Operation': r.operation,
      'Table': r.tableName,
      'Time (ms)': r.executionTime.toFixed(2),
      'Threshold (ms)': r.threshold,
      'Records': r.recordCount,
      'Complexity': r.joinComplexity,
      'Status': r.passed ? '✅ PASS' : '❌ FAIL'
    })));
  });

  it('should efficiently join contacts with multiple organizations', async () => {
    const startTime = performance.now();

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        contact_organizations(
          organization_id,
          is_primary,
          purchase_influence,
          role,
          organization:companies(
            id,
            name,
            organization_type
          )
        )
      `)
      .limit(50);

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const totalRelationships = data?.reduce((sum, contact) =>
      sum + (contact.contact_organizations?.length || 0), 0) || 0;

    const result: JunctionPerformanceResult = {
      operation: 'Contact-Organization Join',
      tableName: 'contact_organizations',
      executionTime,
      recordCount: totalRelationships,
      threshold: JUNCTION_THRESHOLDS.contactOrgJoin,
      passed: executionTime < JUNCTION_THRESHOLDS.contactOrgJoin,
      joinComplexity: 'Many-to-Many with nested select'
    };

    results.push(result);
    expect(executionTime).toBeLessThan(JUNCTION_THRESHOLDS.contactOrgJoin);
  });

  it('should efficiently query opportunity participants', async () => {
    const startTime = performance.now();

    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        id,
        name,
        stage,
        opportunity_participants(
          role,
          is_primary,
          commission_rate,
          organization:companies(
            id,
            name,
            organization_type
          )
        )
      `)
      .eq('stage', 'proposal')
      .limit(30);

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const totalParticipants = data?.reduce((sum, opp) =>
      sum + (opp.opportunity_participants?.length || 0), 0) || 0;

    const result: JunctionPerformanceResult = {
      operation: 'Opportunity Participants Join',
      tableName: 'opportunity_participants',
      executionTime,
      recordCount: totalParticipants,
      threshold: JUNCTION_THRESHOLDS.opportunityParticipantJoin,
      passed: executionTime < JUNCTION_THRESHOLDS.opportunityParticipantJoin,
      joinComplexity: 'Many-to-Many with filters'
    };

    results.push(result);
    expect(executionTime).toBeLessThan(JUNCTION_THRESHOLDS.opportunityParticipantJoin);
  });

  it('should efficiently query interaction participants', async () => {
    const startTime = performance.now();

    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        type,
        subject,
        interaction_participants(
          role,
          contact:contacts(
            id,
            first_name,
            last_name
          ),
          organization:companies(
            id,
            name
          )
        )
      `)
      .eq('activity_type', 'interaction')
      .limit(40);

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const totalParticipants = data?.reduce((sum, activity) =>
      sum + (activity.interaction_participants?.length || 0), 0) || 0;

    const result: JunctionPerformanceResult = {
      operation: 'Interaction Participants Join',
      tableName: 'interaction_participants',
      executionTime,
      recordCount: totalParticipants,
      threshold: JUNCTION_THRESHOLDS.interactionParticipantJoin,
      passed: executionTime < JUNCTION_THRESHOLDS.interactionParticipantJoin,
      joinComplexity: 'Many-to-Many with multiple relations'
    };

    results.push(result);
    expect(executionTime).toBeLessThan(JUNCTION_THRESHOLDS.interactionParticipantJoin);
  });

  it('should handle complex multi-junction queries', async () => {
    const startTime = performance.now();

    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        organization_type,
        contact_organizations(
          contact:contacts(
            id,
            first_name,
            last_name
          )
        ),
        opportunity_participants(
          opportunity:opportunities(
            id,
            name,
            stage,
            amount
          )
        )
      `)
      .eq('organization_type', 'customer')
      .limit(20);

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const result: JunctionPerformanceResult = {
      operation: 'Multi-Junction Query',
      tableName: 'multiple',
      executionTime,
      recordCount: data?.length || 0,
      threshold: JUNCTION_THRESHOLDS.multiTableJoin,
      passed: executionTime < JUNCTION_THRESHOLDS.multiTableJoin,
      joinComplexity: 'Multiple junction tables'
    };

    results.push(result);
    expect(executionTime).toBeLessThan(JUNCTION_THRESHOLDS.multiTableJoin);
  });

  it('should handle bulk inserts into junction tables efficiently', async () => {
    const newContacts = Array(50).fill(null).map(() => ({
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: [{ email: faker.internet.email(), type: 'Work' }],
      sales_id: testSalesId
    }));

    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .insert(newContacts)
      .select('id');

    expect(contactError).toBeNull();

    // Prepare junction records
    const junctionRecords = [];
    contacts?.forEach(contact => {
      for (let i = 0; i < 3; i++) {
        junctionRecords.push({
          contact_id: contact.id,
          organization_id: testOrgIds[i],
          is_primary: i === 0,
          purchase_influence: 'Medium',
          role: 'influencer'
        });
      }
    });

    const startTime = performance.now();

    const { error } = await supabase
      .from('contact_organizations')
      .insert(junctionRecords);

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();

    // Clean up
    if (contacts) {
      await supabase.from('contact_organizations').delete().in('contact_id', contacts.map(c => c.id));
      await supabase.from('contacts').delete().in('id', contacts.map(c => c.id));
    }

    const result: JunctionPerformanceResult = {
      operation: 'Bulk Insert',
      tableName: 'contact_organizations',
      executionTime,
      recordCount: junctionRecords.length,
      threshold: JUNCTION_THRESHOLDS.bulkInsert,
      passed: executionTime < JUNCTION_THRESHOLDS.bulkInsert,
      joinComplexity: 'Batch insert operation'
    };

    results.push(result);
    expect(executionTime).toBeLessThan(JUNCTION_THRESHOLDS.bulkInsert);
  });

  it('should handle bulk updates on junction tables efficiently', async () => {
    // Get some existing junction records
    const { data: existing } = await supabase
      .from('contact_organizations')
      .select('id')
      .limit(100);

    if (!existing || existing.length === 0) {
      console.warn('No existing junction records to update');
      return;
    }

    const startTime = performance.now();

    const { error } = await supabase
      .from('contact_organizations')
      .update({
        purchase_influence: 'High',
        updated_at: new Date().toISOString()
      })
      .in('id', existing.map(e => e.id));

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();

    const result: JunctionPerformanceResult = {
      operation: 'Bulk Update',
      tableName: 'contact_organizations',
      executionTime,
      recordCount: existing.length,
      threshold: JUNCTION_THRESHOLDS.bulkUpdate,
      passed: executionTime < JUNCTION_THRESHOLDS.bulkUpdate,
      joinComplexity: 'Batch update operation'
    };

    results.push(result);
    expect(executionTime).toBeLessThan(JUNCTION_THRESHOLDS.bulkUpdate);
  });

  it('should handle complex filtering on junction data efficiently', async () => {
    const startTime = performance.now();

    const { data, error } = await supabase
      .from('contact_organizations')
      .select(`
        id,
        purchase_influence,
        is_primary,
        contact:contacts(
          id,
          first_name,
          last_name,
          email
        ),
        organization:companies(
          id,
          name,
          organization_type,
          sector
        )
      `)
      .eq('purchase_influence', 'High')
      .eq('is_primary', true)
      .eq('organization.organization_type', 'customer')
      .limit(50);

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();

    const result: JunctionPerformanceResult = {
      operation: 'Complex Filter',
      tableName: 'contact_organizations',
      executionTime,
      recordCount: data?.length || 0,
      threshold: JUNCTION_THRESHOLDS.complexFilter,
      passed: executionTime < JUNCTION_THRESHOLDS.complexFilter,
      joinComplexity: 'Filter with nested conditions'
    };

    results.push(result);
    expect(executionTime).toBeLessThan(JUNCTION_THRESHOLDS.complexFilter);
  });
});