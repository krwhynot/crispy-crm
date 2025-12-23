/**
 * DuplicateOrgWarningDialog - Soft warning for potential duplicate organizations
 *
 * Shows a confirmation dialog when a user attempts to create/update an organization
 * with a name that already exists. Unlike a hard block, this allows the user to:
 * 1. View the existing organization
 * 2. Go back and change the name
 * 3. Proceed anyway (creates the organization despite the duplicate)
 *
 * This follows the established AlertDialog pattern from UnlinkConfirmDialog.tsx
 *
 * @example
 * ```tsx
 * <DuplicateOrgWarningDialog
 *   open={!!duplicateOrg}
 *   duplicateName={duplicateOrg?.name}
 *   duplicateOrgId={duplicateOrg?.id}
 *   onCancel={() => setDuplicateOrg(null)}
 *   onProceed={() => handleCreateAnyway()}
 *   onViewExisting={() => navigate(`/organizations/${duplicateOrg?.id}/show`)}
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
import { Button } from "@/components/ui/button";

interface DuplicateOrgWarningDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Name of the existing duplicate organization */
  duplicateName?: string;
  /** ID of the existing duplicate organization (for navigation) */
  duplicateOrgId?: string | number;
  /** Called when user cancels (go back to edit name) */
  onCancel: () => void;
  /** Called when user confirms they want to proceed anyway */
  onProceed: () => void;
  /** Called when user wants to view the existing organization */
  onViewExisting?: () => void;
  /** Whether the proceed action is in progress */
  isLoading?: boolean;
}

export function DuplicateOrgWarningDialog({
  open,
  duplicateName,
  duplicateOrgId,
  onCancel,
  onProceed,
  onViewExisting,
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
              <p>Would you like to view the existing organization, change the name, or proceed anyway?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {onViewExisting && duplicateOrgId && (
            <Button
              variant="outline"
              onClick={onViewExisting}
              className="w-full sm:w-auto"
            >
              View Existing
            </Button>
          )}
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
