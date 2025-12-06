import type { TutorialStep } from '../types';

export const organizationSteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-organizations"]',
    popover: {
      title: 'Organizations',
      description:
        'This is where you manage all organizations - Principals (manufacturers), Distributors, and Operators (restaurants).',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="organizations-list"]',
    popover: {
      title: 'Organization List',
      description:
        'View all your organizations here. Use the filters to find specific types like Principals or Distributors.',
      side: 'left',
    },
    navigateTo: '/organizations',
  },
  {
    element: '[data-tutorial="create-organization-btn"]',
    popover: {
      title: 'Add New Organization',
      description: "Click here to add a new organization. Let's create one now!",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="org-name"]',
    popover: {
      title: 'Organization Name',
      description: 'Enter the company name. We check for duplicates automatically.',
      side: 'right',
    },
    navigateTo: '/organizations/create',
  },
  {
    element: '[data-tutorial="org-type"]',
    popover: {
      title: 'Organization Type',
      description:
        'Select the type: Principal (manufacturer you represent), Distributor, or Operator (restaurant/foodservice).',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="org-website"]',
    popover: {
      title: 'Website (Optional)',
      description: "Add their website URL. We'll auto-add https:// if you forget.",
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="org-save-btn"]',
    popover: {
      title: 'Save Organization',
      description:
        "Click Save to create the organization. You'll see a confirmation message.",
      side: 'top',
    },
  },
  {
    popover: {
      title: '✅ Organizations Complete!',
      description:
        "You've learned how to add organizations. Next, let's add contacts to these organizations.",
    },
  },
];
