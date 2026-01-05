import { describe, it, expect } from "vitest";
import { z } from "zod";
import { quickAddSchema, type QuickAddInput } from "../quickAdd";

describe("QuickAdd Schema Validation", () => {
  describe("Optional Fields", () => {
    it("should accept valid data with all fields populated", () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        email: "john@example.com",
        org_name: "Acme Corp",
        city: "Chicago",
        state: "IL",
        campaign: "Trade Show 2024",
        principal_id: 1,
        product_ids: [1, 2],
        quick_note: "Met at booth",
      };

      const result = quickAddSchema.parse(validData);
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
      expect(result.city).toBe("Chicago");
      expect(result.state).toBe("IL");
    });

    it("should accept data without first_name (optional)", () => {
      const dataWithoutFirstName = {
        last_name: "Doe",
        email: "john@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithoutFirstName);
      expect(result.first_name).toBeUndefined();
      expect(result.last_name).toBe("Doe");
    });

    it("should accept data without last_name (optional)", () => {
      const dataWithoutLastName = {
        first_name: "John",
        phone: "555-1234",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithoutLastName);
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBeUndefined();
    });

    it("should accept data without city (optional)", () => {
      const dataWithoutCity = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        org_name: "Acme Corp",
        state: "IL",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithoutCity);
      expect(result.city).toBeUndefined();
      expect(result.state).toBe("IL");
    });

    it("should accept data without state (optional)", () => {
      const dataWithoutState = {
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        org_name: "Acme Corp",
        city: "Chicago",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithoutState);
      expect(result.city).toBe("Chicago");
      expect(result.state).toBeUndefined();
    });

    it("should accept data without ANY of the 4 optional fields (first_name, last_name, city, state)", () => {
      const minimalValidData = {
        email: "contact@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(minimalValidData);
      expect(result.first_name).toBeUndefined();
      expect(result.last_name).toBeUndefined();
      expect(result.city).toBeUndefined();
      expect(result.state).toBeUndefined();
      expect(result.org_name).toBe("Acme Corp");
      expect(result.email).toBe("contact@example.com");
    });
  });

  describe("Required Fields", () => {
    it("should require org_name", () => {
      const dataWithoutOrgName = {
        first_name: "John",
        email: "john@example.com",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithoutOrgName);
      expect(result.success).toBe(false);
      if (!result.success) {
        const orgNameError = result.error.issues.find((i) => i.path.includes("org_name"));
        expect(orgNameError).toBeDefined();
      }
    });

    it("should require campaign", () => {
      const dataWithoutCampaign = {
        first_name: "John",
        email: "john@example.com",
        org_name: "Acme Corp",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithoutCampaign);
      expect(result.success).toBe(false);
      if (!result.success) {
        const campaignError = result.error.issues.find((i) => i.path.includes("campaign"));
        expect(campaignError).toBeDefined();
      }
    });

    it("should require principal_id", () => {
      const dataWithoutPrincipal = {
        first_name: "John",
        email: "john@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
      };

      const result = quickAddSchema.safeParse(dataWithoutPrincipal);
      expect(result.success).toBe(false);
      if (!result.success) {
        const principalError = result.error.issues.find((i) => i.path.includes("principal_id"));
        expect(principalError).toBeDefined();
      }
    });
  });

  describe("Phone OR Email Requirement", () => {
    it("should accept data with only phone (no email)", () => {
      const dataWithPhoneOnly = {
        org_name: "Acme Corp",
        phone: "555-1234",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithPhoneOnly);
      expect(result.phone).toBe("555-1234");
      expect(result.email).toBeUndefined();
    });

    it("should accept data with only email (no phone)", () => {
      const dataWithEmailOnly = {
        org_name: "Acme Corp",
        email: "contact@example.com",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithEmailOnly);
      expect(result.email).toBe("contact@example.com");
      expect(result.phone).toBeUndefined();
    });

    it("should accept data with both phone and email", () => {
      const dataWithBoth = {
        org_name: "Acme Corp",
        phone: "555-1234",
        email: "contact@example.com",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithBoth);
      expect(result.phone).toBe("555-1234");
      expect(result.email).toBe("contact@example.com");
    });

    it("should reject data with neither phone nor email", () => {
      const dataWithoutContact = {
        first_name: "John",
        last_name: "Doe",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithoutContact);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Phone or Email required");
      }
    });

    it("should accept empty string email when phone is provided", () => {
      const dataWithEmptyEmail = {
        org_name: "Acme Corp",
        phone: "555-1234",
        email: "",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithEmptyEmail);
      expect(result.phone).toBe("555-1234");
      expect(result.email).toBe("");
    });
  });

  describe("Email Validation", () => {
    it("should reject invalid email format", () => {
      const dataWithInvalidEmail = {
        org_name: "Acme Corp",
        email: "not-an-email",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithInvalidEmail);
      expect(result.success).toBe(false);
    });

    it("should accept valid email format", () => {
      const dataWithValidEmail = {
        org_name: "Acme Corp",
        email: "valid@example.com",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithValidEmail);
      expect(result.email).toBe("valid@example.com");
    });
  });

  describe("String Length Limits (DoS Prevention)", () => {
    it("should reject first_name over 100 characters", () => {
      const dataWithLongFirstName = {
        first_name: "a".repeat(101),
        email: "test@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithLongFirstName);
      expect(result.success).toBe(false);
    });

    it("should reject last_name over 100 characters", () => {
      const dataWithLongLastName = {
        last_name: "a".repeat(101),
        email: "test@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithLongLastName);
      expect(result.success).toBe(false);
    });

    it("should reject org_name over 255 characters", () => {
      const dataWithLongOrgName = {
        org_name: "a".repeat(256),
        email: "test@example.com",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithLongOrgName);
      expect(result.success).toBe(false);
    });

    it("should reject city over 100 characters", () => {
      const dataWithLongCity = {
        city: "a".repeat(101),
        email: "test@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithLongCity);
      expect(result.success).toBe(false);
    });

    it("should reject state over 50 characters", () => {
      const dataWithLongState = {
        state: "a".repeat(51),
        email: "test@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithLongState);
      expect(result.success).toBe(false);
    });

    it("should reject quick_note over 2000 characters", () => {
      const dataWithLongNote = {
        quick_note: "a".repeat(2001),
        email: "test@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.safeParse(dataWithLongNote);
      expect(result.success).toBe(false);
    });
  });

  describe("Strict Object (Mass Assignment Prevention)", () => {
    it("should reject unknown properties", () => {
      const dataWithExtraFields = {
        email: "test@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
        admin: true, // Malicious field
        role: "superuser", // Malicious field
      };

      const result = quickAddSchema.safeParse(dataWithExtraFields);
      expect(result.success).toBe(false);
    });
  });

  describe("Optional Array Fields", () => {
    it("should default product_ids to empty array when not provided", () => {
      const dataWithoutProducts = {
        email: "test@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
      };

      const result = quickAddSchema.parse(dataWithoutProducts);
      expect(result.product_ids).toEqual([]);
    });

    it("should accept product_ids array with numbers", () => {
      const dataWithProducts = {
        email: "test@example.com",
        org_name: "Acme Corp",
        campaign: "Trade Show 2024",
        principal_id: 1,
        product_ids: [1, 2, 3],
      };

      const result = quickAddSchema.parse(dataWithProducts);
      expect(result.product_ids).toEqual([1, 2, 3]);
    });
  });
});
