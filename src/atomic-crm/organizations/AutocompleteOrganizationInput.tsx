import { useState } from "react";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { QuickCreatePopover } from "./QuickCreatePopover";

export const AutocompleteOrganizationInput = ({
  label,
  organizationType,
  helperText,
  source,
}: {
  label?: string;
  organizationType?: string;
  helperText?: string | false;
  source?: string;
}) => {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [pendingName, setPendingName] = useState("");

  const handleCreateOrganization = (name?: string) => {
    if (!name) return;
    setPendingName(name);
    setShowQuickCreate(true);
    return undefined; // Don't return a record yet - popover will handle it
  };

  const handleCreated = (record: { id: number; name: string }) => {
    setShowQuickCreate(false);
    setPendingName("");
    // Return the record to the autocomplete
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
        optionText="name"
        helperText={helperText}
        onCreate={handleCreateOrganization}
        createItemLabel="Create %{item}"
        label={label}
        filterToQuery={(searchText) => ({ q: searchText })}
      />
      {showQuickCreate && (
        <QuickCreatePopover
          name={pendingName}
          organizationType={(organizationType as "customer" | "prospect" | "principal" | "distributor") || "customer"}
          onCreated={handleCreated}
          onCancel={handleCancelCreate}
        >
          <span /> {/* Hidden trigger - popover is controlled via open state */}
        </QuickCreatePopover>
      )}
    </>
  );
};
