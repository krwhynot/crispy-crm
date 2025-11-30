# Supabase Pooler Connection (WSL2 Workaround)

## The Problem
WSL2 doesn't route IPv6 to external hosts. Supabase's direct DB connection (`db.*.supabase.co`) uses IPv6 only.

## The Solution
Use the **Session Pooler** which supports IPv4.

## Connection Details for This Project

| Setting | Value |
|---------|-------|
| **Host** | `aws-1-us-east-2.pooler.supabase.com` |
| **Port** | `5432` (session mode) or `6543` (transaction mode) |
| **User** | `postgres.aaqnanddcqvfiwhshndl` |
| **Database** | `postgres` |
| **Pool Mode** | `session` |

## CLI Command Format

```bash
npx supabase db push --db-url "postgresql://postgres.aaqnanddcqvfiwhshndl:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

## Notes

1. **Region is project-specific**: This project uses `aws-1-us-east-2`. Other projects may use different regions.
2. **Get from Dashboard**: Click "Connect" button → Copy "Session pooler" URL
3. **Shared pooler capacity**: Free tier shares pooler resources. May get "max clients reached" during high load.
4. **MCP tools bypass this**: The `mcp__supabase__*` tools use API access and don't need the pooler.

## Troubleshooting

- **"Tenant or user not found"**: Wrong region. Check Dashboard for correct pooler URL.
- **"max clients reached"**: Pooler at capacity. Wait and retry, or use MCP tools.
- **Timeout**: Network issue. Verify with `nc -zv aws-1-us-east-2.pooler.supabase.com 5432`

Last updated: 2025-11-30
