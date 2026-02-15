import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  useCreatePath,
  useDelete,
  useNotify,
  useRecordContext,
  useRefresh,
  useResourceContext,
} from "ra-core";
import { Link } from "react-router-dom";
import { AdminButton } from "@/components/admin/AdminButton";

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

  const viewPath = createPath({ resource, type: "show", id });
  const editPath = createPath({ resource, type: "edit", id });

  const handleDelete = async () => {
    if (!window.confirm("Delete this record?")) {
      return;
    }

    try {
      if (onDelete) {
        await onDelete(id);
      } else {
        await deleteOne(resource, { id, previousData: record ?? {} });
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
      {onView ? (
        <AdminButton
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(id)}
          aria-label="View"
        >
          <Eye className="h-4 w-4" />
        </AdminButton>
      ) : (
        <Link
          to={viewPath}
          aria-label="View"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-muted"
        >
          <Eye className="h-4 w-4" />
        </Link>
      )}

      {onEdit ? (
        <AdminButton
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(id)}
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </AdminButton>
      ) : (
        <Link
          to={editPath}
          aria-label="Edit"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-muted"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}

      <AdminButton
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={handleDelete}
        aria-label="Delete"
        isLoading={isDeleting}
      >
        {!isDeleting && <Trash2 className="h-4 w-4" />}
      </AdminButton>
    </div>
  );
}
