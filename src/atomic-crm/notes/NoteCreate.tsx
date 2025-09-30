import type { Identifier, RaRecord } from "ra-core";
import {
  CreateBase,
  Form,
  useGetIdentity,
  useListContext,
  useNotify,
  useRecordContext,
  useResourceContext,
  useUpdate,
} from "ra-core";
import { useFormContext } from "react-hook-form";

import { SaveButton } from "@/components/admin/form";
import { NoteInputs } from "./NoteInputs";
import { getCurrentDate } from "../validation/notes";

const foreignKeyMapping = {
  contacts: "contact_id",
  opportunities: "opportunity_id",
};

export const NoteCreate = ({
  reference,
  showStatus,
}: {
  reference: "contacts" | "opportunities";
  showStatus?: boolean;
}) => {
  const resource = useResourceContext();
  const record = useRecordContext();
  const { identity } = useGetIdentity();

  if (!record || !identity) return null;

  return (
    <CreateBase resource={resource} redirect={false}>
      <Form>
        <div className="space-y-3">
          <NoteInputs showStatus={showStatus} />
          <NoteCreateButton reference={reference} record={record} />
        </div>
      </Form>
    </CreateBase>
  );
};

const NoteCreateButton = ({
  reference,
  record,
}: {
  reference: "contacts" | "opportunities";
  record: RaRecord<Identifier>;
}) => {
  const [update] = useUpdate();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const { reset } = useFormContext();
  const { refetch } = useListContext();

  if (!record || !identity) return null;

  const resetValues: {
    text: null;
    date: null;
    attachments: null;
    status?: string;
  } = {
    text: null,
    date: null,
    attachments: null,
  };

  if (reference === "contacts") {
    resetValues.status = "warm";
  }

  const handleSuccess = (data: any) => {
    reset(resetValues, { keepValues: false });
    refetch();

    // Only update last_seen and status for contacts (opportunities don't have last_seen)
    if (reference === "contacts") {
      update(reference, {
        id: (record && record.id) as unknown as Identifier,
        data: { last_seen: new Date().toISOString(), status: data.status },
        previousData: record,
      });
    }

    notify("Note added");
  };

  return (
    <div className="flex justify-end">
      <SaveButton
        type="button"
        label="Add this note"
        transform={(data) => ({
          ...data,
          [foreignKeyMapping[reference]]: record.id,
          sales_id: identity.id,
          date: data.date || getCurrentDate(),
        })}
        mutationOptions={{
          onSuccess: handleSuccess,
        }}
      >
        Add this note
      </SaveButton>
    </div>
  );
};
