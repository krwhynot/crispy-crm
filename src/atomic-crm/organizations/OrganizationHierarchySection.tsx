import { SelectInput } from "@/components/ra-wrappers/select-input";
import { BooleanInput } from "@/components/ra-wrappers/boolean-input";
import {
  CollapsibleSection,
  CompactFormRow,
  FormFieldWrapper,
} from "@/components/ra-wrappers/form";
import { ORG_SCOPE_CHOICES } from "./constants";
import { useRecordContext, useGetOne, Link, useCreatePath } from "react-admin";
import { useWatch, useFormContext } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import type { OrgScope } from "../validation/organizations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const OrganizationHierarchySection = (): JSX.Element => {
  const record = useRecordContext();
  const { setValue, getFieldState } = useFormContext();
  const orgScope = useWatch({ name: "org_scope" }) as OrgScope | null | undefined;
  const hasSetDefaultRef = useRef(false);

  // P3: Parent confirmation alert state and data
  const [showConfirmation, setShowConfirmation] = useState(false);
  const parentOrgId = useWatch({ name: "parent_organization_id" });
  const createPath = useCreatePath();

  const { data: parentOrg } = useGetOne(
    "organizations",
    { id: parentOrgId },
    { enabled: !!parentOrgId }
  );

  // P3: Show confirmation when parent selected (with stale data protection)
  useEffect(() => {
    // Guard: Only show if parentOrgId exists AND matches fetched data
    // (prevents showing stale data if react-query keeps previous result)
    if (parentOrgId && parentOrg && String(parentOrg.id) === String(parentOrgId)) {
      setShowConfirmation(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShowConfirmation(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConfirmation(false);
    }
  }, [parentOrgId, parentOrg]);

  // Smart defaults: National scope → is_operating_entity = false, Regional/Local → true
  // Guards: (1) Create forms only, (2) Field not manually touched, (3) orgScope defined
  useEffect(() => {
    // Guard 1: Only run on create forms (record?.id is undefined)
    if (record?.id !== undefined) {
      return;
    }

    // Guard 2: Only run if is_operating_entity field hasn't been manually touched
    const fieldState = getFieldState("is_operating_entity");
    if (fieldState.isDirty) {
      return;
    }

    // Guard 3: Only set if orgScope is defined
    if (!orgScope) {
      return;
    }

    // Prevent re-triggering if we've already set the default
    if (hasSetDefaultRef.current) {
      return;
    }

    // Apply smart default based on scope
    if (orgScope === "national") {
      setValue("is_operating_entity", false, { shouldDirty: false });
      hasSetDefaultRef.current = true;
    } else if (orgScope === "regional" || orgScope === "local") {
      setValue("is_operating_entity", true, { shouldDirty: false });
      hasSetDefaultRef.current = true;
    }
  }, [orgScope, record?.id, setValue, getFieldState]);

  return (
    <>
      {showConfirmation && parentOrg && String(parentOrg.id) === String(parentOrgId) && (
        <Alert className="relative mb-4 border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success-foreground">
            Parent organization set: {parentOrg.name}
          </AlertTitle>
          <AlertDescription className="text-success-foreground/90">
            This location will be created as a child of {parentOrg.name}.{" "}
            <Link
              to={createPath({ resource: "organizations", id: parentOrgId, type: "show" })}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              View Parent Details →
            </Link>
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setShowConfirmation(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      <CollapsibleSection title="Structure">
      <CompactFormRow>
        <FormFieldWrapper name="org_scope">
          <SelectInput
            source="org_scope"
            label="Scope"
            choices={ORG_SCOPE_CHOICES}
            helperText="National = brand/HQ, Regional = operating company"
            emptyText="Select scope"
            parse={(v) => v || null}
          />
        </FormFieldWrapper>
        <div className="space-y-1">
          <FormFieldWrapper name="is_operating_entity">
            <BooleanInput
              source="is_operating_entity"
              label="This location processes orders"
              helperText={false}
            />
          </FormFieldWrapper>
          <p className="text-sm text-muted-foreground ml-11">
            <strong>ON:</strong> Orders and invoices happen here (e.g., Sysco Chicago)
            <br />
            <strong>OFF:</strong> Corporate brand or holding company only (e.g., Sysco Corporation)
          </p>
        </div>
      </CompactFormRow>
    </CollapsibleSection>
    </>
  );
};
