import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
  X,
} from "lucide-react";
import * as React from "react";

export interface ImportError {
  row: number;
  data: Record<string, unknown>;
  reason: string;
}

export interface ImportResultData {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  errors: ImportError[];
  duration: number; // in milliseconds
  startTime?: Date;
  endTime?: Date;
}

interface ContactImportResultProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  result: ImportResultData;
  allowRetry?: boolean;
}

export function ContactImportResult({
  open,
  onClose,
  onRetry,
  result,
  allowRetry = false,
}: ContactImportResultProps) {
  const successRate = result.totalProcessed > 0
    ? Math.round((result.successCount / result.totalProcessed) * 100)
    : 0;

  const hasErrors = result.failedCount > 0 || result.skippedCount > 0;
  const isComplete = result.successCount === result.totalProcessed;

  // Format duration in human-readable format
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

  // Group errors by type for better organization
  const groupedErrors = React.useMemo(() => {
    const groups = new Map<string, ImportError[]>();
    result.errors.forEach((error) => {
      const key = error.reason;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(error);
    });
    return groups;
  }, [result.errors]);

  const handleDownloadErrors = () => {
    // Create CSV content with error details
    const csvContent = [
      ["Row", "First Name", "Last Name", "Organization", "Error Reason"],
      ...result.errors.map((error) => [
        error.row.toString(),
        error.data.first_name || "",
        error.data.last_name || "",
        error.data.organization_name || "",
        error.reason,
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `import_errors_${new Date().toISOString().split("T")[0]}.csv`);
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
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Import Completed Successfully
              </>
            ) : hasErrors ? (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Import Completed with Issues
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Import Completed
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Processed {result.totalProcessed.toLocaleString()} contacts in{" "}
            {formatDuration(result.duration)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {result.successCount.toLocaleString()}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {result.skippedCount.toLocaleString()}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600 opacity-20" />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {result.failedCount.toLocaleString()}
                  </p>
                </div>
                <X className="h-8 w-8 text-red-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Success Rate Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm text-muted-foreground">{successRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  successRate >= 90
                    ? "bg-green-600"
                    : successRate >= 70
                    ? "bg-yellow-600"
                    : "bg-red-600"
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
                    ? `${Math.round((result.totalProcessed / result.duration) * 1000)} contacts/sec`
                    : "N/A"}
                </span>
              </div>
              {result.startTime && (
                <div>
                  <span className="text-muted-foreground">Started at:</span>{" "}
                  <span className="font-medium">
                    {new Date(result.startTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {result.endTime && (
                <div>
                  <span className="text-muted-foreground">Completed at:</span>{" "}
                  <span className="font-medium">
                    {new Date(result.endTime).toLocaleTimeString()}
                  </span>
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
                  Error Details
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadErrors}
                  className="gap-2"
                >
                  <Download className="h-3 w-3" />
                  Export Errors
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(groupedErrors.entries()).map(([reason, errors]) => (
                  <Alert key={reason} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm">
                      {reason} ({errors.length} {errors.length === 1 ? "row" : "rows"})
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="text-xs space-y-1">
                        {errors.slice(0, 3).map((error) => (
                          <div key={error.row} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Row {error.row}
                            </Badge>
                            <span className="truncate">
                              {error.data.first_name} {error.data.last_name}
                              {error.data.organization_name && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  - {error.data.organization_name}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                        {errors.length > 3 && (
                          <div className="text-muted-foreground">
                            ... and {errors.length - 3} more
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
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
                {result.skippedCount} {result.skippedCount === 1 ? "row was" : "rows were"}{" "}
                skipped during import. These typically include rows with missing required
                fields like organization name. Review the error details above for specific
                reasons.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-between">
            <div className="flex gap-2">
              {hasErrors && result.errors.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleDownloadErrors}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Download Error Report
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {allowRetry && hasErrors && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onRetry?.();
                    onClose();
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Failed
                </Button>
              )}
              <Button onClick={onClose} variant={isComplete ? "default" : "outline"}>
                {isComplete ? "Done" : "Close"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}