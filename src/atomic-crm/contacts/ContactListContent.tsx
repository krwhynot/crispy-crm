import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatRelative } from "date-fns";
import { RecordContextProvider, useListContext } from "ra-core";
import { Link } from "react-router-dom";

import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Status } from "../misc/Status";
import type { Contact } from "../types";
import { Avatar } from "./Avatar";
import { TagsList } from "./TagsList";

export const ContactListContent = () => {
  const {
    data: contacts,
    error,
    isPending,
    onToggleItem,
    selectedIds,
  } = useListContext<Contact>();
  const isSmall = useIsMobile();

  if (isPending) {
    return <Skeleton className="w-full h-9" />;
  }

  if (error) {
    return null;
  }
  const now = Date.now();

  return (
    <div className="space-y-2">
      {contacts.map((contact) => (
        <RecordContextProvider key={contact.id} value={contact}>
          <div
            className="group relative flex items-center justify-between gap-3 rounded-lg border border-transparent bg-card px-3 py-2 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 active:scale-[0.98] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          >
            {/* Left cluster: Checkbox + Avatar + Contact Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Checkbox
                checked={selectedIds.includes(contact.id)}
                onCheckedChange={() => onToggleItem(contact.id)}
                aria-label={`Select ${contact.first_name} ${contact.last_name ?? ""}`}
                className="relative z-10 shrink-0"
              />
              <Avatar className="shrink-0" />
              <div className="flex-1 min-w-0">
                {/* Name becomes the semantic link with stretched overlay */}
                <Link
                  to={`/contacts/${contact.id}/show`}
                  className="font-medium text-sm text-primary hover:underline focus:outline-none"
                >
                  {`${contact.first_name} ${contact.last_name ?? ""}`}
                  {/* Stretched link overlay: makes entire card clickable */}
                  <span className="absolute inset-0" aria-hidden="true" />
                </Link>
                <div className="text-xs text-muted-foreground truncate">
                  {contact.title}
                  {contact.department && ` - ${contact.department}`}
                  {contact.title &&
                    contact.organizations?.find((org: any) => org.is_primary) &&
                    " at "}
                  {contact.organizations?.find((org: any) => org.is_primary) && (
                    <ReferenceField
                      record={{
                        organization_id: contact.organizations.find(
                          (org: any) => org.is_primary,
                        )?.organization_id,
                      }}
                      source="organization_id"
                      reference="organizations"
                      link={false}
                    >
                      <TextField source="name" />
                    </ReferenceField>
                  )}
                  {" "}
                  <TagsList />
                </div>
              </div>
            </div>

            {/* Right meta: Last activity */}
            {contact.last_seen && (
              <div className="text-xs text-muted-foreground shrink-0 relative z-10">
                <div title={contact.last_seen}>
                  {!isSmall && "last activity "}
                  {formatRelative(contact.last_seen, now)}{" "}
                  <Status status={contact.status} />
                </div>
              </div>
            )}
          </div>
        </RecordContextProvider>
      ))}

      {contacts.length === 0 && (
        <div className="p-8 text-center bg-muted/30 border border-border rounded-xl shadow-sm">
          <p className="text-sm text-muted-foreground">No contacts found</p>
        </div>
      )}
    </div>
  );
};
