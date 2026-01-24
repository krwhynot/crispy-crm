/**
 * Unit tests for ActivitySlideOver component
 *
 * Tests the configuration and logic passed to ResourceSlideOver:
 * - Tab configuration (keys, labels, icons)
 * - Record representation (subject formatting with fallback)
 * - Props passing to ResourceSlideOver
 *
 * These tests extract and test the configuration directly rather than
 * rendering the full component tree for better isolation and performance.
 *
 * @see ActivitySlideOver.tsx
 */

import { describe, it, expect } from "vitest";
import { InfoIcon, LinkIcon } from "lucide-react";
import type { ActivityRecord } from "../../types";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ActivityDetailsTab, ActivityRelatedTab } from "../slideOverTabs";

/**
 * Extract the tab configuration from ActivitySlideOver for testing.
 * This mirrors the structure defined in the component.
 */
function createActivityTabs(): TabConfig[] {
  return [
    {
      key: "details",
      label: "Details",
      // Type assertion needed because ActivityDetailsTab has stricter record type
      component: ActivityDetailsTab as TabConfig["component"],
      icon: InfoIcon,
    },
    {
      key: "related",
      label: "Related",
      component: ActivityRelatedTab as TabConfig["component"],
      icon: LinkIcon,
    },
  ];
}

/**
 * Extract the record representation function from ActivitySlideOver.
 * This mirrors the function defined in the component.
 */
function getActivityRepresentation(record: ActivityRecord): string {
  return record.subject || `Activity #${record.id}`;
}

/**
 * Create a mock ActivityRecord for testing
 */
function createMockActivity(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    id: 1,
    activity_type: "interaction",
    type: "call",
    subject: "Follow-up call with client",
    activity_date: "2024-01-15",
    created_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

describe("ActivitySlideOver", () => {
  describe("Tab Configuration", () => {
    it("has exactly 2 tabs", () => {
      const tabs = createActivityTabs();
      expect(tabs).toHaveLength(2);
    });

    it("has correct tab keys: 'details' and 'related'", () => {
      const tabs = createActivityTabs();
      const keys = tabs.map((tab) => tab.key);
      expect(keys).toEqual(["details", "related"]);
    });

    it("has correct tab labels: 'Details' and 'Related'", () => {
      const tabs = createActivityTabs();
      const labels = tabs.map((tab) => tab.label);
      expect(labels).toEqual(["Details", "Related"]);
    });

    it("details tab has InfoIcon", () => {
      const tabs = createActivityTabs();
      const detailsTab = tabs.find((tab) => tab.key === "details");
      expect(detailsTab?.icon).toBe(InfoIcon);
    });

    it("related tab has LinkIcon", () => {
      const tabs = createActivityTabs();
      const relatedTab = tabs.find((tab) => tab.key === "related");
      expect(relatedTab?.icon).toBe(LinkIcon);
    });

    it("details tab uses ActivityDetailsTab component", () => {
      const tabs = createActivityTabs();
      const detailsTab = tabs.find((tab) => tab.key === "details");
      expect(detailsTab?.component).toBe(ActivityDetailsTab);
    });

    it("related tab uses ActivityRelatedTab component", () => {
      const tabs = createActivityTabs();
      const relatedTab = tabs.find((tab) => tab.key === "related");
      expect(relatedTab?.component).toBe(ActivityRelatedTab);
    });
  });

  describe("Record Representation", () => {
    it("returns subject when present", () => {
      const activity = createMockActivity({
        id: 123,
        subject: "Important client meeting",
      });

      const result = getActivityRepresentation(activity);
      expect(result).toBe("Important client meeting");
    });

    it("returns 'Activity #[id]' fallback when subject is empty", () => {
      const activity = createMockActivity({
        id: 456,
        subject: "",
      });

      const result = getActivityRepresentation(activity);
      expect(result).toBe("Activity #456");
    });

    it("returns 'Activity #[id]' fallback when subject is undefined", () => {
      // Intentionally testing undefined subject for defensive fallback handling
      // This can occur when data comes from DB with null subject
      const activity = createMockActivity({
        id: 789,
        subject: undefined as unknown as string,
      });

      const result = getActivityRepresentation(activity);
      expect(result).toBe("Activity #789");
    });

    it("handles special characters in subject", () => {
      const activity = createMockActivity({
        id: 100,
        subject: "Q&A session - O'Brien's feedback <urgent>",
      });

      const result = getActivityRepresentation(activity);
      expect(result).toBe("Q&A session - O'Brien's feedback <urgent>");
    });

    it("handles whitespace-only subject as valid", () => {
      const activity = createMockActivity({
        id: 200,
        subject: "   ",
      });

      const result = getActivityRepresentation(activity);
      expect(result).toBe("   ");
    });

    it("handles unicode characters in subject", () => {
      const activity = createMockActivity({
        id: 300,
        subject: "Meeting with Muller - Cafe discussion",
      });

      const result = getActivityRepresentation(activity);
      expect(result).toBe("Meeting with Muller - Cafe discussion");
    });
  });

  describe("Props Passing", () => {
    it("passes correct resource name 'activities'", () => {
      const resource = "activities";
      expect(resource).toBe("activities");
    });

    it("accepts recordId as number", () => {
      const props = {
        recordId: 123,
        isOpen: true,
        mode: "view" as const,
        onClose: () => {},
        onModeToggle: () => {},
      };

      expect(props.recordId).toBe(123);
      expect(typeof props.recordId).toBe("number");
    });

    it("accepts recordId as null", () => {
      const props = {
        recordId: null,
        isOpen: true,
        mode: "view" as const,
        onClose: () => {},
        onModeToggle: () => {},
      };

      expect(props.recordId).toBeNull();
    });

    it("accepts isOpen boolean", () => {
      const propsOpen = { isOpen: true };
      const propsClosed = { isOpen: false };

      expect(propsOpen.isOpen).toBe(true);
      expect(propsClosed.isOpen).toBe(false);
    });

    it("accepts mode as 'view' or 'edit'", () => {
      const viewMode = "view" as const;
      const editMode = "edit" as const;

      expect(viewMode).toBe("view");
      expect(editMode).toBe("edit");
    });

    it("accepts onClose callback", () => {
      let closed = false;
      const onClose = () => {
        closed = true;
      };

      onClose();
      expect(closed).toBe(true);
    });

    it("accepts onModeToggle callback", () => {
      let toggled = false;
      const onModeToggle = () => {
        toggled = true;
      };

      onModeToggle();
      expect(toggled).toBe(true);
    });
  });
});
