import { useState } from "react";
import { useGetIdentity } from "ra-core";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { QuickCreateContactPopover } from "./QuickCreateContactPopover";

interface AutocompleteContactInputProps {
  label?: string;
  organizationId?: number;
  helperText?: string | false;
  source?: string;
}

const contactOptionText = (record: { first_name?: string; last_name?: string } | null) =>
  record ? `${record.first_name || ""} ${record.last_name || ""}`.trim() : "";

export const AutocompleteContactInput = ({
  label,
  organizationId,
  helperText,
  source,
}: AutocompleteContactInputProps) => {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const { data: identity } = useGetIdentity();

  const handleCreateContact = (name?: string) => {
    if (!name) return;
    setPendingName(name);
    setShowQuickCreate(true);
    return undefined;
  };

  const handleCreated = (record: { id: number; first_name: string; last_name: string }) => {
    setShowQuickCreate(false);
    setPendingName("");
    return record;
  };

  const handleCancelCreate = () => {
    setShowQuickCreate(false);
    setPendingName("");
  };

  return (
    <>
      <AutocompleteInput
        source={source}
        optionText={contactOptionText}
        helperText={helperText}
        onCreate={handleCreateContact}
        createItemLabel="Create %{item}"
        label={label}
        filterToQuery={(searchText) => ({ q: searchText })}
      />
      {showQuickCreate && organizationId && (
        <QuickCreateContactPopover
          name={pendingName}
          organizationId={organizationId}
          salesId={identity?.id as number | undefined}
          onCreated={handleCreated}
          onCancel={handleCancelCreate}
        >
          <span />
        </QuickCreateContactPopover>
      )}
    </>
  );
};
