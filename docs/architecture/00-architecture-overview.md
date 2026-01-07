# Crispy CRM Architecture Overview

## Executive Summary

Crispy CRM implements a **Hybrid Feature-Slice + Centralized Infrastructure Architecture**, combining the organizational clarity of vertical feature slices with the maintainability of shared horizontal infrastructure layers. This pattern was chosen to balance team productivity (features are self-contained and independently navigable) with engineering discipline (validation, data access, and business logic follow strict centralization rules). The architecture enforces a "Strangler Fig" migration strategy where legacy code shrinks while new patterns grow organically.

---

## Architecture Pattern: Feature-Slice + Centralized Infrastructure

### Pattern Definition

This hybrid architecture organizes code along two complementary axes:

1. **Vertical Slices (Features)**: Each business domain (contacts, opportunities, organizations) gets its own directory containing all presentation components for that feature - lists, forms, dialogs, and feature-specific hooks.

2. **Horizontal Layers (Infrastructure)**: Cross-cutting concerns are centralized in dedicated directories:
   - **Validation**: All Zod schemas live in `validation/` (not scattered in feature folders)
   - **Data Access**: Single unified data provider in `providers/supabase/`
   - **Business Logic**: Services in `services/` for complex multi-entity operations
   - **Shared UI**: Reusable components in `components/`

### Why This Pattern?

**Alternative 1 - Pure 3-Layer Architecture** (Rejected)
```
src/
  presentation/    # ALL UI components
  domain/          # ALL business logic
  infrastructure/  # ALL data access
```
Problem: Features are scattered across directories. Changing "contacts" requires edits in 3+ places. Poor locality.

**Alternative 2 - Pure Vertical Slices** (Rejected)
```
src/features/
  contacts/
    ContactList.tsx
    ContactCreate.tsx
    contactSchema.ts      # Validation here
    contactsService.ts    # Service here
    contactsProvider.ts   # Data access here
```
Problem: Duplication of patterns. Each feature reinvents validation, data access, error handling. Inconsistent approaches proliferate.

**Chosen Pattern - Hybrid** (Crispy CRM)
```
src/atomic-crm/
  contacts/           # Feature UI only
  opportunities/      # Feature UI only
  validation/         # Centralized schemas
  services/           # Centralized business logic
  providers/supabase/ # Centralized data access
```
Benefits: Features are navigable (find all contacts UI in one place), while infrastructure is consistent (all validation follows identical patterns).

### Trade-offs

| Benefit | Cost |
|---------|------|
| Feature locality - all UI for a domain is co-located | Must navigate to validation/ for schema changes |
| Single source of truth for validation patterns | More imports across directories |
| Centralized data provider prevents N+1 queries | New devs must learn where code "should" go |
| Service layer enables complex multi-entity operations | Extra abstraction layer for simple CRUD |
| PATTERNS.md files document each area | Documentation overhead (23 PATTERNS.md files) |
| Strangler Fig enables incremental migration | Two patterns coexist during transition |

---

## Complete Directory Structure

