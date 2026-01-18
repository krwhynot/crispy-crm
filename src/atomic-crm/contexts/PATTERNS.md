# Configuration Context Patterns

Standard patterns for React Context usage in Crispy CRM configuration.

These contexts were split from a monolithic `ConfigurationContext` to prevent unnecessary re-renders (P2-1 fix). Each context serves a single responsibility, allowing components to subscribe only to the data they need.

## Context Hierarchy

```
App Root
    │
    ├── AppBrandingProvider (rarely changes)
    │       │
    │       ↓ useAppBranding()
    │       │
    │       ├── Header (logo, title)
    │       └── LoginPage (branding)
    │
    ├── PipelineConfigProvider (workflow config)
    │       │
    │       ↓ usePipelineConfig()
    │       │
    │       ├── OpportunityList (stages)
    │       ├── OpportunityEdit (stage picker)
    │       └── DealBoard (categories)
    │
    └── FormOptionsProvider (form inputs)
            │
            ↓ useFormOptions()
            │
            ├── Status (note statuses)
            ├── AddTask (task types)
            └── ContactEdit (gender options)
```

---

## Pattern A: Single Responsibility Context

Each context owns one domain of configuration. This isolation prevents cascading re-renders when unrelated config changes.

```tsx
// src/atomic-crm/contexts/AppBrandingContext.tsx
// GOOD: Only branding-related values
export interface AppBranding {
  /** Application title displayed in header and login page */
  title: string;
  /** Logo path for dark mode theme */
  darkModeLogo: string;
  /** Logo path for light mode theme */
  lightModeLogo: string;
}
```

**When to use**: Always. Group related config into focused contexts. If two values always change together, they belong in the same context. If they change independently, split them.

**Real-world example**: Header only needs branding, not pipeline stages. With split contexts, pipeline changes don't re-render Header.

---

## Pattern B: Context + Hook Pattern

Every context exports three things: the Context, Provider, and a consumption hook.

```tsx
// src/atomic-crm/contexts/AppBrandingContext.tsx

// 1. Create context with default value
export const AppBrandingContext = createContext<AppBranding>(defaultAppBranding);

// 2. Create Provider component (see Pattern C for implementation)
export const AppBrandingProvider = ({ children, ...props }) => { /* ... */ };

// 3. Export typed hook for consumption
export const useAppBranding = () => useContext(AppBrandingContext);
```

**Consumer usage**:
```tsx
// src/atomic-crm/layout/Header.tsx
// Preferred: Use alias import for cleaner paths
import { useAppBranding } from "@/atomic-crm/contexts";
// Legacy: import { useAppBranding } from "../root/ConfigurationContext";

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useAppBranding();
  // Use branding values...
};
```

**When to use**: Always. This pattern provides type safety and simplifies imports for consumers.

---

## Pattern C: Memoized Values

Provider values are memoized to prevent unnecessary re-renders when the provider re-renders.

```tsx
// src/atomic-crm/contexts/AppBrandingContext.tsx
export const AppBrandingProvider = ({
  children,
  title = defaultTitle,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
}: AppBrandingProviderProps) => {
  // Memoize the context value
  const value = useMemo(
    () => ({ title, darkModeLogo, lightModeLogo }),
    [title, darkModeLogo, lightModeLogo]
  );

  return (
    <AppBrandingContext.Provider value={value}>
      {children}
    </AppBrandingContext.Provider>
  );
};
```

**Why this matters**: Without `useMemo`, every parent re-render creates a new object reference, causing all consumers to re-render even if values didn't change.

**When to use**: Any context that provides an object value (virtually all contexts).

---

## Pattern D: Typed Provider Props

Provider props extend `Partial<T>` allowing partial overrides with defaults.

```tsx
// src/atomic-crm/contexts/AppBrandingContext.tsx

// Props extend Partial<T> for optional overrides
export interface AppBrandingProviderProps extends Partial<AppBranding> {
  children: ReactNode;
}

// Provider uses destructuring defaults
export const AppBrandingProvider = ({
  children,
  title = defaultTitle,                    // Falls back to default
  darkModeLogo = defaultDarkModeLogo,      // Falls back to default
  lightModeLogo = defaultLightModeLogo,    // Falls back to default
}: AppBrandingProviderProps) => {
  // ...
};
```

**Usage with overrides**:
```tsx
// Override only what you need
<AppBrandingProvider title="Custom CRM">
  <App />
</AppBrandingProvider>
```

**When to use**: Config contexts where values have sensible defaults. Allows incremental customization.

---

## Pattern E: Default Configuration

Defaults are centralized in a separate file, imported by all contexts.

```tsx
// src/atomic-crm/root/defaultConfiguration.ts

// Static defaults (no runtime dependencies)
export const defaultTitle = "Atomic CRM";
export const defaultDarkModeLogo = "./logos/logo_atomic_crm_dark.svg";
export const defaultLightModeLogo = "./logos/logo_atomic_crm_light.svg";

export const defaultOpportunityStages = [
  { value: "new_lead", label: "New Lead" },
  { value: "initial_outreach", label: "Initial Outreach" },
  { value: "sample_visit_offered", label: "Sample Visit Offered" },
  { value: "feedback_logged", label: "Feedback Logged" },
  { value: "demo_scheduled", label: "Demo Scheduled" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

export const defaultTaskTypes = [
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Demo",
  "Proposal",
  "Other",
];
```

