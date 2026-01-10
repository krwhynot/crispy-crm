/**
 * useContactImportPreview - Preview data computation hook
 *
 * Extracted from ContactImportDialog.tsx to:
 * 1. Isolate preview data derivation logic
 * 2. Reduce cognitive load in main dialog
 * 3. Enable testing of preview updates
 *
 * Responsibilities:
 * - Computing derived preview data from column mappings
 * - Detecting mapping conflicts (full name split + explicit first/last)
 * - Updating sample values as mappings change
 * - Data quality warnings
 */

import { useMemo } from "react";
import type { PreviewData } from "./ContactImportPreview";
import type { WizardState } from "./useImportWizard.types";
import type { ContactImportSchema } from "./useContactImport";
import {
  extractNewOrganizations,
  extractNewTags,
  findOrganizationsWithoutContacts,
  findContactsWithoutContactInfo,
} from "./contactImport.helpers";
import { FULL_NAME_SPLIT_MARKER } from "./csvConstants";

export interface UseContactImportPreviewProps {
  wizardState: WizardState;
  hasColumnData: boolean;
  reprocessedContacts: ContactImportSchema[];
  mergedMappings: Record<string, string | null>;
  rawHeaders: string[];
  userOverrides: ReadonlyMap<string, string | null>;
}

/**
 * Hook for computing derived preview data based on column mappings.
 *
 * This hook recalculates preview data whenever:
 * - User changes column mappings
 * - Column data is loaded
 * - Wizard state transitions to preview
 *
 * @example
 * ```tsx
 * const derivedPreviewData = useContactImportPreview({
 *   wizardState,
 *   hasColumnData,
 *   reprocessedContacts,
 *   mergedMappings,
 *   rawHeaders,
 *   userOverrides,
 * });
 * ```
 */
export function useContactImportPreview({
  wizardState,
  hasColumnData,
  reprocessedContacts,
  mergedMappings,
  rawHeaders,
  userOverrides,
}: UseContactImportPreviewProps): PreviewData | null {
  return useMemo<PreviewData | null>(() => {
    // Only compute when in preview state with column data
    if (wizardState.step !== "preview" || !hasColumnData) {
      return wizardState.step === "preview" ? wizardState.previewData : null;
    }

    // Re-run data quality analysis on the latest reprocessed data
    const organizationsWithoutContacts = findOrganizationsWithoutContacts(reprocessedContacts);
    const contactsWithoutContactInfo = findContactsWithoutContactInfo(reprocessedContacts);

    // Generate updated mappings for UI display
    const updatedMappings = rawHeaders.map((header) => {
      const target = mergedMappings[header];

      // Calculate confidence: 1.0 for user override or auto-match, 0.9 for full name
      let confidence = 0;
      if (userOverrides.has(header)) {
        confidence = 1.0; // User override always high confidence
      } else if (target === FULL_NAME_SPLIT_MARKER) {
        confidence = 0.9;
      } else if (target) {
        confidence = 1.0; // Auto-detected match
      }

      // Get sample value from first reprocessed row
      const firstContact = reprocessedContacts[0];
      let sampleValue: string | undefined;
      if (firstContact) {
        // For full name splits, show the combined first + last
        if (
          target === FULL_NAME_SPLIT_MARKER ||
          target === "first_name + last_name (will be split)"
        ) {
          const first = firstContact["first_name"] || "";
          const last = firstContact["last_name"] || "";
          sampleValue = [first, last].filter(Boolean).join(" ").substring(0, 50);
        } else if (target && firstContact[target]) {
          sampleValue = String(firstContact[target]).substring(0, 50);
        }
      }

      return {
        source: header || "(empty)",
        target:
          target === FULL_NAME_SPLIT_MARKER ? "first_name + last_name (will be split)" : target,
        confidence,
        sampleValue,
      };
    });

    // Detect conflicting mappings (full name split + explicit first/last name)
    const warnings: PreviewData["warnings"] = [];
    const targetValues = Object.values(mergedMappings);
    const hasFullNameSplit = targetValues.includes(FULL_NAME_SPLIT_MARKER);
    const hasExplicitFirstName = targetValues.includes("first_name");
    const hasExplicitLastName = targetValues.includes("last_name");

    if (hasFullNameSplit && hasExplicitFirstName) {
      warnings.push({
        row: 0,
        message:
          "A column is mapped to 'Full Name (split)' and another to 'First Name'. The explicit 'First Name' column will take precedence.",
      });
    }
    if (hasFullNameSplit && hasExplicitLastName) {
      warnings.push({
        row: 0,
        message:
          "A column is mapped to 'Full Name (split)' and another to 'Last Name'. The explicit 'Last Name' column will take precedence.",
      });
    }

    return {
      mappings: updatedMappings,
      sampleRows: reprocessedContacts.slice(0, 5),
      validCount: reprocessedContacts.length,
      skipCount: 0,
      totalRows: reprocessedContacts.length,
      errors: [],
      warnings,
      newOrganizations: extractNewOrganizations(reprocessedContacts),
      newTags: extractNewTags(reprocessedContacts),
      hasErrors: false,
      lowConfidenceMappings: updatedMappings.filter((m) => m.confidence > 0 && m.confidence < 0.8)
        .length,
      organizationsWithoutContacts,
      contactsWithoutContactInfo,
    };
  }, [reprocessedContacts, mergedMappings, rawHeaders, hasColumnData, userOverrides, wizardState]);
}
