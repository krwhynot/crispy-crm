import type { Organization } from "@/atomic-crm/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickAddOrganizationFieldsProps {
  principalId: string;
  onPrincipalChange: (value: string) => void;
  principalError?: string;
  onPrincipalErrorClear: () => void;
  principals?: Organization[];
  principalsLoading: boolean;
  customerId: string;
  onCustomerChange: (value: string) => void;
  customerError?: string;
  onCustomerErrorClear: () => void;
  customers?: Organization[];
  customersLoading: boolean;
  disabled?: boolean;
}

/**
 * Organization selection fields for quick-add opportunity form
 * Includes both principal and customer organization selects
 */
export function QuickAddOrganizationFields({
  principalId,
  onPrincipalChange,
  principalError,
  onPrincipalErrorClear,
  principals,
  principalsLoading,
  customerId,
  onCustomerChange,
  customerError,
  onCustomerErrorClear,
  customers,
  customersLoading,
  disabled,
}: QuickAddOrganizationFieldsProps) {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="principal" className="block text-sm font-medium mb-1">
          Principal <span className="text-destructive">*</span>
        </label>
        <Select
          value={principalId || undefined}
          onValueChange={(value) => {
            onPrincipalChange(value);
            // Clear error when user selects
            if (principalError) onPrincipalErrorClear();
          }}
          disabled={disabled || principalsLoading}
        >
          <SelectTrigger
            id="principal"
            className={`w-full h-11 ${principalError ? "border-destructive" : ""}`}
            aria-invalid={principalError ? "true" : undefined}
            aria-describedby={principalError ? "principal-error" : undefined}
          >
            <SelectValue
              placeholder={principalsLoading ? "Loading principals..." : "Select a principal"}
            />
          </SelectTrigger>
          <SelectContent>
            {principals?.map((principal) => (
              <SelectItem key={principal.id} value={String(principal.id)}>
                {principal.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {principalError && (
          <p id="principal-error" role="alert" className="mt-1 text-sm text-destructive">
            {principalError}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="customer" className="block text-sm font-medium mb-1">
          Customer <span className="text-destructive">*</span>
        </label>
        <Select
          value={customerId || undefined}
          onValueChange={(value) => {
            onCustomerChange(value);
            // Clear error when user selects
            if (customerError) onCustomerErrorClear();
          }}
          disabled={disabled || customersLoading}
        >
          <SelectTrigger
            id="customer"
            className={`w-full h-11 ${customerError ? "border-destructive" : ""}`}
            aria-invalid={customerError ? "true" : undefined}
            aria-describedby={customerError ? "customer-error" : undefined}
          >
            <SelectValue
              placeholder={customersLoading ? "Loading customers..." : "Select a customer"}
            />
          </SelectTrigger>
          <SelectContent>
            {customers?.map((customer) => (
              <SelectItem key={customer.id} value={String(customer.id)}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {customerError && (
          <p id="customer-error" role="alert" className="mt-1 text-sm text-destructive">
            {customerError}
          </p>
        )}
      </div>
    </>
  );
}
