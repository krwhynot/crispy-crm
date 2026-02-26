# Tag Component Patterns

Standard patterns for tag management in Crispy CRM.

## Component Hierarchy

```
TagColorName (lib/color-types.ts)
    ↓
SEMANTIC_COLORS → getTagColorClass() → CSS classes (tag-warm, tag-blue, etc.)
    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TagDialog (base form)                              │
│    - Color picker with RoundButton                                           │
│    - Zod validation with schema defaults                                     │
│    - FormErrorSummary for accessible errors                                  │
└─────────────────────────────────────────────────────────────────────────────┘
         ↑                                      ↑
         │                                      │
┌────────────────────┐              ┌────────────────────┐
│  TagCreateModal    │              │   TagEditModal     │
│  (useCreate hook)  │              │  (useUpdate hook)  │
└────────────────────┘              └────────────────────┘
                                             ↑
                                             │
                                    ┌────────────────────┐
                                    │     TagChip        │
                                    │  (display + edit)  │
                                    └────────────────────┘
                                             ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              ReferenceInput + GenericSelectInput                             │
│                                                                              │
│    ┌─────────────────────────┐    ┌─────────────────────────────────────┐   │
│    │   TagQuickInput         │    │   TagSelectWithCreate               │   │
│    │   (Pattern A: emptyAction)│    │   (Pattern C: footer + dialog)     │   │
│    └─────────────────────────┘    └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pattern A: Tag Quick Input (Simple Inline Creation)

For fast tag creation when no existing tag matches the search term.

```tsx
// src/atomic-crm/tags/TagQuickInput.tsx
import { useState } from "react";
import { ReferenceInput, useCreate, useRefresh } from "react-admin";
import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";

interface TagQuickInputProps {
  source: string;
  label?: string;
}

export function TagQuickInput({ source, label }: TagQuickInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [create, { isLoading: isCreating }] = useCreate();
  const { success, error: notifyError } = useSafeNotify();
  const refresh = useRefresh();

  const handleQuickCreate = async (name: string) => {
    if (!name.trim()) return;

    await create(
      "tags",
      { data: { name: name.trim(), color: "warm" } },  // Default color
      {
        returnPromise: true,
        onSuccess: () => {
          success(notificationMessages.created("Tag"));  // Centralized notification string
          refresh();  // Triggers ReferenceInput to refetch
        },
        onError: (err: unknown) => {
          notifyError(err);  // Sanitizes error message automatically
        },
      }
    );
  };

  return (
    <ReferenceInput reference="tags" source={source}>
      <GenericSelectInput
        label={label}
        optionLabel="name"
        onSearchChange={setSearchTerm}
        emptyAction={{
          label: `Create "${searchTerm}"`,
          onClick: () => handleQuickCreate(searchTerm),
        }}
        isLoading={isCreating}
        searchable
      />
    </ReferenceInput>
  );
}
```

**When to use**: Fast tagging workflows where color selection isn't important. User types a tag name that doesn't exist and wants to create it immediately with default color.

**Key points:**
- `emptyAction` appears only when no results match
- Uses default `'warm'` color (no color picker)
- `refresh()` triggers ReferenceInput to refetch the new tag
- Fail-fast: errors shown via `notify()`, no silent failures

---

## Pattern B: Tag Dialog (Full CRUD Modal)

For complete tag management with name and color selection.

```tsx
// src/atomic-crm/tags/TagDialog.tsx
import { AdminButton } from "@/components/admin/AdminButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { createFormResolver } from "@/lib/zodErrorFormatting";
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

