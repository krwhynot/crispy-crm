import { CreateButton } from "@/components/ra-wrappers/create-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ContactImportButton } from "./ContactImportButton";

export const ContactEmpty = () => {
  return (
    <EmptyState
      variant="fullscreen"
      image="./img/empty.svg"
      title="No contacts found"
      description="It seems your contact list is empty."
    >
      <div className="mt-4 flex flex-row gap-2">
        <CreateButton label="New Contact" />
        <ContactImportButton />
      </div>
    </EmptyState>
  );
};
