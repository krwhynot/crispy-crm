/**
 * Tests for SalesService - Sales user management via Edge Functions
 *
 * Tests verify:
 * 1. Sales account creation (POST /users)
 * 2. Sales profile updates (PATCH /users)
 * 3. Password updates (PATCH /updatePassword)
 * 4. Edge Function invocation correctness
 * 5. Error handling and logging
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { SalesService } from "../sales.service";
import type { DataProvider } from "ra-core";
import { HttpError } from "react-admin";
import type { SalesFormData, Sale } from "../../types";
import { createMockDataProvider } from "@/tests/utils/mock-providers";

/**
 * Extended DataProvider type that includes the invoke method for Edge Functions
 * Matches the constructor signature of SalesService
 */
interface DataProviderWithInvoke extends DataProvider {
  invoke?: <T = unknown>(
    functionName: string,
    options?: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  ) => Promise<T>;
}

describe("SalesService", () => {
  let service: SalesService;
  let mockDataProvider: DataProviderWithInvoke;
  let mockSalesFormData: SalesFormData;

  beforeEach(() => {
    const baseProvider = createMockDataProvider();
    mockDataProvider = {
      ...baseProvider,
      invoke: vi.fn(),
    };
    service = new SalesService(mockDataProvider);

    mockSalesFormData = {
      email: "john.doe@example.com",
      password: "SecurePassword123!",
      first_name: "John",
      last_name: "Doe",
      administrator: false,
      disabled: false,
      avatar_url: "https://example.com/avatar.jpg",
    };
  });

  describe("salesCreate", () => {
    test("should call Edge Function with POST method and sales form data", async () => {
      const mockCreatedSale: Sale = {
        id: 1,
        user_id: "uuid-123",
        email: mockSalesFormData.email,
        first_name: mockSalesFormData.first_name,
        last_name: mockSalesFormData.last_name,
        administrator: mockSalesFormData.administrator,
        disabled: mockSalesFormData.disabled,
        avatar: { src: mockSalesFormData.avatar_url },
      };

      mockDataProvider.invoke = vi.fn().mockResolvedValue(mockCreatedSale);

      const result = await service.salesCreate(mockSalesFormData);

      expect(mockDataProvider.invoke).toHaveBeenCalledWith("users", {
        method: "POST",
        body: mockSalesFormData,
      });
      expect(result).toEqual(mockCreatedSale);
    });

    test("should throw if dataProvider lacks invoke capability", async () => {
      // DataProvider without invoke method - intentional to test error handling
      const providerWithoutInvoke: DataProviderWithInvoke = createMockDataProvider();
      const serviceWithoutInvoke = new SalesService(providerWithoutInvoke);

      await expect(serviceWithoutInvoke.salesCreate(mockSalesFormData)).rejects.toThrow(
        "DataProvider does not support Edge Function operations"
      );
    });

    test("should throw if Edge Function returns no data", async () => {
      mockDataProvider.invoke = vi.fn().mockResolvedValue(null);

      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(
        "Sales creation failed: No data returned from Edge Function"
      );
    });

    test("should throw if Edge Function returns undefined", async () => {
      mockDataProvider.invoke = vi.fn().mockResolvedValue(undefined);

      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(
        "Sales creation failed: No data returned from Edge Function"
      );
    });

    test("should handle Edge Function errors with enhanced error message", async () => {
      mockDataProvider.invoke = vi.fn().mockRejectedValue(new Error("Email already exists"));

      // Service now throws HttpError with body.errors format per React Admin server validation
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(HttpError);
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow("Email already exists");
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.invoke = vi.fn().mockRejectedValue(new Error("Database error"));

      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow();

      // devError calls console.error with 3 arguments: component, message, context
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[SalesService]",
        "Failed to create account manager",
        expect.objectContaining({
          body: mockSalesFormData,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });

    test("should create admin users when administrator is true", async () => {
      const adminFormData = { ...mockSalesFormData, administrator: true };
      const mockCreatedAdmin: Sale = {
        id: 1,
        user_id: "uuid-admin",
        email: adminFormData.email,
        first_name: adminFormData.first_name,
        last_name: adminFormData.last_name,
        administrator: true,
        disabled: false,
      };

      mockDataProvider.invoke = vi.fn().mockResolvedValue(mockCreatedAdmin);

      const result = await service.salesCreate(adminFormData);

      expect(result.administrator).toBe(true);
      expect(mockDataProvider.invoke).toHaveBeenCalledWith(
        "users",
        expect.objectContaining({
          body: expect.objectContaining({ administrator: true }),
        })
      );
    });

    test("should create disabled users when disabled is true", async () => {
      const disabledFormData = { ...mockSalesFormData, disabled: true };
      mockDataProvider.invoke = vi.fn().mockResolvedValue({
        id: 1,
        disabled: true,
      } as Sale);

      await service.salesCreate(disabledFormData);

      expect(mockDataProvider.invoke).toHaveBeenCalledWith(
        "users",
        expect.objectContaining({
          body: expect.objectContaining({ disabled: true }),
        })
      );
    });

    test("should handle validation errors from Edge Function", async () => {
      mockDataProvider.invoke = vi
        .fn()
        .mockRejectedValue(new Error("Password must be at least 8 characters"));

      // Service now throws HttpError with body.errors format per React Admin server validation
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(HttpError);
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(
        "Password must be at least 8 characters"
      );
    });
  });

  describe("salesUpdate", () => {
    test("should call Edge Function with PATCH method and sales data", async () => {
      const salesId = 1;
      const updateData = {
        email: "updated@example.com",
        first_name: "Jane",
        last_name: "Smith",
        role: "admin" as const,
        disabled: false,
        avatar_url: "https://example.com/new-avatar.jpg",
      };

      const mockUpdatedSale: Sale = {
        id: salesId,
        user_id: "uuid-123",
        ...updateData,
        avatar: { src: updateData.avatar_url },
      };

      mockDataProvider.invoke = vi.fn().mockResolvedValue(mockUpdatedSale);

      const result = await service.salesUpdate(salesId, updateData);

      // Note: role uses !== undefined check (enum), disabled uses !== undefined check (boolean)
      // String fields use truthy checks - empty strings excluded
      expect(mockDataProvider.invoke).toHaveBeenCalledWith("users", {
        method: "PATCH",
        body: {
          sales_id: salesId,
          email: updateData.email,
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          role: updateData.role,
          disabled: updateData.disabled,
          avatar_url: updateData.avatar_url,
        },
      });
      expect(result).toEqual(updateData);
    });

    test("should throw if dataProvider lacks invoke capability", async () => {
      // DataProvider without invoke method - intentional to test error handling
      const providerWithoutInvoke: DataProviderWithInvoke = createMockDataProvider();
      const serviceWithoutInvoke = new SalesService(providerWithoutInvoke);

      await expect(serviceWithoutInvoke.salesUpdate(1, { first_name: "John" })).rejects.toThrow(
        "DataProvider does not support Edge Function operations"
      );
    });

    test("should throw if Edge Function returns no data", async () => {
      mockDataProvider.invoke = vi.fn().mockResolvedValue(null);

      await expect(service.salesUpdate(1, { first_name: "John" })).rejects.toThrow(
        "Sales update failed: No data returned from Edge Function"
      );
    });

    test("should handle partial updates", async () => {
      const salesId = 1;
      const partialUpdate = { first_name: "Updated" };

      mockDataProvider.invoke = vi.fn().mockResolvedValue({
        id: salesId,
        first_name: "Updated",
      } as Sale);

      await service.salesUpdate(salesId, partialUpdate);

      expect(mockDataProvider.invoke).toHaveBeenCalledWith("users", {
        method: "PATCH",
        body: expect.objectContaining({
          sales_id: salesId,
          first_name: "Updated",
        }),
      });
    });

    test("should exclude password from update data", async () => {
      // Intentional: Testing that password is excluded even if passed (bypasses type check)
      const updateDataWithPassword = {
        first_name: "John",
        password: "should-not-be-here",
      } as unknown as Parameters<typeof service.salesUpdate>[1];

      mockDataProvider.invoke = vi.fn().mockResolvedValue({ id: 1 } as Sale);

      await service.salesUpdate(1, updateDataWithPassword);

      // Verify password is not in the PATCH body
      expect(mockDataProvider.invoke).toHaveBeenCalledWith("users", {
        method: "PATCH",
        body: expect.not.objectContaining({ password: expect.anything() }),
      });
    });

    test("should exclude falsy/undefined fields from update body", async () => {
      const updateData = {
        first_name: "John",
        last_name: undefined, // undefined - excluded
        email: "", // empty string - excluded (truthy check)
      };

      mockDataProvider.invoke = vi.fn().mockResolvedValue({ id: 1 } as Sale);

      await service.salesUpdate(1, updateData);

      // Only truthy string values should be included
      // undefined and empty strings are excluded to prevent Zod validation errors
      expect(mockDataProvider.invoke).toHaveBeenCalledWith("users", {
        method: "PATCH",
        body: {
          sales_id: 1,
          first_name: "John",
          // last_name and email NOT included (falsy values)
        },
      });
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.invoke = vi.fn().mockRejectedValue(new Error("Database error"));

      const updateData = { first_name: "John" };
      await expect(service.salesUpdate(1, updateData)).rejects.toThrow();

      // devError calls console.error with 3 arguments: component, message, context
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[SalesService]",
        "Failed to update account manager",
        expect.objectContaining({
          id: 1,
          data: updateData,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });

    test("should work with numeric and string IDs", async () => {
      mockDataProvider.invoke = vi.fn().mockResolvedValue({ id: 1 } as Sale);

      // Numeric ID
      await service.salesUpdate(123, { first_name: "John" });
      expect(mockDataProvider.invoke).toHaveBeenCalledWith(
        "users",
        expect.objectContaining({
          body: expect.objectContaining({ sales_id: 123 }),
        })
      );

      // String ID
      await service.salesUpdate("uuid-456", { first_name: "Jane" });
      expect(mockDataProvider.invoke).toHaveBeenCalledWith(
        "users",
        expect.objectContaining({
          body: expect.objectContaining({ sales_id: "uuid-456" }),
        })
      );
    });

    test("should handle Edge Function errors", async () => {
      mockDataProvider.invoke = vi.fn().mockRejectedValue(new Error("Email already exists"));

      await expect(service.salesUpdate(1, { email: "duplicate@example.com" })).rejects.toThrow(
        "Sales update failed: Email already exists"
      );
    });
  });

  describe("updatePassword", () => {
    test("should call Edge Function with PATCH method and sales ID", async () => {
      const salesId = 1;
      mockDataProvider.invoke = vi.fn().mockResolvedValue(true);

      const result = await service.updatePassword(salesId);

      expect(mockDataProvider.invoke).toHaveBeenCalledWith("updatePassword", {
        method: "PATCH",
        body: { sales_id: salesId },
      });
      expect(result).toBe(true);
    });

    test("should throw if dataProvider lacks invoke capability", async () => {
      // DataProvider without invoke method - intentional to test error handling
      const providerWithoutInvoke: DataProviderWithInvoke = createMockDataProvider();
      const serviceWithoutInvoke = new SalesService(providerWithoutInvoke);

      await expect(serviceWithoutInvoke.updatePassword(1)).rejects.toThrow(
        "DataProvider does not support Edge Function operations"
      );
    });

    test("should throw if Edge Function returns false", async () => {
      mockDataProvider.invoke = vi.fn().mockResolvedValue(false);

      await expect(service.updatePassword(1)).rejects.toThrow(
        "Password update failed: Edge Function returned false"
      );
    });

    test("should throw if Edge Function returns null", async () => {
      mockDataProvider.invoke = vi.fn().mockResolvedValue(null);

      await expect(service.updatePassword(1)).rejects.toThrow(
        "Password update failed: Edge Function returned false"
      );
    });

    test("should handle Edge Function errors", async () => {
      mockDataProvider.invoke = vi.fn().mockRejectedValue(new Error("User not found"));

      await expect(service.updatePassword(1)).rejects.toThrow(
        "Password update failed: User not found"
      );
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.invoke = vi.fn().mockRejectedValue(new Error("Database error"));

      await expect(service.updatePassword(1)).rejects.toThrow();

      // devError calls console.error with 3 arguments: component, message, context
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[SalesService]",
        "Failed to update password",
        expect.objectContaining({
          id: 1,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });

    test("should work with numeric and string IDs", async () => {
      mockDataProvider.invoke = vi.fn().mockResolvedValue(true);

      // Numeric ID
      await service.updatePassword(789);
      expect(mockDataProvider.invoke).toHaveBeenCalledWith(
        "updatePassword",
        expect.objectContaining({
          body: expect.objectContaining({ sales_id: 789 }),
        })
      );

      // String ID
      await service.updatePassword("uuid-789");
      expect(mockDataProvider.invoke).toHaveBeenCalledWith(
        "updatePassword",
        expect.objectContaining({
          body: expect.objectContaining({ sales_id: "uuid-789" }),
        })
      );
    });

    test("should handle network timeout errors", async () => {
      mockDataProvider.invoke = vi
        .fn()
        .mockRejectedValue(new Error("Network request failed: timeout"));

      await expect(service.updatePassword(1)).rejects.toThrow(
        "Password update failed: Network request failed: timeout"
      );
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("should handle malformed Edge Function responses", async () => {
      mockDataProvider.invoke = vi.fn().mockResolvedValue({ invalid: "response" });

      // Service accepts any response structure, so this will succeed
      const result = await service.salesCreate(mockSalesFormData);
      expect(result).toEqual({ invalid: "response" });
    });

    test("should handle network errors", async () => {
      mockDataProvider.invoke = vi.fn().mockRejectedValue(new Error("Network request failed"));

      // Service now throws HttpError with body.errors format per React Admin server validation
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(HttpError);
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(
        "Network request failed"
      );
    });

    test("should handle RLS policy violations", async () => {
      mockDataProvider.invoke = vi
        .fn()
        .mockRejectedValue(new Error("new row violates row-level security policy"));

      // Service now throws HttpError with body.errors format per React Admin server validation
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(HttpError);
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(
        "new row violates row-level security policy"
      );
    });

    test("should handle auth errors", async () => {
      mockDataProvider.invoke = vi.fn().mockRejectedValue(new Error("JWT expired"));

      // Service now throws HttpError with body.errors format per React Admin server validation
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow(HttpError);
      await expect(service.salesCreate(mockSalesFormData)).rejects.toThrow("JWT expired");
    });
  });

  describe("Integration Tests", () => {
    test("should support full CRUD lifecycle: create → update → updatePassword", async () => {
      // Create
      const createResponse: Sale = {
        id: 1,
        user_id: "uuid-123",
        email: mockSalesFormData.email,
        first_name: mockSalesFormData.first_name,
        last_name: mockSalesFormData.last_name,
        administrator: false,
        disabled: false,
      };
      mockDataProvider.invoke = vi
        .fn()
        .mockResolvedValueOnce(createResponse)
        .mockResolvedValueOnce(createResponse)
        .mockResolvedValueOnce(true);

      await service.salesCreate(mockSalesFormData);
      await service.salesUpdate(1, { first_name: "Updated" });
      await service.updatePassword(1);

      expect(mockDataProvider.invoke).toHaveBeenCalledTimes(3);
    });

    test("should handle concurrent operations gracefully", async () => {
      mockDataProvider.invoke = vi
        .fn()
        .mockResolvedValueOnce({ id: 1 } as Sale)
        .mockResolvedValueOnce({ id: 2 } as Sale);

      const results = await Promise.all([
        service.salesUpdate(1, { first_name: "User1" }),
        service.salesUpdate(2, { first_name: "User2" }),
      ]);

      expect(results).toHaveLength(2);
      expect(mockDataProvider.invoke).toHaveBeenCalledTimes(2);
    });
  });
});
