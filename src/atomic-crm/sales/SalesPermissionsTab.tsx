import { useState, useEffect } from "react";
import { useUpdate, useGetIdentity, useRedirect, useRefresh } from "react-admin";
import { useSafeNotify } from "@/atomic-crm/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
// NOTE: Client-side validation removed (2025-12-12)
// Edge Function /users PATCH handles validation with patchUserSchema
// salesService.salesUpdate() filters empty strings before sending to Edge Function
// Having duplicate validation here caused 400 errors from empty string avatar_url
import { invalidateIdentityCache } from "../providers/supabase/authProvider";
import { salesPermissionsSchema } from "@/atomic-crm/validation/sales";
import { UserDisableReassignDialog } from "./UserDisableReassignDialog";
import type { Sale } from "@/atomic-crm/types";

interface SalesPermissionsTabProps {
  record: Sale;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * SalesPermissionsTab - User permissions and role management
 *
 * Displays and allows editing of:
 * - Role (admin, manager, rep)
 * - Administrator toggle (linked to admin role)
 * - Disabled status
 *
 * View mode: Read-only display with badges
 * Edit mode: Inline form with dropdowns and switches
 */
export function SalesPermissionsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: SalesPermissionsTabProps) {
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();
  const redirect = useRedirect();
  const refresh = useRefresh();
  const { data: identity } = useGetIdentity();
  const [isDeleting, setIsDeleting] = useState(false);
  // FIX [WF-C04]: Show reassign dialog before disabling user
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  // Form state
  // Per Engineering Constitution #5: Form defaults from schema
  // Extract only the fields the schema expects (strictObject rejects unknown keys)
  const [formData, setFormData] = useState(() =>
    salesPermissionsSchema.parse({
      role: record.role,
      disabled: record.disabled,
    })
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track dirty state for ResourceSlideOver's Save button
  // Since this component uses local useState (not react-hook-form),
  // we manually compare formData with original record values
  useEffect(() => {
    if (mode !== "edit" || !onDirtyChange) return;

    const isDirty = formData.role !== record.role || formData.disabled !== record.disabled;

    onDirtyChange(isDirty);
  }, [formData, record, mode, onDirtyChange]);

  // Prevent editing own account
  const isSelfEdit = record?.id === identity?.id;

  // Remove user (soft-delete by setting deleted_at)
  const handleRemoveUser = async () => {
    if (isSelfEdit) {
      notify("You cannot remove your own account", { type: "warning" });
      return;
    }

    setIsDeleting(true);
    try {
      // CRITICAL: previousData required by ra-data-postgrest's getChanges()
      await update(
        "sales",
        { id: record.id, data: { deleted_at: new Date().toISOString() }, previousData: record },
        {
          onSuccess: () => {
            notify("User removed successfully", { type: "success" });
            refresh();
            redirect("/sales");
          },
          onError: (error: Error) => {
            notify(error.message || "Failed to remove user", { type: "error" });
          },
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Update form field
  const handleChange = (field: string, value: "admin" | "manager" | "rep" | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle disabled toggle change
   * FIX [WF-C04]: When disabling, show reassign dialog instead of direct toggle
   * Re-enabling doesn't require reassignment
   */
  const handleDisabledChange = (checked: boolean) => {
    if (checked && !record.disabled) {
      // User is trying to DISABLE → show reassignment dialog
      setShowDisableDialog(true);
    } else {
      // User is RE-ENABLING → direct toggle is fine
      handleChange("disabled", checked);
    }
  };

  /**
   * Handle successful disable from dialog
   * Updates local form state to reflect the disabled status
   */
  const handleDisableSuccess = () => {
    setFormData((prev) => ({ ...prev, disabled: true }));
    if (onModeToggle) onModeToggle(); // Switch back to view mode
  };

  // Save changes
  const handleSave = async () => {
    try {
      // NOTE: Client-side validation removed - Edge Function validates
      // salesService.salesUpdate() filters empty strings before sending

      // Update record - CRITICAL: previousData required by ra-data-postgrest's getChanges()
      await update(
        "sales",
        { id: record.id, data: formData, previousData: record },
        {
          onSuccess: () => {
            // If role changed, invalidate cache so user sees new permissions immediately
            if (formData.role !== record.role) {
              invalidateIdentityCache();
            }
            notify("Permissions updated successfully", { type: "success" });
            if (onModeToggle) onModeToggle(); // Switch back to view mode
          },
          onError: (error: Error) => {
            notify(error.message || "Failed to update permissions", { type: "error" });
            const errorWithErrors = error as Error & { errors?: Record<string, string> };
            if (errorWithErrors.errors) {
              setErrors(errorWithErrors.errors);
            }
          },
        }
      );
    } catch (error: unknown) {
      const errorWithErrors = error as Error & { errors?: Record<string, string> };
      if (errorWithErrors.errors) {
        setErrors(errorWithErrors.errors);
        notify("Validation failed. Please check the form.", { type: "warning" });
      } else {
        notify("An error occurred", { type: "error" });
      }
    }
  };

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="outline" className="border-primary text-primary">
            Admin
          </Badge>
        );
      case "manager":
        return (
          <Badge variant="outline" className="border-success text-success">
            Manager
          </Badge>
        );
      case "rep":
        return (
          <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
            Rep
          </Badge>
        );
      default:
        return null;
    }
  };

  // Form submit handler for the footer button
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSelfEdit) {
      handleSave();
    }
  };

  if (!record) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Self-edit warning */}
      {isSelfEdit && mode === "edit" && (
        <div className="p-3 border border-warning bg-warning/10 rounded-md">
          <p className="text-sm text-warning-foreground">
            <strong>Note:</strong> You cannot modify your own permissions.
          </p>
        </div>
      )}

      {/* Role field */}
      <div>
        <Label htmlFor="role">Role</Label>
        {mode === "view" ? (
          <div className="mt-2">{getRoleBadge(record.role)}</div>
        ) : (
          <>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange("role", value as "admin" | "manager" | "rep")}
              disabled={isLoading || isSelfEdit}
            >
              <SelectTrigger id="role" className={errors.role ? "border-destructive" : ""}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rep">Rep</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive mt-1">{errors.role}</p>}
            <p className="text-sm text-muted-foreground mt-1">
              Rep: Edit own records. Manager: Edit all records. Admin: Full system access.
            </p>
          </>
        )}
      </div>

      {/* Administrator toggle (computed from role) */}
      <div>
        <Label htmlFor="administrator">Administrator Access</Label>
        {mode === "view" ? (
          <p className="text-sm text-foreground mt-1">
            {record.administrator || record.role === "admin" ? "Yes" : "No"}
          </p>
        ) : (
          <div className="mt-2">
            <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-muted/20">
              <Switch
                id="administrator"
                checked={formData.role === "admin"}
                onCheckedChange={(checked) => handleChange("role", checked ? "admin" : "rep")}
                disabled={isLoading || isSelfEdit}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {formData.role === "admin" ? "Enabled" : "Disabled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Administrator access is automatically granted to users with Admin role
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disabled status */}
      <div>
        <Label htmlFor="disabled">Account Status</Label>
        {mode === "view" ? (
          <div className="mt-2">
            {record.disabled ? (
              <Badge variant="outline" className="border-warning text-warning">
                Disabled
              </Badge>
            ) : (
              <Badge variant="outline" className="border-success text-success">
                Active
              </Badge>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-muted/20">
              <Switch
                id="disabled"
                checked={formData.disabled}
                onCheckedChange={handleDisabledChange}
                disabled={isLoading || isSelfEdit}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {formData.disabled ? "Account Disabled" : "Account Active"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Disabled accounts cannot log in or access the system
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warning for disabled accounts */}
      {mode === "edit" && formData.disabled && !isSelfEdit && (
        <div className="p-3 border border-warning bg-warning/10 rounded-md">
          <p className="text-sm text-warning-foreground">
            <strong>Warning:</strong> Disabling this account will prevent the user from logging in.
          </p>
        </div>
      )}

      {/* Danger Zone - Remove User (admin only, not self) */}
      {!isSelfEdit && identity?.role === "admin" && (
        <div className="mt-8 pt-6 border-t border-destructive/30">
          <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Removing a user will prevent them from accessing the system. This action can be undone
              by an administrator.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Removing..." : "Remove User"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove{" "}
                    <strong>
                      {record?.first_name} {record?.last_name}
                    </strong>{" "}
                    ({record?.email})?
                    <br />
                    <br />
                    They will no longer be able to log in or access the system. This can be undone
                    later if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveUser}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove User
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );

  // In edit mode, wrap with form so footer "Save Changes" button works
  if (mode === "edit") {
    return (
      <>
        <form id="slide-over-edit-form" onSubmit={handleFormSubmit}>
          {content}
        </form>
        {/* FIX [WF-C04]: Disable user reassignment dialog */}
        <UserDisableReassignDialog
          user={record}
          open={showDisableDialog}
          onClose={() => setShowDisableDialog(false)}
          onSuccess={handleDisableSuccess}
        />
      </>
    );
  }

  return content;
}
