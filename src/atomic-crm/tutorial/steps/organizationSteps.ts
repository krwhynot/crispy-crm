import type { TutorialStep } from "../types";

/**
 * Organization List Tutorial Steps
 *
 * Focuses on LIST exploration (not CREATE workflow).
 * Matches the pattern used in Contacts list tutorial.
 */
export const organizationSteps: TutorialStep[] = [
  // Step 1: List overview
  {
    element: '[data-tutorial="organizations-list"]',
    popover: {
      title: "Organization List",
      description:
        "View all your organizations here - Principals, Distributors, and Operators. Click any row to see details.",
      side: "left",
    },
    navigateTo: "/organizations",
  },
  // Step 2: Filter sidebar
  {
    element: '[data-tutorial="org-filters"]',
    popover: {
      title: "Filter Organizations",
      description:
        "Use filters to narrow down your view. Filter by Type (Principal, Distributor, Operator), Priority (A-D), Playbook Category, or your own accounts.",
      side: "right",
    },
  },
  // Step 3: Sort button
  {
    element: '[data-tutorial="org-sort-btn"]',
    popover: {
      title: "Sort Results",
      description:
        "Sort organizations by Name, Type, or Priority. Click again to reverse the order.",
      side: "bottom",
    },
  },
  // Step 4: Export button
  {
    element: '[data-tutorial="org-export-btn"]',
    popover: {
      title: "Export to CSV",
      description: "Download your organizations as a CSV file for reports or Excel analysis.",
      side: "bottom",
    },
  },
  // Step 5: Create button
  {
    element: '[data-tutorial="create-organization-btn"]',
    popover: {
      title: "Add New Organization",
      description: "Click here to add a new Principal, Distributor, or Operator to your CRM.",
      side: "bottom",
    },
  },
  // Step 6: Completion
  {
    popover: {
      title: "✅ Organization List Tutorial Complete!",
      description:
        "You've learned how to navigate, filter, and manage your organizations. Click any row to view or edit details in the slide-over panel.",
    },
  },
];
