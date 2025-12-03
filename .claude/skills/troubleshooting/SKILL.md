---
name: troubleshooting
description: "Diagnose and resolve build failures, performance issues, and deployment problems. Triggers on: build error, compile error, TypeScript error, webpack, bundle, dependency, npm error, performance, slow, latency, bottleneck, memory leak, deployment, production, staging, Edge Function, environment, service not starting, timeout. Parallel specialist to fail-fast-debugging (handles bugs) and root-cause-tracing (handles code investigation)."
---

# Troubleshooting

## Purpose

Systematic diagnosis and resolution for **build failures, performance issues, and deployment problems** - the operational issues that existing debugging skills don't cover well.

**Scope Boundary:**
- Code bugs → Use `fail-fast-debugging` skill
- Call chain tracing → Use `root-cause-tracing` skill
- Build/Performance/Deployment → **This skill**

## When This Skill Activates

### Build Failures
- TypeScript compilation errors
- Webpack/Vite bundle failures
- Dependency conflicts (`npm install` issues)
- Package version mismatches

### Performance Issues
- Slow API responses or queries
- Rendering bottlenecks
- Memory leaks
- N+1 query patterns
- Large bundle sizes

### Deployment Problems
- Environment configuration issues
- Service startup failures
- Supabase Edge Function errors
- Production-only bugs
- Staging/production parity issues

---

## The RAPID Framework

### R - Reproduce & Record

**Goal:** Capture the exact failure state

```bash
# Build failures - capture full output
npm run build 2>&1 | tee build-error.log

# Performance - capture metrics baseline
# (use browser DevTools, Supabase dashboard, or profiling tools)

# Deployment - capture logs
npx supabase functions logs daily-digest --tail
```

**Checklist:**
- [ ] Exact error message captured (full text, not summary)
- [ ] Environment identified (local/staging/production)
- [ ] Recent changes identified (`git log -5 --oneline`)
- [ ] Reproduction steps documented

### A - Analyze Systematically

**Goal:** Categorize and understand the issue type

| Issue Type | Key Indicators | First Check |
|------------|----------------|-------------|
| Build - TypeScript | `TS\d{4}:` errors | `npx tsc --noEmit` |
| Build - Dependencies | `ERESOLVE`, `peer dep` | `npm ls`, `package-lock.json` |
| Build - Bundle | `chunk`, `module not found` | Webpack/Vite config |
| Perf - Query | Slow dashboard, N+1 | Supabase query logs |
| Perf - Render | Janky UI, high CPU | React DevTools Profiler |
| Perf - Memory | Growing heap, crashes | Chrome Memory tab |
| Deploy - Config | Works locally, fails remote | Environment variables |
| Deploy - Edge Fn | Deno errors, timeout | Function logs, imports |

### P - Propose Hypothesis

**Goal:** Form testable hypothesis before making changes

Use `mcp__zen__debug` for structured hypothesis:

```typescript
mcp__zen__debug({
  step: "Build failing with TS2345. Hypothesis: Type mismatch after
        upgrading react-admin from 4.x to 5.x. Evidence: error only
        in files using useRecordContext hook.",
  hypothesis: "react-admin 5.x changed useRecordContext return type",
  confidence: "likely",
  relevant_files: ["package.json", "src/atomic-crm/contacts/ContactEdit.tsx"]
})
```

### I - Investigate & Isolate

**Goal:** Narrow down to specific cause

**Build Issues:**
```bash
# Isolate TypeScript errors by file
npx tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort -u

# Check dependency tree for conflicts
npm ls react-admin
npm ls @types/react

# Verify lockfile integrity
npm ci --dry-run
```

**Performance Issues:**
```bash
# Database query analysis (Supabase)
# Check query plans, RLS policy evaluation time

# Bundle size analysis
npm run build -- --analyze  # if configured
npx source-map-explorer dist/**/*.js
```

**Deployment Issues:**
```bash
# Environment variable comparison
diff <(env | sort) <(cat .env.production | sort)

# Edge Function local test
npx supabase functions serve daily-digest --env-file .env.local

# Check Supabase status
npx supabase status
```

