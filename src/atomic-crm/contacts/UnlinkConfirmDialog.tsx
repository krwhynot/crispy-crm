// src/atomic-crm/contacts/UnlinkConfirmDialog.tsx
import { useDelete } from "react-admin";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeNotify } from "../hooks/useSafeNotify";
import { opportunityContactKeys, opportunityKeys, contactKeys } from "../queryKeys";
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
  contactId: number;
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
  const { success, error } = useSafeNotify();
  const queryClient = useQueryClient();

  const handleConfirm = async () => {
    if (!opportunity) return;

    try {
      await deleteOne(
        "opportunity_contacts",
        { id: opportunity.junctionId },
        {
          onSuccess: () => {
            success(`Removed ${contactName} from ${opportunity.name}`);
            queryClient.invalidateQueries({ queryKey: opportunityContactKeys.all });
            onSuccess();
            onClose();
          },
          onError: (err: Error) => {
            error(err, "Couldn't unlink record. Please try again.");
          },
        }
      );
    } catch (err) {
      error(err, "Couldn't unlink record. Please try again.");
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
