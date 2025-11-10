import { useGetMany } from "react-admin";
import type { Contact } from "../types";

export function useOpportunityContacts(contactIds: number[]) {
  const { data: contacts, isLoading } = useGetMany<Contact>(
    "contacts",
    { ids: contactIds },
    { enabled: contactIds.length > 0 }
  );

  const primaryContact = contacts && contacts.length > 0 ? contacts[0] : null;

  return {
    primaryContact,
    isLoading,
  };
}
