import type { TutorialStep } from "../types";

export const opportunitySteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-opportunities"]',
    popover: {
      title: "Opportunities",
      description: "This is your sales pipeline - track deals from lead to close.",
      side: "bottom",
    },
  },
  {
    element: '[data-tutorial="opportunities-list"]',
    popover: {
      title: "Pipeline View",
      description:
        'See all opportunities here. Filter by Principal to answer "What do I need to do for each principal?"',
      side: "left",
    },
    navigateTo: "/opportunities",
  },
  {
    element: '[data-tutorial="create-opportunity-btn"]',
    popover: {
      title: "Add New Opportunity",
      description: "Let's create a new deal in the pipeline.",
      side: "bottom",
    },
  },
  {
    element: '[data-tutorial="opp-name"]',
    popover: {
      title: "Opportunity Name",
      description: 'Give this deal a clear name, like "ABC Restaurant - Sysco Authorization".',
      side: "right",
    },
    navigateTo: "/opportunities/create",
  },
  {
    element: '[data-tutorial="opp-stage"]',
    popover: {
      title: "Pipeline Stage",
      description:
        "Select the current stage: New Lead → Initial Outreach → Sample/Visit → Feedback → Demo → Closed.",
      side: "right",
    },
  },
  {
    element: '[data-tutorial="opp-principal"]',
    popover: {
      title: "Principal",
      description:
        "Which Principal (manufacturer) is this opportunity for? Each opportunity is linked to one Principal.",
      side: "right",
    },
  },
  {
    element: '[data-tutorial="opp-customer"]',
    popover: {
      title: "Customer Organization",
      description: "Select the customer (Operator or Distributor) for this deal.",
      side: "right",
    },
  },
  {
    element: '[data-tutorial="opp-contacts"]',
    popover: {
      title: "Related Contacts",
      description: "Link the key people involved in this deal.",
      side: "right",
    },
  },
  {
    element: '[data-tutorial="opp-close-date"]',
    popover: {
      title: "Estimated Close Date",
      description: "When do you expect to close this deal?",
      side: "right",
    },
  },
  {
    element: '[data-tutorial="opp-priority"]',
    popover: {
      title: "Priority",
      description: "Set the priority: Low, Medium, or High.",
      side: "right",
    },
  },
  {
    element: '[data-tutorial="opp-save-btn"]',
    popover: {
      title: "Save Opportunity",
      description: "Click Save to add this opportunity to your pipeline.",
      side: "top",
    },
  },
  {
    popover: {
      title: "✅ Opportunities Complete!",
      description:
        "Excellent! Now you know how to manage your pipeline. Let's learn about logging activities.",
    },
  },
];
