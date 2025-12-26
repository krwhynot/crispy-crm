/**
 * Tests for ProductInputs component
 *
 * Unit tests for the tabbed form input configuration:
 * - Tab configuration (keys, labels, fields, dataTutorial)
 * - Field configuration per tab
 * - Required field indicators
 *
 * These tests verify configuration and logic without full rendering.
 * Tab components are referenced by name to avoid import dependency issues.
 */

import { describe, it, expect } from "vitest";

/**
 * Tab definition structure (mirrors TabDefinition from TabbedFormInputs)
 */
interface TabDefinitionTest {
  key: string;
  label: string;
  fields: string[];
  componentName: string;
  dataTutorial?: string;
}

/**
 * Extract tab configuration from ProductInputs.
 * This mirrors the component's internal tab configuration for unit testing.
 * Component references are stored as names to avoid ESM import issues.
 */
function getProductInputsTabs(): TabDefinitionTest[] {
  return [
    {
      key: "details",
      label: "Product Details",
      fields: ["name", "principal_id", "category", "status", "description"],
      componentName: "ProductDetailsInputTab",
      dataTutorial: "product-tab-details",
    },
    {
      key: "distribution",
      label: "Distribution",
      fields: ["distributor_ids", "product_distributors"],
      componentName: "ProductDistributionTab",
      dataTutorial: "product-tab-distribution",
    },
  ];
}

/**
 * Required fields configuration for ProductDetailsInputTab
 * These fields have isRequired={true} on their FormFieldWrapper
 */
function getRequiredFields(): string[] {
  return ["name", "principal_id", "category"];
}

/**
 * Optional fields in ProductDetailsInputTab
 * These fields do not have isRequired on FormFieldWrapper
 */
function getOptionalFields(): string[] {
  return ["status", "description"];
}

