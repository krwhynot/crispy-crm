import { useRef } from "react";
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
import { organizationSchema } from "@/atomic-crm/validation/organizations";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";
import { organizationKeys, segmentKeys } from "@/atomic-crm/queryKeys";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { BooleanInput } from "@/components/ra-wrappers/boolean-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { ReferenceManyField } from "@/components/ra-wrappers/reference-many-field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrayInput, SimpleFormIterator } from "react-admin";
import {
  SidepaneSection,
  SidepaneMetadata,
  DirtyStateTracker,
} from "@/components/layouts/sidepane";
import { SegmentComboboxInput } from "@/components/ra-wrappers/SegmentComboboxInput";
import { NotesIterator } from "../../notes";
import type { OrganizationWithHierarchy } from "../../types";
import type { ContextLink } from "../types";
import {
  ORGANIZATION_TYPE_CHOICES,
  PRIORITY_CHOICES,
  STATUS_CHOICES,
  ORG_SCOPE_CHOICES,
} from "../constants";
import { saleOptionRenderer } from "../../utils/saleOptionRenderer";
import { OrganizationTypeBadge, PriorityBadge } from "../OrganizationBadges";
import { ParentOrganizationInput } from "../ParentOrganizationInput";
import { BranchLocationsSection } from "../BranchLocationsSection";
import { OrganizationTagsList } from "../OrganizationTagsList";
import { OrganizationTagsListEdit } from "../OrganizationTagsListEdit";

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

