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

import { Badge } from "@/components/ui/badge";
import { ORG_TYPE_COLOR_MAP, PRIORITY_VARIANT_MAP, PRIORITY_CHOICES } from "./constants";

/** Valid organization types matching database enum */
export type OrganizationType = "customer" | "prospect" | "principal" | "distributor" | "unknown";

/** Valid priority levels matching database enum */
export type PriorityLevel = "A" | "B" | "C" | "D";

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
 * - unknown: tag-gray (Mushroom - neutral)
 */
export function OrganizationTypeBadge({ type }: OrganizationTypeBadgeProps) {
  const colorClass = ORG_TYPE_COLOR_MAP[type as OrganizationType] || "tag-gray";

  return (
    <Badge className={`text-xs px-2 py-1 ${colorClass}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

/**
 * Displays priority level with semantic status colors
 *
 * Variant mapping:
 * - A (High): destructive (red - urgent attention)
 * - B (Medium-High): default (primary green)
 * - C (Medium): secondary (muted)
 * - D (Low): outline (minimal emphasis)
 */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const variant = PRIORITY_VARIANT_MAP[priority as PriorityLevel] || "default";
  const label = PRIORITY_CHOICES.find(p => p.id === priority)?.name || priority;

  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {label}
    </Badge>
  );
}
