import { useState, useRef, useEffect } from "react";
import { useNotify, useRefresh, useDataProvider, useGetList, useListContext } from "ra-core";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import type { Contact, Sale } from "../types";
import { formatName } from "../utils/formatName";

interface ContactBulkReassignButtonProps {
  /**
   * Optional callback after successful reassignment
   * If not provided, will use onUnselectItems from ListContext
   */
  onSuccess?: () => void;
}

/**
 * ContactBulkReassignButton - Reassign multiple contacts to a different sales rep
 *
 * Features:
 * - Modal with user (sales rep) selector
 * - Preview of affected contacts
 * - Bulk update with success/failure counts
 * - Audit logging via database triggers (automatic)
 *
 * Adapted from organizations/BulkReassignButton.tsx
 */
export const ContactBulkReassignButton = ({ onSuccess }: ContactBulkReassignButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSalesId, setSelectedSalesId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // AbortController for cancellation support
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount - abort any in-flight operation
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const { selectedIds, data: contacts, onUnselectItems } = useListContext<Contact>();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();

  // Fetch active sales reps for the dropdown
  // Filter: not disabled and has an associated user account
  const { data: salesList, isPending: isSalesLoading } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "last_name", order: "ASC" },
    filter: {
      "disabled@neq": true,
      "user_id@not.is": null,
    },
  });

  // Get the selected contacts for preview
  const selectedContacts = contacts?.filter((contact) => selectedIds?.includes(contact.id)) ?? [];

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setSelectedSalesId("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedSalesId("");
  };

  /**
   * Cancel the in-progress bulk operation
   */
  const handleCancelOperation = () => {
    abortControllerRef.current?.abort();
    notify("Operation cancelled", { type: "info" });
  };

  /**
   * Execute the bulk reassignment
   *
   * Pattern: Sequential updates with individual try-catch + AbortController
   * - Allows partial success reporting
   * - Supports cancellation mid-operation
   * - Audit logging handled by database triggers automatically
   * - Follows fail-fast principle (no retries)
   */
  const handleExecuteReassign = async () => {
    if (!selectedSalesId || !selectedIds?.length) return;

    // Create new AbortController for this operation
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsProcessing(true);
    let successCount = 0;
    let failureCount = 0;
    let wasCancelled = false;

    // Log the reassignment action for debugging
    console.log(
      `[BulkReassign] Reassigning ${selectedIds.length} contacts to sales_id: ${selectedSalesId}`
    );

    try {
      // Execute bulk update for each selected contact
      for (const id of selectedIds) {
        // Check if operation was cancelled before each update
        if (signal.aborted) {
          wasCancelled = true;
          break;
        }

        try {
          await dataProvider.update("contacts", {
            id,
            data: { sales_id: parseInt(selectedSalesId) },
            previousData: contacts?.find((contact) => contact.id === id),
          });
          successCount++;
        } catch (error) {
          // Check if this was an abort error
          if (error instanceof DOMException && error.name === "AbortError") {
            wasCancelled = true;
            break;
          }
          console.error(`[BulkReassign] Failed to update contact ${id}:`, error);
          failureCount++;
        }
      }

      // Show results notification (only if not cancelled or if some work was done)
      if (wasCancelled) {
        if (successCount > 0) {
          notify(
            `Cancelled after reassigning ${successCount} contact${successCount === 1 ? "" : "s"}`,
            { type: "warning" }
          );
        }
      } else {
        if (successCount > 0) {
          const salesRep = salesList?.find((s) => String(s.id) === selectedSalesId);
          const salesRepName = salesRep
            ? formatName(salesRep.first_name, salesRep.last_name)
            : "selected rep";

          notify(
            `Successfully reassigned ${successCount} contact${successCount === 1 ? "" : "s"} to ${salesRepName}`,
            { type: "success" }
          );
        }
        if (failureCount > 0) {
          notify(`Failed to reassign ${failureCount} contact${failureCount === 1 ? "" : "s"}`, {
            type: "error",
          });
        }
      }

      // Refresh list and clear selection
      refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        onUnselectItems();
      }
      handleCloseDialog();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // Already handled above
        return;
      }
      notify("Bulk reassignment failed", { type: "error" });
      console.error("[BulkReassign] Bulk action error:", error);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // Don't render if no items selected (handled by parent toolbar)
  if (!selectedIds?.length) return null;

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenDialog}
        className="h-11 gap-2 touch-manipulation"
        aria-label="Reassign selected contacts"
      >
        <UserPlus className="h-4 w-4" />
        Reassign
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Contacts</DialogTitle>
            <DialogDescription>
              Reassign {selectedIds.length} contact{selectedIds.length === 1 ? "" : "s"} to a
              different sales representative
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show affected contacts */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Contacts to reassign:
              </p>
              <div className="space-y-1">
                {selectedContacts.map((contact) => (
                  <div key={contact.id} className="text-sm flex items-center justify-between">
                    <span className="truncate">
                      {formatName(contact.first_name, contact.last_name)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground shrink-0">
                      {contact.title || "No title"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales rep selector */}
            <div className="space-y-2">
              <label htmlFor="bulk-reassign-select" className="text-sm font-medium">
                New Sales Representative
              </label>
              <Select
                value={selectedSalesId}
                onValueChange={setSelectedSalesId}
                disabled={isSalesLoading}
              >
                <SelectTrigger id="bulk-reassign-select" className="h-11">
                  <SelectValue placeholder={isSalesLoading ? "Loading..." : "Select a sales rep"} />
                </SelectTrigger>
                <SelectContent>
                  {salesList?.map((sales) => (
                    <SelectItem key={sales.id} value={String(sales.id)}>
                      {formatName(sales.first_name, sales.last_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            {isProcessing ? (
              <>
                <Button variant="destructive" onClick={handleCancelOperation}>
                  Cancel Operation
                </Button>
                <Button disabled>Reassigning...</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleExecuteReassign} disabled={!selectedSalesId}>
                  Reassign {selectedIds.length} Contact{selectedIds.length === 1 ? "" : "s"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactBulkReassignButton;
