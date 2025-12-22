/**
 * OrganizationCreate - Create form for new organizations
 *
 * Features:
 * - Soft duplicate warning: Shows confirmation dialog instead of hard block
 * - Schema-derived defaults (Constitution #5: Form state from truth)
 * - Website URL auto-prefixing
 * - Parent organization pre-fill from router state
 *
 * The duplicate check uses useDuplicateOrgCheck hook which performs a
 * case-insensitive search before save. If a potential duplicate is found,
 * DuplicateOrgWarningDialog appears to let the user confirm or change the name.
 */
import { useState, useCallback, useRef } from "react";
import { CreateBase, Form, useGetList, useCreate, useRedirect, useNotify } from "ra-core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import {
  SaveButton,
  FormLoadingSkeleton,
  FormProgressProvider,
  FormProgressBar,
} from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { useLocation } from "react-router-dom";
import { useFormContext } from "react-hook-form";

import { OrganizationInputs } from "./OrganizationInputs";
import { organizationSchema } from "../validation/organizations";
import { useDuplicateOrgCheck } from "./useDuplicateOrgCheck";
import { DuplicateOrgWarningDialog } from "./DuplicateOrgWarningDialog";
import { useSmartDefaults } from "@/atomic-crm/hooks/useSmartDefaults";
import type { Database } from "@/types/database.generated";
import type { OrganizationFormValues, DuplicateCheckCallback } from "./types";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

type Segment = Database["public"]["Tables"]["segments"]["Row"];

/**
 * Custom save button that checks for duplicates before saving
 *
 * Uses a hidden submit button pattern:
 * 1. Visible button checks for duplicates on click
 * 2. If no duplicate, triggers hidden submit button to perform actual save
 * 3. Hidden button has type="submit" which triggers React Admin's form submission
 */
interface DuplicateCheckSaveButtonProps {
  onDuplicateFound: DuplicateCheckCallback;
  checkForDuplicate: (name: string) => Promise<{ id: string | number; name: string } | null>;
  isChecking: boolean;
}

const DuplicateCheckSaveButton = ({
  onDuplicateFound,
  checkForDuplicate,
  isChecking,
}: DuplicateCheckSaveButtonProps) => {
  const form = useFormContext();
  // Ref to the hidden submit button
  const hiddenSubmitRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      // Get current form values
      const values = form.getValues();
      const name = values.name?.trim();

      if (!name) {
        // Empty name - trigger validation to show required field error
        form.trigger("name");
        return;
      }

      // Check for duplicates
      const duplicate = await checkForDuplicate(name);
      if (duplicate) {
        // Duplicate found - trigger the dialog instead of saving
        onDuplicateFound(duplicate.name, values);
        return;
      }

      // No duplicate - trigger the hidden submit button
      hiddenSubmitRef.current?.click();
    },
    [form, checkForDuplicate, onDuplicateFound]
  );

  return (
    <>
      {/* Hidden native submit button that triggers React Admin form submission */}
      <button
        ref={hiddenSubmitRef}
        type="submit"
        style={{ display: "none" }}
        aria-hidden="true"
        tabIndex={-1}
      />
      {/* Visible button that checks for duplicates first */}
      <SaveButton
        label={isChecking ? "Checking..." : "Create Organization"}
        type="button"
        onClick={handleClick}
        disabled={isChecking}
        alwaysEnable={true}
        data-tutorial="org-save-btn"
      />
    </>
  );
};

