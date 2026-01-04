import { useCreate, useNotify, Form, ReferenceInput } from "react-admin";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { getAutocompleteProps } from "@/atomic-crm/utils/autocompleteDefaults";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
          onSuccess: () => {
            notify("Opportunity linked successfully", { type: "success" });
            onSuccess();
            onClose();
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Linking..." : "Link Opportunity"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
