import { AdminButton } from "@/components/admin/AdminButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleX, Edit, Save, Trash2 } from "lucide-react";
import { Form, useDelete, useNotify, useResourceContext, useUpdate, WithRecord } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FieldValues, SubmitHandler } from "react-hook-form";

import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import { Avatar } from "../contacts/Avatar";
import { RelativeDate } from "@/components/ui";
import { SaleName } from "../sales/SaleName";
import type { ContactNote, OpportunityNote, OrganizationNote } from "../types";
import { NoteInputs } from "./NoteInputs";

export const Note = ({
  note,
}: {
  note: OpportunityNote | ContactNote | OrganizationNote;
  isLast: boolean;
}) => {
  const [isHover, setHover] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const resource = useResourceContext();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const [update, { isPending }] = useUpdate();

  const [deleteNote] = useDelete(
    resource,
    { id: note.id, previousData: note },
    {
      mutationMode: "undoable",
      onSuccess: () => {
        notify("Note deleted", { type: "info", undoable: true });
        // Invalidate parent resources to refresh note counts
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        queryClient.invalidateQueries({ queryKey: ["organizations"] });
      },
    }
  );

  const handleDelete = () => {
    deleteNote();
  };

  const handleEnterEditMode = () => {
    setEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setHover(false);
  };

  const handleNoteUpdate: SubmitHandler<FieldValues> = (values) => {
    update(
      resource,
      { id: note.id, data: values, previousData: note },
      {
        onSuccess: () => {
          setEditing(false);
          setHover(false);
          // Invalidate parent resources to refresh note counts
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
          queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
      }
    );
  };

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="flex items-center space-x-4 w-full">
        {resource === "contactNotes" ? (
          <Avatar width={20} height={20} />
        ) : resource === "opportunityNotes" ? (
          <ReferenceField
            source="opportunity_id"
            reference="opportunities"
            record={note}
            link={false}
          >
            <ReferenceField source="customer_organization_id" reference="organizations" link="show">
              <OrganizationAvatar width={20} height={20} />
            </ReferenceField>
          </ReferenceField>
        ) : resource === "organizationNotes" ? (
          <ReferenceField
            source="organization_id"
            reference="organizations"
            record={note}
            link={false}
          >
            <OrganizationAvatar width={20} height={20} />
          </ReferenceField>
        ) : null}
        <div className="inline-flex h-full items-center text-sm text-muted-foreground">
          <ReferenceField
            record={note}
            resource={resource}
            source="sales_id"
            reference="sales"
            link={false}
          >
            <WithRecord render={(record) => <SaleName sale={record} />} />
          </ReferenceField>{" "}
          added a note
        </div>
        <span className={`${isHover ? "visible" : "invisible"}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AdminButton
                  variant="ghost"
                  size="icon"
                  onClick={handleEnterEditMode}
                  className="cursor-pointer"
                  aria-label="Edit note"
                >
                  <Edit className="size-4" />
                </AdminButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit note</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AdminButton
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="cursor-pointer"
                  aria-label="Delete note"
                >
                  <Trash2 className="size-4" />
                </AdminButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete note</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
        <div className="flex-1"></div>
        <span className="text-sm text-muted-foreground">
          <RelativeDate date={note.created_at} />
        </span>
      </div>
      {isEditing ? (
        <Form onSubmit={handleNoteUpdate} record={note}>
          <NoteInputs />
          <div className="flex justify-end mt-4 space-x-4">
            <AdminButton
              variant="ghost"
              onClick={handleCancelEdit}
              type="button"
              className="cursor-pointer"
            >
              <CircleX className="size-4" />
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Save className="size-4" />
              Update note
            </AdminButton>
          </div>
        </Form>
      ) : (
        <div className="pt-2 [&_p:empty]:min-h-[0.75em]">
          {note.text?.split("\n").map((paragraph: string, index: number) => (
            <p className="text-sm leading-6 m-0" key={index}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
