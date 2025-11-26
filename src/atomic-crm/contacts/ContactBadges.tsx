/**
 * Contact Badge Components
 *
 * Extracted for reusability across:
 * - ContactList (table cells)
 * - ContactSlideOver (detail view)
 * - ContactListFilter (filter chips)
 *
 * Uses semantic tag colors from the MFB Garden to Table theme.
 * Pattern follows OrganizationBadges.tsx for consistency.
 *
 * @see OrganizationBadges.tsx - Reference implementation
 * @see src/index.css - OKLCH tag color definitions (lines 406-431)
 */

import { Badge } from "@/components/ui/badge";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Valid contact status levels matching database/configuration values */
export type ContactStatus = "cold" | "warm" | "hot" | "in-contract";

/**
 * Contact role within an organization's buying process
 *
 * Based on BANT/MEDDIC sales methodology:
 * - executive: C-level decision maker with budget authority
 * - champion: Internal advocate who drives the deal
 * - influencer: Technical evaluator or department head
 * - end-user: Day-to-day user of the product/service
 */
export type ContactRole = "executive" | "champion" | "influencer" | "end-user";

/**
 * Contact influence level on purchasing decisions
 *
 * Indicates the contact's relative power in the buying process:
 * - high: Can approve or veto decisions unilaterally
 * - medium: Significant input but needs consensus
 * - low: Provides feedback but limited decision power
 */
export type InfluenceLevel = "high" | "medium" | "low";

// =============================================================================
// PROP INTERFACES
// =============================================================================

interface ContactStatusBadgeProps {
  /** Contact status from record.status */
  status: ContactStatus | string;
}

interface RoleBadgeProps {
  /** Contact's role in the buying process */
  role: ContactRole | string;
}

interface InfluenceBadgeProps {
  /** Contact's influence level */
  influence: InfluenceLevel | string;
}

// =============================================================================
// BADGE COMPONENTS
// =============================================================================

/**
 * Displays contact engagement status with semantic colors
 *
 * Color mapping (MFB Garden to Table theme):
 * - cold: tag-blue (Cool/dormant - needs nurturing)
 * - warm: tag-amber (Engaged - showing interest)
 * - hot: tag-pink (Urgent/active - ready to buy)
 * - in-contract: tag-sage (Success - deal closed)
 *
 * WCAG AA Contrast: All tag colors use oklch(20% 0.02 85) foreground
 * against light backgrounds (85%+ lightness) = ~10:1 contrast ratio
 */
export function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    cold: { label: "Cold", className: "tag-blue" },
    warm: { label: "Warm", className: "tag-amber" },
    hot: { label: "Hot", className: "tag-pink" },
    "in-contract": { label: "Contract", className: "tag-sage" },
  };

  const { label, className } = config[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: "tag-gray",
  };

  return (
    <Badge className={`text-xs px-2 py-1 ${className}`}>
      {label}
    </Badge>
  );
}

/**
 * Displays contact's role in the buying process
 *
 * Color mapping (emphasizes hierarchy):
 * - executive: tag-purple (Eggplant - authority/importance)
 * - champion: tag-teal (Active/connected - internal ally)
 * - influencer: tag-warm (Clay Orange - engaged/involved)
 * - end-user: tag-gray (Mushroom - neutral/standard)
 *
 * Icons would enhance this but keeping text-only for consistency
 * with OrganizationBadges pattern.
 */
export function RoleBadge({ role }: RoleBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    executive: { label: "Executive", className: "tag-purple" },
    champion: { label: "Champion", className: "tag-teal" },
    influencer: { label: "Influencer", className: "tag-warm" },
    "end-user": { label: "End User", className: "tag-gray" },
  };

  const { label, className } = config[role] || {
    label: role.charAt(0).toUpperCase() + role.slice(1),
    className: "tag-gray",
  };

  return (
    <Badge className={`text-xs px-2 py-1 ${className}`}>
      {label}
    </Badge>
  );
}

/**
 * Displays contact's influence level with semantic status colors
 *
 * Uses Badge variants (not tag classes) for visual distinction:
 * - high: destructive (red - critical importance)
 * - medium: default (primary green - standard importance)
 * - low: secondary (muted - lower priority)
 *
 * This follows PriorityBadge pattern from OrganizationBadges.tsx
 */
export function InfluenceBadge({ influence }: InfluenceBadgeProps) {
  type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    high: { label: "High Influence", variant: "destructive" },
    medium: { label: "Medium Influence", variant: "default" },
    low: { label: "Low Influence", variant: "secondary" },
  };

  const { label, variant } = config[influence] || {
    label: influence.charAt(0).toUpperCase() + influence.slice(1),
    variant: "outline" as BadgeVariant,
  };

  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {label}
    </Badge>
  );
}

// =============================================================================
// COMPOSITE BADGE (Optional - for dense displays)
// =============================================================================

interface ContactBadgeGroupProps {
  status?: ContactStatus | string;
  role?: ContactRole | string;
  influence?: InfluenceLevel | string;
  /** Render direction */
  direction?: "horizontal" | "vertical";
}

/**
 * Renders multiple contact badges in a group
 *
 * Useful for slide-over detail views where multiple badges
 * should be displayed together with consistent spacing.
 *
 * @example
 * <ContactBadgeGroup
 *   status="warm"
 *   role="champion"
 *   influence="high"
 * />
 */
export function ContactBadgeGroup({
  status,
  role,
  influence,
  direction = "horizontal",
}: ContactBadgeGroupProps) {
  const gapClass = direction === "horizontal" ? "flex-row gap-2" : "flex-col gap-1";

  return (
    <div className={`flex flex-wrap ${gapClass}`}>
      {status && <ContactStatusBadge status={status} />}
      {role && <RoleBadge role={role} />}
      {influence && <InfluenceBadge influence={influence} />}
    </div>
  );
}
