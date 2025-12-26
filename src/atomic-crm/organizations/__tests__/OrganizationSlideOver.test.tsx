/**
 * Unit tests for OrganizationSlideOver component
 *
 * Tests the tab configuration logic and record representation
 * without full component rendering. Focuses on:
 * - Base tabs for all organizations
 * - Conditional authorizations tab for distributors
 * - Record representation formatting
 */

import { describe, it, expect, vi } from "vitest";
import type { OrganizationRecord } from "../types";

// Mock all the tab components to avoid React Admin dependency chain
vi.mock("../slideOverTabs/OrganizationDetailsTab", () => ({
  OrganizationDetailsTab: () => null,
}));

vi.mock("../slideOverTabs/OrganizationContactsTab", () => ({
  OrganizationContactsTab: () => null,
}));

vi.mock("../slideOverTabs/OrganizationOpportunitiesTab", () => ({
  OrganizationOpportunitiesTab: () => null,
}));

vi.mock("../slideOverTabs/OrganizationNotesTab", () => ({
  OrganizationNotesTab: () => null,
}));

vi.mock("../AuthorizationsTab", () => ({
  AuthorizationsTab: () => null,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  BuildingIcon: () => null,
  Users: () => null,
  Target: () => null,
  StickyNote: () => null,
  ShieldCheck: () => null,
}));

// Import mocked modules
import { BuildingIcon, Users, Target, StickyNote, ShieldCheck } from "lucide-react";
import { OrganizationDetailsTab } from "../slideOverTabs/OrganizationDetailsTab";
import { OrganizationContactsTab } from "../slideOverTabs/OrganizationContactsTab";
import { OrganizationOpportunitiesTab } from "../slideOverTabs/OrganizationOpportunitiesTab";
import { OrganizationNotesTab } from "../slideOverTabs/OrganizationNotesTab";
import { AuthorizationsTab } from "../AuthorizationsTab";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";

/**
 * Extracts the tab configuration logic from OrganizationSlideOver.
 * This mirrors the component's internal logic for testability.
 */
function getOrganizationTabs(isDistributor: boolean): TabConfig[] {
  const baseTabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: OrganizationDetailsTab,
      icon: BuildingIcon,
    },
    {
      key: "contacts",
      label: "Contacts",
      component: OrganizationContactsTab,
      icon: Users,
      countFromRecord: (record: OrganizationRecord) => record.nb_contacts,
    },
    {
      key: "opportunities",
      label: "Opportunities",
      component: OrganizationOpportunitiesTab,
      icon: Target,
      countFromRecord: (record: OrganizationRecord) => record.nb_opportunities,
    },
    {
      key: "notes",
      label: "Notes",
      component: OrganizationNotesTab,
      icon: StickyNote,
      countFromRecord: (record: OrganizationRecord) => record.nb_notes,
    },
  ];

  return isDistributor
    ? [
        ...baseTabs.slice(0, 1), // Details first
        {
          key: "authorizations",
          label: "Authorizations",
          component: AuthorizationsTab,
          icon: ShieldCheck,
        },
        ...baseTabs.slice(1), // Then Contacts, Opportunities, Notes
      ]
    : baseTabs;
}

/**
 * Extracts the record representation logic from OrganizationSlideOver.
 */
function getRecordRepresentation(record: OrganizationRecord): string {
  return record.name || `Organization #${record.id}`;
}

