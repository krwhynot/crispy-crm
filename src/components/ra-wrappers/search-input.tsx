import { useTranslate } from "ra-core";
import { Search } from "lucide-react";
import { TextInput, type TextInputProps } from "@/components/ra-wrappers/text-input";

export const SearchInput = (
  inProps: SearchInputProps & {
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
  }
) => {
  const { label, onFocus, ...rest } = inProps;

  const translate = useTranslate();

  if (label) {
    throw new Error(
      "<SearchInput> isn't designed to be used with a label prop. Use <TextInput> if you need a label."
    );
  }

  const effectivePlaceholder = rest.placeholder ?? translate("ra.action.search");
  const effectiveAriaLabel =
    (typeof rest["aria-label"] === "string" && rest["aria-label"].trim()) ||
    (typeof effectivePlaceholder === "string" && effectivePlaceholder.trim()) ||
    translate("ra.action.search");

  return (
    <div className="relative w-full">
      <TextInput
        {...rest}
        label={false}
        helperText={false}
        placeholder={effectivePlaceholder}
        type="search"
        aria-label={effectiveAriaLabel}
        className="w-full [&_input]:pr-10 [&_input]:pl-3"
        onFocus={onFocus}
      />
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
};

export type SearchInputProps = TextInputProps;
