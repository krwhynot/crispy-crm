import { Mail, Phone, Linkedin, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { contactKeys } from "@/atomic-crm/queryKeys";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { TextField } from "@/components/ra-wrappers/text-field";
import { ArrayField } from "@/components/ra-wrappers/array-field";
import { EmailField } from "@/components/ra-wrappers/email-field";
import { SingleFieldList } from "@/components/ra-wrappers/single-field-list";
import { FormProgressProvider } from "@/components/ra-wrappers/form/FormProgressProvider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidepaneSection,
  SidepaneMetadata,
  DirtyStateTracker,
} from "@/components/layouts/sidepane";
import { SaleName } from "../sales/SaleName";
import { ContactInputs } from "./ContactInputs";
import { Avatar } from "./Avatar";
import { formatName } from "../utils/formatName";
import type { Contact } from "../types";

interface ContactDetailsTabProps {
  record: Contact;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Details tab for ContactSlideOver.
 *
 * **View Mode**: Displays all contact fields from ContactShow + ContactAside:
 * - Identity: Avatar, Name, Gender, Title
 * - Position: Organization (link), Department, Title
 * - Contact Info: Email array, Phone array, LinkedIn
 * - Account: Sales rep, First seen, Last seen
 * - Tags: Tag badges (read-only)
 * - Notes: Free text notes field
 *
 * **Edit Mode**: Renders existing ContactInputs component inline with save/cancel.
 */
export function ContactDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: ContactDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();

  // Handle save in edit mode
  const handleSave = async (data: Partial<Contact>) => {
    try {
      await update("contacts", {
        id: record.id,
        data,
        previousData: record,
      });

      // SS-001 FIX: Invalidate contact caches after successful update
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(record.id) });

      notify("Contact updated successfully", { type: "success" });
      onModeToggle?.(); // Return to view mode after successful save
    } catch (error: unknown) {
      notify("Error updating contact", { type: "error" });
      console.error("Save error:", error);
    }
  };

  if (mode === "edit") {
    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <DirtyStateTracker onDirtyChange={onDirtyChange} />
          <FormProgressProvider>
            <div className="space-y-6">
              <ContactInputs />
            </div>
          </FormProgressProvider>
        </Form>
      </RecordContextProvider>
    );
  }

  // View mode - display all contact fields
  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4">
          {/* Identity Section */}
          <SidepaneSection label="Identity">
            <div className="flex items-center gap-4">
              <Avatar />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {formatName(record.first_name, record.last_name)}
                </h3>
                {record.gender && <p className="text-sm text-muted-foreground">{record.gender}</p>}
                {record.title && <p className="text-sm text-muted-foreground">{record.title}</p>}
              </div>
            </div>
          </SidepaneSection>

          {/* Organization Section - uses variant="list" for relationship card */}
          {record.organization_id && (
            <SidepaneSection label="Organization" variant="list" showSeparator>
              <div className="flex items-center gap-2 p-2">
                <Building2 className="size-4 text-muted-foreground" />
                <ReferenceField source="organization_id" reference="organizations" link="show">
                  <TextField source="name" className="font-medium" />
                </ReferenceField>
              </div>
            </SidepaneSection>
          )}

          {/* Details Section - title, department */}
          {(record.department || record.title) && (
            <SidepaneSection label="Details" showSeparator>
              <div className="space-y-2">
                {record.title && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Title: </span>
                    <span className="font-medium">{record.title}</span>
                  </div>
                )}
                {record.department && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Department: </span>
                    <span className="font-medium">{record.department}</span>
                  </div>
                )}
              </div>
            </SidepaneSection>
          )}

          {/* Contact Section */}
          <SidepaneSection label="Contact" showSeparator>
            <div className="space-y-3">
              {/* Email */}
              {record.email && record.email.length > 0 && (
                <ArrayField source="email">
                  <SingleFieldList className="flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <EmailField source="value" />
                      <TextField source="type" className="text-xs text-muted-foreground" />
                    </div>
                  </SingleFieldList>
                </ArrayField>
              )}

              {/* Phone */}
              {record.phone && record.phone.length > 0 && (
                <ArrayField source="phone">
                  <SingleFieldList className="flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      <TextField source="value" />
                      <TextField source="type" className="text-xs text-muted-foreground" />
                    </div>
                  </SingleFieldList>
                </ArrayField>
              )}

              {/* LinkedIn */}
              {record.linkedin_url && (
                <div className="flex items-center gap-2">
                  <Linkedin className="size-4 text-muted-foreground" />
                  <a
                    href={record.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </SidepaneSection>

          {/* Account Section - assigned sales rep */}
          {record.sales_id && (
            <SidepaneSection label="Assigned To" showSeparator>
              <div className="text-sm">
                <ReferenceField source="sales_id" reference="sales">
                  <SaleName />
                </ReferenceField>
              </div>
            </SidepaneSection>
          )}

          {/* Tags Section */}
          {record.tags && record.tags.length > 0 && (
            <SidepaneSection label="Tags" showSeparator>
              <div className="flex flex-wrap gap-2">
                {record.tags.map((tagId) => (
                  <ReferenceField
                    key={tagId}
                    record={{ tag_id: tagId }}
                    source="tag_id"
                    reference="tags"
                    link={false}
                  >
                    <Badge variant="outline">
                      <TextField source="name" />
                    </Badge>
                  </ReferenceField>
                ))}
              </div>
            </SidepaneSection>
          )}

          {/* Notes Section - no Card wrapper */}
          {record.notes && (
            <SidepaneSection label="Notes" showSeparator>
              <p className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">{record.notes}</p>
            </SidepaneSection>
          )}

          {/* Metadata - created/updated timestamps */}
          <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
