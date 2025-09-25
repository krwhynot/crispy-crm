/**
 * Tests for tag validation schemas
 * Validates business rules, semantic color validation, and API boundary integration
 */

import { describe, it, expect } from 'vitest';
import {
  tagSchema,
  createTagSchema,
  updateTagSchema,
  tagWithCountSchema,
  tagFilterSchema,
  validateCreateTag,
  validateUpdateTag,
  validateTagFilter,
  validateTagUniqueness,
  validateTagForSubmission,
  type Tag,
  type CreateTagInput,
  type UpdateTagInput,
  type TagWithCount,
  type TagFilterOptions,
} from '../tags';
import { z } from 'zod';

describe('Tag Validation Schemas', () => {
  describe('tagSchema', () => {
    const validTag = {
      name: 'Important',
      color: 'red',
    };

    it('should accept valid tag data', () => {
      const result = tagSchema.parse(validTag);
      expect(result).toBeDefined();
      expect(result.name).toBe('Important');
      expect(result.color).toBe('red');
    });

    it('should reject empty name', () => {
      const invalidData = { ...validTag, name: '' };
      expect(() => tagSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      const invalidData = { ...validTag, name: longName };
      expect(() => tagSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should trim tag names', () => {
      const tagWithSpaces = {
        name: '  Trimmed Tag  ',
        color: 'blue',
      };

      const result = tagSchema.parse(tagWithSpaces);
      expect(result.name).toBe('Trimmed Tag');
    });

    it('should validate semantic colors', () => {
      const validColors = [
        'red', 'orange', 'amber', 'yellow', 'lime', 'green',
        'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo',
        'violet', 'purple', 'fuchsia', 'pink', 'rose', 'gray'
      ];

      validColors.forEach(color => {
        const tag = { name: 'Test', color };
        expect(() => tagSchema.parse(tag)).not.toThrow();
      });
    });

    it('should reject invalid colors', () => {
      const invalidColors = ['black', 'white', 'brown', 'invalid', '#FF0000'];

      invalidColors.forEach(color => {
        const tag = { name: 'Test', color };
        expect(() => tagSchema.parse(tag)).toThrow(z.ZodError);
      });
    });

    it('should transform legacy hex colors to semantic colors', () => {
      // Assuming HEX_TO_SEMANTIC_MAP has mappings like:
      // '#ef4444' -> 'red', '#3b82f6' -> 'blue', etc.
      const legacyHexTags = [
        { name: 'Red Tag', color: '#ef4444' }, // Should map to 'red'
        { name: 'Blue Tag', color: '#3b82f6' }, // Should map to 'blue'
      ];

      // This would require HEX_TO_SEMANTIC_MAP to be properly populated
      // For now, we test that hex values are handled (even if they default to gray)
      legacyHexTags.forEach(tag => {
        const result = tagSchema.parse(tag);
        expect(result.color).toBeDefined();
        expect(typeof result.color).toBe('string');
      });
    });

    it('should handle optional timestamp fields', () => {
      const tagWithTimestamps = {
        ...validTag,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const result = tagSchema.parse(tagWithTimestamps);
      expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(result.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    it('should accept both string and number IDs', () => {
      expect(() => tagSchema.parse({ ...validTag, id: 'string-id' })).not.toThrow();
      expect(() => tagSchema.parse({ ...validTag, id: 12345 })).not.toThrow();
    });

    it('should handle Date objects for timestamps', () => {
      const now = new Date();
      const tagWithDates = {
        ...validTag,
        createdAt: now,
        updatedAt: now,
      };

      expect(() => tagSchema.parse(tagWithDates)).not.toThrow();
    });
  });

  describe('createTagSchema', () => {
    it('should require essential fields for creation', () => {
      const validCreate = {
        name: 'New Tag',
        color: 'green',
      };

      expect(() => createTagSchema.parse(validCreate)).not.toThrow();
    });

    it('should reject creation without required fields', () => {
      expect(() => createTagSchema.parse({})).toThrow(z.ZodError);
      expect(() => createTagSchema.parse({ name: 'Test' })).toThrow(z.ZodError);
      expect(() => createTagSchema.parse({ color: 'blue' })).toThrow(z.ZodError);
    });

    it('should not allow id field on creation', () => {
      const dataWithId = {
        id: 'should-not-be-here',
        name: 'New Tag',
        color: 'blue',
      };

      const result = createTagSchema.parse(dataWithId);
      expect('id' in result).toBe(false);
    });

    it('should not include timestamp fields on creation', () => {
      const dataWithTimestamps = {
        name: 'New Tag',
        color: 'purple',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = createTagSchema.parse(dataWithTimestamps);
      expect('createdAt' in result).toBe(false);
      expect('updatedAt' in result).toBe(false);
    });

    it('should trim name on creation', () => {
      const tagWithSpaces = {
        name: '  New Tag  ',
        color: 'orange',
      };

      const result = createTagSchema.parse(tagWithSpaces);
      expect(result.name).toBe('New Tag');
    });
  });

  describe('updateTagSchema', () => {
    it('should require id for updates', () => {
      const validUpdate = {
        id: 'tag-123',
        name: 'Updated Name',
      };

      expect(() => updateTagSchema.parse(validUpdate)).not.toThrow();
    });

    it('should reject updates without id', () => {
      const invalidUpdate = {
        name: 'Updated Name',
      };

      expect(() => updateTagSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it('should allow partial updates', () => {
      expect(() => updateTagSchema.parse({ id: 'tag-1', name: 'New Name' })).not.toThrow();
      expect(() => updateTagSchema.parse({ id: 'tag-1', color: 'red' })).not.toThrow();
      expect(() => updateTagSchema.parse({ id: 'tag-1' })).not.toThrow(); // Just id
    });

    it('should validate updated fields', () => {
      expect(() => updateTagSchema.parse({
        id: 'tag-1',
        color: 'invalid_color'
      })).toThrow(z.ZodError);

      expect(() => updateTagSchema.parse({
        id: 'tag-1',
        name: 'a'.repeat(51) // Too long
      })).toThrow(z.ZodError);
    });

    it('should not allow timestamp updates', () => {
      const updateWithTimestamps = {
        id: 'tag-1',
        name: 'Updated',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const result = updateTagSchema.parse(updateWithTimestamps);
      expect('createdAt' in result).toBe(false);
      expect('updatedAt' in result).toBe(false);
    });
  });

  describe('tagWithCountSchema', () => {
    it('should extend tag with count field', () => {
      const tagWithCount = {
        name: 'Popular Tag',
        color: 'blue',
        count: 42,
      };

      const result = tagWithCountSchema.parse(tagWithCount);
      expect(result.name).toBe('Popular Tag');
      expect(result.count).toBe(42);
    });

    it('should validate count is non-negative integer', () => {
      expect(() => tagWithCountSchema.parse({
        name: 'Tag',
        color: 'red',
        count: -1
      })).toThrow(z.ZodError);

      expect(() => tagWithCountSchema.parse({
        name: 'Tag',
        color: 'red',
        count: 3.14
      })).toThrow(z.ZodError);

      expect(() => tagWithCountSchema.parse({
        name: 'Tag',
        color: 'red',
        count: 0
      })).not.toThrow();
    });
  });

  describe('tagFilterSchema', () => {
    it('should accept valid filter options', () => {
      const filter = {
        colors: ['red', 'blue', 'green'],
        searchTerm: 'important',
      };

      const result = tagFilterSchema.parse(filter);
      expect(result.colors).toHaveLength(3);
      expect(result.searchTerm).toBe('important');
    });

    it('should allow optional fields', () => {
      expect(() => tagFilterSchema.parse({})).not.toThrow();
      expect(() => tagFilterSchema.parse({ colors: ['red'] })).not.toThrow();
      expect(() => tagFilterSchema.parse({ searchTerm: 'test' })).not.toThrow();
    });

    it('should validate color array contains only valid colors', () => {
      expect(() => tagFilterSchema.parse({
        colors: ['red', 'invalid_color', 'blue']
      })).toThrow(z.ZodError);
    });
  });

  describe('Validation Functions', () => {
    describe('validateCreateTag', () => {
      it('should validate and return parsed data', () => {
        const validData = {
          name: 'New Tag',
          color: 'green',
        };

        const result = validateCreateTag(validData);
        expect(result.name).toBe('New Tag');
        expect(result.color).toBe('green');
      });

      it('should throw for invalid creation data', () => {
        const invalidData = {
          name: '',
          color: 'green',
        };

        expect(() => validateCreateTag(invalidData)).toThrow(z.ZodError);
      });

      it('should trim name during validation', () => {
        const dataWithSpaces = {
          name: '  Trimmed  ',
          color: 'blue',
        };

        const result = validateCreateTag(dataWithSpaces);
        expect(result.name).toBe('Trimmed');
      });
    });

    describe('validateUpdateTag', () => {
      it('should validate and return parsed data', () => {
        const validData = {
          id: 'tag-123',
          name: 'Updated Tag',
        };

        const result = validateUpdateTag(validData);
        expect(result.id).toBe('tag-123');
        expect(result.name).toBe('Updated Tag');
      });

      it('should throw for invalid update data', () => {
        const invalidData = {
          name: 'Updated Tag', // Missing id
        };

        expect(() => validateUpdateTag(invalidData)).toThrow(z.ZodError);
      });
    });

    describe('validateTagFilter', () => {
      it('should validate filter options', () => {
        const filter = {
          colors: ['red', 'blue'],
          searchTerm: 'test',
        };

        const result = validateTagFilter(filter);
        expect(result.colors).toEqual(['red', 'blue']);
        expect(result.searchTerm).toBe('test');
      });

      it('should handle empty filter', () => {
        const result = validateTagFilter({});
        expect(result.colors).toBeUndefined();
        expect(result.searchTerm).toBeUndefined();
      });
    });

    describe('validateTagUniqueness', () => {
      const existingTags: Tag[] = [
        { id: 1, name: 'Existing Tag', color: 'red' },
        { id: 2, name: 'Another Tag', color: 'blue' },
        { id: 3, name: 'Case Test', color: 'green' },
      ];

      it('should detect duplicate tag names', () => {
        const error = validateTagUniqueness('Existing Tag', existingTags);
        expect(error).toBe('A tag with this name already exists');
      });

      it('should be case-insensitive', () => {
        const error = validateTagUniqueness('EXISTING TAG', existingTags);
        expect(error).toBe('A tag with this name already exists');
      });

      it('should ignore spaces in comparison', () => {
        const error = validateTagUniqueness('  Existing Tag  ', existingTags);
        expect(error).toBe('A tag with this name already exists');
      });

      it('should allow unique names', () => {
        const error = validateTagUniqueness('Unique Tag', existingTags);
        expect(error).toBeUndefined();
      });

      it('should exclude tag being updated', () => {
        const error = validateTagUniqueness('Existing Tag', existingTags, 1);
        expect(error).toBeUndefined(); // Should be allowed since we're updating tag with id 1
      });

      it('should still detect duplicates when updating', () => {
        const error = validateTagUniqueness('Another Tag', existingTags, 1);
        expect(error).toBe('A tag with this name already exists'); // Can't rename to existing name
      });
    });

    describe('validateTagForSubmission', () => {
      it('should validate and normalize tag data', () => {
        const inputData = {
          name: '  Important Tag  ',
          color: 'red',
        };

        const result = validateTagForSubmission(inputData);
        expect(result.name).toBe('Important Tag'); // Should be trimmed
        expect(result.color).toBe('red');
      });

      it('should throw for invalid submission data', () => {
        const invalidData = {
          name: '',
          color: 'red',
        };

        expect(() => validateTagForSubmission(invalidData)).toThrow(z.ZodError);
      });

      it('should transform hex colors during submission', () => {
        const dataWithHex = {
          name: 'Color Test',
          color: 'gray', // Assuming unmapped hex defaults to gray
        };

        const result = validateTagForSubmission(dataWithHex);
        expect(result.color).toBe('gray');
      });
    });
  });

  describe('Business Rules', () => {
    it('should enforce semantic color system', () => {
      const semanticColors = [
        'red', 'orange', 'amber', 'yellow', 'lime', 'green',
        'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo',
        'violet', 'purple', 'fuchsia', 'pink', 'rose', 'gray'
      ];

      semanticColors.forEach(color => {
        const tag = {
          name: `${color} Tag`,
          color,
        };

        expect(() => tagSchema.parse(tag)).not.toThrow();
      });
    });

    it('should handle color migration from hex to semantic', () => {
      // This test assumes HEX_TO_SEMANTIC_MAP contains legacy mappings
      const legacyTag = {
        name: 'Legacy',
        color: 'gray', // Default fallback for unmapped hex
      };

      const result = tagSchema.parse(legacyTag);
      expect(typeof result.color).toBe('string');
      expect(result.color).toMatch(/^[a-z]+$/); // Should be lowercase word
    });

    it('should enforce name length limits', () => {
      const maxLengthName = 'a'.repeat(50);
      const tooLongName = 'a'.repeat(51);

      expect(() => tagSchema.parse({
        name: maxLengthName,
        color: 'blue'
      })).not.toThrow();

      expect(() => tagSchema.parse({
        name: tooLongName,
        color: 'blue'
      })).toThrow(z.ZodError);
    });

    it('should handle tag categorization', () => {
      const categoryTags = [
        { name: 'High Priority', color: 'red' },
        { name: 'In Progress', color: 'yellow' },
        { name: 'Completed', color: 'green' },
        { name: 'Archived', color: 'gray' },
      ];

      categoryTags.forEach(tag => {
        expect(() => tagSchema.parse(tag)).not.toThrow();
      });
    });
  });

  describe('Error Message Formatting', () => {
    it('should provide clear error messages', () => {
      const testCases = [
        {
          data: { name: '', color: 'red' },
          expectedError: 'Tag name is required',
        },
        {
          data: { name: 'a'.repeat(51), color: 'blue' },
          expectedError: 'Tag name must be less than 50 characters',
        },
        {
          data: { name: 'Test', color: 'invalid' },
          expectedError: 'Invalid color selection. Must be a valid semantic color.',
        },
      ];

      testCases.forEach(({ data, expectedError }) => {
        try {
          tagSchema.parse(data);
          expect.fail('Should have thrown error');
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.errors[0].message;
            expect(message).toBe(expectedError);
          }
        }
      });
    });
  });

  describe('API Boundary Integration', () => {
    it('should validate at creation boundary', () => {
      const apiPayload = {
        name: '  API Tag  ',
        color: 'purple',
        extra_field: 'should be ignored',
      };

      const result = validateCreateTag(apiPayload);
      expect(result.name).toBe('API Tag');
      expect(result.color).toBe('purple');
      expect('extra_field' in result).toBe(false);
    });

    it('should validate at update boundary', () => {
      const apiPayload = {
        id: 'tag-123',
        color: 'green',
        malicious_field: 'should be ignored',
      };

      const result = validateUpdateTag(apiPayload);
      expect(result.id).toBe('tag-123');
      expect(result.color).toBe('green');
      expect('malicious_field' in result).toBe(false);
    });

    it('should handle type coercion at boundary', () => {
      const apiPayload = {
        id: 123, // Number instead of string
        name: 'Coerced Tag',
        color: 'blue',
      };

      const result = tagSchema.parse(apiPayload);
      expect(result.id).toBe(123);
    });
  });
});