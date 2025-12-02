import { RecordField } from "@/components/admin/record-field";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { CircleX, Pencil, Save } from "lucide-react";
import { useDataProvider, useGetIdentity, useNotify, useRecordContext } from "ra-core";
import { useState } from "react";
import { useFormState } from "react-hook-form";
import { ImageEditorField } from "@/components/ui";
import type { CrmDataProvider } from "../../providers/types";
import type { Sale, SalesFormData } from "../../types";
import { TimeZoneSelect } from "../TimeZoneSelect";

export function PersonalSection() {
  const [isEditMode, setEditMode] = useState(false);
  const notify = useNotify();
  const record = useRecordContext<Sale>();
  const { data: identity, refetch } = useGetIdentity();
  const { isDirty } = useFormState();
  const dataProvider = useDataProvider<CrmDataProvider>();

  const { mutate: mutateSale } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      if (!record) {
        throw new Error("Record not found");
      }
      return dataProvider.salesUpdate(record.id, data);
    },
    onSuccess: () => {
      refetch();
      setEditMode(false);
      notify("Your profile has been updated");
    },
    onError: () => {
      notify("An error occurred. Please try again.", {
        type: "error",
      });
    },
  });

  if (!identity) return null;

  const handleAvatarUpdate = async (values: any) => {
    mutateSale(values);
  };

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-row justify-between">
          <h2 className="text-xl font-semibold text-muted-foreground">My info</h2>
        </div>

        <div className="space-y-4 mb-4">
          <ImageEditorField
            source="avatar"
            type="avatar"
            onSave={handleAvatarUpdate}
            linkPosition="right"
          />
          <TextRender source="first_name" isEditMode={isEditMode} />
          <TextRender source="last_name" isEditMode={isEditMode} />
          <TextRender source="email" isEditMode={isEditMode} />
          <TimeZoneSelect
            value={record?.timezone || "America/New_York"}
            onChange={(value) => mutateSale({ ...record, timezone: value })}
            disabled={!isEditMode}
          />
        </div>

        <div className="flex flex-row justify-end gap-2">
          <Button
            type="button"
            variant={isEditMode ? "ghost" : "outline"}
            onClick={() => setEditMode(!isEditMode)}
            className="flex items-center min-h-[44px]"
          >
            {isEditMode ? <CircleX /> : <Pencil />}
            {isEditMode ? "Cancel" : "Edit"}
          </Button>

          {isEditMode && (
            <Button type="submit" disabled={!isDirty} variant="outline" className="min-h-[44px]">
              <Save />
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const TextRender = ({ source, isEditMode }: { source: string; isEditMode: boolean }) => {
  if (isEditMode) {
    return <TextInput source={source} helperText={false} />;
  }
  return (
    <div className="m-2">
      <RecordField source={source} />
    </div>
  );
};
