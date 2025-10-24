#!/usr/bin/env node

/**
 * Merge organizations and contacts CSV files into one comprehensive file
 *
 * Output format: One row per organization with all its contacts as additional columns
 * or: One row per contact with full organization details included
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Merging Organizations and Contacts CSV files...\n');

/**
 * Proper CSV parser handling quoted fields
 */
function parseCSV(content) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  // Split by lines, handling quoted newlines
  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      row[header] = value === '' ? null : value;
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quotes and commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Escape CSV field
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * Main merge function
 */
async function mergeCSVs() {
  try {
    // Read organizations CSV
    const orgsPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_final.csv');
    console.log('📂 Reading organizations CSV...');
    const orgsContent = fs.readFileSync(orgsPath, 'utf-8');
    const organizations = parseCSV(orgsContent);
    console.log(`   Found ${organizations.length} organizations\n`);

    // Read contacts CSV
    const contactsPath = path.join(__dirname, '..', 'data', 'migration-output', 'contacts_final.csv');
    console.log('📂 Reading contacts CSV...');
    const contactsContent = fs.readFileSync(contactsPath, 'utf-8');
    const contacts = parseCSV(contactsContent);
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

    // Create merged CSV - one row per contact with full org details
    console.log('🔧 Creating merged CSV (one row per contact)...');

    const headers = [
      // Organization fields
      'org_name',
      'org_type',
      'org_priority',
      'org_segment',
      'org_phone',
      'org_linkedin',
      'org_address',
      'org_city',
      'org_state',
      'org_postal_code',
      'org_notes',
      'org_primary_manager',
      'org_secondary_manager',
      // Contact fields
      'contact_first_name',
      'contact_last_name',
      'contact_full_name',
      'contact_title',
      'contact_email',
      'contact_phone',
      'contact_linkedin',
      'contact_address',
      'contact_city',
      'contact_state',
      'contact_postal_code',
      'contact_notes',
      'contact_account_manager',
    ];

    const mergedRows = [];

    // Add contacts with their organization details
    let contactsAdded = 0;
    for (const org of organizations) {
      const orgContacts = contactsByOrg.get(org.name) || [];

      if (orgContacts.length > 0) {
        // Add row for each contact
        for (const contact of orgContacts) {
          mergedRows.push([
            // Organization data
            org.name,
            org.organization_type,
            org.priority,
            org.segment_name,
            org.phone,
            org.linkedin_url,
            org.address,
            org.city,
            org.state,
            org.postal_code,
            org.notes,
            org.primary_account_manager,
            org.secondary_account_manager,
            // Contact data
            contact.first_name,
            contact.last_name,
            contact.name,
            contact.title,
            contact.email,
            contact.phone,
            contact.linkedin_url,
            contact.address,
            contact.city,
            contact.state,
            contact.postal_code,
            contact.notes,
            contact.account_manager,
          ]);
          contactsAdded++;
        }
      } else {
        // Add organization without contacts
        mergedRows.push([
          // Organization data
          org.name,
          org.organization_type,
          org.priority,
          org.segment_name,
          org.phone,
          org.linkedin_url,
          org.address,
          org.city,
          org.state,
          org.postal_code,
          org.notes,
          org.primary_account_manager,
          org.secondary_account_manager,
          // Empty contact data
          '', '', '', '', '', '', '', '', '', '', '', '', '',
        ]);
      }
    }

    console.log(`   Created ${mergedRows.length} merged rows (${contactsAdded} with contacts)\n`);

    // Write merged CSV
    const outputPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_merged.csv');
    console.log('💾 Writing merged CSV...');

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...mergedRows.map(row => row.map(escapeCSV).join(','))
    ];

    fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');

    console.log(`   ✅ Wrote ${csvLines.length - 1} rows to ${outputPath}\n`);

    // Statistics
    console.log('📊 Merge Statistics:');
    console.log(`   Total organizations: ${organizations.length}`);
    console.log(`   Organizations with contacts: ${contactsByOrg.size}`);
    console.log(`   Organizations without contacts: ${organizations.length - contactsByOrg.size}`);
    console.log(`   Total contacts: ${contactsAdded}`);
    console.log(`   Total merged rows: ${mergedRows.length}`);

    console.log('\n✨ Merge complete!');
    console.log(`📁 Output file: data/migration-output/organizations_contacts_merged.csv\n`);

  } catch (error) {
    console.error('\n❌ Merge failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

mergeCSVs();
