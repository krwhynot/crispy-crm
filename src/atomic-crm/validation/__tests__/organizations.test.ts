/**
 * Tests for organization validation schemas
 * Validates business rules, data integrity, and API boundary integration
 */

import { describe, it, expect } from 'vitest';
import {
  organizationSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  validateOrganizationForSubmission,
  validateOrganizationForm,
  organizationTypeSchema,
  organizationStatusSchema,
  type Organization,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from '../organizations';
import { z } from 'zod';

describe('Organization Validation Schemas', () => {
  describe('Enum Schemas', () => {
    describe('organizationTypeSchema', () => {
      it('should accept valid organization types', () => {
        const validTypes = [
          'customer',
          'prospect',
          'partner',
          'vendor',
          'competitor',
          'investor',
          'other'
        ];

        validTypes.forEach(type => {
          expect(() => organizationTypeSchema.parse(type)).not.toThrow();
        });
      });

      it('should reject invalid organization types', () => {
        const invalidTypes = ['', 'client', 'supplier', 'employee', 'unknown'];

        invalidTypes.forEach(type => {
          expect(() => organizationTypeSchema.parse(type)).toThrow(z.ZodError);
        });
      });
    });

    describe('organizationStatusSchema', () => {
      it('should accept valid statuses', () => {
        const validStatuses = ['active', 'inactive', 'pending', 'suspended'];

        validStatuses.forEach(status => {
          expect(() => organizationStatusSchema.parse(status)).not.toThrow();
        });
      });

      it('should reject invalid statuses', () => {
        expect(() => organizationStatusSchema.parse('enabled')).toThrow(z.ZodError);
        expect(() => organizationStatusSchema.parse('disabled')).toThrow(z.ZodError);
        expect(() => organizationStatusSchema.parse('archived')).toThrow(z.ZodError);
      });
    });
  });

  describe('organizationSchema', () => {
    const validOrganization = {
      name: 'Test Organization',
      type: 'customer',
      status: 'active',
      website: 'https://example.com',
      industry: 'Technology',
      annual_revenue: 1000000,
      employee_count: 50,
    };

    it('should accept valid organization data', () => {
      const result = organizationSchema.parse(validOrganization);
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Organization');
      expect(result.type).toBe('customer');
    });

    it('should provide default values', () => {
      const minimalOrganization = {
        name: 'Minimal Organization',
      };

      const result = organizationSchema.parse(minimalOrganization);
      expect(result.type).toBe('prospect');
      expect(result.status).toBe('active');
    });

    it('should reject empty name', () => {
      const invalidData = { ...validOrganization, name: '' };
      expect(() => organizationSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should validate website URL format', () => {
      // Valid URLs
      expect(() => organizationSchema.parse({
        ...validOrganization,
        website: 'https://example.com'
      })).not.toThrow();

      expect(() => organizationSchema.parse({
        ...validOrganization,
        website: 'http://example.com'
      })).not.toThrow();

      expect(() => organizationSchema.parse({
        ...validOrganization,
        website: 'https://subdomain.example.com/path'
      })).not.toThrow();

      // Invalid URLs
      expect(() => organizationSchema.parse({
        ...validOrganization,
        website: 'not-a-url'
      })).toThrow(z.ZodError);

      expect(() => organizationSchema.parse({
        ...validOrganization,
        website: 'example.com' // Missing protocol
      })).toThrow(z.ZodError);
    });

    it('should validate LinkedIn URL specifically', () => {
      // Valid LinkedIn URLs
      expect(() => organizationSchema.parse({
        ...validOrganization,
        linkedin_url: 'https://www.linkedin.com/company/example'
      })).not.toThrow();

      expect(() => organizationSchema.parse({
        ...validOrganization,
        linkedin_url: 'https://linkedin.com/company/example'
      })).not.toThrow();

      expect(() => organizationSchema.parse({
        ...validOrganization,
        linkedin_url: 'http://www.linkedin.com/company/example-corp'
      })).not.toThrow();

      // Invalid LinkedIn URLs
      expect(() => organizationSchema.parse({
        ...validOrganization,
        linkedin_url: 'https://facebook.com/example'
      })).toThrow(z.ZodError);

      expect(() => organizationSchema.parse({
        ...validOrganization,
        linkedin_url: 'not-a-url'
      })).toThrow(z.ZodError);
    });

    it('should validate positive annual revenue', () => {
      expect(() => organizationSchema.parse({
        ...validOrganization,
        annual_revenue: -1000
      })).toThrow(z.ZodError);

      expect(() => organizationSchema.parse({
        ...validOrganization,
        annual_revenue: 0
      })).not.toThrow();

      expect(() => organizationSchema.parse({
        ...validOrganization,
        annual_revenue: 1000000
      })).not.toThrow();
    });

    it('should validate positive employee count', () => {
      expect(() => organizationSchema.parse({
        ...validOrganization,
        employee_count: -10
      })).toThrow(z.ZodError);

      expect(() => organizationSchema.parse({
        ...validOrganization,
        employee_count: 0
      })).not.toThrow();

      expect(() => organizationSchema.parse({
        ...validOrganization,
        employee_count: 100
      })).not.toThrow();

      // Should be integer
      expect(() => organizationSchema.parse({
        ...validOrganization,
        employee_count: 10.5
      })).toThrow(z.ZodError);
    });

    it('should handle address fields', () => {
      const orgWithAddress = {
        ...validOrganization,
        address_line1: '123 Main St',
        address_line2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'USA',
      };

      const result = organizationSchema.parse(orgWithAddress);
      expect(result.address_line1).toBe('123 Main St');
      expect(result.city).toBe('New York');
    });

    it('should handle parent organization relationship', () => {
      const childOrg = {
        ...validOrganization,
        parent_organization_id: 'parent-org-123',
      };

      expect(() => organizationSchema.parse(childOrg)).not.toThrow();

      // Should accept both string and number IDs
      expect(() => organizationSchema.parse({
        ...validOrganization,
        parent_organization_id: 123
      })).not.toThrow();
    });

    it('should handle optional fields', () => {
      const minimalData = {
        name: 'Minimal Org',
      };

      const result = organizationSchema.parse(minimalData);
      expect(result.description).toBeUndefined();
      expect(result.industry).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should handle nullable fields', () => {
      const dataWithNulls = {
        ...validOrganization,
        description: null,
        notes: null,
        deleted_at: null,
      };

      expect(() => organizationSchema.parse(dataWithNulls)).not.toThrow();
    });

    it('should handle sectors array', () => {
      const orgWithSectors = {
        ...validOrganization,
        sectors: ['technology', 'finance', 'healthcare'],
      };

      const result = organizationSchema.parse(orgWithSectors);
      expect(result.sectors).toEqual(['technology', 'finance', 'healthcare']);
      expect(result.sectors).toHaveLength(3);
    });
  });

  describe('createOrganizationSchema', () => {
    it('should require essential fields for creation', () => {
      const validCreate = {
        name: 'New Organization',
      };

      expect(() => createOrganizationSchema.parse(validCreate)).not.toThrow();
    });

    it('should reject creation without required fields', () => {
      expect(() => createOrganizationSchema.parse({})).toThrow(z.ZodError);
      expect(() => createOrganizationSchema.parse({ name: '' })).toThrow(z.ZodError);
    });

    it('should not allow id field on creation', () => {
      const dataWithId = {
        id: 'should-not-be-here',
        name: 'New Organization',
      };

      const result = createOrganizationSchema.parse(dataWithId);
      expect('id' in result).toBe(false);
    });

    it('should not include system fields on creation', () => {
      const dataWithSystemFields = {
        name: 'New Organization',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = createOrganizationSchema.parse(dataWithSystemFields);
      expect('created_at' in result).toBe(false);
      expect('updated_at' in result).toBe(false);
    });

    it('should apply defaults on creation', () => {
      const minimalCreate = {
        name: 'New Org',
      };

      const result = createOrganizationSchema.parse(minimalCreate);
      expect(result.type).toBe('prospect');
      expect(result.status).toBe('active');
    });
  });

  describe('updateOrganizationSchema', () => {
    it('should require id for updates', () => {
      const validUpdate = {
        id: 'org-123',
        name: 'Updated Name',
      };

      expect(() => updateOrganizationSchema.parse(validUpdate)).not.toThrow();
    });

    it('should reject updates without id', () => {
      const invalidUpdate = {
        name: 'Updated Name',
      };

      expect(() => updateOrganizationSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it('should allow partial updates', () => {
      expect(() => updateOrganizationSchema.parse({ id: 'org-1', name: 'New Name' })).not.toThrow();
      expect(() => updateOrganizationSchema.parse({ id: 'org-1', type: 'vendor' })).not.toThrow();
      expect(() => updateOrganizationSchema.parse({ id: 'org-1', annual_revenue: 2000000 })).not.toThrow();
      expect(() => updateOrganizationSchema.parse({ id: 'org-1' })).not.toThrow(); // Just id
    });

    it('should validate updated fields', () => {
      expect(() => updateOrganizationSchema.parse({
        id: 'org-1',
        type: 'invalid_type'
      })).toThrow(z.ZodError);

      expect(() => updateOrganizationSchema.parse({
        id: 'org-1',
        annual_revenue: -1000
      })).toThrow(z.ZodError);

      expect(() => updateOrganizationSchema.parse({
        id: 'org-1',
        website: 'not-a-url'
      })).toThrow(z.ZodError);
    });
  });

  describe('Validation Functions', () => {
    describe('validateOrganizationForm', () => {
      it('should validate and pass valid data', async () => {
        const validData = {
          name: 'Test Organization',
          type: 'customer',
          status: 'active',
        };

        await expect(validateOrganizationForm(validData)).resolves.toBeUndefined();
      });

      it('should format errors for React Admin', async () => {
        const invalidData = {
          name: '',
          type: 'invalid_type',
          status: 'invalid_status',
          annual_revenue: -1000,
          employee_count: -10,
          website: 'not-a-url',
        };

        try {
          await validateOrganizationForm(invalidData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
          expect(error.errors).toBeDefined();
          expect(error.errors.name).toBe('Organization name is required');
          expect(error.errors.type).toBeDefined();
          expect(error.errors.status).toBeDefined();
          expect(error.errors.annual_revenue).toBe('Annual revenue must be positive');
          expect(error.errors.employee_count).toBe('Employee count must be positive');
          expect(error.errors.website).toBe('Invalid URL format');
        }
      });
    });

    describe('validateOrganizationForSubmission', () => {
      it('should validate and return normalized data', () => {
        const inputData = {
          name: '  Test Organization  ',
          type: 'customer',
          website: 'https://example.com',
        };

        const result = validateOrganizationForSubmission(inputData);
        expect(result.name).toBe('Test Organization'); // Should be trimmed
        expect(result.type).toBe('customer');
      });

      it('should throw for invalid submission data', () => {
        const invalidData = {
          name: '',
        };

        expect(() => validateOrganizationForSubmission(invalidData)).toThrow(z.ZodError);
      });

      it('should normalize optional fields', () => {
        const dataWithSpaces = {
          name: '  Org Name  ',
          description: '  Description with spaces  ',
          industry: '  Technology  ',
        };

        const result = validateOrganizationForSubmission(dataWithSpaces);
        expect(result.name).toBe('Org Name');
        expect(result.description).toBe('Description with spaces');
        expect(result.industry).toBe('Technology');
      });
    });
  });

  describe('Business Rules', () => {
    it('should enforce hierarchical organization structure', () => {
      const parentOrg = {
        id: 'parent-org',
        name: 'Parent Corporation',
        type: 'customer',
      };

      const childOrg = {
        name: 'Child Division',
        type: 'customer',
        parent_organization_id: 'parent-org',
      };

      expect(() => organizationSchema.parse(parentOrg)).not.toThrow();
      expect(() => organizationSchema.parse(childOrg)).not.toThrow();
    });

    it('should validate sector assignment', () => {
      const orgWithValidSectors = {
        name: 'Multi-Sector Org',
        sectors: ['technology', 'finance', 'healthcare', 'retail'],
      };

      const result = organizationSchema.parse(orgWithValidSectors);
      expect(result.sectors).toHaveLength(4);
      expect(result.sectors).toContain('technology');
      expect(result.sectors).toContain('finance');
    });

    it('should handle organization lifecycle status transitions', () => {
      const statusTransitions = [
        { from: 'pending', to: 'active' },
        { from: 'active', to: 'suspended' },
        { from: 'suspended', to: 'active' },
        { from: 'active', to: 'inactive' },
      ];

      statusTransitions.forEach(({ to }) => {
        const org = {
          name: 'Status Test Org',
          status: to,
        };

        expect(() => organizationSchema.parse(org)).not.toThrow();
      });
    });

    it('should validate contact information formats', () => {
      const orgWithContacts = {
        name: 'Contact Test Org',
        email: 'contact@example.com',
        phone: '+1-555-123-4567',
        website: 'https://example.com',
      };

      expect(() => organizationSchema.parse(orgWithContacts)).not.toThrow();

      // Invalid email should fail
      expect(() => organizationSchema.parse({
        ...orgWithContacts,
        email: 'invalid-email'
      })).toThrow(z.ZodError);
    });
  });

  describe('Error Message Formatting', () => {
    it('should provide clear error messages', async () => {
      const testCases = [
        {
          data: { name: '' },
          expectedError: 'Organization name is required',
          field: 'name'
        },
        {
          data: { name: 'Test', annual_revenue: -1000 },
          expectedError: 'Annual revenue must be positive',
          field: 'annual_revenue'
        },
        {
          data: { name: 'Test', employee_count: -10 },
          expectedError: 'Employee count must be positive',
          field: 'employee_count'
        },
        {
          data: { name: 'Test', website: 'not-a-url' },
          expectedError: 'Invalid URL format',
          field: 'website'
        },
        {
          data: { name: 'Test', linkedin_url: 'https://facebook.com/test' },
          expectedError: 'Must be a valid LinkedIn URL',
          field: 'linkedin_url'
        },
      ];

      for (const { data, expectedError, field } of testCases) {
        try {
          await validateOrganizationForm(data);
          if (expectedError) {
            expect.fail(`Should have thrown error for field: ${field}`);
          }
        } catch (error: any) {
          expect(error.errors[field]).toBe(expectedError);
        }
      }
    });
  });
});