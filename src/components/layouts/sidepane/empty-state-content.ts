/**
 * Centralized empty state content for slide-over tabs.
 * Ensures consistent copy across all modules.
 */
export const EMPTY_STATE_CONTENT = {
  activities: {
    title: "No activities yet",
    description: "Log calls, emails, and meetings to track interactions.",
    actionLabel: "Log Activity",
  },
  notes: {
    title: "No notes added",
    description: "Capture important details about this record.",
    actionLabel: "Add Note",
  },
  contacts: {
    title: "No contacts linked",
    description: "Connect contacts to track relationships.",
    actionLabel: "Link Contact",
  },
  opportunities: {
    title: "No opportunities yet",
    description: "Track potential deals with this organization.",
    actionLabel: "Create Opportunity",
  },
  products: {
    title: "No products added",
    description: "Add products associated with this opportunity.",
    actionLabel: "Add Product",
  },
  relatedItems: {
    title: "No related items",
    description: "This record has no linked items yet.",
  },
  relationships: {
    title: "No relationships yet",
    description: "This product has no linked opportunities.",
  },
} as const;

export type EmptyStateKey = keyof typeof EMPTY_STATE_CONTENT;
