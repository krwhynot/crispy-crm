# TypeScript Patterns

## Purpose

Document TypeScript patterns for Atomic CRM including interface vs type usage, Zod schema inference, generic patterns, utility types, discriminated unions, and type guards that ensure type safety, autocomplete support, and catch errors at compile time rather than runtime.

## Core Principle: Type Safety Without Friction

TypeScript should **enhance** developer experience, not hinder it. Use types to catch bugs early, provide excellent autocomplete, and document code behavior—but avoid over-engineering with complex type gymnastics that obscure intent.

**Golden Rules:**
1. **Prefer `interface` over `type`** for object shapes (extendable, better error messages)
2. **Infer types from Zod schemas** (centralized validation + type inference)
3. **Use generics sparingly** (only when type varies based on input)
4. **Leverage utility types** (Pick, Omit, Partial avoid duplication)
5. **Type database schemas** with generated types from Supabase

## Interface vs Type

Use `interface` for object shapes that may be extended. Use `type` for unions, primitives, tuples, or complex intersections.

### Pattern 1: Interface for Object Shapes

**From `src/atomic-crm/types.ts`:**

```typescript
// ✅ GOOD: Interface for extendable object
export interface Sale extends Pick<RaRecord, "id"> {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;
  email: string;
}

// ✅ GOOD: Interface extension for hierarchy
export interface OrganizationWithHierarchy extends Organization {
  child_branch_count?: number;
  parent_organization_name?: string;
  total_contacts_across_branches?: number;
  total_opportunities_across_branches?: number;
}

// ✅ GOOD: Interface for component props
export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  subtitle?: string;
}
```

**Why interfaces:**
- Can be extended with `extends`
- Better error messages (shows full type definition)
- Allows declaration merging (useful for module augmentation)
- Preferred by React Admin for record types

### Pattern 2: Type for Unions and Primitives

**From `src/atomic-crm/types.ts`:**

```typescript
// ✅ GOOD: Type for union of strings
export type OrganizationType = "customer" | "prospect" | "principal" | "distributor" | "unknown";

// ✅ GOOD: Type for database enum
type InteractionType = Database["public"]["Enums"]["interaction_type"];

// ✅ GOOD: Type for priority levels
export type OrganizationPriority = "A" | "B" | "C" | "D";

// ✅ GOOD: Type alias for complex type
export type Company = Organization;
```

**Why types:**
- Unions can't be expressed with interfaces
- Type aliases create semantic names for complex types
- Database enums are extracted via type indexing

### Summary Table

| Use Case | Use | Example |
|----------|-----|---------|
| Object shape | `interface` | `interface User { name: string }` |
| Extendable object | `interface` | `interface Admin extends User { }` |
| Union of strings | `type` | `type Status = "active" \| "inactive"` |
| Union of types | `type` | `type Result = Success \| Error` |
| Type alias | `type` | `type ID = string \| number` |
| Tuple | `type` | `type Coords = [number, number]` |
| Complex intersection | `type` | `type Combined = A & B & C` |

## Zod Schema Inference

Zod schemas serve as the **centralized source** for both validation and TypeScript types. Define schema once, infer type automatically.

### Pattern 1: Basic Schema with Type Inference

**From `src/atomic-crm/validation/opportunities.ts`:**

```typescript
import { z } from "zod";

// Define Zod schemas for enums
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "awaiting_response",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);

export const opportunityPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

// Define object schema
const opportunityBaseSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "Opportunity name is required"),
  description: z.string().optional().nullable(),
  estimated_close_date: z
    .string()
    .min(1, "Expected closing date is required")
    .default(() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split("T")[0];
    }),
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  customer_organization_id: z.union([z.string(), z.number()]),
  principal_organization_id: z.union([z.string(), z.number()]),
  contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

// Export schema for validation
export const opportunitySchema = opportunityBaseSchema;

// Infer TypeScript type from schema
export type Opportunity = z.infer<typeof opportunitySchema>;

// Infer enum type
export type OpportunityStage = z.infer<typeof opportunityStageSchema>;
export type OpportunityPriority = z.infer<typeof opportunityPrioritySchema>;
```

