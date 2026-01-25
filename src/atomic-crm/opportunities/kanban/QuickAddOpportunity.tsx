import { useState } from "react";
import { QuickAddOpportunityDialog } from "./QuickAddOpportunityDialog";
import { useQuickAddOpportunityData } from "./hooks/useQuickAddOpportunityData";
import { useQuickAddOpportunityForm } from "./hooks/useQuickAddOpportunityForm";
import type { OpportunityStageValue, Opportunity } from "@/atomic-crm/types";

interface QuickAddOpportunityProps {
  stage: OpportunityStageValue;
  /** Callback when opportunity is created - enables optimistic UI updates */
  onOpportunityCreated?: (opportunity: Opportunity) => void;
}

/**
 * Quick-add opportunity button and dialog
 * Split into modular components per CQ-03 (423 lines → ~150 lines)
 */
export function QuickAddOpportunity({ stage, onOpportunityCreated }: QuickAddOpportunityProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch organization data
  const { principals, principalsLoading, customers, customersLoading } =
    useQuickAddOpportunityData();

  // Form state and submission logic
  const {
    name,
    setName,
    customerId,
    setCustomerId,
    principalId,
    setPrincipalId,
    errors,
    setErrors,
    isLoading,
    stageLabel,
    handleSubmit,
    resetForm,
  } = useQuickAddOpportunityForm({
    stage,
    onOpportunityCreated,
    principals,
    customers,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-11 px-3 text-sm text-primary hover:bg-primary/10 rounded transition-colors border border-dashed border-border flex items-center justify-center"
      >
        + New Opportunity
      </button>

      <QuickAddOpportunityDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        name={name}
        onNameChange={setName}
        principalId={principalId}
        onPrincipalChange={setPrincipalId}
        customerId={customerId}
        onCustomerChange={setCustomerId}
        errors={errors}
        setErrors={setErrors}
        principals={principals}
        principalsLoading={principalsLoading}
        customers={customers}
        customersLoading={customersLoading}
        isLoading={isLoading}
        stageLabel={stageLabel}
        resetForm={resetForm}
      />
    </>
  );
}
