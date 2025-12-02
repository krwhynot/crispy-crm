import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateBase, Form, useInput, useGetIdentity } from "ra-core";
import { FormToolbar } from "@/atomic-crm/layout/FormToolbar";
import { activitiesSchema } from "../validation/activities";
import ActivitySinglePage from "./ActivitySinglePage";

const HiddenActivityTypeField = () => {
  const { field } = useInput({
    source: "activity_type",
    defaultValue: "interaction",
  });

  return <input type="hidden" {...field} value={field.value ?? "interaction"} />;
};

export default function ActivityCreate() {
  const { identity } = useGetIdentity();
  const defaultValues = useMemo(
    () => ({
      ...activitiesSchema.partial().parse({}),
      // Set current user as creator - ensures proper audit trail
      created_by: identity?.id,
    }),
    [identity?.id]
  );

  return (
    <CreateBase redirect="list">
      <div className="mt-2 flex justify-center">
        <div className="w-full max-w-5xl">
          <Form defaultValues={defaultValues}>
            <Card>
              <CardContent className="space-y-6 p-6">
                <HiddenActivityTypeField />
                <ActivitySinglePage />
                <FormToolbar />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
}
