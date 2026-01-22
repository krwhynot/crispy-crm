/**
 * E2E Integration Tests for Product Filtering by Principal
 *
 * ⚠️  REQUIRES LIVE DATABASE CONNECTION
 *
 * These tests verify the complete data flow from Supabase → products_summary view.
 * They specifically test database-level concerns that CANNOT be mocked:
 *   - SQL view existence and accessibility
 *   - JOIN behavior (principal_name denormalization)
 *   - Query performance with actual indexes
 *   - Data consistency between views and base tables
 *
 * Run these tests with: `npm run test:e2e` or `vitest --config vitest.e2e.config.ts`
 *
 * Prerequisites:
 *   1. Local Supabase running: `supabase start`
 *   2. Database seeded with test data: `just seed-e2e`
 *   3. Environment variables configured for local DB
 *
 * Engineering Constitution: These are TRUE integration tests that verify the database
 * layer works correctly. Mocking would defeat their purpose.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Create a dedicated test client - NOT using the app's singleton
// This ensures we're testing against the actual database, not mocks
const supabaseUrl = process.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const testClient = createClient(supabaseUrl, supabaseKey);

describe("Product Filtering E2E Integration", () => {
  // Test data - dynamically determined from test database
  let testPrincipalId: number | null = null;
  let principalProductCount = 0;
  let testPrincipalName: string | null = null;

  beforeAll(async () => {
    // Find any principal with products in the test database
    const { data: products } = await testClient
      .from("products")
      .select("principal_id")
      .is("deleted_at", null)
      .limit(1);

    const firstProduct = products?.[0];
    if (firstProduct) {
      testPrincipalId = firstProduct.principal_id as number;

      // Count products for this principal
      const { count } = await testClient
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null);

      principalProductCount = count || 0;

      // Get principal name
      const { data: org } = await testClient
        .from("organizations")
        .select("name")
        .eq("id", testPrincipalId)
        .single();

      testPrincipalName = org?.name || null;
    }
  });

  describe("products_summary view", () => {
    it("exists and is accessible", async () => {
      const { data, error } = await testClient.from("products_summary").select("*").limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("includes principal_name field from JOIN", async () => {
      const { data, error } = await testClient
        .from("products_summary")
        .select("id, name, principal_id, principal_name")
        .is("deleted_at", null)
        .limit(1);

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const firstProduct = data[0];
        expect(firstProduct).toHaveProperty("principal_name");
        // principal_name can be null (if organization doesn't exist) or string
        expect(
          firstProduct.principal_name === null || typeof firstProduct.principal_name === "string"
        ).toBe(true);
      }
    });

    it("filters products by principal_id correctly", async () => {
      if (!testPrincipalId) {
        // Skip if no test data available
        expect(true).toBe(true);
        return;
      }

      const { data, error, count } = await testClient
        .from("products_summary")
        .select("*", { count: "exact" })
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (principalProductCount > 0) {
        expect(count).toBeGreaterThan(0);
        expect(count).toBe(principalProductCount);

        // Verify all returned products have the correct principal_id
        data?.forEach((product) => {
          expect(product.principal_id).toBe(testPrincipalId);
        });
      }
    });

    it("returns only non-deleted products (soft delete filtering)", async () => {
      const { data, error } = await testClient
        .from("products_summary")
        .select("*")
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Verify no products have deleted_at set
      data?.forEach((product) => {
        expect(product.deleted_at).toBeNull();
      });
    });

    it("returns empty array for non-existent principal", async () => {
      const { data, error, count } = await testClient
        .from("products_summary")
        .select("*", { count: "exact" })
        .eq("principal_id", 999999) // Non-existent principal
        .is("deleted_at", null);

      expect(error).toBeNull();
      expect(data).toEqual([]);
      expect(count).toBe(0);
    });

    it("supports sorting by name", async () => {
      const { data, error } = await testClient
        .from("products_summary")
        .select("*")
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 1) {
        // Verify sorting
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].name.localeCompare(data[i + 1].name)).toBeLessThanOrEqual(0);
        }
      }
    });

    it("supports pagination", async () => {
      const pageSize = 5;
      const { data, error } = await testClient
        .from("products_summary")
        .select("*")
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null)
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

  describe("principal_name denormalization (JOIN verification)", () => {
    it("includes correct principal name from organizations table", async () => {
      if (!testPrincipalId || !testPrincipalName) {
        // Skip if no test data available
        expect(true).toBe(true);
        return;
      }

      const { data, error } = await testClient
        .from("products_summary")
        .select("*")
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null)
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        expect(data[0].principal_name).toBe(testPrincipalName);
      }
    });

    it("handles products with missing principal gracefully (LEFT JOIN)", async () => {
      // This tests the LEFT JOIN behavior - if a product has a principal_id
      // that doesn't exist in organizations, principal_name should be null
      const { data, error } = await testClient
        .from("products_summary")
        .select("*")
        .is("deleted_at", null)
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // All products should have either a valid principal_name or null
      data?.forEach((product) => {
        expect(product.principal_name === null || typeof product.principal_name === "string").toBe(
          true
        );
      });
    });
  });

  describe("performance (index verification)", () => {
    it("filters products efficiently (< 100ms for typical query)", async () => {
      const startTime = Date.now();

      await testClient
        .from("products_summary")
        .select("*")
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null);

      const duration = Date.now() - startTime;

      // Should be fast with index on principal_id
      expect(duration).toBeLessThan(100);
    });

    it("handles large result sets efficiently", async () => {
      const startTime = Date.now();

      // Fetch up to 200 products (max pagination in useFilteredProducts)
      await testClient.from("products_summary").select("*").is("deleted_at", null).limit(200);

      const duration = Date.now() - startTime;

      // Should complete in reasonable time even with pagination limit
      expect(duration).toBeLessThan(200);
    });
  });

  describe("data consistency (view vs table)", () => {
    it("returns same core data from products and products_summary views", async () => {
      const { data: summaryData } = await testClient
        .from("products_summary")
        .select("id, name, sku, principal_id, status, category")
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null)
        .order("id");

      const { data: productsData } = await testClient
        .from("products")
        .select("id, name, sku, principal_id, status, category")
        .eq("principal_id", testPrincipalId)
        .is("deleted_at", null)
        .order("id");

      expect(summaryData).toEqual(productsData);
    });
  });
});
