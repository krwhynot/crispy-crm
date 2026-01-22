import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminButton } from "@/components/admin/AdminButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Form } from "ra-core";
import { Link } from "react-router-dom";
import type { DataQualityDecisions } from "./ContactImportPreview";
import { ContactImportPreview } from "./ContactImportPreview";
import { ContactImportResult } from "./ContactImportResult";
import { useColumnMapping } from "./useColumnMapping";
import { useImportWizard } from "./useImportWizard";
import { assertNever } from "./useImportWizard.types";
import { useContactImportUpload } from "./useContactImportUpload";
import { useContactImportParser } from "./useContactImportParser";
import { useContactImportPreview } from "./useContactImportPreview";
import { useContactImportProcessor } from "./useContactImportProcessor";

import { FileInput } from "@/components/ra-wrappers/file-input";
import { FileField } from "@/components/ra-wrappers/file-field";
import * as React from "react";
import { useCallback, useEffect } from "react";
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
  // ============================================================
  // STATE MACHINE - Replaces 10 useState calls + 2 refs
  // AbortController support for cancelling async operations
  // ============================================================
  const { state: wizardState, actions: wizardActions, isAborted } = useImportWizard();

  // ============================================================
  // BEFOREUNLOAD PROTECTION - Warn user before closing during import
  // ============================================================
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (wizardState.step === "importing") {
        e.preventDefault();
        e.returnValue = "Import in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [wizardState.step]);

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
  // FILE UPLOAD - Extracted hook
  // ============================================================
  const { handleFileChange } = useContactImportUpload({ wizardActions });

  // ============================================================
  // CSV PARSING - Extracted hook
  // ============================================================
  const {
    previewImporter,
    parseCsv,
    reset: resetPreviewImporter,
  } = useContactImportParser({
    wizardActions,
    setRawData,
  });

  // ============================================================
  // PREVIEW DATA COMPUTATION - Extracted hook
  // ============================================================
  const derivedPreviewData = useContactImportPreview({
    wizardState,
    hasColumnData,
    reprocessedContacts,
    mergedMappings,
    rawHeaders,
    userOverrides,
  });

  // ============================================================
  // IMPORT PROCESSING - Extracted hook
  // ============================================================
  const { handlePreviewContinue } = useContactImportProcessor({
    wizardState,
    wizardActions,
    isAborted,
  });

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
            <AdminButton asChild variant="outline" size="sm">
              <Link to={SAMPLE_URL} download={"crm_contacts_sample.csv"}>
                Download CSV sample
              </Link>
            </AdminButton>
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
          <AdminButton
            onClick={startImport}
            disabled={!selectedFile || isParsing || validationErrors.length > 0}
          >
            {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import
          </AdminButton>
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
      <AdminButton variant="ghost" onClick={handleClose}>
        Cancel
      </AdminButton>
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
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-11 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Cancel Import
              </AdminButton>
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
        <AdminButton variant="outline" onClick={handleClose}>
          Close
        </AdminButton>
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
                onContinue={(decisions) => handlePreviewContinue(decisions, reprocessedContacts)}
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
