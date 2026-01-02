import { useRef } from "react";
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { useFormContext } from "react-hook-form";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrayInput, SimpleFormIterator } from "react-admin";
import {
  SidepaneSection,
  SidepaneMetadata,
  DirtyStateTracker,
} from "@/components/layouts/sidepane";
import { SegmentComboboxInput } from "@/components/admin/SegmentComboboxInput";
import type { OrganizationWithHierarchy } from "../../types";
import type { ContextLink } from "../types";
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES, STATUS_CHOICES } from "../constants";
import { saleOptionRenderer } from "../../utils/saleOptionRenderer";
import { OrganizationTypeBadge, PriorityBadge } from "../OrganizationBadges";

/**
 * Helper component that must be rendered INSIDE a Form to access form context.
 * Uses a ref to expose getValues() to the parent component's handleSave.
 *
 * Problem: React Admin's Form onSubmit may only pass dirty fields, causing
 * sales_id to be missing when its initial value is null (null → null = no change).
 *
 * Solution: Store getValues() in a ref so handleSave can get ALL registered
 * field values regardless of dirty state.
 */
function FormValuesProvider({
  getValuesRef,
  onDirtyChange,
}: {
  getValuesRef: React.MutableRefObject<(() => Record<string, unknown>) | null>;
  onDirtyChange?: (isDirty: boolean) => void;
}) {
  const { getValues } = useFormContext();

  // Store getValues in the ref so parent can access it
  getValuesRef.current = getValues;

  return <DirtyStateTracker onDirtyChange={onDirtyChange} />;
}

interface OrganizationDetailsTabProps {
  record: OrganizationWithHierarchy;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function OrganizationDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: OrganizationDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  // Ref to access form's getValues() from outside the Form context
  const getValuesRef = useRef<(() => Record<string, unknown>) | null>(null);

  const handleSave = async (formData: Partial<OrganizationWithHierarchy>) => {
    try {
      // Get ALL current form values using the ref (not just dirty fields)
      // This ensures sales_id is included even when initial value was null
      const allFormValues = getValuesRef.current?.() ?? formData;

      // Use all form values to handle null → value transitions
      // React Admin's dirty detection misses these changes
      const completeData = {
        ...allFormValues,
      };

      await update("organizations", {
        id: record.id,
        data: completeData,
        previousData: record,
      });
      notify("Organization updated successfully", { type: "success" });
      onModeToggle?.();
    } catch (_error) {
      notify("Error updating organization", { type: "error" });
    }
  };

  if (mode === "edit") {
    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <FormValuesProvider getValuesRef={getValuesRef} onDirtyChange={onDirtyChange} />
          <div className="space-y-6">
            <div className="space-y-4">
              <TextInput source="name" label="Organization Name" />

              <SelectInput
                source="organization_type"
                label="Type"
                choices={ORGANIZATION_TYPE_CHOICES}
              />

              <SelectInput source="priority" label="Priority" choices={PRIORITY_CHOICES} />

              <SelectInput source="status" label="Status" choices={STATUS_CHOICES} />

              <SegmentComboboxInput source="segment_id" label="Segment" />

              <ReferenceInput
                reference="sales"
                source="sales_id"
                sort={{ field: "last_name", order: "ASC" }}
                filter={{ "disabled@neq": true, "user_id@not.is": null }}
              >
                <SelectInput label="Account Manager" optionText={saleOptionRenderer} />
              </ReferenceInput>

              <ReferenceInput
                source="parent_organization_id"
                reference="organizations"
                filter={record?.id ? { "id@neq": record.id } : {}}
              >
                <AutocompleteInput
                  label="Parent Organization"
                  emptyText="No parent organization"
                  optionText="name"
                  filterToQuery={(searchText) => ({ "name@ilike": `%${searchText}%` })}
                />
              </ReferenceInput>

              <TextInput source="email" label="Email" type="email" />

              <TextInput source="phone" label="Phone" maxLength={30} />
              <TextInput source="website" label="Website" />
              <TextInput source="linkedin_url" label="LinkedIn URL" type="url" />
              <TextInput source="address" label="Street Address" />
              <TextInput source="city" label="City" />
              <TextInput source="state" label="State" />
              <TextInput source="postal_code" label="ZIP Code" />

              <TextInput source="description" label="Description" multiline rows={3} />

              <ReferenceArrayInput source="tags" reference="tags" label="Tags">
                <AutocompleteArrayInput optionText="name" />
              </ReferenceArrayInput>

              <ArrayInput source="context_links" label="Context Links">
                <SimpleFormIterator inline>
                  <TextInput source="name" label="Name" />
                  <TextInput source="url" label="URL" />
                </SimpleFormIterator>
              </ArrayInput>
            </div>
          </div>
        </Form>
      </RecordContextProvider>
    );
  }

  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4">
          {/* Organization Identity */}
          <SidepaneSection label="Organization">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{record.name}</h3>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <OrganizationTypeBadge type={record.organization_type} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Priority:</span>
                <PriorityBadge priority={record.priority} />
              </div>
            </div>
          </SidepaneSection>

          {/* Contact Information */}
          {(record.email || record.phone || record.website) && (
            <SidepaneSection label="Contact" showSeparator>
              <div className="space-y-2">
                {record.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <a
                      href={`mailto:${record.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {record.email}
                    </a>
                  </div>
                )}
                {record.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <a
                      href={`tel:${record.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {record.phone}
                    </a>
                  </div>
                )}
                {record.website && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Website:</span>
                    <a
                      href={record.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {record.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </SidepaneSection>
          )}

          {/* Address */}
          {(record.address || record.city || record.state || record.postal_code) && (
            <SidepaneSection label="Address" showSeparator>
              <div className="text-sm">
                {record.address && <div>{record.address}</div>}
                {(record.city || record.state || record.postal_code) && (
                  <div>
                    {[record.city, record.state, record.postal_code].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            </SidepaneSection>
          )}

          {/* Tags */}
          {record.tags && record.tags.length > 0 && (
            <SidepaneSection label="Tags" showSeparator>
              <div className="flex flex-wrap gap-2">
                {record.tags.map((tagId) => (
                  <Badge key={tagId} variant="outline" className="text-xs">
                    Tag #{tagId}
                  </Badge>
                ))}
              </div>
            </SidepaneSection>
          )}

          {/* Context Links */}
          {record.context_links &&
            Array.isArray(record.context_links) &&
            record.context_links.length > 0 && (
              <SidepaneSection label="Context Links" showSeparator>
                <div className="space-y-1">
                  {record.context_links.map((link: ContextLink | string, index: number) => (
                    <div key={index}>
                      <a
                        href={typeof link === "string" ? link : link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {typeof link === "string" ? link : link.label || link.url}
                      </a>
                    </div>
                  ))}
                </div>
              </SidepaneSection>
            )}

          {/* Metadata - created/updated timestamps */}
          <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
