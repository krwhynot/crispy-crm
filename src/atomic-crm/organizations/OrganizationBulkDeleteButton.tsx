import { useState } from "react";
import {
  useListContext,
  useDeleteMany,
  useNotify,
  useRefresh,
  useResourceContext,
  Translate,
} from "ra-core";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import type { OrganizationWithHierarchy } from "../types";

/**
 * OrganizationBulkDeleteButton - Delete button with client-side validation
 *
 * Prevents deletion of organizations with child branches by checking
 * child_branch_count before allowing the delete operation.
 *
 * Behavior:
 * - If any selected org has children: button disabled + warning toast on click
 * - If all selected orgs deletable: shows confirmation dialog
 * - DB trigger (check_parent_deletion) remains as defense-in-depth
 */
export const OrganizationBulkDeleteButton = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { selectedIds, data, onUnselectItems } = useListContext<OrganizationWithHierarchy>();
  const [deleteMany, { isPending }] = useDeleteMany();
  const notify = useNotify();
  const refresh = useRefresh();
  const resource = useResourceContext();

  // Find parent organizations (orgs with children)
  const selectedOrgs = data?.filter((org) => selectedIds?.includes(org.id)) ?? [];
  const parentOrgs = selectedOrgs.filter((org) => (org.child_branch_count ?? 0) > 0);
  const hasParentOrgs = parentOrgs.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasParentOrgs) {
      // Show warning toast - block all deletions if any have children
      notify(
        parentOrgs.length === 1
          ? `Cannot delete "${parentOrgs[0].name}" - it has ${parentOrgs[0].child_branch_count} branch(es). Remove branches first.`
          : `Cannot delete ${parentOrgs.length} organizations with branches. Remove their branches first.`,
        { type: "warning" }
      );
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
          notify(`resources.${resource}.notifications.deleted`, {
            messageArgs: { smart_count: selectedIds.length },
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
      <Button
        variant="destructive"
        type="button"
        onClick={handleClick}
        disabled={buttonDisabled}
        title={buttonTitle}
        className={hasParentOrgs ? "opacity-50 cursor-not-allowed" : ""}
      >
        <Trash className="h-4 w-4" />
        <Translate i18nKey="ra.action.delete">Delete</Translate>
      </Button>
      <DeleteConfirmDialog
        open={showConfirm}
        count={selectedIds.length}
        resourceName={resource ?? "organizations"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default OrganizationBulkDeleteButton;
