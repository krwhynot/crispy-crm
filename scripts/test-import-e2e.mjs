#!/usr/bin/env node
/**
 * End-to-End Import Test (Simulates Browser Import Flow)
 * Tests the data quality feature without requiring browser interaction
 */

import fs from 'fs';
import Papa from 'papaparse';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA (from contacts.ts)
// ============================================================================

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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last_name"],
        message: "Either first name or last name must be provided",
      });
    }
  });

// ============================================================================
// COLUMN MAPPING (from columnAliases.ts)
// ============================================================================

const COLUMN_ALIASES = {
  'Organizations': 'organization_name',
  'Organizations (DropDown)': 'organization_name',
  'Company': 'organization_name',
  'Organization': 'organization_name',
  'FULL NAME (FIRST, LAST)': '_full_name_source_',
  'Full Name': '_full_name_source_',
  'Name': '_full_name_source_',
  'EMAIL': 'email_work',
  'Email': 'email_work',
  'Work Email': 'email_work',
  'PHONE': 'phone_work',
  'Phone': 'phone_work',
  'Work Phone': 'phone_work',
  'POSITION': 'title',
  'POSITION (DropDown)': 'title',
  'Position': 'title',
  'Title': 'title',
  'LINKEDIN': 'linkedin_url',
  'LinkedIn': 'linkedin_url',
  'NOTES': 'notes',
  'Notes': 'notes',
};

function mapHeadersToFields(headers) {
  const mapped = {};
  headers.forEach(header => {
    if (!header) return;
    const normalized = String(header).trim();
    mapped[header] = COLUMN_ALIASES[normalized] || normalized.toLowerCase().replace(/\s+/g, '_');
  });
  return mapped;
}

function transformHeaders(headers) {
  const mappings = mapHeadersToFields(headers);
  return headers.map(header => {
    if (!header) return header;
    return mappings[header] || header;
  });
}

