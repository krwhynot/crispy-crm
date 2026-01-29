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
import type { Contact } from "../types";
import type { Organization } from "../types";
import type { Opportunity } from "../types";
import { useFormContext, useFormState } from "react-hook-form";

import { SaveButton } from "@/components/ra-wrappers/form";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { createFormResolver } from "@/lib/zodErrorFormatting";
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
  // NoteCreate handles multiple parent types: Contact | Opportunity | Organization
  // Using RaRecord as the union type since we only need the id field
  const record = useRecordContext<RaRecord>();
  const { data: identity } = useGetIdentity();

  if (!record || !identity) return null;

  const formDefaults = {
    ...baseNoteSchema.partial().parse({}),
  };

  return (
    <CreateBase resource={resource} redirect={false}>
      <Form
        defaultValues={formDefaults}
        mode="onBlur"
        resolver={createFormResolver(baseNoteSchema)}
      >
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

  const handleSuccess = async () => {
    reset(baseNoteSchema.partial().parse({}), { keepValues: false });

    // Only update last_seen for contacts (opportunities don't have last_seen)
    if (reference === "contacts") {
      await update(reference, {
        id: record.id,
        data: { last_seen: new Date().toISOString() },
        previousData: record,
      });
    }

    refetch();
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
