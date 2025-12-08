import type { TutorialStep } from '../types';

/**
 * Tutorial steps for the Opportunity Create form ONLY.
 * These steps are standalone and do NOT navigate between pages.
 * Used by OpportunityCreateFormTutorial component.
 *
 * Coverage: Required fields + section headers for discoverability
 */
export const opportunityCreateFormSteps: TutorialStep[] = [
  // Step 1: Welcome (no element - centered modal)
  {
    popover: {
      title: 'Create an Opportunity',
      description:
        'This form captures a new deal in your sales pipeline. Let me walk you through each field.',
      align: 'center',
    },
  },
  // Step 2: Name
  {
    element: '[data-tutorial="opp-name"]',
    popover: {
      title: 'Opportunity Name',
      description:
        'Give this deal a clear name. Convention: "[Customer] - [Principal] - [Context]" e.g., "ABC Restaurant - Sysco Authorization"',
      side: 'bottom',
    },
  },
  // Step 3: Customer Organization
  {
    element: '[data-tutorial="opp-customer"]',
    popover: {
      title: 'Customer Organization',
      description:
        'Select the customer (Operator or Distributor) pursuing this deal. Use the "+" button to create a new customer inline.',
      side: 'right',
    },
  },
  // Step 4: Principal Organization
  {
    element: '[data-tutorial="opp-principal"]',
    popover: {
      title: 'Principal Organization',
      description:
        'Which Principal (manufacturer) does this opportunity represent? Each opportunity is linked to exactly one Principal.',
      side: 'left',
    },
  },
  // Step 5: Stage
  {
    element: '[data-tutorial="opp-stage"]',
    popover: {
      title: 'Pipeline Stage',
      description:
        'Track progress: New Lead → Initial Outreach → Sample/Visit → Feedback → Demo → Closed Won/Lost',
      side: 'bottom',
    },
  },
  // Step 6: Priority
  {
    element: '[data-tutorial="opp-priority"]',
    popover: {
      title: 'Priority Level',
      description:
        'Set urgency: Low, Medium, High, or Critical. Helps prioritize your weekly focus.',
      side: 'bottom',
    },
  },
  // Step 7: Close Date
  {
    element: '[data-tutorial="opp-close-date"]',
    popover: {
      title: 'Estimated Close Date',
      description: 'When do you expect this deal to close? This drives pipeline forecasting.',
      side: 'bottom',
    },
  },
  // Step 8: Account Manager
  {
    element: '[data-tutorial="opp-account-manager"]',
    popover: {
      title: 'Account Manager',
      description:
        'Assign the team member responsible for this opportunity (defaults to you).',
      side: 'right',
    },
  },
  // Step 9: Distributor
  {
    element: '[data-tutorial="opp-distributor"]',
    popover: {
      title: 'Distributor Organization',
      description:
        'Optional: If this deal involves a specific distributor, select it here. Shows authorization warnings if not authorized.',
      side: 'left',
    },
  },
  // Step 10: Contacts
  {
    element: '[data-tutorial="opp-contacts"]',
    popover: {
      title: 'Related Contacts',
      description:
        'Link key people involved in this deal. Contacts are filtered by the selected Customer Organization.',
      side: 'top',
    },
  },
  // Step 11: Products
  {
    element: '[data-tutorial="opp-products"]',
    popover: {
      title: 'Products',
      description:
        "Add products from the Principal's catalog. At least one product is required. Add notes for each product.",
      side: 'top',
    },
  },
  // Step 12: Classification Section
  {
    element: '[data-tutorial="opp-section-classification"]',
    popover: {
      title: 'Classification Section',
      description:
        'Optional: Track lead source, campaign, and tags for reporting and segmentation.',
      side: 'top',
    },
  },
  // Step 13: Additional Details Section
  {
    element: '[data-tutorial="opp-section-details"]',
    popover: {
      title: 'Additional Details',
      description:
        'Optional: Add description, next actions, decision criteria, and notes for context.',
      side: 'top',
    },
  },
  // Step 14: Save Button
  {
    element: '[data-tutorial="opp-save-btn"]',
    popover: {
      title: 'Create Opportunity',
      description:
        'Click to create the opportunity. Similar name detection will warn if a duplicate might exist.',
      side: 'top',
    },
  },
  // Step 15: Completion
  {
    popover: {
      title: 'Ready to Create!',
      description:
        'You now know all the fields. Fill out the required fields (*) and click Create Opportunity.',
      align: 'center',
    },
  },
];
