/**
 * Tests for notesHandler (factory pattern)
 *
 * TDD: These tests verify the composed notes DataProvider handlers
 * for contact_notes, opportunity_notes, and organization_notes.
 *
 * All note types share identical behavior:
 * 1. Base Supabase provider operations
 * 2. withLifecycleCallbacks for soft delete only
 * 3. withValidation for Zod schema validation
 * 4. withErrorLogging for structured error handling + Sentry
 *
 * Engineering Constitution: DRY - one factory, three handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import {
  createContactNotesHandler,
  createOpportunityNotesHandler,
  createOrganizationNotesHandler,
} from "./notesHandler";

describe("notesHandler factory", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [{ id: 1, text: "Follow up call scheduled", date: "2024-01-15T10:00:00Z" }],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 1, text: "Follow up call scheduled", date: "2024-01-15T10:00:00Z" },
      }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };
  });

  describe("createContactNotesHandler", () => {
    it("should create a DataProvider with all standard methods", () => {
      const handler = createContactNotesHandler(mockBaseProvider);

      expect(handler.getList).toBeDefined();
      expect(handler.getOne).toBeDefined();
      expect(handler.create).toBeDefined();
      expect(handler.update).toBeDefined();
      expect(handler.delete).toBeDefined();
    });

    it("should apply soft delete filter", async () => {
      const handler = createContactNotesHandler(mockBaseProvider);

      await handler.getList("contact_notes", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "contact_notes",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });
  });

  describe("createOpportunityNotesHandler", () => {
    it("should create a DataProvider with all standard methods", () => {
      const handler = createOpportunityNotesHandler(mockBaseProvider);

      expect(handler.getList).toBeDefined();
      expect(handler.getOne).toBeDefined();
      expect(handler.create).toBeDefined();
      expect(handler.update).toBeDefined();
      expect(handler.delete).toBeDefined();
    });

    it("should apply soft delete filter", async () => {
      const handler = createOpportunityNotesHandler(mockBaseProvider);

      await handler.getList("opportunity_notes", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "opportunity_notes",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });
  });

  describe("createOrganizationNotesHandler", () => {
    it("should create a DataProvider with all standard methods", () => {
      const handler = createOrganizationNotesHandler(mockBaseProvider);

      expect(handler.getList).toBeDefined();
      expect(handler.getOne).toBeDefined();
      expect(handler.create).toBeDefined();
      expect(handler.update).toBeDefined();
      expect(handler.delete).toBeDefined();
    });

    it("should apply soft delete filter", async () => {
      const handler = createOrganizationNotesHandler(mockBaseProvider);

      await handler.getList("organization_notes", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "organization_notes",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });
  });

  describe("handler factory consistency", () => {
    it("all note handlers should be simple factory functions", () => {
      expect(typeof createContactNotesHandler).toBe("function");
      expect(typeof createOpportunityNotesHandler).toBe("function");
      expect(typeof createOrganizationNotesHandler).toBe("function");

      // Each takes exactly 1 argument (baseProvider)
      expect(createContactNotesHandler.length).toBe(1);
      expect(createOpportunityNotesHandler.length).toBe(1);
      expect(createOrganizationNotesHandler.length).toBe(1);
    });

    it("all note handlers should return valid DataProvider types", () => {
      const contactHandler: DataProvider = createContactNotesHandler(mockBaseProvider);
      const opportunityHandler: DataProvider = createOpportunityNotesHandler(mockBaseProvider);
      const organizationHandler: DataProvider = createOrganizationNotesHandler(mockBaseProvider);

      expect(contactHandler).toBeDefined();
      expect(opportunityHandler).toBeDefined();
      expect(organizationHandler).toBeDefined();
    });
  });

  describe("error handling integration", () => {
    it("should catch and transform errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createContactNotesHandler(mockBaseProvider);

      await expect(handler.getOne("contact_notes", { id: 1 })).rejects.toThrow();
    });
  });
});
