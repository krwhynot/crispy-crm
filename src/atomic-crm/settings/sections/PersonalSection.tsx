import { RecordField } from "@/components/admin/record-field";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircleX, Pencil, Save } from "lucide-react";
import { useGetIdentity, useRecordContext } from "ra-core";
import { useState } from "react";
import { useFormState } from "react-hook-form";
import { ImageEditorField } from "@/components/ui";
import type { Sale, SalesFormData } from "../../types";
import { useSalesUpdate } from "../hooks";
import { TimeZoneSelect } from "../TimeZoneSelect";

export function PersonalSection() {
  const [isEditMode, setEditMode] = useState(false);
  const record = useRecordContext<Sale>();
  const { data: identity, refetch } = useGetIdentity();
  const { isDirty } = useFormState();

  const { mutate: mutateSale } = useSalesUpdate({
    userId: record?.id,
    onSuccess: () => {
      refetch();
      setEditMode(false);
    },
  });

  if (!identity) return null;

  const handleAvatarUpdate = async (values: SalesFormData) => {
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
            value={record?.timezone || "America/Chicago"}
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
