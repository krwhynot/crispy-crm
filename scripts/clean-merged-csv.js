#!/usr/bin/env node

/**
 * Clean merged CSV by removing duplicate rows
 * Keeps: One row per unique org+contact combination
 * Removes: Exact duplicate rows
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Cleaning merged CSV file...\n');

/**
 * Proper CSV parser handling quoted fields
 */
function parseCSV(content) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

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

  const headers = parseCSVLine(lines[0]);
  const rows = [];

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

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function escapeCSV(value) {
  if (value === null || value === undefined) return '';

  const str = String(value);

  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * Create unique key for deduplication
 */
function makeRowKey(row) {
  // Use org name + contact full name + contact email as unique key
  const orgName = (row.org_name || '').toLowerCase().trim();
  const contactName = (row.contact_full_name || '').toLowerCase().trim();
  const contactEmail = (row.contact_email || '').toLowerCase().trim();
  const contactPhone = (row.contact_phone || '').toLowerCase().trim();

  return `${orgName}::${contactName}::${contactEmail}::${contactPhone}`;
}

/**
 * Main cleaning function
 */
async function cleanCSV() {
  try {
    // Read merged CSV
    const inputPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_merged.csv');
    console.log('📂 Reading merged CSV...');
    const content = fs.readFileSync(inputPath, 'utf-8');
    const { headers, rows } = parseCSV(content);

    console.log(`   Found ${rows.length} total rows\n`);

    // Deduplicate using unique keys
    console.log('🔍 Removing duplicates...');
    const seen = new Set();
    const uniqueRows = [];
    let duplicatesRemoved = 0;

    for (const row of rows) {
      const key = makeRowKey(row);

      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(row);
      } else {
        duplicatesRemoved++;
      }
    }

    console.log(`   Removed ${duplicatesRemoved} duplicate rows`);
    console.log(`   Kept ${uniqueRows.length} unique rows\n`);

    // Analyze results
    console.log('📊 Analysis:');

    // Count organizations
    const orgNames = new Set(uniqueRows.map(r => r.org_name).filter(Boolean));
    console.log(`   Unique organizations: ${orgNames.size}`);

    // Count rows with contacts
    const withContacts = uniqueRows.filter(r => r.contact_full_name || r.contact_email).length;
    const withoutContacts = uniqueRows.length - withContacts;
    console.log(`   Rows with contacts: ${withContacts}`);
    console.log(`   Rows without contacts: ${withoutContacts}\n`);

    // Write cleaned CSV
    const outputPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_cleaned.csv');
    console.log('💾 Writing cleaned CSV...');

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...uniqueRows.map(row =>
        headers.map(h => escapeCSV(row[h])).join(',')
      )
    ];

    fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');

    console.log(`   ✅ Wrote ${uniqueRows.length} rows to ${outputPath}\n`);

    // Summary
    console.log('✨ Cleaning complete!');
    console.log(`📁 Cleaned file: data/migration-output/organizations_contacts_cleaned.csv`);
    console.log(`📉 Size reduction: ${rows.length} → ${uniqueRows.length} rows (${duplicatesRemoved} duplicates removed)\n`);

  } catch (error) {
    console.error('\n❌ Cleaning failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanCSV();