**Why this works:**
- Schema defines validation rules AND type shape
- Type automatically updates when schema changes
- No duplication between validation and type definitions
- Form defaults come from schema (`.default()`)

**Usage:**
```typescript
// Validation
const result = opportunitySchema.safeParse(formData);
if (!result.success) {
  console.error(result.error);
} else {
  const opportunity: Opportunity = result.data; // Type-safe
}

// Type checking
function createOpportunity(opp: Opportunity) {
  // TypeScript knows all fields and their types
}

// Form defaults
const defaultValues = opportunitySchema.partial().parse({});
// Returns object with all .default() values applied
```

### Pattern 2: JSONB Array Schema

JSONB arrays require sub-schemas for array items.

**From `src/atomic-crm/validation/contacts.ts` (inferred):**

```typescript
// Sub-schema for email with type
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email format"),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

// Sub-schema for phone with type
export const phoneNumberAndTypeSchema = z.object({
  number: z.string().min(1, "Phone number is required"),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

// Main contact schema with JSONB arrays
export const contactSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.array(emailAndTypeSchema).default([]), // JSONB array
  phone: z.array(phoneNumberAndTypeSchema).default([]), // JSONB array
});

// Infer types
export type Contact = z.infer<typeof contactSchema>;
export type EmailAndType = z.infer<typeof emailAndTypeSchema>;
export type PhoneNumberAndType = z.infer<typeof phoneNumberAndTypeSchema>;
```

**Usage in types.ts:**
```typescript
export interface EmailAndType {
  email: string;
  type: "Work" | "Home" | "Other";
}

export interface PhoneNumberAndType {
  number: string;
  type: "Work" | "Home" | "Other";
}

export interface Contact extends Pick<RaRecord, "id"> {
  first_name: string;
  last_name: string;
  email: EmailAndType[]; // Array type from sub-schema
  phone: PhoneNumberAndType[]; // Array type from sub-schema
}
```

## Generic Patterns

Generics enable type-safe reusable components that work with any type while preserving type information.

### Pattern 1: Generic List Component

**From `src/components/ui/VirtualizedList.tsx`:**

```typescript
// Generic props interface
export interface VirtualizedListProps<T = unknown> {
  items: T[]; // Array of any type
  height: number;
  itemSize: number | ((index: number) => number);
  ItemComponent: React.ComponentType<{
    item: T; // Item type flows through
    index: number;
    style: React.CSSProperties;
  }>;
  className?: string;
  containerClassName?: string;
  overscanCount?: number;
  width?: number | string;
}

// Generic component
export const VirtualizedList = <T,>({
  items,
  height,
  itemSize,
  ItemComponent,
  className,
  containerClassName,
  overscanCount = 5,
  width = "100%",
}: VirtualizedListProps<T>) => {
  const itemData: VirtualizedListItemData<T> = {
    items,
    ItemComponent,
    className,
  };

  // Type T flows through to all child components
  // ...
};
```

**Usage:**
```typescript
interface Contact {
  id: number;
  name: string;
  email: string;
}

const ContactItem: React.FC<{ item: Contact; index: number; style: React.CSSProperties }> = ({
  item,
  style
}) => (
  <div style={style}>
    <div>{item.name}</div>
    <div>{item.email}</div>
  </div>
);

// TypeScript infers T = Contact
<VirtualizedList
  items={contacts}
  height={600}
  itemSize={60}
  ItemComponent={ContactItem}
/>
```

**Why this works:**
- Generic `<T>` allows any type
- Type flows from `items` prop through to `ItemComponent`
- Full autocomplete for `item` prop in ContactItem

### Pattern 2: Generic Hook

```typescript
// Generic hook for data fetching
function useDataFetch<T>(url: string): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then((json: T) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}

// Usage with type inference
interface User {
  id: number;
  name: string;
}

const { data, loading, error } = useDataFetch<User[]>("/api/users");
// data has type: User[] | null
```

