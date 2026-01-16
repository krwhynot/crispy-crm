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

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import { createOpportunitiesHandler } from "../opportunitiesHandler";
// Note: Product type from diffProducts.ts is for internal handler use
// The API boundary (createOpportunitySchema) uses a DIFFERENT shape for products_to_sync
// This is the Two-Schema Rule in action - API validation vs handler processing
import {
  stripComputedFields,
  COMPUTED_FIELDS,
  TYPED_COMPUTED_FIELDS,
  VIEW_ONLY_FIELDS,
  UPDATE_ONLY_STRIP_FIELDS,
} from "../../callbacks/opportunitiesCallbacks";
import {
  createMockOpportunity,
  createMockOpportunityData,
  createMockUpdateData,
  createMockProduct,
  createMockViewProduct,
  createMockOpportunityWithComputedFields,
  createMockOpportunityWithViewOnlyFields,
  createMockEditableOpportunity,
} from "./fixtures/opportunities";

// Mock service methods using vi.hoisted to ensure they're available when vi.mock runs
// (vi.mock is hoisted to the top of the file, so regular const won't be defined yet)
const { mockCreateWithProducts, mockUpdateWithProducts } = vi.hoisted(() => ({
  mockCreateWithProducts: vi.fn(),
  mockUpdateWithProducts: vi.fn(),
}));

// Mock the OpportunitiesService - service is instantiated lazily in handler methods
vi.mock("../../../../services/opportunities.service", () => {
  return {
    OpportunitiesService: vi.fn().mockImplementation(() => ({
      createWithProducts: mockCreateWithProducts,
      updateWithProducts: mockUpdateWithProducts,
    })),
  };
});

