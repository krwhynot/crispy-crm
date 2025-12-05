import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Form, useRefresh } from "ra-core";
import { Link } from "react-router-dom";
import { usePapaParse } from "./usePapaParse";
import type { ContactImportSchema } from "./useContactImport";
import { useContactImport } from "./useContactImport";
import type { PreviewData, DataQualityDecisions } from "./ContactImportPreview";
import { ContactImportPreview } from "./ContactImportPreview";
import { ContactImportResult } from "./ContactImportResult";
import {
  extractNewOrganizations,
  extractNewTags,
  findOrganizationsWithoutContacts,
  findContactsWithoutContactInfo,
} from "./contactImport.helpers";
import { findCanonicalField, isFullNameColumn } from "./columnAliases";
import { useColumnMapping } from "./useColumnMapping";
import { useImportWizard } from "./useImportWizard";
import { assertNever } from "./useImportWizard.types";
import { FULL_NAME_SPLIT_MARKER } from "./csvConstants";
import { validateCsvFile, getSecurePapaParseConfig } from "../utils/csvUploadValidator";
import { contactImportLimiter } from "../utils/rateLimiter";

import { FileInput } from "@/components/admin/file-input";
import { FileField } from "@/components/admin/file-field";
import * as React from "react";
import { useCallback, useMemo } from "react";
import * as sampleCsv from "./contacts_export.csv?raw";

// Feature flag for enhanced import preview
const ENABLE_IMPORT_PREVIEW = true;

const SAMPLE_URL = `data:text/csv;name=crm_contacts_sample.csv;charset=utf-8,${encodeURIComponent(
  sampleCsv.default
)}`;

interface ContactImportModalProps {
  open: boolean;
  onClose(): void;
}

