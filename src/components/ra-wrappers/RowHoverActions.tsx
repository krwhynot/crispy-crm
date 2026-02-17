import { Eye, Pencil, Trash2, EllipsisVertical } from "lucide-react";
import {
  useCreatePath,
  useDelete,
  useNotify,
  useRecordContext,
  useRefresh,
  useResourceContext,
} from "ra-core";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowHoverActionsProps {
  recordId?: number | string;
  resource?: string;
  onView?: (id: number | string) => void;
  onEdit?: (id: number | string) => void;
  onDelete?: (id: number | string) => Promise<void> | void;
  className?: string;
}

export function RowHoverActions({
  recordId,
  resource: resourceProp,
  onView,
  onEdit,
  onDelete,
  className,
}: RowHoverActionsProps) {
  const record = useRecordContext();
  const resourceFromContext = useResourceContext();
  const resource = resourceProp ?? resourceFromContext;
  const id = recordId ?? record?.id;
  const createPath = useCreatePath();
  const notify = useNotify();
  const refresh = useRefresh();
  const [deleteOne, { isPending: isDeleting }] = useDelete();

  if (id == null || !resource) {
    return null;
  }

  const editPath = createPath({ resource, type: "edit", id });

  const handleDelete = async () => {
    if (!window.confirm("Delete this record?")) {
      return;
    }

    try {
      if (onDelete) {
        await onDelete(id);
      } else {
        await deleteOne(resource, { id, previousData: record ?? {} }, { returnPromise: true });
      }
      notify("Record deleted", { type: "success" });
      refresh();
    } catch {
      notify("Failed to delete record", { type: "error" });
    }
  };

  return (
    <div
      className={className}
      role="toolbar"
      aria-label="Row actions"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      data-row-actions
    >
      {/* Always-visible Edit button */}
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 touch-target-44"
          onClick={() => onEdit(id)}
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="h-9 w-9 touch-target-44" asChild>
          <Link to={editPath} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      )}

      {/* Overflow menu with View + Delete */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-target-44"
            aria-label="More actions"
          >
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView?.(id)} disabled={!onView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
