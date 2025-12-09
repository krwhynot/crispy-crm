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
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Tag } from "../types";
import { colors } from "./colors";
import { RoundButton } from "./RoundButton";
import { validateTagColor, normalizeColorToSemantic } from "./tag-colors";
import type { TagColorName } from "@/lib/color-types";

interface TagDialogProps {
  open: boolean;
  tag?: Pick<Tag, "name" | "color">;
  title: string;
  onSubmit(tag: Pick<Tag, "name" | "color">): Promise<void>;
  onClose(): void;
}

export function TagDialog({ open, tag, title, onClose, onSubmit }: TagDialogProps) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<TagColorName>(colors[0]);
  const [disabled, setDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colorError, setColorError] = useState<string | undefined>();

  const handleNewTagNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewTagName(event.target.value);
  };

  const handleClose = () => {
    setDisabled(false);
    setIsSubmitting(false);
    setColorError(undefined);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate the color before submission
    const validationError = validateTagColor(newTagColor);
    if (validationError) {
      setColorError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: newTagName, color: newTagColor });

      setDisabled(true);
      setNewTagName("");
      setNewTagColor(colors[0]);
      setColorError(undefined);

      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setNewTagName(tag?.name ?? "");
    // Normalize the color to semantic name (handles both hex and semantic)
    const normalizedColor = tag?.color ? normalizeColorToSemantic(tag.color) : colors[0];
    setNewTagColor(normalizedColor);
  }, [tag]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Enter a name and choose a color for your tag.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={handleNewTagNameChange}
                placeholder="Enter tag name"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1">
                {colors.map((color) => (
                  <div key={color} className="relative group">
                    <RoundButton
                      color={color}
                      selected={color === newTagColor}
                      handleClick={() => {
                        setNewTagColor(color);
                        setColorError(undefined);
                      }}
                    />
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
              {colorError && <p className="text-sm text-destructive mt-1">{colorError}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              disabled={disabled || isSubmitting || !newTagName.trim()}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-primary",
                disabled || isSubmitting || !newTagName.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
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
      </DialogContent>
    </Dialog>
  );
}
