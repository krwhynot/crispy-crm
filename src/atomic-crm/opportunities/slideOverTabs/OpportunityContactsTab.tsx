import { useState } from "react";
import {
  useGetList,
  Form,
  useNotify,
  useGetIdentity,
  ReferenceArrayInput,
  useDataProvider,
} from "react-admin";
import type { Identifier } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { OpportunitiesService } from "@/atomic-crm/services/opportunities.service";
import type { ExtendedDataProvider } from "@/atomic-crm/providers/supabase/extensions/types";
import { Link } from "react-router-dom";
import { contactKeys, opportunityKeys, opportunityContactKeys } from "@/atomic-crm/queryKeys";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";
import { AutocompleteArrayInput } from "@/components/ra-wrappers/autocomplete-array-input";
import { AdminButton } from "@/components/admin/AdminButton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserIcon, Star } from "lucide-react";
import {
  DirtyStateTracker,
  EMPTY_STATE_CONTENT,
  SidepaneEmptyState,
  SidepaneSection,
} from "@/components/layouts/sidepane";
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  shouldRenderSuggestions,
} from "@/atomic-crm/utils/autocompleteDefaults";
import { Card } from "@/components/ui/card";
import { QuickCreateContactRA } from "../../contacts/QuickCreateContactPopover";
import { contactOptionText } from "../../contacts/ContactOption";
import type { Opportunity, OpportunityContact, Contact } from "@/atomic-crm/types";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";

/**
 * Inner form component for contact editing - needs to be separate to access React Admin form context
 */
interface ContactEditFormContentProps {
  record: Opportunity;
  isSaving: boolean;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

function ContactEditFormContent({
  record,
  isSaving,
  onCancel,
  onDirtyChange,
}: ContactEditFormContentProps) {
  const { data: identity } = useGetIdentity();

  return (
    <>
      <DirtyStateTracker onDirtyChange={onDirtyChange} />
      <ReferenceArrayInput
        source="contact_ids"
        reference="contacts_summary"
        filter={{ organization_id: record.customer_organization_id }}
      >
        <AutocompleteArrayInput
          label="Contacts"
          optionText={contactOptionText}
          filterToQuery={(searchText: string) => ({ q: searchText })}
          debounce={AUTOCOMPLETE_DEBOUNCE_MS}
          shouldRenderSuggestions={shouldRenderSuggestions}
          helperText="Search and select contacts associated with this opportunity"
          create={
            record.customer_organization_id ? (
              <QuickCreateContactRA
                organizationId={record.customer_organization_id}
                salesId={identity?.id as number | undefined}
              />
            ) : undefined
          }
          createItemLabel="Create %{item}"
        />
      </ReferenceArrayInput>

      <div className="flex gap-2 pt-4">
        <AdminButton type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : "Save Changes"}
        </AdminButton>
        <AdminButton type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </AdminButton>
      </div>
    </>
  );
}

interface OpportunityContactsTabProps {
  record: Opportunity;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  /** Whether this tab is currently active - controls data fetching */
  isActiveTab: boolean;
}

export function OpportunityContactsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
  isActiveTab,
}: OpportunityContactsTabProps) {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch junction table data for view mode - only when tab is active AND in view mode
  const { data: junctionRecords, isLoading } = useGetList<OpportunityContact>(
    "opportunity_contacts",
    {
      filter: { opportunity_id: record.id },
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
      sort: { field: "is_primary", order: "DESC" },
    },
    { enabled: isActiveTab && mode === "view" }
  );

  // Fetch contact details for view mode - only when tab is active
  const contactIds = junctionRecords?.map((jr) => jr.contact_id) || [];
  const { data: contacts } = useGetList<Contact>(
    "contacts",
    {
      filter: { id: contactIds },
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
    },
    { enabled: isActiveTab && mode === "view" && contactIds.length > 0 }
  );

  const handleSave = async (data: { contact_ids?: Identifier[] }) => {
    setIsSaving(true);
    try {
      // Use service to sync junction table atomically via RPC
      const service = new OpportunitiesService(dataProvider as ExtendedDataProvider);
      await service.updateWithContacts(record.id, data.contact_ids || []);

      // Invalidate caches for parent resources
      queryClient.invalidateQueries({
        queryKey: opportunityKeys.detail(record.id),
      });

      // Invalidate all contacts that were in the junction
      if (data.contact_ids && data.contact_ids.length > 0) {
        data.contact_ids.forEach((contactId) => {
          queryClient.invalidateQueries({
            queryKey: contactKeys.detail(contactId),
          });
        });
      }

      queryClient.invalidateQueries({ queryKey: opportunityContactKeys.all });

      notify(notificationMessages.updated("Contacts"), { type: "success" });
      if (onModeToggle) {
        onModeToggle();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update contacts";
      notify(errorMessage, { type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onModeToggle) {
      onModeToggle();
    }
  };

  if (mode === "edit") {
    return (
      <Form
        defaultValues={{ contact_ids: record.contact_ids || [] }}
        onSubmit={handleSave}
        className="space-y-4"
      >
        <ContactEditFormContent
          record={record}
          isSaving={isSaving}
          onCancel={handleCancel}
          onDirtyChange={onDirtyChange}
        />
      </Form>
    );
  }

  // View mode
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!junctionRecords || junctionRecords.length === 0) {
    return (
      <SidepaneEmptyState
        title={EMPTY_STATE_CONTENT.contacts.title}
        description={EMPTY_STATE_CONTENT.contacts.description}
        action={{
          label: EMPTY_STATE_CONTENT.contacts.actionLabel,
          onClick: () => onModeToggle?.(),
        }}
      />
    );
  }

  // Create a map of junction data by contact_id
  const junctionMap = new Map(junctionRecords.map((jr) => [jr.contact_id, jr]));

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-4">
        <SidepaneSection label="Contacts" variant="list">
          <div className="space-y-2">
            {contacts?.map((contact) => {
              const junctionData = junctionMap.get(contact.id);

              return (
                <Card
                  key={contact.id}
                  className="p-3 bg-muted/30 border-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-primary" />
                      </div>

                      {/* Contact info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/contacts?view=${contact.id}`}
                          className="text-base font-medium hover:underline"
                        >
                          {contact.first_name} {contact.last_name}
                        </Link>

                        {contact.title && (
                          <p className="text-sm text-muted-foreground">{contact.title}</p>
                        )}

                        {junctionData?.role && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {junctionData.role}
                            </Badge>
                          </div>
                        )}

                        {junctionData?.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {junctionData.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Primary badge */}
                    {junctionData?.is_primary && (
                      <Badge variant="default" className="ml-2">
                        <Star className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </SidepaneSection>
      </div>
    </ScrollArea>
  );
}
