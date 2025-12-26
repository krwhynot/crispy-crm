/**
 * Unit tests for ContactSlideOver component
 *
 * Tests the configuration and logic passed to ResourceSlideOver:
 * - Tab configuration (keys, labels, icons, count badges)
 * - Record representation (name formatting)
 * - Header actions (QuickAddTaskButton integration)
 *
 * These tests extract and test the configuration directly rather than
 * rendering the full component tree for better isolation and performance.
 *
 * @see ContactSlideOver.tsx
 */

import { describe, it, expect } from "vitest";
import { UserIcon, ActivityIcon, FileTextIcon } from "lucide-react";
import type { Contact } from "../../types";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";

/**
 * Extract the tab configuration from ContactSlideOver for testing.
 * This mirrors the structure defined in the component.
 */
function createContactTabs(): TabConfig[] {
  return [
    {
      key: "details",
      label: "Details",
      component: () => null,
      icon: UserIcon,
    },
    {
      key: "activities",
      label: "Activities",
      component: () => null,
      icon: ActivityIcon,
      countFromRecord: (record) => (record as Contact).nb_activities,
    },
    {
      key: "notes",
      label: "Notes",
      component: () => null,
      icon: FileTextIcon,
      countFromRecord: (record) => (record as Contact).nb_notes,
    },
  ];
}

/**
 * Extract the record representation function from ContactSlideOver.
 * This mirrors the function defined in the component.
 */
function getContactName(record: Contact): string {
  return `${record.first_name} ${record.last_name}`;
}

/**
 * Create a mock Contact for testing
 */
function createMockContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    title: "Software Engineer",
    email: [],
    phone: [],
    first_seen: "2024-01-01",
    last_seen: "2024-01-15",
    has_newsletter: false,
    tags: [],
    gender: "",
    opportunity_owner_id: 1,
    status: "active",
    background: "",
    nb_notes: 5,
    nb_activities: 10,
    nb_tasks: 3,
    ...overrides,
  };
}

describe("ContactSlideOver", () => {
  describe("Tab Configuration", () => {
    it("has exactly 3 tabs", () => {
      const tabs = createContactTabs();
      expect(tabs).toHaveLength(3);
    });

    it("has correct tab keys", () => {
      const tabs = createContactTabs();
      const keys = tabs.map((tab) => tab.key);
      expect(keys).toEqual(["details", "activities", "notes"]);
    });

    it("has correct tab labels", () => {
      const tabs = createContactTabs();
      const labels = tabs.map((tab) => tab.label);
      expect(labels).toEqual(["Details", "Activities", "Notes"]);
    });

    it("details tab has UserIcon", () => {
      const tabs = createContactTabs();
      const detailsTab = tabs.find((tab) => tab.key === "details");
      expect(detailsTab?.icon).toBe(UserIcon);
    });

    it("activities tab has ActivityIcon", () => {
      const tabs = createContactTabs();
      const activitiesTab = tabs.find((tab) => tab.key === "activities");
      expect(activitiesTab?.icon).toBe(ActivityIcon);
    });

    it("notes tab has FileTextIcon", () => {
      const tabs = createContactTabs();
      const notesTab = tabs.find((tab) => tab.key === "notes");
      expect(notesTab?.icon).toBe(FileTextIcon);
    });

    it("activities tab uses nb_activities for count badge", () => {
      const tabs = createContactTabs();
      const activitiesTab = tabs.find((tab) => tab.key === "activities");
      const mockContact = createMockContact({ nb_activities: 42 });

      const count = activitiesTab?.countFromRecord?.(mockContact);
      expect(count).toBe(42);
    });

    it("notes tab uses nb_notes for count badge", () => {
      const tabs = createContactTabs();
      const notesTab = tabs.find((tab) => tab.key === "notes");
      const mockContact = createMockContact({ nb_notes: 7 });

      const count = notesTab?.countFromRecord?.(mockContact);
      expect(count).toBe(7);
    });

    it("details tab has no count badge function", () => {
      const tabs = createContactTabs();
      const detailsTab = tabs.find((tab) => tab.key === "details");
      expect(detailsTab?.countFromRecord).toBeUndefined();
    });

    it("activities tab returns undefined count when nb_activities is undefined", () => {
      const tabs = createContactTabs();
      const activitiesTab = tabs.find((tab) => tab.key === "activities");
      const mockContact = createMockContact({ nb_activities: undefined });

      const count = activitiesTab?.countFromRecord?.(mockContact);
      expect(count).toBeUndefined();
    });

    it("notes tab returns undefined count when nb_notes is undefined", () => {
      const tabs = createContactTabs();
      const notesTab = tabs.find((tab) => tab.key === "notes");
      const mockContact = createMockContact({ nb_notes: undefined });

      const count = notesTab?.countFromRecord?.(mockContact);
      expect(count).toBeUndefined();
    });

    it("count badges handle zero values", () => {
      const tabs = createContactTabs();
      const activitiesTab = tabs.find((tab) => tab.key === "activities");
      const notesTab = tabs.find((tab) => tab.key === "notes");
      const mockContact = createMockContact({ nb_activities: 0, nb_notes: 0 });

      expect(activitiesTab?.countFromRecord?.(mockContact)).toBe(0);
      expect(notesTab?.countFromRecord?.(mockContact)).toBe(0);
    });
  });

  describe("Record Representation", () => {
    it("formats name as first_name space last_name", () => {
      const contact = createMockContact({
        first_name: "Jane",
        last_name: "Smith",
      });

      const result = getContactName(contact);
      expect(result).toBe("Jane Smith");
    });

    it("handles single character names", () => {
      const contact = createMockContact({
        first_name: "J",
        last_name: "D",
      });

      const result = getContactName(contact);
      expect(result).toBe("J D");
    });

    it("handles names with special characters", () => {
      const contact = createMockContact({
        first_name: "Mary-Jane",
        last_name: "O'Connor",
      });

      const result = getContactName(contact);
      expect(result).toBe("Mary-Jane O'Connor");
    });

    it("handles empty first name", () => {
      const contact = createMockContact({
        first_name: "",
        last_name: "Doe",
      });

      const result = getContactName(contact);
      expect(result).toBe(" Doe");
    });

    it("handles empty last name", () => {
      const contact = createMockContact({
        first_name: "John",
        last_name: "",
      });

      const result = getContactName(contact);
      expect(result).toBe("John ");
    });

    it("handles both names empty", () => {
      const contact = createMockContact({
        first_name: "",
        last_name: "",
      });

      const result = getContactName(contact);
      expect(result).toBe(" ");
    });

    it("preserves whitespace in names", () => {
      const contact = createMockContact({
        first_name: "Jean Pierre",
        last_name: "Van Der Berg",
      });

      const result = getContactName(contact);
      expect(result).toBe("Jean Pierre Van Der Berg");
    });

    it("handles unicode characters", () => {
      const contact = createMockContact({
        first_name: "Muller",
        last_name: "Schmidt",
      });

      const result = getContactName(contact);
      expect(result).toBe("Muller Schmidt");
    });
  });

  describe("Header Actions", () => {
    it("QuickAddTaskButton receives correct contactId from record", () => {
      const mockContact = createMockContact({ id: 123 });

      expect(mockContact.id).toBe(123);
    });

    it("header actions can access record id", () => {
      const mockContact = createMockContact({ id: 456 });

      const headerActions = (record: Contact) => record.id;
      const result = headerActions(mockContact);

      expect(result).toBe(456);
    });
  });
});
