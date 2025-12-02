# Supabase Pooler Connection (DEPRECATED)

> **⚠️ DEPRECATED (2025-12-02)**: This method is superseded by password-based authentication.
> See: `.claude/skills/supabase-crm/SKILL.md` for the current recommended approach.

## Current Recommended Method

Use `SUPABASE_DB_PASSWORD` environment variable:

```bash
# Add to .env (already gitignored)
SUPABASE_DB_PASSWORD=your_database_password_here

# Use with CLI commands
source .env && npx supabase db push
source .env && npx supabase migration list --linked
```

**Why this is better:**
- Password-based auth uses a more stable authentication path
- Avoids Fail2ban triggers from passwordless auth timeouts in WSL2
- No need for complex pooler URLs

## Legacy Method (Archived for Reference)

The pooler method below may still work but is no longer recommended:

### The Problem
WSL2 doesn't route IPv6 to external hosts. Supabase's direct DB connection (`db.*.supabase.co`) uses IPv6 only.

### The Solution
Use the **Session Pooler** which supports IPv4.

### Connection Details for This Project

| Setting | Value |
|---------|-------|
| **Host** | `aws-1-us-east-2.pooler.supabase.com` |
| **Port** | `5432` (session mode) or `6543` (transaction mode) |
| **User** | `postgres.aaqnanddcqvfiwhshndl` |
| **Database** | `postgres` |
| **Pool Mode** | `session` |

### CLI Command Format (Legacy)

```bash
npx supabase db push --db-url "postgresql://postgres.aaqnanddcqvfiwhshndl:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

---

**Last updated:** 2025-12-02 (deprecated)
**Original date:** 2025-11-30
