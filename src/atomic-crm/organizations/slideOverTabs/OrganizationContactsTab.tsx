import { useGetList, RecordContextProvider } from "ra-core";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidepaneEmptyState, EMPTY_STATE_CONTENT } from "@/components/layouts/sidepane";
import type { OrganizationWithHierarchy } from "../../types";
import type { Identifier } from "ra-core";
import { MAX_RELATED_ITEMS } from "../constants";
import type { EmailEntry } from "../types";

interface Contact {
  id: Identifier;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: EmailEntry[];
  avatar?: { src?: string };
}

/** Get display name with fallback to `name` field */
function getContactDisplayName(contact: Contact): string {
  const first = contact.first_name?.trim();
  const last = contact.last_name?.trim();
  if (first || last) {
    return [first, last].filter(Boolean).join(" ");
  }
  return contact.name?.trim() || "Unknown Contact";
}

/** Get initials with fallback to `name` field */
function getContactInitials(contact: Contact): string {
  const first = contact.first_name?.trim();
  const last = contact.last_name?.trim();
  if (first || last) {
    return `${first?.[0] || ""}${last?.[0] || ""}`;
  }
  // Fallback: use first letter of name or "?"
  const nameParts = contact.name?.trim().split(" ") || [];
  if (nameParts.length >= 2) {
    return `${nameParts[0]?.[0] || ""}${nameParts[1]?.[0] || ""}`;
  }
  return nameParts[0]?.[0] || "?";
}

interface OrganizationContactsTabProps {
  record: OrganizationWithHierarchy;
}

export function OrganizationContactsTab({ record }: OrganizationContactsTabProps) {
  const navigate = useNavigate();
  const {
    data: contacts = [],
    isLoading,
    error,
  } = useGetList<Contact>(
    "contacts",
    {
      filter: { organization_id: record.id },
      pagination: { page: 1, perPage: MAX_RELATED_ITEMS },
      sort: { field: "last_name", order: "ASC" },
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Convert error to string for display
  const errorMessage = error ? String(error) : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="px-6 py-4">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <SidepaneEmptyState
        title={EMPTY_STATE_CONTENT.contacts.title}
        description={EMPTY_STATE_CONTENT.contacts.description}
      />
    );
  }

  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4 space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {contact.avatar?.src ? (
                <img
                  src={contact.avatar.src}
                  alt={getContactDisplayName(contact)}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {getContactInitials(contact)}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(`/contacts?view=${contact.id}`)}
                  className="text-sm font-medium text-primary hover:underline block truncate text-left"
                >
                  {getContactDisplayName(contact)}
                </button>
                {contact.title && (
                  <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
                )}
                {contact.email && Array.isArray(contact.email) && contact.email.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.email[0]?.value || ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
