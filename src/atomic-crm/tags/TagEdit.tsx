import { useMemo } from "react";
import { EditBase, Form, useEditContext } from "ra-core";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { FormToolbar } from "../layout/FormToolbar";
import { TagInputs } from "./TagInputs";
import { tagSchema } from "../validation/tags";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import type { Tag } from "../types";

/**
 * TagEdit - Edit form for existing tags
 * Uses TagInputs for form fields, mode="onBlur" per Constitution
 */
export const TagEdit = () => {
  return (
    <EditBase redirect="list" mutationMode="pessimistic">
      <TagEditContent />
    </EditBase>
  );
};

const TagEditContent = () => {
  const { isPending, record } = useEditContext<Tag>();

  // P2: Schema-derived defaults with existing record data
  // Use passthrough() to allow extra DB fields (description, usage_count, created_at)
  const defaultValues = useMemo(
    () =>
      tagSchema
        .partial()
        .passthrough()
        .parse(record ?? {}),
    [record]
  );

  if (isPending || !record) {
    return null;
  }

  return (
    <div className="bg-muted px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <SectionCard title="Edit Tag">
          <Form
            defaultValues={defaultValues}
            mode="onBlur"
            resolver={createFormResolver(tagSchema)}
          >
            <TagInputs />
            <FormToolbar />
          </Form>
        </SectionCard>
      </div>
    </div>
  );
};

export default TagEdit;
