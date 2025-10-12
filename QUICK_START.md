# 🚀 Quick Start: Local Development

## One-Time Setup (5 minutes)

### 1. Authenticate with Supabase
```bash
npx supabase login
```

### 2. Link to Production
```bash
npx supabase link --project-ref aaqnanddcqvfiwhshndl
```

### 3. Generate Initial Schema (Squash Migrations)
```bash
# Pull latest from production
npx supabase db pull

# Generate single initial schema file
npx supabase db dump -f supabase/migrations/20251012000000_initial_schema.sql --schema-only

# Archive old migrations
mkdir -p supabase/migrations/_archived/pre-squash
mv supabase/migrations/202501*.sql supabase/migrations/_archived/pre-squash/
mv supabase/migrations/202509*.sql supabase/migrations/_archived/pre-squash/
mv supabase/migrations/202510*.sql supabase/migrations/_archived/pre-squash/

# Only 20251012000000_initial_schema.sql should remain in migrations/
```

### 4. Test Locally
```bash
# This will take a few minutes on first run (downloads Docker images)
npx supabase db reset
```

### 5. Align Production (⚠️ TAKE BACKUP FIRST)
In your Supabase Dashboard SQL Editor (production), run:
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20251012000000');
```

---

## Daily Usage

### Start Development
```bash
# Option 1: Local database (recommended)
npm run dev:local

# Option 2: Production database
npm run dev
```

### Access Services
- **App**: http://localhost:5173
- **Studio**: http://localhost:54323
- **Database**: `postgresql://postgres:postgres@localhost:54322/postgres`

### Manage Supabase
```bash
npm run supabase:local:start      # Start
npm run supabase:local:stop       # Stop
npm run supabase:local:status     # Check status
npm run supabase:local:db:reset   # Fresh database
```

---

## Troubleshooting

### "Port already in use"
```bash
npm run supabase:local:stop
```

### "Docker not running"
```bash
# WSL/Ubuntu
sudo service docker start

# Mac/Windows: Start Docker Desktop
```

### "Migration errors"
```bash
# Reset and re-apply migrations
npm run supabase:local:db:reset
```

---

## What's Created?

✅ `.env.local` - Local Supabase configuration
✅ `LOCAL_DEV_SETUP.md` - Complete setup guide
✅ npm scripts for Supabase management
✅ Migration squashing instructions

---

## Next Steps

1. **Complete migration squashing** (steps 1-5 above)
2. **Run `npm run dev:local`**
3. **Create test data** via Studio (http://localhost:54323)
4. **Share with team** - commit setup docs to git

---

## Environment Files

| File | Purpose | Vite Auto-loads? |
|------|---------|------------------|
| `.env.local` | Local dev (localhost:54321) | ✅ Yes |
| `.env.development` | Production (aaqnanddcqvfiwhshndl.supabase.co) | ✅ Yes (if no .env.local) |
| `.env.example` | Template for new developers | ❌ No |

**To switch**: Rename `.env.local` to `.env.local.backup` temporarily.

---

📚 **Full Documentation**: See `LOCAL_DEV_SETUP.md` for detailed explanations.
