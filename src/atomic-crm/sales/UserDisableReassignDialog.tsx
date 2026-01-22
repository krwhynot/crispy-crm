/**
 * UserDisableReassignDialog - Wizard for reassigning records before disabling a user
 *
 * FIX [WF-C04]: Disabling a user without reassigning their records creates "Dead Revenue"
 * - opportunities owned by inaccessible ID
 * - Tasks with no valid owner (sales_id NOT NULL constraint)
 *
 * This dialog intercepts the "disable user" flow and:
 * 1. Shows counts of affected records (opportunities, contacts, organizations, tasks)
 * 2. Requires selecting a target user to reassign records to
 * 3. Performs bulk reassignment, then disables the user
 *
 * @module sales/UserDisableReassignDialog
 */

import { useState, useEffect, useRef } from "react";
import { useUpdate, useNotify, useRefresh, useDataProvider, useGetList } from "react-admin";
import type { DataProvider, Identifier, RaRecord } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { opportunityKeys, contactKeys, organizationKeys, taskKeys, saleKeys } from "../queryKeys";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, User, Building2, Briefcase, CheckSquare } from "lucide-react";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";

interface AffectedRecordCounts {
  opportunities: number;
  contacts: number;
  organizations: number;
  tasks: number;
}

const BATCH_SIZE = 50;

async function batchReassign<T extends RaRecord>(
  records: T[],
  targetSalesId: Identifier,
  resource: string,
  dataProvider: DataProvider,
  updateField: string,
  signal: AbortSignal
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const batch = records.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((record) =>
        dataProvider.update(resource, {
          id: record.id,
          data: { [updateField]: targetSalesId },
          previousData: record,
        })
      )
    );

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
        console.error(`[batchReassign] Failed to reassign ${resource}:`, result.reason);
      }
    });
  }

  return { success, failed };
}

interface UserDisableReassignDialogProps {
  /** The user being disabled */
  user: Sale;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed (cancelled or completed) */
  onClose: () => void;
  /** Callback when disable is successfully completed (after reassignment) */
  onSuccess: () => void;
}

/**
 * UserDisableReassignDialog - Wizard for reassigning records before disabling a user
 *
 * FIX [WF-C04]: Prevents "Dead Revenue" by forcing record reassignment
 *
 * Flow:
 * 1. Fetch counts of records owned by the user being disabled
 * 2. If no records → allow direct disable
 * 3. If records exist → require selecting a target user
 * 4. Reassign all records to target user
 * 5. Disable the user
 */
