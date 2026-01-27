/**
 * Standard notification messages for user-facing toasts.
 * Uses plain English strings, not i18n keys.
 *
 * Pattern: [Entity] [action] (no "successfully" for brevity)
 * Bulk pattern: "X [entities] [action]"
 *
 * Usage:
 * - notify(notificationMessages.created('Contact'), { type: 'success' });
 * - notify(notificationMessages.bulkDeleted(3, 'organization'), { undoable: true });
 */
export const notificationMessages = {
  // Single operations
  created: (entity: string) => `${entity} created`,
  updated: (entity: string) => `${entity} updated`,
  deleted: (entity: string) => `${entity} deleted`,
  archived: (entity: string) => `${entity} archived`,
  restored: (entity: string) => `${entity} restored`,

  // Bulk operations (handles pluralization automatically)
  bulkDeleted: (count: number, entity: string) => {
    const plural = count === 1 ? entity : pluralize(entity);
    return `${count} ${plural} deleted`;
  },
  bulkUpdated: (count: number, entity: string) => {
    const plural = count === 1 ? entity : pluralize(entity);
    return `${count} ${plural} updated`;
  },
  bulkArchived: (count: number, entity: string) => {
    const plural = count === 1 ? entity : pluralize(entity);
    return `${count} ${plural} archived`;
  },
};

/**
 * Simple pluralization helper
 * Handles common patterns:
 * - opportunity -> opportunities
 * - organization -> organizations
 * - contact -> contacts
 */
function pluralize(entity: string): string {
  // Handle -y endings (opportunity -> opportunities)
  if (entity.endsWith("y") && !["ay", "ey", "iy", "oy", "uy"].some((v) => entity.endsWith(v))) {
    return entity.slice(0, -1) + "ies";
  }
  // Default: add 's'
  return entity + "s";
}
