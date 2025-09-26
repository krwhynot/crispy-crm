import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SaveIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Tag } from "../types";
import { colors } from "./colors";
import { RoundButton } from "./RoundButton";
import { validateTagColor, normalizeColorToSemantic } from "./tag-colors";
import type { TagColorName } from "@/lib/color-types";

type TagDialogProps = {
  open: boolean;
  tag?: Pick<Tag, "name" | "color">;
  title: string;
  onSubmit(tag: Pick<Tag, "name" | "color">): Promise<void>;
  onClose(): void;
};

export function TagDialog({
  open,
  tag,
  title,
  onClose,
  onSubmit,
}: TagDialogProps) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<TagColorName>(colors[0]);
  const [disabled, setDisabled] = useState(false);
  const [colorError, setColorError] = useState<string | undefined>();

  const handleNewTagNameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setNewTagName(event.target.value);
  };

  const handleClose = () => {
    setDisabled(false);
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

    await onSubmit({ name: newTagName, color: newTagColor });

    setDisabled(true);
    setNewTagName("");
    setNewTagColor(colors[0]);
    setColorError(undefined);

    handleClose();
  };

  useEffect(() => {
    setNewTagName(tag?.name ?? "");
    // Normalize the color to semantic name (handles both hex and semantic)
    const normalizedColor = tag?.color
      ? normalizeColorToSemantic(tag.color)
      : colors[0];
    setNewTagColor(normalizedColor);
  }, [tag]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag name</Label>
              <Input
                id="tag-name"
                autoFocus
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
              {colorError && (
                <p className="text-sm text-destructive mt-1">{colorError}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              disabled={disabled || !newTagName.trim()}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-primary",
                disabled || !newTagName.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer",
              )}
            >
              <SaveIcon />
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
