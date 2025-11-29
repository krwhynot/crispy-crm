/**
 * DuplicateOrgWarningDialog - Soft warning for potential duplicate organizations
 *
 * Shows a confirmation dialog when a user attempts to create/update an organization
 * with a name that already exists. Unlike a hard block, this allows the user to:
 * 1. Go back and change the name
 * 2. Proceed anyway (creates the organization despite the duplicate)
 *
 * This follows the established AlertDialog pattern from UnlinkConfirmDialog.tsx
 *
 * @example
 * ```tsx
 * <DuplicateOrgWarningDialog
 *   open={!!duplicateOrg}
 *   duplicateName={duplicateOrg?.name}
 *   onCancel={() => setDuplicateOrg(null)}
 *   onProceed={() => handleCreateAnyway()}
 * />
 * ```
 */
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

interface DuplicateOrgWarningDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Name of the existing duplicate organization */
  duplicateName?: string;
  /** Called when user cancels (go back to edit name) */
  onCancel: () => void;
  /** Called when user confirms they want to proceed anyway */
  onProceed: () => void;
  /** Whether the proceed action is in progress */
  isLoading?: boolean;
}

export function DuplicateOrgWarningDialog({
  open,
  duplicateName,
  onCancel,
  onProceed,
  isLoading = false,
}: DuplicateOrgWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Potential Duplicate Organization</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                An organization named <strong>&quot;{duplicateName}&quot;</strong> already exists in
                the system.
              </p>
              <p>Would you like to proceed anyway, or go back to change the name?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Change Name</AlertDialogCancel>
          <AlertDialogAction
            onClick={onProceed}
            disabled={isLoading}
            className="bg-warning text-warning-foreground hover:bg-warning/90"
          >
            {isLoading ? "Creating..." : "Create Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
