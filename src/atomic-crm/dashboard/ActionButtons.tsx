import { AdminButton } from "@/components/admin/AdminButton";
import { Loader2 } from "lucide-react";

interface ActionButtonsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSaveAndNew: () => void;
}

export function ActionButtons({ isSubmitting, onCancel, onSaveAndNew }: ActionButtonsProps) {
  return (
    <div className="flex justify-between pt-4">
      <AdminButton
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="h-11"
      >
        Cancel
      </AdminButton>
      <div className="flex gap-2">
        <AdminButton type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            "Save & Close"
          )}
        </AdminButton>
        <AdminButton
          type="button"
          variant="secondary"
          className="h-11"
          disabled={isSubmitting}
          onClick={onSaveAndNew}
        >
          {isSubmitting ? "Saving..." : "Save & New"}
        </AdminButton>
      </div>
    </div>
  );
}
