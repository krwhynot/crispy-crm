#!/usr/bin/env node

/**
 * Seed database from the merged and cleaned CSV
 * Imports from organizations_contacts_final.csv
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Seeding Database from Merged CSV...\n');

/**
 * Import organizations and contacts from merged CSV
 */
async function seedFromMergedCSV() {
  try {
    const csvPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_final.csv');
    console.log('📂 Reading merged CSV...');

    const content = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data;
    console.log(`   Found ${rows.length} rows in merged CSV\n`);

    // Extract unique organizations
    console.log('📊 Extracting organizations...');
    const orgMap = new Map();

    for (const row of rows) {
      const orgName = row.org_name;
      if (!orgName || orgMap.has(orgName)) continue;

      orgMap.set(orgName, {
        name: orgName,
        organization_type: row.org_type || 'unknown',
        priority: row.org_priority || null,
        notes: row.org_notes || null,
        phone: row.org_phone || null,
        linkedin_url: row.org_linkedin || null,
        address: row.org_address || null,
        city: row.org_city || null,
        state: row.org_state || null,
        postal_code: row.org_postal_code || null,
      });
    }

    const organizations = Array.from(orgMap.values());
    console.log(`   Extracted ${organizations.length} unique organizations\n`);

    // Valid organization types
    const validTypes = ['customer', 'distributor', 'principal', 'partner', 'competitor', 'unknown'];

    // Normalize organization types
    const normalizedOrgs = organizations.map(org => {
      let orgType = (org.organization_type || 'unknown').toLowerCase();
      if (!validTypes.includes(orgType)) {
        orgType = 'unknown';
      }
      return { ...org, organization_type: orgType };
    });

    // Insert organizations in batches
    console.log('💾 Inserting organizations...');
    const batchSize = 100;
    let insertedOrgs = 0;

    for (let i = 0; i < normalizedOrgs.length; i += batchSize) {
      const batch = normalizedOrgs.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('organizations')
        .insert(batch)
        .select('id, name');

      if (error) {
        console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
        throw error;
      }

      insertedOrgs += data.length;

      if (i % 500 === 0 && i > 0) {
        console.log(`   Progress: ${insertedOrgs} organizations inserted...`);
      }
    }

    console.log(`   ✅ Inserted ${insertedOrgs} organizations\n`);

    // Get organization name-to-id mapping
    console.log('🔗 Loading organization mappings...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name');

    if (orgError) {
      console.error('   ❌ Error loading organizations:', orgError.message);
      throw orgError;
    }

    const orgNameToId = new Map(orgs.map(org => [org.name, org.id]));
    console.log(`   Loaded ${orgNameToId.size} organization mappings\n`);

    // Extract contacts with organization links
    console.log('📊 Extracting contacts...');
    const contacts = [];

    for (const row of rows) {
      const orgName = row.org_name;
      const contactName = row.contact_full_name;

      // Skip rows without contact information
      if (!contactName && !row.contact_email && !row.contact_phone) {
        continue;
      }

      // Skip if organization not found
      if (!orgNameToId.has(orgName)) {
        continue;
      }

      const contact = {
        organization_id: orgNameToId.get(orgName),
        name: contactName || null,
        first_name: row.contact_first_name || null,
        last_name: row.contact_last_name || null,
        title: row.contact_title || null,
        email: row.contact_email || null,
        phone: row.contact_phone || null,
        linkedin_url: row.contact_linkedin || null,
        address: row.contact_address || null,
        city: row.contact_city || null,
        state: row.contact_state || null,
        postal_code: row.contact_postal_code || null,
        notes: row.contact_notes || null,
      };

      contacts.push(contact);
    }

    console.log(`   Extracted ${contacts.length} contacts\n`);

    // Insert contacts in batches
    console.log('💾 Inserting contacts...');
    let insertedContacts = 0;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('contacts')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
        throw error;
      }

      insertedContacts += data.length;

      if (i % 500 === 0 && i > 0) {
        console.log(`   Progress: ${insertedContacts} contacts inserted...`);
      }
    }

    console.log(`   ✅ Inserted ${insertedContacts} contacts\n`);

    // Summary
    console.log('✨ Seed Complete!\n');
    console.log('Summary:');
    console.log(`  Organizations: ${insertedOrgs}`);
    console.log(`  Contacts: ${insertedContacts}`);
    console.log('\n🎉 Database seeded successfully with merged CSV data!');

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedFromMergedCSV();
