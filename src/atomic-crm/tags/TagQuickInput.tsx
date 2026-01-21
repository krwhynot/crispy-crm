import { useState } from "react";
import { ReferenceInput, useCreate, useRefresh } from "react-admin";
import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

interface TagQuickInputProps {
  source: string;
  label?: string;
}

/**
 * Pattern E: Simple Quick-Create using emptyAction
 * Creates tags with just a name (uses default color 'warm')
 */
export function TagQuickInput({ source, label }: TagQuickInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [create, { isLoading: isCreating }] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleQuickCreate = async (name: string) => {
    if (!name.trim()) return;

    await create(
      "tags",
      { data: { name: name.trim(), color: "warm" } },
      {
        onSuccess: () => {
          notify("Tag created", { type: "success" });
          refresh();
        },
        onError: (error) => {
          notify(`Error: ${error.message}`, { type: "error" });
        },
      }
    );
  };

  return (
    <ReferenceInput reference="tags" source={source}>
      <GenericSelectInput
        label={label}
        optionLabel="name"
        onSearchChange={setSearchTerm}
        emptyAction={{
          label: `Create "${searchTerm}"`,
          onClick: () => handleQuickCreate(searchTerm),
        }}
        isLoading={isCreating}
        searchable
      />
    </ReferenceInput>
  );
}