const OrganizationCreate = () => {
  const location = useLocation();
  const [create] = useCreate();
  const redirect = useRedirect();
  const notify = useNotify();

  // Smart defaults hook for async identity handling
  const { defaults: smartDefaults, isLoading: isLoadingDefaults } = useSmartDefaults();

  // Duplicate check hook for soft warning
  const { checkForDuplicate, duplicateOrg, clearDuplicate, bypassDuplicate, isChecking } =
    useDuplicateOrgCheck();

  // Store pending values when duplicate is found
  const pendingValuesRef = useRef<OrganizationFormValues | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: segments = [] } = useGetList<Segment>(
    "segments",
    {
      filter: { name: "Unknown" },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "name", order: "ASC" },
    },
    {
      enabled: true,
    }
  );

  const unknownSegmentId = segments?.[0]?.id;

  // Read parent_organization_id from router state (set by "Add Branch" button)
  const parentOrgId = (location.state as { record?: { parent_organization_id?: string | number } })?.record?.parent_organization_id;

  // Transform function for URL prefixing
  // NOTE: All useCallback hooks must be declared before any early returns (React rules-of-hooks)
  const transformValues = useCallback((values: OrganizationFormValues) => {
    if (values.website && !values.website.startsWith("http")) {
      values.website = `https://${values.website}`;
    }
    return values;
  }, []);

  // Handle when duplicate is found - store values and show dialog
  const handleDuplicateFound = useCallback((_duplicateName: string, values: OrganizationFormValues) => {
    pendingValuesRef.current = values;
  }, []);

  // Handle user confirming to create despite duplicate
  const handleProceedAnyway = useCallback(async () => {
    if (!pendingValuesRef.current) return;

    setIsCreating(true);
    try {
      const transformedValues = transformValues(pendingValuesRef.current);
      await create(
        "organizations",
        { data: transformedValues },
        {
          onSuccess: (data) => {
            bypassDuplicate();
            pendingValuesRef.current = null;
            notify("Organization created", { type: "success" });
            redirect("show", "organizations", data.id);
          },
          onError: (error: unknown) => {
            notify(error instanceof Error ? error.message : "Failed to create organization", { type: "error" });
          },
        }
      );
    } finally {
      setIsCreating(false);
    }
  }, [create, transformValues, bypassDuplicate, notify, redirect]);

  // Handle user canceling (wants to change name)
  const handleCancelDuplicate = useCallback(() => {
    clearDuplicate();
    pendingValuesRef.current = null;
  }, [clearDuplicate]);

  // Show loading skeleton while identity loads
  if (isLoadingDefaults) {
    return (
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormLoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  // Generate defaults from schema, then merge with runtime values
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // Use .partial() to make all fields optional during default generation
  // This extracts fields with .default() (organization_type, priority)
  // Note: Only use sales_id from smartDefaults - activity_date is for activities only
  const formDefaults = {
    ...organizationSchema.partial().parse({}),
    sales_id: smartDefaults.sales_id, // Only take sales_id, not activity_date
    // Use null (not undefined) when no segment found - null is a valid value for nullable UUID fields
    segment_id: unknownSegmentId ?? null,
    ...(parentOrgId ? { parent_organization_id: parentOrgId } : {}), // Pre-fill parent when adding branch
  };
  const formKey = unknownSegmentId ? `org-create-${unknownSegmentId}` : "org-create";

  // Connect Zod schema as form resolver for client-side validation
  // This enables form.trigger() to work in DuplicateCheckSaveButton
  // Schema remains single source of truth (Constitution-compliant)
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: formDefaults,
    mode: "onBlur",
  });

  return (
    <>
      <CreateBase redirect="show" transform={transformValues}>
        <div className="bg-muted px-6 py-6">
          <div className="max-w-4xl mx-auto create-form-card">
            <FormProgressProvider initialProgress={10}>
              <Form key={formKey} {...form}>
                <FormProgressBar className="mb-6" />
                <Card>
                  <CardContent>
                    <OrganizationFormContent
                      onDuplicateFound={handleDuplicateFound}
                      checkForDuplicate={checkForDuplicate}
                      isChecking={isChecking}
                    />
                  </CardContent>
                </Card>
              </Form>
            </FormProgressProvider>
          </div>
        </div>
      </CreateBase>

      {/* Soft duplicate warning dialog */}
      <DuplicateOrgWarningDialog
        open={!!duplicateOrg}
        duplicateName={duplicateOrg?.name}
        onCancel={handleCancelDuplicate}
        onProceed={handleProceedAnyway}
        isLoading={isCreating}
      />
    </>
  );
};

const OrganizationFormContent = ({
  onDuplicateFound,
  checkForDuplicate,
  isChecking,
}: {
  onDuplicateFound: DuplicateCheckCallback;
  checkForDuplicate: (name: string) => Promise<{ id: string | number; name: string } | null>;
  isChecking: boolean;
}) => {
  useUnsavedChangesWarning();

  return (
    <>
      <OrganizationInputs />
      <FormToolbar>
        <div className="flex flex-row gap-2 justify-end">
          <CancelButton />
          <DuplicateCheckSaveButton
            onDuplicateFound={onDuplicateFound}
            checkForDuplicate={checkForDuplicate}
            isChecking={isChecking}
          />
        </div>
      </FormToolbar>
    </>
  );
};

export { OrganizationCreate };
export default OrganizationCreate;
