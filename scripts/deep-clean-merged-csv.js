#!/usr/bin/env node

/**
 * Deep Clean Merged CSV - Fix remaining data quality issues
 *
 * Fixes:
 * 1. Email-as-name entries (3 patterns)
 * 2. City capitalization inconsistencies
 * 3. Zip codes in city field
 * 4. Phone special characters
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Deep Cleaning Merged CSV...\n');

/**
 * Convert string to Title Case
 */
function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if string looks like an email
 */
function isEmail(str) {
  if (!str) return false;
  const emailPattern = /^[\w.+-]+@[\w.-]+\.\w+$/;
  return emailPattern.test(str.trim());
}

/**
 * Clean contact name field (fix email-as-name)
 */
function cleanContactName(row) {
  const name = row.contact_full_name || '';
  const emailField = row.contact_email || '';

  if (!name.includes('@')) {
    return null; // No changes needed
  }

  const changes = {};

  // Pattern 1: Email duplicated in both name and email fields
  if (emailField && emailField.includes(name)) {
    changes.contact_full_name = '';
    changes.contact_first_name = '';
    changes.contact_last_name = '';
    changes.pattern = 'duplicated';
    return changes;
  }

  // Pattern 2: Email in name, empty email field
  if (!emailField || emailField === '""' || emailField === '[]') {
    // Create JSONB email from name
    const cleanEmail = name.trim();
    changes.contact_email = `[{"type":"main","value":"${cleanEmail}","primary":true}]`;
    changes.contact_full_name = '';
    changes.contact_first_name = '';
    changes.contact_last_name = '';
    changes.pattern = 'extracted';
    return changes;
  }

  // Pattern 3: "Name@domain" format - extract name part
  const namePart = name.split('@')[0].trim();
  if (namePart && namePart !== name) {
    changes.contact_full_name = namePart;

    // Try to split into first/last name
    const parts = namePart.split(/\s+/);
    if (parts.length >= 2) {
      changes.contact_first_name = parts[0];
      changes.contact_last_name = parts.slice(1).join(' ');
    } else {
      changes.contact_first_name = '';
      changes.contact_last_name = namePart;
    }
    changes.pattern = 'extracted_name';
    return changes;
  }

  return null;
}

/**
 * Clean city field (capitalization + zip code fix)
 */
function cleanCity(cityField, postalCodeField) {
  if (!cityField) return null;

  const city = cityField.trim();
  const changes = {};

  // Check if it's a zip code (all digits)
  if (/^\d+$/.test(city)) {
    // Move to postal_code if empty
    if (!postalCodeField || postalCodeField === '') {
      changes.postal_code = city;
    }
    changes.city = '';
    changes.type = 'zip_moved';
    return changes;
  }

  // Standardize to Title Case
  const titleCased = toTitleCase(city);
  if (city !== titleCased) {
    changes.city = titleCased;
    changes.type = 'capitalized';
    return changes;
  }

  return null;
}

/**
 * Clean phone special characters in JSONB
 */
function cleanPhone(phoneField) {
  if (!phoneField || (!phoneField.includes('?') && !phoneField.includes('*'))) {
    return null;
  }

  try {
    const phoneData = JSON.parse(phoneField);
    if (Array.isArray(phoneData)) {
      let changed = false;
      phoneData.forEach(p => {
        if (p.value && (p.value.includes('?') || p.value.includes('*'))) {
          p.value = p.value.replace(/[?*]/g, '-');
          changed = true;
        }
      });

      if (changed) {
        return JSON.stringify(phoneData);
      }
    }
  } catch (e) {
    // Keep original if can't parse
    console.warn(`   ⚠️  Could not parse phone JSONB: ${phoneField.substring(0, 50)}...`);
  }

  return null;
}

/**
 * Main cleanup function
 */
