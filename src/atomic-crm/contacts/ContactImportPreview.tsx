import { useState } from "react";
import { CheckCircle, AlertCircle, Building2, Tag, User, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/admin/AdminButton";
import { DialogFooter } from "@/components/ui/dialog";
import type { DataQualityDecisions } from "./contactImport.types";
import { ContactImportFieldMapper } from "./ContactImportFieldMapper";
import { ContactImportPreviewTable } from "./ContactImportPreviewTable";
import { ContactImportValidationPanel } from "./ContactImportValidationPanel";

export type { DataQualityDecisions } from "./contactImport.types";

export interface ColumnMapping {
  source: string;
  target: string | null;
  confidence: number;
  sampleValue?: string;
}

export interface ValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface PreviewData {
  mappings: ColumnMapping[];
  sampleRows: unknown[];
  validCount: number;
  skipCount: number;
  totalRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  newOrganizations: string[];
  newTags: string[];
  hasErrors: boolean;
  lowConfidenceMappings: number;
  organizationsWithoutContacts: Array<{ organization_name: string; row: number }>;
  contactsWithoutContactInfo: Array<{ name: string; organization_name: string; row: number }>;
}

interface ContactImportPreviewProps {
  preview: PreviewData;
  onContinue: (decisions: DataQualityDecisions) => void;
  onCancel: () => void;
  onRemap?: () => void;
  onMappingChange?: (csvHeader: string, targetField: string | null) => void;
  userOverrides?: Map<string, string | null>;
}

export function ContactImportPreview({
  preview,
  onContinue,
  onCancel,
  onRemap,
  onMappingChange,
  userOverrides,
}: ContactImportPreviewProps) {
  const [expandedSections, setExpandedSections] = useState({
    organizations: false,
    tags: false,
    errors: false,
    warnings: false,
    sampleData: false,
    organizationsWithoutContacts: false,
    contactsWithoutContactInfo: false,
    skippedColumns: false,
  });

  const [dataQualityDecisions, setDataQualityDecisions] = useState<DataQualityDecisions>({
    importOrganizationsWithoutContacts: false,
    importContactsWithoutContactInfo: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const mappedColumns = preview.mappings.filter((m) => m.target !== null);
  const skippedColumns = preview.mappings.filter((m) => m.target === null);

  const targetFieldCounts = new Map<string, number>();
  const duplicateTargets = new Set<string>();

  preview.mappings.forEach((mapping) => {
    if (mapping.target && mapping.target !== "(ignored - no matching field)") {
      const count = targetFieldCounts.get(mapping.target) || 0;
      targetFieldCounts.set(mapping.target, count + 1);

      if (count + 1 > 1) {
        duplicateTargets.add(mapping.target);
      }
    }
  });

  const hasDuplicates = duplicateTargets.size > 0;

  return (
    <div className="flex flex-col gap-4">
      <Alert variant={preview.hasErrors ? "destructive" : "default"} className="mb-2">
        <AlertTitle className="flex items-center gap-2">
          {preview.hasErrors ? (
            <>
              <AlertTriangle className="h-4 w-4" />
              Review Required
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Ready to Import
            </>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <strong>{preview.validCount}</strong> contacts will be imported
              </span>
              {preview.skipCount > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <AlertCircle className="h-3 w-3" />
                  <strong>{preview.skipCount}</strong> rows will be skipped
                </span>
              )}
            </div>
            {(preview.newOrganizations.length > 0 || preview.newTags.length > 0) && (
              <div className="flex items-center gap-4 text-sm">
                {preview.newOrganizations.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {preview.newOrganizations.length} new organizations
                  </span>
                )}
                {preview.newTags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {preview.newTags.length} new tags
                  </span>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {hasDuplicates && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Duplicate Field Mappings Detected</AlertTitle>
          <AlertDescription>
            <div className="flex flex-col gap-2">
              <p>
                Multiple CSV columns cannot be mapped to the same CRM field. Please fix the
                following duplicates:
              </p>
              <ul className="list-disc list-inside">
                {Array.from(duplicateTargets).map((target) => (
                  <li key={target}>
                    <strong>{target}</strong> is mapped {targetFieldCounts.get(target)} times
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <ContactImportFieldMapper
        mappedColumns={mappedColumns}
        skippedColumns={skippedColumns}
        userOverrides={userOverrides}
        onMappingChange={onMappingChange}
      />

      <ContactImportPreviewTable
        sampleRows={preview.sampleRows}
        isExpanded={expandedSections.sampleData}
        onToggle={() => toggleSection("sampleData")}
      />

      <ContactImportValidationPanel
        preview={preview}
        expandedSections={expandedSections}
        dataQualityDecisions={dataQualityDecisions}
        onToggleSection={toggleSection}
        onDataQualityChange={setDataQualityDecisions}
      />

      <DialogFooter className="gap-2">
        <AdminButton variant="outline" onClick={onCancel}>
          Cancel
        </AdminButton>
        {preview.lowConfidenceMappings > 0 && onRemap && (
          <AdminButton variant="outline" onClick={onRemap}>
            Review Mappings ({preview.lowConfidenceMappings} uncertain)
          </AdminButton>
        )}
        <AdminButton
          variant="default"
          onClick={() => onContinue(dataQualityDecisions)}
          disabled={preview.validCount === 0 || hasDuplicates}
        >
          Continue Import ({preview.validCount} contacts)
        </AdminButton>
      </DialogFooter>
    </div>
  );
}

export default ContactImportPreview;
