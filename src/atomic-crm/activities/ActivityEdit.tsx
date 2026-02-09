/**
 * ActivityEdit - Edit form for Activity records
 *
 * Follows the standard module pattern with EditBase and pessimistic mutations.
 */
import { EditBase, Form, useRecordContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import { activityKeys, entityTimelineKeys } from "../queryKeys";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { FormToolbar } from "@/atomic-crm/layout/FormToolbar";
import type { ActivityRecord } from "../types";
import { ActivityInputs } from "./ActivityInputs";
import { ucFirst } from "@/atomic-crm/utils";

const ActivityEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      redirect="list"
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          // Invalidate activities cache to refresh list views
          queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
          queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
        },
      }}
    >
      <div className="bg-muted mt-2 flex justify-center px-6 py-6">
        <div className="w-full max-w-5xl">
          <ActivityEditForm />
        </div>
      </div>
    </EditBase>
  );
};

const ActivityEditForm = () => {
  const record = useRecordContext<ActivityRecord>();

  // Wait for record to load before rendering form
  if (!record) return null;

  return (
    <Form defaultValues={record} mode="onBlur" shouldUnregister>
      <SectionCard contentClassName="space-y-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Edit Activity</h2>
          <span className="text-sm text-muted-foreground">
            {record.type && `${ucFirst(record.type)}`}
            {record.activity_date && ` - ${new Date(record.activity_date).toLocaleDateString()}`}
          </span>
        </div>
        <ActivityInputs />
        <FormToolbar dataTutorial="activity-save-btn" />
      </SectionCard>
    </Form>
  );
};

export { ActivityEdit };
export default ActivityEdit;
