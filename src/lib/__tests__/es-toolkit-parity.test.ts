/**
 * es-toolkit Migration Parity Tests
 *
 * These tests verify that es-toolkit functions behave identically
 * to their lodash equivalents for our specific use cases.
 */
import { describe, it, expect } from 'vitest';

// Phase 1 imports (will switch from lodash to es-toolkit)
import { get } from "es-toolkit/compat";
import { isEqual } from "es-toolkit";
import { pickBy } from "es-toolkit/compat";
import { set } from "es-toolkit/compat";

// Phase 2 imports
import { isMatch } from "es-toolkit/compat";

describe('es-toolkit parity with lodash', () => {
  describe('get - deep property access', () => {
    const obj = {
      a: { b: { c: 3 } },
      'x.y': { z: 4 },
      arr: [{ id: 1 }, { id: 2 }],
    };

    it('accesses nested properties with dot notation', () => {
      expect(get(obj, 'a.b.c')).toBe(3);
    });

    it('accesses nested properties with array notation', () => {
      expect(get(obj, ['a', 'b', 'c'])).toBe(3);
    });

    it('returns undefined for missing paths', () => {
      expect(get(obj, 'a.b.d')).toBeUndefined();
    });

    it('returns default value for missing paths', () => {
      expect(get(obj, 'a.b.d', 'default')).toBe('default');
    });

    it('accesses array elements', () => {
      expect(get(obj, 'arr[0].id')).toBe(1);
      expect(get(obj, 'arr.1.id')).toBe(2);
    });

    it('handles null/undefined objects', () => {
      expect(get(null, 'a.b')).toBeUndefined();
      expect(get(undefined, 'a.b', 'fallback')).toBe('fallback');
    });
  });

  describe('set - deep property mutation', () => {
    it('sets nested properties', () => {
      const obj = { a: { b: 1 } };
      set(obj, 'a.c', 2);
      expect(obj).toEqual({ a: { b: 1, c: 2 } });
    });

    it('creates intermediate objects', () => {
      const obj = {};
      set(obj, 'a.b.c', 1);
      expect(obj).toEqual({ a: { b: { c: 1 } } });
    });

    it('creates arrays for numeric paths', () => {
      const obj = {};
      set(obj, 'a[0]', 1);
      expect(obj).toEqual({ a: [1] });
    });
  });

  describe('isEqual - deep equality', () => {
    it('compares primitives', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual('a', 'a')).toBe(true);
      expect(isEqual(null, null)).toBe(true);
    });

    it('compares objects deeply', () => {
      expect(isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('compares arrays', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('compares Date objects', () => {
      const d1 = new Date('2025-01-01');
      const d2 = new Date('2025-01-01');
      expect(isEqual(d1, d2)).toBe(true);
    });

    it('compares nested arrays in objects', () => {
      expect(isEqual(
        { filters: [{ field: 'a' }] },
        { filters: [{ field: 'a' }] }
      )).toBe(true);
    });
  });

  describe('pickBy - filter object by predicate', () => {
    it('filters object properties by predicate', () => {
      const obj = { a: 1, b: undefined, c: 3, d: null };
      const result = pickBy(obj, (val) => val !== undefined);
      expect(result).toEqual({ a: 1, c: 3, d: null });
    });

    it('filters by truthy values', () => {
      const obj = { a: 1, b: 0, c: '', d: 'hello' };
      const result = pickBy(obj, Boolean);
      expect(result).toEqual({ a: 1, d: 'hello' });
    });
  });

  describe('isMatch - partial object matching (replaces matches)', () => {
    it('matches partial objects', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(isMatch(obj, { a: 1 })).toBe(true);
      expect(isMatch(obj, { a: 1, b: 2 })).toBe(true);
      expect(isMatch(obj, { a: 2 })).toBe(false);
    });

    it('matches nested objects', () => {
      const obj = { a: { b: 2 }, c: 3 };
      expect(isMatch(obj, { a: { b: 2 } })).toBe(true);
    });

    it('works with undefined filtering pattern', () => {
      // This is the exact pattern from toggle-filter-button.tsx
      const filters = { status: 'active', priority: 'high' };
      const value = { status: 'active', other: undefined };
      const cleanedValue = pickBy(value, (val) => typeof val !== 'undefined');
      expect(isMatch(filters, cleanedValue)).toBe(true);
    });
  });
});
