import { useMemo } from "react";
import { CreateBase, Form } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateFormFooter } from "@/atomic-crm/components";
import { TagInputs } from "./TagInputs";
import { createTagSchema } from "../validation/tags";

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
          <Card>
            <CardHeader>
              <CardTitle>Create Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <Form defaultValues={defaultValues} mode="onBlur">
                <TagInputs />
                <CreateFormFooter resourceName="tag" redirectPath="/tags" redirect="list" />
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </CreateBase>
  );
};

export default TagCreate;