interface OrganizationRightPanelProps {
  record: OrganizationWithHierarchy;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function OrganizationRightPanel({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: OrganizationRightPanelProps) {
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const getValuesRef = useRef<(() => Record<string, unknown>) | null>(null);

  const handleSave = async (formData: Partial<OrganizationWithHierarchy>) => {
    try {
      const allFormValues = getValuesRef.current?.() ?? formData;

      const completeData = {
        ...allFormValues,
      };

      const result = organizationSchema.partial().passthrough().safeParse(completeData);

      if (!result.success) {
        const firstError = result.error.issues[0];
        notify(`${firstError.path.join(".")}: ${firstError.message}`, { type: "error" });
        logger.error("Organization validation failed", result.error, {
          feature: "OrganizationRightPanel",
          organizationId: record.id,
        });
        return;
      }

      await update("organizations", {
        id: record.id,
        data: result.data,
        previousData: record,
      });

      // Detect if segment changed and invalidate segment cache
      if (result.data.segment_id !== record.segment_id) {
        queryClient.invalidateQueries({ queryKey: segmentKeys.all });
      }

      // Refetch queries and WAIT for completion before showing success
      await Promise.all([
        queryClient.refetchQueries({ queryKey: organizationKeys.detail(record.id) }),
        queryClient.invalidateQueries({ queryKey: organizationKeys.lists() }),
      ]);

      notify(notificationMessages.updated("Organization"), { type: "success" });
      onModeToggle?.();
    } catch (error: unknown) {
      notify("Error updating organization", { type: "error" });
      logger.error("Error updating organization", error, {
        feature: "OrganizationRightPanel",
        organizationId: record.id,
        operation: "handleSave",
      });
      throw error;
    }
  };

  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-4 py-4">
          {mode === "edit" ? (
            <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
              <FormValuesProvider getValuesRef={getValuesRef} onDirtyChange={onDirtyChange} />
              <div className="space-y-6">
                <div className="space-y-4">
                  <TextInput source="name" label="Organization Name" disabled={isLoading} />

                  <SelectInput
                    source="organization_type"
                    label="Type"
                    choices={ORGANIZATION_TYPE_CHOICES}
                    disabled={isLoading}
                  />

                  <SelectInput
                    source="priority"
                    label="Priority"
                    choices={PRIORITY_CHOICES}
                    disabled={isLoading}
                  />

                  <SelectInput
                    source="status"
                    label="Status"
                    choices={STATUS_CHOICES}
                    disabled={isLoading}
                  />

                  <SegmentComboboxInput source="segment_id" label="Segment" disabled={isLoading} />

                  <ReferenceInput
                    reference="sales"
                    source="sales_id"
                    sort={{ field: "last_name", order: "ASC" }}
                    filter={{ "disabled@neq": true, "user_id@not.is": null }}
                  >
                    <SelectInput
                      label="Account Manager"
                      optionText={saleOptionRenderer}
                      disabled={isLoading}
                    />
                  </ReferenceInput>

                  <ParentOrganizationInput disabled={isLoading} />

                  <SelectInput
                    source="org_scope"
                    label="Organization Level"
                    choices={ORG_SCOPE_CHOICES}
                    helperText="National = brand/HQ, Regional = operating company"
                    emptyText="Select level"
                    parse={(v) => v || null}
                    disabled={isLoading}
                  />

                  <BooleanInput
                    source="is_operating_entity"
                    label="This location processes orders"
                    helperText={false}
                    disabled={isLoading}
                  />

                  <TextInput source="email" label="Email" type="email" disabled={isLoading} />

                  <TextInput source="phone" label="Phone" maxLength={30} disabled={isLoading} />
                  <TextInput source="website" label="Website" disabled={isLoading} />
                  <TextInput
                    source="linkedin_url"
                    label="LinkedIn URL"
                    type="url"
                    disabled={isLoading}
                  />
                  <TextInput source="address" label="Street Address" disabled={isLoading} />
                  <TextInput source="city" label="City" disabled={isLoading} />
                  <TextInput source="state" label="State" disabled={isLoading} />
                  <TextInput source="postal_code" label="ZIP Code" disabled={isLoading} />

                  <TextInput
                    source="description"
                    label="Description"
                    multiline
                    rows={3}
                    disabled={isLoading}
                  />

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Tags</span>
                    <OrganizationTagsListEdit />
                  </div>

                  <ArrayInput source="context_links" label="Context Links" disabled={isLoading}>
                    <SimpleFormIterator inline>
                      <TextInput source="name" label="Name" />
                      <TextInput source="url" label="URL" />
                    </SimpleFormIterator>
                  </ArrayInput>
                </div>
              </div>
            </Form>
          ) : (
            <>
              {/* Organization Identity */}
              <SidepaneSection label="Organization">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    {record.name || <span className="text-muted-foreground">—</span>}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    {record.organization_type ? (
                      <OrganizationTypeBadge type={record.organization_type} />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Priority:</span>
                    {record.priority ? (
                      <PriorityBadge priority={record.priority} />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Organization Level:</span>
                    {record.org_scope ? (
                      <span className="text-sm capitalize">{record.org_scope}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </SidepaneSection>

              {/* Contact Information */}
              <SidepaneSection label="Contact" showSeparator>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    {record.email ? (
                      <a
                        href={`mailto:${record.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {record.email}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    {record.phone ? (
                      <a
                        href={`tel:${record.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {record.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Website:</span>
                    {record.website ? (
                      <a
                        href={record.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {record.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </SidepaneSection>

              {/* Address */}
              <SidepaneSection label="Address" showSeparator>
                <div className="text-sm">
                  <div>{record.address || <span className="text-muted-foreground">—</span>}</div>
                  <div>
                    {record.city || record.state || record.postal_code ? (
                      [record.city, record.state, record.postal_code].filter(Boolean).join(", ")
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </SidepaneSection>

              {/* Tags */}
              <SidepaneSection label="Tags" showSeparator>
                <OrganizationTagsList />
              </SidepaneSection>

              {/* Context Links */}
              <SidepaneSection label="Context Links" showSeparator>
                {record.context_links &&
                Array.isArray(record.context_links) &&
                record.context_links.length > 0 ? (
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
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </SidepaneSection>

              {/* Branch Locations - self-hides when no branches */}
              <BranchLocationsSection />

              {/* Metadata - created/updated timestamps */}
              <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
            </>
          )}

          <Separator className="my-4" />
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
            <ReferenceManyField
              target="organization_id"
              reference="organization_notes"
              sort={{ field: "created_at", order: "DESC" }}
              empty={false}
            >
              <NotesIterator reference="organizations" showEmptyState />
            </ReferenceManyField>
          </div>
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
