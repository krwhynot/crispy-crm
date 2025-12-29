import type { TutorialStep } from "../types";

export const noteSteps: TutorialStep[] = [
  // Step 1: Introduction
  {
    popover: {
      title: "Quick Notes",
      description:
        "Notes can be added to Contacts, Opportunities, and Organizations. They're accessible via the slide-over panel when you click on a record.",
    },
  },
  // Step 2: Navigate to contacts and explain click-to-open
  {
    element: '[data-tutorial="contacts-list"]',
    popover: {
      title: "Open a Contact",
      description:
        "Click any contact row to open their details in a slide-over panel. The Notes tab will be visible there.",
      side: "left",
    },
    navigateTo: "/contacts",
  },
  // Step 3: Point to notes section (will only work when slide-over is open)
  {
    element: '[data-tutorial="contact-notes-section"]',
    popover: {
      title: "Notes Tab",
      description:
        "In the slide-over panel, click the Notes tab to view and add notes. Notes are timestamped automatically.",
      side: "left",
    },
  },
  // Step 4: Add note button
  {
    element: '[data-tutorial="add-note-btn"]',
    popover: {
      title: "Add Note",
      description: "Click to add a new note. It will be saved with today's date.",
      side: "bottom",
    },
  },
  // Step 5: Completion
  {
    popover: {
      title: "✅ Notes Complete!",
      description: "Notes are easy! Finally, let's cover Team Management (Admin only).",
    },
  },
];
