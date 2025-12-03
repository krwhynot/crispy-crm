---
name: troubleshooting
description: "React 19 + Supabase troubleshooting playbook. Diagnose auth, RLS, data provider, Realtime, CSP, and deployment issues. Triggers on: Sentry, incident, triage, auth error, JWT, RLS policy, 401, 403, permission denied, Realtime, subscription, CSP, build error, deploy, Vercel, Edge Function, TanStack Query, data provider, correlation-id. Uses 2-step incident flow with Claude Code MCP tools."
---

# Troubleshooting Playbook

## Stack Context

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, React Admin, React Router, Tailwind v4, shadcn/Radix |
| **State/Forms** | TanStack Query, React Hook Form + Zod (API boundary validation), CVA |
| **Backend** | Supabase (PostgreSQL 17, Auth, RLS, Realtime), ra-supabase-core data provider |
| **Observability** | Sentry (errors, tracing, session replay), Playwright E2E, Storybook + Chromatic |
| **Deploy** | Vercel with chunk-splitting, source maps to Sentry, strict CSP |

**Why this playbook?** Incidents commonly span **client ↔ data provider ↔ Supabase (RLS/policies)** boundaries. This shortens MTTR and keeps fixes aligned with the Engineering Constitution.

---

## 2-Step Incident Flow (Solo-Friendly)

### Step 1: Triage in Sentry

Capture these before investigating:

| Data Point | Where to Find | Why It Matters |
|------------|---------------|----------------|
| Event link | Sentry issue URL | Shareable reference |
| URL/Route | Breadcrumbs → Navigation | Identifies affected feature |
| User ID | Tags → `user.id` | RLS context |
| JWT claims | Custom context or `/api/whoami` | `sub`, `role`, `exp` for auth issues |
| Console breadcrumbs | Breadcrumbs tab | Client-side errors |
| Network breadcrumbs | Breadcrumbs tab | API failures, status codes |
| Correlation ID | Headers or tags | Links FE ↔ BE logs |

### Step 2: Create Incident Ticket

```bash
# Creates GitHub issue from template, pulls Sentry data
pnpm incident:new <sentry-id>
```

**Required fields** (from `.github/ISSUE_TEMPLATE/incident.md`):
- [ ] Feature flag state
- [ ] Commit SHA / Release version
- [ ] Repro steps (numbered)
- [ ] HAR file (if network-related)
- [ ] Sentry link
- [ ] Data migration involved? (yes/no)

---

## Critical Journey Diagnostics

### Auth Issues

**Symptoms:** 401, 403, "permission denied", redirect loops, stale session

**Diagnostic endpoints:**
```typescript
// /api/whoami - returns JWT claims for debugging
{
  sub: "user-uuid",
  role: "authenticated",
  exp: 1699999999,
  iat: 1699900000,
  email: "user@example.com",
  app_metadata: { ... }
}
```

**Quick checks:**
```bash
# Check token expiry (clock skew warning if exp - now < 120s)
# Force refresh: authProvider.refreshToken()

# Decode JWT locally
echo "$SUPABASE_JWT" | cut -d'.' -f2 | base64 -d | jq
```

**Common causes:**

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 401 on all requests | Expired/missing token | Force refresh, check storage |
| 403 on specific resource | RLS policy denying | Check policy with user's role |
| Works locally, fails prod | Different JWT secret | Verify `SUPABASE_JWT_SECRET` |
| Intermittent auth failures | Clock skew | Check server/client time sync |

See [AUTH-DIAGNOSTICS.md](AUTH-DIAGNOSTICS.md) for detailed JWT debugging.

### RLS/Policy Issues

**Symptoms:** Empty results, "permission denied", data visible to wrong users

**Local RLS testing harness:**
```sql
-- Simulate authenticated user with specific role
SELECT set_config('request.jwt.claims', '{
  "sub": "test-user-uuid",
  "role": "authenticated",
  "email": "test@example.com"
}', true);

-- Now run your query
SELECT * FROM contacts WHERE deleted_at IS NULL;
```

**Policy debugging:**
```sql
-- List all policies on a table
SELECT * FROM pg_policies WHERE tablename = 'contacts';

-- Check if policy would allow operation
EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM contacts WHERE id = 'some-uuid';
```

See [RLS-HARNESS.md](RLS-HARNESS.md) for golden queries and policy templates.

### Data Provider Issues

**Symptoms:** Stale data, missing records, wrong filters, N+1 queries

**Visibility via `unifiedDataProvider`:**
```typescript
// Logs: method, resource, params, HTTP status, correlation-id
// Enable verbose: VITE_DEBUG_QUERIES=true

// Check TanStack Query state
// React Query DevTools → Queries tab → stale/fetching/error states
```

**Common patterns:**

| Symptom | Check | Fix |
|---------|-------|-----|
| Stale after mutation | Query invalidation | Add `queryClient.invalidateQueries(['resource'])` |
| Missing soft-deleted | Filter chain | Verify `deleted_at IS NULL` in provider |
| Wrong pagination | getList params | Check `pagination.page` vs `pagination.perPage` |
| N+1 queries | Network tab | Use `.select('*, relation(*)') ` for joins |

### Realtime Issues

**Symptoms:** Updates not appearing, subscription drops, duplicate events

