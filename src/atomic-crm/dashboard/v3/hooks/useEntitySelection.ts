import { useCallback } from "react";
import type { UseFormSetValue, UseFormGetValues } from "react-hook-form";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";
import type { Contact, Organization, Opportunity } from "./useEntityData";

interface EntityStores {
  contacts: Contact[];
  organizations: Organization[];
  opportunities: Opportunity[];
}

interface UseEntitySelectionOptions {
  setValue: UseFormSetValue<ActivityLogInput>;
  getValues: UseFormGetValues<ActivityLogInput>;
  entityStores: EntityStores;
  notify?: (message: string, options: { type: "success" | "info" | "warning" | "error" }) => void;
}

interface UseEntitySelectionReturn {
  handleContactSelect: (contact: Contact) => void;
  handleContactClear: () => void;
  handleOrganizationSelect: (org: Organization) => void;
  handleOrganizationClear: () => void;
}

export type { EntityStores, UseEntitySelectionOptions, UseEntitySelectionReturn };

/**
 * Hook for managing cascading entity selection logic
 *
 * Extracted from QuickLogForm to enable testing and reuse.
 * Handles the cascade relationships between Contact, Organization, and Opportunity:
 * - Contact selection auto-fills Organization
 * - Contact clear cascades to Organization and Opportunity
 * - Organization selection clears mismatched Contact and Opportunity
 * - Organization clear cascades to Opportunity if it belonged to that org
 */
export function useEntitySelection({
  setValue,
  getValues,
  entityStores,
  notify,
}: UseEntitySelectionOptions): UseEntitySelectionReturn {
  const handleContactSelect = useCallback(
    (contact: Contact) => {
      if (contact.organization_id) {
        setValue("organizationId", contact.organization_id);
      }
    },
    [setValue]
  );

  const handleContactClear = useCallback(() => {
    setValue("organizationId", undefined);
    setValue("opportunityId", undefined);
  }, [setValue]);

  const handleOrganizationSelect = useCallback(
    (org: Organization) => {
      const currentContactId = getValues("contactId");
      const currentOppId = getValues("opportunityId");

      if (currentContactId) {
        const contact = entityStores.contacts.find((c) => c.id === currentContactId);
        if (contact && contact.organization_id !== org.id) {
          setValue("contactId", undefined);
          notify?.("Contact cleared - doesn't belong to selected organization", { type: "info" });
        }
      }

      if (currentOppId) {
        const opp = entityStores.opportunities.find((o) => o.id === currentOppId);
        if (opp && opp.customer_organization_id !== org.id) {
          setValue("opportunityId", undefined);
        }
      }
    },
    [setValue, getValues, entityStores.contacts, entityStores.opportunities, notify]
  );

  const handleOrganizationClear = useCallback(() => {
    const currentOppId = getValues("opportunityId");
    const currentOrgId = getValues("organizationId");

    if (currentOppId && currentOrgId) {
      const opp = entityStores.opportunities.find((o) => o.id === currentOppId);
      if (opp && opp.customer_organization_id === currentOrgId) {
        setValue("opportunityId", undefined);
      }
    }
  }, [setValue, getValues, entityStores.opportunities]);

  return {
    handleContactSelect,
    handleContactClear,
    handleOrganizationSelect,
    handleOrganizationClear,
  };
}
