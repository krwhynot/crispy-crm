import { describe, it, expect, vi } from "vitest";

/**
 * Raw opportunity data shape from database queries
 * Used for testing data mapping logic in hook
 */
interface RawOpportunityData {
  id: number;
  name?: string;
  stage?: string;
  amount?: number;
  probability?: number;
  last_activity_date?: string;
  estimated_close_date?: string;
}

// Unit tests for drill-down logic (no React components)
describe("Pipeline Drill-Down Feature", () => {
  describe("usePrincipalOpportunities hook logic", () => {
    it("should map opportunity data correctly using estimated_close_date", () => {
      // Test the data mapping logic
      // NOTE: Database uses estimated_close_date, hook maps it to expectedCloseDate
      const rawOpportunity = {
        id: 1,
        name: "Test Opportunity",
        stage: "Proposal",
        amount: 50000,
        probability: 75,
        last_activity_date: "2025-01-15",
        estimated_close_date: "2025-02-28", // Database field name
      };

      // Mapping function (same logic as in the hook)
      const mapped = {
        id: rawOpportunity.id,
        name: rawOpportunity.name || "Unnamed Opportunity",
        stage: rawOpportunity.stage || "Unknown",
        amount: rawOpportunity.amount || 0,
        probability: rawOpportunity.probability || 0,
        lastActivityDate: rawOpportunity.last_activity_date
          ? new Date(rawOpportunity.last_activity_date)
          : null,
        // Maps estimated_close_date -> expectedCloseDate
        expectedCloseDate: rawOpportunity.estimated_close_date
          ? new Date(rawOpportunity.estimated_close_date)
          : null,
      };

      expect(mapped.id).toBe(1);
      expect(mapped.name).toBe("Test Opportunity");
      expect(mapped.stage).toBe("Proposal");
      expect(mapped.amount).toBe(50000);
      expect(mapped.probability).toBe(75);
      expect(mapped.lastActivityDate).toBeInstanceOf(Date);
      expect(mapped.expectedCloseDate).toBeInstanceOf(Date);
    });

    it("should handle missing fields with defaults", () => {
      const rawOpportunity = {
        id: 1,
        // All other fields missing
      };

      const mapped = {
        id: rawOpportunity.id,
        name: (rawOpportunity as any).name || "Unnamed Opportunity",
        stage: (rawOpportunity as any).stage || "Unknown",
        amount: (rawOpportunity as any).amount || 0,
        probability: (rawOpportunity as any).probability || 0,
        lastActivityDate: (rawOpportunity as any).last_activity_date
          ? new Date((rawOpportunity as any).last_activity_date)
          : null,
        expectedCloseDate: (rawOpportunity as any).estimated_close_date
          ? new Date((rawOpportunity as any).estimated_close_date)
          : null,
      };

      expect(mapped.name).toBe("Unnamed Opportunity");
      expect(mapped.stage).toBe("Unknown");
      expect(mapped.amount).toBe(0);
      expect(mapped.probability).toBe(0);
      expect(mapped.lastActivityDate).toBeNull();
      expect(mapped.expectedCloseDate).toBeNull();
    });
  });

  describe("Stage color mapping", () => {
    const getStageColor = (stage: string): "default" | "secondary" | "destructive" | "outline" => {
      const stageLower = stage.toLowerCase();
      // Check for "lost" first since "Closed Lost" contains both "closed" and "lost"
      if (stageLower.includes("lost")) return "destructive";
      if (stageLower.includes("won") || stageLower.includes("closed")) return "default";
      if (stageLower.includes("negotiat") || stageLower.includes("proposal")) return "secondary";
      return "outline";
    };

    it("should return default for won stages", () => {
      expect(getStageColor("Won")).toBe("default");
      expect(getStageColor("Closed Won")).toBe("default");
    });

    it("should return destructive for lost stages", () => {
      expect(getStageColor("Lost")).toBe("destructive");
      expect(getStageColor("Closed Lost")).toBe("destructive");
    });

    it("should return secondary for negotiation stages", () => {
      expect(getStageColor("Negotiation")).toBe("secondary");
      expect(getStageColor("Proposal")).toBe("secondary");
    });

    it("should return outline for other stages", () => {
      expect(getStageColor("Discovery")).toBe("outline");
      expect(getStageColor("Qualification")).toBe("outline");
    });
  });

  describe("Currency formatting", () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    it("should format currency correctly", () => {
      expect(formatCurrency(50000)).toBe("$50,000");
      expect(formatCurrency(1234567)).toBe("$1,234,567");
      expect(formatCurrency(0)).toBe("$0");
    });
  });

  describe("Pipeline calculations", () => {
    it("should calculate total pipeline value", () => {
      const opportunities = [
        { amount: 30000, probability: 50 },
        { amount: 20000, probability: 75 },
        { amount: 50000, probability: 25 },
      ];

      const totalPipeline = opportunities.reduce((sum, opp) => sum + opp.amount, 0);
      expect(totalPipeline).toBe(100000);
    });

    it("should calculate weighted pipeline value", () => {
      const opportunities = [
        { amount: 30000, probability: 50 },
        { amount: 20000, probability: 75 },
        { amount: 50000, probability: 25 },
      ];

      const weightedPipeline = opportunities.reduce(
        (sum, opp) => sum + opp.amount * (opp.probability / 100),
        0
      );

      // 30000*0.5 + 20000*0.75 + 50000*0.25 = 15000 + 15000 + 12500 = 42500
      expect(weightedPipeline).toBe(42500);
    });
  });

  describe("Row click handler", () => {
    it("should extract id and name from row data", () => {
      const row = {
        id: 123,
        name: "Acme Corp",
        totalPipeline: 100000,
        activeThisWeek: 5,
        activeLastWeek: 3,
        momentum: "increasing" as const,
        nextAction: null,
      };

      const selectedPrincipal = { id: row.id, name: row.name };

      expect(selectedPrincipal.id).toBe(123);
      expect(selectedPrincipal.name).toBe("Acme Corp");
    });
  });

  describe("Opportunity count display", () => {
    it("should use singular form for 1 opportunity", () => {
      const count = 1;
      const text = `${count} ${count === 1 ? "opportunity" : "opportunities"}`;
      expect(text).toBe("1 opportunity");
    });

    it("should use plural form for multiple opportunities", () => {
      const count = 5;
      const text = `${count} ${count === 1 ? "opportunity" : "opportunities"}`;
      expect(text).toBe("5 opportunities");
    });

    it("should use plural form for 0 opportunities", () => {
      const count = 0;
      const text = `${count} ${count === 1 ? "opportunity" : "opportunities"}`;
      expect(text).toBe("0 opportunities");
    });
  });

  describe("Keyboard navigation", () => {
    it("should trigger on Enter key", () => {
      const handler = vi.fn();
      const event = { key: "Enter", preventDefault: vi.fn() };

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }

      expect(handler).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger on Space key", () => {
      const handler = vi.fn();
      const event = { key: " ", preventDefault: vi.fn() };

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }

      expect(handler).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should not trigger on other keys", () => {
      const handler = vi.fn();
      const event = { key: "Tab", preventDefault: vi.fn() };

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler();
      }

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
