import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDataProvider, useNotify } from "ra-core";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  const [isPending, setIsPending] = useState(false);
  const dataProvider = useDataProvider();
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
    setIsPending(true);
    try {
      const result = await dataProvider.create("organizations", {
        data: { ...data, segment_id: PLAYBOOK_CATEGORY_IDS.Unknown },
      });
      notify("Organization created", { type: "success" });
      onCreated(result.data as { id: number; name: string });
      setOpen(false);
    } catch {
      notify("Failed to create organization", { type: "error" });
    } finally {
      setIsPending(false);
    }
  });

  const handleQuickCreate = async () => {
    setIsPending(true);
    try {
      const result = await dataProvider.create("organizations", {
        data: {
          name,
          organization_type: organizationType,
          priority: "C",
          segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
        },
      });
      notify("Organization created", { type: "success" });
      onCreated(result.data as { id: number; name: string });
      setOpen(false);
    } catch {
      notify("Failed to create organization", { type: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="font-medium text-sm">Quick Create: {name}</p>

          {/* Name field - uses native Input instead of React Admin TextInput */}
          <div className="space-y-1">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              {...methods.register("name")}
              aria-invalid={!!methods.formState.errors.name}
            />
            {methods.formState.errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {methods.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Organization Type - uses native Select instead of React Admin SelectInput */}
            <div className="space-y-1">
              <Label htmlFor="org-type">Type</Label>
              <Select
                value={methods.watch("organization_type")}
                onValueChange={(value) =>
                  methods.setValue(
                    "organization_type",
                    value as "customer" | "prospect" | "principal" | "distributor"
                  )
                }
              >
                <SelectTrigger id="org-type" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority - uses native Select */}
            <div className="space-y-1">
              <Label htmlFor="org-priority">Priority</Label>
              <Select
                value={methods.watch("priority")}
                onValueChange={(value) =>
                  methods.setValue("priority", value as "A" | "B" | "C" | "D")
                }
              >
                <SelectTrigger id="org-priority" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* City - uses native Input */}
            <div className="space-y-1">
              <Label htmlFor="org-city">City</Label>
              <Input id="org-city" {...methods.register("city")} />
            </div>

            {/* State - uses native Input */}
            <div className="space-y-1">
              <Label htmlFor="org-state">State</Label>
              <Input id="org-state" {...methods.register("state")} />
            </div>
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
                onClick={() => {
                  setOpen(false);
                  onCancel();
                }}
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
      </PopoverContent>
    </Popover>
  );
}
