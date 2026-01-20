import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, SaveIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Tag } from "../types";
import { colors } from "./colors";
import { RoundButton } from "./RoundButton";
import type { TagColorName } from "@/lib/color-types";
import { createTagSchema, type CreateTagInput } from "../validation/tags";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

interface TagDialogProps {
  open: boolean;
  tag?: Pick<Tag, "name" | "color">;
  title: string;
  onSubmit(tag: Pick<Tag, "name" | "color">): Promise<void>;
  onClose(): void;
}

/**
 * TagDialog - Constitution-compliant modal for creating/editing tags
 *
 * P2: Schema defaults via createTagSchema.partial().parse({})
 * P3: FormErrorSummary for accessible error aggregation
 * P5: Form mode "onSubmit" for performance (no re-render storms)
 */
export function TagDialog({ open, tag, title, onClose, onSubmit }: TagDialogProps) {
  // P2: Schema-derived defaults - NOT local useState
  // This ensures Zod type coercion is applied
  const defaultValues = useMemo(
    () =>
      createTagSchema.partial().parse({
        name: tag?.name ?? "",
        color: tag?.color ?? "warm",
      }),
    [tag]
  );

  const form = useForm<CreateTagInput>({
    resolver: zodResolver(createTagSchema),
    defaultValues,
    mode: "onSubmit", // P5: onSubmit mode for performance
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  // P5: useWatch for isolated re-renders (only re-renders when color changes, not on every keystroke)
  const selectedColor = useWatch({ name: "color", control }) as TagColorName;

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Reset form when dialog opens/closes or tag changes
  useEffect(() => {
    if (open) {
      reset({
        name: tag?.name ?? "",
        color: (tag?.color as TagColorName) ?? "warm",
      });
    }
  }, [open, tag, reset]);

  const handleFormSubmit = async (data: CreateTagInput) => {
    await onSubmit({ name: data.name, color: data.color });
    reset(defaultValues);
    onClose();
  };

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    reset(defaultValues);
    onClose();
  };

  const handleConfirmClose = () => {
    setShowUnsavedDialog(false);
    reset(defaultValues);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>Enter a name and choose a color for your tag.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* P3: FormErrorSummary for accessible error aggregation */}
                <FormErrorSummary
                  errors={errors}
                  fieldLabels={{
                    name: "Tag Name",
                    color: "Color",
                  }}
                />

                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tag name</Label>
                  <Input
                    id="tag-name"
                    {...register("name")}
                    placeholder="Enter tag name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-sm text-destructive" role="alert">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-1">
                    {colors.map((color) => (
                      <div key={color} className="relative group">
                        <RoundButton
                          color={color}
                          selected={color === selectedColor}
                          handleClick={() => {
                            setValue("color", color, { shouldValidate: true });
                          }}
                        />
                        <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                  {errors.color && (
                    <p id="color-error" className="text-sm text-destructive mt-1" role="alert">
                      {errors.color.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "text-primary",
                    isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleConfirmClose}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}
