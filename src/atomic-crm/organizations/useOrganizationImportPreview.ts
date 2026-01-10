import { useState, useMemo, useCallback } from "react";
import { mapHeadersToFields } from "./organizationColumnAliases";
import { detectDuplicateOrganizations } from "./organizationImport.logic";
import type { RawCSVRow, MappedCSVRow } from "./types";
import type { PreviewData, ColumnMapping, DuplicateGroup } from "./OrganizationImportPreview";

interface PreviewState {
  previewData: PreviewData | null;
  userOverrides: Map<string, string | null>;
  handleMappingChange: (csvHeader: string, targetField: string | null) => void;
  resetPreview: () => void;
  generatePreviewData: (
    rawHeaders: string[],
    rawDataRows: RawCSVRow[],
    reprocessedOrganizations: MappedCSVRow[]
  ) => PreviewData;
}

export function useOrganizationImportPreview(): PreviewState {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [userOverrides, setUserOverrides] = useState<Map<string, string | null>>(new Map());

  const handleMappingChange = useCallback((csvHeader: string, targetField: string | null) => {
    setUserOverrides((prev) => {
      const next = new Map(prev);
      if (targetField === null || targetField === "") {
        next.delete(csvHeader);
      } else {
        next.set(csvHeader, targetField);
      }
      return next;
    });
  }, []);

  const resetPreview = useCallback(() => {
    setPreviewData(null);
    setUserOverrides(new Map());
  }, []);

  const generatePreviewData = useCallback(
    (
      rawHeaders: string[],
      rawDataRows: RawCSVRow[],
      reprocessedOrganizations: MappedCSVRow[]
    ): PreviewData => {
      const autoMappings = mapHeadersToFields(rawHeaders);
      const mergedMappings: Record<string, string | null> = {};

      rawHeaders.forEach((header) => {
        mergedMappings[header] = userOverrides.get(header) ?? autoMappings[header];
      });

      const updatedMappings: ColumnMapping[] = rawHeaders.map((header, index) => {
        const target = mergedMappings[header];
        const confidence = target ? 1.0 : 0.0;

        const colValues = rawDataRows.slice(0, 10).map((row) => row[index]);
        let sampleValue = colValues.find(
          (val) => val !== undefined && val !== null && String(val).trim() !== ""
        );

        if (sampleValue === undefined) {
          const deeper = rawDataRows
            .slice(0, Math.min(50, rawDataRows.length))
            .map((row) => row[index]);
          sampleValue = deeper.find(
            (val) => val !== undefined && val !== null && String(val).trim() !== ""
          );
        }

        const sample = sampleValue !== undefined ? String(sampleValue).substring(0, 50) : undefined;

        return {
          source: header || "(empty)",
          target,
          confidence,
          sampleValue: sample,
        };
      });

      const duplicateReport = detectDuplicateOrganizations(reprocessedOrganizations);
      const duplicateGroups: DuplicateGroup[] = duplicateReport.duplicates.map((dup) => ({
        indices: dup.indices.map((i) => i + 2),
        name: dup.name,
        count: dup.count,
      }));

      const newTags = new Set<string>();
      reprocessedOrganizations.forEach((org) => {
        if (org.tags) {
          org.tags.split(",").forEach((tag: string) => {
            const trimmed = tag.trim();
            if (trimmed) {
              newTags.add(trimmed);
            }
          });
        }
      });

      const namedRowsCount = reprocessedOrganizations.filter(
        (o) => o.name && String(o.name).trim() !== ""
      ).length;

      const preview: PreviewData = {
        mappings: updatedMappings,
        sampleRows: reprocessedOrganizations.slice(0, 5),
        validCount: namedRowsCount,
        totalRows: reprocessedOrganizations.length,
        newTags: Array.from(newTags),
        duplicates: duplicateGroups.length > 0 ? duplicateGroups : undefined,
        lowConfidenceMappings: updatedMappings.filter((m) => m.confidence === 0).length,
        missingNameCount: reprocessedOrganizations.length - namedRowsCount,
      };

      setPreviewData(preview);
      return preview;
    },
    [userOverrides]
  );

  return {
    previewData,
    userOverrides,
    handleMappingChange,
    resetPreview,
    generatePreviewData,
  };
}