**Baseline test:**
```typescript
// subscribe → heartbeat → unsubscribe smoke test
const channel = supabase.channel('test')
  .on('presence', { event: 'sync' }, () => console.log('sync'))
  .subscribe((status) => {
    console.log('Subscription status:', status);
    if (status === 'SUBSCRIBED') {
      // Success - unsubscribe after 5s
      setTimeout(() => channel.unsubscribe(), 5000);
    }
  });
```

**Auto-resubscribe pattern:**
```typescript
// Jittered backoff on disconnect
const backoff = Math.min(1000 * Math.pow(2, retryCount), 30000);
const jitter = Math.random() * 1000;
setTimeout(resubscribe, backoff + jitter);
```

### CSP Violations

**Symptoms:** Blank page, blocked scripts/fonts, console CSP errors

**Quick-fix checklist:**
- [ ] Inline script? → Move to external file or add hash to CSP
- [ ] External font? → Add domain to `font-src`
- [ ] Data URI? → Add `data:` to appropriate directive
- [ ] Eval? → Refactor code (never add `unsafe-eval`)

**Report analysis:**
```bash
# CSP reports flow to Sentry via report-to/report-uri
# Check Sentry → Issues → Filter: "CSP"
```

---

## Build & Deployment

### Build Failures

```bash
# Capture full output
npm run build 2>&1 | tee build-error.log

# Isolate TypeScript errors
npx tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort -u

# Check dependency conflicts
npm ls react-admin @types/react
```

| Error Pattern | Cause | Fix |
|--------------|-------|-----|
| `TS2307: Cannot find module` | Missing types | `npm i -D @types/[pkg]` |
| `TS2345: Argument type` | API change | Check migration guide |
| `ERESOLVE peer dep` | Version conflict | Check `npm ls`, update lockfile |

### Vercel Deployment

**Rollback:** Vercel Dashboard → Deployments → "..." → Rollback (one-click)

**Feature disable:** Edge Config flag → Set to `false` → Instant propagation

**Environment parity check:**
```bash
# Compare local vs production env
diff <(grep -v '^#' .env.local | sort) <(vercel env pull --environment=production && sort .env.production)
```

### Edge Functions

```bash
# Local test
npx supabase functions serve daily-digest --env-file .env.local

# Check logs
npx supabase functions logs daily-digest --tail

# Deploy
npx supabase functions deploy daily-digest
```

| Symptom | Check | Fix |
|---------|-------|-----|
| Timeout | Function logs | Optimize query, increase `--max-duration` |
| Import error | Deno imports | Use `npm:` prefix or esm.sh |
| 500 error | Logs → stack trace | Fix error, add structured logging |

---

## Claude Code MCP Integration

### Prompt Library

Use these with `mcp__perplexity-ask__*` or direct Claude:

**Sentry triage:**
```
Summarize this Sentry issue and propose repro steps:
- Event ID: [paste]
- Error: [paste]
- Breadcrumbs: [paste relevant]
```

**RLS reasoning:**
```
Given these RLS policies and JWT claims, explain why this query is denied:
- Policies: [paste from pg_policies]
- Claims: [paste JWT decoded]
- Query: [paste SQL]
Propose minimal fix aligned with least-privilege.
```

**E2E generation:**
```
Generate a Playwright test for this user journey:
- Start: [page]
- Actions: [steps]
- Assertions: [expected outcomes]
Use semantic selectors (getByRole, getByLabel).
```

### MCP Tools for Troubleshooting

| Tool | Use Case |
|------|----------|
| `mcp__supabase__execute_sql` | Run diagnostic queries, check RLS |
| `mcp__supabase__list_tables` | Verify schema, check policies |
| `mcp__perplexity-ask__*` | Research error messages, find solutions |
| `mcp__zen__debug` | Structure hypothesis, track investigation |

---

## SLOs & Alerts

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| p95 route load | < 2.5s | > 3s for 5 min |
| API 5xx rate | < 0.5% | > 1% for 5 min |
| Unhandled FE errors | < 1% sessions | > 2% for 1 hour |
| CSP violations | 0 (new) | Any new violation type |

**Alert channels:** Sentry → Email (primary), Slack (if configured)

---

## Quick Reference

### RAPID Framework

1. **R**eproduce & Record → Capture exact error, env, recent changes
2. **A**nalyze → Categorize issue type (auth/RLS/data/realtime/CSP/build/deploy)
3. **P**ropose hypothesis → Use `mcp__zen__debug` for structured thinking
4. **I**nvestigate → Narrow to specific cause with diagnostic tools
5. **D**eploy fix → Verify resolution, check related functionality

### Handoff to Other Skills

| Situation | Skill |
|-----------|-------|
| Code bug investigation | `fail-fast-debugging` |
| Call chain tracing | `root-cause-tracing` |
| Code changes | `enforcing-principles` |
| Ready to claim done | `verification-before-completion` |

---

## Reference Files

- [AUTH-DIAGNOSTICS.md](AUTH-DIAGNOSTICS.md) - JWT debugging, token refresh, clock skew
- [RLS-HARNESS.md](RLS-HARNESS.md) - Policy testing queries, golden SQL
- [INCIDENT-TEMPLATE.md](INCIDENT-TEMPLATE.md) - GitHub issue template
- [CLAUDE-PROMPTS.md](CLAUDE-PROMPTS.md) - Full prompt library for Claude Code

---

**Philosophy:** Incidents span client ↔ data provider ↔ Supabase boundaries. This playbook provides systematic diagnostics for each layer while keeping fixes aligned with the Engineering Constitution.
