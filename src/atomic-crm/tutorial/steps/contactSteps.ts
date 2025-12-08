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
        'View all contacts here. Click any row to open the contact details in a slide-over panel.',
      side: 'left',
    },
    navigateTo: '/contacts',
  },
  {
    element: '[data-tutorial="contact-sort-btn"]',
    popover: {
      title: 'Sort Contacts',
      description:
        'Sort by last seen (default), first name, or last name. Contacts are sorted by most recent activity by default.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="contact-import-btn"]',
    popover: {
      title: 'Import Contacts',
      description:
        'Bulk import contacts from a CSV file. Great for migrating data from spreadsheets.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="contact-template-btn"]',
    popover: {
      title: 'Download Template',
      description:
        'Download a CSV template with the correct column headers for importing contacts.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="contact-export-btn"]',
    popover: {
      title: 'Export Contacts',
      description:
        'Export your contacts to a CSV file for reporting or backup purposes.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="contact-filters"]',
    popover: {
      title: 'Filter Contacts',
      description:
        'Use filters to narrow down your list. Filter by last activity, tags, organization, or account manager.',
      side: 'right',
    },
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
        "You now know how to navigate, filter, and manage contacts. Click any contact to view their details.",
    },
  },
];