```
src/                                    # Root (1108 TypeScript files)
├── App.tsx                             # React entry point
├── main.tsx                            # Vite entry point
├── index.css                           # Global styles (Tailwind v4)
│
├── atomic-crm/                         # [FEATURE SLICES] Core CRM domain (793 files, 72%)
│   │
│   │ ─── FEATURE SLICES (Presentation Layer) ────────────────────
│   ├── contacts/                       # Contact management (70 files)
│   │   ├── ContactList.tsx
│   │   ├── ContactCreate.tsx
│   │   ├── ContactEdit.tsx
│   │   ├── ContactSlideOver.tsx
│   │   ├── components/                 # Feature-specific components
│   │   ├── __tests__/
│   │   └── PATTERNS.md
│   │
│   ├── opportunities/                  # Pipeline/deals (137 files - largest feature)
│   │   ├── OpportunityList.tsx
│   │   ├── OpportunityCreate.tsx
│   │   ├── OpportunityEdit.tsx
│   │   ├── OpportunityKanban.tsx
│   │   ├── components/
│   │   ├── __tests__/
│   │   └── PATTERNS.md
│   │
│   ├── organizations/                  # Companies/principals/distributors (72 files)
│   │   ├── OrganizationList.tsx
│   │   ├── OrganizationCreate.tsx
│   │   ├── OrganizationEdit.tsx
│   │   ├── OrganizationSlideOver.tsx
│   │   ├── components/
│   │   └── PATTERNS.md
│   │
│   ├── activities/                     # Calls, emails, samples (18 files)
│   │   ├── ActivityList.tsx
│   │   ├── ActivityCreate.tsx
│   │   ├── QuickLogActivityDialog.tsx  # Slide-over quick entry
│   │   └── PATTERNS.md
│   │
│   ├── tasks/                          # Task management (26 files)
│   │   ├── TaskList.tsx
│   │   ├── TaskCreate.tsx
│   │   ├── TaskSlideOver.tsx
│   │   └── PATTERNS.md
│   │
│   ├── products/                       # Product catalog (27 files)
│   ├── productDistributors/            # Product-distributor junction (7 files)
│   ├── sales/                          # Sales team/reps (16 files)
│   ├── tags/                           # Tagging system (11 files)
│   ├── notes/                          # Entity notes (6 files)
│   ├── notifications/                  # In-app notifications (3 files)
│   │
│   │ ─── DASHBOARD & REPORTS ────────────────────────────────────
│   ├── dashboard/                      # Principal dashboard (63 files)
│   │   └── v3/                         # Current version
│   │       └── PATTERNS.md
│   ├── reports/                        # Reporting/analytics (44 files)
│   │
│   │ ─── INFRASTRUCTURE (Centralized) ───────────────────────────
│   ├── validation/                     # [DOMAIN] Zod schemas (45 files)
│   │   ├── index.ts                    # Central export
│   │   ├── activities.ts
│   │   ├── contacts.ts
│   │   ├── opportunities.ts
│   │   ├── organizations.ts
│   │   ├── tasks.ts
│   │   ├── __tests__/
│   │   └── PATTERNS.md
│   │
│   ├── services/                       # [DOMAIN] Business logic (17 files)
│   │   ├── index.ts
│   │   ├── activities.service.ts
│   │   ├── opportunities.service.ts
│   │   ├── products.service.ts
│   │   ├── junctions.service.ts        # M:N relationship logic
│   │   ├── digest.service.ts           # Daily digest generation
│   │   ├── utils/
│   │   └── PATTERNS.md
│   │
│   ├── providers/                      # [INFRASTRUCTURE] Data access (81 files)
│   │   └── supabase/
│   │       ├── index.ts                # Main entry point
│   │       ├── composedDataProvider.ts # Handler routing
│   │       ├── authProvider.ts         # Authentication
│   │       ├── handlers/               # Resource-specific handlers
│   │       ├── callbacks/              # Lifecycle callbacks
│   │       ├── extensions/             # Custom RPC methods
│   │       ├── wrappers/               # HOF decorators
│   │       ├── services/               # Provider-level services
│   │       ├── __tests__/
│   │       └── PATTERNS.md
│   │
│   │ ─── SHARED FEATURE INFRASTRUCTURE ──────────────────────────
│   ├── hooks/                          # Feature-level hooks (11 files)
│   │   └── PATTERNS.md
│   ├── contexts/                       # React contexts (7 files)
│   │   └── PATTERNS.md
│   ├── filters/                        # Filter components (26 files)
│   │   └── PATTERNS.md
│   ├── utils/                          # Feature utilities (29 files)
│   │   └── PATTERNS.md
│   ├── components/                     # Shared feature components (7 files)
│   │
│   │ ─── APPLICATION SHELL ──────────────────────────────────────
│   ├── root/                           # App entry point (5 files)
│   │   └── CRM.tsx                     # Main React Admin setup
│   ├── layout/                         # App layout components (5 files)
│   ├── login/                          # Authentication UI (3 files)
│   ├── settings/                       # User settings (13 files)
│   ├── admin/                          # Admin tools (2 files)
│   │
│   │ ─── SUPPORTING FILES ───────────────────────────────────────
│   ├── types.ts                        # Shared types (13KB)
│   ├── constants.ts                    # Feature constants
│   ├── activity-log/                   # Activity timeline (10 files)
│   ├── tutorial/                       # Onboarding (21 files)
│   ├── pages/                          # Standalone pages (2 files)
│   ├── shared/                         # Legacy shared (1 file)
│   └── tests/                          # Test utilities (5 files)
│
├── components/                         # [PRESENTATION] Shared UI (254 files, 23%)
│   │
│   ├── ui/                             # Primitives - shadcn/ui (84 files)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── combobox.tsx
│   │   ├── sidebar.tsx
│   │   ├── *.stories.tsx               # Storybook stories
│   │   ├── __tests__/
│   │   └── PATTERNS.md
│   │
│   ├── admin/                          # React Admin wrappers (95 files)
│   │   ├── text-input.tsx              # RA input wrappers
│   │   ├── select-input.tsx
│   │   ├── autocomplete-input.tsx
│   │   ├── data-table.tsx              # Enhanced datagrid
│   │   ├── form/                       # Form components (28 files)
│   │   │   ├── FormWizard.tsx
│   │   │   ├── FormProgressBar.tsx
│   │   │   ├── form-primitives.tsx
│   │   │   └── __tests__/
│   │   ├── column-filters/             # Datagrid column filters (5 files)
│   │   ├── tabbed-form/                # Multi-tab forms (5 files)
│   │   ├── text-input/                 # Input variants (2 files)
│   │   ├── __tests__/
│   │   └── PATTERNS.md
│   │
│   ├── layouts/                        # Layout components (10 files)
│   │   ├── StandardListLayout.tsx      # List shell pattern
│   │   ├── ResourceSlideOver.tsx       # 40vw right panel
│   │   └── sidepane/                   # Slide-over subcomponents
│   │
│   ├── design-system/                  # Design primitives (2 files)
│   │   └── ResponsiveGrid.tsx
│   │
│   ├── supabase/                       # Auth pages (3 files)
│   │   ├── forgot-password-page.tsx
│   │   └── set-password-page.tsx
│   │
│   ├── ErrorBoundary.tsx               # Global error boundary
│   ├── ResourceErrorBoundary.tsx       # Resource-level error boundary
│   ├── NotificationBell.tsx
│   ├── NotificationDropdown.tsx
│   └── __tests__/
│
├── hooks/                              # [PRESENTATION] Global hooks (20 files)
│   ├── useSlideOverState.ts            # URL-based slide-over state
│   ├── useFavorites.ts                 # Favorites feature
│   ├── useKeyboardShortcuts.ts         # Keyboard navigation
│   ├── useBreakpoint.ts                # Responsive breakpoints
│   └── __tests__/
│
├── lib/                                # [INFRASTRUCTURE] Utilities (14 files)
│   ├── devLogger.ts                    # Development logging
│   ├── logger.ts                       # Production logging
│   ├── sanitization.ts                 # Input sanitization
│   ├── csvUploadValidator.ts           # CSV import validation
│   ├── utils/
│   └── PATTERNS.md
│
├── constants/                          # [DOMAIN] App constants (2 files)
│   └── resources.ts                    # Resource name constants
│
├── types/                              # [DOMAIN] Global types (2 files)
│
├── config/                             # [INFRASTRUCTURE] App config (1 file)
│
├── middleware/                         # [INFRASTRUCTURE] Middleware (1 file)
│
├── emails/                             # [INFRASTRUCTURE] Email templates (4 files)
│
├── tests/                              # [INFRASTRUCTURE] Test utilities (7 files)
│   └── PATTERNS.md
│
├── stories/                            # [PRESENTATION] Storybook (6 files)
│
├── assets/                             # Static assets
│
└── __tests__/                          # Root tests (1 file)
```

