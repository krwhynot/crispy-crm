import { describe, it, expect } from "vitest";
import { z } from "zod";
import { quickAddSchema, type QuickAddInput } from "../../quickAdd";

describe("Quick Add Booth Visitor Validation", () => {
  describe("Required Fields", () => {
    it("should accept valid booth visitor data with all fields", () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        email: "john@example.com",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
        product_ids: [1, 2, 3],
        quick_note: "Interested in product demo",
      };

      const result = quickAddSchema.parse(validData);
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
      expect(result.org_name).toBe("Acme Corp");
      expect(result.campaign).toBe("NRA Show 2025");
      expect(result.principal_id).toBe(123);
    });

    it("should accept missing first_name (optional)", () => {
      const data = {
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(data)).not.toThrow();
      const result = quickAddSchema.parse(data);
      expect(result.first_name).toBeUndefined();
    });

    it("should accept empty first_name (optional)", () => {
      const data = {
        first_name: "",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(data)).not.toThrow();
    });

    it("should accept missing last_name (optional)", () => {
      const data = {
        first_name: "John",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(data)).not.toThrow();
      const result = quickAddSchema.parse(data);
      expect(result.last_name).toBeUndefined();
    });

    it("should reject missing org_name", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
      try {
        quickAddSchema.parse(invalidData);
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          const orgNameError = error.issues.find((issue) => issue.path[0] === "org_name");
          expect(orgNameError).toBeDefined();
          expect(orgNameError?.code).toBe("invalid_type");
        }
      }
    });

    it("should accept missing city (optional)", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(data)).not.toThrow();
      const result = quickAddSchema.parse(data);
      expect(result.city).toBeUndefined();
    });

    it("should accept missing state (optional)", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(data)).not.toThrow();
      const result = quickAddSchema.parse(data);
      expect(result.state).toBeUndefined();
    });

    it("should reject missing campaign", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
      try {
        quickAddSchema.parse(invalidData);
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          const campaignError = error.issues.find((issue) => issue.path[0] === "campaign");
          expect(campaignError).toBeDefined();
          expect(campaignError?.code).toBe("invalid_type");
        }
      }
    });

    it("should reject missing principal_id", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
      try {
        quickAddSchema.parse(invalidData);
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          const principalError = error.issues.find((issue) => issue.path[0] === "principal_id");
          expect(principalError).toBeDefined();
          expect(principalError?.code).toBe("invalid_type");
        }
      }
    });
  });

  describe("Phone or Email Required (Custom Validator)", () => {
    it("should accept data with only phone", () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(validData)).not.toThrow();
    });

    it("should accept data with only email", () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(validData)).not.toThrow();
    });

    it("should accept data with both phone and email", () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        email: "john@example.com",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(validData)).not.toThrow();
    });

    it("should reject data with neither phone nor email", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
      try {
        quickAddSchema.parse(invalidData);
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          const phoneError = error.issues.find((issue) => issue.path[0] === "phone");
          expect(phoneError).toBeDefined();
          expect(phoneError?.message).toContain("Phone or Email required (at least one)");
        }
      }
    });

    it("should reject data with empty string phone and no email", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        phone: "",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should reject data with empty string email and no phone", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: "",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe("Email Format Validation", () => {
    it("should accept valid email formats", () => {
      const validEmails = ["user@example.com", "first.last@company.co.uk", "admin+test@domain.io"];

      validEmails.forEach((email) => {
        const data = {
          first_name: "John",
          last_name: "Doe",
          email,
          org_name: "Acme Corp",
          city: "Chicago",
          state: "IL",
          campaign: "NRA Show 2025",
          principal_id: 123,
        };

        expect(() => quickAddSchema.parse(data)).not.toThrow();
      });
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: "not-an-email",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
      try {
        quickAddSchema.parse(invalidData);
      } catch (error: unknown) {
        if (error instanceof z.ZodError) {
          const emailError = error.issues.find((issue) => issue.path[0] === "email");
          expect(emailError).toBeDefined();
          expect(emailError?.message).toContain("Invalid email address");
        }
      }
    });

    it("should reject email without @ symbol", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: "userexample.com",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe("Optional Fields", () => {
    it("should allow missing optional fields", () => {
      const minimalData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      const result = quickAddSchema.parse(minimalData);
      expect(result.product_ids).toEqual([]);
      expect(result.quick_note).toBeUndefined();
    });

    it("should accept empty product_ids array", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
        product_ids: [],
      };

      expect(() => quickAddSchema.parse(data)).not.toThrow();
    });

    it("should accept product_ids with multiple values", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
        product_ids: [1, 2, 3, 4, 5],
      };

      const result = quickAddSchema.parse(data);
      expect(result.product_ids).toHaveLength(5);
    });

    it("should accept quick_note string", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
        quick_note: "Met at booth, very interested in pricing",
      };

      const result = quickAddSchema.parse(data);
      expect(result.quick_note).toBe("Met at booth, very interested in pricing");
    });

    it("should accept empty string for quick_note", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
        quick_note: "",
      };

      expect(() => quickAddSchema.parse(data)).not.toThrow();
    });
  });

  describe("Type Inference", () => {
    it("should export correct TypeScript type", () => {
      // This test verifies that the type inference works correctly
      const data: QuickAddInput = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
        product_ids: [1, 2],
        quick_note: "Test note",
      };

      const result = quickAddSchema.parse(data);

      // Type assertion to verify all properties exist
      expect(result).toHaveProperty("first_name");
      expect(result).toHaveProperty("last_name");
      expect(result).toHaveProperty("phone");
      expect(result).toHaveProperty("org_name");
      expect(result).toHaveProperty("city");
      expect(result).toHaveProperty("state");
      expect(result).toHaveProperty("campaign");
      expect(result).toHaveProperty("principal_id");
      expect(result).toHaveProperty("product_ids");
      expect(result).toHaveProperty("quick_note");
    });
  });

  describe("Principal ID Type Validation", () => {
    it("should accept number for principal_id", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: 123,
      };

      expect(() => quickAddSchema.parse(data)).not.toThrow();
    });

    it("should reject string for principal_id", () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "NRA Show 2025",
        principal_id: "123",
      };

      expect(() => quickAddSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });
});
