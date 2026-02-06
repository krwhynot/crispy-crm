import { useRef } from "react";
import { Mail, Phone, Linkedin, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { useFormContext } from "react-hook-form";
import { contactKeys } from "@/atomic-crm/queryKeys";
import { logger } from "@/lib/logger";
import { contactBaseSchema } from "../validation/contacts";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { TextField } from "@/components/ra-wrappers/text-field";
import { ArrayField } from "@/components/ra-wrappers/array-field";
import { EmailField } from "@/components/ra-wrappers/email-field";
import { SingleFieldList } from "@/components/ra-wrappers/single-field-list";
import { ReferenceManyField } from "@/components/ra-wrappers/reference-many-field";
import { FormProgressProvider } from "@/components/ra-wrappers/form/FormProgressProvider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  SidepaneSection,
  SidepaneMetadata,
  DirtyStateTracker,
} from "@/components/layouts/sidepane";
import { SaleName } from "../sales/SaleName";
import { ContactInputs } from "./ContactInputs";
import { Avatar } from "./Avatar";
import { formatName } from "../utils/formatName";
import { TasksIterator } from "../tasks/TasksIterator";
import { AddTask } from "../tasks/AddTask";
import { NotesIterator } from "../notes";
import type { Contact } from "../types";

/**
 * Helper component that must be rendered INSIDE a Form to access form context.
 * Uses a ref to expose getValues() to the parent component's handleSave.
 *
 * Problem: React Admin's Form onSubmit may only pass dirty fields, causing
 * sales_id to be missing when its initial value is null (null -> null = no change).
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

interface ContactRightPanelProps {
  record: Contact;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Right panel for ContactSlideOver two-column layout.
 *
 * **View Mode**: Displays all contact details in SidepaneSection format:
 * - Identity: Avatar, Name, Gender, Title
 * - Organization: Link to org
 * - Details: Title, Department
 * - Contact: Email, Phone, LinkedIn
 * - Assigned To: Sales rep
 * - Tags: Tag badges (read-only)
 * - Notes: Free-text notes field + contact_notes (ReferenceManyField)
 * - Tasks: Task list with add button
 * - Metadata: created_at, updated_at
 *
 * **Edit Mode**: Full form at top + read-only sections below.
 */
export function ContactRightPanel({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: ContactRightPanelProps) {
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const getValuesRef = useRef<(() => Record<string, unknown>) | null>(null);

  const handleSave = async (formData: Partial<Contact>) => {
    try {
      const allFormValues = getValuesRef.current?.() ?? formData;

      const completeData = {
        ...allFormValues,
      };

      const result = contactBaseSchema.partial().passthrough().safeParse(completeData);

      if (!result.success) {
        const firstError = result.error.issues[0];
        notify(`${firstError.path.join(".")}: ${firstError.message}`, { type: "error" });
        logger.error("Contact validation failed", result.error, {
          feature: "ContactRightPanel",
          contactId: record.id,
        });
        return;
      }

      await update("contacts", {
        id: record.id,
        data: result.data,
        previousData: record,
      });

      // Invalidate contact caches after successful update
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(record.id) });

      notify(notificationMessages.updated("Contact"), { type: "success" });
      onModeToggle?.();
    } catch (error: unknown) {
      notify("Error updating contact", { type: "error" });
      logger.error("Error updating contact", error, {
        feature: "ContactRightPanel",
        contactId: record.id,
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
            <Form id="slide-over-edit-form" onSubmit={handleSave} record={record} mode="onBlur">
              <FormValuesProvider getValuesRef={getValuesRef} onDirtyChange={onDirtyChange} />
              <FormProgressProvider>
                <div className="space-y-6">
                  <ContactInputs disabled={isLoading} />
                </div>
              </FormProgressProvider>
            </Form>
          ) : (
            <ContactViewSections record={record} />
          )}

          <Separator className="my-4" />

          {/* Notes (contact_notes) - always visible in both modes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
            <ReferenceManyField
              target="contact_id"
              reference="contact_notes"
              sort={{ field: "created_at", order: "DESC" }}
              empty={false}
            >
              <NotesIterator reference="contacts" showEmptyState />
            </ReferenceManyField>
          </div>

          <Separator className="my-4" />

          {/* Tasks - always visible in both modes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
            <ReferenceManyField
              target="contact_id"
              reference="tasks"
              sort={{ field: "due_date", order: "ASC" }}
            >
              <TasksIterator />
            </ReferenceManyField>
            <AddTask />
          </div>
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}

/**
 * View mode sections - displays all contact details in SidepaneSection format.
 * Extracted to reduce nesting in the main component.
 */
function ContactViewSections({ record }: { record: Contact }) {
  return (
    <>
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

      {/* Organization Section */}
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

      {/* Notes Section - inline notes field */}
      {record.notes && (
        <SidepaneSection label="Notes" showSeparator>
          <p className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">{record.notes}</p>
        </SidepaneSection>
      )}

      {/* Metadata - created/updated timestamps */}
      <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
    </>
  );
}
