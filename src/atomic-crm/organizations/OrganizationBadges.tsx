/**
 * Organization Badge Components
 *
 * Extracted from OrganizationList.tsx for reusability across:
 * - OrganizationList (table cells)
 * - OrganizationSlideOver (detail view)
 * - OrganizationListFilter (filter chips)
 *
 * Uses semantic tag colors from the MFB Garden to Table theme.
 * Note: badge.constants.ts has `org-*` CVA variants available for future migration.
 */

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ORG_TYPE_COLOR_MAP,
  PRIORITY_VARIANT_MAP,
  PRIORITY_CHOICES,
  type OrganizationType,
  type PriorityLevel,
} from "./constants";

// Re-export types for consumers
export type { OrganizationType, PriorityLevel };

interface OrganizationTypeBadgeProps {
  /** Organization type from record.organization_type */
  type: OrganizationType | string;
}

interface PriorityBadgeProps {
  /** Priority level from record.priority */
  priority: PriorityLevel | string;
}

/**
 * Displays organization type with semantic tag colors
 *
 * Color mapping (MFB Garden to Table theme):
 * - customer: tag-warm (Clay Orange - welcoming)
 * - prospect: tag-sage (Olive Green - growth potential)
 * - principal: tag-purple (Eggplant - important/primary)
 * - distributor: tag-teal (Active/connected)
 */
export const OrganizationTypeBadge = memo(function OrganizationTypeBadge({ type }: OrganizationTypeBadgeProps) {
  const colorClass = ORG_TYPE_COLOR_MAP[type as OrganizationType] || "tag-gray";

  return (
    <Badge className={`text-xs px-2 py-1 ${colorClass}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
});

OrganizationTypeBadge.displayName = "OrganizationTypeBadge";

/**
 * Displays priority level with semantic status colors
 *
 * Variant mapping:
 * - A (High): destructive (red - urgent attention)
 * - B (Medium-High): default (primary green)
 * - C (Medium): secondary (muted)
 * - D (Low): outline (minimal emphasis)
 */
export const PriorityBadge = memo(function PriorityBadge({ priority }: PriorityBadgeProps) {
  const variant = PRIORITY_VARIANT_MAP[priority as PriorityLevel] || "default";
  const label = PRIORITY_CHOICES.find((p) => p.id === priority)?.name || priority;

  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {label}
    </Badge>
  );
});

PriorityBadge.displayName = "PriorityBadge";
