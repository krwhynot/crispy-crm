import React, { useState } from "react";
import { CreateBase, Form, useNotify, useDataProvider, useRefresh } from "ra-core";
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
import { CancelButton } from "@/components/admin/cancel-button";

interface CreateInDialogButtonProps {
  resource: string;
  children: React.ReactElement; // The Create component (e.g., OrganizationCreate content)
  defaultValues?: Record<string, any>;
  label?: string;
  onSave?: (record: any) => void;
  transform?: (data: any) => any;
  title?: string;
  description?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const CreateInDialogButton = ({
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
}: CreateInDialogButtonProps) => {
  const [open, setOpen] = useState(false);
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const refresh = useRefresh();

  const handleSave = async (data: any) => {
    try {
      // Apply transform if provided
      const transformedData = transform ? transform(data) : data;

      // Create the record
      const response = await dataProvider.create(resource, { data: transformedData });

      // Close dialog
      setOpen(false);

      // Notify success
      notify(`${resource} created successfully`, { type: "success" });

      // Refresh the list/form to get new options
      refresh();

      // Call onSave callback if provided (for auto-selecting the new record)
      if (onSave && response.data) {
        onSave(response.data);
      }
    } catch (error) {
      notify(`Error creating ${resource}`, { type: "error" });
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
          mutationOptions={{
            onSuccess: (data: any) => {
              handleSave(data);
            },
          }}
        >
          <Form defaultValues={defaultValues}>
            <Card className="border-0 shadow-none">
              <CardContent className="p-0 pt-4">
                {children}
                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
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