import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QuickAddForm } from "./QuickAddForm";

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Quick Add Dialog Component
 *
 * Modal dialog wrapper for the Quick Add form.
 * Responsive: Full screen on mobile, centered modal on desktop.
 * Contains QuickAddForm component for rapid data entry.
 */
export const QuickAddDialog = ({ open, onOpenChange }: QuickAddDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-2xl sm:w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto"
        aria-describedby="quick-add-description"
      >
        <DialogHeader>
          <DialogTitle>Quick Add Opportunity</DialogTitle>
          <DialogDescription id="quick-add-description">
            Create a new opportunity with optional contact details
          </DialogDescription>
        </DialogHeader>

        <QuickAddForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
