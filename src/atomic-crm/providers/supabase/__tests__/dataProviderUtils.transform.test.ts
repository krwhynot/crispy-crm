/**
 * Tests for transformArrayFilters
 * CRITICAL: Data integrity tests for PostgREST operator transformation
 *
 * Engineering Constitution: Test what matters - correct operator mapping
 */

import { describe, it, expect } from 'vitest';
import { transformArrayFilters } from '../dataProviderUtils';

describe('transformArrayFilters', () => {
  describe('null and undefined handling', () => {
    it('should return empty object for null', () => {
      expect(transformArrayFilters(null)).toEqual({});
    });

    it('should return empty object for undefined', () => {
      expect(transformArrayFilters(undefined)).toEqual({});
    });

    it('should handle non-object values gracefully', () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      // Note: Current implementation returns the input, not empty object
      expect(transformArrayFilters('string')).toEqual('string');
      // @ts-expect-error - testing runtime behavior with invalid input
      expect(transformArrayFilters(123)).toEqual(123);
      // @ts-expect-error - testing runtime behavior
      expect(transformArrayFilters(true)).toEqual(true);
    });
  });

  describe('JSONB array fields (tags, email, phone)', () => {
    it('should transform tags array to @cs operator', () => {
      const filter = { tags: [1, 2, 3] };
      expect(transformArrayFilters(filter)).toEqual({
        'tags@cs': '{1,2,3}'
      });
    });

    it('should transform email array to @cs operator', () => {
      const filter = { email: ['user@example.com', 'admin@test.com'] };
      expect(transformArrayFilters(filter)).toEqual({
        // Emails get quoted due to @ and . being special characters
        'email@cs': '{"user@example.com","admin@test.com"}'
      });
    });

    it('should transform phone array to @cs operator', () => {
      const filter = { phone: ['+1234567890', '+0987654321'] };
      expect(transformArrayFilters(filter)).toEqual({
        'phone@cs': '{+1234567890,+0987654321}'
      });
    });

    it('should escape special characters in JSONB array values', () => {
      const filter = { email: ['user@example.com', 'name, with, commas'] };
      expect(transformArrayFilters(filter)).toEqual({
        // Both emails get quoted - first has @ and ., second has commas
        'email@cs': '{"user@example.com","name, with, commas"}'
      });
    });

    it('should handle mixed types in JSONB arrays', () => {
      const filter = { tags: [1, 'active', true] };
      expect(transformArrayFilters(filter)).toEqual({
        'tags@cs': '{1,active,true}'
      });
    });
  });

  describe('regular array fields (non-JSONB)', () => {
    it('should transform status array to @in operator', () => {
      const filter = { status: ['active', 'pending'] };
      expect(transformArrayFilters(filter)).toEqual({
        'status@in': '(active,pending)'
      });
    });

    it('should transform priority array to @in operator', () => {
      const filter = { priority: ['high', 'medium', 'low'] };
      expect(transformArrayFilters(filter)).toEqual({
        'priority@in': '(high,medium,low)'
      });
    });

    it('should escape special characters in regular array values', () => {
      const filter = { category: ['simple', 'with spaces', 'with,comma'] };
      expect(transformArrayFilters(filter)).toEqual({
        'category@in': '(simple,"with spaces","with,comma")'
      });
    });

    it('should handle numeric arrays', () => {
      const filter = { level: [1, 2, 3, 4, 5] };
      expect(transformArrayFilters(filter)).toEqual({
        'level@in': '(1,2,3,4,5)'
      });
    });

    it('should handle boolean arrays', () => {
      const filter = { active: [true, false] };
      expect(transformArrayFilters(filter)).toEqual({
        'active@in': '(true,false)'
      });
    });
  });

  describe('empty array handling', () => {
    it('should skip empty arrays', () => {
      const filter = {
        tags: [],
        status: [],
        name: 'test'
      };
      expect(transformArrayFilters(filter)).toEqual({
        name: 'test'
      });
    });

    it('should return empty object if all arrays are empty', () => {
      const filter = {
        tags: [],
        status: [],
        priority: []
      };
      expect(transformArrayFilters(filter)).toEqual({});
    });
  });

  describe('preserving existing PostgREST operators', () => {
    it('should preserve keys with @ operator', () => {
      const filter = {
        'name@ilike': 'test%',
        'age@gte': 18,
        'status@in': '(active,pending)'
      };
      expect(transformArrayFilters(filter)).toEqual(filter);
    });

    it('should not double-transform already transformed operators', () => {
      const filter = {
        'tags@cs': '{1,2,3}',
        'status@in': '(active)',
        newTags: [4, 5, 6]
      };
      expect(transformArrayFilters(filter)).toEqual({
        'tags@cs': '{1,2,3}',
        'status@in': '(active)',
        'newTags@in': '(4,5,6)'
      });
    });

    it('should handle @or operator correctly', () => {
      const filter = {
        '@or': {
          name: 'test',
          status: 'active'
        }
      };
      expect(transformArrayFilters(filter)).toEqual(filter);
    });
  });

  describe('non-array value handling', () => {
    it('should leave non-array values unchanged', () => {
      const filter = {
        name: 'John Doe',
        age: 30,
        active: true,
        metadata: { key: 'value' }
      };
      expect(transformArrayFilters(filter)).toEqual(filter);
    });

    it('should skip null values in filter', () => {
      const filter = {
        deleted_at: null,
        status: 'active'
      };
      // Null values are skipped/removed from the filter
      expect(transformArrayFilters(filter)).toEqual({
        status: 'active'
      });
    });

    it('should skip undefined values', () => {
      const filter = {
        name: 'test',
        age: undefined,
        status: 'active'
      };
      expect(transformArrayFilters(filter)).toEqual({
        name: 'test',
        status: 'active'
      });
    });
  });

  describe('mixed filter scenarios', () => {
    it('should handle mix of arrays, scalars, and operators', () => {
      const filter = {
        tags: [1, 2, 3],
        status: ['active', 'pending'],
        name: 'test',
        age: 25,
        'created_at@gte': '2024-01-01',
        deleted_at: null
      };
      expect(transformArrayFilters(filter)).toEqual({
        'tags@cs': '{1,2,3}',
        'status@in': '(active,pending)',
        name: 'test',
        age: 25,
        'created_at@gte': '2024-01-01'
        // deleted_at: null is skipped
      });
    });

    it('should handle complex nested scenarios', () => {
      const filter = {
        email: ['test@example.com'],
        phone: [],
        tags: [1],
        status: 'active',
        '@or': { field1: 'value1', field2: 'value2' }
      };
      expect(transformArrayFilters(filter)).toEqual({
        'email@cs': '{"test@example.com"}', // Email gets quoted
        'tags@cs': '{1}',
        status: 'active',
        '@or': { field1: 'value1', field2: 'value2' }
        // phone: [] is skipped (empty array)
      });
    });
  });

  describe('edge cases', () => {
    it('should handle arrays with single element', () => {
      const filter = {
        tags: [1],
        status: ['active']
      };
      expect(transformArrayFilters(filter)).toEqual({
        'tags@cs': '{1}',
        'status@in': '(active)'
      });
    });

    it('should handle very long arrays', () => {
      const longArray = Array.from({ length: 100 }, (_, i) => i);
      const filter = { ids: longArray };
      const result = transformArrayFilters(filter);
      expect(result['ids@in']).toMatch(/^\(0,1,2.*97,98,99\)$/);
    });

    it('should handle special PostgREST characters in values', () => {
      const filter = {
        names: ['O\'Reilly', 'Smith, Jr.', 'path\\test', '"quoted"']
      };
      expect(transformArrayFilters(filter)).toEqual({
        // Values with special chars get quoted and escaped
        // Note: single backslash doesn't trigger quoting
        'names@in': '("O\'Reilly","Smith, Jr.",path\\test,"\\"quoted\\"")'
      });
    });

    it('should handle empty object', () => {
      expect(transformArrayFilters({})).toEqual({});
    });
  });
});