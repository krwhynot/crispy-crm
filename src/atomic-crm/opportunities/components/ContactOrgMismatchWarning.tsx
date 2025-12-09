import { AlertTriangle } from "lucide-react";
import { useWatch, useFormContext } from "react-hook-form";
import { useGetOne } from "react-admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useContactOrgMismatch } from "../hooks/useContactOrgMismatch";
import type { Organization } from "../../types";
import type { Identifier } from "ra-core";

/**
 * Warning banner displayed when selected contacts belong to a different
 * organization than the opportunity's customer organization.
 *
 * This is a "soft warning" - it alerts the user but doesn't block the action.
 * Users can acknowledge and override via the confirmation dialog.
 *
 * @example
 * // In OpportunityRelationshipsTab, after the contacts selector:
 * <ContactOrgMismatchWarning onClearMismatched={() => {
 *   // Remove mismatched contacts from form
 *   setValue("contact_ids", []);
 * }} />
 */
interface ContactOrgMismatchWarningProps {
  /** Callback to clear mismatched contacts from the form */
  onClearMismatched?: () => void;
}

export function ContactOrgMismatchWarning({ onClearMismatched }: ContactOrgMismatchWarningProps) {
  const { setValue, getValues } = useFormContext();

  // Watch form values for reactive updates
  const contactIds = useWatch({ name: "contact_ids" }) as Identifier[] | undefined;
  const customerOrgId = useWatch({ name: "customer_organization_id" }) as Identifier | undefined;

  // Detect mismatches
  const { mismatchedContacts, hasMismatch, isLoading } = useContactOrgMismatch(
    contactIds || [],
    customerOrgId
  );

  // Fetch customer org name for clearer messaging
  const { data: customerOrg } = useGetOne<Organization>(
    "organizations",
    { id: customerOrgId! },
    { enabled: !!customerOrgId }
  );

  // Don't render if no mismatch or still loading
  if (!hasMismatch || isLoading) {
    return null;
  }

  // Build contact names list
  const mismatchedNames = mismatchedContacts
    .map((m) => `${m.contact.first_name} ${m.contact.last_name}`.trim())
    .filter(Boolean);

  const handleClearMismatched = () => {
    const currentContacts = (getValues("contact_ids") || []) as Identifier[];
    const mismatchedIds = new Set(mismatchedContacts.map((m) => String(m.contact.id)));
    const validContacts = currentContacts.filter((id) => !mismatchedIds.has(String(id)));
    setValue("contact_ids", validContacts);
    onClearMismatched?.();
  };

  return (
    <Alert className="border-warning/50 bg-warning-subtle mt-3">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning-strong">Contact Organization Mismatch</AlertTitle>
      <AlertDescription className="text-warning">
        <p className="mb-2">
          {mismatchedContacts.length === 1 ? (
            <>
              <strong>{mismatchedNames[0]}</strong> belongs to a different organization than the
              selected customer
              {customerOrg?.name && (
                <>
                  {" "}
                  (<strong>{customerOrg.name}</strong>)
                </>
              )}
              .
            </>
          ) : (
            <>
              <strong>{mismatchedContacts.length} contacts</strong> (
              {mismatchedNames.slice(0, 3).join(", ")}
              {mismatchedNames.length > 3 && `, +${mismatchedNames.length - 3} more`}) belong to
              different organizations than the selected customer
              {customerOrg?.name && (
                <>
                  {" "}
                  (<strong>{customerOrg.name}</strong>)
                </>
              )}
              .
            </>
          )}
        </p>

        <div className="flex gap-2 mt-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-warning text-warning hover:bg-warning-subtle"
              >
                Keep Anyway
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Keep Mismatched Contacts?</AlertDialogTitle>
                <AlertDialogDescription>
                  <p className="mb-2">
                    The following contacts belong to organizations different from the
                    opportunity&apos;s customer:
                  </p>
                  <ul className="list-disc list-inside mb-2 text-foreground">
                    {mismatchedNames.map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                  <p>
                    This may indicate a data entry error, or you may have a legitimate reason to
                    include cross-organization contacts.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction className="bg-warning hover:bg-warning-strong">
                  Yes, Keep These Contacts
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="destructive" size="sm" onClick={handleClearMismatched}>
            Remove Mismatched
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