### D - Deploy Fix & Verify

**Goal:** Apply targeted fix and confirm resolution

**Before applying:**
- [ ] Hypothesis confirmed by investigation
- [ ] Fix targets root cause (not symptom)
- [ ] Change is minimal and isolated

**After applying:**
```bash
# Build verification
npm run build && npx tsc --noEmit

# Performance verification
# Re-run same scenario, compare metrics

# Deployment verification
npx supabase functions deploy daily-digest
curl -X POST https://[project].supabase.co/functions/v1/daily-digest
```

---

## Crispy CRM Specific Patterns

### Common Build Failures

| Error Pattern | Likely Cause | Solution |
|--------------|--------------|----------|
| `TS2307: Cannot find module` | Missing type definitions | `npm i -D @types/[package]` |
| `TS2345: Argument type` | React Admin API change | Check RA migration guide |
| `TS2339: Property does not exist` | Zod schema mismatch | Sync schema with API |
| `Module not found: supabase` | Import path issue | Use `@supabase/supabase-js` |

### Common Performance Issues

| Symptom | Investigation | Typical Fix |
|---------|--------------|-------------|
| Slow list views | Check `unifiedDataProvider` queries | Add pagination, select specific columns |
| Slow dashboard | Check aggregate queries | Create database views |
| Memory growth | React DevTools → Profiler | Fix unmount cleanup, memo expensive components |
| Bundle > 500KB | `source-map-explorer` | Code splitting, lazy imports |

### Common Deployment Issues

| Symptom | Check First | Resolution |
|---------|-------------|------------|
| Edge Function timeout | Function logs | Optimize query, increase timeout |
| 401 Unauthorized | RLS policies, JWT | Verify `anon`/`service_role` key |
| CORS errors | Supabase config | Add origin to allowed list |
| Works local, fails prod | Environment variables | Verify all vars in Supabase dashboard |

---

## Tool Integration

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `mcp__zen__debug` | Structure investigation | Every troubleshooting session |
| `TodoWrite` | Track diagnosis steps | Complex multi-step issues |
| `Bash` | Run diagnostic commands | Build errors, log analysis |
| `Grep` | Search error patterns | Finding related errors |
| `Read` | Examine configs | Package.json, tsconfig, vite.config |

### Handoff to Other Skills

| Situation | Handoff To |
|-----------|------------|
| Build error reveals code bug | `fail-fast-debugging` |
| Need to trace data flow | `root-cause-tracing` |
| Fix requires code changes | `enforcing-principles` |
| Ready to claim complete | `verification-before-completion` |

---

## Enforcement (Contextual)

| File Pattern | Enforcement | Reason |
|--------------|-------------|--------|
| `supabase/functions/**` | BLOCK | Edge Functions affect production |
| `vite.config.ts`, `tsconfig.json` | BLOCK | Build config changes cascade |
| `package.json`, `package-lock.json` | BLOCK | Dependency changes are high-risk |
| `*.tsx`, `*.ts` (general) | SUGGEST | Code changes lower risk |

---

## Quick Reference Checklist

**Before claiming issue resolved:**

- [ ] Exact error captured and understood
- [ ] Hypothesis formed and tested (not guessed)
- [ ] Root cause identified (not symptom treated)
- [ ] Fix is minimal and targeted
- [ ] Verification command run successfully
- [ ] Related functionality still works

**Red Flags (restart RAPID):**

- "Let me try updating all dependencies"
- "I'll add some error handling"
- "Maybe if I change this config..."
- Bundling multiple unrelated changes

---

## Related Skills

- `fail-fast-debugging` → Code bug investigation
- `root-cause-tracing` → Call chain analysis
- `verification-before-completion` → Verify fixes
- `enforcing-principles` → Code change guidelines

---

**Philosophy:** Operational issues (build/perf/deploy) require different diagnostic tools than code bugs. This skill provides the systematic framework for infrastructure-level troubleshooting.
