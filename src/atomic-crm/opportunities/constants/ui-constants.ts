/**
 * UI constants and filter configuration
 * Depends on: stage-enums, stage-config
 */

import { OPPORTUNITY_STAGE_CHOICES } from "./stage-config";

// ============================================================================
// UI CONSTANTS
// ============================================================================

/** Minimum width for detail field columns (150px) */
export const DETAIL_FIELD_MIN_WIDTH = "min-w-[150px]";

/** Touch target minimum height - WCAG AA compliant (44px) */
export const TOUCH_TARGET_MIN_HEIGHT = "min-h-[44px]";

// ============================================================================
// LEAD SOURCE CHOICES
// ============================================================================

/**
 * Lead source choices
 * Extracted from LeadSourceInput.tsx to support Fast Refresh
 */
export const LEAD_SOURCE_CHOICES = [
  { id: "referral", name: "Referral" },
  { id: "trade_show", name: "Trade Show" },
  { id: "website", name: "Website" },
  { id: "cold_call", name: "Cold Call" },
  { id: "email_campaign", name: "Email Campaign" },
  { id: "social_media", name: "Social Media" },
  { id: "partner", name: "Partner" },
  { id: "existing_customer", name: "Existing Customer" },
];

// ============================================================================
// PRIORITY CHOICES
// ============================================================================

/**
 * Priority choice definitions for opportunities
 * Centralized to maintain single source of truth
 */
export const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

/**
 * Re-export for convenience (aliased names for backward compatibility)
 */
export { OPPORTUNITY_STAGE_CHOICES as stageChoices };
