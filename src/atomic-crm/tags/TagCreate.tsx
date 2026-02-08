import { useMemo } from "react";
import { CreateBase, Form } from "ra-core";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { CreateFormFooter } from "@/atomic-crm/components";
import { TagInputs } from "./TagInputs";
import { createTagSchema } from "../validation/tags";
import { createFormResolver } from "@/lib/zodErrorFormatting";

/**
 * TagCreate - Create form for new tags
 * Uses TagInputs for form fields, mode="onBlur" per Constitution
 */
export const TagCreate = () => {
  // P2: Schema-derived defaults ensure type safety
  const defaultValues = useMemo(() => createTagSchema.partial().parse({}), []);

  return (
    <CreateBase redirect="list">
      <div className="bg-muted px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <SectionCard title="Create Tag">
            <Form
              defaultValues={defaultValues}
              mode="onBlur"
              resolver={createFormResolver(createTagSchema)}
            >
              <TagInputs />
              <CreateFormFooter resourceName="tag" redirectPath="/tags" />
            </Form>
          </SectionCard>
        </div>
      </div>
    </CreateBase>
  );
};

export default TagCreate;
