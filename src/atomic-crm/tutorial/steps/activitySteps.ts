import type { TutorialStep } from '../types';

export const activitySteps: TutorialStep[] = [
  {
    popover: {
      title: 'Activity Logging',
      description:
        'Activities track your interactions - calls, emails, meetings, and samples. Aim for 10+ activities per week per Principal!',
    },
  },
  {
    element: '[data-tutorial="activities-list"]',
    popover: {
      title: 'Activity History',
      description: 'View all logged activities here.',
      side: 'left',
    },
    navigateTo: '/activities',
  },
  {
    element: '[data-tutorial="create-activity-btn"]',
    popover: {
      title: 'Log New Activity',
      description: "Let's log an activity. You should do this in under 30 seconds!",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="activity-type"]',
    popover: {
      title: 'Activity Type',
      description:
        'Select the type: Call, Email, Meeting, Demo, Sample, Site Visit, and more.',
      side: 'right',
    },
    navigateTo: '/activities/create',
  },
  {
    element: '[data-tutorial="activity-description"]',
    popover: {
      title: 'Description',
      description: 'Brief notes about what happened. Keep it short!',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="activity-opportunity"]',
    popover: {
      title: 'Related Opportunity',
      description: 'Link this activity to an opportunity in your pipeline.',
      side: 'right',
    },
  },
  {
    element: '[data-tutorial="activity-save-btn"]',
    popover: {
      title: 'Save Activity',
      description: 'Click Save to log this activity.',
      side: 'top',
    },
  },
  {
    popover: {
      title: '✅ Activities Complete!',
      description:
        "You've learned quick activity logging. Next, let's look at task management.",
    },
  },
];
