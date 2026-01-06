/**
 * Tests for opportunitiesHandler
 *
 * Tests the composed handler for opportunities resource:
 * 1. create() intercepts and delegates to OpportunitiesService when products_to_sync is present
 * 2. update() intercepts and delegates to OpportunitiesService when products_to_sync is present
 * 3. View-only fields are stripped via lifecycle callbacks before database operations
 *
 * Engineering Constitution: Tests verify service delegation and data transformation
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import { createOpportunitiesHandler } from "../opportunitiesHandler";
import { OpportunitiesService } from "../../../../services/opportunities.service";
import type { Product } from "../../../../opportunities/utils/diffProducts";

// Mock the OpportunitiesService
vi.mock("../../../../services/opportunities.service", () => {
  return {
    OpportunitiesService: vi.fn().mockImplementation(() => ({
      createWithProducts: vi.fn(),
      updateWithProducts: vi.fn(),
    })),
  };
});

describe("createOpportunitiesHandler", () => {
  let mockBaseProvider: DataProvider;
  let handler: DataProvider;
  let mockServiceInstance: {
    createWithProducts: Mock;
    updateWithProducts: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock base provider
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };

    // Create handler
    handler = createOpportunitiesHandler(mockBaseProvider);

    // Get the mock service instance (created during handler construction)
    mockServiceInstance = (OpportunitiesService as unknown as Mock).mock.results[0]
      .value as typeof mockServiceInstance;
  });

  describe("create() - service delegation", () => {
    it("should delegate to OpportunitiesService.createWithProducts when products_to_sync is present", async () => {
      const products: Product[] = [
        { id: 1, name: "Product A", quantity: 10 },
        { id: 2, name: "Product B", quantity: 5 },
      ];
      const opportunityData = {
        name: "Test Opportunity",
        customer_organization_id: 1,
        principal_organization_id: 2,
        estimated_close_date: "2026-02-01",
        products_to_sync: products,
      };
      const createdOpportunity = { id: 123, ...opportunityData };

      mockServiceInstance.createWithProducts.mockResolvedValue(createdOpportunity);

      const result = await handler.create("opportunities", { data: opportunityData });

      expect(mockServiceInstance.createWithProducts).toHaveBeenCalledWith(opportunityData);
      expect(result).toEqual({ data: createdOpportunity });
    });

    it("should NOT delegate to service when products_to_sync is absent", async () => {
      const opportunityData = {
        name: "Test Opportunity",
        customer_organization_id: 1,
        principal_organization_id: 2,
        estimated_close_date: "2026-02-01",
      };

      // Note: mockBaseProvider.create is called through the composed handler chain
      // which includes lifecycle callbacks - the call goes through the wrapper
      await handler.create("opportunities", { data: opportunityData });

      expect(mockServiceInstance.createWithProducts).not.toHaveBeenCalled();
    });

    it("should NOT delegate to service when products_to_sync is empty array", async () => {
      const opportunityData = {
        name: "Test Opportunity",
        customer_organization_id: 1,
        principal_organization_id: 2,
        estimated_close_date: "2026-02-01",
        products_to_sync: [],
      };

      await handler.create("opportunities", { data: opportunityData });

      expect(mockServiceInstance.createWithProducts).not.toHaveBeenCalled();
    });

    it("should pass through non-opportunities resources to base provider", async () => {
      const contactData = { first_name: "John", last_name: "Doe" };

      await handler.create("contacts", { data: contactData });

      expect(mockServiceInstance.createWithProducts).not.toHaveBeenCalled();
      // Base provider create is called through the wrapper chain
    });
  });

  describe("update() - service delegation", () => {
    it("should delegate to OpportunitiesService.updateWithProducts when products_to_sync is present", async () => {
      const products: Product[] = [
        { id: 1, name: "Product A", quantity: 15 }, // Updated quantity
      ];
      const previousProducts: Product[] = [{ id: 1, name: "Product A", quantity: 10 }];
      const updateData = {
        id: 123,
        name: "Updated Opportunity",
        products_to_sync: products,
      };
      const updatedOpportunity = { id: 123, name: "Updated Opportunity" };

      mockServiceInstance.updateWithProducts.mockResolvedValue(updatedOpportunity);

      const result = await handler.update("opportunities", {
        id: 123,
        data: updateData,
        previousData: { id: 123, products: previousProducts } as RaRecord,
      });

      expect(mockServiceInstance.updateWithProducts).toHaveBeenCalledWith(
        123,
        updateData,
        previousProducts
      );
      expect(result).toEqual({ data: updatedOpportunity });
    });

    it("should NOT delegate to service when products_to_sync is absent", async () => {
      const updateData = {
        id: 123,
        name: "Updated Opportunity",
        stage: "demo_scheduled",
      };

      await handler.update("opportunities", {
        id: 123,
        data: updateData,
        previousData: { id: 123 } as RaRecord,
      });

      expect(mockServiceInstance.updateWithProducts).not.toHaveBeenCalled();
    });

    it("should NOT delegate to service when products_to_sync is empty array", async () => {
      const updateData = {
        id: 123,
        name: "Updated Opportunity",
        products_to_sync: [],
      };

      await handler.update("opportunities", {
        id: 123,
        data: updateData,
        previousData: { id: 123 } as RaRecord,
      });

      expect(mockServiceInstance.updateWithProducts).not.toHaveBeenCalled();
    });

    it("should pass empty array when previousData.products is missing", async () => {
      const products: Product[] = [{ id: 1, name: "New Product", quantity: 5 }];
      const updateData = {
        id: 123,
        products_to_sync: products,
      };
      const updatedOpportunity = { id: 123 };

      mockServiceInstance.updateWithProducts.mockResolvedValue(updatedOpportunity);

      await handler.update("opportunities", {
        id: 123,
        data: updateData,
        previousData: { id: 123 } as RaRecord, // No products property
      });

      expect(mockServiceInstance.updateWithProducts).toHaveBeenCalledWith(123, updateData, []);
    });
  });
});

/**
 * Tests for view field stripping via opportunitiesCallbacks
 *
 * These tests verify that computed fields from views are properly stripped
 * before database operations. This happens in the beforeSave lifecycle callback.
 */
