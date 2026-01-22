import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/admin/AdminButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  X,
} from "lucide-react";
import * as React from "react";

export interface FieldError {
  field: string;
  message: string;
  value?: string | number | boolean | null;
}

export interface ImportError {
  row: number;
  data: Record<string, unknown>;
  errors: FieldError[];
}

export interface ImportResultData {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  errors: ImportError[];
  duration: number;
  startTime?: Date;
  endTime?: Date;
}

interface OrganizationImportResultProps {
  open: boolean;
  onClose: () => void;
  result: ImportResultData;
  allowRetry?: boolean;
}

export function OrganizationImportResult({ open, onClose, result }: OrganizationImportResultProps) {
  const successRate =
    result.totalProcessed > 0 ? Math.round((result.successCount / result.totalProcessed) * 100) : 0;

  const hasErrors = result.failedCount > 0 || result.skippedCount > 0;
  const isComplete = result.successCount === result.totalProcessed;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (60 * 1000)) % 60);
    const hours = Math.floor(ms / (60 * 60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const handleDownloadErrors = () => {
    const csvContent = [
      [
        "Row",
        "Error Reasons",
        "Name",
        "Organization Type",
        "Priority",
        "Website",
        "Phone",
        "City",
        "State",
        "LinkedIn URL",
      ],
      ...result.errors.map((error) => [
        error.row.toString(),
        error.errors.map((e) => `${e.field}: ${e.message}`).join("; "),
        error.data.name || "",
        error.data.organization_type || "",
        error.data.priority || "",
        error.data.website || "",
        error.data.phone || "",
        error.data.city || "",
        error.data.state || "",
        error.data.linkedin_url || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `organization_import_errors_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                Import Completed Successfully
              </>
            ) : hasErrors ? (
              <>
                <AlertTriangle className="h-5 w-5 text-warning" />
                Import Completed with Issues
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                Import Completed
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Processed {result.totalProcessed.toLocaleString()} organizations in{" "}
            {formatDuration(result.duration)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-2xl font-semibold text-success">
                    {result.successCount.toLocaleString()}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success opacity-20" />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                  <p className="text-2xl font-semibold text-warning">
                    {result.skippedCount.toLocaleString()}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning opacity-20" />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-semibold text-error">
                    {result.failedCount.toLocaleString()}
                  </p>
                </div>
                <X className="h-8 w-8 text-error opacity-20" />
              </div>
            </div>
          </div>

          {/* Success Rate Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm text-muted-foreground">{successRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  successRate >= 90 ? "bg-success" : successRate >= 70 ? "bg-warning" : "bg-error"
                }`}
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Duration:</span>{" "}
                <span className="font-medium">{formatDuration(result.duration)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Processing Speed:</span>{" "}
                <span className="font-medium">
                  {result.duration > 0
                    ? `${Math.round((result.totalProcessed / result.duration) * 1000)} orgs/sec`
                    : "N/A"}
                </span>
              </div>
              {result.startTime && (
                <div>
                  <span className="text-muted-foreground">Started at:</span>{" "}
                  <span className="font-medium">{result.startTime.toLocaleTimeString()}</span>
                </div>
              )}
              {result.endTime && (
                <div>
                  <span className="text-muted-foreground">Completed at:</span>{" "}
                  <span className="font-medium">{result.endTime.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Details */}
          {hasErrors && result.errors.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Rejected Records ({result.errors.length})
                </h3>
                <div className="flex gap-2">
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrors}
                    className="gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </AdminButton>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto p-1">
                {result.errors.map((error) => (
                  <div
                    key={error.row}
                    className="flex flex-col gap-2 p-3 bg-muted/40 rounded border border-error-subtle"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Row {error.row}
                      </Badge>
                      <span className="font-medium text-sm">{error.data.name || "(no name)"}</span>
                    </div>
                    <ul className="text-xs text-error space-y-1 ml-4 list-disc list-inside">
                      {error.errors.map((fieldError, index) => (
                        <li key={index}>
                          <span className="font-semibold capitalize">
                            {fieldError.field.replace(/_/g, " ")}:
                          </span>{" "}
                          {fieldError.message}
                          {fieldError.value && (
                            <span className="text-muted-foreground italic ml-1">
                              (was: "{String(fieldError.value)}")
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings for skipped rows */}
          {result.skippedCount > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Skipped Rows</AlertTitle>
              <AlertDescription>
                {result.skippedCount} {result.skippedCount === 1 ? "row was" : "rows were"} skipped
                during import. Review the error details above for specific reasons.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-between">
            <div className="flex gap-2">
              {hasErrors && result.errors.length > 0 && (
                <AdminButton variant="outline" onClick={handleDownloadErrors} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Download Error Report
                </AdminButton>
              )}
            </div>
            <div className="flex gap-2">
              <AdminButton onClick={onClose} variant={isComplete ? "default" : "outline"}>
                {isComplete ? "Done" : "Close"}
              </AdminButton>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
