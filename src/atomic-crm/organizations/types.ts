/**
 * Organization module types
 *
 * Centralized TypeScript types for the Organizations feature.
 * Eliminates `any` usage by providing proper typing for:
 * - CSV import/export workflows
 * - React Admin record callbacks
 * - Form handlers and transformations
 *
 * @see Engineering Constitution - No `any` types
 */

import type { RaRecord, Identifier } from "react-admin";

// Re-export canonical types from validation for convenience
export type {
  Organization,
  OrganizationType,
  OrganizationPriority,
} from "../validation/organizations";

// Re-export import schema types
export type {
  OrganizationImportSchema,
  ValidationResult,
  DuplicateReport,
  TransformResult,
} from "./organizationImport.logic";

// Import for use in this file
import type { Organization, OrganizationType, OrganizationPriority } from "../validation/organizations";
import type { OrganizationImportSchema } from "./organizationImport.logic";

// =====================================================================
// CSV Import Types
// =====================================================================

/**
 * Raw row from Papa Parse before column mapping
 * Each element is a string value from the CSV cell
 */
export type RawCSVRow = string[];

/**
 * Row after column mapping but before validation
 * Keys are field names, values are string | undefined
 */
export interface MappedCSVRow {
  name?: string;
  organization_type?: string;
  priority?: string;
  segment_id?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  linkedin_url?: string;
  description?: string;
  website?: string;
  parent_organization_id?: string;
  sales_id?: string;
  tags?: string;
  [key: string]: string | undefined;
}

/**
 * Import validation error for a single row
 */
export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

/**
 * Result of importing a batch of organizations
 */
export interface ImportBatchResult {
  success: number;
  failed: number;
  errors: ImportRowError[];
}

/**
 * Import state for preview and progress
 */
export interface ImportPreviewState {
  parsedData: OrganizationImportSchema[];
  sampleRows: RawCSVRow[];
  headers: string[];
  totalRows: number;
}

// =====================================================================
// CSV Export Types
// =====================================================================

/**
 * Flattened organization for CSV export
 * All nested objects are converted to primitive values
 */
export interface OrganizationExportRow {
  id: Identifier;
  name: string;
  organization_type: OrganizationType;
  priority: OrganizationPriority | null;
  segment_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  website: string | null;
  linkedin_url: string | null;
  description: string | null;
  nb_contacts: number;
  nb_opportunities: number;
  created_at: string;
}

// =====================================================================
// React Admin Integration Types
// =====================================================================

/**
 * Organization record as received from React Admin
 * Extends Organization with computed fields from database views
 */
export interface OrganizationRecord extends Organization {
  // Ensure id is always present for RA records
  id: Identifier;
  // Computed fields from database views
  nb_contacts?: number;
  nb_opportunities?: number;
  nb_notes?: number;
}

/**
 * Props for tab components that receive a record
 */
export interface OrganizationTabProps {
  record: OrganizationRecord;
}

/**
 * Tab configuration for SlideOver component
 */
export interface OrganizationSlideOverTab {
  label: string;
  count?: number;
  countFromRecord: (record: OrganizationRecord) => number;
}

// =====================================================================
// Form Handler Types
// =====================================================================

/**
 * Form values for organization create/edit
 * Partial because not all fields are required
 */
export type OrganizationFormValues = Partial<Organization>;

/**
 * Transform result for API submission
 * Contains only the fields that should be sent to the API
 */
export interface OrganizationTransformResult {
  name: string;
  organization_type: OrganizationType;
  priority?: OrganizationPriority;
  segment_id?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  linkedin_url?: string | null;
  website?: string | null;
  description?: string | null;
  sales_id?: string | number | null;
  parent_organization_id?: string | number | null;
  tags?: string;
}

/**
 * Duplicate check callback signature
 */
export type DuplicateCheckCallback = (name: string, values: OrganizationFormValues) => void;

// =====================================================================
// Component Props Types
// =====================================================================

/**
 * Context link type for organization details
 */
export interface ContextLink {
  url: string;
  label?: string;
}

/**
 * Email entry with type for contacts
 */
export interface EmailEntry {
  value: string;
  type: "work" | "home" | "other";
}

// =====================================================================
// Import Preview Types
// =====================================================================

/**
 * Field mapping configuration
 * Maps CSV column index to organization field name
 */
export interface ColumnMapping {
  columnIndex: number;
  fieldName: keyof OrganizationImportSchema;
}

/**
 * Preview row with validation status
 */
export interface PreviewRow {
  data: MappedCSVRow;
  isValid: boolean;
  errors?: string[];
}

/**
 * Import field value - used in preview components
 */
export interface ImportFieldValue {
  field: string;
  value?: string | number | boolean | null;
  isValid?: boolean;
  error?: string;
}