**Context imports defaults**:
```tsx
// src/atomic-crm/contexts/PipelineConfigContext.tsx
import {
  defaultDealStages,
  defaultOpportunityStages,
  // ...
} from "../root/defaultConfiguration";

const defaultPipelineConfig: PipelineConfig = {
  dealStages: defaultDealStages,
  opportunityStages: defaultOpportunityStages,
  // ...
};
```

**When to use**: When configuration has sensible defaults. Centralizes all default values for easy modification.

---

## Barrel Exports

All contexts are re-exported from `index.ts` for clean imports.

```tsx
// src/atomic-crm/contexts/index.ts
export {
  AppBrandingContext,
  AppBrandingProvider,
  useAppBranding,
  type AppBranding,
  type AppBrandingProviderProps,
} from "./AppBrandingContext";

export {
  PipelineConfigContext,
  PipelineConfigProvider,
  usePipelineConfig,
  type PipelineConfig,
  type PipelineConfigProviderProps,
} from "./PipelineConfigContext";

export {
  FormOptionsContext,
  FormOptionsProvider,
  useFormOptions,
  type FormOptions,
  type FormOptionsProviderProps,
} from "./FormOptionsContext";
```

**Consumer imports**:
```tsx
// Clean single import
import { useAppBranding, usePipelineConfig } from "@/atomic-crm/contexts";
```

---

## State Management Comparison

| Need | Use | Why |
|------|-----|-----|
| App-wide config (branding, stages) | **Context** | Infrequent updates, available tree-wide |
| Component-specific data | **Props** | Direct parent-child, explicit data flow |
| Frequently updating state | **Zustand** | Selective subscriptions, no provider nesting |
| Server state (API data) | **React Query** | Caching, deduplication, background refresh |
| Form state | **react-hook-form** | Isolated re-renders, validation |

### When to Use Context

- Configuration that rarely changes (branding, feature flags)
- Values needed by many components at different tree depths
- Theming and localization
- Auth/user session data

### When NOT to Use Context

- Frequently updating values (use Zustand/Jotai)
- Server data (use React Query)
- Component-local state (use useState)
- Form state (use react-hook-form)

---

## Anti-Patterns

### Monolithic Context

```tsx
// BAD: Unrelated data bundled together
const AppContext = createContext({
  title: "",              // Branding
  opportunityStages: [],  // Pipeline
  taskTypes: [],          // Forms
  currentUser: null,      // Auth
  theme: "light",         // UI
});
// Any change re-renders ALL consumers
```

**Fix**: Split into focused contexts (Pattern A).

---

### Missing Memoization

```tsx
// BAD: New object every render
const AppProvider = ({ children, title }) => {
  return (
    <AppContext.Provider value={{ title }}>  {/* New object each time */}
      {children}
    </AppContext.Provider>
  );
};
```

**Fix**: Wrap value in `useMemo` (Pattern C).

---

### Context in Loops/Conditions

```tsx
// BAD: Context created inside component
const Component = () => {
  const MyContext = createContext(null);  // New context each render!
  return <MyContext.Provider value={data}>{children}</MyContext.Provider>;
};
```

**Fix**: Create context at module level, outside any component.

---

### Over-Splitting

```tsx
// BAD: Splitting values that always change together
const TitleContext = createContext("");
const LogoContext = createContext("");
// These always update together - split provides no benefit
```

**Fix**: Keep related values in one context. Split only when values change independently.

---

### Prop Drilling Through Context

```tsx
// BAD: Using context to avoid 1-2 levels of prop drilling
<GrandParent>
  <Parent>  {/* Doesn't use data */}
    <Child data={data} />  {/* Uses data */}
  </Parent>
</GrandParent>
```

**Fix**: Props are fine for shallow trees. Use context only when drilling is truly painful (3+ levels) or many components need the same data.

---

## Migration Checklist

When adding a new configuration context:

### 1. Define Interface
```tsx
// Define shape with JSDoc comments
export interface MyConfig {
  /** Description of field */
  fieldName: string;
}
```

### 2. Create Defaults
```tsx
// Add to defaultConfiguration.ts
export const defaultFieldName = "default value";

// Create default config object
const defaultMyConfig: MyConfig = {
  fieldName: defaultFieldName,
};
```

### 3. Implement Provider
```tsx
export const MyConfigProvider = ({
  children,
  fieldName = defaultFieldName,
}: MyConfigProviderProps) => {
  const value = useMemo(() => ({ fieldName }), [fieldName]);
  return (
    <MyConfigContext.Provider value={value}>
      {children}
    </MyConfigContext.Provider>
  );
};
```

### 4. Export Hook
```tsx
export const useMyConfig = () => useContext(MyConfigContext);
```

### 5. Update Barrel Export
```tsx
// Add to index.ts
export {
  MyConfigContext,
  MyConfigProvider,
  useMyConfig,
  type MyConfig,
  type MyConfigProviderProps,
} from "./MyConfigContext";
```

### 6. Add Provider to App
```tsx
// In app root, nest new provider
<AppBrandingProvider>
  <PipelineConfigProvider>
    <FormOptionsProvider>
      <MyConfigProvider>  {/* New provider */}
        <App />
      </MyConfigProvider>
    </FormOptionsProvider>
  </PipelineConfigProvider>
</AppBrandingProvider>
```

### 7. Verify Isolation
Use React DevTools Profiler to confirm:
- [ ] Changing MyConfig only re-renders MyConfig consumers
- [ ] Other context consumers don't re-render
- [ ] No unnecessary renders on provider re-render (memoization working)
