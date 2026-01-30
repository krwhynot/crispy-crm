import { useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useDataProvider, useNotify } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { logger } from "@/lib/logger";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateSuggestionContext } from "@/hooks/useSupportCreateSuggestion";
import { AdminButton } from "@/components/admin/AdminButton";
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
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";

// ============================================================================
// Shared sub-components (P5: useWatch isolates re-renders per field)
// ============================================================================

interface SelectFieldProps {
  control: UseFormReturn<OrganizationQuickCreateInput>["control"];
  setValue: UseFormReturn<OrganizationQuickCreateInput>["setValue"];
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

// ============================================================================
// Shared form body — renders all quick-create fields
// ============================================================================

interface QuickCreateFormFieldsProps {
  methods: UseFormReturn<OrganizationQuickCreateInput>;
  idPrefix: string;
  showDetails?: boolean;
}

function QuickCreateFormFields({ methods, idPrefix, showDetails = true }: QuickCreateFormFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          {...methods.register("name")}
          aria-invalid={!!methods.formState.errors.name}
          aria-describedby={methods.formState.errors.name ? `${idPrefix}-name-error` : undefined}
        />
        {methods.formState.errors.name && (
          <p id={`${idPrefix}-name-error`} className="text-xs text-destructive" role="alert">
            {methods.formState.errors.name.message}
          </p>
        )}
      </div>

      {showDetails && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <OrganizationTypeSelect
              control={methods.control}
              setValue={methods.setValue}
              id={`${idPrefix}-type`}
            />
            <PrioritySelect
              control={methods.control}
              setValue={methods.setValue}
              id={`${idPrefix}-priority`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`${idPrefix}-city`}>City</Label>
              <Input
                id={`${idPrefix}-city`}
                {...methods.register("city")}
                aria-invalid={!!methods.formState.errors.city}
                aria-describedby={methods.formState.errors.city ? `${idPrefix}-city-error` : undefined}
              />
              {methods.formState.errors.city && (
                <p id={`${idPrefix}-city-error`} className="text-xs text-destructive" role="alert">
                  {methods.formState.errors.city.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor={`${idPrefix}-state`}>State</Label>
              <Input
                id={`${idPrefix}-state`}
                {...methods.register("state")}
                aria-invalid={!!methods.formState.errors.state}
                aria-describedby={methods.formState.errors.state ? `${idPrefix}-state-error` : undefined}
              />
              {methods.formState.errors.state && (
                <p id={`${idPrefix}-state-error`} className="text-xs text-destructive" role="alert">
                  {methods.formState.errors.state.message}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ============================================================================
// Shared hook — form setup + creation logic
// ============================================================================

interface UseQuickCreateOrgOptions {
  name: string;
  organizationType: "customer" | "prospect" | "principal" | "distributor";
  onSuccess: (record: { id: number; name: string }) => void;
  logContext?: string;
}

function useQuickCreateOrg({ name, organizationType, onSuccess, logContext }: UseQuickCreateOrgOptions) {
  const [isPending, setIsPending] = useState(false);
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const methods = useForm<OrganizationQuickCreateInput>({
    resolver: createFormResolver(organizationQuickCreateSchema),
    defaultValues: {
      name,
      organization_type: organizationType,
      priority: "C",
      segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
    },
  });

  const createOrg = async (data: OrganizationQuickCreateInput) => {
    setIsPending(true);
    try {
      const result = await dataProvider.create("organizations", { data });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      notify(notificationMessages.created("Organization"), { type: "success" });
      onSuccess(result.data as { id: number; name: string });
      return result;
    } catch (error: unknown) {
      if (logContext) {
        logger.error("Organization creation failed", error, {
          feature: "QuickCreatePopover",
          operation: logContext,
        });
      }
      notify("Failed to create organization", { type: "error" });
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = methods.handleSubmit(
    (data) => createOrg(data),
    // Focus first error field on validation failure (WCAG 3.3.1)
    (errors) => {
      const firstErrorField = Object.keys(errors)[0] as keyof OrganizationQuickCreateInput;
      if (firstErrorField) {
        methods.setFocus(firstErrorField);
      }
    }
  );

  const handleQuickCreate = () =>
    createOrg({
      name,
      organization_type: organizationType,
      priority: "C",
      segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
    });

  return { methods, isPending, handleSubmit, handleQuickCreate };
}

// ============================================================================
// Exported components
// ============================================================================

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
  const { methods, isPending, handleSubmit, handleQuickCreate } = useQuickCreateOrg({
    name,
    organizationType,
    onSuccess: (record) => {
      onCreated(record);
      setOpen(false);
    },
    logContext: "handleSubmit",
  });

  return (
    <Popover open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="font-medium text-sm">Quick Create: {name}</p>
          <QuickCreateFormFields methods={methods} idPrefix="org" />
          <div className="flex justify-between pt-2">
            <AdminButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleQuickCreate}
              isLoading={isPending}
              className="text-xs"
            >
              Just use name
            </AdminButton>
            <div className="flex gap-2">
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  onCancel();
                }}
              >
                Cancel
              </AdminButton>
              <AdminButton type="submit" size="sm" disabled={isPending} className="h-11">
                Create
              </AdminButton>
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
  const name = filter || "";

  const { methods, isPending, handleSubmit, handleQuickCreate } = useQuickCreateOrg({
    name,
    organizationType,
    onSuccess: (record) => onCreate(record),
  });

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
          <QuickCreateFormFields methods={methods} idPrefix="ra-org" showDetails={!minimalMode} />
          {minimalMode ? (
            <div className="flex justify-end gap-2 pt-2">
              <AdminButton type="button" variant="outline" size="sm" onClick={() => onCancel()}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" size="sm" isLoading={isPending}>
                Create
              </AdminButton>
            </div>
          ) : (
            <div className="flex justify-between pt-2">
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleQuickCreate}
                isLoading={isPending}
                className="text-xs"
              >
                Just use name
              </AdminButton>
              <div className="flex gap-2">
                <AdminButton type="button" variant="outline" size="sm" onClick={() => onCancel()}>
                  Cancel
                </AdminButton>
                <AdminButton type="submit" size="sm" isLoading={isPending}>
                  Create
                </AdminButton>
              </div>
            </div>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}
