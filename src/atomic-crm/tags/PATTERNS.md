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
import { useState } from 'react';
import { ReferenceInput, useCreate, useRefresh } from 'react-admin';
import { useSafeNotify } from '@/atomic-crm/hooks/useSafeNotify';  // Preferred over useNotify
import { GenericSelectInput } from '@/components/ra-wrappers/generic-select-input';

interface TagQuickInputProps {
  source: string;
  label?: string;
}

export function TagQuickInput({ source, label }: TagQuickInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [create, { isLoading: isCreating }] = useCreate();
  const { success, error: notifyError } = useSafeNotify();  // Sanitizes error messages
  const refresh = useRefresh();

  const handleQuickCreate = async (name: string) => {
    if (!name.trim()) return;

    await create(
      'tags',
      { data: { name: name.trim(), color: 'warm' } },  // Default color
      {
        onSuccess: () => {
          success('Tag created');  // useSafeNotify helper
          refresh();  // Triggers ReferenceInput to refetch
        },
        onError: (err) => {
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
import { useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { createTagSchema, type CreateTagInput } from "../validation/tags";
import { colors } from "./colors";
import { RoundButton } from "./RoundButton";
import type { Tag } from "../types";
import type { TagColorName } from "@/lib/color-types";

interface TagDialogProps {
  open: boolean;
  tag?: Pick<Tag, "name" | "color">;
  title: string;
  onSubmit(tag: Pick<Tag, "name" | "color">): Promise<void>;
  onClose(): void;
}

export function TagDialog({ open, tag, title, onClose, onSubmit }: TagDialogProps) {
  // P2: Schema-derived defaults - NOT local useState
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = form;
  const selectedColor = watch("color") as TagColorName;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({ name: tag?.name ?? "", color: (tag?.color as TagColorName) ?? "warm" });
    }
  }, [open, tag, reset]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(async (data) => { await onSubmit(data); onClose(); })}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* P3: FormErrorSummary for accessible error aggregation */}
              <FormErrorSummary errors={errors} fieldLabels={{ name: "Tag Name", color: "Color" }} />

              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag name</Label>
                <Input
                  id="tag-name"
                  {...register("name")}
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
                    <RoundButton
                      key={color}
                      color={color}
                      selected={color === selectedColor}
                      handleClick={() => setValue("color", color, { shouldValidate: true })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>Save</Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
```

**When to use**: Tag creation or editing where the user needs to choose both name AND color. Used by TagCreateModal and TagEditModal.

**Constitution compliance:**
- **P2**: Schema defaults via `createTagSchema.partial().parse({})`
- **P3**: FormErrorSummary for accessible error aggregation
- **P5**: Form mode `onSubmit` (not `onChange`) for performance

---

## Pattern C: Tag Selection with Creation (Footer + Dialog)

For tag selection with the option to create new tags with full control.

```tsx
// src/atomic-crm/tags/TagSelectWithCreate.tsx
import { useState } from 'react';
import { ReferenceInput, useCreate, useRefresh } from 'react-admin';
import { useSafeNotify } from '@/atomic-crm/hooks/useSafeNotify';
import { GenericSelectInput } from '@/components/ra-wrappers/generic-select-input';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { TagDialog } from './TagDialog';
import type { Tag } from '../types';

interface TagSelectWithCreateProps {
  source: string;
  label?: string;
}

export function TagSelectWithCreate({ source, label }: TagSelectWithCreateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultName, setDefaultName] = useState('');
  const [create] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleCreateTag = async (data: Pick<Tag, 'name' | 'color'>) => {
    await create(
      'tags',
      { data },
      {
        onSuccess: () => {
          notify('Tag created', { type: 'success' });
          setDialogOpen(false);
          refresh();
        },
        onError: (error) => {
          notify(`Error: ${error.message}`, { type: 'error' });
        },
      }
    );
  };

  // Footer stays visible even when filtering
  const footer = (
    <Button
      type="button"
      variant="ghost"
      className="h-11 w-full justify-start text-sm"
      onClick={() => setDialogOpen(true)}
    >
      <PlusIcon className="mr-2 h-4 w-4" />
      Create new tag
    </Button>
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
        tag={{ name: defaultName, color: 'warm' }}  // Pre-fill from search
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
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag } from "../types";
import { TagEditModal } from "./TagEditModal";
import { getTagColorClass } from "./tag-colors";

interface TagChipProps {
  tag: Tag;
  onUnlink: () => Promise<void>;
}

export function TagChip({ tag, onUnlink }: TagChipProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer",
          "border border-[var(--tag-border)]",
          "transition-all duration-200",
          "hover:shadow-sm hover:scale-[1.02]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          getTagColorClass(tag.color)  // Returns 'tag-warm', 'tag-blue', etc.
        )}
        onClick={() => setOpen(true)}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {tag.name}
        {/* Remove button with 44px touch target (WCAG 2.5.5) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnlink();
          }}
          className="relative -my-2 -mr-1 ml-0.5 h-11 w-11 flex items-center justify-center"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <TagEditModal tag={tag} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

**When to use**: Displaying assigned tags on entities (contacts, opportunities). Click to edit, X to unlink.

**Accessibility:**
- `tabIndex={0}` and `role="button"` for keyboard navigation
- `aria-label` on remove button
- 44px touch target (WCAG 2.5.5) using negative margins for visual density

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

### Barrel Exports

```tsx
// src/atomic-crm/tags/index.ts
export type { Tag, CreateTagInput, UpdateTagInput, TagWithCount, TagSelection, TagFilterOptions } from "./types";
export { TAG_COLORS } from "./colors";
export { getTagColorClass, normalizeColorToSemantic, validateTagColor } from "./tag-colors";
export { RoundButton } from "./RoundButton";
export { TagChip } from "./TagChip";
export { TagCreateModal } from "./TagCreateModal";
export { TagEditModal } from "./TagEditModal";
export { TagDialog } from "./TagDialog";
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
import type { Tag } from "../types";
import { TagDialog } from "./TagDialog";

interface TagCreateModalProps {
  open: boolean;
  onClose(): void;
  onSuccess?(tag: Tag): Promise<void>;
}

export function TagCreateModal({ open, onClose, onSuccess }: TagCreateModalProps) {
  const [create] = useCreate<Tag>();

  const handleCreateTag = async (data: Pick<Tag, "name" | "color">) => {
    await create("tags", { data }, {
      onSuccess: async (tag) => { await onSuccess?.(tag); },
    });
  };

  return (
    <TagDialog open={open} title="Create a new tag" onClose={onClose} onSubmit={handleCreateTag} />
  );
}
```

```tsx
// src/atomic-crm/tags/TagEditModal.tsx
import { useUpdate } from "ra-core";
import type { Tag } from "../types";
import { TagDialog } from "./TagDialog";

interface TagEditModalProps {
  tag: Tag;
  open: boolean;
  onClose(): void;
  onSuccess?(tag: Tag): Promise<void>;
}

export function TagEditModal({ tag, open, onClose, onSuccess }: TagEditModalProps) {
  const [update] = useUpdate<Tag>();

  const handleEditTag = async (data: Pick<Tag, "name" | "color">) => {
    await update("tags", { id: tag.id, data, previousData: tag }, {
      onSuccess: async (tag) => { await onSuccess?.(tag); },
    });
  };

  return (
    <TagDialog open={open} title="Edit tag" onClose={onClose} onSubmit={handleEditTag} tag={tag} />
  );
}
```

**When to use**: Use these wrappers instead of TagDialog directly when you need React Admin CRUD hooks (`useCreate`, `useUpdate`).

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