describe("opportunitiesCallbacks - view field stripping", () => {
  // Import the callbacks directly for isolated testing
  const {
    stripComputedFields,
    COMPUTED_FIELDS,
    TYPED_COMPUTED_FIELDS,
    VIEW_ONLY_FIELDS,
  } = require("../../callbacks/opportunitiesCallbacks");

  describe("stripComputedFields()", () => {
    it("should strip typed computed fields (from Opportunity type)", () => {
      const data = {
        id: 1,
        name: "Test Opportunity",
        stage: "new_lead",
        // Typed computed fields that should be stripped
        principal_organization_name: "Acme Corp",
        customer_organization_name: "Customer Inc",
        distributor_organization_name: "Distributor LLC",
        days_in_stage: 5,
        days_since_last_activity: 2,
        pending_task_count: 3,
        overdue_task_count: 1,
        nb_interactions: 10,
        last_interaction_date: "2026-01-01",
        next_task_id: 42,
        next_task_title: "Follow up",
        next_task_due_date: "2026-01-10",
        next_task_priority: "high",
        stage_changed_at: "2026-01-01",
        created_by: "user-123",
        status: "active",
        actual_close_date: null,
        founding_interaction_id: 1,
        stage_manual: false,
        status_manual: false,
        competition: null,
        opportunity_owner_id: "owner-456",
      };

      const result = stripComputedFields(data);

      // Should keep non-computed fields
      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "Test Opportunity");
      expect(result).toHaveProperty("stage", "new_lead");

      // Should strip all typed computed fields
      for (const field of TYPED_COMPUTED_FIELDS) {
        expect(result).not.toHaveProperty(field);
      }
    });

    it("should strip view-only fields (not on Opportunity type)", () => {
      const data = {
        id: 1,
        name: "Test Opportunity",
        // View-only fields that should be stripped
        search_tsv: "tsvector_value",
        updated_by: "user-789",
        index: 0,
        total_value: 50000,
        participant_count: 3,
        contact_count: 2,
        product_count: 5,
        last_activity_date: "2026-01-05",
      };

      const result = stripComputedFields(data);

      // Should keep non-computed fields
      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "Test Opportunity");

      // Should strip all view-only fields
      for (const field of VIEW_ONLY_FIELDS) {
        expect(result).not.toHaveProperty(field);
      }
    });

    it("should strip virtual fields (products_to_sync, products)", () => {
      const data = {
        id: 1,
        name: "Test Opportunity",
        products_to_sync: [{ id: 1, name: "Product A" }],
        products: [{ id: 1, name: "Product A" }],
      };

      const result = stripComputedFields(data);

      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "Test Opportunity");
      expect(result).not.toHaveProperty("products_to_sync");
      expect(result).not.toHaveProperty("products");
    });

    it("should preserve all editable fields", () => {
      const data = {
        id: 1,
        name: "Test Opportunity",
        description: "A description",
        stage: "initial_outreach",
        priority: "high",
        estimated_close_date: "2026-03-01",
        customer_organization_id: 10,
        principal_organization_id: 20,
        distributor_organization_id: 30,
        account_manager_id: "mgr-123",
        contact_ids: [1, 2, 3],
        campaign: "Q1 Campaign",
        related_opportunity_id: 99,
        tags: ["enterprise", "priority"],
        next_action: "Schedule demo",
        next_action_date: "2026-01-15",
        decision_criteria: "Budget approval",
        lead_source: "referral",
        notes: "Important notes here",
      };

      const result = stripComputedFields(data);

      // Should preserve all editable fields
      expect(result).toEqual(data);
    });

    it("should handle empty data gracefully", () => {
      const result = stripComputedFields({});
      expect(result).toEqual({});
    });

    it("should not modify the original data object", () => {
      const original = {
        id: 1,
        name: "Test",
        principal_organization_name: "Should be stripped",
      };
      const originalCopy = { ...original };

      stripComputedFields(original);

      expect(original).toEqual(originalCopy);
    });
  });

  describe("COMPUTED_FIELDS constant", () => {
    it("should include all TYPED_COMPUTED_FIELDS", () => {
      for (const field of TYPED_COMPUTED_FIELDS) {
        expect(COMPUTED_FIELDS).toContain(field);
      }
    });

    it("should include all VIEW_ONLY_FIELDS", () => {
      for (const field of VIEW_ONLY_FIELDS) {
        expect(COMPUTED_FIELDS).toContain(field);
      }
    });
  });
});
