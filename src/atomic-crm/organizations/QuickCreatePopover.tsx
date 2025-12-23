import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useCreate, useNotify } from "ra-core";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { PLAYBOOK_CATEGORY_IDS } from "@/atomic-crm/validation/segments";

const quickCreateSchema = z.object({
  name: z.string().min(1).max(255),
  organization_type: z.enum(["customer", "prospect", "principal", "distributor"]),
  priority: z.enum(["A", "B", "C", "D"]).default("C"),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
});

type QuickCreateInput = z.infer<typeof quickCreateSchema>;

interface QuickCreatePopoverProps {
  name: string;
  organizationType: "customer" | "prospect" | "principal" | "distributor";
  onCreated: (record: { id: number; name: string }) => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export function QuickCreatePopover({
  name,
  organizationType,
  onCreated,
  onCancel,
  children,
}: QuickCreatePopoverProps) {
  const [open, setOpen] = useState(true);
  const [create, { isPending }] = useCreate();
  const notify = useNotify();

  const methods = useForm<QuickCreateInput>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: {
      name,
      organization_type: organizationType,
      priority: "C",
    },
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      const result = await create(
        "organizations",
        { data: { ...data, segment_id: PLAYBOOK_CATEGORY_IDS.Unknown } },
        { returnPromise: true }
      );
      notify("Organization created", { type: "success" });
      onCreated(result.data as { id: number; name: string });
      setOpen(false);
    } catch {
      notify("Failed to create organization", { type: "error" });
    }
  });

  const handleQuickCreate = async () => {
    try {
      const result = await create(
        "organizations",
        {
          data: {
            name,
            organization_type: organizationType,
            priority: "C",
            segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
          },
        },
        { returnPromise: true }
      );
      notify("Organization created", { type: "success" });
      onCreated(result.data as { id: number; name: string });
      setOpen(false);
    } catch {
      notify("Failed to create organization", { type: "error" });
    }
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="font-medium text-sm">Quick Create: {name}</p>

            <TextInput source="name" label="Name" />

            <div className="grid grid-cols-2 gap-2">
              <SelectInput
                source="organization_type"
                label="Type"
                choices={[
                  { id: "customer", name: "Customer" },
                  { id: "prospect", name: "Prospect" },
                  { id: "principal", name: "Principal" },
                  { id: "distributor", name: "Distributor" },
                ]}
              />
              <SelectInput
                source="priority"
                label="Priority"
                choices={[
                  { id: "A", name: "A" },
                  { id: "B", name: "B" },
                  { id: "C", name: "C" },
                  { id: "D", name: "D" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TextInput source="city" label="City" />
              <TextInput source="state" label="State" />
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleQuickCreate}
                disabled={isPending}
                className="text-xs h-9"
              >
                Just use name
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setOpen(false); onCancel(); }}
                  className="h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="h-9">
                  Create
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </PopoverContent>
    </Popover>
  );
}
