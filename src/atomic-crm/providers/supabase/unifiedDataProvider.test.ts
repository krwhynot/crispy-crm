/**
 * Tests for unified data provider validation integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unifiedDataProvider, validationRegistry } from './unifiedDataProvider';

// Mock the base supabase provider
vi.mock('ra-supabase-core', () => ({
  supabaseDataProvider: () => ({
    getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    getMany: vi.fn().mockResolvedValue({ data: [] }),
    getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    updateMany: vi.fn().mockResolvedValue({ data: [] }),
    delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    deleteMany: vi.fn().mockResolvedValue({ data: [] }),
  }),
}));

// Mock the supabase client
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock validation functions
vi.mock('../../validation/opportunities', () => ({
  validateOpportunityForm: vi.fn().mockImplementation(async (data) => {
    if (!data.name) {
      throw {
        message: 'Validation failed',
        errors: { name: 'Opportunity name is required' },
      };
    }
  }),
}));

vi.mock('../../validation/organizations', () => ({
  validateOrganizationForSubmission: vi.fn().mockImplementation(async (data) => {
    if (!data.name) {
      throw {
        message: 'Validation failed',
        errors: { name: 'Organization name is required' },
      };
    }
  }),
}));

vi.mock('../../validation/contacts', () => ({
  validateContactForm: vi.fn().mockImplementation(async (data) => {
    if (!data.first_name && !data.last_name) {
      throw {
        message: 'Validation failed',
        errors: {
          first_name: 'At least first or last name is required',
          last_name: 'At least first or last name is required',
        },
      };
    }
  }),
}));

vi.mock('../../validation/tags', () => ({
  validateCreateTag: vi.fn().mockImplementation((data) => {
    if (!data.name) {
      throw new Error('Tag name is required');
    }
    return data;
  }),
  validateUpdateTag: vi.fn().mockImplementation((data) => {
    if (!data.id) {
      throw new Error('Tag ID is required for update');
    }
    return data;
  }),
}));

describe('UnifiedDataProvider Validation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create operations', () => {
    it('should validate opportunities on create', async () => {
      // Attempt to create an opportunity without required fields
      await expect(
        unifiedDataProvider.create('opportunities', {
          data: { amount: 100 },
        })
      ).rejects.toMatchObject({
        message: 'Validation failed',
        errors: { name: 'Opportunity name is required' },
      });
    });

    it('should validate organizations on create', async () => {
      // Attempt to create an organization without required fields
      await expect(
        unifiedDataProvider.create('organizations', {
          data: { website: 'https://example.com' },
        })
      ).rejects.toMatchObject({
        message: 'Validation failed',
        errors: { name: 'Organization name is required' },
      });
    });

    it('should validate companies (alias for organizations) on create', async () => {
      // Attempt to create an organization without required fields
      await expect(
        unifiedDataProvider.create('companies', {
          data: { website: 'https://example.com' },
        })
      ).rejects.toMatchObject({
        message: 'Validation failed',
        errors: { name: 'Organization name is required' },
      });
    });

    it('should validate contacts on create', async () => {
      // Attempt to create a contact without required fields
      await expect(
        unifiedDataProvider.create('contacts', {
          data: { email: 'test@example.com' },
        })
      ).rejects.toMatchObject({
        message: 'Validation failed',
        errors: {
          first_name: 'At least first or last name is required',
          last_name: 'At least first or last name is required',
        },
      });
    });

    it('should pass validation with valid data', async () => {
      const result = await unifiedDataProvider.create('opportunities', {
        data: {
          name: 'Test Opportunity',
          amount: 100,
        },
      });

      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('Update operations', () => {
    it('should validate opportunities on update', async () => {
      // Clear name which should fail validation
      await expect(
        unifiedDataProvider.update('opportunities', {
          id: 1,
          data: { name: '' },
          previousData: { id: 1, name: 'Old Name' },
        })
      ).rejects.toMatchObject({
        message: 'Validation failed',
      });
    });

    it('should validate tags on update', async () => {
      // Update a tag with valid data should work
      const result = await unifiedDataProvider.update('tags', {
        id: 1,
        data: { id: 1, name: 'Updated Tag' },
        previousData: { id: 1, name: 'Old Tag' },
      });

      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('Registry', () => {
    it('should have validation registered for key resources', () => {
      expect(validationRegistry.opportunities).toBeDefined();
      expect(validationRegistry.organizations).toBeDefined();
      expect(validationRegistry.companies).toBeDefined();
      expect(validationRegistry.contacts).toBeDefined();
      expect(validationRegistry.tags).toBeDefined();
    });

    it('should correctly identify resources with validation', async () => {
      const { resourceUsesValidation } = await import('./unifiedDataProvider');

      expect(resourceUsesValidation('opportunities')).toBe(true);
      expect(resourceUsesValidation('organizations')).toBe(true);
      expect(resourceUsesValidation('contacts')).toBe(true);
      expect(resourceUsesValidation('tags')).toBe(true);
      expect(resourceUsesValidation('unknown')).toBe(false);
    });
  });
});