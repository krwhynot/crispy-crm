import { AdminButton } from "@/components/admin/AdminButton";

export interface QuickAddFormActionsProps {
  onCancel: () => void;
  onSaveAndAddAnother: () => void;
  onSaveAndClose: () => void;
  isPending: boolean;
}

export const QuickAddFormActions = ({
  onCancel,
  onSaveAndAddAnother,
  onSaveAndClose,
  isPending,
}: QuickAddFormActionsProps) => {
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <AdminButton
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
        className="h-11"
      >
        Cancel
      </AdminButton>

      <div className="flex gap-2">
        <AdminButton
          type="button"
          onClick={onSaveAndAddAnother}
          disabled={isPending}
          className="h-11"
        >
          Save & Add Another
        </AdminButton>

        <AdminButton
          type="button"
          variant="secondary"
          onClick={onSaveAndClose}
          disabled={isPending}
          className="h-11"
        >
          Save & Close
        </AdminButton>
      </div>
    </div>
  );
};
