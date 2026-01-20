import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { useRecordContext } from "ra-core";
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  shouldRenderSuggestions,
} from "@/atomic-crm/utils/autocompleteDefaults";

interface Contact {
  id?: number;
  first_name?: string;
  last_name?: string;
}

/**
 * Manager input for contact forms
 * Self-referential FK - allows selecting another contact as manager
 * Excludes the current contact from the list to prevent self-reference
 */
export const ContactManagerInput = () => {
  const record = useRecordContext<Contact>();

  return (
    <ReferenceInput
      source="manager_id"
      reference="contacts"
      filter={record?.id ? { "id@neq": record.id } : {}}
    >
      <AutocompleteInput
        debounce={AUTOCOMPLETE_DEBOUNCE_MS}
        shouldRenderSuggestions={shouldRenderSuggestions}
        label="Reports To"
        emptyText="No manager"
        helperText="Direct manager / supervisor"
        optionText={(contact: Contact) =>
          contact
            ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unknown"
            : ""
        }
        filterToQuery={(searchText) => ({
          "first_name,last_name@ilike": `%${searchText}%`,
        })}
      />
    </ReferenceInput>
  );
};
