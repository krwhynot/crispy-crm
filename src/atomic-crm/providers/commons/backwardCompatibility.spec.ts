import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider } from "ra-core";
import type { Deal, Opportunity } from "../../types";
import {
  transformOpportunityToDeal,
  transformDealToOpportunity,
  withBackwardCompatibility,
  handleDealUrlRedirect,
  getDeprecationLogs,
  clearDeprecationLogs,
  getGracePeriodInfo,
} from "./backwardCompatibility";

// Mock console methods
const originalConsoleWarn = console.warn;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

describe("backwardCompatibility", () => {
  beforeEach(() => {
    clearDeprecationLogs();
    console.warn = vi.fn();
    console.group = vi.fn();
    console.groupEnd = vi.fn();
    // Mock Date to be within grace period
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-25')); // Within grace period
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.group = originalConsoleGroup;
    console.groupEnd = originalConsoleGroupEnd;
    vi.useRealTimers();
  });

  describe("transformOpportunityToDeal", () => {
    it("should transform opportunity to deal format", () => {
      const opportunity: Opportunity = {
        id: "opp-1",
        name: "Test Opportunity",
        customer_organization_id: "org-1",
        company_id: "org-1",
        contact_ids: ["contact-1", "contact-2"],
        category: "New Business",
        stage: "qualified",
        status: "active",
        priority: "high",
        description: "Test description",
        amount: 50000,
        probability: 75,
        estimated_close_date: "2025-03-01",
        expected_closing_date: "2025-03-01",
        created_at: "2025-01-01",
        updated_at: "2025-01-15",
        deleted_at: null,
        archived_at: null,
        sales_id: "sales-1",
        index: 1,
        stage_manual: false,
        status_manual: false,
      };

      const deal = transformOpportunityToDeal(opportunity);

      expect(deal).toMatchObject({
        id: "opp-1",
        name: "Test Opportunity",
        company_id: "org-1",
        contact_ids: ["contact-1", "contact-2"],
        category: "New Business",
        stage: "qualified",
        description: "Test description",
        amount: 50000,
        expected_closing_date: "2025-03-01",
        created_at: "2025-01-01",
        updated_at: "2025-01-15",
        archived_at: null,
        sales_id: "sales-1",
        index: 1,
      });
    });

    it("should handle null customer_organization_id by falling back to company_id", () => {
      const opportunity: Opportunity = {
        id: "opp-1",
        name: "Test Opportunity",
        customer_organization_id: null as any,
        company_id: "org-1",
        contact_ids: [],
        stage: "lead",
        status: "active",
        priority: "medium",
        amount: 0,
        probability: 10,
        created_at: "2025-01-01",
        updated_at: "2025-01-15",
        sales_id: "sales-1",
        stage_manual: false,
        status_manual: false,
      };

      const deal = transformOpportunityToDeal(opportunity);
      expect(deal.company_id).toBe("org-1");
    });

    it("should map deleted_at to archived_at", () => {
      const opportunity: Opportunity = {
        id: "opp-1",
        name: "Test Opportunity",
        customer_organization_id: "org-1",
        stage: "closed_lost",
        status: "lost",
        priority: "low",
        amount: 0,
        probability: 0,
        deleted_at: "2025-01-20",
        archived_at: "2025-01-20",
        created_at: "2025-01-01",
        updated_at: "2025-01-15",
        sales_id: "sales-1",
        stage_manual: false,
        status_manual: false,
      };

      const deal = transformOpportunityToDeal(opportunity);
      expect(deal.archived_at).toBe("2025-01-20");
    });
  });

  describe("transformDealToOpportunity", () => {
    it("should transform deal to opportunity format", () => {
      const deal: Deal = {
        id: "deal-1",
        name: "Test Deal",
        company_id: "org-1",
        contact_ids: ["contact-1", "contact-2"],
        category: "New Business",
        stage: "qualified",
        description: "Test description",
        amount: 50000,
        expected_closing_date: "2025-03-01",
        created_at: "2025-01-01",
        updated_at: "2025-01-15",
        archived_at: null,
        sales_id: "sales-1",
        index: 1,
      };

      const opportunity = transformDealToOpportunity(deal);

      expect(opportunity).toMatchObject({
        id: "deal-1",
        name: "Test Deal",
        customer_organization_id: "org-1",
        company_id: "org-1",
        contact_ids: ["contact-1", "contact-2"],
        category: "New Business",
        stage: "qualified",
        status: "active",
        priority: "medium",
        description: "Test description",
        amount: 50000,
        probability: 25,
        estimated_close_date: "2025-03-01",
        expected_closing_date: "2025-03-01",
        created_at: "2025-01-01",
        updated_at: "2025-01-15",
        deleted_at: null,
        archived_at: null,
        sales_id: "sales-1",
        index: 1,
        stage_manual: false,
        status_manual: false,
      });
    });

    it("should set correct probability based on stage", () => {
      const stages = [
        { stage: "lead", expectedProbability: 10 },
        { stage: "qualified", expectedProbability: 25 },
        { stage: "needs_analysis", expectedProbability: 40 },
        { stage: "proposal", expectedProbability: 60 },
        { stage: "negotiation", expectedProbability: 80 },
        { stage: "closed_won", expectedProbability: 100 },
        { stage: "closed_lost", expectedProbability: 0 },
        { stage: "nurturing", expectedProbability: 15 },
        { stage: "unknown", expectedProbability: 0 },
      ];

      stages.forEach(({ stage, expectedProbability }) => {
        const deal: Deal = {
          id: "deal-1",
          name: "Test Deal",
          company_id: "org-1",
          stage,
          amount: 0,
          created_at: "2025-01-01",
          updated_at: "2025-01-15",
          sales_id: "sales-1",
        };

        const opportunity = transformDealToOpportunity(deal);
        expect(opportunity.probability).toBe(expectedProbability);
      });
    });

    it("should handle missing optional fields", () => {
      const deal: Deal = {
        id: "deal-1",
        name: "Test Deal",
        company_id: "org-1",
        stage: "lead",
        amount: 0,
        created_at: "2025-01-01",
        updated_at: "2025-01-15",
        sales_id: "sales-1",
      };

      const opportunity = transformDealToOpportunity(deal);

      expect(opportunity.contact_ids).toEqual([]);
      expect(opportunity.description).toBe("");
      expect(opportunity.index).toBe(0);
    });
  });

  describe("withBackwardCompatibility", () => {
    let mockDataProvider: DataProvider;

    beforeEach(() => {
      mockDataProvider = {
        getList: vi.fn(),
        getOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        getMany: vi.fn(),
        getManyReference: vi.fn(),
        updateMany: vi.fn(),
      };
    });

    describe("getList", () => {
      it("should forward deals requests to opportunities endpoint", async () => {
        const opportunitiesData = [
          {
            id: "opp-1",
            name: "Test Opportunity",
            customer_organization_id: "org-1",
            stage: "qualified",
            status: "active",
            priority: "high",
            amount: 50000,
            probability: 75,
            created_at: "2025-01-01",
            updated_at: "2025-01-15",
            sales_id: "sales-1",
            stage_manual: false,
            status_manual: false,
          },
        ];

        (mockDataProvider.getList as any).mockResolvedValue({
          data: opportunitiesData,
          total: 1,
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        const result = await compatibleProvider.getList("deals", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "created_at", order: "DESC" },
          filter: {},
        });

        expect(mockDataProvider.getList).toHaveBeenCalledWith("opportunities", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "created_at", order: "DESC" },
          filter: {},
        });

        expect(result.data[0]).toMatchObject({
          id: "opp-1",
          name: "Test Opportunity",
          company_id: "org-1",
          stage: "qualified",
          amount: 50000,
        });
      });

      it("should log deprecation warning for deals endpoint", async () => {
        (mockDataProvider.getList as any).mockResolvedValue({
          data: [],
          total: 0,
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        await compatibleProvider.getList("deals", {
          pagination: { page: 1, perPage: 10 },
        });

        const logs = getDeprecationLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].endpoint).toBe("/deals");
        expect(logs[0].method).toBe("getList");
      });

      it("should pass through non-deals resources unchanged", async () => {
        const contactsData = [
          { id: "contact-1", name: "John Doe" },
        ];

        (mockDataProvider.getList as any).mockResolvedValue({
          data: contactsData,
          total: 1,
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        const result = await compatibleProvider.getList("contacts", {
          pagination: { page: 1, perPage: 10 },
        });

        expect(mockDataProvider.getList).toHaveBeenCalledWith("contacts", {
          pagination: { page: 1, perPage: 10 },
        });

        expect(result.data).toEqual(contactsData);
      });
    });

    describe("getOne", () => {
      it("should forward deals requests to opportunities endpoint", async () => {
        const opportunityData = {
          id: "opp-1",
          name: "Test Opportunity",
          customer_organization_id: "org-1",
          stage: "qualified",
          status: "active",
          priority: "high",
          amount: 50000,
          probability: 75,
          created_at: "2025-01-01",
          updated_at: "2025-01-15",
          sales_id: "sales-1",
          stage_manual: false,
          status_manual: false,
        };

        (mockDataProvider.getOne as any).mockResolvedValue({
          data: opportunityData,
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        const result = await compatibleProvider.getOne("deals", { id: "opp-1" });

        expect(mockDataProvider.getOne).toHaveBeenCalledWith("opportunities", {
          id: "opp-1",
        });

        expect(result.data).toMatchObject({
          id: "opp-1",
          name: "Test Opportunity",
          company_id: "org-1",
          stage: "qualified",
          amount: 50000,
        });
      });
    });

    describe("create", () => {
      it("should transform deal data and forward to opportunities endpoint", async () => {
        const dealData = {
          name: "New Deal",
          company_id: "org-1",
          stage: "lead",
          amount: 10000,
        };

        const createdOpportunity = {
          id: "opp-new",
          name: "New Deal",
          customer_organization_id: "org-1",
          stage: "lead",
          status: "active",
          priority: "medium",
          amount: 10000,
          probability: 10,
          created_at: "2025-01-22",
          updated_at: "2025-01-22",
          sales_id: "sales-1",
          stage_manual: false,
          status_manual: false,
        };

        (mockDataProvider.create as any).mockResolvedValue({
          data: createdOpportunity,
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        const result = await compatibleProvider.create("deals", {
          data: dealData,
        });

        expect(mockDataProvider.create).toHaveBeenCalledWith(
          "opportunities",
          expect.objectContaining({
            data: expect.objectContaining({
              name: "New Deal",
              customer_organization_id: "org-1",
              stage: "lead",
              amount: 10000,
              probability: 10,
            }),
          })
        );

        expect(result.data).toMatchObject({
          id: "opp-new",
          name: "New Deal",
          company_id: "org-1",
          stage: "lead",
          amount: 10000,
        });
      });
    });

    describe("update", () => {
      it("should transform deal data and forward to opportunities endpoint", async () => {
        const dealData = {
          id: "deal-1",
          name: "Updated Deal",
          company_id: "org-1",
          stage: "proposal",
          amount: 75000,
        };

        const updatedOpportunity = {
          id: "deal-1",
          name: "Updated Deal",
          customer_organization_id: "org-1",
          stage: "proposal",
          status: "active",
          priority: "medium",
          amount: 75000,
          probability: 60,
          created_at: "2025-01-01",
          updated_at: "2025-01-22",
          sales_id: "sales-1",
          stage_manual: false,
          status_manual: false,
        };

        (mockDataProvider.update as any).mockResolvedValue({
          data: updatedOpportunity,
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        const result = await compatibleProvider.update("deals", {
          id: "deal-1",
          data: dealData,
          previousData: dealData,
        });

        expect(mockDataProvider.update).toHaveBeenCalledWith(
          "opportunities",
          expect.objectContaining({
            id: "deal-1",
            data: expect.objectContaining({
              name: "Updated Deal",
              customer_organization_id: "org-1",
              stage: "proposal",
              amount: 75000,
              probability: 60,
            }),
          })
        );

        expect(result.data).toMatchObject({
          id: "deal-1",
          name: "Updated Deal",
          company_id: "org-1",
          stage: "proposal",
          amount: 75000,
        });
      });
    });

    describe("delete", () => {
      it("should forward deals delete requests to opportunities endpoint", async () => {
        (mockDataProvider.delete as any).mockResolvedValue({
          data: { id: "deal-1" },
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        await compatibleProvider.delete("deals", { id: "deal-1" });

        expect(mockDataProvider.delete).toHaveBeenCalledWith("opportunities", {
          id: "deal-1",
        });
      });

      it("should log deprecation warning for delete", async () => {
        (mockDataProvider.delete as any).mockResolvedValue({
          data: { id: "deal-1" },
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        await compatibleProvider.delete("deals", { id: "deal-1" });

        const logs = getDeprecationLogs();
        expect(logs.length).toBe(1);
        expect(logs[0].method).toBe("delete");
      });
    });

    describe("deleteMany", () => {
      it("should forward deals deleteMany requests to opportunities endpoint", async () => {
        (mockDataProvider.deleteMany as any).mockResolvedValue({
          data: ["deal-1", "deal-2"],
        });

        const compatibleProvider = withBackwardCompatibility(mockDataProvider);
        await compatibleProvider.deleteMany("deals", {
          ids: ["deal-1", "deal-2"],
        });

        expect(mockDataProvider.deleteMany).toHaveBeenCalledWith(
          "opportunities",
          { ids: ["deal-1", "deal-2"] }
        );
      });
    });
  });

  describe("handleDealUrlRedirect", () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        pathname: "/deals/123",
        search: "?filter=active",
        hash: "#section",
        origin: "http://localhost:3000",
      };
      (window as any).history = {
        replaceState: vi.fn(),
      };
    });

    afterEach(() => {
      (window as any).location = originalLocation;
    });

    it("should redirect /deals URL to /opportunities", () => {
      handleDealUrlRedirect();

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "http://localhost:3000/opportunities/123?filter=active#section"
      );
    });

    it("should log deprecation for URL redirect", () => {
      handleDealUrlRedirect();

      const logs = getDeprecationLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].endpoint).toBe("/deals/123");
      expect(logs[0].method).toBe("URL_REDIRECT");
    });

    it("should not redirect non-deals URLs", () => {
      (window as any).location.pathname = "/contacts/123";
      handleDealUrlRedirect();

      expect(window.history.replaceState).not.toHaveBeenCalled();
    });
  });

  describe("getGracePeriodInfo", () => {
    it("should return grace period information", () => {
      const info = getGracePeriodInfo();

      expect(info).toHaveProperty("isWithinGracePeriod");
      expect(info).toHaveProperty("gracePeriodEnd");
      expect(info).toHaveProperty("daysRemaining");
      expect(info).toHaveProperty("deploymentDate");

      expect(typeof info.isWithinGracePeriod).toBe("boolean");
      expect(typeof info.daysRemaining).toBe("number");
    });
  });

  describe("deprecation logging", () => {
    it("should store deprecation logs", async () => {
      const mockDataProvider = {
        getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
        getOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        getMany: vi.fn(),
        getManyReference: vi.fn(),
        updateMany: vi.fn(),
      };

      const compatibleProvider = withBackwardCompatibility(mockDataProvider);

      // Make multiple calls
      await compatibleProvider.getList("deals", {
        pagination: { page: 1, perPage: 10 },
      });
      await compatibleProvider.getList("deals", {
        pagination: { page: 2, perPage: 10 },
      });

      const logs = getDeprecationLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].endpoint).toBe("/deals");
      expect(logs[1].endpoint).toBe("/deals");
    });

    it("should clear deprecation logs", async () => {
      const mockDataProvider = {
        getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
        getOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        getMany: vi.fn(),
        getManyReference: vi.fn(),
        updateMany: vi.fn(),
      };

      const compatibleProvider = withBackwardCompatibility(mockDataProvider);
      await compatibleProvider.getList("deals", {
        pagination: { page: 1, perPage: 10 },
      });

      expect(getDeprecationLogs().length).toBe(1);
      clearDeprecationLogs();
      expect(getDeprecationLogs().length).toBe(0);
    });
  });
});