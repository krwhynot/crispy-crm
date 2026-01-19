import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDataProvider, useNotify } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateSuggestionContext } from "@/hooks/useSupportCreateSuggestion";
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
import { organizationKeys } from "@/atomic-crm/queryKeys";
import {
  organizationQuickCreateSchema,
  type OrganizationQuickCreateInput,
} from "@/atomic-crm/validation/organizations";

/**
 * P5: Isolated sub-components using useWatch for performance
 * These only re-render when their specific field changes, NOT on every keystroke
 */
interface SelectFieldProps {
  control: ReturnType<typeof useForm<OrganizationQuickCreateInput>>["control"];
  setValue: ReturnType<typeof useForm<OrganizationQuickCreateInput>>["setValue"];
  id: string;
}

function OrganizationTypeSelect({ control, setValue, id }: SelectFieldProps) {
  const value = useWatch({ name: "organization_type", control });
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Type</Label>
      <Select
        value={value}
        onValueChange={(v) =>
          setValue("organization_type", v as "customer" | "prospect" | "principal" | "distributor")
        }
      >
        <SelectTrigger id={id} className="h-11">
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
  );
}

function PrioritySelect({ control, setValue, id }: SelectFieldProps) {
  const value = useWatch({ name: "priority", control });
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Priority</Label>
      <Select value={value} onValueChange={(v) => setValue("priority", v as "A" | "B" | "C" | "D")}>
        <SelectTrigger id={id} className="h-11">
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
  );
}

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
  const queryClient = useQueryClient();

  const methods = useForm<OrganizationQuickCreateInput>({
    resolver: zodResolver(organizationQuickCreateSchema),
    defaultValues: {
      name,
      organization_type: organizationType,
      priority: "C",
    },
  });

  const handleSubmit = methods.handleSubmit(
    async (data) => {
      setIsPending(true);
      try {
        const result = await dataProvider.create("organizations", {
          data: { ...data, segment_id: PLAYBOOK_CATEGORY_IDS.Unknown },
        });
        queryClient.invalidateQueries({ queryKey: organizationKeys.all });
        notify("Organization created", { type: "success" });
        onCreated(result.data as { id: number; name: string });
        setOpen(false);
      } catch {
        notify("Failed to create organization", { type: "error" });
      } finally {
        setIsPending(false);
      }
    },
    // Focus first error field on validation failure (WCAG 3.3.1)
    (errors) => {
      const firstErrorField = Object.keys(errors)[0] as keyof OrganizationQuickCreateInput;
      if (firstErrorField) {
        methods.setFocus(firstErrorField);
      }
    }
  );

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
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
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
              aria-describedby={methods.formState.errors.name ? "name-error" : undefined}
            />
            {methods.formState.errors.name && (
              <p id="name-error" className="text-xs text-destructive" role="alert">
                {methods.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Organization Type - uses native Select instead of React Admin SelectInput */}
            <OrganizationTypeSelect
              control={methods.control}
              setValue={methods.setValue}
              id="org-type"
            />

            {/* Priority - uses native Select */}
            <PrioritySelect
              control={methods.control}
              setValue={methods.setValue}
              id="org-priority"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* City - uses native Input */}
            <div className="space-y-1">
              <Label htmlFor="org-city">City</Label>
              <Input
                id="org-city"
                {...methods.register("city")}
                aria-invalid={!!methods.formState.errors.city}
                aria-describedby={methods.formState.errors.city ? "city-error" : undefined}
              />
              {methods.formState.errors.city && (
                <p id="city-error" className="text-xs text-destructive" role="alert">
                  {methods.formState.errors.city.message}
                </p>
              )}
            </div>

            {/* State - uses native Input */}
            <div className="space-y-1">
              <Label htmlFor="org-state">State</Label>
              <Input
                id="org-state"
                {...methods.register("state")}
                aria-invalid={!!methods.formState.errors.state}
                aria-describedby={methods.formState.errors.state ? "state-error" : undefined}
              />
              {methods.formState.errors.state && (
                <p id="state-error" className="text-xs text-destructive" role="alert">
                  {methods.formState.errors.state.message}
                </p>
              )}
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

interface QuickCreateOrganizationRAProps {
  organizationType?: "customer" | "prospect" | "principal" | "distributor";
  minimalMode?: boolean;
}

export function QuickCreateOrganizationRA({
  organizationType = "customer",
  minimalMode = false,
}: QuickCreateOrganizationRAProps) {
  const { filter, onCreate, onCancel } = useCreateSuggestionContext();
  const [isPending, setIsPending] = useState(false);
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const name = filter || "";

  const methods = useForm<OrganizationQuickCreateInput>({
    resolver: zodResolver(organizationQuickCreateSchema),
    defaultValues: {
      name,
      organization_type: organizationType,
      priority: "C",
    },
  });

  const handleSubmit = methods.handleSubmit(
    async (data) => {
      setIsPending(true);
      try {
        const result = await dataProvider.create("organizations", {
          data: { ...data, segment_id: PLAYBOOK_CATEGORY_IDS.Unknown },
        });
        queryClient.invalidateQueries({ queryKey: organizationKeys.all });
        notify("Organization created", { type: "success" });
        onCreate(result.data);
      } catch (error: unknown) {
        notify("Failed to create organization", { type: "error" });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0] as keyof OrganizationQuickCreateInput;
      if (firstErrorField) {
        methods.setFocus(firstErrorField);
      }
    }
  );

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
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      notify("Organization created", { type: "success" });
      onCreate(result.data);
    } catch (error: unknown) {
      notify("Failed to create organization", { type: "error" });
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  const handleMinimalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleQuickCreate();
  };

  return (
    <Popover open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverAnchor />
      <PopoverContent className="w-80 p-4" align="start">
        <form onSubmit={minimalMode ? handleMinimalSubmit : handleSubmit} className="space-y-3">
          <p className="font-medium text-sm">Quick Create: {name}</p>

          <div className="space-y-1">
            <Label htmlFor="ra-org-name">Name</Label>
            <Input
              id="ra-org-name"
              {...methods.register("name")}
              aria-invalid={!!methods.formState.errors.name}
              aria-describedby={methods.formState.errors.name ? "ra-name-error" : undefined}
            />
            {methods.formState.errors.name && (
              <p id="ra-name-error" className="text-xs text-destructive" role="alert">
                {methods.formState.errors.name.message}
              </p>
            )}
          </div>

          {!minimalMode && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <OrganizationTypeSelect
                  control={methods.control}
                  setValue={methods.setValue}
                  id="ra-org-type"
                />
                <PrioritySelect
                  control={methods.control}
                  setValue={methods.setValue}
                  id="ra-org-priority"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="ra-org-city">City</Label>
                  <Input
                    id="ra-org-city"
                    {...methods.register("city")}
                    aria-invalid={!!methods.formState.errors.city}
                    aria-describedby={methods.formState.errors.city ? "ra-city-error" : undefined}
                  />
                  {methods.formState.errors.city && (
                    <p id="ra-city-error" className="text-xs text-destructive" role="alert">
                      {methods.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ra-org-state">State</Label>
                  <Input
                    id="ra-org-state"
                    {...methods.register("state")}
                    aria-invalid={!!methods.formState.errors.state}
                    aria-describedby={methods.formState.errors.state ? "ra-state-error" : undefined}
                  />
                  {methods.formState.errors.state && (
                    <p id="ra-state-error" className="text-xs text-destructive" role="alert">
                      {methods.formState.errors.state.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {minimalMode ? (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCancel()}
                className="h-9"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="h-9">
                Create
              </Button>
            </div>
          ) : (
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
                  onClick={() => onCancel()}
                  className="h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="h-9">
                  Create
                </Button>
              </div>
            </div>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}