---

## Layer Overview

| Layer | Purpose | Primary Locations | File Count | Health |
|-------|---------|-------------------|------------|--------|
| **Presentation** | UI components, React Admin resources, user interaction | `atomic-crm/[feature]/`, `components/`, `hooks/` | ~700 | 4/5 |
| **Domain** | Business logic, validation schemas, entity types | `services/`, `validation/`, `constants/`, `types/` | ~70 | 5/5 |
| **Infrastructure** | Data access, external services, utilities | `providers/`, `lib/`, `config/`, `middleware/` | ~100 | 4/5 |
| **Feature Slices** | Self-contained feature modules | `atomic-crm/contacts/`, etc. | ~550 | 4/5 |

### File Distribution

```
Total TypeScript Files: 1108

By Major Area:
├── atomic-crm/     793 files (71.6%)
│   ├── opportunities/   137 files (17.3% of atomic-crm)
│   ├── providers/        81 files (10.2%)
│   ├── organizations/    72 files (9.1%)
│   ├── contacts/         70 files (8.8%)
│   ├── dashboard/        63 files (7.9%)
│   ├── validation/       45 files (5.7%)
│   ├── reports/          44 files (5.5%)
│   ├── utils/            29 files (3.7%)
│   ├── products/         27 files (3.4%)
│   ├── tasks/            26 files (3.3%)
│   ├── filters/          26 files (3.3%)
│   └── [other]/         173 files (21.8%)
│
├── components/     254 files (22.9%)
│   ├── admin/            95 files (37.4% of components)
│   ├── ui/               84 files (33.1%)
│   └── [other]/          75 files (29.5%)
│
└── [other src/]     61 files (5.5%)
    ├── hooks/            20 files
    ├── lib/              14 files
    └── [misc]/           27 files
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERACTION                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Feature Slices (atomic-crm/[feature]/)                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │ ContactList  │  │ OppKanban    │  │ TaskList     │  ...             │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │ │
│  └─────────┼─────────────────┼─────────────────┼────────────────────────┘ │
│            │                 │                 │                           │
│  ┌─────────┼─────────────────┼─────────────────┼────────────────────────┐ │
│  │  Shared UI (components/)  │                 │                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │ │
│  │  │ DataTable    │  │ SlideOver    │  │ FormWizard   │                │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ useDataProvider(), useMutation()
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOMAIN LAYER                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Validation (validation/)         Services (services/)                 │ │
│  │  ┌──────────────────────┐        ┌──────────────────────┐             │ │
│  │  │ contactSchema        │        │ OpportunitiesService │             │ │
│  │  │ opportunitySchema    │        │ JunctionsService     │             │ │
│  │  │ organizationSchema   │        │ DigestService        │             │ │
│  │  └──────────────────────┘        └──────────────────────┘             │ │
│  │         │ Zod.parse()                    │ business logic              │ │
│  └─────────┼────────────────────────────────┼────────────────────────────┘ │
└────────────┼────────────────────────────────┼────────────────────────────────┘
             │                                │
             └────────────┬───────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Data Provider (providers/supabase/)                                   │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │  4-Stage Initialization:                                          │ │ │
│  │  │  1. Base Provider (ra-supabase-core)                             │ │ │
│  │  │  2. Services Container (business logic injection)                 │ │ │
│  │  │  3. Composed Provider (handler routing + callbacks)               │ │ │
│  │  │  4. Extended Provider (custom RPC methods)                        │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                              │                                         │ │
│  │  ┌──────────────────────────┼───────────────────────────────────────┐ │ │
│  │  │  Handler Layer:          │                                        │ │ │
│  │  │  ┌─────────────┐ ┌──────┴──────┐ ┌─────────────┐                │ │ │
│  │  │  │contactsHandler│ │oppsHandler │ │orgsHandler  │ ...            │ │ │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘                │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Supabase Client
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (PostgreSQL + RLS)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  contacts    │  │ opportunities│  │ organizations│  │    tasks     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Rules

### Allowed Dependencies

| From Layer | Can Import From |
|------------|-----------------|
| Presentation (Features) | Domain (validation, services), Infrastructure (providers), Shared UI (components) |
| Presentation (Shared UI) | UI primitives only (components/ui), no domain imports |
| Domain (Services) | Infrastructure (providers), other services, validation schemas |
| Domain (Validation) | Constants only, NO external dependencies |
| Infrastructure (Providers) | Domain (validation, services), external libraries |
| Infrastructure (Lib) | External libraries only |

### Forbidden Dependencies

| From | To | Why Forbidden |
|------|-----|---------------|
| `components/ui/` | `atomic-crm/*` | UI primitives must remain feature-agnostic |
| `validation/` | `services/` | Schemas are pure data definitions, no business logic |
| `validation/` | `providers/` | Validation cannot depend on data access |
| Feature A | Feature B internals | Features only communicate via shared services/types |
| Any component | Direct `supabase` import | All data access through unified provider |
| `lib/` | `atomic-crm/*` | Utilities cannot depend on feature code |

### Import Validation Rules

```typescript
// CORRECT: Feature imports validation
import { contactSchema } from '@/atomic-crm/validation/contacts';

// CORRECT: Feature imports shared UI
import { Button } from '@/components/ui/button';

// CORRECT: Feature uses data provider
import { useDataProvider } from 'ra-core';

// FORBIDDEN: Component imports feature
import { ContactList } from '@/atomic-crm/contacts';  // NO!

// FORBIDDEN: Direct Supabase import
import { supabase } from '@supabase/supabase-js';  // NO!
```

---

## Engineering Constitution Alignment

### Principle 1: Fail-Fast (Pre-Launch)

**Requirement**: No retry logic, circuit breakers, or graceful fallbacks. Let errors throw.

**Implementation**:
- Data provider throws on validation failure (no silent swallowing)
- No error retry in React Query configuration
- Error boundaries catch and display, not recover

**Evidence**:
- `src/atomic-crm/root/CRM.tsx:90-97` - QueryClient has no `retry` config, just `staleTime`
- `src/components/ErrorBoundary.tsx` - Displays error, no recovery attempt
- `src/atomic-crm/providers/supabase/wrappers/` - Validation throws `HttpError`

---

### Principle 2: Single Source of Truth - Data Provider

**Requirement**: All database access through `unifiedDataProvider`, never direct Supabase imports.

**Implementation**:
- Single `dataProvider` export from `providers/supabase/index.ts`
- 4-stage initialization ensures consistent behavior
- Handler routing layer for resource-specific logic

**Evidence**:
- `src/atomic-crm/providers/supabase/index.ts:69-75` - Single export point
- All feature components use `useDataProvider()` from ra-core
- No `import { supabase }` in feature directories

---

### Principle 3: Single Source of Truth - Validation

**Requirement**: Zod validation at API boundary only, not in forms.

**Implementation**:
- All schemas centralized in `validation/` directory
- Data provider validates on `create`/`update` operations
- Forms use schema for defaults only (`schema.partial().parse({})`)

**Evidence**:
- `src/atomic-crm/validation/index.ts` - Central export of all schemas
- `src/atomic-crm/validation/*.ts` - 25 schema files
- `src/atomic-crm/providers/supabase/wrappers/` - Validation HOF

---

### Principle 4: Form State from Schema

**Requirement**: Form defaults derived from `zodSchema.partial().parse({})`.

**Implementation**:
- Forms use schema-derived defaults
- No hardcoded default values in form components

**Evidence**:
- Pattern documented in `src/atomic-crm/validation/PATTERNS.md`
- Form components import from validation module

---

### Principle 5: TypeScript Conventions

**Requirement**: `interface` for object shapes, `type` for unions/intersections.

**Implementation**:
- Consistently applied across codebase
- Types defined in `types.ts` files per feature

**Evidence**:
- `src/atomic-crm/types.ts` - 13KB of type definitions
- `src/components/admin/filter-types.ts` - Type aliases for unions

---

### Principle 6: Zod Security Requirements

**Requirement**: `z.strictObject()`, `.max()` on strings, `z.coerce` for forms, `z.enum` allowlists.

**Implementation**:
- Validation schemas follow security pattern
- String limits prevent DoS
- Strict objects prevent mass assignment

**Evidence**:
- `src/atomic-crm/validation/constants.ts` - Max length constants
- Schema files use `strictObject`, `max()`, `coerce`

---

### Principle 7: Deprecated Patterns

**Requirement**: Never use `Contact.company_id`, `Opportunity.archived_at`, direct Supabase imports.

**Implementation**:
- Junction tables for M:N relationships
- Soft delete via `deleted_at`
- Data provider abstraction

**Evidence**:
- `src/atomic-crm/services/junctions.service.ts` - Junction table logic
- No `company_id` in contact schemas
- `deleted_at` filter in provider queries

---

## Quick Reference: Where Does X Go?

| If you're adding... | Put it in... | Example |
|---------------------|--------------|---------|
| New UI primitive (button, input) | `src/components/ui/` | `button.tsx` |
| React Admin input wrapper | `src/components/admin/` | `select-input.tsx` |
| Form layout component | `src/components/admin/form/` | `FormWizard.tsx` |
| New CRM feature | `src/atomic-crm/[feature]/` | `contacts/` |
| Feature list view | `src/atomic-crm/[feature]/FeatureList.tsx` | `ContactList.tsx` |
| Feature create form | `src/atomic-crm/[feature]/FeatureCreate.tsx` | `ContactCreate.tsx` |
| Feature slide-over | `src/atomic-crm/[feature]/FeatureSlideOver.tsx` | `ContactSlideOver.tsx` |
| Zod validation schema | `src/atomic-crm/validation/` | `contacts.ts` |
| Business logic service | `src/atomic-crm/services/` | `opportunities.service.ts` |
| Data provider handler | `src/atomic-crm/providers/supabase/handlers/` | `contactsHandler.ts` |
| Custom RPC method | `src/atomic-crm/providers/supabase/extensions/` | `customMethods.ts` |
| Global React hook | `src/hooks/` | `useSlideOverState.ts` |
| Feature-specific hook | `src/atomic-crm/[feature]/hooks/` or `atomic-crm/hooks/` | `useActivityForm.ts` |
| Global utility function | `src/lib/` | `sanitization.ts` |
| Feature utility function | `src/atomic-crm/utils/` | `formatters.ts` |
| Layout component | `src/components/layouts/` | `ResourceSlideOver.tsx` |
| Test utilities | `src/tests/utils/` | `render-admin.tsx` |
| App configuration | `src/config/` | `appConfig.ts` |
| Resource constants | `src/constants/` | `resources.ts` |
| Database migration | `supabase/migrations/` | `20240101_create_contacts.sql` |
| Edge Function | `supabase/functions/` | `daily-digest/` |
| Storybook story | Co-locate with component | `button.stories.tsx` |

---

## PATTERNS.md Documentation

The codebase includes 23 PATTERNS.md files documenting local conventions:

| Location | Documents |
|----------|-----------|
| `atomic-crm/activities/PATTERNS.md` | Activity logging patterns |
| `atomic-crm/activity-log/PATTERNS.md` | Timeline rendering |
| `atomic-crm/contacts/PATTERNS.md` | Contact feature patterns |
| `atomic-crm/contexts/PATTERNS.md` | React context usage |
| `atomic-crm/dashboard/v3/PATTERNS.md` | Dashboard architecture |
| `atomic-crm/filters/PATTERNS.md` | Filter component patterns |
| `atomic-crm/hooks/PATTERNS.md` | Hook conventions |
| `atomic-crm/notes/PATTERNS.md` | Notes feature |
| `atomic-crm/opportunities/PATTERNS.md` | Pipeline/deal patterns |
| `atomic-crm/organizations/PATTERNS.md` | Organization patterns |
| `atomic-crm/productDistributors/PATTERNS.md` | Junction table patterns |
| `atomic-crm/products/PATTERNS.md` | Product catalog |
| `atomic-crm/providers/supabase/PATTERNS.md` | Data provider architecture |
| `atomic-crm/sales/PATTERNS.md` | Sales team patterns |
| `atomic-crm/services/PATTERNS.md` | Service layer patterns |
| `atomic-crm/tags/PATTERNS.md` | Tagging system |
| `atomic-crm/tasks/PATTERNS.md` | Task management |
| `atomic-crm/utils/PATTERNS.md` | Utility conventions |
| `atomic-crm/validation/PATTERNS.md` | Zod schema patterns |
| `components/admin/PATTERNS.md` | React Admin wrappers |
| `components/ui/PATTERNS.md` | UI primitive patterns |
| `lib/PATTERNS.md` | Utility library |
| `tests/PATTERNS.md` | Testing conventions |

---

## Related Documentation

- [Presentation Layer](./01-presentation-layer.md) - UI components, features, layouts
- [Domain Layer](./02-domain-layer.md) - Services, validation, business rules
- [Infrastructure Layer](./03-infrastructure-layer.md) - Data provider, utilities, config
- [Feature Slices](./04-feature-slices.md) - Individual feature deep dives

---

## Appendix: Key Files

| File | Purpose | Size |
|------|---------|------|
| `src/atomic-crm/root/CRM.tsx` | Main React Admin application entry | 240 lines |
| `src/atomic-crm/providers/supabase/index.ts` | Data provider initialization | 84 lines |
| `src/atomic-crm/providers/supabase/composedDataProvider.ts` | Handler routing | ~250 lines |
| `src/atomic-crm/types.ts` | Shared CRM types | 13KB |
| `src/atomic-crm/validation/index.ts` | Validation schema exports | 43 lines |
| `src/components/layouts/ResourceSlideOver.tsx` | Slide-over layout | ~400 lines |
| `src/components/admin/data-table.tsx` | Enhanced datagrid | ~400 lines |

---

*Generated: 2026-01-06 | Last verified against codebase: 1108 TypeScript files*
