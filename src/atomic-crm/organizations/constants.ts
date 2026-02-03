/**
 * Centralized constants for organizations
 * Maintains single source of truth for organization types, priorities, and related data
 */

/**
 * Organization type classification
 * - customer: Active paying customer (includes restaurants/foodservice)
 * - prospect: Potential customer in sales pipeline
 * - principal: Food manufacturer whose products MFB represents
 * - distributor: Company that buys from principals and distributes (Sysco, USF, etc.)
 */
export type OrganizationType = "customer" | "prospect" | "principal" | "distributor";

/**
 * Priority level for organizations
 * A-D scale where A is highest priority, D is lowest
 */
export type PriorityLevel = "A" | "B" | "C" | "D";

/**
 * Organization type choices for React Admin SelectInput
 * Uses id/name format for compatibility with SelectInput component
 */
export const ORGANIZATION_TYPE_CHOICES = [
  { id: "prospect", name: "Prospect" }, // Most common (80%) - show first
  { id: "customer", name: "Customer" },
  { id: "principal", name: "Principal" },
  { id: "distributor", name: "Distributor" },
] as const;

/**
 * Organization type descriptions for tooltips/help text
 * Maps each type ID to a user-friendly explanation
 */
export const ORGANIZATION_TYPE_DESCRIPTIONS: Record<OrganizationType, string> = {
  customer: "Active buying accounts with existing orders",
  prospect: "Potential customers being pursued",
  principal: "Food manufacturers MFB represents",
  distributor: "Partners who warehouse and deliver products",
};

/**
 * Priority choices for React Admin SelectInput
 * A: High priority (immediate attention)
 * B: Medium-High priority (important but not urgent)
 * C: Medium priority (routine attention)
 * D: Low priority (minimal attention)
 */
export const PRIORITY_CHOICES = [
  { id: "A", name: "A - High" },
  { id: "B", name: "B - Medium-High" },
  { id: "C", name: "C - Medium" },
  { id: "D", name: "D - Low" },
] as const;

/**
 * Organization type to tag CSS class mapping
 * Uses MFB Garden to Table theme colors:
 * - customer: tag-warm (Clay Orange - welcoming, active relationship)
 * - prospect: tag-sage (Olive Green - growth potential)
 * - principal: tag-purple (Eggplant - important/primary)
 * - distributor: tag-teal (Active/connected in supply chain)
 */
export const ORG_TYPE_COLOR_MAP: Record<OrganizationType, string> = {
  customer: "tag-warm",
  prospect: "tag-sage",
  principal: "tag-purple",
  distributor: "tag-teal",
};

/**
 * Playbook category color mapping
 * Maps segment UUIDs to tag color classes
 * Only playbook segments get distinct colors; operator segments default to tag-gray
 * Avoids org-type colors (warm, sage, purple, teal) to prevent confusion
 */
import { PLAYBOOK_CATEGORY_IDS } from "@/atomic-crm/validation/segments";
import { PLAYBOOK_CATEGORY_CHOICES } from "@/atomic-crm/validation/segments";
import { OPERATOR_SEGMENT_CHOICES } from "@/atomic-crm/validation/operatorSegments";

const PLAYBOOK_COLORS: Record<string, string> = {
  [PLAYBOOK_CATEGORY_IDS["Major Broadline"]]: "tag-blue",
  [PLAYBOOK_CATEGORY_IDS["Specialty/Regional"]]: "tag-green",
  [PLAYBOOK_CATEGORY_IDS["Management Company"]]: "tag-cocoa",
  [PLAYBOOK_CATEGORY_IDS.GPO]: "tag-amber",
  [PLAYBOOK_CATEGORY_IDS.University]: "tag-clay",
  [PLAYBOOK_CATEGORY_IDS["Restaurant Group"]]: "tag-pink",
  [PLAYBOOK_CATEGORY_IDS["Chain Restaurant"]]: "tag-yellow",
  [PLAYBOOK_CATEGORY_IDS["Hotel & Aviation"]]: "tag-gray",
  [PLAYBOOK_CATEGORY_IDS.Unknown]: "tag-gray",
};

/**
 * Get tag color for a segment
 * @param segmentId - Segment UUID from organization record
 * @returns Tag color class (tag-gray for operator segments and unknowns)
 */
export function getSegmentColor(segmentId: string | null | undefined): string {
  if (!segmentId) return "tag-gray";
  return PLAYBOOK_COLORS[segmentId] ?? "tag-gray"; // Operator segments default to gray
}

/**
 * All segment choices for filter dropdowns
 * Combines playbook (9) and operator (16+) segments
 * Follows US_STATES pattern for handling 25+ choices with built-in scroll
 */
export const SEGMENT_CHOICES = [
  ...PLAYBOOK_CATEGORY_CHOICES, // 9 playbook categories first
  ...OPERATOR_SEGMENT_CHOICES, // 16+ operator segments after
] as const;

/**
 * Priority to badge variant mapping
 * Uses brand emphasis instead of error semantics for high priority
 * - A: default (brand primary - high importance, not danger)
 * - B: secondary (standard importance)
 * - C: outline (routine)
 * - D: outline (minimal - component should add text-muted-foreground)
 */
export const PRIORITY_VARIANT_MAP: Record<PriorityLevel, "default" | "secondary" | "outline"> = {
  A: "default", // Brand primary - importance without alarm
  B: "secondary", // Standard emphasis
  C: "outline", // Routine
  D: "outline", // Minimal
};

/**
 * Organization scope choices for distributor modeling
 * - national: Brand/HQ level organization
 * - regional: Regional operating company
 * - local: Local/single-location entity
 */