### Pattern 3: Generic with Constraints

```typescript
// Generic constrained to RaRecord (must have 'id' field)
interface DataListProps<T extends RaRecord> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
}

function DataList<T extends RaRecord>({ data, renderItem }: DataListProps<T>) {
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{renderItem(item)}</div>
      ))}
    </div>
  );
}

// ✅ Works: Contact extends RaRecord
<DataList data={contacts} renderItem={(c) => <span>{c.name}</span>} />

// ❌ Error: string doesn't extend RaRecord
<DataList data={["a", "b"]} renderItem={(s) => <span>{s}</span>} />
```

## Utility Types

TypeScript provides utility types to transform existing types without duplication.

### Pick - Select Specific Fields

```typescript
// Original interface
export interface Sale extends Pick<RaRecord, "id"> {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  email: string;
}

// Pick only name fields
type SaleName = Pick<Sale, "first_name" | "last_name">;
// { first_name: string; last_name: string; }

// Usage
function formatName(sale: SaleName): string {
  return `${sale.first_name} ${sale.last_name}`;
}
```

### Omit - Exclude Specific Fields

```typescript
// Omit password from sale for client-side
type SafeSale = Omit<Sale, "password">;

// Create form data without id (generated by database)
type SaleCreateInput = Omit<Sale, "id" | "user_id" | "email">;
```

### Partial - Make All Fields Optional

```typescript
// Make all fields optional for update
type SaleUpdateInput = Partial<Sale>;

// Usage: update only changed fields
const updates: SaleUpdateInput = {
  first_name: "John", // Only update first name
};
```

### Required - Make All Fields Required

```typescript
// Make optional fields required
interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

type ContactRequired = Required<Contact>;
// { id: number; name: string; email: string; phone: string; }
```

### Record - Key-Value Map

```typescript
// Map opportunity stage to count
type StageCount = Record<OpportunityStage, number>;

const stageCounts: StageCount = {
  new_lead: 5,
  initial_outreach: 3,
  sample_visit_offered: 2,
  awaiting_response: 1,
  feedback_logged: 4,
  demo_scheduled: 2,
  closed_won: 10,
  closed_lost: 3,
};

// Map resource name to configuration
type ResourceConfig = Record<string, {
  icon: ComponentType;
  label: string;
}>;

const config: ResourceConfig = {
  organizations: { icon: Building2, label: "Organizations" },
  contacts: { icon: Users, label: "Contacts" },
  opportunities: { icon: Target, label: "Opportunities" },
};
```

### Readonly - Immutable Properties

```typescript
// Prevent accidental mutation
type ImmutableConfig = Readonly<Config>;

const config: ImmutableConfig = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
};

// ❌ Error: Cannot assign to 'apiUrl' because it is read-only
config.apiUrl = "https://other-api.com";
```

### Combining Utility Types

```typescript
// Complex type transformation
type ContactUpdateInput = Partial<Omit<Contact, "id" | "created_at" | "updated_at">>;

// Equivalent to:
type ContactUpdateInput = {
  first_name?: string;
  last_name?: string;
  email?: EmailAndType[];
  phone?: PhoneNumberAndType[];
  // (id, created_at, updated_at excluded)
};
```

## Discriminated Unions

Use a common "discriminant" field to narrow types.

### Pattern 1: Action Types

```typescript
// Define union with discriminant 'type'
type Action =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_AGE"; payload: number }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_NAME":
      // TypeScript knows: action.payload is string
      return { ...state, name: action.payload };
    case "SET_AGE":
      // TypeScript knows: action.payload is number
      return { ...state, age: action.payload };
    case "RESET":
      // TypeScript knows: action has no payload
      return initialState;
    default:
      // Exhaustiveness check: all cases handled
      const _exhaustive: never = action;
      return state;
  }
}
```

### Pattern 2: API Response Types

