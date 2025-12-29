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
import { useFormContext, useFormState } from "react-hook-form";

import { SaveButton } from "@/components/admin/form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { NoteInputs } from "./NoteInputs";
import { baseNoteSchema, getCurrentDate } from "../validation/notes";

const foreignKeyMapping = {
  contacts: "contact_id",
  opportunities: "opportunity_id",
  organizations: "organization_id",
};

export const NoteCreate = ({
  reference,
}: {
  reference: "contacts" | "opportunities" | "organizations";
}) => {
  const resource = useResourceContext();
  const record = useRecordContext();
  const { data: identity } = useGetIdentity();

  if (!record || !identity) return null;

  const formDefaults = {
    ...baseNoteSchema.partial().parse({}),
  };

  return (
    <CreateBase resource={resource} redirect={false}>
      <Form defaultValues={formDefaults}>
        <div className="space-y-3">
          <NoteFormContent reference={reference} record={record} />
        </div>
      </Form>
    </CreateBase>
  );
};

const NoteFormContent = ({
  reference,
  record,
}: {
  reference: "contacts" | "opportunities" | "organizations";
  record: RaRecord<Identifier>;
}) => {
  const { errors } = useFormState();

  return (
    <>
      <FormErrorSummary errors={errors} />
      <NoteInputs />
      <NoteCreateButton reference={reference} record={record} />
    </>
  );
};

const NoteCreateButton = ({
  reference,
  record,
}: {
  reference: "contacts" | "opportunities" | "organizations";
  record: RaRecord<Identifier>;
}) => {
  const [update] = useUpdate();
  const notify = useNotify();
  const { data: identity } = useGetIdentity();
  const { reset } = useFormContext();
  const { refetch } = useListContext();

  if (!record || !identity) return null;

  const handleSuccess = () => {
    reset(baseNoteSchema.partial().parse({}), { keepValues: false });
    refetch();

    // Only update last_seen for contacts (opportunities don't have last_seen)
    if (reference === "contacts") {
      update(reference, {
        id: record.id,
        data: { last_seen: new Date().toISOString() },
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
        data-tutorial="add-note-btn"
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
