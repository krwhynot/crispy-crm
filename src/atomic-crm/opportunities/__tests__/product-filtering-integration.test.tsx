/**
 * Integration Tests for Product Filtering by Principal
 *
 * Tests the complete data flow from data provider → Supabase → products_summary view
 * Ensures products are correctly filtered by principal_id at the API layer
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { supabase } from '@/atomic-crm/providers/supabase/supabase';
import { getDatabaseResource } from '@/atomic-crm/providers/supabase/dataProviderUtils';

describe('Product Filtering Integration', () => {
  // Test data
  const testPrincipalId = 1802; // Rapid Rasoi (from seed data)
  let principalProductCount = 0;

  beforeAll(async () => {
    // Count products for this principal in the test database
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('principal_id', testPrincipalId)
      .is('deleted_at', null);

    principalProductCount = count || 0;
  });

  describe('getDatabaseResource', () => {
    it('returns products_summary for list operations', () => {
      const resource = getDatabaseResource('products', 'list');
      expect(resource).toBe('products_summary');
    });

    it('returns products_summary for one operations', () => {
      const resource = getDatabaseResource('products', 'one');
      expect(resource).toBe('products_summary');
    });

    it('returns products (not summary) for create operations', () => {
      const resource = getDatabaseResource('products', 'create');
      expect(resource).toBe('products');
    });

    it('returns products (not summary) for update operations', () => {
      const resource = getDatabaseResource('products', 'update');
      expect(resource).toBe('products');
    });

    it('returns products (not summary) for delete operations', () => {
      const resource = getDatabaseResource('products', 'delete');
      expect(resource).toBe('products');
    });
  });

  describe('products_summary view', () => {
    it('exists and is accessible', async () => {
      const { data, error } = await supabase
        .from('products_summary')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('includes principal_name field', async () => {
      const { data, error } = await supabase
        .from('products_summary')
        .select('id, name, principal_id, principal_name')
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(data).toHaveProperty('principal_name');
      expect(typeof data?.principal_name).toBe('string');
    });

    it('filters products by principal_id', async () => {
      const { data, error, count } = await supabase
        .from('products_summary')
        .select('*', { count: 'exact' })
        .eq('principal_id', testPrincipalId)
        .is('deleted_at', null);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(count).toBeGreaterThan(0);
      expect(count).toBe(principalProductCount);

      // Verify all returned products have the correct principal_id
      data?.forEach((product) => {
        expect(product.principal_id).toBe(testPrincipalId);
      });
    });

    it('returns only non-deleted products', async () => {
      const { data, error } = await supabase
        .from('products_summary')
        .select('*')
        .eq('principal_id', testPrincipalId)
        .is('deleted_at', null);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Verify no products have deleted_at set
      data?.forEach((product) => {
        expect(product.deleted_at).toBeNull();
      });
    });

    it('returns empty array for non-existent principal', async () => {
      const { data, error, count } = await supabase
        .from('products_summary')
        .select('*', { count: 'exact' })
        .eq('principal_id', 999999) // Non-existent principal
        .is('deleted_at', null);

      expect(error).toBeNull();
      expect(data).toEqual([]);
      expect(count).toBe(0);
    });

    it('supports sorting by name', async () => {
      const { data, error } = await supabase
        .from('products_summary')
        .select('*')
        .eq('principal_id', testPrincipalId)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 1) {
        // Verify sorting
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].name.localeCompare(data[i + 1].name)).toBeLessThanOrEqual(0);
        }
      }
    });

    it('supports pagination', async () => {
      const pageSize = 5;
      const { data, error } = await supabase
        .from('products_summary')
        .select('*')
        .eq('principal_id', testPrincipalId)
        .is('deleted_at', null)
        .range(0, pageSize - 1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (principalProductCount >= pageSize) {
        expect(data?.length).toBe(pageSize);
      } else {
        expect(data?.length).toBe(principalProductCount);
      }
    });
  });

  describe('principal_name denormalization', () => {
    it('includes correct principal name from join', async () => {
      const { data, error } = await supabase
        .from('products_summary')
        .select('*')
        .eq('principal_id', testPrincipalId)
        .is('deleted_at', null)
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.principal_name).toBe('Rapid Rasoi'); // From seed data
    });

    it('handles products with missing principal gracefully', async () => {
      // This tests the LEFT JOIN behavior - if a product has a principal_id
      // that doesn't exist in organizations, principal_name should be null
      const { data, error } = await supabase
        .from('products_summary')
        .select('*')
        .is('deleted_at', null)
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All products should have either a valid principal_name or null
      data?.forEach((product) => {
        expect(
          product.principal_name === null || typeof product.principal_name === 'string'
        ).toBe(true);
      });
    });
  });

  describe('performance', () => {
    it('filters products efficiently (< 100ms for typical query)', async () => {
      const startTime = Date.now();

      await supabase
        .from('products_summary')
        .select('*')
        .eq('principal_id', testPrincipalId)
        .is('deleted_at', null);

      const duration = Date.now() - startTime;

      // Should be fast with index on principal_id
      expect(duration).toBeLessThan(100);
    });

    it('handles large result sets efficiently', async () => {
      const startTime = Date.now();

      // Fetch up to 200 products (max pagination in useFilteredProducts)
      await supabase
        .from('products_summary')
        .select('*')
        .is('deleted_at', null)
        .limit(200);

      const duration = Date.now() - startTime;

      // Should complete in reasonable time even with pagination limit
      expect(duration).toBeLessThan(200);
    });
  });

  describe('data consistency', () => {
    it('returns same data from products and products_summary views', async () => {
      const { data: summaryData } = await supabase
        .from('products_summary')
        .select('id, name, sku, principal_id, status, category')
        .eq('principal_id', testPrincipalId)
        .is('deleted_at', null)
        .order('id');

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku, principal_id, status, category')
        .eq('principal_id', testPrincipalId)
        .is('deleted_at', null)
        .order('id');

      expect(summaryData).toEqual(productsData);
    });
  });
});
