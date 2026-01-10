/**
 * useContactImportParser - CSV parsing hook for contact import
 *
 * Extracted from ContactImportDialog.tsx to:
 * 1. Isolate PapaParse integration logic
 * 2. Encapsulate preview data generation
 * 3. Enable testing of parsing behavior
 *
 * Responsibilities:
 * - CSV parsing via PapaParse
 * - Preview data generation
 * - Column mapping auto-detection
 * - Data quality analysis
 */

import { useCallback } from "react";
import { usePapaParse } from "./usePapaParse";
import type { ContactImportSchema } from "./useContactImport";
import type { PreviewData } from "./ContactImportPreview";
import type { WizardActions } from "./useImportWizard";
import {
  extractNewOrganizations,
  extractNewTags,
  findOrganizationsWithoutContacts,
  findContactsWithoutContactInfo,
} from "./contactImport.helpers";
import { findCanonicalField, isFullNameColumn } from "./columnAliases";
import { getSecurePapaParseConfig } from "../utils/csvUploadValidator";

export interface UseContactImportParserProps {
  wizardActions: WizardActions;
  setRawData: (headers: string[], rows: unknown[][]) => void;
}

/**
 * Hook for parsing CSV files and generating preview data.
 *
 * @example
 * ```tsx
 * const { parseCsv, reset } = useContactImportParser({
 *   wizardActions,
 *   setRawData,
 * });
 *
 * // Start parsing
 * parseCsv(file);
 * ```
 */
export function useContactImportParser({ wizardActions, setRawData }: UseContactImportParserProps) {
  /**
   * Generate preview data from parsed CSV rows.
   * Called when PapaParse completes parsing.
   */
  const onPreview = useCallback(
    (data: { rows: ContactImportSchema[]; headers: string[]; rawDataRows?: unknown[][] }) => {
      const { rows, headers, rawDataRows: dataRows } = data;

      // Delegate raw data storage to column mapping hook
      if (dataRows) {
        setRawData(headers, dataRows);
      }

      // Run data quality analysis
      const organizationsWithoutContacts = findOrganizationsWithoutContacts(rows);
      const contactsWithoutContactInfo = findContactsWithoutContactInfo(rows);

      // Generate initial preview data with auto-detected mappings
      const mappings = headers.map((header, index) => {
        const canonicalField = findCanonicalField(header);
        const isFullName = isFullNameColumn(header);
        const target =
          canonicalField || (isFullName ? "first_name + last_name (will be split)" : null);

        // Calculate confidence: 1.0 for exact matches, 0.9 for full name patterns, 0 for no match
        let confidence = 0;
        if (canonicalField) confidence = 1.0;
        else if (isFullName) confidence = 0.9;

        // Get sample value from first row if available
        const sampleValue = dataRows?.[0]?.[index]
          ? String(dataRows[0][index]).substring(0, 50)
          : undefined;

        return {
          source: header || "(empty)",
          target,
          confidence,
          sampleValue,
        };
      });

      const preview: PreviewData = {
        mappings,
        sampleRows: rows.slice(0, 5),
        validCount: rows.length,
        skipCount: 0,
        totalRows: rows.length,
        errors: [],
        warnings: [],
        newOrganizations: extractNewOrganizations(rows),
        newTags: extractNewTags(rows),
        hasErrors: false,
        lowConfidenceMappings: mappings.filter((m) => m.confidence > 0 && m.confidence < 0.8)
          .length,
        organizationsWithoutContacts,
        contactsWithoutContactInfo,
      };

      // Transition wizard to preview state
      wizardActions.parsingComplete(preview);
    },
    [setRawData, wizardActions]
  );

  // Initialize PapaParse hook
  const {
    importer: previewImporter,
    parseCsv,
    reset: resetPreviewImporter,
  } = usePapaParse<ContactImportSchema>({
    onPreview: onPreview,
    previewRowCount: 100,
    papaConfig: getSecurePapaParseConfig(),
  });

  return {
    previewImporter,
    parseCsv,
    reset: resetPreviewImporter,
  };
}
