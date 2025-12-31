# ADR-034: Sonner Toast Notifications Integration

## Status

**Accepted**

## Date

Original: 2024-11 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

React Admin provides a built-in notification system via `useNotify()` that displays snackbar-style messages. However, this default implementation has limitations:

1. **No Theme Integration**: Default notifications don't respect the application's dark/light mode theme
2. **Limited Styling**: Hard to customize to match Tailwind v4 semantic colors
3. **Basic UX**: Missing rich features like descriptions, icons, and smooth animations
4. **Accessibility Gaps**: Limited ARIA support out of the box

### Requirements

- Preserve React Admin's notification API (`useNotify()`)
- Support undoable mutations (e.g., "Record deleted - Undo")
- Automatically sync with next-themes dark/light mode
- Match design system aesthetics
- Maintain accessibility standards

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **React Admin default** | Zero setup | No theme sync, basic styling |
| **Custom notification from scratch** | Full control | High effort, reinvent wheel |
| **react-hot-toast** | Popular, simple API | Less feature-rich, no undo pattern |
| **Sonner** | Beautiful, rich features, theme support | New dependency |

---

## Decision

**Replace React Admin's notification with Sonner**, bridging via `useNotificationContext()` from ra-core.

### Architecture

```
React Admin useNotify()
        ↓
useNotificationContext() (ra-core queue)
        ↓
<Notification /> component (bridge)
        ↓
Sonner toast API
        ↓
<Toaster /> renders toasts
```

### Key Integration Points

1. **`useNotificationContext()`** - Subscribes to React Admin's notification queue
2. **`useTakeUndoableMutation()`** - Manages undo/commit for optimistic updates
3. **`useTheme()`** from next-themes - Synchronizes toast appearance with app theme
4. **`CloseNotificationContext`** - Provides dismiss API for programmatic control

### Implementation

```typescript
// src/components/admin/notification.tsx

import * as React from "react";
import { useCallback, useEffect } from "react";
import { Toaster, type ToasterProps, toast } from "sonner";
import { useTheme } from "next-themes";
import {
  CloseNotificationContext,
  useNotificationContext,
  useTakeUndoableMutation,
  useTranslate,
} from "ra-core";

export const Notification = (props: ToasterProps) => {
  const translate = useTranslate();
  const { notifications, takeNotification } = useNotificationContext();
  const takeMutation = useTakeUndoableMutation();
  const { theme } = useTheme();

  useEffect(() => {
    if (notifications.length) {
      const notification = takeNotification();
      if (notification) {
        const { message, type = "info", notificationOptions } = notification;
        const { messageArgs, undoable } = notificationOptions || {};

        // Prevent accidental navigation during undoable operations
        const beforeunload = (e: BeforeUnloadEvent) => {
          e.preventDefault();
          e.returnValue = "";
          return "";
        };

        if (undoable) {
          window.addEventListener("beforeunload", beforeunload);
        }

        const handleExited = () => {
          if (undoable) {
            const mutation = takeMutation();
            if (mutation) {
              mutation({ isUndo: false }); // Commit the mutation
            }
            window.removeEventListener("beforeunload", beforeunload);
          }
        };

        const handleUndo = () => {
          const mutation = takeMutation();
          if (mutation) {
            mutation({ isUndo: true }); // Revert the mutation
          }
          window.removeEventListener("beforeunload", beforeunload);
        };

        // Translate message if it's a string key
        const finalMessage = message
          ? typeof message === "string"
            ? translate(message, messageArgs)
            : React.isValidElement(message)
              ? message
              : undefined
          : undefined;

        // Display toast with appropriate type
        toast[type](finalMessage, {
          action: undoable
            ? {
                label: translate("ra.action.undo"),
                onClick: handleUndo,
              }
            : undefined,
          onDismiss: handleExited,
          onAutoClose: handleExited,
        });
      }
    }
  }, [notifications, takeMutation, takeNotification, translate]);

  const handleRequestClose = useCallback(() => {
    toast.dismiss();
  }, []);

  return (
    <CloseNotificationContext.Provider value={handleRequestClose}>
      <Toaster
        richColors
        theme={theme}
        closeButton
        position="bottom-center"
        containerAriaLabel="Notifications"
        toastOptions={{ closeButtonAriaLabel: "Close notification" }}
        {...props}
      />
    </CloseNotificationContext.Provider>
  );
};
```