async function deepCleanCSV() {
  try {
    const inputPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_merged.csv');
    console.log('📂 Reading merged CSV...');

    const content = fs.readFileSync(inputPath, 'utf-8');
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data;
    console.log(`   Found ${rows.length} rows\n`);

    // Statistics
    const stats = {
      emailsRemovedFromName: 0,
      emailsExtractedToField: 0,
      namesExtractedFromEmail: 0,
      citiesCapitalized: 0,
      zipCodesFixed: 0,
      phonesCleaned: 0,
    };

    console.log('🔧 Applying cleanups...');

    for (const row of rows) {
      // 1. Clean contact name (email-as-name fix)
      const nameChanges = cleanContactName(row);
      if (nameChanges) {
        Object.assign(row, nameChanges);

        if (nameChanges.pattern === 'duplicated') {
          stats.emailsRemovedFromName++;
        } else if (nameChanges.pattern === 'extracted') {
          stats.emailsExtractedToField++;
        } else if (nameChanges.pattern === 'extracted_name') {
          stats.namesExtractedFromEmail++;
        }
      }

      // 2. Clean org city
      const orgCityChanges = cleanCity(row.org_city, row.org_postal_code);
      if (orgCityChanges) {
        if (orgCityChanges.city !== undefined) {
          row.org_city = orgCityChanges.city;
        }
        if (orgCityChanges.postal_code !== undefined) {
          row.org_postal_code = orgCityChanges.postal_code;
        }

        if (orgCityChanges.type === 'capitalized') {
          stats.citiesCapitalized++;
        } else if (orgCityChanges.type === 'zip_moved') {
          stats.zipCodesFixed++;
        }
      }

      // 3. Clean contact city
      const contactCityChanges = cleanCity(row.contact_city, row.contact_postal_code);
      if (contactCityChanges) {
        if (contactCityChanges.city !== undefined) {
          row.contact_city = contactCityChanges.city;
        }
        if (contactCityChanges.postal_code !== undefined) {
          row.contact_postal_code = contactCityChanges.postal_code;
        }

        if (contactCityChanges.type === 'capitalized') {
          stats.citiesCapitalized++;
        } else if (contactCityChanges.type === 'zip_moved') {
          stats.zipCodesFixed++;
        }
      }

      // 4. Clean contact phone
      const cleanedPhone = cleanPhone(row.contact_phone);
      if (cleanedPhone) {
        row.contact_phone = cleanedPhone;
        stats.phonesCleaned++;
      }
    }

    console.log('   ✅ Cleanups applied\n');

    // Write cleaned CSV
    const outputPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_final.csv');
    console.log('💾 Writing cleaned CSV...');

    const csv = Papa.unparse(rows, {
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      header: true,
      newline: '\n',
    });

    fs.writeFileSync(outputPath, csv, 'utf-8');
    console.log(`   ✅ Wrote ${rows.length} rows to organizations_contacts_final.csv\n`);

    // Backup original
    const backupPath = path.join(__dirname, '..', 'data', 'migration-output', 'organizations_contacts_merged_pre_clean.csv');
    fs.copyFileSync(inputPath, backupPath);
    console.log(`   📦 Backed up original to organizations_contacts_merged_pre_clean.csv\n`);

    // Statistics report
    console.log('📊 Cleanup Statistics:');
    console.log(`   Email-as-name fixes:`);
    console.log(`     - Duplicated emails removed from name: ${stats.emailsRemovedFromName}`);
    console.log(`     - Emails extracted to email field: ${stats.emailsExtractedToField}`);
    console.log(`     - Names extracted from Name@email: ${stats.namesExtractedFromEmail}`);
    console.log(`   City fixes:`);
    console.log(`     - Cities capitalized: ${stats.citiesCapitalized}`);
    console.log(`     - Zip codes moved from city field: ${stats.zipCodesFixed}`);
    console.log(`   Phone fixes:`);
    console.log(`     - Phones with special chars cleaned: ${stats.phonesCleaned}`);

    const totalFixes =
      stats.emailsRemovedFromName +
      stats.emailsExtractedToField +
      stats.namesExtractedFromEmail +
      stats.citiesCapitalized +
      stats.zipCodesFixed +
      stats.phonesCleaned;

    console.log(`\n   📈 Total fixes applied: ${totalFixes}`);

    console.log('\n✨ Deep clean complete!');
    console.log(`📁 Final file: data/migration-output/organizations_contacts_final.csv\n`);

  } catch (error) {
    console.error('\n❌ Deep clean failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

deepCleanCSV();
