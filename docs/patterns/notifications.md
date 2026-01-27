# Toast Notification Patterns

## Standard Messages

Use `notificationMessages` from `@/atomic-crm/constants/notificationMessages`:

```typescript
import { notificationMessages } from '@/atomic-crm/constants/notificationMessages';
import { useNotify } from 'react-admin';

const notify = useNotify();

// Single operations
notify(notificationMessages.created('Contact'), { type: 'success' });
notify(notificationMessages.updated('Task'), { type: 'success' });
notify(notificationMessages.deleted('Organization'), { undoable: true });
notify(notificationMessages.archived('Opportunity'), { type: 'info' });
notify(notificationMessages.restored('Contact'), { type: 'success' });

// Bulk operations (handles pluralization automatically)
notify(notificationMessages.bulkDeleted(5, 'organization'), {
  type: 'success',
  undoable: true
});

notify(notificationMessages.bulkUpdated(3, 'contact'), {
  type: 'success'
});

notify(notificationMessages.bulkArchived(2, 'opportunity'), {
  type: 'info'
});
```

## Message Pattern

**Format:** `[Entity] [action]`

- ✅ "Contact created"
- ✅ "3 organizations deleted"
- ✅ "Task updated"

**NOT:**
- ❌ "Contact created successfully" (verbose)
- ❌ "Successfully created contact" (passive voice)
- ❌ "Contact was created" (past continuous)

**Why this pattern?**
- **Brevity:** Users scan toasts quickly - 3 words is optimal
- **Jakob's Law:** Matches patterns in Gmail, Notion, Linear, etc.
- **Active voice:** Direct and clear
- **Consistency:** Every success message follows same structure

## DO NOT Use

### ❌ i18n Keys
```typescript
// WRONG - displays raw key to users
notify(`resources.contacts.notifications.deleted`, {
  messageArgs: { smart_count: 3 }
});
```

### ❌ Inconsistent Wording
```typescript
// WRONG - different patterns for same operation
notify("Successfully created contact");
notify("Contact was created successfully");
notify("New contact added");
```

### ❌ Hardcoded Strings
```typescript
// WRONG - when template exists, use it
notify("Contact created", { type: "success" });

// RIGHT
notify(notificationMessages.created('Contact'), { type: 'success' });
```

## Custom Messages

For operations not covered by templates, use clear, concise English:

```typescript
// Complex operations
notify("3 contacts exported to CSV", { type: "success" });
notify("Email sent to 12 distributors", { type: "info" });
notify("Cannot delete - has 5 active opportunities", { type: "warning" });

// Multi-step operations
notify("Organization created, but parent link failed", { type: "warning" });
notify("Task created, but couldn't update contact last_seen", { type: "warning" });
```

## Error Messages

Use `useSafeNotify()` for error handling (already implemented).

```typescript
import { useSafeNotify } from '@/atomic-crm/utils/useSafeNotify';

const notify = useSafeNotify();

// Will automatically format error messages
notify(error, { type: 'error' });
```

## Pluralization

The `notificationMessages` helper handles pluralization automatically:

```typescript
notificationMessages.bulkDeleted(1, 'contact');    // "1 contact deleted"
notificationMessages.bulkDeleted(3, 'contact');    // "3 contacts deleted"
notificationMessages.bulkDeleted(5, 'opportunity'); // "5 opportunities deleted"
notificationMessages.bulkDeleted(2, 'organization'); // "2 organizations deleted"
```

**Supported patterns:**
- Default: add 's' (contact → contacts)
- -y endings: replace with 'ies' (opportunity → opportunities)

## React Admin Integration

### Undoable Mutations

For delete operations, enable undo:

```typescript
notify(notificationMessages.deleted('Contact'), {
  type: 'success',
  undoable: true  // Shows undo button for 5 seconds
});
```

### Mutation Callbacks

```typescript
const [deleteMany] = useDeleteMany();

deleteMany(
  'contacts',
  { ids: selectedIds },
  {
    mutationMode: 'undoable',
    onSuccess: () => {
      notify(notificationMessages.bulkDeleted(selectedIds.length, 'contact'), {
        type: 'success',
        undoable: true
      });
    }
  }
);
```

## Migration Guide

### Before
```typescript
// Old pattern with i18n keys
notify(`resources.${resource}.notifications.deleted`, {
  messageArgs: {
    smart_count: selectedIds.length,
    _: translate("ra.notification.deleted", {
      smart_count: selectedIds.length,
      _: `${selectedIds.length} elements deleted`,
    }),
  },
  undoable: true,
});
```

### After
```typescript
// New pattern with standard messages
import { notificationMessages } from '@/atomic-crm/constants/notificationMessages';

const entityName = resource.slice(0, -1); // "contacts" -> "contact"
notify(notificationMessages.bulkDeleted(selectedIds.length, entityName), {
  type: 'success',
  undoable: true,
});
```

## UX Principles Applied

### Jakob's Law
Users expect familiar patterns. "Contact deleted" matches Gmail, Notion, and other modern apps.

### Peak-End Rule
Success toasts provide positive closure to user actions. Keep them brief and positive.

### Doherty Threshold
Toasts appear immediately (<100ms) to maintain flow state. Don't make users wait for confirmation.

### Miller's Law
Messages are 2-4 words to reduce cognitive load. Users don't need to "read" toasts - they scan them.

## Testing

Manual test scenarios:

1. **Single Delete:**
   - Delete 1 contact → "Contact deleted"

2. **Bulk Delete:**
   - Select 3 organizations, bulk delete → "3 organizations deleted"

3. **Create:**
   - Create new task → "Task created"

4. **Update:**
   - Edit opportunity, save → "Opportunity updated"

5. **Edge Cases:**
   - Bulk delete 1 item → "1 contact deleted" (singular)
   - Bulk delete 5 items → "5 contacts deleted" (plural)
