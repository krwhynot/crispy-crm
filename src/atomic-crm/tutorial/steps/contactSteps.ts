import type { TutorialStep } from '../types';

export const contactSteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-contacts"]',
    popover: {
      title: 'Contacts',
      description:
        'Manage all your contacts - buyers, decision makers, and key people at organizations.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="contacts-list"]',
    popover: {
      title: 'Contact List',
      description:
        'View all contacts here. You can filter by organization or search by name.',
      side: 'left',
    },
    navigateTo: '/contacts',
  },
  {
    element: '[data-tutorial="create-contact-btn"]',
    popover: {
      title: 'Add New Contact',
      description: 'Click here to add a new contact when you need to track someone.',
      side: 'bottom',
    },
  },
  {
    popover: {
      title: '✅ Contacts Complete!',
      description:
        "You now know how to navigate and manage contacts. Click any contact to view their details.",
    },
  },
];
