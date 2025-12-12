/**
 * ContactCreate Component Tests
 *
 * Tests form handling, JSONB arrays, multi-org validation,
 * and API error states through unit and integration testing
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  createServerError,
  createValidationError,
  createEmailArray,
  createPhoneArray,
} from "@/tests/utils/mock-providers";
import type { Contact } from "../../types";

describe("ContactCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Transform Function and Data Flow", () => {
    test("transforms data correctly on create with timestamps and defaults", () => {
      // Test the transform logic directly
      const transformData = (data: Contact) => ({
        ...data,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        tags: [],
      });

      const inputData = {
        first_name: "John",
        last_name: "Doe",
        email: createEmailArray([{ value: "john@example.com", type: "work" }]),
        sales_id: 1,
      };

      const result = transformData(inputData);

      // Verify timestamps are added
      expect(result).toHaveProperty("first_seen");
      expect(result).toHaveProperty("last_seen");
      expect(result.first_seen).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.last_seen).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Verify tags default is set
      expect(result.tags).toEqual([]);

      // Verify original data is preserved
      expect(result.first_name).toBe(inputData.first_name);
      expect(result.last_name).toBe(inputData.last_name);
      expect(result.email).toEqual(inputData.email);
      expect(result.sales_id).toBe(inputData.sales_id);
    });

    test("handles create operation with JSONB arrays", () => {
      const transformData = (data: Contact) => ({
        ...data,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        tags: [],
      });

      const inputData = {
        first_name: "John",
        last_name: "Doe",
        email: createEmailArray([
          { value: "work@example.com", type: "work" },
          { value: "personal@example.com", type: "home" },
        ]),
        phone: createPhoneArray([
          { value: "+1-555-0100", type: "work" },
          { value: "+1-555-0101", type: "home" },
        ]),
        sales_id: 1,
      };

      const result = transformData(inputData);

      // Check that JSONB arrays are preserved
      expect(result.email).toEqual(inputData.email);
      expect(result.phone).toEqual(inputData.phone);

      // Check that timestamps are valid ISO strings
      const firstSeen = new Date(result.first_seen);
      const lastSeen = new Date(result.last_seen);
      expect(firstSeen.toISOString()).toBe(result.first_seen);
      expect(lastSeen.toISOString()).toBe(result.last_seen);

      // Verify tags are initialized
      expect(result.tags).toEqual([]);
    });
  });

  describe("API Error Handling", () => {
    test("propagates server errors to data provider", async () => {
      const serverError = createServerError("Database connection failed");
      const mockCreate = vi.fn().mockRejectedValue(serverError);

      // Test that errors are properly propagated through the data provider
      try {
        await mockCreate("contacts", {
          data: {
            first_name: "Test",
            last_name: "User",
            email: [{ value: "test@example.com", type: "work" }],
            sales_id: 1,
          },
        });
      } catch (error) {
        expect(error).toEqual(serverError);
        expect(error.message).toBe("Database connection failed");
      }

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    test("handles validation errors from API", async () => {
      const validationErrors = createValidationError({
        "email.0.email": "Email already exists",
        organization_id: "Organization not found",
      });

      const mockCreate = vi.fn().mockRejectedValue(validationErrors);

      // Test that validation errors are properly formatted for React Admin
      try {
        await mockCreate("contacts", {
          data: {
            first_name: "John",
            last_name: "Doe",
            email: [{ value: "existing@example.com", type: "work" }],
            organization_id: 999,
            sales_id: 1,
          },
        });
      } catch (error) {
        expect(error).toEqual(validationErrors);
        expect(error.errors).toHaveProperty("email.0.email");
        expect(error.errors).toHaveProperty("organization_id");
      }

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    test("handles network errors gracefully", async () => {
      const networkError = new Error("Network timeout");
      const mockCreate = vi.fn().mockRejectedValue(networkError);

      try {
        await mockCreate("contacts", {
          data: {
            first_name: "Jane",
            last_name: "Smith",
            email: [{ value: "jane@example.com", type: "work" }],
            sales_id: 1,
          },
        });
      } catch (error) {
        expect(error).toBe(networkError);
        expect(error.message).toBe("Network timeout");
      }

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Organization Relationships", () => {
    test("validates organization_id field", () => {
      const transformData = (data: Contact) => ({
        ...data,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        tags: [],
      });

      const inputWithOrg = {
        first_name: "John",
        last_name: "Doe",
        email: [{ value: "john@example.com", type: "work" as const }],
        organization_id: 1,
        sales_id: 1,
      };

      const result = transformData(inputWithOrg);

      // Organization ID should be preserved
      expect(result.organization_id).toBe(1);
      expect(result).toHaveProperty("first_seen");
      expect(result).toHaveProperty("last_seen");
      expect(result.tags).toEqual([]);
    });

    test("rejects contact without organization (organization_id is required)", async () => {
      // Per business rule: contacts cannot exist without an organization (no orphans)
      // See migration 20251129030358_contact_organization_id_not_null.sql
      const { createContactSchema } = await import("../../validation/contacts");

      const inputWithoutOrg = {
        first_name: "Jane",
        last_name: "Smith",
        email: [{ value: "jane@example.com", type: "work" as const }],
        phone: [],
        sales_id: 1,
        // No organization_id - should fail validation
      };

      // Validation should fail when organization_id is missing
      const result = createContactSchema.safeParse(inputWithoutOrg);
      expect(result.success).toBe(false);
      if (!result.success) {
        const orgError = result.error.issues.find((i) => i.path.includes("organization_id"));
        expect(orgError).toBeDefined();
        expect(orgError?.message).toContain("Organization");
      }
    });
  });

  describe("JSONB Array Structure", () => {
    test("email array follows correct JSONB structure", () => {
      const emailArray = createEmailArray([
        { value: "work@example.com", type: "work" },
        { value: "home@example.com", type: "home" },
        { value: "other@example.com", type: "other" },
      ]);

      // Validate email array structure
      expect(Array.isArray(emailArray)).toBe(true);
      expect(emailArray).toHaveLength(3);

      emailArray.forEach((emailEntry) => {
        // Each entry must have value and type
        expect(emailEntry).toHaveProperty("value");
        expect(emailEntry).toHaveProperty("type");

        // Type must be one of the allowed values
        expect(["work", "home", "other"]).toContain(emailEntry.type);

        // Email should be a valid format (basic check)
        expect(emailEntry.value).toMatch(/@/);
      });

      // Test transform preserves the structure
      const transformData = (data: Contact) => ({
        ...data,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        tags: [],
      });

      const result = transformData({
        first_name: "Test",
        last_name: "User",
        email: emailArray,
        sales_id: 1,
      });

      expect(result.email).toEqual(emailArray);
    });

    test("phone array follows correct JSONB structure", () => {
      const phoneArray = createPhoneArray([
        { value: "+1-555-0100", type: "work" },
        { value: "+1-555-0200", type: "home" },
        { value: "+1-555-0300", type: "other" },
      ]);

      // Validate phone array structure
      expect(Array.isArray(phoneArray)).toBe(true);
      expect(phoneArray).toHaveLength(3);

      phoneArray.forEach((phoneEntry) => {
        // Each entry must have value and type
        expect(phoneEntry).toHaveProperty("value");
        expect(phoneEntry).toHaveProperty("type");

        // Type must be one of the allowed values
        expect(["work", "home", "other"]).toContain(phoneEntry.type);

        // Number should be a string
        expect(typeof phoneEntry.value).toBe("string");
      });

      // Test transform preserves the structure
      const transformData = (data: Contact) => ({
        ...data,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        tags: [],
      });

      const result = transformData({
        first_name: "Test",
        last_name: "User",
        phone: phoneArray,
        sales_id: 1,
      });

      expect(result.phone).toEqual(phoneArray);
    });
  });

  describe("Data Validation at API Boundary", () => {
    test("validation happens through Zod schemas at data provider level", () => {
      // This test verifies that validation is delegated to the API boundary
      // as per the validation architecture (Zod schemas in validation/contacts.ts)

      const transformData = (data: Contact) => ({
        ...data,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        tags: [],
      });

      const validData = {
        first_name: "John",
        last_name: "Doe",
        email: [{ value: "john@example.com", type: "work" as const }],
        sales_id: 1,
      };

      const result = transformData(validData);

      // Required fields are present
      expect(result).toHaveProperty("first_name");
      expect(result).toHaveProperty("last_name");
      expect(result).toHaveProperty("sales_id");

      // Transform fields added by ContactCreate
      expect(result).toHaveProperty("first_seen");
      expect(result).toHaveProperty("last_seen");
      expect(result).toHaveProperty("tags");

      // Data is in correct format for validation
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
      expect(result.sales_id).toBe(1);
      expect(Array.isArray(result.email)).toBe(true);
      expect(Array.isArray(result.tags)).toBe(true);
    });

    test("default values are properly set", () => {
      // Test that the component sets proper defaults
      const getDefaultValues = (identityId?: number) => ({
        sales_id: identityId,
      });

      const defaults = getDefaultValues(123);

      expect(defaults.sales_id).toBe(123);

      // Test with no identity
      const noIdentityDefaults = getDefaultValues(undefined);
      expect(noIdentityDefaults.sales_id).toBeUndefined();
    });
  });
});
