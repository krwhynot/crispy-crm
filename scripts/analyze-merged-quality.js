#!/usr/bin/env node

import fs from 'fs';
import Papa from 'papaparse';

const path = '/home/krwhynot/projects/crispy-crm/data/migration-output/organizations_contacts_merged_v3.csv';

const content = fs.readFileSync(path, 'utf-8');
const parsed = Papa.parse(content, {
  header: true,
  skipEmptyLines: true,
});

const rows = parsed.data;

const orgTypes = {};
const cities = {};
let emailAsName = 0;
let phoneIssues = 0;

for (const row of rows) {
  const orgType = row.org_type || 'empty';
  orgTypes[orgType] = (orgTypes[orgType] || 0) + 1;

  // Check contact_full_name for email pattern
  const fullName = row.contact_full_name || '';
  if (fullName.includes('@')) emailAsName++;

  // Check phone format
  const phone = row.contact_phone || '';
  if (phone.includes('?') || phone.includes('*')) phoneIssues++;

  // Track city capitalization
  const city = row.org_city || '';
  if (city) cities[city] = (cities[city] || 0) + 1;
}

console.log('=== Organization Types (Top 10) ===');
Object.entries(orgTypes).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([type, count]) => {
  const countStr = String(count).padStart(5);
  console.log(countStr + ' ' + type);
});

console.log('\n=== Data Quality Issues ===');
console.log('Emails used as contact names: ' + emailAsName);
console.log('Phone numbers with ? or *: ' + phoneIssues);

console.log('\n=== City Capitalization (Top 20) ===');
Object.entries(cities).sort((a,b) => b[1] - a[1]).slice(0, 20).forEach(([city, count]) => {
  const countStr = String(count).padStart(4);
  console.log(countStr + ' ' + city);
});

console.log('\n=== Summary ===');
console.log('Total rows: ' + rows.length);
console.log('Parse errors: ' + parsed.errors.length);
console.log('Column count: ' + parsed.meta.fields.length);
