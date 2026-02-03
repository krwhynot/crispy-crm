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
import { ucFirst } from "@/atomic-crm/utils";
import {
  ORG_TYPE_COLOR_MAP,
  PRIORITY_VARIANT_MAP,
  PRIORITY_CHOICES,
  getSegmentColor,
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
export const OrganizationTypeBadge = memo(function OrganizationTypeBadge({
  type,
}: OrganizationTypeBadgeProps) {
  const colorClass = ORG_TYPE_COLOR_MAP[type as OrganizationType] || "tag-gray";

  return <Badge className={`text-xs px-2 py-1 ${colorClass}`}>{ucFirst(type)}</Badge>;
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

interface SegmentBadgeProps {
  /** Segment UUID from record.segment_id - used for color lookup */
  segmentId: string | null | undefined;
  /** Segment display name from record.segment_name */
  segmentName: string | null | undefined;
}

/**
 * Displays segment name with color-coded tag
 *
 * Color Strategy:
 * - Playbook segments (9): Distinct colors mapped by UUID (tag-blue, tag-green, etc.)
 * - Operator segments (16+): Default to tag-gray (too many for unique colors)
 * - NULL: Shows "—" placeholder
 *
 * NOTE: Wrapped in min-h-[44px] container by FilterableBadge for touch target compliance.
 * Raw badge height is ~24px; wrapper ensures WCAG AA compliance (44px minimum).
 */
export const SegmentBadge = memo(function SegmentBadge({
  segmentId,
  segmentName,
}: SegmentBadgeProps) {
  if (!segmentName) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const colorClass = getSegmentColor(segmentId);

  return <Badge className={`text-xs px-2 py-1 ${colorClass}`}>{segmentName}</Badge>;
});

SegmentBadge.displayName = "SegmentBadge";