```typescript
// Success or error response
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function handleResponse<T>(response: ApiResponse<T>): T {
  if (response.status === "success") {
    // TypeScript knows: response.data exists
    return response.data;
  } else {
    // TypeScript knows: response.error exists
    throw new Error(response.error);
  }
}
```

### Pattern 3: Component Variant Props

```typescript
// Button with different variants
type ButtonProps =
  | { variant: "primary"; color?: never }
  | { variant: "secondary"; color?: never }
  | { variant: "custom"; color: string };

function Button(props: ButtonProps) {
  if (props.variant === "custom") {
    // TypeScript knows: props.color is string
    return <button style={{ backgroundColor: props.color }}>Click</button>;
  }
  // TypeScript knows: props.color is undefined for primary/secondary
  return <button className={props.variant}>Click</button>;
}

// ✅ Valid
<Button variant="primary" />
<Button variant="custom" color="#ff0000" />

// ❌ Error: color required for custom variant
<Button variant="custom" />

// ❌ Error: color not allowed for primary variant
<Button variant="primary" color="#ff0000" />
```

## Type Guards

Type guards narrow union types to specific types.

### Pattern 1: typeof Guard

```typescript
function formatValue(value: string | number): string {
  if (typeof value === "string") {
    // TypeScript knows: value is string
    return value.toUpperCase();
  } else {
    // TypeScript knows: value is number
    return value.toFixed(2);
  }
}
```

### Pattern 2: in Operator Guard

```typescript
interface Dog {
  bark: () => void;
}

interface Cat {
  meow: () => void;
}

type Pet = Dog | Cat;

function makeSound(pet: Pet) {
  if ("bark" in pet) {
    // TypeScript knows: pet is Dog
    pet.bark();
  } else {
    // TypeScript knows: pet is Cat
    pet.meow();
  }
}
```

### Pattern 3: Custom Type Guard Function

```typescript
// Type predicate function
function isContact(record: RaRecord): record is Contact {
  return "first_name" in record && "last_name" in record;
}

function processRecord(record: RaRecord) {
  if (isContact(record)) {
    // TypeScript knows: record is Contact
    console.log(`${record.first_name} ${record.last_name}`);
  }
}
```

### Pattern 4: instanceof Guard

```typescript
function handleError(error: unknown) {
  if (error instanceof Error) {
    // TypeScript knows: error is Error
    console.error(error.message);
  } else {
    // TypeScript knows: error is unknown
    console.error("Unknown error", error);
  }
}
```

## Const Assertions

Use `as const` to create readonly, literal types.

### Pattern 1: Const Object

```typescript
// Without as const
const COLORS = {
  primary: "#336600",
  secondary: "#D97E1F",
};
// Type: { primary: string; secondary: string; }

// With as const
const COLORS = {
  primary: "#336600",
  secondary: "#D97E1F",
} as const;
// Type: { readonly primary: "#336600"; readonly secondary: "#D97E1F"; }

type ColorKey = keyof typeof COLORS; // "primary" | "secondary"
```

### Pattern 2: Const Array

```typescript
// Without as const
const STAGES = ["new_lead", "initial_outreach", "closed_won"];
// Type: string[]

// With as const
const STAGES = ["new_lead", "initial_outreach", "closed_won"] as const;
// Type: readonly ["new_lead", "initial_outreach", "closed_won"]

type Stage = typeof STAGES[number]; // "new_lead" | "initial_outreach" | "closed_won"
```

### Pattern 3: Const in Function Return

```typescript
function getConfig() {
  return {
    apiUrl: "https://api.example.com",
    timeout: 5000,
  } as const;
}

const config = getConfig();
// Type: { readonly apiUrl: "https://api.example.com"; readonly timeout: 5000; }
```

## Database Type Generation

Generate TypeScript types from Supabase database schema.

**From `src/types/database.generated.ts`:**

