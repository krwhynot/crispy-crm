/**
 * Centralized constants for organizations
 * Maintains single source of truth for organization types, priorities, and related data
 */

/**
 * Organization type classification
 * - customer: Active paying customer
 * - prospect: Potential customer in sales pipeline
 * - principal: Food manufacturer whose products MFB represents
 * - distributor: Company that buys from principals and distributes
 * - unknown: Unclassified organization
 */
export type OrganizationType = "customer" | "prospect" | "principal" | "distributor" | "unknown";

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
  { id: "customer", name: "Customer" },
  { id: "prospect", name: "Prospect" },
  { id: "principal", name: "Principal" },
  { id: "distributor", name: "Distributor" },
  { id: "unknown", name: "Unknown" },
] as const;

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
 * - unknown: tag-gray (Mushroom - neutral/unclassified)
 */
export const ORG_TYPE_COLOR_MAP: Record<OrganizationType, string> = {
  customer: "tag-warm",
  prospect: "tag-sage",
  principal: "tag-purple",
  distributor: "tag-teal",
  unknown: "tag-gray",
};

/**
 * Priority to badge variant mapping
 * Uses brand emphasis instead of error semantics for high priority
 * - A: default (brand primary - high importance, not danger)
 * - B: secondary (standard importance)
 * - C: outline (routine)
 * - D: outline (minimal - component should add text-muted-foreground)
 */
export const PRIORITY_VARIANT_MAP: Record<PriorityLevel, "default" | "secondary" | "outline"> = {
  A: "default",      // Brand primary - importance without alarm
  B: "secondary",    // Standard emphasis
  C: "outline",      // Routine
  D: "outline",      // Minimal
};

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
 */
export const ACTIVITY_PAGE_SIZE = 50;

/**
 * Touch target minimum height for WCAG AA compliance (Fitts's Law)
 * 44px minimum ensures reliable touch/click interaction
 */
export const TOUCH_TARGET_MIN_HEIGHT = "h-11";
export const BADGE_TOUCH_CLASSES = "text-xs px-3 py-2 min-h-[44px] flex items-center justify-center";
