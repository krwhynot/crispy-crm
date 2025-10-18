# Development Guide

## Environment Setup

This project supports both **local** and **cloud** development workflows.

### Quick Start

#### Local Development (Recommended for Development)
```bash
npm run dev:local
```
This will:
1. Switch to local Supabase configuration
2. Reset the local database
3. Seed with test data (organizations, products, contacts, etc.)
4. Start Vite dev server at http://localhost:5173

**Login**: `admin@test.com` / `password123`

---

#### Cloud Development (For Testing Production)
```bash
npm run dev:cloud
```
This will:
1. Switch to cloud Supabase configuration
2. Start Vite dev server at http://localhost:5173
3. Connect to production cloud database

⚠️ **Warning**: Be careful when using cloud - changes affect production data!

---

### Quick Commands

| Command | Use When |
|---------|----------|
| `npm run dev:local` | Starting fresh local development |
| `npm run dev:local:skip-reset` | Local dev WITHOUT database reset (faster restarts) |
| `npm run dev:cloud` | Testing against cloud/production |
| `npm run dev:check` | Check if Supabase is running |

---

## Environment Files

- **`.env.local`** - Local Supabase configuration (Docker)
  - URL: http://127.0.0.1:54321
  - Includes service role key for seeding

- **`.env.cloud`** - Cloud Supabase configuration
  - URL: https://aaqnanddcqvfiwhshndl.supabase.co
  - Uses anon key only

- **`.env`** - Auto-generated (don't edit directly!)
  - Switched automatically by npm scripts
  - Gitignored

---

## Database Management

### Local Database

```bash
# Reset database + run migrations
npx supabase db reset

# Seed test data
npm run seed:data

# Check status
npx supabase status

# Access Studio
open http://localhost:54323
```

### Cloud Database

```bash
# Push migrations safely
npm run db:cloud:push

# Check migration status
npm run db:cloud:status

# See pending changes
npm run db:cloud:diff
```

---

## Troubleshooting

### "Port 5173 is in use"
```bash
# Kill all Vite processes
pkill -f "vite"

# Then restart
npm run dev:local
```

### "No data showing"
- Check which .env is active: `cat .env | head -3`
- If using dev:local, make sure Supabase is running: `npm run dev:check`
- Re-seed: `npm run seed:data`

### "Permission denied" when seeding
- Make sure you're using local environment
- Local uses service role key which has full permissions
- Cloud uses anon key which is read-only

---

## Tips

- **Use `dev:local` by default** - it's faster and safer
- **Use `dev:cloud` sparingly** - only when testing production scenarios
- **Don't commit `.env`** - it's auto-generated
- **Keep `.env.local` and `.env.cloud` in sync** with configuration changes

