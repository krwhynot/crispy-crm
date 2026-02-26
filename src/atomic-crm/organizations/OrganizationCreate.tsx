/**
 * OrganizationCreate - Create form for new organizations
 *
 * Features:
 * - Hard duplicate block: Shows dialog requiring name change or view existing
 * - Schema-derived defaults (Constitution #5: Form state from truth)
 * - Website URL auto-prefixing
 * - Parent organization pre-fill from router state
 *
 * The duplicate check uses useDuplicateOrgCheck hook which performs a
 * case-insensitive search before save. If a potential duplicate is found,
 * DuplicateOrgWarningDialog blocks creation until the user changes the name
 * or views the existing organization.
 */
import { useCallback, useEffect } from "react";
import { CreateBase, Form, useRedirect, useNotify, useCanAccess } from "ra-core";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import {
  FormLoadingSkeleton,
  FormProgressProvider,
  FormProgressBar,
} from "@/components/ra-wrappers/form";
import { useLocation } from "react-router-dom";

import { OrganizationInputs } from "./OrganizationInputs";
import { createOrganizationSchema } from "../validation/organizations";
import { ORGANIZATION_FORM_VARIANTS } from "../validation/organizationFormConfig";
import { useDuplicateOrgCheck } from "./useDuplicateOrgCheck";
import { DuplicateOrgWarningDialog } from "./DuplicateOrgWarningDialog";
import { OrganizationCreateFormFooter } from "./OrganizationCreateFormFooter";
import { useSmartDefaults } from "@/atomic-crm/hooks/useSmartDefaults";
import type { OrganizationFormValues } from "./types";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Prevents Enter key in form inputs from triggering form submission
 *
 * This is critical for the duplicate check pattern: without this, pressing Enter
 * in any text field would trigger form submission directly, completely
 * bypassing the duplicate detection logic.
 *
 * Only blocks Enter in INPUT elements (not TEXTAREA for multi-line input).
 */
const handleFormKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
  if (
    event.key === "Enter" &&
    event.target instanceof HTMLInputElement &&
    event.target.type !== "submit"
  ) {
    event.preventDefault();
  }
};

const OrganizationCreate = () => {
  const location = useLocation();
  const redirect = useRedirect();
  const notify = useNotify();

  // RBAC Guard: Only authorized users can access the create form
  const { canAccess, isPending: isCheckingAccess } = useCanAccess({
    resource: "organizations",
    action: "create",
  });

  // Get user role for field-level permissions
  const { isRep } = usePermissions();

  // Smart defaults hook for async identity handling
  const { defaults: smartDefaults, isLoading: isLoadingDefaults } = useSmartDefaults();

  // Duplicate check hook for hard block
  const { checkForDuplicate, duplicateOrg, clearDuplicate, isChecking } = useDuplicateOrgCheck();

  // Read parent_organization_id from router state (set by "Add Branch" button)
  const parentOrgId = (location.state as { record?: { parent_organization_id?: string | number } })
    ?.record?.parent_organization_id;

  // Transform function for URL prefixing
  // NOTE: All useCallback hooks must be declared before any early returns (React rules-of-hooks)
  const transformValues = useCallback((values: OrganizationFormValues) => {
    if (values.website && !values.website.startsWith("http")) {
      values.website = `https://${values.website}`;
    }
    return values;
  }, []);

  // Handle user canceling (wants to change name)
  const handleCancelDuplicate = useCallback(() => {
    clearDuplicate();
  }, [clearDuplicate]);

  // Handle user wanting to view the existing duplicate organization
  const handleViewExisting = useCallback(() => {
    if (duplicateOrg?.id) {
      clearDuplicate();
      redirect("show", "organizations", duplicateOrg.id);
    }
  }, [duplicateOrg?.id, clearDuplicate, redirect]);

  // Redirect unauthorized users after permission check completes
  useEffect(() => {
    if (!isCheckingAccess && !canAccess) {
      notify("You don't have permission to create organizations.", { type: "warning" });
      redirect("/organizations");
    }
  }, [isCheckingAccess, canAccess, notify, redirect]);

  // Generate defaults from schema, then merge with runtime values
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // IMPORTANT: Only include fields defined in organizationSchema (z.strictObject rejects unknown keys)
  const variant = ORGANIZATION_FORM_VARIANTS.create;
  const formDefaults = {
    ...variant.defaultValues,
    sales_id: smartDefaults?.sales_id ?? null, // Runtime override - Account Manager from identity
    ...(parentOrgId ? { parent_organization_id: parentOrgId } : {}), // Router state override - pre-fill parent when adding branch
  };
  const formKey = "org-create";

  // Show loading skeleton while identity loads or checking permissions
  // NOTE: This early return is now AFTER all hooks have been called
  if (isLoadingDefaults || isCheckingAccess) {
    return (
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormLoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  // Don't render form for unauthorized users
  if (!canAccess) {
    return null;
  }

  // Guard: Ensure required defaults are available before rendering form
  // Per plan: Organization Form requires sales_id (Account Manager) and segment_id (Segment)
  // These are auto-filled from identity and "Unknown" segment respectively
  if (!smartDefaults?.sales_id) {
    return (
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <SectionCard contentClassName="py-8 text-center">
            <p className="text-destructive">
              Unable to load user account. Please refresh the page.
            </p>
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <>
      <CreateBase redirect="show" transform={transformValues}>
        {/* onKeyDown prevents Enter from bypassing duplicate check - see handleFormKeyDown */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Event delegation for form input Enter key prevention, not an interactive element */}
        <div className="bg-muted px-6 py-6" onKeyDown={handleFormKeyDown}>
          <div className="max-w-4xl mx-auto create-form-card">
            <FormProgressProvider initialProgress={10}>
              <Form
                key={formKey}
                defaultValues={formDefaults}
                mode="all"
                resolver={createFormResolver(createOrganizationSchema)}
              >
                <FormProgressBar schema={createOrganizationSchema} className="mb-6" />
                <SectionCard>
                  <OrganizationFormContent
                    checkForDuplicate={checkForDuplicate}
                    isChecking={isChecking}
                    transformValues={transformValues}
                    isRep={isRep}
                  />
                </SectionCard>
              </Form>
            </FormProgressProvider>
          </div>
        </div>
      </CreateBase>

      {/* Hard duplicate block dialog */}
      <DuplicateOrgWarningDialog
        open={!!duplicateOrg}
        duplicateName={duplicateOrg?.name}
        duplicateOrgId={duplicateOrg?.id}
        onCancel={handleCancelDuplicate}
        onViewExisting={handleViewExisting}
      />
    </>
  );
};

interface OrganizationFormContentProps {
  checkForDuplicate: (name: string) => Promise<{ id: string | number; name: string } | null>;
  isChecking: boolean;
  transformValues: (values: OrganizationFormValues) => OrganizationFormValues;
  isRep?: boolean;
}

const OrganizationFormContent = ({
  checkForDuplicate,
  isChecking,
  transformValues,
  isRep,
}: OrganizationFormContentProps) => {
  useUnsavedChangesWarning();

  return (
    <>
      <OrganizationInputs isRep={isRep} />
      <OrganizationCreateFormFooter
        checkForDuplicate={checkForDuplicate}
        isChecking={isChecking}
        redirectPath="/organizations"
        transformValues={transformValues}
      />
    </>
  );
};

export { OrganizationCreate };
export default OrganizationCreate;
