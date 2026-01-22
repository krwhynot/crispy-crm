import type { Control } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { SidepaneSection } from "@/components/layouts/sidepane";
import { EntityCombobox } from "./EntityCombobox";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";
import type { UseEntitySelectionReturn } from "../hooks/useEntitySelection";

interface EntityDataForSection {
  filteredContacts: Array<{ id: number; name: string; company_name?: string }>;
  filteredOrganizations: Array<{ id: number; name: string }>;
  filteredOpportunities: Array<{ id: number; name: string }>;
  contactsForAnchorOrg: Array<{ id: number; name: string; company_name?: string }>;
  oppsForAnchorOrg: Array<{ id: number; name: string }>;
  contactsLoading: boolean;
  organizationsLoading: boolean;
  opportunitiesLoading: boolean;
  anchorOrganizationId: number | null;
  contactSearch: { searchTerm: string; setSearchTerm: (term: string) => void };
  orgSearch: { searchTerm: string; setSearchTerm: (term: string) => void };
  oppSearch: { searchTerm: string; setSearchTerm: (term: string) => void };
}

interface EntitySelectionSectionProps {
  control: Control<ActivityLogInput>;
  entityData: EntityDataForSection;
  handlers: UseEntitySelectionReturn;
}

/**
 * Entity selection section for QuickLogForm
 *
 * Provides Contact, Organization, and Opportunity selection with:
 * - Cascading filters (org filters contacts/opportunities)
 * - Auto-fill behavior (contact auto-fills org, opp auto-fills org)
 * - Proper accessibility with unique listId attributes
 *
 * @pattern Extracted from QuickLogForm for reusability and testability
 */
export function EntitySelectionSection({
  control,
  entityData,
  handlers,
}: EntitySelectionSectionProps) {
  return (
    <SidepaneSection label="Who Was Involved">
      <div className="space-y-3">
        <FormField
          control={control}
          name="contactId"
          render={({ field }) => (
            <EntityCombobox
              value={field.value}
              onChange={field.onChange}
              options={entityData.filteredContacts.map((c) => ({
                id: c.id,
                name: c.name,
                subtitle: c.company_name,
              }))}
              fallbackOptions={entityData.contactsForAnchorOrg.map((c) => ({
                id: c.id,
                name: c.name,
                subtitle: c.company_name,
              }))}
              loading={entityData.contactsLoading}
              searchTerm={entityData.contactSearch.searchTerm}
              onSearchChange={entityData.contactSearch.setSearchTerm}
              placeholder="Select contact"
              emptyMessage="No contact found. Type to search."
              filteredEmptyMessage="No contacts found for this organization"
              isFiltered={!!entityData.anchorOrganizationId}
              label="Contact"
              description="Select a contact and/or organization (must be from same company)"
              onSelect={handlers.handleContactSelect}
              onClear={handlers.handleContactClear}
              listId="contact-list"
            />
          )}
        />

        <FormField
          control={control}
          name="organizationId"
          render={({ field }) => (
            <EntityCombobox
              value={field.value}
              onChange={field.onChange}
              options={entityData.filteredOrganizations.map((o) => ({
                id: o.id,
                name: o.name,
              }))}
              loading={entityData.organizationsLoading}
              searchTerm={entityData.orgSearch.searchTerm}
              onSearchChange={entityData.orgSearch.setSearchTerm}
              placeholder="Select organization"
              emptyMessage="No organization found. Type to search."
              label="Organization"
              onSelect={handlers.handleOrganizationSelect}
              onClear={handlers.handleOrganizationClear}
              listId="organization-list"
            />
          )}
        />

        <FormField
          control={control}
          name="opportunityId"
          render={({ field }) => (
            <EntityCombobox
              value={field.value}
              onChange={field.onChange}
              options={entityData.filteredOpportunities.map((o) => ({
                id: o.id,
                name: o.name,
              }))}
              fallbackOptions={entityData.oppsForAnchorOrg.map((o) => ({
                id: o.id,
                name: o.name,
              }))}
              loading={entityData.opportunitiesLoading}
              searchTerm={entityData.oppSearch.searchTerm}
              onSearchChange={entityData.oppSearch.setSearchTerm}
              placeholder="Select opportunity (optional)"
              emptyMessage="No opportunity found. Type to search."
              filteredEmptyMessage="No opportunities for this organization"
              isFiltered={!!entityData.anchorOrganizationId}
              label="Opportunity"
              listId="opportunity-list"
            />
          )}
        />
      </div>
    </SidepaneSection>
  );
}
