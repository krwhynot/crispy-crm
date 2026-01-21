// src/atomic-crm/contacts/UnlinkConfirmDialog.tsx
import { useDelete } from "react-admin";
import { useSafeNotify } from "../hooks/useSafeNotify";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface UnlinkConfirmDialogProps {
  opportunity: { id: number; name: string; junctionId: string } | null;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UnlinkConfirmDialog({
  opportunity,
  contactName,
  onClose,
  onSuccess,
}: UnlinkConfirmDialogProps) {
  const [deleteOne, { isLoading }] = useDelete();
  const notify = useNotify();

  const handleConfirm = async () => {
    if (!opportunity) return;

    try {
      await deleteOne(
        "opportunity_contacts",
        { id: opportunity.junctionId },
        {
          onSuccess: () => {
            notify(`Removed ${contactName} from ${opportunity.name}`, {
              type: "success",
            });
            onSuccess();
            onClose();
          },
          onError: (error: Error) => {
            notify(error.message || "Failed to unlink opportunity", { type: "error" });
          },
        }
      );
    } catch {
      notify("Failed to unlink opportunity. Please try again.", { type: "error" });
    }
  };

  return (
    <AlertDialog open={!!opportunity} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove contact from opportunity?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove <strong>{contactName}</strong> from <strong>{opportunity?.name}</strong>? This
            won't delete either record, just removes the association.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
