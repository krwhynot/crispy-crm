# Crispy CRM (Atomic CRM)

Sales CRM for food brokers (MFB). Centralizes principal/distributor/operator relationships, opportunity tracking, and activity logging — replacing Excel-based workflows.

## Tech Stack

- **Frontend:** React 19, TypeScript, React Admin, Tailwind v4
- **Backend:** Supabase (Postgres 17, RLS, Edge Functions)
- **Testing:** Vitest, pgTAP
- **Target:** Desktop (1440px+) and iPad

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Push database schema to Supabase
npx supabase db push

# 4. Seed demo data
npm run seed:e2e:dashboard-v3

# 5. Start dev server
npm run dev
```

## Testing

```bash
npm test
```

## AI Context

See [CLAUDE.md](./CLAUDE.md) for architecture, conventions, and agent instructions.
