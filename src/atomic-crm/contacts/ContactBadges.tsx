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

import { memo } from "react";
import { Badge } from "@/components/ui/badge";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Valid contact status levels matching database/configuration values */
export type ContactStatus = "cold" | "warm" | "hot" | "in-contract";

/**
 * Contact role within an organization's buying process
 *
 * Matches database enum: public.contact_role
 * Based on BANT/MEDDIC sales methodology:
 * - decision_maker: Has authority to approve purchases
 * - influencer: Technical evaluator or department head
 * - buyer: Handles procurement/purchasing process
 * - end_user: Day-to-day user of the product/service
 * - gatekeeper: Controls access to decision makers
 * - champion: Internal advocate who drives the deal
 * - technical: Technical evaluator/implementer
 * - executive: C-level with budget authority
 */
export type ContactRole =
  | "decision_maker"
  | "influencer"
  | "buyer"
  | "end_user"
  | "gatekeeper"
  | "champion"
  | "technical"
  | "executive";

/**
 * Contact influence level on purchasing decisions
 *
 * Maps from database smallint (1-5) to semantic levels:
 * - 5: Critical (can approve/veto unilaterally)
 * - 4: High (significant decision power)
 * - 3: Medium (meaningful input, needs consensus)
 * - 2: Low (provides feedback, limited power)
 * - 1: Minimal (informed but not involved in decisions)
 */
export type InfluenceLevel = "critical" | "high" | "medium" | "low" | "minimal";

// =============================================================================
// PROP INTERFACES
// =============================================================================

interface ContactStatusBadgeProps {
  /** Contact status from record.status */
  status: ContactStatus | string;
}

interface RoleBadgeProps {
  /** Contact's role in the buying process (from contacts.role field) */
  role: ContactRole | string;
}

interface InfluenceBadgeProps {
  /** Contact's influence level (string) or purchase_influence score (number 1-5) */
  influence: InfluenceLevel | string | number;
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
export const ContactStatusBadge = memo(function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  // Handle null/undefined status gracefully - return placeholder
  if (!status) {
    return <Badge className="text-xs px-2 py-1 tag-gray">--</Badge>;
  }

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

  return <Badge className={`text-xs px-2 py-1 ${className}`}>{label}</Badge>;
});

ContactStatusBadge.displayName = "ContactStatusBadge";

/**
 * Displays contact's role in the buying process
 *
 * Color mapping (emphasizes hierarchy and function):
 * - executive: tag-purple (Eggplant - authority/importance)
 * - decision_maker: tag-purple (Same as executive - authority)
 * - champion: tag-teal (Active/connected - internal ally)
 * - influencer: tag-warm (Clay Orange - engaged/involved)
 * - technical: tag-blue (Technical evaluator)
 * - buyer: tag-sage (Procurement - transactional)
 * - gatekeeper: tag-amber (Caution - controls access)
 * - end_user: tag-gray (Mushroom - neutral/standard)
 *
 * Matches database enum: public.contact_role
 */
export const RoleBadge = memo(function RoleBadge({ role }: RoleBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    executive: { label: "Executive", className: "tag-purple" },
    decision_maker: { label: "Decision Maker", className: "tag-purple" },
    champion: { label: "Champion", className: "tag-teal" },
    influencer: { label: "Influencer", className: "tag-warm" },
    technical: { label: "Technical", className: "tag-blue" },
    buyer: { label: "Buyer", className: "tag-sage" },
    gatekeeper: { label: "Gatekeeper", className: "tag-amber" },
    end_user: { label: "End User", className: "tag-gray" },
  };

  const { label, className } = config[role] || {
    // Handle unknown roles gracefully with title case
    label: role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    className: "tag-gray",
  };

  return <Badge className={`text-xs px-2 py-1 ${className}`}>{label}</Badge>;
});

RoleBadge.displayName = "RoleBadge";

/**
 * Displays contact's influence level with semantic status colors
 *
 * Accepts either:
 * - String level: "critical" | "high" | "medium" | "low" | "minimal"
 * - Numeric score: 1-5 (maps to levels automatically)
 *
 * Uses Badge variants (not tag classes) for visual distinction:
 * - critical/5: destructive (red - highest importance)
 * - high/4: default (primary green - significant)
 * - medium/3: secondary (muted - moderate)
 * - low/2: outline (minimal emphasis)
 * - minimal/1: outline (lowest emphasis)
 *
 * This follows PriorityBadge pattern from OrganizationBadges.tsx
 */
export const InfluenceBadge = memo(function InfluenceBadge({ influence }: InfluenceBadgeProps) {
  type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

  // Convert numeric score (1-5) to semantic level
  const normalizedInfluence = typeof influence === "number" ? numericToLevel(influence) : influence;

  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    critical: { label: "Critical", variant: "destructive" },
    high: { label: "High", variant: "default" },
    medium: { label: "Medium", variant: "secondary" },
    low: { label: "Low", variant: "outline" },
    minimal: { label: "Minimal", variant: "outline" },
  };

  const { label, variant } = config[normalizedInfluence] || {
    label:
      typeof influence === "number"
        ? `Level ${influence}`
        : influence.charAt(0).toUpperCase() + influence.slice(1),
    variant: "outline" as BadgeVariant,
  };

  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {label}
    </Badge>
  );
});

InfluenceBadge.displayName = "InfluenceBadge";

/**
 * Converts numeric purchase_influence (1-5) to semantic level
 */
function numericToLevel(score: number): InfluenceLevel {
  if (score >= 5) return "critical";
  if (score >= 4) return "high";
  if (score >= 3) return "medium";
  if (score >= 2) return "low";
  return "minimal";
}

// =============================================================================
// COMPOSITE BADGE (Optional - for dense displays)
// =============================================================================

interface ContactBadgeGroupProps {
  status?: ContactStatus | string;
  role?: ContactRole | string;
  influence?: InfluenceLevel | string | number;
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
 *   influence={4}
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
      {influence !== undefined && <InfluenceBadge influence={influence} />}
    </div>
  );
}
