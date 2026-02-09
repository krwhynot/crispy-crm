import { describe, it, expect } from "vitest";
import {
  getOrCreateSegmentParamsSchema,
  setPrimaryOrganizationParamsSchema,
  archiveOpportunityWithRelationsParamsSchema,
  unarchiveOpportunityWithRelationsParamsSchema,
  syncOpportunityWithProductsParamsSchema,
  checkAuthorizationParamsSchema,
  checkAuthorizationResponseSchema,
  checkAuthorizationBatchParamsSchema,
  checkAuthorizationBatchResponseSchema,
  RPC_SCHEMAS,
} from "../rpc";

describe("RPC Validation Schemas", () => {
  describe("getOrCreateSegmentParamsSchema", () => {
    it("should accept valid segment name", () => {
      const result = getOrCreateSegmentParamsSchema.safeParse({
        p_name: "Enterprise Customers",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty segment name", () => {
      const result = getOrCreateSegmentParamsSchema.safeParse({
        p_name: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Segment name is required");
      }
    });

    it("should reject missing segment name", () => {
      const result = getOrCreateSegmentParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("setPrimaryOrganizationParamsSchema", () => {
    it("should accept valid contact and organization IDs", () => {
      const result = setPrimaryOrganizationParamsSchema.safeParse({
        p_contact_id: 123,
        p_organization_id: 456,
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative contact ID", () => {
      const result = setPrimaryOrganizationParamsSchema.safeParse({
        p_contact_id: -1,
        p_organization_id: 456,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero organization ID", () => {
      const result = setPrimaryOrganizationParamsSchema.safeParse({
        p_contact_id: 123,
        p_organization_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer contact ID", () => {
      const result = setPrimaryOrganizationParamsSchema.safeParse({
        p_contact_id: 123.45,
        p_organization_id: 456,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing parameters", () => {
      const result = setPrimaryOrganizationParamsSchema.safeParse({
        p_contact_id: 123,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("archiveOpportunityWithRelationsParamsSchema", () => {
    it("should accept valid opportunity ID", () => {
      const result = archiveOpportunityWithRelationsParamsSchema.safeParse({
        opp_id: 789,
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative opportunity ID", () => {
      const result = archiveOpportunityWithRelationsParamsSchema.safeParse({
        opp_id: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive integer");
      }
    });

    it("should reject zero opportunity ID", () => {
      const result = archiveOpportunityWithRelationsParamsSchema.safeParse({
        opp_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer opportunity ID", () => {
      const result = archiveOpportunityWithRelationsParamsSchema.safeParse({
        opp_id: 789.12,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing opportunity ID", () => {
      const result = archiveOpportunityWithRelationsParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("unarchiveOpportunityWithRelationsParamsSchema", () => {
    it("should accept valid opportunity ID", () => {
      const result = unarchiveOpportunityWithRelationsParamsSchema.safeParse({
        opp_id: 789,
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative opportunity ID", () => {
      const result = unarchiveOpportunityWithRelationsParamsSchema.safeParse({
        opp_id: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive integer");
      }
    });

    it("should reject zero opportunity ID", () => {
      const result = unarchiveOpportunityWithRelationsParamsSchema.safeParse({
        opp_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing opportunity ID", () => {
      const result = unarchiveOpportunityWithRelationsParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("syncOpportunityWithProductsParamsSchema", () => {
    it("should accept product_id_reference as number", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity", stage: "new_lead" },
        products_to_create: [
          { product_id_reference: 1, notes: "First product" },
          { product_id_reference: 2, notes: null },
        ],
        products_to_update: [{ product_id_reference: 3, notes: "Updated product" }],
        product_ids_to_delete: [4, 5],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.products_to_create[0].product_id_reference).toBe(1);
        expect(result.data.products_to_update[0].product_id_reference).toBe(3);
      }
    });

    it("should coerce product_id_reference from string", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
        products_to_create: [{ product_id_reference: "42", notes: "String product ID" }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.products_to_create[0].product_id_reference).toBe(42);
        expect(typeof result.data.products_to_create[0].product_id_reference).toBe("number");
      }
    });

    it("should accept expected_version parameter", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
        expected_version: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expected_version).toBe(5);
      }
    });

    it("should reject old product_id field name", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
        products_to_create: [{ product_id: 1, notes: "Old field name" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid product_id_reference", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
        products_to_create: [{ product_id_reference: -1, notes: "Invalid product" }],
      });
      expect(result.success).toBe(false);
    });

    it("should apply default empty arrays when optional params are missing", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.products_to_create).toEqual([]);
        expect(result.data.products_to_update).toEqual([]);
        expect(result.data.product_ids_to_delete).toEqual([]);
      }
    });

    it("should reject negative product IDs in product_ids_to_delete", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
        product_ids_to_delete: [1, -2, 3],
      });
      expect(result.success).toBe(false);
    });

    it("should accept products with optional notes field", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
        products_to_create: [{ product_id_reference: 1 }],
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty opportunity_data object", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: {},
      });
      expect(result.success).toBe(true);
    });

    it("should reject non-integer string product_id_reference", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
        products_to_create: [{ product_id_reference: "abc", notes: "Invalid string" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject decimal product_id_reference", () => {
      const result = syncOpportunityWithProductsParamsSchema.safeParse({
        opportunity_data: { name: "Test Opportunity" },
        products_to_update: [{ product_id_reference: 3.14, notes: "Decimal product" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("checkAuthorizationParamsSchema", () => {
    it("should accept valid params with distributor and principal", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: 100,
        _principal_id: 200,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid params with distributor and product (Product→Org fallback)", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: 100,
        _product_id: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept distributor only (will fail at RPC level)", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should accept null for optional parameters", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: 100,
        _principal_id: null,
        _product_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing distributor_id", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _principal_id: 200,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative distributor_id", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: -1,
        _principal_id: 200,
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero distributor_id", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: 0,
        _principal_id: 200,
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer distributor_id", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: 100.5,
        _principal_id: 200,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative principal_id", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: 100,
        _principal_id: -200,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative product_id", () => {
      const result = checkAuthorizationParamsSchema.safeParse({
        _distributor_id: 100,
        _product_id: -50,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("checkAuthorizationResponseSchema", () => {
    it("should accept valid authorized response", () => {
      const result = checkAuthorizationResponseSchema.safeParse({
        authorized: true,
        authorization_id: 1,
        distributor_id: 100,
        distributor_name: "Sysco",
        principal_id: 200,
        principal_name: "McCRUM",
        authorization_date: "2024-01-01",
        expiration_date: null,
        territory_restrictions: ["MI", "OH"],
        notes: "Full authorization",
      });
      expect(result.success).toBe(true);
    });

    it("should accept unauthorized response with reason", () => {
      const result = checkAuthorizationResponseSchema.safeParse({
        authorized: false,
        reason: "no_authorization_record",
        distributor_id: 100,
        principal_id: 200,
      });
      expect(result.success).toBe(true);
    });

    it("should accept error response", () => {
      const result = checkAuthorizationResponseSchema.safeParse({
        authorized: false,
        error: "Product not found or has no principal",
        distributor_id: 100,
        product_id: 999,
      });
      expect(result.success).toBe(true);
    });

    it("should accept product lookup response", () => {
      const result = checkAuthorizationResponseSchema.safeParse({
        authorized: true,
        authorization_id: 1,
        distributor_id: 100,
        distributor_name: "Sysco",
        principal_id: 200,
        principal_name: "McCRUM",
        product_id: 50,
        product_name: "Premium Widget",
        resolved_via: "product_lookup",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing authorized field", () => {
      const result = checkAuthorizationResponseSchema.safeParse({
        distributor_id: 100,
        principal_id: 200,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing distributor_id field", () => {
      const result = checkAuthorizationResponseSchema.safeParse({
        authorized: true,
        principal_id: 200,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("checkAuthorizationBatchParamsSchema", () => {
    it("should accept valid params with product IDs", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: [1, 2, 3],
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid params with principal IDs", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _principal_ids: [200, 201, 202],
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid params with both product and principal IDs", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: [1, 2],
        _principal_ids: [200, 201],
      });
      expect(result.success).toBe(true);
    });

    it("should reject when both arrays are null (no criteria provided)", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: null,
        _principal_ids: null,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "At least one of _product_ids or _principal_ids must be provided"
        );
      }
    });

    it("should reject when both arrays are empty (no criteria provided)", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: [],
        _principal_ids: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "At least one of _product_ids or _principal_ids must be provided"
        );
      }
    });

    it("should reject when neither array is provided (omitted)", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "At least one of _product_ids or _principal_ids must be provided"
        );
      }
    });

    it("should accept when only product_ids provided (principal_ids null)", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: [1, 2, 3],
        _principal_ids: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept when only principal_ids provided (product_ids null)", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: null,
        _principal_ids: [200, 201],
      });
      expect(result.success).toBe(true);
    });

    it("should accept when product_ids has values and principal_ids is empty", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: [1],
        _principal_ids: [],
      });
      expect(result.success).toBe(true);
    });

    it("should accept when principal_ids has values and product_ids is empty", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: [],
        _principal_ids: [200],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing distributor_id", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _product_ids: [1, 2, 3],
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative values in product_ids array", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _product_ids: [1, -2, 3],
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer values in principal_ids array", () => {
      const result = checkAuthorizationBatchParamsSchema.safeParse({
        _distributor_id: 100,
        _principal_ids: [200, 201.5, 202],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("checkAuthorizationBatchResponseSchema", () => {
    it("should accept valid batch response", () => {
      const result = checkAuthorizationBatchResponseSchema.safeParse({
        distributor_id: 100,
        total_checked: 2,
        all_authorized: true,
        results: [
          {
            authorized: true,
            authorization_id: 1,
            distributor_id: 100,
            principal_id: 200,
          },
          {
            authorized: true,
            authorization_id: 2,
            distributor_id: 100,
            principal_id: 201,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept batch response with some unauthorized", () => {
      const result = checkAuthorizationBatchResponseSchema.safeParse({
        distributor_id: 100,
        total_checked: 2,
        all_authorized: false,
        results: [
          {
            authorized: true,
            authorization_id: 1,
            distributor_id: 100,
            principal_id: 200,
          },
          {
            authorized: false,
            reason: "no_authorization_record",
            distributor_id: 100,
            principal_id: 201,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should accept null for all_authorized (when no results)", () => {
      const result = checkAuthorizationBatchResponseSchema.safeParse({
        distributor_id: 100,
        total_checked: 0,
        all_authorized: null,
        results: [],
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const result = checkAuthorizationBatchResponseSchema.safeParse({
        distributor_id: 100,
        results: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RPC_SCHEMAS registry", () => {
    it("should contain all expected RPC functions", () => {
      const expectedFunctions = [
        "get_or_create_segment",
        "set_primary_organization",
        "archive_opportunity_with_relations",
        "unarchive_opportunity_with_relations",
        "sync_opportunity_with_products",
        "check_authorization",
        "check_authorization_batch",
        "log_activity_with_task", // Added for atomic activity+task creation
        "check_similar_opportunities", // Server-side fuzzy matching using pg_trgm
        "get_campaign_report_stats", // Server-side aggregation for Campaign Activity Report
      ];

      expectedFunctions.forEach((funcName) => {
        expect(RPC_SCHEMAS).toHaveProperty(funcName);
      });
    });

    it("should have exactly 11 RPC function schemas", () => {
      expect(Object.keys(RPC_SCHEMAS).length).toBe(11);
    });

    it("should map function names to valid Zod schemas", () => {
      Object.values(RPC_SCHEMAS).forEach((schema) => {
        expect(schema).toHaveProperty("safeParse");
        expect(typeof schema.safeParse).toBe("function");
      });
    });
  });
});
