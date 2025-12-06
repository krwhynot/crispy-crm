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
      description: "Click here to add a new contact. Let's create one!",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="contact-first-name"]',
    popover: {
      title: 'First Name',
      description: 'Enter the first name. This is required.',
      side: 'right',
    },
    navigateTo: '/contacts/create',
  },
  {
    element: '[data-tutorial="contact-last-name"]',
    popover: {
      title: 'Last Name',
      description: 'Enter the last name. This is also required.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="contact-organization"]',
    popover: {
      title: 'Organization',
      description:
        'Link this contact to an organization. You can also create a new organization inline.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="contact-email"]',
    popover: {
      title: 'Email Address',
      description:
        'Add their email. Pro tip: We can auto-fill the name from the email if you enter it first!',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="contact-phone"]',
    popover: {
      title: 'Phone Number',
      description: 'Add phone numbers. You can add multiple numbers if needed.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="contact-save-btn"]',
    popover: {
      title: 'Save Contact',
      description: 'Click Save to create the contact.',
      side: 'top',
    },
  },
  {
    popover: {
      title: '✅ Contacts Complete!',
      description:
        "Great! You've learned how to add contacts. Next, let's create opportunities in the sales pipeline.",
    },
  },
];
