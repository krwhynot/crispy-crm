# Pages Module

Top-level standalone page components for Crispy CRM. These are full-page views that do not belong to a specific domain resource module. Currently the module contains the onboarding feature tour shown to users after a migration or product update.

## Key Components

| File | Purpose |
|------|---------|
| `WhatsNew.tsx` | Feature tour onboarding page (518 lines) |
| `index.ts` | Barrel export |

## Architecture

- **No DB access** — all tour content is hardcoded static data; no provider calls, no Supabase reads or writes
- **No React Admin resources** — these are plain React pages, not RA resource views
- **3-tab layout**: Feature Overview (card grid), Interactive Tour (step-by-step), Resources & Help (links)
- **Tour state is session-local**: `completedFeatures` lives in `useState`; it resets on page reload by design
- **5 feature tours**: Opportunities, Multi-Organization Contacts, Organization Types & Hierarchies, Enhanced Activities System, B2B Principal-Distributor Workflows

## Data Flow

- No provider handler — this module does not write to any resource
- No validation schema — no form submissions
- UI components used: `Card`, `Badge`, `Tabs` (Tier 1), `AdminButton` (admin wrapper), `lucide-react` icons

## Adding a New Page

1. Create `YourPage.tsx` in `src/atomic-crm/pages/`
2. Export it from `index.ts`
3. Register the route in the admin shell (`src/atomic-crm/admin/`)
4. If the page needs data, use React Admin hooks (`useDataProvider`, `useGetOne`, etc.) — no direct Supabase imports (CORE-001)

## Adding a New Feature Tour Entry

Add an object to the `newFeatures` array in `WhatsNew.tsx` using the `FeatureTour` interface. Each entry requires `id`, `title`, `description`, `icon`, `category`, and `isNew`. Steps are optional but recommended.

## Related

- Admin shell routing: `src/atomic-crm/admin/`
- Audit baseline: `docs/audit/baseline/feature-inventory.json` (`feat-pgs-001`)
