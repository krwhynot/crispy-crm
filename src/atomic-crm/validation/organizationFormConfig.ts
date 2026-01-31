/**
 * Organization Form Configuration
 *
 * Centralizes implicit form configuration contracts into explicit, typed constants.
 * Extracts 4 contracts hidden in OrganizationInputs.tsx:
 * 1. Schema Variants - different required fields per form
 * 2. Default Values - controlled defaults vs required inputs
 * 3. Required Field Metadata - which fields must be explicitly selected
 * 4. Field Preservation - metadata fields that must survive form submissions
 *
 * CRITICAL:
 * - Place in validation/ layer to prevent circular imports
 * - Logic layer (validation) never imports from View layer (organizations)
 * - Follows pattern in types.ts (re-exports from validation)
 */

import type {
  OrganizationType,
  OrganizationPriority,
  OrgStatus,
  OrgStatusReason,
  OrgScope,
  PaymentTerms,
} from "./organizations";
import { UNKNOWN_SEGMENT_ID } from "./segments";

/**
 * Form Variants - different schema/default configurations per form type
 */
export interface OrganizationFormVariant {
  /**
   * Schema variant identifier
   */
  variant: "create" | "edit" | "quickCreate";

  /**
   * Fields that MUST be explicitly selected (no silent defaults)
   */
  requiredFields: readonly string[];

  /**
   * Fields with controlled defaults (auto-filled)
   */
  defaultValues: Partial<OrganizationFormDefaults>;

  /**
   * Whether to allow "Unknown" segment selection
   */
  allowUnknownSegment: boolean;

  /**
   * Fields to preserve from original record during update
   * (prevents metadata stripping)
   */
  preserveFields: readonly string[];
}

/**
 * Default values for organization forms
 * These are controlled defaults that auto-fill fields
 */
export interface OrganizationFormDefaults {
  organization_type: OrganizationType;
  priority: OrganizationPriority;
  status: OrgStatus;
  status_reason: OrgStatusReason | null;
  is_operating_entity: boolean;
  billing_country: string;
  shipping_country: string;
  needs_review: boolean;
  org_scope: OrgScope | null;
  payment_terms: PaymentTerms | null;
}

/**
 * Form Variant Configurations
 *
 * Consolidates behavior previously scattered across:
 * - OrganizationCreate (full form)
 * - OrganizationEdit (edit form)
 * - QuickCreatePopover (minimal form)
 */
export const ORGANIZATION_FORM_VARIANTS: Record<
  OrganizationFormVariant["variant"],
  OrganizationFormVariant
> = {
  /**
   * Full Create Form (OrganizationCreate)
   * - Stricter validation: NO "Unknown" segment
   * - All core business fields required
   * - Preserves parent/type/owner for "Save & Add Another" workflow
   */
  create: {
    variant: "create",
    requiredFields: ["name", "organization_type", "sales_id", "segment_id", "priority", "status"],
    defaultValues: {
      organization_type: "prospect", // Default type for new organizations
      priority: "C", // Default priority for new organizations
      status: "active", // New orgs default to active
      status_reason: "prospect", // Matches most common case (80%)
      is_operating_entity: true, // Most orgs are operating entities
      billing_country: "US", // Default country
      shipping_country: "US", // Default country
      needs_review: false, // New manual entries don't need review
    },
    allowUnknownSegment: false, // Enforced: segment_id !== UNKNOWN_SEGMENT_ID
    preserveFields: ["parent_organization_id", "organization_type", "sales_id"],
  },

  /**
   * Edit Form (OrganizationEdit)
   * - More flexible: allows "Unknown" segment (can clean up later)
   * - Preserves system metadata (id, created_at, updated_at, etc.)
   */
  edit: {
    variant: "edit",
    requiredFields: ["name", "organization_type", "priority", "status"],
    defaultValues: {}, // No defaults - preserve existing values
    allowUnknownSegment: true, // Can set to Unknown during edit
    preserveFields: [
      "id",
      "created_at",
      "created_by",
      "updated_at",
      "updated_by",
      "deleted_at",
      "nb_contacts",
      "nb_opportunities",
      "nb_notes",
      "import_session_id",
    ] as const,
  },

  /**
   * Quick Create Popover (QuickCreatePopover)
   * - Minimal required fields: name, type, segment
   * - Allows "Unknown" segment (prioritizes speed)
   * - Auto-assigns priority based on organization_type
   */
  quickCreate: {
    variant: "quickCreate",
    requiredFields: ["name", "organization_type", "segment_id", "priority"],
    defaultValues: {
      organization_type: "prospect", // Default type for new organizations
      priority: "C", // Default priority for new organizations
      status: "active", // Quick create implies active
      status_reason: "prospect", // Most common case
      is_operating_entity: true,
      billing_country: "US",
      shipping_country: "US",
      needs_review: false,
    },
    allowUnknownSegment: true, // Speed over precision
    preserveFields: [],
  },
} as const;

/**
 * Required Field Metadata
 * Documents why each field is required and which forms enforce it
 */
export const REQUIRED_FIELD_METADATA = {
  name: {
    reason: "Business identity - every organization must have a name",
    forms: ["create", "edit", "quickCreate"],
  },
  organization_type: {
    reason: "Drives segment type selection (playbook vs operator)",
    forms: ["create", "edit", "quickCreate"],
  },
  sales_id: {
    reason: "Account ownership - every org must have an owner",
    forms: ["create"],
  },
  segment_id: {
    reason: "Business classification - required for pipeline reporting",
    forms: ["create", "quickCreate"],
    validation: {
      create: "Must not be 'Unknown' - select specific segment",
      quickCreate: "Can be 'Unknown' - allows fast data entry",
      edit: "Can be 'Unknown' - allows cleanup of bad data",
    },
  },
  priority: {
    reason: "Sales prioritization - A/B/C/D drives follow-up cadence",
    forms: ["create", "edit", "quickCreate"],
  },
  status: {
    reason: "Lifecycle state - active vs inactive affects RLS visibility",
    forms: ["create", "edit"],
  },
} as const;

/**
 * Get validation rules for a specific form variant
 */
export function getFormVariant(
  variant: OrganizationFormVariant["variant"]
): OrganizationFormVariant {
  return ORGANIZATION_FORM_VARIANTS[variant];
}

/**
 * Check if a field is required for a specific form variant
 */
export function isFieldRequired(
  variant: OrganizationFormVariant["variant"],
  fieldName: string
): boolean {
  return ORGANIZATION_FORM_VARIANTS[variant].requiredFields.includes(fieldName);
}

/**
 * Check if "Unknown" segment is allowed for a form variant
 */
export function isUnknownSegmentAllowed(variant: OrganizationFormVariant["variant"]): boolean {
  return ORGANIZATION_FORM_VARIANTS[variant].allowUnknownSegment;
}

/**
 * Validate segment_id based on form variant
 * Returns error message if invalid, undefined if valid
 */
export function validateSegmentForVariant(
  variant: OrganizationFormVariant["variant"],
  segmentId: string | null | undefined
): string | undefined {
  if (!segmentId) {
    return "Please select a segment";
  }

  // Check if Unknown segment is allowed
  if (segmentId === UNKNOWN_SEGMENT_ID && !isUnknownSegmentAllowed(variant)) {
    return "Please select a specific segment (not 'Unknown')";
  }

  return undefined;
}