export function UserDisableReassignDialog({
  user,
  open,
  onClose,
  onSuccess,
}: UserDisableReassignDialogProps) {
  const [step, setStep] = useState<"loading" | "noRecords" | "reassign" | "processing">("loading");
  const [counts, setCounts] = useState<AffectedRecordCounts>({
    opportunities: 0,
    contacts: 0,
    organizations: 0,
    tasks: 0,
  });
  const [selectedSalesId, setSelectedSalesId] = useState<string>("");
  const [progressMessage, setProgressMessage] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const dataProvider = useDataProvider();
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();
  const queryClient = useQueryClient();

  // Fetch active sales reps for reassignment target (exclude the user being disabled)
  const { data: salesList, isPending: isSalesLoading } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "last_name", order: "ASC" },
    filter: {
      "disabled@neq": true,
      "user_id@not.is": null,
      "id@neq": user.id, // Exclude the user being disabled
    },
  });

  // Fetch record counts when dialog opens
  useEffect(() => {
    if (!open) {
      setStep("loading");
      setCounts({ opportunities: 0, contacts: 0, organizations: 0, tasks: 0 });
      setSelectedSalesId("");
      setProgressMessage("");
      return;
    }

    const fetchCounts = async () => {
      setStep("loading");

      try {
        // Fetch counts for each resource type in parallel
        const [opps, contacts, orgs, tasks] = await Promise.all([
          dataProvider.getList("opportunities", {
            pagination: { page: 1, perPage: 1 },
            sort: { field: "id", order: "ASC" },
            filter: { opportunity_owner_id: user.id },
          }),
          dataProvider.getList("contacts", {
            pagination: { page: 1, perPage: 1 },
            sort: { field: "id", order: "ASC" },
            filter: { sales_id: user.id },
          }),
          dataProvider.getList("organizations", {
            pagination: { page: 1, perPage: 1 },
            sort: { field: "id", order: "ASC" },
            filter: { sales_id: user.id },
          }),
          dataProvider.getList("tasks", {
            pagination: { page: 1, perPage: 1 },
            sort: { field: "id", order: "ASC" },
            filter: { sales_id: user.id },
          }),
        ]);

        const newCounts = {
          opportunities: opps.total ?? 0,
          contacts: contacts.total ?? 0,
          organizations: orgs.total ?? 0,
          tasks: tasks.total ?? 0,
        };

        setCounts(newCounts);

        // If no records, allow direct disable
        const totalRecords =
          newCounts.opportunities + newCounts.contacts + newCounts.organizations + newCounts.tasks;

        setStep(totalRecords === 0 ? "noRecords" : "reassign");
      } catch (error: unknown) {
        console.error("[UserDisableReassign] Failed to fetch counts:", error);
        notify("Failed to check user records", { type: "error" });
        onClose();
      }
    };

    fetchCounts();
  }, [open, user.id, dataProvider, notify, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Disable user directly (when they have no records)
   */
  const handleDirectDisable = async () => {
    setStep("processing");
    setProgressMessage("Disabling user...");

    try {
      await update(
        "sales",
        { id: user.id, data: { disabled: true }, previousData: user },
        {
          onSuccess: () => {
            // Invalidate sales cache to update user lists
            queryClient.invalidateQueries({ queryKey: saleKeys.all });

            notify(`${formatName(user.first_name, user.last_name)} has been disabled`, {
              type: "success",
            });
            refresh();
            onSuccess();
            onClose();
          },
          onError: (error: Error) => {
            notify(error.message || "Failed to disable user", { type: "error" });
            setStep("noRecords");
          },
        }
      );
    } catch (_error: unknown) {
      notify("Failed to disable user", { type: "error" });
      setStep("noRecords");
    }
  };

  /**
   * Reassign all records then disable the user
   */
  const handleReassignAndDisable = async () => {
    if (!selectedSalesId) return;

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setStep("processing");
    const targetSalesId = parseInt(selectedSalesId);
    const targetUser = salesList?.find((s) => s.id === targetSalesId);
    const targetName = targetUser
      ? formatName(targetUser.first_name, targetUser.last_name)
      : "selected user";

    try {
      setProgressMessage("Fetching records to reassign...");

      const [oppsResult, contactsResult, orgsResult, tasksResult] = await Promise.all([
        counts.opportunities > 0
          ? dataProvider.getList("opportunities", {
              pagination: { page: 1, perPage: 100 },
              sort: { field: "id", order: "ASC" },
              filter: { opportunity_owner_id: user.id },
            })
          : Promise.resolve({ data: [] }),
        counts.contacts > 0
          ? dataProvider.getList("contacts", {
              pagination: { page: 1, perPage: 100 },
              sort: { field: "id", order: "ASC" },
              filter: { sales_id: user.id },
            })
          : Promise.resolve({ data: [] }),
        counts.organizations > 0
          ? dataProvider.getList("organizations", {
              pagination: { page: 1, perPage: 100 },
              sort: { field: "id", order: "ASC" },
              filter: { sales_id: user.id },
            })
          : Promise.resolve({ data: [] }),
        counts.tasks > 0
          ? dataProvider.getList("tasks", {
              pagination: { page: 1, perPage: 100 },
              sort: { field: "id", order: "ASC" },
              filter: { sales_id: user.id },
            })
          : Promise.resolve({ data: [] }),
      ]);

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      setProgressMessage("Reassigning records in parallel batches...");

      const [oppResult, contactResult, orgResult, taskResult] = await Promise.all([
        batchReassign(
          oppsResult.data,
          targetSalesId,
          "opportunities",
          dataProvider,
          "opportunity_owner_id",
          signal
        ),
        batchReassign(
          contactsResult.data,
          targetSalesId,
          "contacts",
          dataProvider,
          "sales_id",
          signal
        ),
        batchReassign(
          orgsResult.data,
          targetSalesId,
          "organizations",
          dataProvider,
          "sales_id",
          signal
        ),
        batchReassign(tasksResult.data, targetSalesId, "tasks", dataProvider, "sales_id", signal),
      ]);

      const totalReassigned =
        oppResult.success + contactResult.success + orgResult.success + taskResult.success;
      const failures =
        oppResult.failed + contactResult.failed + orgResult.failed + taskResult.failed;

      // Now disable the user
      setProgressMessage("Disabling user...");

      await update(
        "sales",
        { id: user.id, data: { disabled: true }, previousData: user },
        {
          onSuccess: () => {
            // Invalidate ALL affected resource caches to prevent stale data
            // This ensures all components showing this data update immediately
            queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
            queryClient.invalidateQueries({ queryKey: contactKeys.all });
            queryClient.invalidateQueries({ queryKey: organizationKeys.all });
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            queryClient.invalidateQueries({ queryKey: saleKeys.all });

            const userName = formatName(user.first_name, user.last_name);
            notify(
              `${userName} disabled. ${totalReassigned} records reassigned to ${targetName}${failures > 0 ? `. ${failures} records failed.` : ""}`,
              { type: failures > 0 ? "warning" : "success" }
            );
            refresh();
            onSuccess();
            onClose();
          },
          onError: (error: Error) => {
            notify(`Records reassigned but failed to disable user: ${error.message}`, {
              type: "error",
            });
            setStep("reassign");
          },
        }
      );
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        notify("Operation cancelled", { type: "info" });
        setStep("reassign");
        return;
      }
      console.error("[UserDisableReassign] Failed:", error);
      notify("Failed to reassign records", { type: "error" });
      setStep("reassign");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (step === "processing") {
      abortControllerRef.current?.abort();
    } else {
      onClose();
    }
  };

  const totalRecords = counts.opportunities + counts.contacts + counts.organizations + counts.tasks;
  const userName = formatName(user.first_name, user.last_name);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Disable User: {userName}
          </DialogTitle>
          <DialogDescription>
            {step === "loading" && "Checking for records owned by this user..."}
            {step === "noRecords" &&
              "This user has no assigned records. You can disable them directly."}
            {step === "reassign" && (
              <>
                <strong className="text-foreground">Warning:</strong> This user owns records that
                must be reassigned before disabling.
              </>
            )}
            {step === "processing" && progressMessage}
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {step === "loading" && (
          <div className="py-6 text-center text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            Checking records...
          </div>
        )}

        {/* No records - direct disable */}
        {step === "noRecords" && (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">
              {userName} has no opportunities, contacts, organizations, or tasks assigned.
            </p>
          </div>
        )}

        {/* Reassignment step */}
        {step === "reassign" && (
          <div className="space-y-4">
            {/* Affected record counts */}
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
              <p className="text-sm font-medium text-warning-foreground mb-3">
                Records to reassign:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {counts.opportunities > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {counts.opportunities} Opportunit{counts.opportunities === 1 ? "y" : "ies"}
                    </span>
                  </div>
                )}
                {counts.contacts > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {counts.contacts} Contact{counts.contacts === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
                {counts.organizations > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {counts.organizations} Organization{counts.organizations === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
                {counts.tasks > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {counts.tasks} Task{counts.tasks === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Target user selector */}
            <div className="space-y-2">
              <label htmlFor="reassign-target-select" className="text-sm font-medium">
                Reassign all records to:
              </label>
              <Select
                value={selectedSalesId}
                onValueChange={setSelectedSalesId}
                disabled={isSalesLoading}
              >
                <SelectTrigger id="reassign-target-select" className="h-11">
                  <SelectValue
                    placeholder={isSalesLoading ? "Loading users..." : "Select a team member"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {salesList?.map((sales) => (
                    <SelectItem key={sales.id} value={String(sales.id)}>
                      {formatName(sales.first_name, sales.last_name)}
                      {sales.role === "admin" && " (Admin)"}
                      {sales.role === "manager" && " (Manager)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Processing state */}
        {step === "processing" && (
          <div className="py-6 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-muted-foreground">{progressMessage}</p>
          </div>
        )}

        <DialogFooter>
          {step === "loading" && (
            <AdminButton variant="outline" onClick={handleCancel}>
              Cancel
            </AdminButton>
          )}

          {step === "noRecords" && (
            <>
              <AdminButton variant="outline" onClick={handleCancel}>
                Cancel
              </AdminButton>
              <AdminButton variant="destructive" onClick={handleDirectDisable}>
                Disable User
              </AdminButton>
            </>
          )}

          {step === "reassign" && (
            <>
              <AdminButton variant="outline" onClick={handleCancel}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="destructive"
                onClick={handleReassignAndDisable}
                disabled={!selectedSalesId}
              >
                Reassign {totalRecords} Records & Disable
              </AdminButton>
            </>
          )}

          {step === "processing" && (
            <AdminButton variant="destructive" onClick={handleCancel}>
              Cancel Operation
            </AdminButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserDisableReassignDialog;
