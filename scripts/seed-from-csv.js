#!/usr/bin/env node

/**
 * Seed database from migration CSV files
 * Imports organizations and contacts from data/migration-output/
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 CSV Data Import Starting...\n');

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
 * Import organizations
 */
async function importOrganizations() {
  console.log('📊 Importing organizations...');

  const csvPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);

  console.log(`   Found ${rows.length} organizations in CSV`);

  // Valid organization types
  const validTypes = ['customer', 'distributor', 'principal', 'partner', 'competitor', 'unknown'];

  // Prepare organizations for insert
  const organizations = rows
    .filter(row => row.name)
    .map(row => {
      let orgType = row.organization_type?.toLowerCase() || 'unknown';

      // Map any invalid types to 'unknown'
      if (!validTypes.includes(orgType)) {
        orgType = 'unknown';
      }

      return {
        name: row.name,
        organization_type: orgType,
        priority: row.priority || null,
        notes: row.notes || null,
      };
    });

  console.log(`   Preparing to insert ${organizations.length} organizations`);

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < organizations.length; i += batchSize) {
    const batch = organizations.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('organizations')
      .insert(batch)
      .select('id, name');

    if (error) {
      console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      throw error;
    }

    inserted += data.length;

    if (i % 500 === 0 && i > 0) {
      console.log(`   Progress: ${inserted} organizations inserted...`);
    }
  }

  console.log(`   ✅ Inserted ${inserted} organizations\n`);
  return inserted;
}

/**
 * Import contacts
 */
async function importContacts() {
  console.log('📊 Importing contacts...');

  const csvPath = path.join(__dirname, '..', 'data', 'migration-output', 'contacts_final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);

  console.log(`   Found ${rows.length} contacts in CSV`);

  // Get organization name-to-id mapping
  console.log('   Loading organization mappings...');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name');

  if (orgError) {
    console.error('   ❌ Error loading organizations:', orgError.message);
    throw orgError;
  }

  const orgMap = new Map(orgs.map(org => [org.name, org.id]));
  console.log(`   Loaded ${orgMap.size} organization mappings`);

  // Prepare contacts for insert
  const contacts = rows
    .filter(row => row.organization_name && orgMap.has(row.organization_name))
    .map(row => {
      // Build full name from parts or use existing name field
      let fullName = row.name;
      if (!fullName && (row.first_name || row.last_name)) {
        fullName = [row.first_name, row.last_name].filter(Boolean).join(' ');
      }
      if (!fullName) {
        // Skip contacts without any name
        return null;
      }

      return {
        name: fullName,
        first_name: row.first_name || null,
        last_name: row.last_name || null,
        title: row.title || null,
        email: row.email ? [{ type: 'main', value: row.email, primary: true }] : null,
        phone: row.phone ? [{ type: 'main', value: row.phone, primary: true }] : null,
        organization_id: orgMap.get(row.organization_name),
        linkedin_url: row.linkedin_url || null,
        notes: row.notes || null,
      };
    })
    .filter(Boolean); // Remove nulls

  console.log(`   Preparing to insert ${contacts.length} contacts`);
  const skipped = rows.length - contacts.length;
  if (skipped > 0) {
    console.log(`   ⚠️  Skipping ${skipped} contacts (organization not found)`);
  }

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

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

    inserted += data.length;

    if (i % 500 === 0 && i > 0) {
      console.log(`   Progress: ${inserted} contacts inserted...`);
    }
  }

  console.log(`   ✅ Inserted ${inserted} contacts\n`);
  return inserted;
}

/**
 * Main import function
 */
async function main() {
  try {
    const orgCount = await importOrganizations();
    const contactCount = await importContacts();

    console.log('✨ CSV Import Complete!\n');
    console.log('Summary:');
    console.log(`  Organizations: ${orgCount}`);
    console.log(`  Contacts: ${contactCount}`);
    console.log('\n🎉 Import completed successfully!');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

main();
