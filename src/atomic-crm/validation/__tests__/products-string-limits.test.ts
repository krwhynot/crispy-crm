/**
 * String .max() constraint tests for products validation schemas
 * Part of Task 8.2: Audit remediation for unbounded strings
 *
 * Following Engineering Constitution: Zod validation at API boundary
 * Tests verify DoS protection via string length limits
 */

import { describe, it, expect } from "vitest";
import { productUpdateWithDistributorsSchema, opportunityProductSchema } from "../products";

describe("Product Schema String Limits - DoS Protection", () => {
  describe("productUpdateWithDistributorsSchema timestamp fields", () => {
    const baseProduct = {
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
    };

    it("should accept valid ISO timestamp for created_at", () => {
      const data = {
        ...baseProduct,
        created_at: "2025-01-27T12:00:00.000Z",
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject created_at exceeding 50 characters", () => {
      const longTimestamp = "a".repeat(51);
      const data = {
        ...baseProduct,
        created_at: longTimestamp,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50");
      }
    });

    it("should accept created_at at 50 character limit", () => {
      const maxTimestamp = "a".repeat(50);
      const data = {
        ...baseProduct,
        created_at: maxTimestamp,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject updated_at exceeding 50 characters", () => {
      const longTimestamp = "a".repeat(51);
      const data = {
        ...baseProduct,
        updated_at: longTimestamp,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50");
      }
    });

    it("should accept updated_at at 50 character limit", () => {
      const maxTimestamp = "a".repeat(50);
      const data = {
        ...baseProduct,
        updated_at: maxTimestamp,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject deleted_at exceeding 50 characters", () => {
      const longTimestamp = "a".repeat(51);
      const data = {
        ...baseProduct,
        deleted_at: longTimestamp,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50");
      }
    });

    it("should accept deleted_at at 50 character limit", () => {
      const maxTimestamp = "a".repeat(50);
      const data = {
        ...baseProduct,
        deleted_at: maxTimestamp,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("productUpdateWithDistributorsSchema computed fields", () => {
    const baseProduct = {
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
    };

    it("should accept valid principal_name", () => {
      const data = {
        ...baseProduct,
        principal_name: "Acme Corporation",
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject principal_name exceeding 255 characters", () => {
      const longName = "a".repeat(256);
      const data = {
        ...baseProduct,
        principal_name: longName,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("255");
      }
    });

    it("should accept principal_name at 255 character limit", () => {
      const maxName = "a".repeat(255);
      const data = {
        ...baseProduct,
        principal_name: maxName,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("productUpdateWithDistributorsSchema ID field", () => {
    const baseProduct = {
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
    };

    it("should accept numeric ID", () => {
      const data = {
        ...baseProduct,
        id: 123,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept string ID", () => {
      const data = {
        ...baseProduct,
        id: "123",
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject string ID exceeding 50 characters", () => {
      const longId = "a".repeat(51);
      const data = {
        ...baseProduct,
        id: longId,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50");
      }
    });

    it("should accept string ID at 50 character limit", () => {
      const maxId = "a".repeat(50);
      const data = {
        ...baseProduct,
        id: maxId,
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("productUpdateWithDistributorsSchema product_distributors record keys", () => {
    const baseProduct = {
      name: "Test Product",
      principal_id: 1,
      category: "beverages",
    };

    it("should accept valid product_distributors record", () => {
      const data = {
        ...baseProduct,
        product_distributors: {
          "123": { vendor_item_number: "ABC-123" },
          "456": { vendor_item_number: null },
        },
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject product_distributors key exceeding 50 characters", () => {
      const longKey = "a".repeat(51);
      const data = {
        ...baseProduct,
        product_distributors: {
          [longKey]: { vendor_item_number: "ABC-123" },
        },
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod reports record key validation as "Invalid key in record"
        expect(result.error.issues[0].message).toContain("Invalid key");
      }
    });

    it("should accept product_distributors key at 50 character limit", () => {
      const maxKey = "a".repeat(50);
      const data = {
        ...baseProduct,
        product_distributors: {
          [maxKey]: { vendor_item_number: "ABC-123" },
        },
      };
      const result = productUpdateWithDistributorsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("opportunityProductSchema string limits", () => {
    const baseProduct = {
      product_id_reference: 1,
      product_name: "Test Product",
    };

    it("should reject id exceeding 50 characters when string", () => {
      const longId = "a".repeat(51);
      const data = {
        ...baseProduct,
        id: longId,
      };
      const result = opportunityProductSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50");
      }
    });

    it("should accept id at 50 character limit when string", () => {
      const maxId = "a".repeat(50);
      const data = {
        ...baseProduct,
        id: maxId,
      };
      const result = opportunityProductSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
