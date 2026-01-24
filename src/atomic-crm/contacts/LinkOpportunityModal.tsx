import { useCreate, useNotify, useDataProvider, Form, ReferenceInput } from "react-admin";
import { useQueryClient } from "@tanstack/react-query";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { getAutocompleteProps } from "@/atomic-crm/utils/autocompleteDefaults";
import { activityKeys, opportunityKeys, contactKeys } from "@/atomic-crm/queryKeys";
import { logger } from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminButton } from "@/components/admin/AdminButton";
import type { Opportunity } from "@/atomic-crm/types";

interface LinkOpportunityModalProps {
  open: boolean;
  contactName: string;
  contactId: number;
  linkedOpportunityIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

interface LinkOpportunityFormData {
  opportunity_id?: number;
}

export function LinkOpportunityModal({
  open,
  contactName,
  contactId,
  linkedOpportunityIds,
  onClose,
  onSuccess,
}: LinkOpportunityModalProps) {
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();

  const handleLink = async (data: LinkOpportunityFormData) => {
    if (!data.opportunity_id) return;

    // Check for duplicate
    if (linkedOpportunityIds.includes(data.opportunity_id)) {
      notify("This contact is already linked to that opportunity", {
        type: "warning",
      });
      return;
    }

    try {
      await create(
        "opportunity_contacts",
        {
          data: {
            opportunity_id: data.opportunity_id,
            contact_id: contactId,
          },
        },
        {
          onSuccess: async () => {
            notify("Opportunity linked successfully", { type: "success" });
            onSuccess();
            onClose();

            // Log activity after successful link
            try {
              // Fetch opportunity details for activity log
              const { data: opportunity } = await dataProvider.getOne<Opportunity>(
                "opportunities",
                { id: data.opportunity_id! }
              );

              await dataProvider.create("activities", {
                data: {
                  activity_type: "interaction",
                  type: "note",
                  subject: `Contact linked: ${contactName}`,
                  activity_date: new Date().toISOString(),
                  opportunity_id: opportunity.id,
                  organization_id: opportunity.customer_organization_id,
                },
              });
              queryClient.invalidateQueries({ queryKey: activityKeys.all });
              queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
              queryClient.invalidateQueries({ queryKey: contactKeys.all });
            } catch (activityError) {
              logger.error("Failed to log contact link activity", activityError, { feature: "LinkOpportunityModal", opportunityId: data.opportunity_id });
              // Don't notify user since the link itself succeeded
            }
          },
          onError: (error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to link opportunity";
            notify(errorMessage, { type: "error" });
          },
        }
      );
    } catch {
      notify("Failed to link opportunity. Please try again.", { type: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Opportunity to {contactName}</DialogTitle>
          <DialogDescription>
            Search for an opportunity to associate with this contact.
          </DialogDescription>
        </DialogHeader>

        <Form onSubmit={handleLink} className="space-y-4">
          <ReferenceInput source="opportunity_id" reference="opportunities">
            <AutocompleteInput
              {...getAutocompleteProps("name")}
              optionText={(opp: Opportunity) =>
                opp ? `${opp.name} - ${opp.customer_organization_name || ""} (${opp.stage})` : ""
              }
              label="Search opportunities"
            />
          </ReferenceInput>

          <DialogFooter>
            <AdminButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" disabled={isLoading}>
              {isLoading ? "Linking..." : "Link Opportunity"}
            </AdminButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