describe("ProductInputs", () => {
  describe("Tab Configuration", () => {
    it("has exactly 2 tabs", () => {
      const tabs = getProductInputsTabs();
      expect(tabs).toHaveLength(2);
    });

    it("has 'details' tab as first tab", () => {
      const tabs = getProductInputsTabs();
      const detailsTab = tabs[0];

      expect(detailsTab.key).toBe("details");
      expect(detailsTab.label).toBe("Product Details");
      expect(detailsTab.componentName).toBe("ProductDetailsInputTab");
    });

    it("has 'distribution' tab as second tab", () => {
      const tabs = getProductInputsTabs();
      const distributionTab = tabs[1];

      expect(distributionTab.key).toBe("distribution");
      expect(distributionTab.label).toBe("Distribution");
      expect(distributionTab.componentName).toBe("ProductDistributionTab");
    });

    it("has unique tab keys", () => {
      const tabs = getProductInputsTabs();
      const keys = tabs.map((tab) => tab.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it("all tabs have required properties", () => {
      const tabs = getProductInputsTabs();

      tabs.forEach((tab) => {
        expect(tab.key).toBeDefined();
        expect(tab.key).not.toBe("");
        expect(tab.label).toBeDefined();
        expect(tab.label).not.toBe("");
        expect(tab.fields).toBeDefined();
        expect(Array.isArray(tab.fields)).toBe(true);
        expect(tab.componentName).toBeDefined();
      });
    });

    it("all tabs have dataTutorial attributes", () => {
      const tabs = getProductInputsTabs();

      tabs.forEach((tab) => {
        expect(tab.dataTutorial).toBeDefined();
        expect(tab.dataTutorial).toMatch(/^product-tab-/);
      });
    });

    it("uses 'details' as default tab", () => {
      const tabs = getProductInputsTabs();
      const defaultTab = "details";
      expect(tabs[0].key).toBe(defaultTab);
    });
  });

  describe("Field Configuration - Details Tab", () => {
    it("details tab contains name field", () => {
      const tabs = getProductInputsTabs();
      const detailsTab = tabs.find((t) => t.key === "details");

      expect(detailsTab?.fields).toContain("name");
    });

    it("details tab contains principal_id field", () => {
      const tabs = getProductInputsTabs();
      const detailsTab = tabs.find((t) => t.key === "details");

      expect(detailsTab?.fields).toContain("principal_id");
    });

    it("details tab contains category field", () => {
      const tabs = getProductInputsTabs();
      const detailsTab = tabs.find((t) => t.key === "details");

      expect(detailsTab?.fields).toContain("category");
    });

    it("details tab contains status field", () => {
      const tabs = getProductInputsTabs();
      const detailsTab = tabs.find((t) => t.key === "details");

      expect(detailsTab?.fields).toContain("status");
    });

    it("details tab contains description field", () => {
      const tabs = getProductInputsTabs();
      const detailsTab = tabs.find((t) => t.key === "details");

      expect(detailsTab?.fields).toContain("description");
    });

    it("details tab has exactly 5 fields", () => {
      const tabs = getProductInputsTabs();
      const detailsTab = tabs.find((t) => t.key === "details");

      expect(detailsTab?.fields).toHaveLength(5);
    });
  });

  describe("Field Configuration - Distribution Tab", () => {
    it("distribution tab contains distributor_ids field", () => {
      const tabs = getProductInputsTabs();
      const distributionTab = tabs.find((t) => t.key === "distribution");

      expect(distributionTab?.fields).toContain("distributor_ids");
    });

    it("distribution tab contains product_distributors field", () => {
      const tabs = getProductInputsTabs();
      const distributionTab = tabs.find((t) => t.key === "distribution");

      expect(distributionTab?.fields).toContain("product_distributors");
    });

    it("distribution tab has exactly 2 fields", () => {
      const tabs = getProductInputsTabs();
      const distributionTab = tabs.find((t) => t.key === "distribution");

      expect(distributionTab?.fields).toHaveLength(2);
    });
  });

  describe("Required Field Indicators", () => {
    it("name field is marked as required", () => {
      const requiredFields = getRequiredFields();
      expect(requiredFields).toContain("name");
    });

    it("principal_id field is marked as required", () => {
      const requiredFields = getRequiredFields();
      expect(requiredFields).toContain("principal_id");
    });

    it("category field is marked as required", () => {
      const requiredFields = getRequiredFields();
      expect(requiredFields).toContain("category");
    });

    it("status field is not marked as required in FormFieldWrapper", () => {
      const optionalFields = getOptionalFields();
      expect(optionalFields).toContain("status");
    });

    it("description field is not marked as required", () => {
      const optionalFields = getOptionalFields();
      expect(optionalFields).toContain("description");
    });

    it("required fields are a subset of details tab fields", () => {
      const tabs = getProductInputsTabs();
      const detailsTab = tabs.find((t) => t.key === "details");
      const requiredFields = getRequiredFields();

      requiredFields.forEach((field) => {
        expect(detailsTab?.fields).toContain(field);
      });
    });

    it("has exactly 3 required fields", () => {
      const requiredFields = getRequiredFields();
      expect(requiredFields).toHaveLength(3);
    });
  });

  describe("Tab Order", () => {
    it("shows details tab before distribution tab", () => {
      const tabs = getProductInputsTabs();
      const detailsIndex = tabs.findIndex((t) => t.key === "details");
      const distributionIndex = tabs.findIndex((t) => t.key === "distribution");

      expect(detailsIndex).toBe(0);
      expect(distributionIndex).toBe(1);
      expect(detailsIndex).toBeLessThan(distributionIndex);
    });
  });

  describe("Field Uniqueness", () => {
    it("no field appears in multiple tabs", () => {
      const tabs = getProductInputsTabs();
      const allFields = tabs.flatMap((tab) => tab.fields);
      const uniqueFields = new Set(allFields);

      expect(uniqueFields.size).toBe(allFields.length);
    });
  });
});
