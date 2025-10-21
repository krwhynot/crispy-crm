/**
 * Unit tests for CSV import logic utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isOrganizationOnlyEntry,
  isContactWithoutContactInfo,
  applyDataQualityTransformations,
  validateTransformedContacts,
} from '../src/atomic-crm/contacts/contactImport.logic';
import type { ContactImportSchema } from '../src/atomic-crm/contacts/useContactImport';

describe('Contact Import Logic Utilities', () => {
  describe('isOrganizationOnlyEntry', () => {
    it('should return true for organization-only entries', () => {
      const contact: Partial<ContactImportSchema> = {
        organization_name: 'Acme Corp',
        first_name: '',
        last_name: '',
      };
      expect(isOrganizationOnlyEntry(contact)).toBe(true);
    });

    it('should return false for contacts with first name', () => {
      const contact: Partial<ContactImportSchema> = {
        organization_name: 'Acme Corp',
        first_name: 'John',
        last_name: '',
      };
      expect(isOrganizationOnlyEntry(contact)).toBe(false);
    });

    it('should return false for contacts with last name', () => {
      const contact: Partial<ContactImportSchema> = {
        organization_name: 'Acme Corp',
        first_name: '',
        last_name: 'Doe',
      };
      expect(isOrganizationOnlyEntry(contact)).toBe(false);
    });

    it('should return false when organization name is missing', () => {
      const contact: Partial<ContactImportSchema> = {
        organization_name: '',
        first_name: '',
        last_name: '',
      };
      expect(isOrganizationOnlyEntry(contact)).toBe(false);
    });
  });

  describe('isContactWithoutContactInfo', () => {
    it('should return true for contacts with name but no email or phone', () => {
      const contact: Partial<ContactImportSchema> = {
        first_name: 'Jane',
        last_name: 'Smith',
        organization_name: 'Test Corp',
        email_work: '',
        phone_work: '',
      };
      expect(isContactWithoutContactInfo(contact)).toBe(true);
    });

    it('should return false for contacts with email', () => {
      const contact: Partial<ContactImportSchema> = {
        first_name: 'John',
        last_name: 'Doe',
        organization_name: 'Test Corp',
        email_work: 'john@example.com',
        phone_work: '',
      };
      expect(isContactWithoutContactInfo(contact)).toBe(false);
    });

    it('should return false for contacts with phone', () => {
      const contact: Partial<ContactImportSchema> = {
        first_name: 'Mary',
        last_name: 'Johnson',
        organization_name: 'Test Corp',
        email_work: '',
        phone_work: '555-0123',
      };
      expect(isContactWithoutContactInfo(contact)).toBe(false);
    });

    it('should return false for contacts without name', () => {
      const contact: Partial<ContactImportSchema> = {
        first_name: '',
        last_name: '',
        organization_name: 'Test Corp',
        email_work: '',
        phone_work: '',
      };
      expect(isContactWithoutContactInfo(contact)).toBe(false);
    });

    it('should check all email fields', () => {
      const contact: Partial<ContactImportSchema> = {
        first_name: 'Test',
        last_name: 'User',
        email_work: '',
        email_home: 'test@home.com',
        email_other: '',
        phone_work: '',
      };
      expect(isContactWithoutContactInfo(contact)).toBe(false);
    });

    it('should check all phone fields', () => {
      const contact: Partial<ContactImportSchema> = {
        first_name: 'Test',
        last_name: 'User',
        email_work: '',
        phone_work: '',
        phone_home: '',
        phone_other: '555-9999',
      };
      expect(isContactWithoutContactInfo(contact)).toBe(false);
    });
  });

  describe('Data Quality Transformations', () => {
    const testContacts: ContactImportSchema[] = [
      {
        first_name: 'John',
        last_name: 'Doe',
        organization_name: 'Valid Corp',
        email_work: 'john@valid.com',
      } as ContactImportSchema,
      {
        first_name: '',
        last_name: '',
        organization_name: 'Org Only Inc',
      } as ContactImportSchema,
      {
        first_name: 'Jane',
        last_name: 'Smith',
        organization_name: 'No Contact Info LLC',
        email_work: '',
        phone_work: '',
      } as ContactImportSchema,
    ];

    it('should auto-fill org-only entries when approved', () => {
      const { transformedContacts, autoFilledCount } = applyDataQualityTransformations(
        testContacts,
        {
          importOrganizationsWithoutContacts: true,
          importContactsWithoutContactInfo: false,
        }
      );

      expect(autoFilledCount).toBe(1);
      expect(transformedContacts[1].first_name).toBe('General');
      expect(transformedContacts[1].last_name).toBe('Contact');
    });

    it('should not auto-fill org-only entries when not approved', () => {
      const { transformedContacts, autoFilledCount } = applyDataQualityTransformations(
        testContacts,
        {
          importOrganizationsWithoutContacts: false,
          importContactsWithoutContactInfo: false,
        }
      );

      expect(autoFilledCount).toBe(0);
      expect(transformedContacts[1].first_name).toBe('');
      expect(transformedContacts[1].last_name).toBe('');
    });

    it('should validate all contacts after transformation', () => {
      const { transformedContacts } = applyDataQualityTransformations(
        testContacts,
        {
          importOrganizationsWithoutContacts: true,
          importContactsWithoutContactInfo: false,
        }
      );

      const { successful, failed } = validateTransformedContacts(transformedContacts);

      // With auto-fill, all should be valid (org-only entry is now "General Contact")
      expect(successful).toHaveLength(3);
      expect(failed).toHaveLength(0);
    });
  });
});
