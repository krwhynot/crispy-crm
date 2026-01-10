import { useState, useCallback, useRef } from "react";
import { Form, useUpdate, useNotify } from "react-admin";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";
import type { Opportunity } from "@/atomic-crm/types";
import { OpportunityDetailsFormSection } from "./OpportunityDetailsFormSection";
import { OpportunityDetailsViewSection } from "./OpportunityDetailsViewSection";

interface ServerValidationError extends Error {
  body?: {
    errors?: Record<string, string>;
  };
}

interface OpportunitySlideOverDetailsTabProps {
  record: Opportunity;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  /** Whether this tab is currently active - available for conditional data fetching */
  isActiveTab: boolean;
}

export function OpportunitySlideOverDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
  isActiveTab,
}: OpportunitySlideOverDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<ServerValidationError | null>(null);

  // State for CloseOpportunityModal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeTargetStage, setCloseTargetStage] = useState<"closed_won" | "closed_lost">(
    "closed_won"
  );
  const pendingFormDataRef = useRef<Partial<Opportunity> | null>(null);

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(
    async (data: Partial<Opportunity>, additionalData?: Partial<CloseOpportunityInput>) => {
      setIsSaving(true);
      try {
        await update(
          "opportunities",
          {
            id: record.id,
            data: { ...data, ...additionalData },
            previousData: record,
          },
          {
            onSuccess: () => {
              setServerError(null); // Clear server errors on success
              notify("Opportunity updated successfully", { type: "success" });
              if (onModeToggle) {
                onModeToggle(); // Switch back to view mode
              }
            },
            onError: (error: Error & { body?: { errors?: Record<string, string> } }) => {
              notify(error?.message || "Failed to update opportunity", { type: "error" });
              // Store full error for field-level display
              setServerError(error as ServerValidationError);
            },
          }
        );
      } finally {
        setIsSaving(false);
      }
    },
    [update, record, notify, onModeToggle]
  );

  /**
   * Handle form submission - intercept closed stage transitions
   */
  const handleSave = useCallback(
    async (data: Partial<Opportunity>) => {
      const isClosingOpportunity =
        (data.stage === "closed_won" || data.stage === "closed_lost") &&
        record.stage !== data.stage;

      if (isClosingOpportunity) {
        // Store form data and show modal
        pendingFormDataRef.current = data;
        setCloseTargetStage(data.stage as "closed_won" | "closed_lost");
        setShowCloseModal(true);
        return;
      }

      // Regular save - no modal needed
      await performSave(data);
    },
    [record.stage, performSave]
  );

  /**
   * Handle confirmation from CloseOpportunityModal
   */
  const handleCloseConfirm = useCallback(
    async (closeData: CloseOpportunityInput) => {
      setShowCloseModal(false);
      if (pendingFormDataRef.current) {
        await performSave(pendingFormDataRef.current, {
          win_reason: closeData.win_reason,
          loss_reason: closeData.loss_reason,
          close_reason_notes: closeData.close_reason_notes,
        });
        pendingFormDataRef.current = null;
      }
    },
    [performSave]
  );

  /**
   * Handle modal cancel
   */
  const handleCloseModalOpenChange = useCallback((open: boolean) => {
    setShowCloseModal(open);
    if (!open) {
      pendingFormDataRef.current = null;
    }
  }, []);

  if (mode === "edit") {
    return (
      <Form
        id="slide-over-edit-form"
        defaultValues={record}
        onSubmit={handleSave}
        className="space-y-2"
      >
        <OpportunityDetailsFormSection
          record={record}
          onDirtyChange={onDirtyChange}
          serverError={serverError}
          showCloseModal={showCloseModal}
          closeTargetStage={closeTargetStage}
          handleCloseModalOpenChange={handleCloseModalOpenChange}
          handleCloseConfirm={handleCloseConfirm}
          isSaving={isSaving}
        />
      </Form>
    );
  }

  return <OpportunityDetailsViewSection record={record} isActiveTab={isActiveTab} />;
}
