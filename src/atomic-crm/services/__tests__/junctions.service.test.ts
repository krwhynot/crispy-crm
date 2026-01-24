/**
 * Tests for JunctionsService - Multi-participant opportunity relationships
 *
 * CRITICAL: This service is essential for multi-participant opportunities
 * Tests verify junction table operations across 2 relationship types:
 * 1. Opportunity participants (organizations)
 * 2. Opportunity contacts
 *
 * Note: Contact-Organization relationships were removed after the
 * contact_organizations junction table was deprecated. Contacts now
 * use a direct organization_id FK (single org per contact).
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { JunctionsService } from "../junctions.service";
import { createMockDataProvider } from "@/tests/utils/mock-providers";
import { createMockDataProviderWithRpc, type DataProviderWithRpc } from "@/tests/utils/typed-mocks";

describe("JunctionsService", () => {
  let service: JunctionsService;
  let mockDataProvider: DataProviderWithRpc;

  beforeEach(() => {
    mockDataProvider = createMockDataProviderWithRpc(createMockDataProvider());
    service = new JunctionsService(mockDataProvider);
  });

  // Contact-Organization Relationships tests removed - junction table was deprecated.
  // Contacts now use a direct organization_id FK (single org per contact).

  describe("Opportunity Participants (CRITICAL for multi-participant)", () => {
    describe("getOpportunityParticipants", () => {
      test("should fetch and populate participant organizations", async () => {
        const opportunityId = 1;
        const mockParticipants = [
          {
            id: 1,
            opportunity_id: 1,
            organization_id: 101,
            role: "customer",
            is_primary: true,
          },
          {
            id: 2,
            opportunity_id: 1,
            organization_id: 102,
            role: "principal",
            is_primary: false,
          },
        ];
        const mockOrgs = [
          { id: 101, name: "Customer Corp" },
          { id: 102, name: "Principal Inc" },
        ];

        mockDataProvider.getList = vi.fn().mockResolvedValue({ data: mockParticipants, total: 2 });
        mockDataProvider.getMany = vi.fn().mockResolvedValue({ data: mockOrgs });

        const result = await service.getOpportunityParticipants(opportunityId);

        expect(mockDataProvider.getList).toHaveBeenCalledWith("opportunity_participants", {
          filter: { opportunity_id: opportunityId },
          pagination: { page: 1, perPage: 100 },
          sort: { field: "is_primary", order: "DESC" },
        });
        expect(result.data).toHaveLength(2);
        expect(result.data[0].organization.name).toBe("Customer Corp");
        expect(result.data[1].organization.name).toBe("Principal Inc");
      });

      test("should handle batch fetch failure gracefully", async () => {
        mockDataProvider.getList = vi.fn().mockResolvedValue({
          data: [{ id: 1, opportunity_id: 1, organization_id: 101 }],
          total: 1,
        });
        mockDataProvider.getMany = vi.fn().mockRejectedValue(new Error("Batch fetch failed"));

        await expect(service.getOpportunityParticipants(1)).rejects.toThrow(
          "Failed to fetch participant organizations: Batch fetch failed"
        );
      });
    });

    describe("addOpportunityParticipant", () => {
      test("should create participant with default role customer and is_primary false", async () => {
        const createdParticipant = {
          id: 1,
          opportunity_id: 1,
          organization_id: 101,
          role: "customer",
          is_primary: false,
        };

        mockDataProvider.create = vi.fn().mockResolvedValue({ data: createdParticipant });

        const result = await service.addOpportunityParticipant(1, 101);

        expect(mockDataProvider.create).toHaveBeenCalledWith(
          "opportunity_participants",
          expect.objectContaining({
            data: expect.objectContaining({
              opportunity_id: 1,
              organization_id: 101,
              role: "customer",
              is_primary: false,
            }),
          })
        );
        expect(result.data).toEqual(createdParticipant);
      });

      test("should accept role parameter (principal, distributor, competitor)", async () => {
        mockDataProvider.create = vi.fn().mockResolvedValue({
          data: { id: 1, role: "principal" },
        });

        await service.addOpportunityParticipant(1, 101, { role: "principal" });

        expect(mockDataProvider.create).toHaveBeenCalledWith(
          "opportunity_participants",
          expect.objectContaining({
            data: expect.objectContaining({
              role: "principal",
            }),
          })
        );
      });

      test("should accept notes parameter", async () => {
        mockDataProvider.create = vi.fn().mockResolvedValue({
          data: { id: 1, notes: "Primary distributor" },
        });

        await service.addOpportunityParticipant(1, 101, {
          notes: "Primary distributor",
        });

        expect(mockDataProvider.create).toHaveBeenCalledWith(
          "opportunity_participants",
          expect.objectContaining({
            data: expect.objectContaining({
              notes: "Primary distributor",
            }),
          })
        );
      });
    });

    describe("removeOpportunityParticipant", () => {
      test("should find and delete participant record", async () => {
        mockDataProvider.getList = vi.fn().mockResolvedValue({
          data: [{ id: 1, opportunity_id: 1, organization_id: 101 }],
          total: 1,
        });
        mockDataProvider.delete = vi.fn().mockResolvedValue({ data: { id: 1 } });

        const result = await service.removeOpportunityParticipant(1, 101);

        expect(mockDataProvider.delete).toHaveBeenCalledWith("opportunity_participants", { id: 1 });
        expect(result.data.id).toBe("1-101");
      });

      test("should be idempotent (no error if participant doesn't exist)", async () => {
        mockDataProvider.getList = vi.fn().mockResolvedValue({ data: [], total: 0 });
        mockDataProvider.delete = vi.fn();

        const result = await service.removeOpportunityParticipant(1, 101);

        expect(mockDataProvider.delete).not.toHaveBeenCalled();
        expect(result.data.id).toBe("1-101");
      });
    });
  });

  describe("Opportunity Contacts", () => {
    describe("getOpportunityContacts", () => {
      test("should fetch and populate contact details", async () => {
        const opportunityId = 1;
        const mockContacts = [
          {
            id: 1,
            opportunity_id: 1,
            contact_id: 201,
            role: "Decision Maker",
            is_primary: true,
          },
          {
            id: 2,
            opportunity_id: 1,
            contact_id: 202,
            role: "Influencer",
            is_primary: false,
          },
        ];
        const mockContactData = [
          { id: 201, first_name: "John", last_name: "Doe" },
          { id: 202, first_name: "Jane", last_name: "Smith" },
        ];

        mockDataProvider.getList = vi.fn().mockResolvedValue({ data: mockContacts, total: 2 });
        mockDataProvider.getMany = vi.fn().mockResolvedValue({ data: mockContactData });

        const result = await service.getOpportunityContacts(opportunityId);

        expect(mockDataProvider.getList).toHaveBeenCalledWith("opportunity_contacts", {
          filter: { opportunity_id: opportunityId },
          pagination: { page: 1, perPage: 100 },
          sort: { field: "is_primary", order: "DESC" },
        });
        expect(mockDataProvider.getMany).toHaveBeenCalledWith("contacts", {
          ids: [201, 202],
        });
        expect(result.data).toHaveLength(2);
        expect(result.data[0].contact.first_name).toBe("John");
      });
    });

    describe("addOpportunityContact", () => {
      test("should create contact association with default is_primary false", async () => {
        mockDataProvider.create = vi.fn().mockResolvedValue({
          data: { id: 1, opportunity_id: 1, contact_id: 201, is_primary: false },
        });

        await service.addOpportunityContact(1, 201);

        expect(mockDataProvider.create).toHaveBeenCalledWith(
          "opportunity_contacts",
          expect.objectContaining({
            data: expect.objectContaining({
              opportunity_id: 1,
              contact_id: 201,
              is_primary: false,
            }),
          })
        );
      });

      test("should accept role parameter", async () => {
        mockDataProvider.create = vi.fn().mockResolvedValue({
          data: { id: 1, role: "Decision Maker" },
        });

        await service.addOpportunityContact(1, 201, {
          role: "Decision Maker",
        });

        expect(mockDataProvider.create).toHaveBeenCalledWith(
          "opportunity_contacts",
          expect.objectContaining({
            data: expect.objectContaining({
              role: "Decision Maker",
            }),
          })
        );
      });
    });

    describe("removeOpportunityContact", () => {
      test("should find and delete contact association", async () => {
        mockDataProvider.getList = vi.fn().mockResolvedValue({
          data: [{ id: 1, opportunity_id: 1, contact_id: 201 }],
          total: 1,
        });
        mockDataProvider.delete = vi.fn().mockResolvedValue({ data: { id: 1 } });

        const result = await service.removeOpportunityContact(1, 201);

        expect(mockDataProvider.delete).toHaveBeenCalledWith("opportunity_contacts", { id: 1 });
        expect(result.data.id).toBe("1-201");
      });
    });

    describe("getOpportunityContactsViaJunction (explicit variant)", () => {
      test("should fetch and populate contacts using junction pattern", async () => {
        const mockJunctions = [
          { id: 1, opportunity_id: 1, contact_id: 201 },
          { id: 2, opportunity_id: 1, contact_id: 202 },
        ];
        const mockContacts = [
          { id: 201, first_name: "John" },
          { id: 202, first_name: "Jane" },
        ];

        mockDataProvider.getList = vi.fn().mockResolvedValue({ data: mockJunctions, total: 2 });
        mockDataProvider.getMany = vi.fn().mockResolvedValue({ data: mockContacts });

        const result = await service.getOpportunityContactsViaJunction(1);

        expect(result.data).toHaveLength(2);
        expect(result.data[0].contact).toEqual({ id: 201, first_name: "John" });
      });

      test("should return empty array if no junctions exist", async () => {
        mockDataProvider.getList = vi.fn().mockResolvedValue({ data: [], total: 0 });
        mockDataProvider.getMany = vi.fn();

        const result = await service.getOpportunityContactsViaJunction(1);

        expect(result.data).toEqual([]);
        expect(mockDataProvider.getMany).not.toHaveBeenCalled();
      });
    });

    describe("addOpportunityContactViaJunction", () => {
      test("should create junction with metadata", async () => {
        mockDataProvider.create = vi.fn().mockResolvedValue({
          data: {
            id: 1,
            opportunity_id: 1,
            contact_id: 201,
            role: "Champion",
            is_primary: true,
          },
        });

        await service.addOpportunityContactViaJunction(1, 201, {
          role: "Champion",
          is_primary: true,
        });

        expect(mockDataProvider.create).toHaveBeenCalledWith(
          "opportunity_contacts",
          expect.objectContaining({
            data: expect.objectContaining({
              role: "Champion",
              is_primary: true,
            }),
          })
        );
      });

      test("should default is_primary to false if not specified", async () => {
        mockDataProvider.create = vi.fn().mockResolvedValue({
          data: { id: 1, is_primary: false },
        });

        await service.addOpportunityContactViaJunction(1, 201);

        expect(mockDataProvider.create).toHaveBeenCalledWith(
          "opportunity_contacts",
          expect.objectContaining({
            data: expect.objectContaining({
              is_primary: false,
            }),
          })
        );
      });
    });

    describe("removeOpportunityContactViaJunctionId", () => {
      test("should delete junction record by ID", async () => {
        mockDataProvider.delete = vi.fn().mockResolvedValue({ data: { id: 1 } });

        const result = await service.removeOpportunityContactViaJunctionId(1);

        expect(mockDataProvider.delete).toHaveBeenCalledWith("opportunity_contacts", { id: 1 });
        expect(result.data.id).toBe(1);
      });

      test("should throw on delete error", async () => {
        mockDataProvider.delete = vi.fn().mockRejectedValue(new Error("Record not found"));

        await expect(service.removeOpportunityContactViaJunctionId(999)).rejects.toThrow(
          "Remove opportunity contact via junction ID failed:"
        );
      });
    });

    describe("updateOpportunityContactMetadata", () => {
      test("should fetch current record and update metadata", async () => {
        const currentRecord = {
          id: 1,
          opportunity_id: 1,
          contact_id: 201,
          role: "Influencer",
          is_primary: false,
        };

        mockDataProvider.getOne = vi.fn().mockResolvedValue({ data: currentRecord });
        mockDataProvider.update = vi.fn().mockResolvedValue({
          data: { ...currentRecord, role: "Decision Maker", is_primary: true },
        });

        await service.updateOpportunityContactMetadata(1, {
          role: "Decision Maker",
          is_primary: true,
        });

        expect(mockDataProvider.getOne).toHaveBeenCalledWith("opportunity_contacts", { id: 1 });
        expect(mockDataProvider.update).toHaveBeenCalledWith("opportunity_contacts", {
          id: 1,
          data: { role: "Decision Maker", is_primary: true },
          previousData: currentRecord,
        });
      });

      test("should support partial updates", async () => {
        mockDataProvider.getOne = vi.fn().mockResolvedValue({
          data: { id: 1, role: "Influencer", is_primary: false },
        });
        mockDataProvider.update = vi.fn().mockResolvedValue({
          data: { id: 1, role: "Influencer", is_primary: true },
        });

        await service.updateOpportunityContactMetadata(1, {
          is_primary: true,
        });

        expect(mockDataProvider.update).toHaveBeenCalledWith(
          "opportunity_contacts",
          expect.objectContaining({
            data: { is_primary: true },
          })
        );
      });

      test("should throw if record doesn't exist", async () => {
        mockDataProvider.getOne = vi.fn().mockRejectedValue(new Error("Record not found"));

        await expect(
          service.updateOpportunityContactMetadata(999, { is_primary: true })
        ).rejects.toThrow("Update opportunity contact metadata failed:");
      });
    });
  });
});
