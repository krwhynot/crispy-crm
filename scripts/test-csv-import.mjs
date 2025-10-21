#!/usr/bin/env node
/**
 * Automated CSV Import Validation Test
 * Tests the import validation logic locally without browser/database
 */

import fs from 'fs';
import Papa from 'papaparse';
import { z } from 'zod';

// Column alias mapping (from columnAliases.ts)
const COLUMN_ALIASES = {
  // Organization field
  'Organizations': 'organization_name',
  'Organizations (DropDown)': 'organization_name',
  'Company': 'organization_name',
  'Organization': 'organization_name',

  // Full name field (will be split)
  'FULL NAME (FIRST, LAST)': '_full_name_source_',
  'Full Name': '_full_name_source_',
  'Name': '_full_name_source_',

  // Email fields
  'EMAIL': 'email_work',
  'Email': 'email_work',
  'Work Email': 'email_work',
  'Email (Work)': 'email_work',

  // Phone fields
  'PHONE': 'phone_work',
  'Phone': 'phone_work',
  'Work Phone': 'phone_work',
  'Phone (Work)': 'phone_work',

  // Title/Position
  'POSITION': 'title',
  'POSITION (DropDown)': 'title',
  'Position': 'title',
  'Title': 'title',

  // LinkedIn
  'LINKEDIN': 'linkedin_url',
  'LinkedIn': 'linkedin_url',
  'LinkedIn URL': 'linkedin_url',

  // Notes
  'NOTES': 'notes',
  'Notes': 'notes',
};

// Validation schema (from contacts.ts)
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

const importContactSchema = z
  .object({
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    organization_name: z
      .string({ required_error: "Organization name is required" })
      .trim()
      .min(1, { message: "Organization name is required" }),
    email_work: z.union([
      z.literal(""),
      z.literal(null),
      z.undefined(),
      z.string().trim(),
    ]).optional().nullable(),
    phone_work: z.union([
      z.literal(""),
      z.literal(null),
      z.undefined(),
      z.string(),
      z.number().transform(String),
    ]).optional().nullable(),
    linkedin_url: z.union([
      z.literal(""),
      z.literal(null),
      z.undefined(),
      z.string().refine(
        (url) => {
          try {
            const parsedUrl = new URL(url);
            return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
          } catch {
            return false;
          }
        },
        { message: "LinkedIn URL must be a valid URL from linkedin.com" },
      ),
    ]).optional().nullable(),
    title: z.union([
      z.literal(""),
      z.literal(null),
      z.undefined(),
      z.string(),
    ]).optional().nullable(),
    notes: z.union([
      z.literal(""),
      z.literal(null),
      z.undefined(),
      z.string(),
    ]).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Require at least first name or last name
    if (!data.first_name?.trim() && !data.last_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["first_name"],
        message: "Either first name or last name must be provided",
      });
    }
  });

function mapHeadersToFields(headers) {
  const mapped = {};
  headers.forEach(header => {
    const normalized = header.trim();
    mapped[header] = COLUMN_ALIASES[normalized] || normalized.toLowerCase().replace(/\s+/g, '_');
  });
  return mapped;
}

function transformHeaders(headers) {
  const mappings = mapHeadersToFields(headers);
  return headers.map(header => mappings[header] || header);
}

function transformData(rawData) {
  // Skip first 3 rows (instructions, empty, headers)
  if (rawData.length < 4) {
    throw new Error('CSV file too short');
  }

  const headers = rawData[2];
  const transformedHeaders = transformHeaders(headers);
  const dataRows = rawData.slice(3);

  return dataRows.map(row => {
    const obj = {};
    transformedHeaders.forEach((header, index) => {
      // Handle full name splitting
      if (header === '_full_name_source_') {
        const fullName = row[index] || '';
        const nameParts = fullName.trim().split(/\s+/);

        if (nameParts.length === 0 || fullName.trim() === '') {
          obj.first_name = '';
          obj.last_name = '';
        } else if (nameParts.length === 1) {
          obj.first_name = '';
          obj.last_name = nameParts[0];
        } else {
          obj.first_name = nameParts[0];
          obj.last_name = nameParts.slice(1).join(' ');
        }
      } else {
        obj[header] = row[index];
      }
    });
    return obj;
  });
}

