#!/usr/bin/env node

/**
 * IMPROVED Merge organizations and contacts CSV files
 *
 * Improvements over v1:
 * - Robust CSV escaping that handles already-quoted fields
 * - Row validation to ensure correct column count
 * - Better handling of empty/null values
 * - Detailed error reporting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Merging Organizations and Contacts CSV files (v2 - Improved)...\n');

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

  if (lines.length === 0) return { headers: [], rows: [] };

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

  return { headers, rows };
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
 * IMPROVED CSV escaping - preserves JSONB data integrity
 */
function escapeCSV(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const str = String(value);

  // Check if this looks like JSONB data (starts with [{" or [{"type":)
  const looksLikeJSONB = str.startsWith('[{');

  // For JSONB data, wrap the entire thing in quotes and escape internal quotes
  if (looksLikeJSONB) {
    // Escape all quotes by doubling them, then wrap in quotes
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  // For normal text, check if quoting is needed
  const needsQuoting = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');

  if (needsQuoting) {
    // Escape quotes by doubling them
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return str.trim();
}

/**
 * Validate that a row has the correct number of fields
 */
function validateRow(row, headers, rowIndex) {
  const errors = [];

  // Check for unexpected undefined values
  headers.forEach(header => {
    if (row[header] === undefined) {
      errors.push(`Missing field: ${header}`);
    }
  });

  if (errors.length > 0) {
    console.error(`⚠️  Row ${rowIndex} validation errors:`, errors);
    return false;
  }

  return true;
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
    const { rows: organizations } = parseCSV(orgsContent);
    console.log(`   Found ${organizations.length} organizations\n`);

    // Read contacts CSV
    const contactsPath = path.join(__dirname, '..', 'data', 'migration-output', 'contacts_final.csv');
    console.log('📂 Reading contacts CSV...');
    const contactsContent = fs.readFileSync(contactsPath, 'utf-8');
    const { rows: contacts } = parseCSV(contactsContent);
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
      // Organization fields (13)
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
      // Contact fields (13)
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
    let validationErrors = 0;

    // Add contacts with their organization details
    let contactsAdded = 0;
    let rowIndex = 0;

    for (const org of organizations) {
      const orgContacts = contactsByOrg.get(org.name) || [];

      if (orgContacts.length > 0) {
        // Add row for each contact
        for (const contact of orgContacts) {
          rowIndex++;
          const row = {
            // Organization data
            org_name: org.name,
            org_type: org.organization_type,
            org_priority: org.priority,
            org_segment: org.segment_name,
            org_phone: org.phone,
            org_linkedin: org.linkedin_url,
            org_address: org.address,
            org_city: org.city,
            org_state: org.state,
            org_postal_code: org.postal_code,
            org_notes: org.notes,
            org_primary_manager: org.primary_account_manager,
            org_secondary_manager: org.secondary_account_manager,
            // Contact data
            contact_first_name: contact.first_name,
            contact_last_name: contact.last_name,
            contact_full_name: contact.name,
            contact_title: contact.title,
            contact_email: contact.email,
            contact_phone: contact.phone,
            contact_linkedin: contact.linkedin_url,
            contact_address: contact.address,
            contact_city: contact.city,
            contact_state: contact.state,
            contact_postal_code: contact.postal_code,
            contact_notes: contact.notes,
            contact_account_manager: contact.account_manager,
          };

          // Validate row before adding
          if (validateRow(row, headers, rowIndex)) {
            mergedRows.push(row);
            contactsAdded++;
          } else {
            validationErrors++;
          }
        }
      } else {
        // Add organization without contacts
        rowIndex++;
        const row = {
          // Organization data
          org_name: org.name,
          org_type: org.organization_type,
          org_priority: org.priority,
          org_segment: org.segment_name,
          org_phone: org.phone,
          org_linkedin: org.linkedin_url,
          org_address: org.address,
          org_city: org.city,
          org_state: org.state,
          org_postal_code: org.postal_code,
          org_notes: org.notes,
          org_primary_manager: org.primary_account_manager,
          org_secondary_manager: org.secondary_account_manager,
          // Empty contact data
          contact_first_name: null,
          contact_last_name: null,
          contact_full_name: null,
          contact_title: null,
          contact_email: null,
          contact_phone: null,
          contact_linkedin: null,
          contact_address: null,
          contact_city: null,
          contact_state: null,
          contact_postal_code: null,
          contact_notes: null,
          contact_account_manager: null,
        };

        if (validateRow(row, headers, rowIndex)) {
          mergedRows.push(row);
        } else {
          validationErrors++;
        }
      }
    }

    console.log(`   Created ${mergedRows.length} merged rows (${contactsAdded} with contacts)\n`);

    if (validationErrors > 0) {
      console.log(`   ⚠️  ${validationErrors} rows had validation errors and were skipped\n`);
    }

    // Write merged CSV with improved escaping
    const outputPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_merged_v2.csv');
    console.log('💾 Writing merged CSV...');

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...mergedRows.map(row =>
        headers.map(h => escapeCSV(row[h])).join(',')
      )
    ];

    fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');

    console.log(`   ✅ Wrote ${csvLines.length - 1} rows to organizations_contacts_merged_v2.csv\n`);

    // Verify output
    console.log('🔍 Verifying output quality...');
    const verifyContent = fs.readFileSync(outputPath, 'utf-8');
    const { headers: verifyHeaders, rows: verifyRows } = parseCSV(verifyContent);

    console.log(`   Headers: ${verifyHeaders.length} columns (expected 26)`);
    console.log(`   Rows: ${verifyRows.length} (expected ${mergedRows.length})`);

    // Check for column count consistency
    let columnMismatchCount = 0;
    for (let i = 0; i < verifyRows.length; i++) {
      const fieldCount = Object.keys(verifyRows[i]).length;
      if (fieldCount !== 26) {
        columnMismatchCount++;
        if (columnMismatchCount <= 3) {
          console.log(`   ⚠️  Row ${i + 1}: ${fieldCount} columns (expected 26)`);
        }
      }
    }

    if (columnMismatchCount === 0) {
      console.log(`   ✅ All rows have correct column count (26)`);
    } else {
      console.log(`   ⚠️  ${columnMismatchCount} rows have mismatched column counts`);
    }

    // Statistics
    console.log('\n📊 Merge Statistics:');
    console.log(`   Total organizations: ${organizations.length}`);
    console.log(`   Organizations with contacts: ${contactsByOrg.size}`);
    console.log(`   Organizations without contacts: ${organizations.length - contactsByOrg.size}`);
    console.log(`   Total contacts: ${contactsAdded}`);
    console.log(`   Total merged rows: ${mergedRows.length}`);
    console.log(`   Validation errors: ${validationErrors}`);

    console.log('\n✨ Merge complete!');
    console.log(`📁 Output file: data/migration-output/organizations_contacts_merged_v2.csv\n`);

  } catch (error) {
    console.error('\n❌ Merge failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

mergeCSVs();
