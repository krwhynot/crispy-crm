import { useEffect } from "react";
import { X } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { QuickAddNameField } from "./fields/QuickAddNameField";
import { QuickAddOrganizationFields } from "./fields/QuickAddOrganizationFields";
import { QuickAddStageField } from "./fields/QuickAddStageField";
import type { Organization } from "@/atomic-crm/types";

interface QuickAddOpportunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<boolean | void>;
  name: string;
  onNameChange: (value: string) => void;
  principalId: string;
  onPrincipalChange: (value: string) => void;
  customerId: string;
  onCustomerChange: (value: string) => void;
  errors: {
    name?: string;
    principalId?: string;
    customerId?: string;
  };
  setErrors: React.Dispatch<
    React.SetStateAction<{
      name?: string;
      principalId?: string;
      customerId?: string;
    }>
  >;
  principals?: Organization[];
  principalsLoading: boolean;
  customers?: Organization[];
  customersLoading: boolean;
  isLoading: boolean;
  stageLabel: string;
  resetForm: () => void;
}

/**
 * Modal dialog for quick-add opportunity form
 * Handles backdrop, ESC key, and form layout
 */
export function QuickAddOpportunityDialog({
  isOpen,
  onClose,
  onSubmit,
  name,
  onNameChange,
  principalId,
  onPrincipalChange,
  customerId,
  onCustomerChange,
  errors,
  setErrors,
  principals,
  principalsLoading,
  customers,
  customersLoading,
  isLoading,
  stageLabel,
  resetForm,
}: QuickAddOpportunityDialogProps) {
  // ESC key handler for modal dismissal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        resetForm();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, resetForm]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    const success = await onSubmit(e);
    if (success) {
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    // Backdrop: Using div with explicit role="none" since it's purely decorative/functional overlay
    // The actual dialog content has proper role="dialog" semantics
    <div
      role="none"
      className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-opportunity-title"
        className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200 relative"
      >
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 h-11 w-11 rounded-md hover:bg-accent active:bg-accent/80 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
        <h2 id="quick-add-opportunity-title" className="text-lg font-semibold mb-4">
          Create Opportunity
        </h2>

        <form onSubmit={handleFormSubmit}>
          <QuickAddNameField
            value={name}
            onChange={onNameChange}
            error={errors.name}
            onErrorClear={() => setErrors((prev) => ({ ...prev, name: undefined }))}
            disabled={isLoading}
          />

          <QuickAddOrganizationFields
            principalId={principalId}
            onPrincipalChange={onPrincipalChange}
            principalError={errors.principalId}
            onPrincipalErrorClear={() => setErrors((prev) => ({ ...prev, principalId: undefined }))}
            principals={principals}
            principalsLoading={principalsLoading}
            customerId={customerId}
            onCustomerChange={onCustomerChange}
            customerError={errors.customerId}
            onCustomerErrorClear={() => setErrors((prev) => ({ ...prev, customerId: undefined }))}
            customers={customers}
            customersLoading={customersLoading}
            disabled={isLoading}
          />

          <QuickAddStageField stageLabel={stageLabel} />

          <div className="flex gap-2 justify-end">
            <AdminButton
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" isLoading={isLoading} loadingText="Creating...">
              Create
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
