/**
 * Tests for opportunity validation schemas
 * Validates business rules, data integrity, and API boundary integration
 */

import { describe, it, expect } from 'vitest';
import {
  opportunitySchema,
  createOpportunitySchema,
  updateOpportunitySchema,
  validateOpportunityForm,
  validateCreateOpportunity,
  validateUpdateOpportunity,
  opportunityStageSchema,
  opportunityStatusSchema,
  opportunityPrioritySchema,
} from '../opportunities';
import { z } from 'zod';

describe('Opportunity Validation Schemas', () => {
  describe('Enum Schemas', () => {
    describe('opportunityStageSchema', () => {
      it('should accept valid stages', () => {
        const validStages = [
          'new_lead',
          'initial_outreach',
          'sample_visit_offered',
          'awaiting_response',
          'feedback_logged',
          'demo_scheduled',
          'closed_won',
          'closed_lost'
        ];

        validStages.forEach(stage => {
          expect(() => opportunityStageSchema.parse(stage)).not.toThrow();
        });
      });

      it('should reject invalid stages', () => {
        const invalidStages = ['', 'pending', 'won', 'lost', 'invalid_stage'];

        invalidStages.forEach(stage => {
          expect(() => opportunityStageSchema.parse(stage)).toThrow(z.ZodError);
        });
      });
    });

    describe('opportunityStatusSchema', () => {
      it('should accept valid statuses', () => {
        const validStatuses = ['active', 'on_hold', 'nurturing', 'stalled', 'expired'];

        validStatuses.forEach(status => {
          expect(() => opportunityStatusSchema.parse(status)).not.toThrow();
        });
      });

      it('should reject invalid statuses', () => {
        expect(() => opportunityStatusSchema.parse('inactive')).toThrow(z.ZodError);
        expect(() => opportunityStatusSchema.parse('completed')).toThrow(z.ZodError);
      });
    });

    describe('opportunityPrioritySchema', () => {
      it('should accept valid priorities', () => {
        const validPriorities = ['low', 'medium', 'high', 'critical'];

        validPriorities.forEach(priority => {
          expect(() => opportunityPrioritySchema.parse(priority)).not.toThrow();
        });
      });

      it('should reject invalid priorities', () => {
        expect(() => opportunityPrioritySchema.parse('urgent')).toThrow(z.ZodError);
        expect(() => opportunityPrioritySchema.parse('normal')).toThrow(z.ZodError);
      });
    });
  });

  describe('opportunitySchema', () => {
    const validOpportunity = {
      name: 'Test Opportunity',
      contact_ids: ['contact-1', 'contact-2'],
      stage: 'new_lead',
      priority: 'medium',
      amount: 10000,
      probability: 75,
      expected_closing_date: '2024-12-31',
    };

    it('should accept valid opportunity data', () => {
      const result = opportunitySchema.parse(validOpportunity);
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Opportunity');
      expect(result.probability).toBe(75);
    });

    it('should provide default values', () => {
      const minimalOpportunity = {
        name: 'Minimal Opportunity',
        contact_ids: ['contact-1'],
        expected_closing_date: '2024-12-31',
      };

      const result = opportunitySchema.parse(minimalOpportunity);
      expect(result.stage).toBe('new_lead');
      expect(result.priority).toBe('medium');
      expect(result.amount).toBe(0);
      expect(result.probability).toBe(50);
    });

    it('should reject empty name', () => {
      const invalidData = { ...validOpportunity, name: '' };
      expect(() => opportunitySchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject empty contact_ids array', () => {
      const invalidData = { ...validOpportunity, contact_ids: [] };
      expect(() => opportunitySchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should validate probability range (0-100)', () => {
      // Valid probabilities
      expect(() => opportunitySchema.parse({ ...validOpportunity, probability: 0 })).not.toThrow();
      expect(() => opportunitySchema.parse({ ...validOpportunity, probability: 100 })).not.toThrow();
      expect(() => opportunitySchema.parse({ ...validOpportunity, probability: 50 })).not.toThrow();

      // Invalid probabilities
      expect(() => opportunitySchema.parse({ ...validOpportunity, probability: -1 })).toThrow(z.ZodError);
      expect(() => opportunitySchema.parse({ ...validOpportunity, probability: 101 })).toThrow(z.ZodError);
      expect(() => opportunitySchema.parse({ ...validOpportunity, probability: 150 })).toThrow(z.ZodError);
    });

    it('should validate amount is positive', () => {
      expect(() => opportunitySchema.parse({ ...validOpportunity, amount: -100 })).toThrow(z.ZodError);
      expect(() => opportunitySchema.parse({ ...validOpportunity, amount: -0.01 })).toThrow(z.ZodError);
    });

    it('should accept both string and number IDs', () => {
      expect(() => opportunitySchema.parse({ ...validOpportunity, id: 'string-id' })).not.toThrow();
      expect(() => opportunitySchema.parse({ ...validOpportunity, id: 12345 })).not.toThrow();
      expect(() => opportunitySchema.parse({ ...validOpportunity, customer_organization_id: 'org-1' })).not.toThrow();
      expect(() => opportunitySchema.parse({ ...validOpportunity, customer_organization_id: 100 })).not.toThrow();
    });

    it('should handle nullable fields', () => {
      const dataWithNulls = {
        ...validOpportunity,
        principal_organization_id: null,
        distributor_organization_id: null,
        actual_close_date: null,
        next_action: null,
        next_action_date: null,
        competition: null,
        decision_criteria: null,
      };

      expect(() => opportunitySchema.parse(dataWithNulls)).not.toThrow();
    });

    it('should handle optional fields', () => {
      const minimalData = {
        name: 'Minimal',
        contact_ids: ['contact-1'],
        expected_closing_date: '2024-12-31',
      };

      const result = opportunitySchema.parse(minimalData);
      expect(result.category).toBeUndefined();
      expect(result.status).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.sales_id).toBeUndefined();
    });
  });

  describe('createOpportunitySchema', () => {
    it('should require essential fields for creation', () => {
      const validCreate = {
        name: 'New Opportunity',
        contact_ids: ['contact-1'],
        expected_closing_date: '2024-12-31',
      };

      expect(() => createOpportunitySchema.parse(validCreate)).not.toThrow();
    });

    it('should reject creation without required fields', () => {
      expect(() => createOpportunitySchema.parse({})).toThrow(z.ZodError);
      expect(() => createOpportunitySchema.parse({ name: 'Test' })).toThrow(z.ZodError);
      expect(() => createOpportunitySchema.parse({
        name: 'Test',
        contact_ids: ['contact-1']
      })).toThrow(z.ZodError);
    });

    it('should not allow id field on creation', () => {
      const dataWithId = {
        id: 'should-not-be-here',
        name: 'New Opportunity',
        contact_ids: ['contact-1'],
        expected_closing_date: '2024-12-31',
      };

      const result = createOpportunitySchema.parse(dataWithId);
      expect('id' in result).toBe(false);
    });

    it('should not include system fields on creation', () => {
      const dataWithSystemFields = {
        name: 'New Opportunity',
        contact_ids: ['contact-1'],
        expected_closing_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: '2024-01-01T00:00:00Z',
      };

      const result = createOpportunitySchema.parse(dataWithSystemFields);
      expect('created_at' in result).toBe(false);
      expect('updated_at' in result).toBe(false);
      expect('deleted_at' in result).toBe(false);
    });
  });

  describe('updateOpportunitySchema', () => {
    it('should require id for updates', () => {
      const validUpdate = {
        id: 'opp-123',
        name: 'Updated Name',
      };

      expect(() => updateOpportunitySchema.parse(validUpdate)).not.toThrow();
    });

    it('should reject updates without id', () => {
      const invalidUpdate = {
        name: 'Updated Name',
      };

      expect(() => updateOpportunitySchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it('should allow partial updates', () => {
      expect(() => updateOpportunitySchema.parse({ id: 'opp-1', name: 'New Name' })).not.toThrow();
      expect(() => updateOpportunitySchema.parse({ id: 'opp-1', amount: 5000 })).not.toThrow();
      expect(() => updateOpportunitySchema.parse({ id: 'opp-1', stage: 'initial_outreach' })).not.toThrow();
      expect(() => updateOpportunitySchema.parse({ id: 'opp-1' })).not.toThrow(); // Just id
    });

    it('should validate updated fields', () => {
      expect(() => updateOpportunitySchema.parse({
        id: 'opp-1',
        probability: 150
      })).toThrow(z.ZodError);

      expect(() => updateOpportunitySchema.parse({
        id: 'opp-1',
        stage: 'invalid_stage'
      })).toThrow(z.ZodError);
    });
  });

  describe('Validation Functions', () => {
    describe('validateOpportunityForm', () => {
      it('should validate and pass valid data', async () => {
        const validData = {
          name: 'Test Opportunity',
          contact_ids: ['contact-1'],
          expected_closing_date: '2024-12-31',
          amount: 10000,
          probability: 75,
        };

        await expect(validateOpportunityForm(validData)).resolves.toBeUndefined();
      });

      it('should format errors for React Admin', async () => {
        const invalidData = {
          name: '',
          contact_ids: [],
          expected_closing_date: '',
          probability: 150,
          amount: -100,
        };

        try {
          await validateOpportunityForm(invalidData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
          expect(error.errors).toBeDefined();
          expect(error.errors.name).toBe('Opportunity name is required');
          expect(error.errors.contact_ids).toBe('At least one contact is required');
          expect(error.errors.expected_closing_date).toBe('Expected closing date is required');
          expect(error.errors.probability).toBe('Probability must be between 0 and 100');
          expect(error.errors.amount).toBe('Amount must be positive');
        }
      });

      it('should handle nested path errors correctly', async () => {
        const invalidData = {
          name: 'Test',
          contact_ids: ['valid-id'],
          expected_closing_date: '2024-12-31',
          stage: 'invalid_stage',
        };

        try {
          await validateOpportunityForm(invalidData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.errors.stage).toBeDefined();
        }
      });
    });

    describe('validateCreateOpportunity', () => {
      it('should validate creation data', async () => {
        const validData = {
          name: 'New Opportunity',
          contact_ids: ['contact-1'],
          expected_closing_date: '2024-12-31',
        };

        await expect(validateCreateOpportunity(validData)).resolves.toBeUndefined();
      });

      it('should reject incomplete creation data', async () => {
        const incompleteData = {
          name: 'New Opportunity',
        };

        try {
          await validateCreateOpportunity(incompleteData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
          expect(error.errors).toBeDefined();
        }
      });
    });

    describe('validateUpdateOpportunity', () => {
      it('should validate update data', async () => {
        const validData = {
          id: 'opp-123',
          name: 'Updated Opportunity',
          probability: 80,
        };

        await expect(validateUpdateOpportunity(validData)).resolves.toBeUndefined();
      });

      it('should reject update without id', async () => {
        const invalidData = {
          name: 'Updated Opportunity',
        };

        try {
          await validateUpdateOpportunity(invalidData);
          expect.fail('Should have thrown validation error');
        } catch (error: any) {
          expect(error.message).toBe('Validation failed');
          expect(error.errors.id).toBeDefined();
        }
      });
    });
  });

  describe('Business Rules', () => {
    it('should enforce probability business rule (0-100)', () => {
      const testCases = [
        { probability: 0, shouldPass: true },
        { probability: 25, shouldPass: true },
        { probability: 50, shouldPass: true },
        { probability: 75, shouldPass: true },
        { probability: 100, shouldPass: true },
        { probability: -1, shouldPass: false },
        { probability: -10, shouldPass: false },
        { probability: 101, shouldPass: false },
        { probability: 200, shouldPass: false },
      ];

      testCases.forEach(({ probability, shouldPass }) => {
        const data = {
          name: 'Test',
          contact_ids: ['contact-1'],
          expected_closing_date: '2024-12-31',
          probability,
        };

        if (shouldPass) {
          expect(() => opportunitySchema.parse(data)).not.toThrow();
        } else {
          expect(() => opportunitySchema.parse(data)).toThrow(z.ZodError);
        }
      });
    });

    it('should handle stage progression rules', () => {
      const validStageProgressions = [
        { from: 'new_lead', to: 'initial_outreach' },
        { from: 'initial_outreach', to: 'sample_visit_offered' },
        { from: 'sample_visit_offered', to: 'awaiting_response' },
        { from: 'awaiting_response', to: 'feedback_logged' },
        { from: 'feedback_logged', to: 'demo_scheduled' },
        { from: 'demo_scheduled', to: 'closed_won' },
        { from: 'demo_scheduled', to: 'closed_lost' },
      ];

      // Schema should accept all valid stages
      validStageProgressions.forEach(({ to }) => {
        const data = {
          name: 'Test',
          contact_ids: ['contact-1'],
          expected_closing_date: '2024-12-31',
          stage: to,
        };

        expect(() => opportunitySchema.parse(data)).not.toThrow();
      });
    });

    it('should validate multi-organization relationships', () => {
      const multiOrgData = {
        name: 'Multi-Org Opportunity',
        contact_ids: ['contact-1'],
        expected_closing_date: '2024-12-31',
        customer_organization_id: 'org-customer',
        principal_organization_id: 'org-principal',
        distributor_organization_id: 'org-distributor',
      };

      expect(() => opportunitySchema.parse(multiOrgData)).not.toThrow();
    });
  });

  describe('Error Message Formatting', () => {
    it('should provide clear error messages', async () => {
      const testCases = [
        {
          data: { name: '', contact_ids: ['c1'], expected_closing_date: '2024-12-31' },
          expectedError: 'Opportunity name is required',
          field: 'name'
        },
        {
          data: { name: 'Test', contact_ids: [], expected_closing_date: '2024-12-31' },
          expectedError: 'At least one contact is required',
          field: 'contact_ids'
        },
        {
          data: { name: 'Test', contact_ids: ['c1'], expected_closing_date: '' },
          expectedError: 'Expected closing date is required',
          field: 'expected_closing_date'
        },
        {
          data: { name: 'Test', contact_ids: ['c1'], expected_closing_date: '2024-12-31', probability: 150 },
          expectedError: 'Probability must be between 0 and 100',
          field: 'probability'
        },
        {
          data: { name: 'Test', contact_ids: ['c1'], expected_closing_date: '2024-12-31', amount: -100 },
          expectedError: 'Amount must be positive',
          field: 'amount'
        },
      ];

      for (const { data, expectedError, field } of testCases) {
        try {
          await validateOpportunityForm(data);
          expect.fail(`Should have thrown error for field: ${field}`);
        } catch (error: any) {
          expect(error.errors[field]).toBe(expectedError);
        }
      }
    });
  });
});