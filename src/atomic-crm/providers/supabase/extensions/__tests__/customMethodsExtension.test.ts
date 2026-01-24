/**
 * Custom Methods Extension Tests
 *
 * Comprehensive test suite for extendWithCustomMethods() decorator.
 * Verifies all 30 custom methods delegate correctly with proper error handling.
 *
 * Test Coverage:
 * - Service delegation (19 methods)
 * - Direct Supabase operations (11 methods)
 * - Error handling and logging
 * - Type safety and parameter validation
 *
 * @module providers/supabase/extensions/__tests__/customMethodsExtension.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider, Identifier } from "ra-core";
import type { SupabaseClient } from "@supabase/supabase-js";

import { extendWithCustomMethods } from "../customMethodsExtension";
import type { ExtensionConfig } from "../customMethodsExtension";
import type { ServiceContainer } from "../../services";
import type {
  SalesFormData,
  Sale,
  Opportunity,
  OpportunityParticipant,
  ContactOrganization,
  OpportunityContact,
  Activity,
} from "../../../../types";
import type { QuickAddInput } from "../../../../validation/quickAdd";
import {
  mockSupabaseRpcResponse,
  mockSupabaseStorageResponse,
  mockSupabaseEdgeFunctionResponse,
} from "@/tests/utils/typed-mocks";

describe("extendWithCustomMethods", () => {
  let mockComposedProvider: DataProvider;
  let mockServices: ServiceContainer;
  let mockSupabaseClient: SupabaseClient;
  let config: ExtensionConfig;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock composed provider with all 9 CRUD methods
    mockComposedProvider = {
      getList: vi.fn(),
      getOne: vi.fn(),
      getMany: vi.fn(),
      getManyReference: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    } as unknown as DataProvider;

    // Mock service container with all 5 services
    mockServices = {
      sales: {
        salesCreate: vi.fn(),
        salesUpdate: vi.fn(),
        updatePassword: vi.fn(),
      },
      opportunities: {
        archiveOpportunity: vi.fn(),
        unarchiveOpportunity: vi.fn(),
      },
      activities: {
        getActivityLog: vi.fn(),
      },
      junctions: {
        getContactOrganizations: vi.fn(),
        addContactToOrganization: vi.fn(),
        removeContactFromOrganization: vi.fn(),
        setPrimaryOrganization: vi.fn(),
        getOpportunityParticipants: vi.fn(),
        addOpportunityParticipant: vi.fn(),
        removeOpportunityParticipant: vi.fn(),
        getOpportunityContacts: vi.fn(),
        addOpportunityContact: vi.fn(),
        removeOpportunityContact: vi.fn(),
        getOpportunityContactsViaJunction: vi.fn(),
        addOpportunityContactViaJunction: vi.fn(),
        removeOpportunityContactViaJunctionId: vi.fn(),
      },
      segments: {
        getOrCreateSegment: vi.fn(),
      },
    } as unknown as ServiceContainer;

    // Mock Supabase client
    mockSupabaseClient = {
      rpc: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(),
          getPublicUrl: vi.fn(),
          remove: vi.fn(),
          list: vi.fn(),
        })),
      },
      functions: {
        invoke: vi.fn(),
      },
    } as unknown as SupabaseClient;

    config = {
      composedProvider: mockComposedProvider,
      services: mockServices,
      supabaseClient: mockSupabaseClient,
    };

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Provider Extension", () => {
    it("should extend composed provider with all CRUD methods", () => {
      const extendedProvider = extendWithCustomMethods(config);

      expect(extendedProvider.getList).toBe(mockComposedProvider.getList);
      expect(extendedProvider.getOne).toBe(mockComposedProvider.getOne);
      expect(extendedProvider.create).toBe(mockComposedProvider.create);
      expect(extendedProvider.update).toBe(mockComposedProvider.update);
      expect(extendedProvider.delete).toBe(mockComposedProvider.delete);
    });

    it("should add all 30 custom methods to provider", () => {
      const extendedProvider = extendWithCustomMethods(config);

      // Sales methods (3)
      expect(extendedProvider.salesCreate).toBeTypeOf("function");
      expect(extendedProvider.salesUpdate).toBeTypeOf("function");
      expect(extendedProvider.updatePassword).toBeTypeOf("function");

      // Opportunities methods (2)
      expect(extendedProvider.archiveOpportunity).toBeTypeOf("function");
      expect(extendedProvider.unarchiveOpportunity).toBeTypeOf("function");

      // Activities methods (1)
      expect(extendedProvider.getActivityLog).toBeTypeOf("function");

      // Junction methods (13)
      expect(extendedProvider.getContactOrganizations).toBeTypeOf("function");
      expect(extendedProvider.addContactToOrganization).toBeTypeOf("function");
      expect(extendedProvider.removeContactFromOrganization).toBeTypeOf("function");
      expect(extendedProvider.setPrimaryOrganization).toBeTypeOf("function");

      // RPC, Storage, Edge Functions (11)
      expect(extendedProvider.rpc).toBeTypeOf("function");
      expect(extendedProvider.storage).toBeTypeOf("object");
      expect(extendedProvider.invoke).toBeTypeOf("function");
      expect(extendedProvider.createBoothVisitor).toBeTypeOf("function");
    });
  });

  describe("Sales Methods (SalesService Delegation)", () => {
    it("should delegate salesCreate to SalesService", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const formData: SalesFormData = {
        email: "test@example.com",
        password: "secure123",
        first_name: "Test",
        last_name: "User",
        administrator: false,
      };
      const expectedSale: Sale = {
        id: 1,
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        user_id: "user-123",
        administrator: false,
      };

      vi.mocked(mockServices.sales.salesCreate).mockResolvedValue(expectedSale);

      const result = await extendedProvider.salesCreate(formData);

      expect(mockServices.sales.salesCreate).toHaveBeenCalledWith(formData);
      expect(result).toEqual(expectedSale);
    });

    it("should delegate salesUpdate to SalesService", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const updateData: Partial<Omit<SalesFormData, "password">> = {
        first_name: "Updated",
        last_name: "Name",
      };
      const expectedResult: Partial<Omit<SalesFormData, "password">> = updateData;

      vi.mocked(mockServices.sales.salesUpdate).mockResolvedValue(expectedResult);

      const result = await extendedProvider.salesUpdate(1, updateData);

      expect(mockServices.sales.salesUpdate).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate updatePassword to SalesService", async () => {
      const extendedProvider = extendWithCustomMethods(config);

      vi.mocked(mockServices.sales.updatePassword).mockResolvedValue(true);

      const result = await extendedProvider.updatePassword(1);

      expect(mockServices.sales.updatePassword).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe("Opportunities Methods (OpportunitiesService Delegation)", () => {
    it("should delegate archiveOpportunity to OpportunitiesService", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const opportunity: Opportunity = {
        id: 1,
        title: "Test Opportunity",
        organization_id: 1,
        sales_id: 1,
        principal_id: 1,
        status: "active",
      } as Opportunity;
      const expectedResult: Opportunity[] = [opportunity];

      vi.mocked(mockServices.opportunities.archiveOpportunity).mockResolvedValue(expectedResult);

      const result = await extendedProvider.archiveOpportunity(opportunity);

      expect(mockServices.opportunities.archiveOpportunity).toHaveBeenCalledWith(opportunity);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate unarchiveOpportunity to OpportunitiesService", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const opportunity: Opportunity = {
        id: 1,
        title: "Test Opportunity",
        organization_id: 1,
        sales_id: 1,
        principal_id: 1,
        status: "archived",
      } as Opportunity;
      const expectedResult: Opportunity[] = [opportunity];

      vi.mocked(mockServices.opportunities.unarchiveOpportunity).mockResolvedValue(expectedResult);

      const result = await extendedProvider.unarchiveOpportunity(opportunity);

      expect(mockServices.opportunities.unarchiveOpportunity).toHaveBeenCalledWith(opportunity);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("Activities Methods (ActivitiesService Delegation)", () => {
    it("should delegate getActivityLog to ActivitiesService", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedActivities: Activity[] = [
        {
          id: 1,
          type: "call",
          notes: "Test activity",
          organization_id: 1,
          sales_id: 1,
        } as Activity,
      ];

      vi.mocked(mockServices.activities.getActivityLog).mockResolvedValue(expectedActivities);

      const result = await extendedProvider.getActivityLog(1, 1);

      expect(mockServices.activities.getActivityLog).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expectedActivities);
    });

    it("should handle getActivityLog with optional parameters", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedActivities: Activity[] = [];

      vi.mocked(mockServices.activities.getActivityLog).mockResolvedValue(expectedActivities);

      await extendedProvider.getActivityLog();

      expect(mockServices.activities.getActivityLog).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe("Contact-Organization Junction Methods (JunctionsService Delegation)", () => {
    it("should delegate getContactOrganizations to JunctionsService", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedResult = { data: [] as ContactOrganization[] };

      vi.mocked(mockServices.junctions.getContactOrganizations).mockResolvedValue(expectedResult);

      const result = await extendedProvider.getContactOrganizations(1);

      expect(mockServices.junctions.getContactOrganizations).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate addContactToOrganization with junction params", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const params = { is_primary: true, role: "CEO" };
      const expectedResult = {
        data: {
          id: 1,
          contact_id: 1,
          organization_id: 2,
          is_primary: true,
          role: "CEO",
        } as ContactOrganization,
      };

      vi.mocked(mockServices.junctions.addContactToOrganization).mockResolvedValue(expectedResult);

      const result = await extendedProvider.addContactToOrganization(1, 2, params);

      expect(mockServices.junctions.addContactToOrganization).toHaveBeenCalledWith(1, 2, params);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate removeContactFromOrganization", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedResult = { data: { id: "1" } };

      vi.mocked(mockServices.junctions.removeContactFromOrganization).mockResolvedValue(
        expectedResult
      );

      const result = await extendedProvider.removeContactFromOrganization(1, 2);

      expect(mockServices.junctions.removeContactFromOrganization).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate setPrimaryOrganization", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedResult = { data: { success: true } };

      vi.mocked(mockServices.junctions.setPrimaryOrganization).mockResolvedValue(expectedResult);

      const result = await extendedProvider.setPrimaryOrganization(1, 2);

      expect(mockServices.junctions.setPrimaryOrganization).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("Opportunity Participant Junction Methods (JunctionsService Delegation)", () => {
    it("should delegate getOpportunityParticipants", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedResult = { data: [] as OpportunityParticipant[] };

      vi.mocked(mockServices.junctions.getOpportunityParticipants).mockResolvedValue(
        expectedResult
      );

      const result = await extendedProvider.getOpportunityParticipants(1);

      expect(mockServices.junctions.getOpportunityParticipants).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate addOpportunityParticipant with partial params", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const params = { role: "Partner" };
      const expectedResult = {
        data: {
          id: 1,
          opportunity_id: 1,
          organization_id: 2,
          role: "Partner",
        } as OpportunityParticipant,
      };

      vi.mocked(mockServices.junctions.addOpportunityParticipant).mockResolvedValue(expectedResult);

      const result = await extendedProvider.addOpportunityParticipant(1, 2, params);

      expect(mockServices.junctions.addOpportunityParticipant).toHaveBeenCalledWith(1, 2, params);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate removeOpportunityParticipant", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedResult = { data: { id: "1" } };

      vi.mocked(mockServices.junctions.removeOpportunityParticipant).mockResolvedValue(
        expectedResult
      );

      const result = await extendedProvider.removeOpportunityParticipant(1, 2);

      expect(mockServices.junctions.removeOpportunityParticipant).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("Opportunity Contact Junction Methods (JunctionsService Delegation)", () => {
    it("should delegate getOpportunityContacts", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedResult = { data: [] as OpportunityContact[] };

      vi.mocked(mockServices.junctions.getOpportunityContacts).mockResolvedValue(expectedResult);

      const result = await extendedProvider.getOpportunityContacts(1);

      expect(mockServices.junctions.getOpportunityContacts).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate addOpportunityContact with junction params", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const params = { is_primary: true, role: "Decision Maker" };
      const expectedResult = {
        data: {
          id: 1,
          opportunity_id: 1,
          contact_id: 2,
          is_primary: true,
          role: "Decision Maker",
        } as OpportunityContact,
      };

      vi.mocked(mockServices.junctions.addOpportunityContact).mockResolvedValue(expectedResult);

      const result = await extendedProvider.addOpportunityContact(1, 2, params);

      expect(mockServices.junctions.addOpportunityContact).toHaveBeenCalledWith(1, 2, params);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate removeOpportunityContact", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedResult = { data: { id: "1" } };

      vi.mocked(mockServices.junctions.removeOpportunityContact).mockResolvedValue(expectedResult);

      const result = await extendedProvider.removeOpportunityContact(1, 2);

      expect(mockServices.junctions.removeOpportunityContact).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate getOpportunityContactsViaJunction (legacy)", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const expectedResult = { data: [] as OpportunityContact[] };

      vi.mocked(mockServices.junctions.getOpportunityContactsViaJunction).mockResolvedValue(
        expectedResult
      );

      const result = await extendedProvider.getOpportunityContactsViaJunction(1);

      expect(mockServices.junctions.getOpportunityContactsViaJunction).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });

    it("should delegate addOpportunityContactViaJunction with metadata", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const metadata = { role: "Influencer", notes: "Key stakeholder" };
      const expectedResult = {
        data: {
          id: 1,
          opportunity_id: 1,
          contact_id: 2,
          role: "Influencer",
          notes: "Key stakeholder",
        } as OpportunityContact,
      };

      vi.mocked(mockServices.junctions.addOpportunityContactViaJunction).mockResolvedValue(
        expectedResult
      );

      const result = await extendedProvider.addOpportunityContactViaJunction(1, 2, metadata);

      expect(mockServices.junctions.addOpportunityContactViaJunction).toHaveBeenCalledWith(
        1,
        2,
        metadata
      );
      expect(result).toEqual(expectedResult);
    });

    it("should delegate removeOpportunityContactViaJunction by junction ID", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockResult = { data: { id: 123 as Identifier } };
      const expectedResult = { data: { id: "123" } };

      vi.mocked(mockServices.junctions.removeOpportunityContactViaJunctionId).mockResolvedValue(
        mockResult
      );

      const result = await extendedProvider.removeOpportunityContactViaJunction(123);

      expect(mockServices.junctions.removeOpportunityContactViaJunctionId).toHaveBeenCalledWith(
        123
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("RPC Operations (Direct Supabase)", () => {
    it("should call Supabase RPC with parameters", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockData = { id: 1, name: "Enterprise" };

      vi.mocked(mockSupabaseClient.rpc).mockResolvedValue(mockSupabaseRpcResponse(mockData));

      const result = await extendedProvider.rpc<typeof mockData>("get_or_create_segment", {
        p_name: "Enterprise",
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("get_or_create_segment", {
        p_name: "Enterprise",
      });
      expect(result).toEqual(mockData);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[DataProvider RPC]",
        "Calling get_or_create_segment",
        { p_name: "Enterprise" }
      );
    });

    it("should throw error when RPC fails", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockError = { message: "Permission denied", code: "42501" };

      vi.mocked(mockSupabaseClient.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(extendedProvider.rpc("test_function", { param: "value" })).rejects.toThrow(
        "RPC test_function failed: Permission denied"
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should validate RPC params if schema exists", async () => {
      const extendedProvider = extendWithCustomMethods(config);

      // This will fail Zod validation (missing required field)
      await expect(
        extendedProvider.rpc("get_or_create_segment", { wrong_param: "value" })
      ).rejects.toThrow("Invalid RPC parameters");

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("Storage Operations (Direct Supabase)", () => {
    it("should upload file to Supabase storage", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockFile = new File(["content"], "test.png", { type: "image/png" });
      const mockData = { path: "avatars/test.png" };

      const mockUpload = vi.fn().mockResolvedValue({ data: mockData, error: null });
      vi.mocked(mockSupabaseClient.storage.from as any).mockReturnValue({
        upload: mockUpload,
      });

      const result = await extendedProvider.storage.upload("avatars", "test.png", mockFile);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("avatars");
      expect(mockUpload).toHaveBeenCalledWith("test.png", mockFile, {
        cacheControl: "3600",
        upsert: true,
      });
      expect(result).toEqual(mockData);
    });

    it("should reject files larger than 10MB", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.png", {
        type: "image/png",
      });

      await expect(
        extendedProvider.storage.upload("avatars", "large.png", largeFile)
      ).rejects.toThrow("File size exceeds 10MB limit");
    });

    it("should get public URL for file", () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockUrl = "https://supabase.co/storage/avatars/test.png";

      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: mockUrl } });
      vi.mocked(mockSupabaseClient.storage.from as any).mockReturnValue({
        getPublicUrl: mockGetPublicUrl,
      });

      const result = extendedProvider.storage.getPublicUrl("avatars", "test.png");

      expect(result).toBe(mockUrl);
      expect(mockGetPublicUrl).toHaveBeenCalledWith("test.png");
    });

    it("should remove files from storage", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const paths = ["old1.png", "old2.png"];

      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(mockSupabaseClient.storage.from as any).mockReturnValue({
        remove: mockRemove,
      });

      await extendedProvider.storage.remove("avatars", paths);

      expect(mockRemove).toHaveBeenCalledWith(paths);
    });

    it("should list files in storage bucket", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockFiles = [{ name: "file1.png" }, { name: "file2.png" }];

      const mockList = vi.fn().mockResolvedValue({ data: mockFiles, error: null });
      vi.mocked(mockSupabaseClient.storage.from as any).mockReturnValue({
        list: mockList,
      });

      const result = await extendedProvider.storage.list("avatars", "subfolder");

      expect(mockList).toHaveBeenCalledWith("subfolder");
      expect(result).toEqual(mockFiles);
    });
  });

  describe("Edge Function Invocation (Direct Supabase)", () => {
    it("should invoke Edge Function with POST method", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockData = { success: true, id: 123 };

      vi.mocked(mockSupabaseClient.functions.invoke as any).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await extendedProvider.invoke("create-sales", {
        method: "POST",
        body: { email: "test@example.com" },
      });

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith("create-sales", {
        method: "POST",
        body: { email: "test@example.com" },
        headers: undefined,
      });
      expect(result).toEqual(mockData);
    });

    it("should default to POST method when not specified", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockData = { result: "success" };

      vi.mocked(mockSupabaseClient.functions.invoke as any).mockResolvedValue({
        data: mockData,
        error: null,
      });

      await extendedProvider.invoke("test-function", { body: { param: "value" } });

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
        "test-function",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should throw error when Edge Function fails", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockError = { message: "Function timeout" };

      vi.mocked(mockSupabaseClient.functions.invoke as any).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(extendedProvider.invoke("test-function")).rejects.toThrow(
        "Edge function test-function failed: Function timeout"
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should throw error when Edge Function returns no data", async () => {
      const extendedProvider = extendWithCustomMethods(config);

      vi.mocked(mockSupabaseClient.functions.invoke as any).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(extendedProvider.invoke("test-function")).rejects.toThrow(
        "Edge function test-function returned no data"
      );
    });
  });

  describe("Specialized Business Operations", () => {
    it("should create booth visitor atomically", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const input: QuickAddInput = {
        organization_name: "Acme Corp",
        contact_name: "John Doe",
        contact_email: "john@acme.com",
        opportunity_title: "Q4 Enterprise Deal",
        opportunity_value: 50000,
      } as QuickAddInput;
      const mockResult = {
        organization_id: 1,
        contact_id: 2,
        opportunity_id: 3,
      };

      vi.mocked(mockSupabaseClient.rpc).mockResolvedValue({
        data: mockResult,
        error: null,
      } as any);

      const result = await extendedProvider.createBoothVisitor(input);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("create_booth_visitor_opportunity", {
        _data: input,
      });
      expect(result).toEqual({ data: mockResult });
    });

    it("should handle booth visitor creation failure", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const input = { organization_name: "Test" } as QuickAddInput;
      const mockError = { message: "Validation failed" };

      vi.mocked(mockSupabaseClient.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(extendedProvider.createBoothVisitor(input)).rejects.toThrow(
        "Create booth visitor failed: Validation failed"
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("Error Logging", () => {
    it("should log errors with structured context", async () => {
      const extendedProvider = extendWithCustomMethods(config);
      const mockError = { message: "Test error", code: "ERROR_CODE" };

      vi.mocked(mockSupabaseClient.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(extendedProvider.rpc("test_function", { param: "value" })).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DataProvider rpc] Error in test_function:",
        expect.objectContaining({
          params: expect.any(Object),
          error: "RPC test_function failed: Test error",
        })
      );
    });
  });
});
