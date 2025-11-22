# Atomic Learning Model – Atomic CRM

This folder is your **learning map** for the Atomic CRM codebase. Instead of trying to understand everything at once, study the code in layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        PAGES                                 │
│   PrincipalDashboardV3, CRM.tsx, Resource pages              │
├─────────────────────────────────────────────────────────────┤
│                       ORGANISMS                              │
│   PrincipalPipelineTable, TasksPanel, QuickLoggerPanel       │
├─────────────────────────────────────────────────────────────┤
│                       MOLECULES                              │
│   TaskGroup, TaskItemComponent, PriorityIndicator            │
├─────────────────────────────────────────────────────────────┤
│                         ATOMS                                │
│   Button, Badge, Card, Input, Checkbox, Table, etc.          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

| Want to learn about... | Start here |
|------------------------|------------|
| UI building blocks | `01-atoms-notes.md` |
| Combined components | `02-molecules-notes.md` |
| Dashboard panels | `03-organisms-notes.md` |
| Page composition | `04-pages-notes.md` |
| User workflows | `05-flows-notes.md` |
| Full inventory | `00-inventory-checklist.md` |

## The Atomic Model

| Level | Description | Example |
|-------|-------------|---------|
| **Atoms** | Smallest UI pieces, minimal logic | `Button`, `Badge`, `Input` |
| **Molecules** | 2-5 atoms combined | `TaskGroup`, `TaskItemComponent` |
| **Organisms** | Self-contained sections with data fetching | `TasksPanel`, `PrincipalPipelineTable` |
| **Pages** | Full screens from organisms | `PrincipalDashboardV3`, `CRM.tsx` |
| **Flows** | Multi-step user journeys | Login → Dashboard → Log Activity |

## Key Locations

| What | Where |
|------|-------|
| Atoms (shadcn/ui) | `src/components/ui/` |
| Dashboard organisms | `src/atomic-crm/dashboard/v3/components/` |
| Dashboard page | `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` |
| Root component | `src/atomic-crm/root/CRM.tsx` |
| Data hooks | `src/atomic-crm/dashboard/v3/hooks/` |
| Validation schemas | `src/atomic-crm/validation/` |

## Files in This Folder

| File | Purpose |
|------|---------|
| `00-inventory-checklist.md` | Complete file inventory mapped to atomic levels |
| `01-atoms-notes.md` | Deep dive into Button, Badge, Card, Input, etc. |
| `02-molecules-notes.md` | TaskGroup, TaskItemComponent, loading patterns |
| `03-organisms-notes.md` | TasksPanel, PrincipalPipelineTable, QuickLogForm |
| `04-pages-notes.md` | CRM.tsx, PrincipalDashboardV3, routing |
| `05-flows-notes.md` | Login, activity logging, task completion flows |

## Key Patterns to Understand

### 1. Variant Constants Pattern
```typescript
// Variants extracted to .constants.ts for Fast Refresh
import { buttonVariants } from "./button.constants";
```

### 2. Zod Form Defaults Pattern
```typescript
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: schema.partial().parse({}),  // Zod generates defaults!
});
```

### 3. Three-State Rendering Pattern
```typescript
if (loading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

### 4. Flex Column Layout Pattern
```tsx
<div className="flex h-full flex-col">
  <header className="border-b">Fixed header</header>
  <div className="flex-1 overflow-auto">Scrollable content</div>
</div>
```

## Suggested Learning Path

1. **Start with Atoms** – Understand `Button`, `Badge`, `Card` from `src/components/ui/`
2. **See them combined** – Study `TaskGroup` and `TaskItemComponent`
3. **Trace data flow** – Follow `TasksPanel` from hook → filter → render
4. **Understand composition** – See how `PrincipalDashboardV3` arranges organisms
5. **Follow a flow** – Walk through Login → Dashboard → Log Activity

## Tech Stack Reference

- **React 19** + Vite
- **shadcn/ui** (Radix UI + Tailwind)
- **Tailwind CSS v4** with semantic color variables
- **React Admin** for resource CRUD
- **Supabase** for database + auth
- **Zod** for validation
- **react-hook-form** for forms

---

*This learning system helps you understand the codebase layer by layer, rather than trying to absorb everything at once.*