```typescript
// Generated by Supabase CLI: supabase gen types typescript
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: number;
          name: string;
          organization_type: "customer" | "prospect" | "principal" | "distributor" | "unknown";
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          organization_type?: "customer" | "prospect" | "principal" | "distributor" | "unknown";
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          organization_type?: "customer" | "prospect" | "principal" | "distributor" | "unknown";
          created_at?: string;
        };
      };
    };
    Enums: {
      interaction_type: "call" | "email" | "meeting" | "demo" | "other";
      priority_level: "low" | "medium" | "high" | "critical";
    };
  };
};

// Usage: Extract types from generated schema
type InteractionType = Database["public"]["Enums"]["interaction_type"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
```

**Regenerate types:**
```bash
npx supabase gen types typescript --project-id aaqnanddcqvfiwhshndl > src/types/database.generated.ts
```

## Best Practices

### DO

✅ Use `interface` for object shapes, `type` for unions
✅ Infer types from Zod schemas (`z.infer<typeof schema>`)
✅ Use utility types (Pick, Omit, Partial) to avoid duplication
✅ Use discriminated unions for variant types
✅ Write custom type guards for complex narrowing
✅ Use `as const` for readonly literal types
✅ Generate database types from Supabase CLI
✅ Use generic types for reusable components
✅ Constrain generics with `extends` when needed

### DON'T

❌ Use `type` when `interface` would work (less extendable)
❌ Duplicate validation logic and type definitions (use Zod)
❌ Use `any` (disables type checking) - use `unknown` instead
❌ Overuse generics (only when type varies with input)
❌ Create complex mapped types that obscure intent
❌ Use `as` type assertions unless absolutely necessary
❌ Ignore TypeScript errors (fix root cause, don't suppress)
❌ Use `@ts-ignore` (use `@ts-expect-error` with explanation)

## Common Issues & Solutions

### Issue: Type error when using Zod schema defaults

**Solution:** Parse empty object to get defaults

```typescript
// ❌ BAD: Manual default values (duplicates schema)
const defaultValues = {
  stage: "new_lead",
  priority: "medium",
  contact_ids: [],
};

// ✅ GOOD: Derive from schema
const defaultValues = opportunitySchema.partial().parse({});
```

### Issue: Component props type too verbose

**Solution:** Use utility types to simplify

```typescript
// ❌ BAD: Duplicate all fields
interface ContactCardProps {
  id: number;
  first_name: string;
  last_name: string;
  email: EmailAndType[];
}

// ✅ GOOD: Pick from existing type
interface ContactCardProps extends Pick<Contact, "id" | "first_name" | "last_name" | "email"> {}

// ✅ BETTER: Just use the type directly
interface ContactCardProps {
  contact: Contact;
}
```

### Issue: Generic type not inferring correctly

**Solution:** Provide explicit type argument

```typescript
// TypeScript can't infer T from empty array
const list = VirtualizedList({ items: [], ... }); // T = unknown

// Provide explicit type
const list = VirtualizedList<Contact>({ items: [], ... }); // T = Contact
```

### Issue: Discriminated union not narrowing

**Solution:** Ensure discriminant field is literal type

```typescript
// ❌ BAD: Discriminant is string (not literal)
type Action = {
  type: string;
  payload: any;
};

// ✅ GOOD: Discriminant is literal union
type Action =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_AGE"; payload: number };
```

### Issue: Cannot assign to readonly property

**Solution:** Remove `as const` or make type mutable

```typescript
const config = { apiUrl: "..." } as const;

// ❌ Error: Cannot assign to readonly
config.apiUrl = "...";

// ✅ Solution 1: Remove as const
const config = { apiUrl: "..." };

// ✅ Solution 2: Create mutable copy
const mutableConfig = { ...config };
mutableConfig.apiUrl = "...";
```

## Related Resources

- [Component Architecture](component-architecture.md) - Component prop patterns
- [State Management](state-management.md) - Typed state patterns
- [Form Patterns](form-patterns.md) - Zod schema integration
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - Official TypeScript documentation
- [Zod Documentation](https://zod.dev/) - Schema validation library

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
