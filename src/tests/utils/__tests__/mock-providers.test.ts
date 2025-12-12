/**
 * Tests for mock data providers and test data factories
 */

import { describe, test, expect, vi } from "vitest";
import {
  createMockDataProvider,
  createMockAuthProvider,
  createMockOpportunity,
  createMockContact,
  createMockOrganization,
  createServerError,
  createRLSViolationError,
  createValidationError,
  createRejectedDataProvider,
} from "../mock-providers";

describe("createMockDataProvider", () => {
  test("implements all required DataProvider methods", () => {
    const provider = createMockDataProvider();

    expect(provider.getList).toBeDefined();
    expect(provider.getOne).toBeDefined();
    expect(provider.getMany).toBeDefined();
    expect(provider.getManyReference).toBeDefined();
    expect(provider.create).toBeDefined();
    expect(provider.update).toBeDefined();
    expect(provider.updateMany).toBeDefined();
    expect(provider.delete).toBeDefined();
    expect(provider.deleteMany).toBeDefined();
  });

  test("getList returns empty data by default", async () => {
    const provider = createMockDataProvider();
    const result = await provider.getList("opportunities", {
      pagination: { page: 1, perPage: 10 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  test("create simulates pessimistic mode delay", async () => {
    const provider = createMockDataProvider();
    const startTime = Date.now();

    await provider.create("opportunities", {
      data: { name: "Test" },
    });

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  test("create returns data with generated ID", async () => {
    const provider = createMockDataProvider();
    const result = await provider.create("opportunities", {
      data: { name: "Test Opportunity" },
    });

    expect(result.data.id).toBeDefined();
    expect(typeof result.data.id).toBe("number");
    expect(result.data.name).toBe("Test Opportunity");
  });

  test("allows partial overrides of methods", async () => {
    const mockGetList = vi.fn().mockResolvedValue({
      data: [{ id: 1, name: "Override" }],
      total: 1,
    });

    const provider = createMockDataProvider({
      getList: mockGetList,
    });

    await provider.getList("opportunities", {
      pagination: { page: 1, perPage: 10 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    });

    expect(mockGetList).toHaveBeenCalled();
  });
});

describe("createMockAuthProvider", () => {
  test("checkAuth resolves when authenticated", async () => {
    const provider = createMockAuthProvider({ isAuthenticated: true });

    await expect(provider.checkAuth({})).resolves.toBeUndefined();
  });

  test("checkAuth rejects when not authenticated", async () => {
    const provider = createMockAuthProvider({ isAuthenticated: false });

    await expect(provider.checkAuth({})).rejects.toBeUndefined();
  });

  test("getPermissions returns admin for admin role", async () => {
    const provider = createMockAuthProvider({ role: "admin" });
    const permissions = await provider.getPermissions({});

    expect(permissions).toEqual(["admin"]);
  });

  test("getPermissions returns user for user role", async () => {
    const provider = createMockAuthProvider({ role: "user" });
    const permissions = await provider.getPermissions({});

    expect(permissions).toEqual(["user"]);
  });

  test("getIdentity returns identity with administrator flag", async () => {
    const adminProvider = createMockAuthProvider({ role: "admin" });
    const adminIdentity = await adminProvider.getIdentity();

    expect(adminIdentity.administrator).toBe(true);

    const userProvider = createMockAuthProvider({ role: "user" });
    const userIdentity = await userProvider.getIdentity();

    expect(userIdentity.administrator).toBe(false);
  });
});

describe("Test Data Factories", () => {
  test("createMockOpportunity generates valid opportunity", () => {
    const opportunity = createMockOpportunity();

    expect(opportunity.id).toBeDefined();
    expect(opportunity.name).toBeDefined();
    expect(opportunity.stage).toBeDefined();
    expect(opportunity.probability).toBeGreaterThanOrEqual(0);
    expect(opportunity.probability).toBeLessThanOrEqual(100);
    expect(opportunity.contact_ids).toBeInstanceOf(Array);
    expect(opportunity.deleted_at).toBeNull();
  });

  test("createMockOpportunity accepts overrides", () => {
    const opportunity = createMockOpportunity({
      name: "Custom Opportunity",
      stage: "closed_won",
    });

    expect(opportunity.name).toBe("Custom Opportunity");
    expect(opportunity.stage).toBe("closed_won");
  });

  test("createMockContact generates valid contact with JSONB arrays", () => {
    const contact = createMockContact();

    expect(contact.id).toBeDefined();
    expect(contact.first_name).toBeDefined();
    expect(contact.last_name).toBeDefined();
    expect(contact.email).toBeInstanceOf(Array);
    expect(contact.email[0]).toHaveProperty("value");
    expect(contact.email[0]).toHaveProperty("type");
    expect(contact.phone).toBeInstanceOf(Array);
    expect(contact.phone[0]).toHaveProperty("value");
    expect(contact.phone[0]).toHaveProperty("type");
  });

  test("createMockOrganization generates valid organization", () => {
    const org = createMockOrganization();

    expect(org.id).toBeDefined();
    expect(org.name).toBeDefined();
    expect(org.website).toMatch(/^https?:\/\//);
    expect(org.priority).toMatch(/^[A-D]$/);
    expect(org.deleted_at).toBeNull();
  });
});

describe("Error Simulation Helpers", () => {
  test("createServerError creates 500 error", () => {
    const error = createServerError("Database connection failed");

    expect(error.message).toBe("Database connection failed");
    expect(error.status).toBe(500);
  });

  test("createRLSViolationError creates RLS error with field", () => {
    const error = createRLSViolationError("customer_organization_id");

    expect(error.message).toBe("RLS policy violation");
    expect(error.errors.customer_organization_id).toContain("permission");
  });

  test("createValidationError creates validation error with fields", () => {
    const error = createValidationError(
      {
        name: "Name is required",
        amount: "Amount must be positive",
      },
      "Form validation failed"
    );

    expect(error.message).toBe("Form validation failed");
    expect(error.errors.name).toBe("Name is required");
    expect(error.errors.amount).toBe("Amount must be positive");
  });

  test("createRejectedDataProvider creates provider that rejects", async () => {
    const error = createServerError("Server error");
    const provider = createRejectedDataProvider("create", error);

    await expect(
      provider.create("opportunities", {
        data: { name: "Test" },
      })
    ).rejects.toEqual(error);
  });

  test("createRejectedDataProvider simulates pessimistic mode delay before rejection", async () => {
    const error = createServerError();
    const provider = createRejectedDataProvider("create", error);

    const startTime = Date.now();

    try {
      await provider.create("opportunities", { data: { name: "Test" } });
    } catch {
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(100);
    }
  });
});
