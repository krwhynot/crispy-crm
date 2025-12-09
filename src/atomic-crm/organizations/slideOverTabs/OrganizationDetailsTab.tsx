import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AsideSection } from "@/components/ui";
import { ArrayInput, SimpleFormIterator } from "react-admin";
import type { OrganizationWithHierarchy } from "../../types";
import {
  ORGANIZATION_TYPE_CHOICES,
  PRIORITY_CHOICES,
  ORG_TYPE_COLOR_MAP,
  PRIORITY_VARIANT_MAP,
} from "../constants";
import { parseDateSafely } from "@/lib/date-utils";

interface OrganizationDetailsTabProps {
  record: OrganizationWithHierarchy;
  mode: "view" | "edit";
  onModeToggle?: () => void;
}

export function OrganizationDetailsTab({
  record,
  mode,
  onModeToggle,
}: OrganizationDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();

  const handleSave = async (data: Partial<OrganizationWithHierarchy>) => {
    try {
      await update("organizations", {
        id: record.id,
        data,
        previousData: record,
      });
      notify("Organization updated successfully", { type: "success" });
      onModeToggle?.();
    } catch (error) {
      notify("Error updating organization", { type: "error" });
      console.error("Save error:", error);
    }
  };

  if (mode === "edit") {
    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <div className="space-y-6">
            <div className="space-y-4">
              <TextInput source="name" label="Organization Name" />

              <SelectInput
                source="organization_type"
                label="Type"
                choices={ORGANIZATION_TYPE_CHOICES}
              />

              <SelectInput source="priority" label="Priority" choices={PRIORITY_CHOICES} />

              <TextInput source="email" label="Email" type="email" />

              <TextInput source="phone" label="Phone" />
              <TextInput source="website" label="Website" />
              <TextInput source="address" label="Street Address" />
              <TextInput source="city" label="City" />
              <TextInput source="state" label="State" />
              <TextInput source="postal_code" label="ZIP Code" />

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
      <div className="space-y-6">
        <AsideSection title="Organization Details">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="text-lg font-semibold">{record.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <OrganizationTypeBadge type={record.organization_type} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Priority:</span>
                <PriorityBadge priority={record.priority} />
              </div>

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

              {/* Phone & Website */}
              {(record.phone || record.website) && (
                <div className="space-y-2">
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
              )}

              {/* Address */}
              {(record.address || record.city || record.state || record.postal_code) && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Address:</span>
                  <div className="text-sm">
                    {record.address && <div>{record.address}</div>}
                    {(record.city || record.state || record.postal_code) && (
                      <div>
                        {[record.city, record.state, record.postal_code].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {record.tags && record.tags.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {record.tags.map((tagId) => (
                      <Badge key={tagId} variant="outline" className="text-xs">
                        Tag #{tagId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {record.context_links &&
                Array.isArray(record.context_links) &&
                record.context_links.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">Context Links:</span>
                    <div className="space-y-1">
                      {record.context_links.map((link: any, index: number) => (
                        <div key={index}>
                          <a
                            href={link.url || link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {link.name || link.url || link}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {record.created_at && (
                <div className="pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Created: {parseDateSafely(record.created_at)?.toLocaleDateString() ?? "N/A"}
                  </span>
                </div>
              )}

              {record.updated_at && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Updated: {parseDateSafely(record.updated_at)?.toLocaleDateString() ?? "N/A"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </AsideSection>
      </div>
    </RecordContextProvider>
  );
}

function OrganizationTypeBadge({ type }: { type: string }) {
  const colorClass = ORG_TYPE_COLOR_MAP[type as keyof typeof ORG_TYPE_COLOR_MAP] || "tag-gray";

  return (
    <Badge className={`text-xs px-3 py-2 min-h-[44px] flex items-center ${colorClass}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variant = PRIORITY_VARIANT_MAP[priority as keyof typeof PRIORITY_VARIANT_MAP] || "default";
  const label = PRIORITY_CHOICES.find((p) => p.id === priority)?.name || priority;

  return (
    <Badge variant={variant} className="text-xs px-3 py-2 min-h-[44px] flex items-center">
      {label}
    </Badge>
  );
}