export const ORG_SCOPE_CHOICES = [
  { id: "national", name: "National" },
  { id: "regional", name: "Regional" },
  { id: "local", name: "Local" },
] as const;

/**
 * Organization status choices
 * - active: Currently active organization
 * - inactive: Inactive organization
 */
export const STATUS_CHOICES = [
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
] as const;

/**
 * Status reason choices - explains why organization is in current status
 * - active_customer: Currently active customer
 * - prospect: Prospective customer
 * - authorized_distributor: Authorized to distribute products
 * - account_closed: Account has been closed
 * - out_of_business: Organization is no longer in business
 * - disqualified: Disqualified from consideration
 */
export const STATUS_REASON_CHOICES = [
  { id: "active_customer", name: "Active Customer" },
  { id: "prospect", name: "Prospect" },
  { id: "authorized_distributor", name: "Authorized Distributor" },
  { id: "account_closed", name: "Account Closed" },
  { id: "out_of_business", name: "Out of Business" },
  { id: "disqualified", name: "Disqualified" },
] as const;

/**
 * Payment terms choices for business transactions
 * - net_30: Payment due in 30 days
 * - net_60: Payment due in 60 days
 * - net_90: Payment due in 90 days
 * - cod: Cash on delivery
 * - prepaid: Payment required in advance
 * - 2_10_net_30: 2% discount if paid within 10 days, otherwise net 30
 */
export const PAYMENT_TERMS_CHOICES = [
  { id: "net_30", name: "Net 30" },
  { id: "net_60", name: "Net 60" },
  { id: "net_90", name: "Net 90" },
  { id: "cod", name: "COD" },
  { id: "prepaid", name: "Prepaid" },
  { id: "2_10_net_30", name: "2/10 Net 30" },
] as const;

/**
 * US States for address forms
 * Complete list of 50 US states with 2-letter postal codes
 */
export const US_STATES = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  { id: "AZ", name: "Arizona" },
  { id: "AR", name: "Arkansas" },
  { id: "CA", name: "California" },
  { id: "CO", name: "Colorado" },
  { id: "CT", name: "Connecticut" },
  { id: "DE", name: "Delaware" },
  { id: "FL", name: "Florida" },
  { id: "GA", name: "Georgia" },
  { id: "HI", name: "Hawaii" },
  { id: "ID", name: "Idaho" },
  { id: "IL", name: "Illinois" },
  { id: "IN", name: "Indiana" },
  { id: "IA", name: "Iowa" },
  { id: "KS", name: "Kansas" },
  { id: "KY", name: "Kentucky" },
  { id: "LA", name: "Louisiana" },
  { id: "ME", name: "Maine" },
  { id: "MD", name: "Maryland" },
  { id: "MA", name: "Massachusetts" },
  { id: "MI", name: "Michigan" },
  { id: "MN", name: "Minnesota" },
  { id: "MS", name: "Mississippi" },
  { id: "MO", name: "Missouri" },
  { id: "MT", name: "Montana" },
  { id: "NE", name: "Nebraska" },
  { id: "NV", name: "Nevada" },
  { id: "NH", name: "New Hampshire" },
  { id: "NJ", name: "New Jersey" },
  { id: "NM", name: "New Mexico" },
  { id: "NY", name: "New York" },
  { id: "NC", name: "North Carolina" },
  { id: "ND", name: "North Dakota" },
  { id: "OH", name: "Ohio" },
  { id: "OK", name: "Oklahoma" },
  { id: "OR", name: "Oregon" },
  { id: "PA", name: "Pennsylvania" },
  { id: "RI", name: "Rhode Island" },
  { id: "SC", name: "South Carolina" },
  { id: "SD", name: "South Dakota" },
  { id: "TN", name: "Tennessee" },
  { id: "TX", name: "Texas" },
  { id: "UT", name: "Utah" },
  { id: "VT", name: "Vermont" },
  { id: "VA", name: "Virginia" },
  { id: "WA", name: "Washington" },
  { id: "WV", name: "West Virginia" },
  { id: "WI", name: "Wisconsin" },
  { id: "WY", name: "Wyoming" },
] as const;

/**
 * Pagination constants for organization lists and related items
 */

/**
 * Default page size for organization list views
 */
export const DEFAULT_LIST_PAGE_SIZE = 25;

/**
 * Maximum number of related items to display
 * (e.g., contacts, opportunities, activities)
 */
export const MAX_RELATED_ITEMS = 100;

/**
 * Page size for activity timeline displays
 * @deprecated Use ACTIVITY_PAGE_SIZE from activities/constants.ts instead
 * Kept for backward compatibility - will be removed in future cleanup
 */
export const ACTIVITY_PAGE_SIZE = 50;

/**
 * Hierarchy filter value objects for ToggleFilterButton
 * Keys use PostgREST operator syntax (field@operator)
 * Values are JS null (not string "null") — provider transforms to "field=is.null"
 */
export const HIERARCHY_FILTERS = {
  HAS_BRANCHES: { "child_branch_count@gt": 0 },
  HAS_PARENT: { "parent_organization_id@not.is": null },
  ROOT_ONLY: { "parent_organization_id@is": null },
} as const;

/**
 * Touch target minimum height for WCAG AA compliance (Fitts's Law)
 * 44px minimum ensures reliable touch/click interaction
 */
export const TOUCH_TARGET_MIN_HEIGHT = "h-11";
export const BADGE_TOUCH_CLASSES =
  "text-xs px-3 py-2 min-h-[44px] flex items-center justify-center";
