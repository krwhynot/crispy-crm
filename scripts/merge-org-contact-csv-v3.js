#!/usr/bin/env node

/**
 * FINAL Merge organizations and contacts CSV files using PapaParse
 *
 * This version uses a proper CSV library to handle JSONB data correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Merging Organizations and Contacts CSV files (v3 - PapaParse)...\n');

/**
 * Main merge function
 */
async function mergeCSVs() {
  try {
    // Read and parse organizations CSV with PapaParse
    const orgsPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_final.csv');
    console.log('📂 Reading organizations CSV...');
    const orgsContent = fs.readFileSync(orgsPath, 'utf-8');
    const orgsParsed = Papa.parse(orgsContent, {
      header: true,
      skipEmptyLines: true,
    });
    const organizations = orgsParsed.data;
    console.log(`   Found ${organizations.length} organizations\n`);

    // Read and parse contacts CSV with PapaParse
    const contactsPath = path.join(__dirname, '..', 'data', 'migration-output', 'contacts_final.csv');
    console.log('📂 Reading contacts CSV...');
    const contactsContent = fs.readFileSync(contactsPath, 'utf-8');
    const contactsParsed = Papa.parse(contactsContent, {
      header: true,
      skipEmptyLines: true,
    });
    const contacts = contactsParsed.data;
    console.log(`   Found ${contacts.length} contacts\n`);

    // Group contacts by organization
    console.log('🔗 Grouping contacts by organization...');
    const contactsByOrg = new Map();

    for (const contact of contacts) {
      const orgName = contact.organization_name;
      if (!orgName) continue;

      if (!contactsByOrg.has(orgName)) {
        contactsByOrg.set(orgName, []);
      }
      contactsByOrg.get(orgName).push(contact);
    }

    console.log(`   Grouped contacts into ${contactsByOrg.size} organizations\n`);

    // Create merged data
    console.log('🔧 Creating merged data...');

    const mergedRows = [];
    let contactsAdded = 0;

    for (const org of organizations) {
      const orgContacts = contactsByOrg.get(org.name) || [];

      if (orgContacts.length > 0) {
        // Add row for each contact
        for (const contact of orgContacts) {
          mergedRows.push({
            // Organization data
            org_name: org.name || '',
            org_type: org.organization_type || '',
            org_priority: org.priority || '',
            org_segment: org.segment_name || '',
            org_phone: org.phone || '',
            org_linkedin: org.linkedin_url || '',
            org_address: org.address || '',
            org_city: org.city || '',
            org_state: org.state || '',
            org_postal_code: org.postal_code || '',
            org_notes: org.notes || '',
            org_primary_manager: org.primary_account_manager || '',
            org_secondary_manager: org.secondary_account_manager || '',
            // Contact data
            contact_first_name: contact.first_name || '',
            contact_last_name: contact.last_name || '',
            contact_full_name: contact.name || '',
            contact_title: contact.title || '',
            contact_email: contact.email || '',
            contact_phone: contact.phone || '',
            contact_linkedin: contact.linkedin_url || '',
            contact_address: contact.address || '',
            contact_city: contact.city || '',
            contact_state: contact.state || '',
            contact_postal_code: contact.postal_code || '',
            contact_notes: contact.notes || '',
            contact_account_manager: contact.account_manager || '',
          });
          contactsAdded++;
        }
      } else {
        // Add organization without contacts
        mergedRows.push({
          // Organization data
          org_name: org.name || '',
          org_type: org.organization_type || '',
          org_priority: org.priority || '',
          org_segment: org.segment_name || '',
          org_phone: org.phone || '',
          org_linkedin: org.linkedin_url || '',
          org_address: org.address || '',
          org_city: org.city || '',
          org_state: org.state || '',
          org_postal_code: org.postal_code || '',
          org_notes: org.notes || '',
          org_primary_manager: org.primary_account_manager || '',
          org_secondary_manager: org.secondary_account_manager || '',
          // Empty contact data
          contact_first_name: '',
          contact_last_name: '',
          contact_full_name: '',
          contact_title: '',
          contact_email: '',
          contact_phone: '',
          contact_linkedin: '',
          contact_address: '',
          contact_city: '',
          contact_state: '',
          contact_postal_code: '',
          contact_notes: '',
          contact_account_manager: '',
        });
      }
    }

    console.log(`   Created ${mergedRows.length} merged rows (${contactsAdded} with contacts)\n`);

    // Write merged CSV using PapaParse (handles escaping automatically)
    const outputPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_merged_v3.csv');
    console.log('💾 Writing merged CSV with PapaParse...');

    const csv = Papa.unparse(mergedRows, {
      quotes: true, // Quote all fields for safety
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      header: true,
      newline: '\n',
    });

    fs.writeFileSync(outputPath, csv, 'utf-8');

    console.log(`   ✅ Wrote ${mergedRows.length} rows to organizations_contacts_merged_v3.csv\n`);

    // Verify output
    console.log('🔍 Verifying output quality...');
    const verifyContent = fs.readFileSync(outputPath, 'utf-8');
    const verifyParsed = Papa.parse(verifyContent, {
      header: true,
      skipEmptyLines: true,
    });

    console.log(`   Headers: ${verifyParsed.meta.fields.length} columns (expected 26)`);
    console.log(`   Rows: ${verifyParsed.data.length} (expected ${mergedRows.length})`);

    // Check for parsing errors
    if (verifyParsed.errors.length > 0) {
      console.log(`   ⚠️  ${verifyParsed.errors.length} parsing errors:`);
      verifyParsed.errors.slice(0, 5).forEach(err => {
        console.log(`      Row ${err.row}: ${err.message}`);
      });
    } else {
      console.log(`   ✅ No parsing errors detected`);
    }

    // Statistics
    console.log('\n📊 Merge Statistics:');
    console.log(`   Total organizations: ${organizations.length}`);
    console.log(`   Organizations with contacts: ${contactsByOrg.size}`);
    console.log(`   Organizations without contacts: ${organizations.length - contactsByOrg.size}`);
    console.log(`   Total contacts: ${contactsAdded}`);
    console.log(`   Total merged rows: ${mergedRows.length}`);

    console.log('\n✨ Merge complete!');
    console.log(`📁 Output file: data/migration-output/organizations_contacts_merged_v3.csv\n`);

  } catch (error) {
    console.error('\n❌ Merge failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

mergeCSVs();
