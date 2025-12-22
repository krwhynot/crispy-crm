import { useState } from "react";
import { useUpdate, useNotify } from "react-admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sale } from "@/atomic-crm/types";
import { salesProfileSchema } from "@/atomic-crm/validation/sales";
// NOTE: Client-side validation removed (2025-12-12)
// Edge Function /users PATCH handles validation with patchUserSchema
// salesService.salesUpdate() filters empty strings before sending to Edge Function
// Having duplicate validation here caused 400 errors from empty string avatar_url

interface SaleWithProfile extends Sale {
  phone?: string | null;
  avatar_url?: string | null;
}

interface SalesProfileTabProps {
  record: SaleWithProfile;
  mode: "view" | "edit";
  onModeToggle?: () => void;
}

/**
 * SalesProfileTab - Profile information for sales users
 *
 * Displays and allows editing of:
 * - Name (first_name, last_name)
 * - Email
 * - Phone
 * - Avatar
 *
 * View mode: Read-only display with labels
 * Edit mode: Inline form with Save/Cancel buttons
 */
export function SalesProfileTab({ record, mode, onModeToggle }: SalesProfileTabProps) {
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();

  // Form state (only used in edit mode)
  // Per Engineering Constitution #5: Form defaults from schema
  // Extract only the fields the schema expects (strictObject rejects unknown keys)
  const [formData, setFormData] = useState(() =>
    salesProfileSchema.parse({
      first_name: record.first_name,
      last_name: record.last_name,
      email: record.email,
      phone: record.phone,
      avatar_url: record.avatar_url,
    })
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form field
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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
            notify("Profile updated successfully", { type: "success" });
            if (onModeToggle) onModeToggle(); // Switch back to view mode
          },
          onError: (error: Error) => {
            notify(error.message || "Failed to update profile", { type: "error" });
            const errorWithErrors = error as Error & { errors?: Record<string, string> };
            if (errorWithErrors.errors) {
              setErrors(errorWithErrors.errors);
            }
          },
        }
      );
    } catch (error: unknown) {
      const errorWithErrors = error as { errors?: Record<string, string> };
      if (errorWithErrors.errors) {
        setErrors(errorWithErrors.errors);
        notify("Validation failed. Please check the form.", { type: "warning" });
      } else {
        notify("An error occurred", { type: "error" });
      }
    }
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    const firstName = mode === "edit" ? formData.first_name : record?.first_name;
    const lastName = mode === "edit" ? formData.last_name : record?.last_name;
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
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

  // Form submit handler for the footer button
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Wrap content in form when in edit mode so footer button works
  const content = (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <Avatar className="size-20">
          <AvatarImage
            src={mode === "edit" ? formData.avatar_url : record.avatar_url}
            alt={`${record.first_name} ${record.last_name}`}
          />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        {mode === "edit" && (
          <div className="w-full">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => handleChange("avatar_url", e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className={errors.avatar_url ? "border-destructive" : ""}
            />
            {errors.avatar_url && (
              <p className="text-sm text-destructive mt-1">{errors.avatar_url}</p>
            )}
          </div>
        )}
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          {mode === "view" ? (
            <p className="text-sm text-foreground mt-1">{record.first_name}</p>
          ) : (
            <>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                className={errors.first_name ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive mt-1">{errors.first_name}</p>
              )}
            </>
          )}
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          {mode === "view" ? (
            <p className="text-sm text-foreground mt-1">{record.last_name}</p>
          ) : (
            <>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                className={errors.last_name ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive mt-1">{errors.last_name}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">Email</Label>
        {mode === "view" ? (
          <p className="text-sm text-foreground mt-1">{record.email}</p>
        ) : (
          <>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
          </>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone">Phone</Label>
        {mode === "view" ? (
          <p className="text-sm text-foreground mt-1">{record.phone || "Not provided"}</p>
        ) : (
          <>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={errors.phone ? "border-destructive" : ""}
              disabled={isLoading}
              placeholder="Optional"
            />
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
          </>
        )}
      </div>
    </div>
  );

  // In edit mode, wrap with form so footer "Save Changes" button works
  if (mode === "edit") {
    return (
      <form id="slide-over-edit-form" onSubmit={handleFormSubmit}>
        {content}
      </form>
    );
  }

  return content;
}
