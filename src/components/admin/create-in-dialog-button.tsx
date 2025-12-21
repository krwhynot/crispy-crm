import React, { useState } from "react";
import { CreateBase, Form, useNotify, useRefresh, type RaRecord, type Identifier } from "ra-core";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "@/components/admin/simple-form";
import { SaveButton } from "@/components/admin/form";

interface CreateInDialogButtonProps<RecordType extends RaRecord = RaRecord> {
  resource: string;
  children: React.ReactElement; // The Create component (e.g., OrganizationCreate content)
  defaultValues?: Partial<Omit<RecordType, 'id'>>;
  label?: string;
  onSave?: (record: RecordType) => void;
  transform?: (data: Partial<Omit<RecordType, 'id'>>, options?: { previousData?: Partial<Omit<RecordType, 'id'>> }) => Partial<Omit<RecordType, 'id'>> | Promise<Partial<Omit<RecordType, 'id'>>>;
  title?: string;
  description?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const CreateInDialogButton = <RecordType extends RaRecord = RaRecord>({
  resource,
  children,
  defaultValues = {},
  label = "New",
  onSave,
  transform,
  title = `Create new ${resource}`,
  description,
  variant = "outline",
  size = "sm",
  className,
}: CreateInDialogButtonProps<RecordType>) => {
  const [open, setOpen] = useState(false);
  const notify = useNotify();
  const refresh = useRefresh();

  // Handle successful creation - CreateBase already called dataProvider.create(),
  // so this callback receives the newly created record with its ID
  const handleSuccess = (createdRecord: RecordType) => {
    // Close dialog
    setOpen(false);

    // Notify success
    notify(`${resource} created successfully`, { type: "success" });

    // Refresh the list/form to get new options
    refresh();

    // Call onSave callback if provided (for auto-selecting the new record)
    if (onSave && createdRecord) {
      onSave(createdRecord);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Plus className="w-4 h-4 mr-1" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <CreateBase
          resource={resource}
          redirect={false}
          transform={transform}
          mutationOptions={{
            onSuccess: handleSuccess,
            onError: () => {
              notify(`Error creating ${resource}`, { type: "error" });
            },
          }}
        >
          <Form defaultValues={defaultValues}>
            <Card className="border-0 shadow-none">
              <CardContent className="p-0 pt-4">
                {children}
                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <SaveButton label="Create" />
                  </div>
                </FormToolbar>
              </CardContent>
            </Card>
          </Form>
        </CreateBase>
      </DialogContent>
    </Dialog>
  );
};
