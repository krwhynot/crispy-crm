import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import {
  Translate,
  useDeleteMany,
  useListContext,
  useNotify,
  useRefresh,
  useResourceContext,
  useTranslate,
  type MutationMode,
  type RaRecord,
  type UseDeleteManyOptions,
} from "ra-core";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";

export interface BulkDeleteButtonProps<
  RecordType extends RaRecord = RaRecord,
  MutationOptionsError = unknown,
> extends React.HTMLAttributes<HTMLButtonElement> {
  mutationMode?: MutationMode;
  label?: string;
  resource?: string;
  className?: string;
  icon?: ReactNode;
  mutationOptions?: UseDeleteManyOptions<RecordType, MutationOptionsError> & {
    meta?: Record<string, unknown>;
  };
}

export const BulkDeleteButton = <
  RecordType extends RaRecord = RaRecord,
  MutationOptionsError = unknown,
>(
  props: BulkDeleteButtonProps<RecordType, MutationOptionsError>
) => {
  const {
    mutationMode = "undoable",
    icon = defaultIcon,
    label,
    className,
    mutationOptions = {},
  } = props;
  const { meta: mutationMeta, ...otherMutationOptions } = mutationOptions;
  const resource = useResourceContext(props);
  const [deleteMany, { isPending }] = useDeleteMany<RecordType, MutationOptionsError>();
  const { selectedIds, onUnselectItems } = useListContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const translate = useTranslate();
  const [showConfirm, setShowConfirm] = useState(false);

  // Show confirmation dialog instead of immediate delete
  const handleClick = (e: React.MouseEvent) => {
    stopPropagation(e);
    setShowConfirm(true);
  };

  // Perform actual deletion after user confirms
  const handleConfirmDelete = () => {
    setShowConfirm(false);
    deleteMany(
      resource,
      { ids: selectedIds, meta: mutationMeta },
      {
        mutationMode,
        onSuccess: () => {
          onUnselectItems();
          notify(`resources.${resource}.notifications.deleted`, {
            messageArgs: {
              smart_count: selectedIds.length,
              _: translate("ra.notification.deleted", {
                smart_count: selectedIds.length,
                _: `${selectedIds.length} elements deleted`,
              }),
            },
            undoable: mutationMode === "undoable",
          });
        },
        onError: (error: MutationOptionsError) => {
          const errorMessage = typeof error === "string" ? error : (error as Error)?.message;
          notify(errorMessage || "ra.notification.http_error", {
            type: "error",
            messageArgs: { _: errorMessage },
          });
          refresh();
        },
        ...otherMutationOptions,
      }
    );
  };

  return (
    <>
      <Button
        variant="destructive"
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(className)}
      >
        {icon}
        <Translate i18nKey={label ?? "ra.action.delete"}>{label ?? "Delete"}</Translate>
      </Button>
      <DeleteConfirmDialog
        open={showConfirm}
        count={selectedIds.length}
        resourceName={resource ?? "items"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

const defaultIcon = <Trash />;

// useful to prevent click bubbling in a datagrid with rowClick
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
