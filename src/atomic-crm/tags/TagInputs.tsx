import { useFormContext } from "react-hook-form";
import { TextInput } from "react-admin";
import { Label } from "@/components/ui/label";
import { colors } from "./colors";
import { RoundButton } from "./RoundButton";
import type { TagColorName } from "@/lib/color-types";

/**
 * Shared tag form inputs for Create and Edit forms
 * Uses existing RoundButton color picker from TagDialog
 */
export const TagInputs = () => {
  const { setValue, watch } = useFormContext();
  const selectedColor = watch("color") as TagColorName;

  return (
    <div className="flex flex-col gap-6">
      {/* Name input */}
      <TextInput
        source="name"
        label="Tag Name"
        fullWidth
        helperText="Enter a unique name for this tag (max 50 characters)"
      />

      {/* Color picker - reuses existing RoundButton component */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tag color">
          {colors.map((color) => (
            <div key={color} className="relative group">
              <RoundButton
                color={color}
                selected={color === selectedColor}
                handleClick={() => {
                  setValue("color", color, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap capitalize">
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
