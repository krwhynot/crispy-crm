import type { ReactNode } from "react";
import { useListContext, Translate } from "ra-core";
import { Button } from "@/components/ui/button";
import { BulkDeleteButton } from "@/components/ra-wrappers/bulk-delete-button";
import { X } from "lucide-react";
import { BulkExportButton } from "./bulk-export-button";

export function BulkActionsToolbarChildren() {
  return (
    <>
      <BulkExportButton />
      <BulkDeleteButton />
    </>
  );
}

export const BulkActionsToolbar = ({
  children = <BulkActionsToolbarChildren />,
}: {
  children?: ReactNode;
}) => {
  const { selectedIds, onUnselectItems } = useListContext();
  if (!selectedIds?.length) {
    return null;
  }
  const handleUnselectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnselectItems();
  };
  return (
    <div className="list-bulk-actions">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="Unselect all"
          onClick={handleUnselectAll}
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          <Translate i18nKey="ra.action.bulk_actions" options={{ smart_count: selectedIds.length }}>
            {selectedIds.length} rows selected
          </Translate>
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
};