function validateContacts(contacts) {
  const results = {
    total: contacts.length,
    success: 0,
    failed: 0,
    errors: [],
    errorTypes: {},
  };

  contacts.forEach((contact, index) => {
    const rowNumber = index + 4; // Account for 3 header rows + 1-indexed
    const validationResult = importContactSchema.safeParse(contact);

    if (validationResult.success) {
      results.success++;
    } else {
      results.failed++;
      const errorReasons = validationResult.error.issues.map(issue => {
        const field = issue.path.join('.');
        const message = issue.message;

        // Track error types
        const errorKey = `${field}: ${message}`;
        results.errorTypes[errorKey] = (results.errorTypes[errorKey] || 0) + 1;

        return `${field}: ${message}`;
      }).join('; ');

      results.errors.push({
        row: rowNumber,
        data: contact,
        reasons: errorReasons,
      });
    }
  });

  return results;
}

// Main test function
async function runTest() {
  console.log('🧪 Starting CSV Import Validation Test\n');

  const csvContent = fs.readFileSync('/home/krwhynot/projects/crispy-crm/data/new-contacts.csv', 'utf-8');

  // Parse CSV
  console.log('📄 Parsing CSV...');
  const parseResult = Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  console.log(`   Parsed ${parseResult.data.length} total rows\n`);

  // Transform data
  console.log('🔄 Transforming data...');
  const contacts = transformData(parseResult.data);
  console.log(`   Transformed ${contacts.length} contact rows\n`);

  // Validate
  console.log('✅ Validating contacts...\n');
  const results = validateContacts(contacts);

  // Print results
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 VALIDATION RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');

  const successRate = ((results.success / results.total) * 100).toFixed(2);
  console.log(`Total Contacts:    ${results.total}`);
  console.log(`✅ Successful:     ${results.success} (${successRate}%)`);
  console.log(`❌ Failed:         ${results.failed} (${(100 - successRate).toFixed(2)}%)\n`);

  // Error breakdown
  if (results.failed > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 ERROR BREAKDOWN (By Type)');
    console.log('═══════════════════════════════════════════════════════\n');

    const sortedErrors = Object.entries(results.errorTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedErrors.forEach(([error, count]) => {
      console.log(`  ${count.toString().padStart(4)} × ${error}`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 FIRST 10 FAILED ROWS');
    console.log('═══════════════════════════════════════════════════════\n');

    results.errors.slice(0, 10).forEach(error => {
      console.log(`Row ${error.row}: ${error.reasons}`);
      console.log(`  Data: ${JSON.stringify(error.data).substring(0, 100)}...`);
      console.log('');
    });
  }

  console.log('═══════════════════════════════════════════════════════\n');

  // Write detailed error report
  if (results.failed > 0) {
    const errorCsv = [
      ['Row', 'Error Reasons', 'First Name', 'Last Name', 'Organization', 'Title', 'Email (Work)', 'Phone (Work)', 'Notes'],
      ...results.errors.map(e => [
        e.row,
        e.reasons,
        e.data.first_name || '',
        e.data.last_name || '',
        e.data.organization_name || '',
        e.data.title || '',
        e.data.email_work || '',
        e.data.phone_work || '',
        e.data.notes || '',
      ])
    ];

    const errorCsvContent = errorCsv.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    fs.writeFileSync('test-import-errors.csv', errorCsvContent);
    console.log('📄 Detailed error report written to: test-import-errors.csv\n');
  }

  return {
    successRate: parseFloat(successRate),
    results,
  };
}

// Run the test
runTest()
  .then(({ successRate }) => {
    if (successRate >= 90) {
      console.log('🎉 SUCCESS! Import success rate is acceptable (≥90%)');
      process.exit(0);
    } else {
      console.log(`⚠️  NEEDS IMPROVEMENT: Success rate ${successRate}% is below target (90%)`);
      console.log('   Review error breakdown above to identify fixable patterns');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
