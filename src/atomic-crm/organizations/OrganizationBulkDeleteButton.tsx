import { useState, useMemo } from "react";
import {
  useListContext,
  useDeleteMany,
  useNotify,
  useRefresh,
  useResourceContext,
  Translate,
} from "ra-core";
import { AdminButton } from "@/components/admin/AdminButton";
import { Trash } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ra-wrappers/delete-confirm-dialog";
import { useRelatedRecordCounts } from "../hooks/useRelatedRecordCounts";
import type { OrganizationWithHierarchy } from "../types";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";

/**
 * OrganizationBulkDeleteButton - Delete button with client-side validation
 *
 * Prevents deletion of organizations with child branches by checking
 * child_branch_count before allowing the delete operation.
 *
 * FIX [WF-C06]: Now shows related record counts (Contacts, Opportunities, etc.)
 * in the delete confirmation dialog before user confirms.
 *
 * Behavior:
 * - If any selected org has children: button disabled + warning toast on click
 * - If all selected orgs deletable: shows confirmation dialog with cascade warning
 * - DB trigger (check_parent_deletion) remains as defense-in-depth
 */
export const OrganizationBulkDeleteButton = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { selectedIds, data, onUnselectItems } = useListContext<OrganizationWithHierarchy>();
  const [deleteMany, { isPending }] = useDeleteMany();
  const notify = useNotify();
  const refresh = useRefresh();
  const resource = useResourceContext();

  // FIX [WF-C06]: Fetch related record counts when dialog is open
  // Filter out undefined values and cast to Identifier[] for type safety
  // Memoize to prevent new array reference each render (avoids triggering useEffect)
  const validIds = useMemo(
    () => (selectedIds ?? []).filter((id): id is number => id !== undefined),
    [selectedIds]
  );
  const {
    relatedCounts,
    isLoading: isLoadingRelated,
    error: relatedCountsError,
  } = useRelatedRecordCounts({
    resource: "organizations",
    ids: validIds,
    enabled: showConfirm, // Only fetch when dialog is visible
  });

  // Find parent organizations (orgs with children)
  const selectedOrgs = data?.filter((org) => selectedIds?.includes(org.id)) ?? [];
  const parentOrgs = selectedOrgs.filter((org) => (org.child_branch_count ?? 0) > 0);
  const hasParentOrgs = parentOrgs.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasParentOrgs) {
      // Show warning toast - block all deletions if any have children
      const firstParent = parentOrgs[0];
      const message =
        parentOrgs.length === 1 && firstParent !== undefined
          ? `Cannot delete "${String(firstParent.name)}" - it has ${firstParent.child_branch_count ?? 0} branch(es). Remove branches first.`
          : `Cannot delete ${parentOrgs.length} organizations with branches. Remove their branches first.`;
      notify(message, { type: "warning" });
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    deleteMany(
      resource,
      { ids: selectedIds },
      {
        mutationMode: "undoable",
        onSuccess: () => {
          onUnselectItems();
          notify(notificationMessages.bulkDeleted(selectedIds.length, "organization"), {
            type: "success",
            undoable: true,
          });
        },
        onError: (error) => {
          notify((error as Error)?.message || "Delete failed", {
            type: "error",
          });
          refresh();
        },
      }
    );
  };

  // Visual indicator for disabled state
  const buttonDisabled = isPending || hasParentOrgs;
  const buttonTitle = hasParentOrgs
    ? `Cannot delete: ${parentOrgs.length} organization(s) have branches`
    : undefined;

  return (
    <>
      <AdminButton
        variant="destructive"
        type="button"
        onClick={handleClick}
        disabled={buttonDisabled}
        title={buttonTitle}
        className={hasParentOrgs ? "opacity-50 cursor-not-allowed" : ""}
      >
        <Trash className="h-4 w-4" />
        <Translate i18nKey="ra.action.delete">Delete</Translate>
      </AdminButton>
      <DeleteConfirmDialog
        open={showConfirm}
        count={selectedIds?.length ?? 0}
        resourceName={resource ?? "organizations"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
        relatedRecords={relatedCounts}
        isLoadingRelated={isLoadingRelated}
        error={relatedCountsError}
      />
    </>
  );
};

export default OrganizationBulkDeleteButton;