function transformData(rawData) {
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

// ============================================================================
// DATA QUALITY TRANSFORMATIONS (from useContactImport.tsx)
// ============================================================================

function applyDataQualityTransformations(contacts, decisions = {}) {
  const { importOrganizationsWithoutContacts = false } = decisions;

  return contacts.map(contact => {
    const transformed = { ...contact };

    // Check if this is an organization-only entry
    const isOrgOnlyEntry = (
      transformed.organization_name &&
      !transformed.first_name?.toString().trim() &&
      !transformed.last_name?.toString().trim()
    );

    // Auto-fill placeholder contact if user approved
    if (isOrgOnlyEntry && importOrganizationsWithoutContacts) {
      transformed.first_name = "General";
      transformed.last_name = "Contact";
      transformed._autoFilled = true;
    }

    return transformed;
  });
}

function validateWithDataQualityDecisions(contacts, decisions = {}) {
  const { importOrganizationsWithoutContacts = false } = decisions;

  const results = {
    total: contacts.length,
    success: 0,
    failed: 0,
    errors: [],
    autoFilled: 0,
  };

  contacts.forEach((contact, index) => {
    const rowNumber = index + 4;

    // Check if org-only entry
    const isOrgOnlyEntry = (
      contact.organization_name &&
      !contact.first_name?.toString().trim() &&
      !contact.last_name?.toString().trim()
    );

    const validationResult = importContactSchema.safeParse(contact);

    if (validationResult.success) {
      results.success++;
      if (contact._autoFilled) {
        results.autoFilled++;
      }
    } else {
      // Filter errors based on decisions
      const relevantErrors = validationResult.error.issues.filter(issue => {
        const fieldPath = issue.path.join('.');
        const isMissingNameError = (
          (fieldPath === "first_name" || fieldPath === "last_name") &&
          issue.message.includes("Either first name or last name must be provided")
        );

        // Skip if user approved org-only entries
        if (isMissingNameError && isOrgOnlyEntry && importOrganizationsWithoutContacts) {
          return false;
        }

        return true;
      });

      if (relevantErrors.length === 0) {
        results.success++;
        if (contact._autoFilled) {
          results.autoFilled++;
        }
      } else {
        results.failed++;
        const errorReasons = relevantErrors.map(issue =>
          `${issue.path.join('.')}: ${issue.message}`
        ).join('; ');

        results.errors.push({
          row: rowNumber,
          data: contact,
          reasons: errorReasons,
        });
      }
    }
  });

  return results;
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

async function runE2ETest() {
  console.log('🧪 Starting End-to-End Import Test (Automated)\n');

  const csvPath = '/home/krwhynot/projects/crispy-crm/data/import_test_focused.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  console.log('📄 Parsing CSV...');
  const parseResult = Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  console.log('🔄 Transforming data...');
  const contacts = transformData(parseResult.data);
  console.log(`   Transformed ${contacts.length} contact rows\n`);

  // ========================================================================
  // TEST 1: Strict Mode (No Data Quality Decisions)
  // ========================================================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 1: Strict Mode (Checkboxes Unchecked)');
  console.log('═══════════════════════════════════════════════════════\n');

  const strictResults = validateWithDataQualityDecisions(contacts, {
    importOrganizationsWithoutContacts: false,
  });

  console.log(`✅ Success: ${strictResults.success} contacts`);
  console.log(`❌ Failed:  ${strictResults.failed} contacts`);

  if (strictResults.failed > 0) {
    console.log('\nFailed rows:');
    strictResults.errors.forEach(err => {
      console.log(`  Row ${err.row}: ${err.reasons}`);
    });
  }

  const test1Pass = strictResults.success === 5 && strictResults.failed === 2;
  console.log(`\n${test1Pass ? '✅ PASS' : '❌ FAIL'}: Expected 5 success, 2 failed\n`);

  // ========================================================================
  // TEST 2: Auto-Fill Organizations (Data Quality Feature)
  // ========================================================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TEST 2: Auto-Fill Organizations (Checkbox Checked)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Apply transformations
  const transformedContacts = applyDataQualityTransformations(contacts, {
    importOrganizationsWithoutContacts: true,
  });

  const autoFillResults = validateWithDataQualityDecisions(transformedContacts, {
    importOrganizationsWithoutContacts: true,
  });

  console.log(`✅ Success:    ${autoFillResults.success} contacts`);
  console.log(`   Auto-filled: ${autoFillResults.autoFilled} with "General Contact"`);
  console.log(`❌ Failed:     ${autoFillResults.failed} contacts`);

  if (autoFillResults.failed > 0) {
    console.log('\nFailed rows:');
    autoFillResults.errors.forEach(err => {
      console.log(`  Row ${err.row}: ${err.reasons}`);
    });
  }

  // Show transformed contacts
  console.log('\n📝 Auto-filled contacts:');
  transformedContacts.forEach((contact, i) => {
    if (contact._autoFilled) {
      console.log(`  Row ${i + 4}: "${contact.first_name} ${contact.last_name}" at ${contact.organization_name}`);
    }
  });

  const test2Pass = autoFillResults.success === 7 && autoFillResults.failed === 0 && autoFillResults.autoFilled === 2;
  console.log(`\n${test2Pass ? '✅ PASS' : '❌ FAIL'}: Expected 7 success, 0 failed, 2 auto-filled\n`);

  // ========================================================================
  // FINAL RESULTS
  // ========================================================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏁 FINAL RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');

  const allPass = test1Pass && test2Pass;

  if (allPass) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n✨ Data Quality Feature Working Correctly:');
    console.log('   • Strict mode rejects org-only entries (2 failed)');
    console.log('   • Auto-fill mode transforms org-only entries (0 failed)');
    console.log('   • "General Contact" placeholder created for 2 organizations\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\nReview results above for details\n');
    process.exit(1);
  }
}

// Run the test
runE2ETest().catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
