import { useWatch } from "react-hook-form";
import { TextInput, type TextInputProps } from "../text-input";
import { CharacterCounter } from "@/components/ui/character-counter";

interface TextInputWithCounterProps extends TextInputProps {
  maxLength: number;
}

export function TextInputWithCounter({
  source,
  maxLength,
  helperText,
  ...props
}: TextInputWithCounterProps) {
  const value = useWatch({ name: source }) ?? "";
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <div className="space-y-1">
      <TextInput source={source} helperText={false} {...props} />
      <div className="flex justify-between items-center">
        {helperText && typeof helperText === "string" && (
          <span className="text-xs text-muted-foreground">{helperText}</span>
        )}
        <CharacterCounter current={currentLength} max={maxLength} className="ml-auto" />
      </div>
    </div>
  );
}