---

## Consequences

### Positive

- **Theme Synchronization**: Toasts automatically match dark/light mode via `theme` prop
- **Rich UX**: Sonner provides smooth animations, icons, and rich colors
- **Undo Preserved**: Undoable mutations work seamlessly with action buttons
- **Navigation Safety**: `beforeunload` prevents accidental data loss during undo window
- **Accessible**: ARIA labels on container and close buttons
- **React Admin Compatible**: Existing `useNotify()` calls continue working

### Negative

- **Additional Dependency**: Sonner adds ~7KB to bundle (gzipped)
- **Dual APIs**: Can use either `useNotify()` or direct `toast()` calls (see patterns below)
- **Learning Curve**: Team must understand both React Admin and Sonner APIs

### Neutral

- **Trade-off Accepted**: Rich UX and theme integration justify the dependency

---

## Code Examples

### Toaster Configuration

```typescript
// In Notification component
<Toaster
  richColors              // Semantic colors for success/error/warning/info
  theme={theme}           // "light" | "dark" | "system" from next-themes
  closeButton             // Show X button on all toasts
  position="bottom-center"// Centered at bottom of viewport
  containerAriaLabel="Notifications"
  toastOptions={{
    closeButtonAriaLabel: "Close notification"
  }}
/>
```

### Usage Pattern 1: React Admin Integration

```typescript
// Standard React Admin usage - flows through Notification component
import { useNotify } from "react-admin";

function MyComponent() {
  const notify = useNotify();

  const handleSave = () => {
    // This creates a notification that Notification component picks up
    notify("Record saved successfully", { type: "success" });
  };

  const handleDelete = () => {
    // Undoable notification with undo button
    notify("Record deleted", { type: "info", undoable: true });
  };
}
```

### Usage Pattern 2: Direct Sonner API

```typescript
// Direct Sonner usage for custom scenarios
// src/atomic-crm/dashboard/v3/utils/showFollowUpToast.tsx

import { toast } from "sonner";

export function showFollowUpToast({ task, onCreateFollowUp }) {
  toast.success(`Task completed: ${task.subject}`, {
    description: "Would you like to schedule a follow-up?",
    duration: 5000,
    action: {
      label: "Create Follow-up",
      onClick: () => onCreateFollowUp(task),
    },
  });
}
```

### Undoable Mutation Flow

```
1. User clicks "Delete"
2. useNotify("Record deleted", { undoable: true })
3. Notification component:
   - Shows toast with "Undo" button
   - Adds beforeunload listener (prevents accidental navigation)
   - Stores mutation callback via useTakeUndoableMutation()
4. If user clicks "Undo":
   - mutation({ isUndo: true }) called
   - Record restored
   - beforeunload removed
5. If toast auto-closes/dismissed:
   - mutation({ isUndo: false }) called
   - Deletion committed
   - beforeunload removed
```

### Theme Integration

```typescript
// Theme syncs automatically via next-themes
import { useTheme } from "next-themes";

const { theme } = useTheme();  // "light" | "dark" | "system"

// Passed directly to Sonner
<Toaster theme={theme} />

// Sonner renders:
// - Light mode: white background, dark text
// - Dark mode: dark background, light text
// - System: follows OS preference
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Creating custom notification without Sonner bridge
function MyNotification() {
  const { notifications } = useNotificationContext();
  // Custom toast implementation that doesn't handle undoable
  // NEVER: Loses undo functionality
}

// WRONG: Using toast.dismiss() without CloseNotificationContext
function MyComponent() {
  return <Toaster />;  // NEVER: No way for React Admin to dismiss toasts
}

// WRONG: Hardcoding theme
<Toaster theme="dark" />  // NEVER: Doesn't respect user preference
```

---

## Related ADRs

- **[ADR-006: Tailwind Semantic Colors](./ADR-006-tailwind-semantic-colors.md)** - Sonner's `richColors` aligns with semantic color system

---

## References

- Notification component: `src/components/admin/notification.tsx`
- Follow-up toast utility: `src/atomic-crm/dashboard/v3/utils/showFollowUpToast.tsx`
- Shadcn Sonner wrapper: `src/components/ui/sonner.tsx`
- Sonner documentation: https://sonner.emilkowal.ski/
- next-themes: https://github.com/pacocoursey/next-themes
