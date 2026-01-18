import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ActionButtonsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSaveAndNew: () => void;
}

export function ActionButtons({ isSubmitting, onCancel, onSaveAndNew }: ActionButtonsProps) {
  return (
    <div className="flex justify-between pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="h-11"
      >
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            "Save & Close"
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11"
          disabled={isSubmitting}
          onClick={onSaveAndNew}
        >
          {isSubmitting ? "Saving..." : "Save & New"}
        </Button>
      </div>
    </div>
  );
}
