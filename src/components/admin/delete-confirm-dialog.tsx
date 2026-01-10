import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

/**
 * Related record counts for cascade warning display
 *
 * FIX [WF-C06]: Users must see what will be affected before confirming delete
 */
export interface RelatedRecordCount {
  /** Display name (e.g., "Contacts", "Opportunities") */
  resourceLabel: string;
  /** Number of related records that will be affected */
  count: number;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  count: number;
  resourceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * FIX [WF-C06]: Optional array of related records that will be affected
   * Displays warning about cascade effects before user confirms
   */
  relatedRecords?: RelatedRecordCount[];
  /** Loading state while fetching related counts */
  isLoadingRelated?: boolean;
}

export function DeleteConfirmDialog({
  open,
  count,
  resourceName,
  onConfirm,
  onCancel,
  relatedRecords,
  isLoadingRelated = false,
}: DeleteConfirmDialogProps) {
  const itemText = count === 1 ? "this item" : `these ${count} items`;

  // Filter to only show resources with actual counts
  const affectedResources = relatedRecords?.filter((r) => r.count > 0) ?? [];
  const totalAffected = affectedResources.reduce((sum, r) => sum + r.count, 0);
  const hasAffectedRecords = totalAffected > 0;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {resourceName}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This action cannot be undone. {itemText.charAt(0).toUpperCase() + itemText.slice(1)}{" "}
                will be permanently deleted.
              </p>

              {/* FIX [WF-C06]: Show cascade warning with child counts */}
              {isLoadingRelated ? (
                <p className="text-muted-foreground text-sm">Checking for related records...</p>
              ) : hasAffectedRecords ? (
                <div
                  className="flex items-start gap-2 rounded-md border border-warning bg-warning/10 p-3 text-warning-foreground"
                  role="alert"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-medium">This will also affect related records:</p>
                    <ul className="list-inside list-disc text-sm">
                      {affectedResources.map((resource) => (
                        <li key={resource.resourceLabel}>
                          {resource.count} {resource.resourceLabel}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="h-11">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoadingRelated}
            className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {hasAffectedRecords ? `Delete All (${count + totalAffected})` : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
