import type { Organization } from "@/atomic-crm/types";

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
        <select
          id="principal"
          value={principalId}
          onChange={(e) => {
            onPrincipalChange(e.target.value);
            // Clear error when user selects
            if (principalError) onPrincipalErrorClear();
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors bg-background ${
            principalError ? "border-destructive" : "border-border"
          }`}
          disabled={disabled || principalsLoading}
          aria-invalid={principalError ? "true" : undefined}
          aria-describedby={principalError ? "principal-error" : undefined}
        >
          <option value="">
            {principalsLoading ? "Loading principals..." : "Select a principal"}
          </option>
          {principals?.map((principal) => (
            <option key={principal.id} value={principal.id}>
              {principal.name}
            </option>
          ))}
        </select>
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
        <select
          id="customer"
          value={customerId}
          onChange={(e) => {
            onCustomerChange(e.target.value);
            // Clear error when user selects
            if (customerError) onCustomerErrorClear();
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors bg-background ${
            customerError ? "border-destructive" : "border-border"
          }`}
          disabled={disabled || customersLoading}
          aria-invalid={customerError ? "true" : undefined}
          aria-describedby={customerError ? "customer-error" : undefined}
        >
          <option value="">
            {customersLoading ? "Loading customers..." : "Select a customer"}
          </option>
          {customers?.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {customerError && (
          <p id="customer-error" role="alert" className="mt-1 text-sm text-destructive">
            {customerError}
          </p>
        )}
      </div>
    </>
  );
}
