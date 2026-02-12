# Tech Stack

> **TL;DR:** React 19 + TypeScript 5.9 + Supabase + Tailwind v4 + React Admin 5

---

## The Big Picture

```
┌──────────────────────────────────────────────────────────────────┐
│                         YOUR BROWSER                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    React 19 Frontend                       │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │
│  │  │ shadcn/  │  │ React Admin  │  │  React Hook Form     │ │  │
│  │  │ Radix UI │  │ + ra-supabase│  │  + Zod               │ │  │
│  │  └──────────┘  └──────────────┘  └──────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │
│  │  │ TanStack │  │   Chart.js   │  │  dnd-kit             │ │  │
│  │  │ Query    │  │   Dashboards │  │  Drag & Drop         │ │  │
│  │  └──────────┘  └──────────────┘  └──────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ API calls
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ PostgreSQL   │  │     Auth     │  │  Edge Functions        │ │
│  │  17 + RLS    │  │    (JWT)     │  │  (Deno)                │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     MONITORING                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Sentry (Error Tracking)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Layer | Tool | Version |
|-------|------|---------|
| **Runtime** | Node.js | 22.x |
| **Frontend** | React | ^19.1.0 |
| **Language** | TypeScript | ^5.9.3 |
| **Build** | Vite | ^7.0.4 |
| **Styling** | Tailwind CSS | ^4.1.11 |
| **UI Primitives** | shadcn/ui + Radix UI | 13 packages |
| **Admin Framework** | React Admin | ^5.10.0 |
| **Supabase Adapter** | ra-supabase-core | ^3.5.1 |
| **Server State** | TanStack React Query | ^5.85.9 |
| **Routing** | React Router | ^6.30.3 |
| **Database** | Supabase (PostgreSQL 17) | ^2.75.1 |
| **Forms** | React Hook Form | ^7.66.1 |
| **Validation** | Zod | ^4.1.12 |
| **Error Tracking** | Sentry | ^10.27.0 |
| **Testing** | Vitest | ^3.2.4 |
| **Visual Testing** | Storybook + Chromatic | ^9.1.10 |
| **E2E Testing** | Manual via Claude Chrome | - |

---

## What Each Tool Does

### Frontend (What Users See)

| Tool | Purpose |
|------|---------|
| **React 19** | UI framework - builds the interface |
| **TypeScript 5.9** | Adds types to JavaScript (catches bugs early) |
| **Vite 7** | Build tool - makes development fast |
| **React Admin 5** | Admin panel framework (lists, forms, CRUD) |
| **ra-supabase-core** | Glue between React Admin and Supabase |
| **React Router 6** | Client-side routing and navigation |
| **TanStack React Query 5** | Server state management, caching, invalidation |

### UI & Styling (How It Looks)

| Tool | Purpose |
|------|---------|
| **Tailwind CSS v4** | Utility-first CSS classes |
| **shadcn/ui** | Pre-built accessible components (built on Radix) |
| **Radix UI** | 13 headless, accessible UI primitives |
| **Lucide** | Icon library |
| **Sonner** | Toast notifications |
| **cmdk** | Command palette (Cmd+K) |
| **Vaul** | Drawer component |
| **class-variance-authority** | Component variant management |
| **tailwind-merge** | Merges Tailwind class conflicts |

### Data Visualization & Interactions

| Tool | Purpose |
|------|---------|
| **Chart.js + react-chartjs-2** | Dashboard charts and visualizations |
| **dnd-kit** | Drag and drop (Kanban boards, reordering) |
| **driver.js** | Onboarding tours and feature walkthroughs |
| **react-day-picker** | Date picker component |

### Backend (Where Data Lives)

| Tool | Purpose |
|------|---------|
| **Supabase** | Database + Auth + Edge Functions |
| **PostgreSQL 17** | The actual database (with RLS, soft deletes) |
| **Sentry** | Error monitoring and tracking |

### Forms & Validation

| Tool | Purpose |
|------|---------|
| **React Hook Form** | Manages form state efficiently |
| **Zod 4** | Schema validation at API boundary |

### File Handling

| Tool | Purpose |
|------|---------|
| **react-dropzone** | Drag & drop file uploads |
| **react-cropper** | Image cropping |
| **DOMPurify** | XSS sanitization for user content |

### Utilities

| Tool | Purpose |
|------|---------|
| **date-fns** | Date formatting and manipulation |
| **es-toolkit** | Modern utility library (Lodash replacement) |
| **PapaParse** | CSV parsing (import) |
| **jsonexport** | JSON to CSV conversion (export) |
| **lru-cache** | In-memory caching for data provider |
| **inflection** | String pluralization/singularization |
| **diacritic** | Accent-insensitive search |
| **query-string** | URL query parameter handling |

### Dev Tooling

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit and integration testing |
| **Testing Library** | React component testing utilities |
| **Storybook 9** | Component development and documentation |
| **Chromatic** | Visual regression testing |
| **ESLint 9** | Linting (with jsx-a11y, react-hooks, tailwind plugins) |
| **Prettier** | Code formatting |
| **Husky** | Git hooks (pre-commit checks) |

---

## Key Patterns

### 1. Data Flow
```
User Action -> React Component -> Data Provider -> Supabase -> Database
                                       |
                               TanStack Query (cache)
```

### 2. Form Validation
```
User Input -> Zod Schema -> Valid? -> Save to Database
                             |
                          Invalid? -> Show Error (Sonner toast)
```

### 3. Component Architecture (Three Tiers)
```
Tier 3: Feature Modules (src/atomic-crm/)
    └── React Admin Resources (List, Create, Edit, Show)
        └── Tier 2: RA Wrappers (src/components/ra-wrappers/)
            └── Connects shadcn to React Admin
                └── Tier 1: Atoms (src/components/ui/)
                    └── shadcn/ui + Radix primitives + Tailwind
```

---

## Project Structure

```
src/
├── atomic-crm/              # Main app code
│   ├── contacts/            # Contacts module
│   ├── organizations/       # Organizations module
│   ├── opportunities/       # Opportunities module
│   ├── tasks/               # Tasks module
│   ├── dashboard/           # Dashboard module (Chart.js)
│   ├── validation/          # Zod schemas
│   ├── providers/           # Data providers (Supabase handlers)
│   └── queryKeys.ts         # TanStack Query key factories
├── components/
│   ├── ui/                  # Tier 1: shadcn atoms
│   └── ra-wrappers/         # Tier 2: React Admin molecules
├── lib/                     # Shared utilities
└── main.tsx                 # App entry point

supabase/
├── migrations/              # SQL migrations
├── functions/               # Edge Functions (Deno)
└── seed-e2e.sql             # E2E test seed data
```

---

## Notification Architecture

App code uses `useNotify()` (React Admin) or `useSafeNotify()` (error sanitization wrapper).
Sonner is the internal renderer, accessed only through `src/components/ra-wrappers/notification.tsx`.
Direct sonner imports are blocked by ESLint outside the wrapper and Storybook files.

---

## Removed Dependencies

These were removed after a dependency audit confirmed zero source imports:

| Package | Reason |
|---------|--------|
| `@perplexity-ai/perplexity_ai` | Planned AI feature, never shipped |
| `@react-spring/web` | Animation library, never used |
| `@use-gesture/react` | Gesture library (companion to react-spring), never used |
| `@hookform/resolvers` | Bypassed by custom `createFormResolver` in `src/lib/zodErrorFormatting` |
