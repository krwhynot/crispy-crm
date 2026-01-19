import { describe, it, expect } from "vitest";
import { quickAddSchema } from "../quickAdd";

describe("QuickAdd Schema Validation", () => {
  describe("Organization Requirement (organization_id OR org_name)", () => {
    it("should accept data with existing organization_id (no org_name)", () => {
      const dataWithOrgId = {
        organization_id: 1,
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithOrgId);
      expect(result.organization_id).toBe(1);
      expect(result.org_name).toBeUndefined();
    });

    it("should accept data with new org_name (no organization_id)", () => {
      const dataWithOrgName = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithOrgName);
      expect(result.org_name).toBe("Acme Corp");
      expect(result.organization_id).toBeUndefined();
    });

    it("should accept data with both organization_id and org_name", () => {
      const dataWithBoth = {
        organization_id: 1,
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithBoth);
      expect(result.organization_id).toBe(1);
      expect(result.org_name).toBe("Acme Corp");
    });

    it("should reject data without both organization_id and org_name", () => {
      const dataWithoutOrg = {
        first_name: "John",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithoutOrg);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Organization is required");
      }
    });

    it("should reject data with empty org_name and no organization_id", () => {
      const dataWithEmptyOrgName = {
        org_name: "",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithEmptyOrgName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Organization is required");
      }
    });

    it("should reject data with whitespace-only org_name and no organization_id", () => {
      const dataWithWhitespaceOrgName = {
        org_name: "   ",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithWhitespaceOrgName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Organization is required");
      }
    });
  });

  describe("Required Fields", () => {
    it("should require principal_id", () => {
      const dataWithoutPrincipal = {
        org_name: "Acme Corp",
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithoutPrincipal);
      expect(result.success).toBe(false);
      if (!result.success) {
        const principalError = result.error.issues.find((i) => i.path.includes("principal_id"));
        expect(principalError).toBeDefined();
      }
    });

    it("should require account_manager_id", () => {
      const dataWithoutAccountManager = {
        org_name: "Acme Corp",
        principal_id: 2,
      };

      const result = quickAddSchema.safeParse(dataWithoutAccountManager);
      expect(result.success).toBe(false);
      if (!result.success) {
        const accountManagerError = result.error.issues.find((i) =>
          i.path.includes("account_manager_id")
        );
        expect(accountManagerError).toBeDefined();
      }
    });
  });

  describe("Optional Fields", () => {
    it("should accept valid data with all fields populated", () => {
      const validData = {
        organization_id: 1,
        org_name: "Acme Corp",
        first_name: "John",
        last_name: "Doe",
        phone: "555-1234",
        email: "john@example.com",
        city: "Chicago",
        state: "IL",
        campaign: "Trade Show 2024",
        principal_id: 2,
        account_manager_id: 3,
        product_ids: [1, 2],
        quick_note: "Met at booth",
      };

      const result = quickAddSchema.parse(validData);
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
      expect(result.city).toBe("Chicago");
      expect(result.state).toBe("IL");
      expect(result.campaign).toBe("Trade Show 2024");
    });

    it("should accept data without first_name (optional)", () => {
      const dataWithoutFirstName = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithoutFirstName);
      expect(result.first_name).toBeUndefined();
    });

    it("should accept data without last_name (optional)", () => {
      const dataWithoutLastName = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithoutLastName);
      expect(result.last_name).toBeUndefined();
    });

    it("should accept data without city (optional)", () => {
      const dataWithoutCity = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithoutCity);
      expect(result.city).toBeUndefined();
    });

    it("should accept data without state (optional)", () => {
      const dataWithoutState = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithoutState);
      expect(result.state).toBeUndefined();
    });

    it("should accept data without campaign (optional)", () => {
      const dataWithoutCampaign = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithoutCampaign);
      expect(result.campaign).toBeUndefined();
    });

    it("should accept data without phone (optional)", () => {
      const dataWithoutPhone = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithoutPhone);
      expect(result.phone).toBeUndefined();
    });

    it("should accept data without email (optional)", () => {
      const dataWithoutEmail = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithoutEmail);
      expect(result.email).toBeUndefined();
    });

    it("should accept data without phone, email, or campaign (all optional)", () => {
      const minimalValidData = {
        organization_id: 1,
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(minimalValidData);
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.campaign).toBeUndefined();
      expect(result.organization_id).toBe(1);
    });

    it("should accept data with only the minimal required fields", () => {
      const minimalData = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(minimalData);
      expect(result.org_name).toBe("Acme Corp");
      expect(result.principal_id).toBe(2);
      expect(result.account_manager_id).toBe(3);
      expect(result.first_name).toBeUndefined();
      expect(result.last_name).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.city).toBeUndefined();
      expect(result.state).toBeUndefined();
      expect(result.campaign).toBeUndefined();
    });
  });

  describe("Email Validation", () => {
    it("should reject invalid email format", () => {
      const dataWithInvalidEmail = {
        org_name: "Acme Corp",
        email: "not-an-email",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithInvalidEmail);
      expect(result.success).toBe(false);
    });

    it("should accept valid email format", () => {
      const dataWithValidEmail = {
        org_name: "Acme Corp",
        email: "valid@example.com",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithValidEmail);
      expect(result.email).toBe("valid@example.com");
    });

    it("should accept empty string email", () => {
      const dataWithEmptyEmail = {
        org_name: "Acme Corp",
        email: "",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithEmptyEmail);
      expect(result.email).toBe("");
    });
  });

  describe("String Length Limits (DoS Prevention)", () => {
    it("should reject first_name over 100 characters", () => {
      const dataWithLongFirstName = {
        first_name: "a".repeat(101),
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithLongFirstName);
      expect(result.success).toBe(false);
    });

    it("should reject last_name over 100 characters", () => {
      const dataWithLongLastName = {
        last_name: "a".repeat(101),
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithLongLastName);
      expect(result.success).toBe(false);
    });

    it("should reject org_name over 255 characters", () => {
      const dataWithLongOrgName = {
        org_name: "a".repeat(256),
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithLongOrgName);
      expect(result.success).toBe(false);
    });

    it("should reject city over 100 characters", () => {
      const dataWithLongCity = {
        city: "a".repeat(101),
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithLongCity);
      expect(result.success).toBe(false);
    });

    it("should reject state over 50 characters", () => {
      const dataWithLongState = {
        state: "a".repeat(51),
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithLongState);
      expect(result.success).toBe(false);
    });

    it("should reject quick_note over 2000 characters", () => {
      const dataWithLongNote = {
        quick_note: "a".repeat(2001),
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithLongNote);
      expect(result.success).toBe(false);
    });

    it("should reject campaign over 255 characters", () => {
      const dataWithLongCampaign = {
        campaign: "a".repeat(256),
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.safeParse(dataWithLongCampaign);
      expect(result.success).toBe(false);
    });
  });

  describe("Strict Object (Mass Assignment Prevention)", () => {
    it("should reject unknown properties", () => {
      const dataWithExtraFields = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
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
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
      };

      const result = quickAddSchema.parse(dataWithoutProducts);
      expect(result.product_ids).toEqual([]);
    });

    it("should accept product_ids array with numbers", () => {
      const dataWithProducts = {
        org_name: "Acme Corp",
        principal_id: 2,
        account_manager_id: 3,
        product_ids: [1, 2, 3],
      };

      const result = quickAddSchema.parse(dataWithProducts);
      expect(result.product_ids).toEqual([1, 2, 3]);
    });
  });
});
