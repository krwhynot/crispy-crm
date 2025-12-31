import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDataProvider, useNotify } from "ra-core";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateSuggestionContext } from "@/hooks/useSupportCreateSuggestion";

const quickCreateContactSchema = z.object({
  first_name: z.string().min(1, "First name required").max(100),
  last_name: z.string().min(1, "Last name required").max(100),
  email: z.string().email("Invalid email").max(255),
});

type QuickCreateContactInput = z.infer<typeof quickCreateContactSchema>;

interface QuickCreateContactPopoverProps {
  name: string;
  organizationId: number;
  salesId?: number;
  onCreated: (record: { id: number; first_name: string; last_name: string }) => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export function QuickCreateContactPopover({
  name,
  organizationId,
  salesId,
  onCreated,
  onCancel,
  children,
}: QuickCreateContactPopoverProps) {
  const [open, setOpen] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const methods = useForm<QuickCreateContactInput>({
    resolver: zodResolver(quickCreateContactSchema),
    defaultValues: {
      first_name: name,
      last_name: "",
      email: "",
    },
  });

  const handleSubmit = methods.handleSubmit(
    async (data) => {
      setIsPending(true);
      try {
        const now = new Date().toISOString();
        const result = await dataProvider.create("contacts", {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: [{ value: data.email, type: "work" }],
            organization_id: organizationId,
            sales_id: salesId,
            first_seen: now,
            last_seen: now,
          },
        });
        notify("Contact created", { type: "success" });
        onCreated(result.data as { id: number; first_name: string; last_name: string });
        setOpen(false);
      } catch {
        notify("Failed to create contact", { type: "error" });
      } finally {
        setIsPending(false);
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0] as keyof QuickCreateContactInput;
      if (firstErrorField) {
        methods.setFocus(firstErrorField);
      }
    }
  );

  const handleQuickCreate = async () => {
    setIsPending(true);
    try {
      const now = new Date().toISOString();
      const result = await dataProvider.create("contacts", {
        data: {
          first_name: name,
          last_name: "",
          email: [],
          organization_id: organizationId,
          sales_id: salesId,
          first_seen: now,
          last_seen: now,
          quickCreate: true, // Bypass last_name and email validation for "Just use name" flow
        },
      });
      notify("Contact created", { type: "success" });
      onCreated(result.data as { id: number; first_name: string; last_name: string });
      setOpen(false);
    } catch {
      notify("Failed to create contact", { type: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="font-medium text-sm">Quick Create Contact: {name}</p>

          <div className="space-y-1">
            <Label htmlFor="contact-first-name">First Name</Label>
            <Input
              id="contact-first-name"
              {...methods.register("first_name")}
              aria-invalid={!!methods.formState.errors.first_name}
              aria-describedby={methods.formState.errors.first_name ? "first-name-error" : undefined}
            />
            {methods.formState.errors.first_name && (
              <p id="first-name-error" className="text-xs text-destructive" role="alert">
                {methods.formState.errors.first_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-last-name">Last Name</Label>
            <Input
              id="contact-last-name"
              {...methods.register("last_name")}
              aria-invalid={!!methods.formState.errors.last_name}
              aria-describedby={methods.formState.errors.last_name ? "last-name-error" : undefined}
            />
            {methods.formState.errors.last_name && (
              <p id="last-name-error" className="text-xs text-destructive" role="alert">
                {methods.formState.errors.last_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              {...methods.register("email")}
              aria-invalid={!!methods.formState.errors.email}
              aria-describedby={methods.formState.errors.email ? "email-error" : undefined}
            />
            {methods.formState.errors.email && (
              <p id="email-error" className="text-xs text-destructive" role="alert">
                {methods.formState.errors.email.message}
              </p>
            )}
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

/**
 * React Admin integrated version of QuickCreateContactPopover.
 * Uses useCreateSuggestionContext to properly pass created record back to AutocompleteInput.
 * This prevents the @@ra-create placeholder from corrupting form state.
 */
export function QuickCreateContactRA({
  organizationId,
  salesId,
}: {
  organizationId: number;
  salesId?: number;
}) {
  const { filter, onCreate, onCancel } = useCreateSuggestionContext();
  const [isPending, setIsPending] = useState(false);
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const methods = useForm<QuickCreateContactInput>({
    resolver: zodResolver(quickCreateContactSchema),
    defaultValues: {
      first_name: filter || "",
      last_name: "",
      email: "",
    },
  });

  const handleSubmit = methods.handleSubmit(
    async (data) => {
      setIsPending(true);
      try {
        const now = new Date().toISOString();
        const result = await dataProvider.create("contacts", {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: [{ value: data.email, type: "work" }],
            organization_id: organizationId,
            sales_id: salesId,
            first_seen: now,
            last_seen: now,
          },
        });
        notify("Contact created", { type: "success" });
        onCreate(result.data);  // KEY FIX: Pass real record back to RA
      } catch (error) {
        notify("Failed to create contact", { type: "error" });
        throw error;  // Fail-fast
      } finally {
        setIsPending(false);
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0] as keyof QuickCreateContactInput;
      if (firstErrorField) {
        methods.setFocus(firstErrorField);
      }
    }
  );

  const handleQuickCreate = async () => {
    setIsPending(true);
    try {
      const now = new Date().toISOString();
      const result = await dataProvider.create("contacts", {
        data: {
          first_name: filter || "",
          last_name: "",
          email: [],
          organization_id: organizationId,
          sales_id: salesId,
          first_seen: now,
          last_seen: now,
          quickCreate: true,
        },
      });
      notify("Contact created", { type: "success" });
      onCreate(result.data);  // KEY FIX: Pass real record back to RA
    } catch (error) {
      notify("Failed to create contact", { type: "error" });
      throw error;  // Fail-fast
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverAnchor />
      <PopoverContent className="w-80 p-4" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="font-medium text-sm">Quick Create Contact: {filter}</p>

          <div className="space-y-1">
            <Label htmlFor="contact-ra-first-name">First Name</Label>
            <Input
              id="contact-ra-first-name"
              {...methods.register("first_name")}
              aria-invalid={!!methods.formState.errors.first_name}
              aria-describedby={methods.formState.errors.first_name ? "ra-first-name-error" : undefined}
            />
            {methods.formState.errors.first_name && (
              <p id="ra-first-name-error" className="text-xs text-destructive" role="alert">
                {methods.formState.errors.first_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-ra-last-name">Last Name</Label>
            <Input
              id="contact-ra-last-name"
              {...methods.register("last_name")}
              aria-invalid={!!methods.formState.errors.last_name}
              aria-describedby={methods.formState.errors.last_name ? "ra-last-name-error" : undefined}
            />
            {methods.formState.errors.last_name && (
              <p id="ra-last-name-error" className="text-xs text-destructive" role="alert">
                {methods.formState.errors.last_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-ra-email">Email</Label>
            <Input
              id="contact-ra-email"
              type="email"
              {...methods.register("email")}
              aria-invalid={!!methods.formState.errors.email}
              aria-describedby={methods.formState.errors.email ? "ra-email-error" : undefined}
            />
            {methods.formState.errors.email && (
              <p id="ra-email-error" className="text-xs text-destructive" role="alert">
                {methods.formState.errors.email.message}
              </p>
            )}
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
                onClick={() => onCancel()}
                disabled={isPending}
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
