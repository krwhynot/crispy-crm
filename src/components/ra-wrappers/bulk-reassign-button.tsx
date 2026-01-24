import { useState, useRef, useEffect, type ReactNode } from "react";
import { useNotify, useRefresh, useDataProvider, useGetList, useListContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { devLog } from "@/lib/devLogger";
import { logger } from "@/lib/logger";
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
import type { Sale } from "@/atomic-crm/types";
import { formatName } from "@/atomic-crm/utils/formatName";
import { ucFirst } from "@/atomic-crm/utils";

interface ResourceItem {
  id: string | number;
  [key: string]: unknown;
}

interface BulkReassignButtonProps<T extends ResourceItem> {
  resource: string;
  queryKeys: {
    all: readonly string[];
  };
  itemDisplayName: (item: T) => string;
  itemSubtitle: (item: T) => string;
  onSuccess?: () => void;
}

export const BulkReassignButton = <T extends ResourceItem>({
  resource,
  queryKeys,
  itemDisplayName,
  itemSubtitle,
  onSuccess,
}: BulkReassignButtonProps<T>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSalesId, setSelectedSalesId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const { selectedIds, data, onUnselectItems } = useListContext<T>();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();

  const { data: salesList, isPending: isSalesLoading } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "last_name", order: "ASC" },
    filter: {
      "disabled@neq": true,
      "user_id@not.is": null,
    },
  });

  const selectedItems = data?.filter((item) => selectedIds?.includes(item.id)) ?? [];

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setSelectedSalesId("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedSalesId("");
  };

  const handleCancelOperation = () => {
    abortControllerRef.current?.abort();
    notify("Operation cancelled", { type: "info" });
  };

  const handleExecuteReassign = async () => {
    if (!selectedSalesId || !selectedIds?.length) return;

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsProcessing(true);
    let successCount = 0;
    let failureCount = 0;
    let wasCancelled = false;

    devLog(
      "BulkReassign",
      `Reassigning ${selectedIds.length} ${resource} to sales_id: ${selectedSalesId}`
    );

    try {
      for (const id of selectedIds) {
        if (signal.aborted) {
          wasCancelled = true;
          break;
        }

        try {
          await dataProvider.update(resource, {
            id,
            data: { sales_id: parseInt(selectedSalesId) },
            previousData: data?.find((item) => item.id === id),
          });
          successCount++;
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === "AbortError") {
            wasCancelled = true;
            break;
          }
          logger.error(`Failed to update ${resource} ${id}`, error, {
            feature: "BulkReassignButton",
            resource,
            id: String(id),
          });
          failureCount++;
        }
      }

      if (wasCancelled) {
        if (successCount > 0) {
          notify(
            `Cancelled after reassigning ${successCount} ${resource}${successCount === 1 ? "" : "s"}`,
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
            `Successfully reassigned ${successCount} ${resource}${successCount === 1 ? "" : "s"} to ${salesRepName}`,
            { type: "success" }
          );
        }
        if (failureCount > 0) {
          notify(`Failed to reassign ${failureCount} ${resource}${failureCount === 1 ? "" : "s"}`, {
            type: "error",
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.all });

      refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        onUnselectItems();
      }
      handleCloseDialog();
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      notify("Bulk reassignment failed", { type: "error" });
      logger.error("Bulk reassignment failed", error, { feature: "BulkReassignButton", resource });
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  if (!selectedIds?.length) return null;

  const resourceLabel = resource.replace(/_/g, " ");
  const capitalizedResource = ucFirst(resourceLabel);

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenDialog}
        className="h-11 gap-2 touch-manipulation"
        aria-label={`Reassign selected ${resource}`}
      >
        <UserPlus className="h-4 w-4" />
        Reassign
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign {capitalizedResource}</DialogTitle>
            <DialogDescription>
              Reassign {selectedIds.length} {resourceLabel}
              {selectedIds.length === 1 ? "" : "s"} to a different sales representative
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {capitalizedResource} to reassign:
              </p>
              <div className="space-y-1">
                {selectedItems.map((item) => (
                  <div key={item.id} className="text-sm flex items-center justify-between">
                    <span className="truncate">{itemDisplayName(item)}</span>
                    <span className="ml-2 text-xs text-muted-foreground shrink-0">
                      {itemSubtitle(item)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
                  Reassign {selectedIds.length} {capitalizedResource}
                  {selectedIds.length === 1 ? "" : "s"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkReassignButton;
