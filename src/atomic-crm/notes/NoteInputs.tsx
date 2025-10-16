import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils.ts";
import { TextInput } from "@/components/admin/text-input";
import { FileInput } from "@/components/admin/file-input";
import { FileField } from "@/components/admin/file-field";
import { Button } from "@/components/ui/button";
import { getCurrentDate } from "../validation/notes";

export const NoteInputs = () => {
  const [displayMore, setDisplayMore] = useState(false);
  const { setValue } = useFormContext();

  return (
    <div className="space-y-2">
      <TextInput
        source="text"
        label={false}
        multiline
        helperText={false}
        placeholder="Add a note"
      />

      {!displayMore && (
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setDisplayMore(!displayMore);
              setValue("date", getCurrentDate());
            }}
            className="text-sm text-muted-foreground underline hover:no-underline p-0 h-auto cursor-pointer"
          >
            Show options
          </Button>
          <span className="text-sm text-muted-foreground">
            (change date/time or attach files)
          </span>
        </div>
      )}

      <div
        className={cn(
          "space-y-3 mt-3 overflow-hidden transition-transform ease-in-out duration-300 origin-top",
          !displayMore ? "scale-y-0 max-h-0 h-0" : "scale-y-100",
        )}
      >
        <TextInput
          source="date"
          label="Date & Time"
          helperText={false}
          type="datetime-local"
          className="text-primary"
          // defaultValue removed per Constitution #5 - defaults come from Zod schema via form-level defaultValues
        />
        <FileInput source="attachments" multiple>
          <FileField source="src" title="title" target="_blank" />
        </FileInput>
      </div>
    </div>
  );
};
