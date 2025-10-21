/**
 * End-to-End Import Test (Simulates Browser Import Flow)
 * Tests the data quality feature without requiring browser interaction
 *
 * This test imports the actual application logic from the shared module
 * to ensure we're testing the real implementation, not a duplicate.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import Papa from 'papaparse';
import {
  applyDataQualityTransformations,
  validateTransformedContacts,
} from '../src/atomic-crm/contacts/contactImport.logic';
import { parseRawCsvData } from '../src/atomic-crm/contacts/csvProcessor';

describe('CSV Import - Data Quality Feature (E2E)', () => {
  const csvPath = './data/import_test_sample.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parseResult = Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  const { contacts } = parseRawCsvData(parseResult.data);

  it('should have parsed 10 contact rows from CSV', () => {
    expect(contacts).toHaveLength(10);
  });

  describe('Test 1: Strict Mode (No Data Quality Decisions)', () => {
    it('should validate 8 contacts and fail 2 org-only entries', () => {
      // In strict mode, no transformations are applied
      const { successful, failed } = validateTransformedContacts(contacts);

      expect(successful).toHaveLength(8);
      expect(failed).toHaveLength(2);

      // Both failures should be org-only entries (7 Monks Taproom and A.Fusion)
      const failedIndices = failed.map(f => f.originalIndex).sort();
      expect(failedIndices).toEqual([3, 7]); // Rows 7 and 11 in CSV (index 3 and 7 in array)

      // All failures should have "Either first name or last name must be provided" error
      failed.forEach(failure => {
        const hasNameError = failure.errors.some(
          e => e.message.includes("Either first name or last name must be provided")
        );
        expect(hasNameError).toBe(true);
      });
    });
  });

  describe('Test 2: Auto-Fill Organizations (Data Quality Feature)', () => {
    it('should auto-fill placeholder contacts and validate all 10 entries', () => {
      // Apply transformations
      const { transformedContacts, autoFilledCount } = applyDataQualityTransformations(contacts, {
        importOrganizationsWithoutContacts: true,
        importContactsWithoutContactInfo: false,
      });

      // Validate the transformed data
      const { successful, failed } = validateTransformedContacts(transformedContacts);

      expect(successful).toHaveLength(10);
      expect(failed).toHaveLength(0);
      expect(autoFilledCount).toBe(2);

      // Verify auto-filled contacts have "General Contact" name
      const autoFilledContacts = transformedContacts.filter(
        c => c.first_name === "General" && c.last_name === "Contact"
      );
      expect(autoFilledContacts).toHaveLength(2);

      // Verify they have organization names
      autoFilledContacts.forEach(contact => {
        expect(contact.organization_name).toBeTruthy();
        expect(typeof contact.organization_name).toBe('string');
        expect((contact.organization_name as string).trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Test 3: Contacts Without Contact Info Feature', () => {
    it('should identify contacts without email or phone', async () => {
      // Mike (index 5, Row 9 in CSV) has neither email nor phone
      const { transformedContacts } = applyDataQualityTransformations(contacts, {
        importOrganizationsWithoutContacts: false,
        importContactsWithoutContactInfo: false,
      });

      // Mike should be flagged as having no contact info
      // Note: Single names go to last_name per the transform logic
      const mike = transformedContacts[5];
      expect(mike.first_name).toBe('');
      expect(mike.last_name).toBe('Mike');

      // Import the helper to verify detection
      const { isContactWithoutContactInfo } = await import('../src/atomic-crm/contacts/contactImport.logic');
      expect(isContactWithoutContactInfo(mike)).toBe(true);
    });

    it('should note: filtering logic is in useContactImport hook, not pure validation', () => {
      // Note: The actual filtering of contacts without contact info happens in
      // useContactImport.tsx's processBatch function (lines 145-157).
      // This test documents the expected behavior but cannot fully test it
      // without mocking the hook's execution.

      // The validation step allows contacts without contact info (fields are optional)
      const { successful } = validateTransformedContacts(contacts);

      // Mike passes validation (contact info is optional in schema)
      // Note: Single names go to last_name per the transform logic
      const mike = successful.find(c => c.last_name === 'Mike');
      expect(mike).toBeDefined();

      // However, in useContactImport.tsx, if importContactsWithoutContactInfo=false,
      // Mike would be filtered out before processing (skippedCount would be 3: Mike, Max, Figueroa)
    });
  });

  describe('Data Quality Summary', () => {
    it('should demonstrate improved success rate with data quality feature', () => {
      // Strict mode
      const strictValidation = validateTransformedContacts(contacts);
      const strictSuccessRate = (strictValidation.successful.length / contacts.length) * 100;

      // Auto-fill mode
      const { transformedContacts } = applyDataQualityTransformations(contacts, {
        importOrganizationsWithoutContacts: true,
        importContactsWithoutContactInfo: false,
      });
      const autoFillValidation = validateTransformedContacts(transformedContacts);
      const autoFillSuccessRate = (autoFillValidation.successful.length / contacts.length) * 100;

      console.log('\n📊 Data Quality Feature Impact:');
      console.log(`   Strict Mode:    ${strictSuccessRate.toFixed(1)}% success (${strictValidation.successful.length}/${contacts.length})`);
      console.log(`   Auto-Fill Mode: ${autoFillSuccessRate.toFixed(1)}% success (${autoFillValidation.successful.length}/${contacts.length})`);
      console.log(`   Improvement:    +${(autoFillSuccessRate - strictSuccessRate).toFixed(1)}% (${autoFillValidation.successful.length - strictValidation.successful.length} more contacts)\n`);

      // The data quality feature should improve success rate
      expect(autoFillSuccessRate).toBeGreaterThan(strictSuccessRate);
      expect(autoFillSuccessRate).toBe(100); // All contacts should validate with auto-fill
    });
  });
});
