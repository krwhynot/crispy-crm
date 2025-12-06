import type { TutorialStep } from '../types';

export const noteSteps: TutorialStep[] = [
  {
    popover: {
      title: 'Quick Notes',
      description:
        "Notes can be added to Contacts, Opportunities, and Organizations. They're timestamped automatically.",
    },
  },
  {
    element: '[data-tutorial="contact-notes-section"]',
    popover: {
      title: 'Notes Panel',
      description:
        'Add quick notes here. Great for recording important details from conversations.',
      side: 'left',
    },
    navigateTo: '/contacts',
  },
  {
    element: '[data-tutorial="add-note-btn"]',
    popover: {
      title: 'Add Note',
      description: "Click to add a new note. It will be saved with today's date.",
      side: 'bottom',
    },
  },
  {
    popover: {
      title: '✅ Notes Complete!',
      description: "Notes are easy! Finally, let's cover Team Management (Admin only).",
    },
  },
];
