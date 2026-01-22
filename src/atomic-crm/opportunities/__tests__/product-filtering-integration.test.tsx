/**
 * Unit Tests for Product Filtering Utilities
 *
 * Tests the getDatabaseResource utility function that determines
 * which database resource (view vs table) to use for different operations.
 *
 * NOTE: Database integration tests (testing actual Supabase queries, view existence,
 * performance, etc.) have been moved to:
 *   src/atomic-crm/opportunities/__tests__/e2e/product-filtering.e2e.test.tsx
 *
 * Those tests require a live database connection and are excluded from unit test runs.
 */

import { describe, it, expect } from "vitest";
import { getDatabaseResource } from "@/atomic-crm/providers/supabase/dataProviderUtils";

describe("Product Filtering - Unit Tests", () => {
  describe("getDatabaseResource", () => {
    it("returns products_summary for list operations", () => {
      const resource = getDatabaseResource("products", "list");
      expect(resource).toBe("products_summary");
    });

    it("returns products (not summary) for one operations", () => {
      const resource = getDatabaseResource("products", "one");
      expect(resource).toBe("products");
    });

    it("returns products (not summary) for create operations", () => {
      const resource = getDatabaseResource("products", "create");
      expect(resource).toBe("products");
    });

    it("returns products (not summary) for update operations", () => {
      const resource = getDatabaseResource("products", "update");
      expect(resource).toBe("products");
    });

    it("returns products (not summary) for delete operations", () => {
      const resource = getDatabaseResource("products", "delete");
      expect(resource).toBe("products");
    });

    // Additional tests for other resources to ensure view/table duality works
    describe("view/table duality for all summary-enabled resources", () => {
      const resourcesWithSummaryViews = ["organizations", "contacts", "opportunities", "products"];

      resourcesWithSummaryViews.forEach((resource) => {
        it(`${resource}: uses _summary view for list, base table for writes`, () => {
          // List operations use summary views
          expect(getDatabaseResource(resource, "list")).toBe(`${resource}_summary`);

          // Write operations use base tables
          expect(getDatabaseResource(resource, "one")).toBe(resource);
          expect(getDatabaseResource(resource, "create")).toBe(resource);
          expect(getDatabaseResource(resource, "update")).toBe(resource);
          expect(getDatabaseResource(resource, "delete")).toBe(resource);
        });
      });
    });

    describe("resources without summary views", () => {
      const resourcesWithoutSummary = ["activities", "tasks", "notes", "tags", "segments"];

      resourcesWithoutSummary.forEach((resource) => {
        it(`${resource}: uses base table for all operations`, () => {
          expect(getDatabaseResource(resource, "list")).toBe(resource);
          expect(getDatabaseResource(resource, "one")).toBe(resource);
          expect(getDatabaseResource(resource, "create")).toBe(resource);
          expect(getDatabaseResource(resource, "update")).toBe(resource);
          expect(getDatabaseResource(resource, "delete")).toBe(resource);
        });
      });
    });
  });
});