describe("createOpportunitiesHandler", () => {
  let mockBaseProvider: DataProvider;
  let handler: DataProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateWithProducts.mockReset();
    mockUpdateWithProducts.mockReset();

    // Create mock base provider with ExtendedDataProvider methods
    // (required by assertExtendedDataProvider type guard)
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
      // ExtendedDataProvider methods (mocked for assertExtendedDataProvider)
      rpc: vi.fn(),
      storage: { upload: vi.fn(), download: vi.fn() },
      invoke: vi.fn(),
    };

    // Create handler (service is instantiated lazily in create/update methods)
    handler = createOpportunitiesHandler(mockBaseProvider);
  });

  describe("create() - service delegation", () => {
    it("should delegate to OpportunitiesService.createWithProducts when products_to_sync is present", async () => {
      // products_to_sync shape must match createOpportunitySchema (API boundary)
      // Schema: { product_id_reference: string|number (optional), notes: string (optional) }
      const products = [
        createMockProduct(),
        createMockProduct({ product_id_reference: "102", notes: "Premium grade" }),
      ];
      const opportunityData = createMockOpportunityData({ products_to_sync: products });
      const createdOpportunity = createMockOpportunity(opportunityData);

      mockCreateWithProducts.mockResolvedValue(createdOpportunity);

      const result = await handler.create("opportunities", { data: opportunityData });

      expect(mockCreateWithProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Opportunity",
          products_to_sync: products,
        })
      );
      expect(result).toEqual({ data: createdOpportunity });
    });

    it("should NOT delegate to service when products_to_sync is absent", async () => {
      const opportunityData = createMockOpportunityData();

      // Note: mockBaseProvider.create is called through the composed handler chain
      // which includes lifecycle callbacks - the call goes through the wrapper
      await handler.create("opportunities", { data: opportunityData });

      expect(mockCreateWithProducts).not.toHaveBeenCalled();
    });

    it("should NOT delegate to service when products_to_sync is empty array (avoids ExtendedDataProvider requirement)", async () => {
      // FIX [WF-E2E-003]: Empty arrays should NOT trigger OpportunitiesService
      // because OpportunitiesService requires ExtendedDataProvider with rpc/storage/invoke
      // methods that are not available when handlers are created.
      // The baseProvider path is the correct path for empty products.
      const opportunityData = createMockOpportunityData({ products_to_sync: [] });

      await handler.create("opportunities", { data: opportunityData });

      // Empty array should NOT delegate to service - uses baseProvider instead
      expect(mockCreateWithProducts).not.toHaveBeenCalled();
    });

    it("should pass through non-opportunities resources to base provider", async () => {
      const contactData = { first_name: "John", last_name: "Doe" };

      await handler.create("contacts", { data: contactData });

      expect(mockCreateWithProducts).not.toHaveBeenCalled();
      // Base provider create is called through the wrapper chain
    });
  });

  describe("update() - service delegation", () => {
    it("should delegate to OpportunitiesService.updateWithProducts when products_to_sync is present", async () => {
      // products_to_sync shape must match updateOpportunitySchema (API boundary)
      // Schema: { product_id_reference: string|number (optional), notes: string (optional) }
      const products = [createMockProduct({ notes: "Updated notes" })];
      const previousProducts = [createMockViewProduct()];
      const updateData = createMockUpdateData({ products_to_sync: products });
      const updatedOpportunity = createMockOpportunity({ name: "Updated Opportunity" });

      mockUpdateWithProducts.mockResolvedValue(updatedOpportunity);

      const result = await handler.update("opportunities", {
        id: 123,
        data: updateData,
        previousData: { id: 123, products: previousProducts } as RaRecord,
      });

      // FIX [SF-C12]: Now passes 4th argument (previousVersion) for optimistic locking
      // previousData has no version field, so previousVersion is undefined
      expect(mockUpdateWithProducts).toHaveBeenCalledWith(
        123,
        updateData,
        previousProducts,
        undefined
      );
      expect(result).toEqual({ data: updatedOpportunity });
    });

    it("should NOT delegate to service when products_to_sync is absent", async () => {
      const updateData = createMockUpdateData({ stage: "demo_scheduled" });

      await handler.update("opportunities", {
        id: 123,
        data: updateData,
        previousData: { id: 123 } as RaRecord,
      });

      expect(mockUpdateWithProducts).not.toHaveBeenCalled();
    });

    it("should NOT delegate to service when products_to_sync is empty array (avoids ExtendedDataProvider requirement)", async () => {
      // FIX [WF-E2E-003]: Empty arrays should NOT trigger OpportunitiesService
      // because OpportunitiesService requires ExtendedDataProvider with rpc/storage/invoke
      // methods that are not available when handlers are created.
      // The baseProvider path is the correct path for empty products.
      const updateData = createMockUpdateData({ products_to_sync: [] });

      await handler.update("opportunities", {
        id: 123,
        data: updateData,
        previousData: { id: 123 } as RaRecord,
      });

      // Empty array should NOT delegate to service - uses baseProvider instead
      expect(mockUpdateWithProducts).not.toHaveBeenCalled();
    });

    it("should pass empty array when previousData.products is missing", async () => {
      // products_to_sync shape must match updateOpportunitySchema (API boundary)
      const products = [createMockProduct()];
      const updateData = createMockUpdateData({ products_to_sync: products });
      const updatedOpportunity = createMockOpportunity();

      mockUpdateWithProducts.mockResolvedValue(updatedOpportunity);

      await handler.update("opportunities", {
        id: 123,
        data: updateData,
        previousData: { id: 123 } as RaRecord, // No products property
      });

      // Note: Lifecycle callbacks may add defaults (contact_ids: [])
      // Use objectContaining to verify the key fields we care about
      // FIX [SF-C12]: Now passes 4th argument (previousVersion) for optimistic locking
      expect(mockUpdateWithProducts).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          id: 123,
          products_to_sync: products,
        }),
        [],
        undefined
      );
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
  describe("stripComputedFields()", () => {
    it("should strip typed computed fields (from Opportunity type)", () => {
      const data = createMockOpportunityWithComputedFields();

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

    // FIX [WF-E2E-001]: Test for UPDATE_ONLY_STRIP_FIELDS behavior
    it("should preserve opportunity_owner_id during CREATE (isUpdate=false)", () => {
      const data = {
        name: "New Opportunity",
        stage: "new_lead",
        opportunity_owner_id: "owner-456",
      };

      // CREATE operation: isUpdate=false (default)
      const result = stripComputedFields(data);

      // Should preserve opportunity_owner_id for CREATE
      expect(result).toHaveProperty("opportunity_owner_id", "owner-456");
    });

    // FIX [WF-E2E-001]: Test for UPDATE_ONLY_STRIP_FIELDS behavior
    it("should strip opportunity_owner_id during UPDATE (isUpdate=true)", () => {
      const data = {
        id: 1,
        name: "Updated Opportunity",
        stage: "demo_scheduled",
        opportunity_owner_id: "owner-456",
      };

      // UPDATE operation: isUpdate=true
      const result = stripComputedFields(data, true);

      // Should strip opportunity_owner_id for UPDATE
      expect(result).not.toHaveProperty("opportunity_owner_id");

      // Should keep other fields
      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "Updated Opportunity");
      expect(result).toHaveProperty("stage", "demo_scheduled");
    });

    // FIX [WF-E2E-001]: Ensure all UPDATE_ONLY_STRIP_FIELDS are stripped for updates
    it("should strip all UPDATE_ONLY_STRIP_FIELDS during UPDATE", () => {
      const data: Record<string, unknown> = {
        id: 1,
        name: "Test",
      };
      // Add all UPDATE_ONLY_STRIP_FIELDS to data
      for (const field of UPDATE_ONLY_STRIP_FIELDS) {
        data[field] = "test-value";
      }

      const result = stripComputedFields(data, true);

      // Should strip all UPDATE_ONLY_STRIP_FIELDS
      for (const field of UPDATE_ONLY_STRIP_FIELDS) {
        expect(result).not.toHaveProperty(field);
      }
    });

    it("should strip view-only fields (not on Opportunity type)", () => {
      const data = createMockOpportunityWithViewOnlyFields();

      const result = stripComputedFields(data);

      // Should keep non-computed fields
      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "Test Opportunity");

      // Should strip all view-only fields
      for (const field of VIEW_ONLY_FIELDS) {
        expect(result).not.toHaveProperty(field);
      }
    });

    it("should strip 'products' virtual field (legacy field name)", () => {
      // NOTE: products_to_sync is NOT stripped by stripComputedFields because:
      // 1. The handler layer (opportunitiesHandler.ts) needs to process it first
      // 2. Handler extracts products_to_sync and delegates to OpportunitiesService
      // 3. The service handles the atomic product sync and returns clean data
      // 4. By the time data reaches baseProvider, products_to_sync is already handled
      const data = {
        id: 1,
        name: "Test Opportunity",
        products_to_sync: [createMockProduct()],
        products: [createMockViewProduct()], // Legacy field, stripped
      };

      const result = stripComputedFields(data);

      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "Test Opportunity");
      // products_to_sync is PRESERVED for handler processing
      expect(result).toHaveProperty("products_to_sync");
      // products (legacy) is stripped
      expect(result).not.toHaveProperty("products");
    });

    it("should preserve all editable fields", () => {
      const data = createMockEditableOpportunity();

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