export function ContactImportDialog({ open, onClose }: ContactImportModalProps) {
  const refresh = useRefresh();
  const processBatchHook = useContactImport();

  // ============================================================
  // STATE MACHINE - Replaces 10 useState calls + 2 refs
  // AbortController support for cancelling async operations
  // ============================================================
  const { state: wizardState, actions: wizardActions, isAborted } = useImportWizard();

  // ============================================================
  // COLUMN MAPPING - Extracted hook for reusability
  // ============================================================
  const {
    mappings: mergedMappings,
    overrides: userOverrides,
    contacts: reprocessedContacts,
    headers: rawHeaders,
    setOverride: handleMappingChange,
    setRawData,
    reset: resetColumnMapping,
    hasData: hasColumnData,
  } = useColumnMapping();

  // ============================================================
  // PREVIEW CALLBACK - Triggered when PapaParse completes
  // ============================================================
  const onPreview = useCallback(
    (data: { rows: ContactImportSchema[]; headers: string[]; rawDataRows?: any[][] }) => {
      if (!ENABLE_IMPORT_PREVIEW) return;

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

  // ============================================================
  // DERIVED PREVIEW DATA - Updates when column mappings change
  // ============================================================
  const derivedPreviewData = useMemo<PreviewData | null>(() => {
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

  // ============================================================
  // PAPAPARSE HOOK - For CSV parsing
  // ============================================================
  const {
    importer: previewImporter,
    parseCsv,
    reset: resetPreviewImporter,
  } = usePapaParse<ContactImportSchema>({
    onPreview: onPreview,
    previewRowCount: 100,
    papaConfig: getSecurePapaParseConfig(),
  });

  // ============================================================
  // IMPORT HANDLERS
  // ============================================================

  /**
   * Process a single batch of contacts during import.
   * Updates wizard state with accumulated results.
   */
  const processBatch = useCallback(
    async (batch: ContactImportSchema[], dataQualityDecisions: DataQualityDecisions) => {
      if (wizardState.step !== "importing") return;

      try {
        const result = await processBatchHook(batch, {
          preview: false,
          startingRow: wizardState.rowOffset + 1,
          dataQualityDecisions,
          onProgress: () => {
            // Progress is updated at batch level, not per-contact
          },
        });

        // Accumulate results in wizard state
        wizardActions.accumulateResult({
          batchProcessed: result.totalProcessed,
          batchSuccess: result.successCount,
          batchSkipped: result.skippedCount,
          batchFailed: result.failedCount,
          batchErrors: result.errors,
          batchSize: batch.length,
        });
      } catch (error: any) {
        const errorMessage = error.message || "A critical error occurred during batch processing.";
        const batchStartRow = wizardState.rowOffset + 1;

        // Add an error entry for each contact in the failed batch
        const batchErrors = batch.map((contactData, index) => ({
          row: batchStartRow + index,
          data: contactData,
          errors: [{ field: "batch_processing", message: errorMessage }],
        }));

        wizardActions.accumulateResult({
          batchProcessed: batch.length,
          batchSuccess: 0,
          batchSkipped: 0,
          batchFailed: batch.length,
          batchErrors,
          batchSize: batch.length,
        });
      }
    },
    [processBatchHook, wizardState, wizardActions]
  );

  /**
   * Handle preview confirmation - start the actual import.
   */
  const handlePreviewContinue = useCallback(
    async (decisions: DataQualityDecisions) => {
      // SECURITY: Check rate limit before starting import
      if (!contactImportLimiter.canProceed()) {
        const resetTime = contactImportLimiter.getResetTimeFormatted();
        const remaining = contactImportLimiter.getRemaining();
        alert(
          `Import rate limit exceeded.\n\n` +
            `You have ${remaining} imports remaining.\n` +
            `Rate limit resets in ${resetTime}.\n\n` +
            `This limit prevents accidental bulk data corruption and protects database performance.`
        );
        return;
      }

      // Update data quality decisions in wizard state
      wizardActions.updateDataQualityDecisions(decisions);

      // Transition to importing state
      wizardActions.startImport(reprocessedContacts.length);

      // Process contacts in batches with abort support
      const batchSize = 10;
      for (let i = 0; i < reprocessedContacts.length; i += batchSize) {
        // Check if operation was cancelled
        if (isAborted()) {
          // Don't mark as complete - user cancelled
          return;
        }

        const batch = reprocessedContacts.slice(i, i + batchSize);
        await processBatch(batch, decisions);
        wizardActions.updateProgress(i + batch.length);
      }

      // Check abort one final time before marking complete
      if (isAborted()) {
        return;
      }

      // Mark import as complete
      wizardActions.importComplete();
      refresh();
    },
    [reprocessedContacts, processBatch, refresh, wizardActions, isAborted]
  );

  /**
   * Handle file selection with validation.
   */
  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) {
        wizardActions.reset();
        return;
      }

      // SECURITY: Validate file before processing
      const validation = await validateCsvFile(file);

      if (!validation.valid && validation.errors) {
        wizardActions.selectFile(file, validation.errors, []);
        return;
      }

      // File is valid - store with any warnings
      wizardActions.selectFile(file, [], validation.warnings || []);
    },
    [wizardActions]
  );

  /**
   * Start the import/preview process.
   */
  const startImport = useCallback(() => {
    if (wizardState.step !== "file_selected") return;

    // Transition to parsing state
    wizardActions.startParsing();

    // Start parsing with PapaParse
    parseCsv(wizardState.file);
  }, [wizardState, wizardActions, parseCsv]);

  /**
   * Handle preview cancellation.
   */
  const handlePreviewCancel = useCallback(() => {
    wizardActions.cancel();
    resetPreviewImporter();
    resetColumnMapping();
  }, [wizardActions, resetPreviewImporter, resetColumnMapping]);

  /**
   * Handle dialog close - reset all state.
   */
  const handleClose = useCallback(() => {
    resetPreviewImporter();
    resetColumnMapping();
    wizardActions.reset();
    onClose();
  }, [resetPreviewImporter, resetColumnMapping, wizardActions, onClose]);

  /**
   * Handle cancel/reset during import.
   */
  const handleReset = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleClose();
    },
    [handleClose]
  );

  // ============================================================
  // STEP-BASED RENDER FUNCTIONS
  // ============================================================

  /**
   * Renders the file selection UI (idle and file_selected states).
   * Shows download sample, file input, and validation messages.
   */
  const renderFileSelectionStep = () => {
    const validationErrors =
      wizardState.step === "file_selected" ? wizardState.validationErrors : [];
    const validationWarnings =
      wizardState.step === "file_selected" ? wizardState.validationWarnings : [];
    const selectedFile = wizardState.step === "file_selected" ? wizardState.file : null;
    const isParsing = wizardState.step === "parsing" || previewImporter.state === "parsing";

    return (
      <>
        <Alert>
          <AlertDescription className="flex flex-col gap-4">
            Here is a sample CSV file you can use as a template
            <Button asChild variant="outline" size="sm">
              <Link to={SAMPLE_URL} download={"crm_contacts_sample.csv"}>
                Download CSV sample
              </Link>
            </Button>
          </AlertDescription>
        </Alert>

        <FileInput
          source="csv"
          label="CSV File"
          accept={{ "text/csv": [".csv"] }}
          onChange={handleFileChange}
        >
          <FileField source="src" title="title" target="_blank" />
        </FileInput>

        {/* SECURITY: Display validation errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="font-semibold mb-2">File validation failed:</div>
              <ul className="list-disc pl-5 space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Display non-blocking warnings */}
        {validationWarnings.length > 0 && (
          <Alert>
            <AlertDescription>
              <div className="font-semibold mb-2">Warnings:</div>
              <ul className="list-disc pl-5 space-y-1">
                {validationWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <div className="flex justify-start pt-6 gap-2">
          <Button
            onClick={startImport}
            disabled={!selectedFile || isParsing || validationErrors.length > 0}
          >
            {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import
          </Button>
        </div>
      </>
    );
  };

  /**
   * Renders the parsing state with loading indicator.
   */
  const renderParsingStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-11 w-11 animate-spin text-primary" />
      <p className="text-muted-foreground">Parsing CSV file...</p>
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
    </div>
  );

  /**
   * Renders the importing state with progress tracking.
   * Shows real-time progress bar, statistics, and cancel button.
   */
  const renderImportingStep = () => {
    if (wizardState.step !== "importing") return null;

    const { progress, accumulated } = wizardState;
    const progressPercent = progress.total > 0 ? (progress.count / progress.total) * 100 : 0;

    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6 space-y-4">
          {/* Progress Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">Processing CSV Import</span>
            </div>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-11 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Cancel Import
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Processing {progress.count} of {progress.total} contacts
              </span>
              <span>{Math.round(progressPercent)}% Complete</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Processed</p>
              <p className="text-2xl font-bold text-primary">{progress.count}</p>
              <p className="text-xs text-muted-foreground">of {progress.total} contacts</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Errors</p>
              <p className="text-2xl font-bold text-destructive">{accumulated.errors.length}</p>
              <p className="text-xs text-muted-foreground">failed imports</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Success</p>
              <p className="text-2xl font-bold text-success">{accumulated.successCount}</p>
              <p className="text-xs text-muted-foreground">imported</p>
            </div>
          </div>

          {/* Warning Message */}
          <Alert className="border-warning/50 bg-warning/10">
            <AlertDescription className="text-sm">
              Please keep this tab open until the import completes
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  /**
   * Renders the error state with error message and retry option.
   */
  const renderErrorStep = () => (
    <>
      <Alert variant="destructive">
        <AlertDescription>
          Failed to import this file, please make sure your provided a valid CSV file.
        </AlertDescription>
      </Alert>
      <div className="flex justify-start pt-6 gap-2">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
      </div>
    </>
  );

  /**
   * Renders the main dialog content based on current wizard step.
   * Uses explicit switch pattern with exhaustive type checking.
   * TypeScript will error at compile time if any step is unhandled.
   */
  const renderMainDialogContent = (): React.ReactNode => {
    switch (wizardState.step) {
      case "idle":
      case "file_selected":
        return renderFileSelectionStep();

      case "parsing":
        return renderParsingStep();

      case "importing":
        return renderImportingStep();

      case "error":
        return renderErrorStep();

      case "preview":
      case "complete":
        // These states use separate dialogs, show nothing in main dialog
        return null;

      default:
        // TypeScript exhaustive check - compiler will error if any case is missing
        return assertNever(wizardState);
    }
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  // Determine which dialog should be visible
  const showMainDialog = open && wizardState.step !== "preview" && wizardState.step !== "complete";
  const showPreviewDialog = open && wizardState.step === "preview" && derivedPreviewData;
  const showResultDialog = open && wizardState.step === "complete";

  return (
    <>
      {/* Main Import Dialog - File Selection, Parsing, Importing, Error */}
      <Dialog open={showMainDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <Form className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Import Contacts</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import contacts into your CRM.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-2">{renderMainDialogContent()}</div>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - Column mapping and data review */}
      {ENABLE_IMPORT_PREVIEW && showPreviewDialog && derivedPreviewData && (
        <Dialog open={true} onOpenChange={handlePreviewCancel}>
          <DialogContent className="sm:max-w-7xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>Import Preview</DialogTitle>
              <DialogDescription>
                Review and map columns before importing your contacts.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6">
              <ContactImportPreview
                preview={derivedPreviewData}
                onContinue={handlePreviewContinue}
                onCancel={handlePreviewCancel}
                onMappingChange={handleMappingChange}
                userOverrides={userOverrides}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Result Dialog - Import completion summary */}
      {showResultDialog && wizardState.step === "complete" && (
        <ContactImportResult
          open={true}
          onClose={handleClose}
          result={wizardState.result}
          allowRetry={false}
        />
      )}
    </>
  );
}
