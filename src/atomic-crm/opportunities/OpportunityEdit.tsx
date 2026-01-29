import { useMemo, useRef } from "react";
import { EditBase, Form, useRecordContext, useRefresh } from "ra-core";
import { useSafeNotify } from "../hooks/useSafeNotify";
import { useQueryClient } from "@tanstack/react-query";

import { opportunityKeys } from "../queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/ra-wrappers/delete-button";
import { SaveButton, FormProgressProvider } from "@/components/ra-wrappers/form";
import { CancelButton } from "@/components/ra-wrappers/cancel-button";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { FormToolbar } from "@/components/ra-wrappers/simple-form";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import type { Opportunity } from "../types";
import { OpportunityCompactForm } from "./OpportunityCompactForm";
import { OpportunityActivitySection } from "./OpportunityActivitySection";
import { opportunitySchema } from "@/atomic-crm/validation/opportunities";
import { createFormResolver } from "@/lib/zodErrorFormatting";

const OpportunityEdit = () => {
  const queryClient = useQueryClient();
  const { warning, actionError } = useSafeNotify();
  const refresh = useRefresh();

  return (
    <EditBase
      actions={false}
      redirect="show"
      mutationMode="pessimistic"
      transform={(data: Opportunity) => {
        // WF-H1-004: Inject previous_stage for stage transition validation
        // React Admin doesn't track field history, so we get initial value from form component
        return data;
      }}
      mutationOptions={{
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
        },
        onError: (err: Error) => {
          if (err.message?.includes("CONFLICT")) {
            warning(
              "This opportunity was modified by another user. Refreshing to show latest version."
            );
            refresh();
          } else {
            actionError(err, "update", "opportunity");
          }
        },
      }}
    >
      <div className="mt-2">
        <OpportunityEditForm />
      </div>
    </EditBase>
  );
};

const OpportunityEditForm = () => {
  const record = useRecordContext<Opportunity>();

  // WF-H1-004: Capture initial stage for transition validation
  // This ref persists the original stage value across re-renders
  const initialStageRef = useRef<string | null>(null);

  // Guard against null record during initial render - useMemo must be called unconditionally
  // per React hooks rules, so we handle null inside the callback
  const defaultValues = useMemo(() => {
    if (!record) return {};

    // Capture initial stage on first load
    if (initialStageRef.current === null && record.stage) {
      initialStageRef.current = record.stage;
    }

    return opportunitySchema.partial().parse(record);
  }, [record]);

  // Wait for record to load before rendering form
  if (!record) return null;

  return (
    <FormProgressProvider>
      <Form
        className="flex flex-1 flex-col gap-4 pb-2"
        defaultValues={defaultValues}
        mode="onBlur"
        resolver={createFormResolver(opportunitySchema)}
        transform={(data: Opportunity) => {
          // WF-H1-004: Inject previous_stage for validation
          // Only include if stage field is present in the update
          if (data.stage && initialStageRef.current) {
            return {
              ...data,
              previous_stage: initialStageRef.current,
            };
          }
          return data;
        }}
      >
        <Card>
          <CardContent className="pt-6">
            <EditHeader />

            <div className="mt-6">
              <OpportunityCompactForm mode="edit" />
              <Separator className="my-6" />
              <OpportunityActivitySection />
            </div>

            <FormToolbar>
              <div className="flex flex-row gap-2 justify-between w-full">
                <DeleteButton />
                <div className="flex gap-2">
                  <CancelButton />
                  <SaveButton type="button" />
                </div>
              </div>
            </FormToolbar>
          </CardContent>
        </Card>
      </Form>
    </FormProgressProvider>
  );
};

const EditHeader = () => {
  const opportunity = useRecordContext<Opportunity>();
  if (!opportunity) return null;

  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-4">
        {opportunity.customer_organization_id && (
          <ReferenceField source="customer_organization_id" reference="organizations" link={false}>
            <OrganizationAvatar />
          </ReferenceField>
        )}
        <h2 className="text-2xl font-semibold">Edit {opportunity.name}</h2>
      </div>
    </div>
  );
};

export { OpportunityEdit };
export default OpportunityEdit;
