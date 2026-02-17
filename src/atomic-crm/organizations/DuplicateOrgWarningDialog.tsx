/**
 * DuplicateOrgWarningDialog - Hard block for potential duplicate organizations
 *
 * Shows a blocking dialog when a user attempts to create/update an organization
 * with a name that already exists. The user must either:
 * 1. View the existing organization
 * 2. Go back and change the name
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
} from "@/components/ui/alert-dialog";
import { AdminButton } from "@/components/admin/AdminButton";

interface DuplicateOrgWarningDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Name of the existing duplicate organization */
  duplicateName?: string;
  /** ID of the existing duplicate organization (for navigation) */
  duplicateOrgId?: string | number;
  /** Called when user cancels (go back to edit name) */
  onCancel: () => void;
  /** Called when user wants to view the existing organization */
  onViewExisting?: () => void;
}

export function DuplicateOrgWarningDialog({
  open,
  duplicateName,
  duplicateOrgId,
  onCancel,
  onViewExisting,
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
              <p>Would you like to view the existing organization or change the name?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {onViewExisting && duplicateOrgId && (
            <AdminButton variant="outline" onClick={onViewExisting} className="w-full sm:w-auto">
              View Existing
            </AdminButton>
          )}
          <AlertDialogCancel onClick={onCancel}>Change Name</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