export function TagDialog({ open, tag, title, onClose, onSubmit }: TagDialogProps) {
  // P2: Schema-derived defaults - NOT local useState
  // FIX: Use undefined (not "") for empty name - .partial() allows undefined but "" still fails min(1)
  const defaultValues = useMemo(
    () =>
      createTagSchema.partial().parse({
        name: tag?.name || undefined,
        color: tag?.color ?? "warm",
      }),
    [tag]
  );

  const form = useForm<CreateTagInput>({
    resolver: createFormResolver(createTagSchema),  // CORE-018: createFormResolver, NOT zodResolver
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

  // Dirty-state protection: prompt before discarding unsaved changes
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
                  fieldLabels={{ name: "Tag Name", color: "Color" }}
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
                        {/* Color name tooltip on hover */}
                        <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Color validation error display */}
                  {errors.color && (
                    <p id="color-error" className="text-sm text-destructive mt-1" role="alert">
                      {errors.color.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <AdminButton
                  type="submit"
                  variant="outline"
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                  className="text-primary"
                >
                  <SaveIcon className="h-4 w-4" />
                  Save
                </AdminButton>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
      {/* Dirty-state protection dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleConfirmClose}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}
```

**When to use**: Tag creation or editing where the user needs to choose both name AND color. Used by TagCreateModal and TagEditModal.

**Constitution compliance:**
- **P2**: Schema defaults via `createTagSchema.partial().parse({})`
- **P3**: FormErrorSummary for accessible error aggregation
- **P5**: Form mode `onSubmit` (not `onChange`) for performance
- **CORE-018**: `createFormResolver(createTagSchema)` instead of direct `zodResolver`
- **CORE-015**: `DialogDescription` for accessible dialog context
- `useWatch({ name: "color", control })` for isolated re-renders (not `watch()`)
- `UnsavedChangesDialog` for dirty-state protection on close
- `AdminButton` with `isLoading`/`loadingText` instead of plain `Button`
- Color tooltips on hover via grouped `<span>` elements
- Color error display with `role="alert"` for accessibility

---

## Pattern C: Tag Selection with Creation (Footer + Dialog)

For tag selection with the option to create new tags with full control.

```tsx
// src/atomic-crm/tags/TagSelectWithCreate.tsx
import { useState } from "react";
import { ReferenceInput, useCreate, useRefresh } from "react-admin";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";
import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
import { AdminButton } from "@/components/admin/AdminButton";
import { PlusIcon } from "lucide-react";
import { TagDialog } from "./TagDialog";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";
import type { Tag } from "../types";

interface TagSelectWithCreateProps {
  source: string;
  label?: string;
}

export function TagSelectWithCreate({ source, label }: TagSelectWithCreateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultName, setDefaultName] = useState("");
  const [create] = useCreate();
  const { success, error: notifyError } = useSafeNotify();
  const refresh = useRefresh();

  const handleCreateTag = async (data: Pick<Tag, "name" | "color">) => {
    await create(
      "tags",
      { data },
      {
        returnPromise: true,
        onSuccess: () => {
          success(notificationMessages.created("Tag"));  // Centralized notification string
          setDialogOpen(false);
          refresh();
        },
        onError: (error) => {
          notifyError(error);
        },
      }
    );
  };

  // Footer stays visible even when filtering
  const footer = (
    <AdminButton
      type="button"
      variant="ghost"
      className="h-11 w-full justify-start text-sm"
      onClick={() => setDialogOpen(true)}
    >
      <PlusIcon className="mr-2 h-4 w-4" />
      Create new tag
    </AdminButton>
  );

  return (
    <>
      <ReferenceInput reference="tags" source={source}>
        <GenericSelectInput
          label={label}
          optionLabel="name"
          onSearchChange={setDefaultName}  // Pre-fills dialog
          footer={footer}
          searchable
        />
      </ReferenceInput>

      <TagDialog
        open={dialogOpen}
        title="Create a new tag"
        tag={{ name: defaultName, color: "warm" }}  // Pre-fill from search
        onSubmit={handleCreateTag}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
```

**When to use**: When users need to select a tag but might want to create a new one with full color selection. Footer button is always visible (sticky).

**Key points:**
- `footer` slot renders a "Create new..." button (always visible)
- `onSearchChange` pre-fills the dialog's name field
- Separation of concerns: TagDialog handles the form, this component handles the workflow

---

## Pattern D: Tag Chip Component (Display with Actions)

For displaying tags with color, edit trigger, and remove action.

```tsx
// src/atomic-crm/tags/TagChip.tsx
import { X } from "lucide-react";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Tag } from "../types";
import { TagEditModal } from "./TagEditModal";
import { getTagColorClass } from "./tag-colors";

interface TagChipProps {
  tag: Tag;
  onUnlink: () => Promise<void>;
}

// memo() prevents unnecessary re-renders when parent re-renders with same tag/onUnlink
export const TagChip = memo(function TagChip({ tag, onUnlink }: TagChipProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = () => {
    setOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer",
          "border border-black/20",  // Semantic border with 20% opacity
          "transition-all duration-200",
          "hover:shadow-sm hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          getTagColorClass(tag.color)  // Returns 'tag-warm', 'tag-blue', etc.
        )}
        onClick={handleClick}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {tag.name}
        {/* Remove button with 44px touch target (WCAG 2.5.5) - uses negative margin to maintain visual density */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnlink();
          }}
          className="relative -my-2 -mr-1 ml-0.5 h-11 w-11 flex items-center justify-center transition-colors cursor-pointer hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <TagEditModal tag={tag} open={open} onClose={handleClose} />
    </>
  );
});
```

**When to use**: Displaying assigned tags on entities (contacts, opportunities). Click to edit, X to unlink.

**Performance:**
- `memo()` wrapping prevents unnecessary re-renders when parent re-renders with same props

**Accessibility:**
- `tabIndex={0}` and `role="button"` for keyboard navigation
- `aria-label` on remove button
- 44px touch target (WCAG 2.5.5) using negative margins for visual density
- Focus-visible ring on both chip and remove button

---

## Pattern E: Color System

Semantic color system with CSS class mapping.

### Available Colors (12)

| Color | CSS Class | Hex Fallback |
|-------|-----------|--------------|
| `warm` | `tag-warm` | `#eddcd2` |
| `yellow` | `tag-yellow` | `#fff1e6` |
| `pink` | `tag-pink` | `#fde2e4` |
| `green` | `tag-green` | `#dbe7e4` |
| `teal` | `tag-teal` | `#c5dedd` |
| `blue` | `tag-blue` | `#d6e2e9` |
| `purple` | `tag-purple` | `#8b5cf6` |
| `gray` | `tag-gray` | `#f0efeb` |
| `clay` | `tag-clay` | `#f0d9c0` |
| `sage` | `tag-sage` | `#e8eedf` |
| `amber` | `tag-amber` | `#f9eeda` |
| `cocoa` | `tag-cocoa` | `#e9dcd0` |

### Color Utilities

```tsx
// src/atomic-crm/tags/tag-colors.ts
import type { TagColorName } from "@/lib/color-types";
import { SEMANTIC_COLORS, VALID_TAG_COLORS } from "@/lib/color-types";

/**
 * Gets the CSS class for a tag color
 * @returns CSS class like 'tag-warm', 'tag-blue', etc.
 */
export function getTagColorClass(color: string): string {
  const semanticColor = SEMANTIC_COLORS[color as TagColorName];
  if (semanticColor) {
    return semanticColor.cssClass;
  }
  return SEMANTIC_COLORS.gray.cssClass;  // Fallback
}

/**
 * Normalizes any color value to a valid semantic color name
 * Handles legacy hex values and unknown colors
 */
export function normalizeColorToSemantic(color: string): TagColorName {
  if (VALID_TAG_COLORS.includes(color as TagColorName)) {
    return color as TagColorName;
  }
  return "gray";  // Default for invalid colors
}

/**
 * Validates if a color is a valid tag color
 */
export function validateTagColor(value: string): string | undefined {
  if (VALID_TAG_COLORS.includes(value as TagColorName)) {
    return undefined;  // Valid
  }
  return "Invalid color selection";
}

/**
 * Export the valid colors list for use in UI components
 */
export const TAG_COLORS = VALID_TAG_COLORS;
```

### Zod Validation with Color Transformation

```tsx
// src/atomic-crm/validation/tags.ts
const semanticColorSchema = z
  .string()
  .refine(
    (value) => {
      // Check if it's a valid semantic color name
      if (VALID_TAG_COLORS.includes(value as TagColorName)) return true;
      // Check if it's a legacy hex value we can map
      if (HEX_TO_SEMANTIC_MAP[value.toLowerCase()]) return true;
      return false;
    },
    { message: "Invalid color selection. Must be a valid semantic color." }
  )
  .transform((value) => {
    // Already valid? Return it
    if (VALID_TAG_COLORS.includes(value as TagColorName)) {
      return value as TagColorName;
    }
    // Map legacy hex to semantic
    return HEX_TO_SEMANTIC_MAP[value.toLowerCase()] || "gray";
  });
```

**When to use**: Always use semantic color names (`warm`, `blue`, etc.) in code. The Zod schema handles legacy hex value transformation automatically.

---

## Pattern F: Round Button (Color Picker)

For selecting colors in the TagDialog.

```tsx
// src/atomic-crm/tags/RoundButton.tsx
import { getTagColorClass, normalizeColorToSemantic } from "./tag-colors";

interface RoundButtonProps {
  color: string;
  handleClick: () => void;
  selected: boolean;
}

export const RoundButton = ({ color, handleClick, selected }: RoundButtonProps) => {
  const semanticColorName = normalizeColorToSemantic(color);
  const colorClass = getTagColorClass(color);

  return (
    <button
      type="button"
      className={`
        w-11 h-11 rounded-full inline-block m-1 transition-all
        ${colorClass}
        ${
          selected
            ? "ring-2 ring-offset-2 ring-primary shadow-md scale-110"
            : "hover:scale-105 hover:shadow-sm"
        }
      `}
      onClick={handleClick}
      aria-label={`Select ${semanticColorName} color`}
      aria-pressed={selected}
    />
  );
};
```

**When to use**: Color picker UI in TagDialog. Each button represents one of the 12 semantic colors.

**Accessibility:**
- 44px x 44px touch target (`w-11 h-11`)
- `aria-label` describes the color
- `aria-pressed` indicates selection state

---

## Pattern G: Configuration & Types

### TypeScript Interfaces

```tsx
// src/atomic-crm/tags/types.ts
import type { TagColorName } from "@/lib/color-types";

export interface Tag {
  id: string;
  name: string;
  color: TagColorName | string;  // Allow string during migration
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateTagInput {
  name: string;
  color: TagColorName;
}

export interface UpdateTagInput {
  id: string;
  name?: string;
  color?: TagColorName;
}

export interface TagWithCount extends Tag {
  count: number;
}

export interface TagSelection {
  tagId: string;
  selected: boolean;
}

export interface TagFilterOptions {
  colors?: TagColorName[];
  searchTerm?: string;
}
```

### Colors Export

```tsx
// src/atomic-crm/tags/colors.ts
import type { TagColorName } from "@/lib/color-types";
import { VALID_TAG_COLORS } from "@/lib/color-types";

export const colors: TagColorName[] = VALID_TAG_COLORS;
```

### Dual Barrel Structure

The tags module uses two barrel files to separate concerns:

- **`index.ts`** -- Type and utility exports (consumed by other modules importing tag types/helpers)
- **`index.tsx`** -- CRUD component exports (consumed by the resource registration and admin routes)

```tsx
// src/atomic-crm/tags/index.ts — Types, utilities, and reusable components
export type { Tag, CreateTagInput, UpdateTagInput, TagWithCount, TagSelection, TagFilterOptions } from "./types";
export { TAG_COLORS } from "./colors";
export { getTagColorClass, normalizeColorToSemantic, validateTagColor } from "./tag-colors";
export { RoundButton } from "./RoundButton";
export { TagChip } from "./TagChip";
export { TagCreateModal } from "./TagCreateModal";
export { TagEditModal } from "./TagEditModal";
export { TagDialog } from "./TagDialog";
```

```tsx
// src/atomic-crm/tags/index.tsx — CRUD admin components
// Architecture: TagShow intentionally omitted (tags are ultra-simple entities)

// CRUD components for admin management
export { TagList } from "./TagList";
export { TagCreate } from "./TagCreate";
export { TagEdit } from "./TagEdit";
export { TagInputs } from "./TagInputs";

// Existing tag components (shared between admin and feature modules)
export { TagSelectWithCreate } from "./TagSelectWithCreate";
export { TagChip } from "./TagChip";
export { TagDialog } from "./TagDialog";
export { RoundButton } from "./RoundButton";
```

---

## Pattern Comparison

| Aspect | Pattern A (Quick Input) | Pattern C (Select + Create) | Pattern B (Dialog) |
|--------|------------------------|---------------------------|-------------------|
| **Trigger** | No results match (emptyAction) | Footer button (always visible) | Direct open |
| **Fields** | Name only (default color) | Name + Color (full form) | Name + Color (full form) |
| **UI** | Inline in dropdown | Button opens Dialog | Modal overlay |
| **When** | Fast tagging, color doesn't matter | Deliberate creation with color choice | CRUD operations |
| **Component** | `TagQuickInput` | `TagSelectWithCreate` | `TagDialog` |
| **Creates via** | `emptyAction.onClick` | `footer` slot + TagDialog | Direct form submission |

---

## Modal Wrapper Pattern

TagCreateModal and TagEditModal follow a thin wrapper pattern:

```tsx
// src/atomic-crm/tags/TagCreateModal.tsx
import { useCreate } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import type { Tag } from "../types";
import { TagDialog } from "./TagDialog";
import { tagKeys } from "@/atomic-crm/queryKeys";

interface TagCreateModalProps {
  open: boolean;
  onClose(): void;
  onSuccess?(tag: Tag): Promise<void>;
}

export function TagCreateModal({ open, onClose, onSuccess }: TagCreateModalProps) {
  const [create] = useCreate<Tag>();
  const queryClient = useQueryClient();

  const handleCreateTag = async (data: Pick<Tag, "name" | "color">) => {
    await create(
      "tags",
      { data },
      {
        returnPromise: true,
        onSuccess: async (tag) => {
          // STALE-002: Invalidate tag caches to refresh lists after create
          await queryClient.invalidateQueries({ queryKey: tagKeys.all });
          await onSuccess?.(tag);
        },
      }
    );
  };

  return (
    <TagDialog open={open} title="Create a new tag" onClose={onClose} onSubmit={handleCreateTag} />
  );
}
```

```tsx
// src/atomic-crm/tags/TagEditModal.tsx
import { useUpdate } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import type { Tag } from "../types";
import { TagDialog } from "./TagDialog";
import { tagKeys } from "@/atomic-crm/queryKeys";

interface TagEditModalProps {
  tag: Tag;
  open: boolean;
  onClose(): void;
  onSuccess?(tag: Tag): Promise<void>;
}

export function TagEditModal({ tag, open, onClose, onSuccess }: TagEditModalProps) {
  const [update] = useUpdate<Tag>();
  const queryClient = useQueryClient();

  const handleEditTag = async (data: Pick<Tag, "name" | "color">) => {
    await update(
      "tags",
      { id: tag.id, data, previousData: tag },
      {
        returnPromise: true,
        onSuccess: async (updatedTag) => {
          // STALE-002: Invalidate tag caches to refresh lists after update
          await queryClient.invalidateQueries({ queryKey: tagKeys.all });
          await onSuccess?.(updatedTag);
        },
      }
    );
  };

  return (
    <TagDialog open={open} title="Edit tag" onClose={onClose} onSubmit={handleEditTag} tag={tag} />
  );
}
```

**When to use**: Use these wrappers instead of TagDialog directly when you need React Admin CRUD hooks (`useCreate`, `useUpdate`).

**Stale-state compliance (STALE-002):**
- Both modals use `useQueryClient` and `tagKeys.all` to invalidate caches after mutation
- `returnPromise: true` ensures the mutation completes before invalidation
- This keeps tag lists in sync across all views that display tags

---

## Pattern H: CRUD Admin Module

Full admin CRUD views for managing tags as a standalone resource (list, create, edit).

### TagList.tsx

```tsx
// src/atomic-crm/tags/TagList.tsx
import { TextField, FunctionField } from "react-admin";
import { List } from "@/components/ra-wrappers/list";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { UnifiedListPageLayout } from "@/components/layouts/UnifiedListPageLayout";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { cn } from "@/lib/utils";
import { getTagColorClass } from "./tag-colors";
import type { Tag } from "../types";

export const TagList = () => {
  return (
    <List
      title={false}
      actions={false}
      perPage={25}
      sort={{ field: "name", order: "ASC" }}
      exporter={false}
    >
      <UnifiedListPageLayout
        resource="tags"
        showFilterSidebar={false}
        sortFields={["name", "color"]}
        searchPlaceholder="Search tags..."
        primaryAction={<CreateButton variant="default" />}
      >
        <PremiumDatagrid rowClick="edit" bulkActionButtons={false}>
          <TextField source="name" label="Tag Name" />
          <FunctionField
            label="Preview"
            render={(record: Tag) => (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-1 text-xs rounded-md",
                  "border border-black/20",
                  getTagColorClass(record.color)
                )}
              >
                {record.name}
              </span>
            )}
          />
          <FunctionField
            label="Color"
            render={(record: Tag) => (
              <span className="text-muted-foreground capitalize">{record.color}</span>
            )}
          />
        </PremiumDatagrid>
      </UnifiedListPageLayout>
    </List>
  );
};
```

**Key points:**
- `UnifiedListPageLayout` provides consistent list shell with search, sort, and primary action
- `PremiumDatagrid` (CORE-016) instead of raw `Datagrid`
- `rowClick="edit"` -- users go directly to edit (no Show view for simple entities)
- Preview column renders actual tag chip appearance inline

### TagCreate.tsx

```tsx
// src/atomic-crm/tags/TagCreate.tsx
import { useMemo } from "react";
import { CreateBase, Form } from "ra-core";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { CreateFormFooter } from "@/atomic-crm/components";
import { TagInputs } from "./TagInputs";
import { createTagSchema } from "../validation/tags";
import { createFormResolver } from "@/lib/zodErrorFormatting";

export const TagCreate = () => {
  // P2: Schema-derived defaults ensure type safety
  const defaultValues = useMemo(() => createTagSchema.partial().parse({}), []);

  return (
    <CreateBase redirect="list">
      <div className="bg-muted px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <SectionCard title="Create Tag">
            <Form
              defaultValues={defaultValues}
              mode="onBlur"
              resolver={createFormResolver(createTagSchema)}
            >
              <TagInputs />
              <CreateFormFooter resourceName="tag" redirectPath="/tags" />
            </Form>
          </SectionCard>
        </div>
      </div>
    </CreateBase>
  );
};
```

### TagEdit.tsx

```tsx
// src/atomic-crm/tags/TagEdit.tsx
import { useMemo } from "react";
import { EditBase, Form, useEditContext } from "ra-core";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { FormToolbar } from "../layout/FormToolbar";
import { TagInputs } from "./TagInputs";
import { tagSchema } from "../validation/tags";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import type { Tag } from "../types";

export const TagEdit = () => {
  return (
    <EditBase redirect="list" mutationMode="pessimistic">
      <TagEditContent />
    </EditBase>
  );
};

const TagEditContent = () => {
  const { isPending, record } = useEditContext<Tag>();

  // P2: Schema-derived defaults with existing record data
  // Use passthrough() to allow extra DB fields (description, usage_count, created_at)
  const defaultValues = useMemo(
    () =>
      tagSchema
        .partial()
        .passthrough()
        .parse(record ?? {}),
    [record]
  );

  if (isPending || !record) {
    return null;
  }

  return (
    <div className="bg-muted px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <SectionCard title="Edit Tag">
          <Form
            defaultValues={defaultValues}
            mode="onBlur"
            resolver={createFormResolver(tagSchema)}
          >
            <TagInputs />
            <FormToolbar />
          </Form>
        </SectionCard>
      </div>
    </div>
  );
};
```

### TagInputs.tsx (Shared Form Inputs)

```tsx
// src/atomic-crm/tags/TagInputs.tsx
import { useFormContext, useWatch } from "react-hook-form";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { Label } from "@/components/ui/label";
import { colors } from "./colors";
import { RoundButton } from "./RoundButton";
import type { TagColorName } from "@/lib/color-types";

export const TagInputs = () => {
  const { setValue } = useFormContext();
  // P5: useWatch for isolated re-renders
  const selectedColor = useWatch({ name: "color" }) as TagColorName;

  return (
    <div className="flex flex-col gap-6">
      <TextInput
        source="name"
        label="Tag Name"
        fullWidth
        helperText="Enter a unique name for this tag (max 50 characters)"
      />

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tag color">
          {colors.map((color) => (
            <div key={color} className="relative group">
              <RoundButton
                color={color}
                selected={color === selectedColor}
                handleClick={() => {
                  setValue("color", color, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap capitalize">
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**When to use**: Shared between `TagCreate` and `TagEdit` to avoid input duplication (MOD-006).

### resource.tsx (Lazy Loading Resource Config)

```tsx
// src/atomic-crm/tags/resource.tsx
import * as React from "react";
import type { Tag } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";
import { Loading } from "@/components/ra-wrappers/loading";

const TagListLazy = React.lazy(() => import("./TagList"));
const TagEditLazy = React.lazy(() => import("./TagEdit"));
const TagCreateLazy = React.lazy(() => import("./TagCreate"));

export const TagListView = () => (
  <ResourceErrorBoundary resource="tags" page="list">
    <React.Suspense fallback={<Loading />}>
      <TagListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const TagEditView = () => (
  <ResourceErrorBoundary resource="tags" page="edit">
    <React.Suspense fallback={<Loading />}>
      <TagEditLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const TagCreateView = () => (
  <ResourceErrorBoundary resource="tags" page="create">
    <React.Suspense fallback={<Loading />}>
      <TagCreateLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

const tagRecordRepresentation = (record: Tag) => record?.name || `Tag #${record?.id}`;

export default {
  list: TagListView,
  edit: TagEditView,
  create: TagCreateView,
  recordRepresentation: tagRecordRepresentation,
};
```

**Key points:**
- `React.lazy()` for code-split loading of each CRUD view
- `ResourceErrorBoundary` wraps each view for resource-specific error handling
- `recordRepresentation` provides human-readable tag names in RA references
- TagShow intentionally omitted -- tags are ultra-simple entities (id, name, color) with no relationships

---

## Anti-Patterns

### Color Handling

| Don't | Do |
|-------|-----|
| `color: "#eddcd2"` | `color: "warm"` |
| `style={{ backgroundColor: tag.color }}` | `className={getTagColorClass(tag.color)}` |
| `if (color === "#fff1e6")` | `if (color === "yellow")` |

**Why**: Semantic color names enable theme switching and are validated by Zod.

### Form Performance

| Don't | Do |
|-------|-----|
| `mode: "onChange"` | `mode: "onSubmit"` or `mode: "onBlur"` |
| `watch("field")` in render | `useWatch({ name: "field" })` |

**Why**: `onChange` causes re-render storms on every keystroke.

### Touch Targets

| Don't | Do |
|-------|-----|
| `className="w-6 h-6"` | `className="w-11 h-11"` (44px) |
| Small click areas | Negative margins for visual density |

**Why**: WCAG 2.5.5 requires 44x44px minimum touch targets.

### Orphaned Tags

| Don't | Do |
|-------|-----|
| Create tags in isolation | Use TagQuickInput or TagSelectWithCreate |
| Manual API calls for tag creation | Use React Admin hooks (useCreate, useUpdate) |

**Why**: Inline creation ensures tags are immediately linked to entities.

### Validation

| Don't | Do |
|-------|-----|
| Validate colors in components | Use Zod schema at API boundary |
| `if (!VALID_COLORS.includes(color))` | Let `semanticColorSchema` handle it |

**Why**: Single point of validation (P3) at API boundary.

### Resolver Usage (CORE-018)

| Don't | Do |
|-------|-----|
| `resolver: zodResolver(schema)` | `resolver: createFormResolver(schema)` |
| `import { zodResolver } from "@hookform/resolvers/zod"` | `import { createFormResolver } from "@/lib/zodErrorFormatting"` |

**Why**: `createFormResolver` wraps `zodResolver` with standardized error formatting. Direct `zodResolver` usage bypasses error normalization and violates CORE-018.

---

## Migration Checklist

When extending or modifying tag functionality:

- [ ] Use semantic color names (not hex values)
- [ ] Import types from `./types.ts` (not defining inline)
- [ ] Use `getTagColorClass()` for CSS classes
- [ ] Use `normalizeColorToSemantic()` for unknown colors
- [ ] Follow the Dialog → Modal wrapper pattern for CRUD
- [ ] Maintain 44px touch targets (w-11 h-11)
- [ ] Use `FormErrorSummary` for accessible errors
- [ ] Use `mode: "onSubmit"` for forms
- [ ] Add `aria-label` to interactive elements
- [ ] Use `refresh()` after create/update in ReferenceInput contexts
- [ ] Export new components via `index.ts` barrel file
- [ ] Use `createFormResolver()` (not `zodResolver`) for form resolvers
- [ ] Invalidate `tagKeys.all` after mutations in modal wrappers

---

## File Reference

| File | Purpose | Pattern |
|------|---------|---------|
| `TagDialog.tsx` | Base form modal for create/edit tags | Pattern B |
| `TagCreateModal.tsx` | Thin create wrapper with `useCreate` + cache invalidation | Modal Wrapper |
| `TagEditModal.tsx` | Thin edit wrapper with `useUpdate` + cache invalidation | Modal Wrapper |
| `TagChip.tsx` | Display tag with color, edit trigger, and remove action | Pattern D |
| `TagQuickInput.tsx` | Simple inline creation via `emptyAction` | Pattern A |
| `TagSelectWithCreate.tsx` | Select with footer creation button + dialog | Pattern C |
| `TagList.tsx` | Admin list view with `UnifiedListPageLayout` + `PremiumDatagrid` | Pattern H (CRUD) |
| `TagCreate.tsx` | Admin create form with `SectionCard` + `CreateFormFooter` | Pattern H (CRUD) |
| `TagEdit.tsx` | Admin edit form with `SectionCard` + `FormToolbar` | Pattern H (CRUD) |
| `TagInputs.tsx` | Shared form inputs (name + color picker) for admin CRUD | Pattern H (CRUD) |
| `resource.tsx` | Lazy-loaded resource config with error boundaries | Pattern H (CRUD) |
| `RoundButton.tsx` | Color picker button (44px touch target) | Pattern F |
| `tag-colors.ts` | Color utilities: `getTagColorClass`, `normalizeColorToSemantic`, `TAG_COLORS` | Pattern E |
| `colors.ts` | Color name array export for pickers | Pattern G (Config) |
| `types.ts` | TypeScript interfaces for tag entities | Pattern G (Config) |
| `index.ts` | Barrel exports: types, utilities, reusable components | Dual Barrel |
| `index.tsx` | Barrel exports: CRUD admin components | Dual Barrel |