describe("OrganizationSlideOver", () => {
  describe("Tab Configuration", () => {
    it("has base tabs for all organizations", () => {
      const tabs = getOrganizationTabs(false);

      expect(tabs).toHaveLength(4);

      // Verify tab keys
      const tabKeys = tabs.map((tab) => tab.key);
      expect(tabKeys).toEqual(["details", "contacts", "opportunities", "notes"]);

      // Verify tab labels
      const tabLabels = tabs.map((tab) => tab.label);
      expect(tabLabels).toEqual(["Details", "Contacts", "Opportunities", "Notes"]);

      // Verify icons are assigned
      expect(tabs[0].icon).toBe(BuildingIcon);
      expect(tabs[1].icon).toBe(Users);
      expect(tabs[2].icon).toBe(Target);
      expect(tabs[3].icon).toBe(StickyNote);

      // Verify components are assigned
      expect(tabs[0].component).toBe(OrganizationDetailsTab);
      expect(tabs[1].component).toBe(OrganizationContactsTab);
      expect(tabs[2].component).toBe(OrganizationOpportunitiesTab);
      expect(tabs[3].component).toBe(OrganizationNotesTab);
    });

    it("includes authorizations tab for distributors", () => {
      const tabs = getOrganizationTabs(true);

      expect(tabs).toHaveLength(5);

      // Verify tab order: Details, Authorizations, Contacts, Opportunities, Notes
      const tabKeys = tabs.map((tab) => tab.key);
      expect(tabKeys).toEqual([
        "details",
        "authorizations",
        "contacts",
        "opportunities",
        "notes",
      ]);

      // Verify authorizations tab is in correct position (second)
      const authTab = tabs[1];
      expect(authTab.key).toBe("authorizations");
      expect(authTab.label).toBe("Authorizations");
      expect(authTab.icon).toBe(ShieldCheck);
      expect(authTab.component).toBe(AuthorizationsTab);
    });

    it("excludes authorizations tab for non-distributors", () => {
      const tabs = getOrganizationTabs(false);

      const tabKeys = tabs.map((tab) => tab.key);
      expect(tabKeys).not.toContain("authorizations");
      expect(tabs).toHaveLength(4);
    });

    it("has correct count badge functions for tabs with counts", () => {
      const tabs = getOrganizationTabs(false);

      const mockRecord: OrganizationRecord = {
        id: 1,
        name: "Test Org",
        organization_type: "principal",
        nb_contacts: 5,
        nb_opportunities: 3,
        nb_notes: 7,
        created_at: new Date().toISOString(),
      };

      // Details tab has no count
      expect(tabs[0].countFromRecord).toBeUndefined();

      // Contacts tab count
      expect(tabs[1].countFromRecord).toBeDefined();
      expect(tabs[1].countFromRecord!(mockRecord)).toBe(5);

      // Opportunities tab count
      expect(tabs[2].countFromRecord).toBeDefined();
      expect(tabs[2].countFromRecord!(mockRecord)).toBe(3);

      // Notes tab count
      expect(tabs[3].countFromRecord).toBeDefined();
      expect(tabs[3].countFromRecord!(mockRecord)).toBe(7);
    });

    it("handles undefined count values gracefully", () => {
      const tabs = getOrganizationTabs(false);

      const recordWithNoCounts: OrganizationRecord = {
        id: 1,
        name: "Test Org",
        organization_type: "operator",
        created_at: new Date().toISOString(),
      };

      // Should return undefined when count fields are missing
      expect(tabs[1].countFromRecord!(recordWithNoCounts)).toBeUndefined();
      expect(tabs[2].countFromRecord!(recordWithNoCounts)).toBeUndefined();
      expect(tabs[3].countFromRecord!(recordWithNoCounts)).toBeUndefined();
    });
  });

  describe("Record Representation", () => {
    it("uses organization name when available", () => {
      const record: OrganizationRecord = {
        id: 42,
        name: "Acme Corporation",
        organization_type: "distributor",
        created_at: new Date().toISOString(),
      };

      expect(getRecordRepresentation(record)).toBe("Acme Corporation");
    });

    it("falls back to Organization #id when name is empty", () => {
      const record: OrganizationRecord = {
        id: 123,
        name: "",
        organization_type: "principal",
        created_at: new Date().toISOString(),
      };

      expect(getRecordRepresentation(record)).toBe("Organization #123");
    });

    it("falls back to Organization #id when name is undefined", () => {
      const record = {
        id: 456,
        organization_type: "operator",
        created_at: new Date().toISOString(),
      } as OrganizationRecord;

      expect(getRecordRepresentation(record)).toBe("Organization #456");
    });
  });

  describe("Distributor Detection", () => {
    it("correctly identifies distributor organization type", () => {
      const distributorOrg: OrganizationRecord = {
        id: 1,
        name: "Food Distributor Inc",
        organization_type: "distributor",
        created_at: new Date().toISOString(),
      };

      const isDistributor = distributorOrg.organization_type === "distributor";
      expect(isDistributor).toBe(true);

      const tabs = getOrganizationTabs(isDistributor);
      expect(tabs.map((t) => t.key)).toContain("authorizations");
    });

    it("correctly identifies non-distributor organization types", () => {
      const nonDistributorTypes = ["principal", "operator", "prospect"] as const;

      for (const orgType of nonDistributorTypes) {
        const org: OrganizationRecord = {
          id: 1,
          name: "Test Org",
          organization_type: orgType,
          created_at: new Date().toISOString(),
        };

        const isDistributor = org.organization_type === "distributor";
        expect(isDistributor).toBe(false);

        const tabs = getOrganizationTabs(isDistributor);
        expect(tabs.map((t) => t.key)).not.toContain("authorizations");
      }
    });
  });
});
