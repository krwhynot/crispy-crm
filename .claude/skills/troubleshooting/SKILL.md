---
name: troubleshooting
description: Diagnose and resolve build failures, performance issues, and deployment problems using the RAPID framework. Covers TypeScript/build errors, performance bottlenecks, Edge Functions, environment configs. Parallel specialist to fail-fast-debugging (bugs) and root-cause-tracing (code investigation).
---

# Troubleshooting Guide

## Purpose

Systematic diagnosis and resolution of infrastructure-level issues: build failures, performance problems, deployment errors, and environment misconfigurations. Uses the RAPID framework for structured troubleshooting.

## When to Use

Activate this skill for:
- Build/compile errors (TypeScript, Vite, webpack)
- Performance issues (slow queries, memory leaks, N+1)
- Deployment failures (Edge Functions, production errors)
- Environment problems (missing env vars, CORS, auth errors)
- Dependency conflicts (npm, peer dependencies)

## When NOT to Use (Handoffs)

| Symptom | Hand Off To |
|---------|-------------|
| Code bugs (logic errors, wrong behavior) | **fail-fast-debugging** |
| Call chain investigation (where is X set?) | **root-cause-tracing** |
| Code changes after diagnosis | **enforcing-principles** |

---

## RAPID Framework (Overview)

Structured 5-step process for systematic troubleshooting. See `references/rapid-framework.md` for full details.

| Step | Action | Key Question |
|------|--------|-------------|
| **R** - Reproduce | Confirm issue, capture exact error output | Can I reliably trigger this? |
| **A** - Analyze | Parse error messages, identify failing component | What component is failing and why? |
| **P** - Propose | Form hypothesis from error pattern | What is the most likely root cause? |
| **I** - Implement | Apply minimal fix for the hypothesis | What is the smallest change to verify? |
| **D** - Document | Record what worked for future reference | What should the team know? |

---

## Quick Decision Tree

```
Issue reported
  |
  +-- Build fails?
  |     +-- TypeScript error? --> See references/build-errors.md
  |     +-- Vite/bundler error? --> See references/build-errors.md
  |     +-- Dependency error? --> See references/build-errors.md
  |
  +-- HTTP error?
  |     +-- 401? --> Check auth token (references/error-codes.md)
  |     +-- 403? --> Check RLS policies (references/error-codes.md)
  |     +-- 500? --> Check server logs (references/error-codes.md)
  |
  +-- Performance issue?
  |     +-- Slow query? --> Check N+1, add timing (references/rapid-framework.md)
  |     +-- Memory leak? --> Heap profiling (references/rapid-framework.md)
  |     +-- Slow render? --> React DevTools Profiler (references/rapid-framework.md)
  |
  +-- Deployment failure?
  |     +-- Edge Function? --> Check logs, CORS (references/rapid-framework.md)
  |     +-- Env vars? --> Verify .env.local (references/rapid-framework.md)
  |
  +-- Code bug? --> Hand off to fail-fast-debugging
  +-- Need tracing? --> Hand off to root-cause-tracing
```

---

## Quick Diagnostic Commands

```bash
# Full system check
npm run build && npx tsc --noEmit && npm test

# Database connection test
npx supabase db reset --dry-run

# Local stack health
npx supabase status

# Dependency audit
npm audit
npm outdated
```

---

## Common Error Patterns (Quick Reference)

| Error Pattern | Likely Cause | Reference |
|---------------|--------------|-----------|
| `Cannot find module 'X'` | Missing dependency or wrong import path | build-errors.md |
| `Type 'X' is not assignable` | Type mismatch, need cast or fix | build-errors.md |
| `TS2307: Cannot find module` | Bad import path, missing install | build-errors.md |
| `CORS error` | Missing headers in Edge Function | error-codes.md |
| `401 Unauthorized` | Missing or expired auth token | error-codes.md |
| `403 Forbidden` | RLS policy issue | error-codes.md |
| `500 Internal Server Error` | Server-side crash, check logs | error-codes.md |
| `Circular dependency` | Refactor to break the cycle | build-errors.md |
| `out of memory` | Increase Node `--max-old-space-size` | build-errors.md |

---

## Escalation Path

If troubleshooting fails after 2 attempts:

1. **Document findings** - What was tried, what failed
2. **Use mcp__zen__thinkdeep** - For architectural analysis
3. **Check if it's a code bug** - Hand off to fail-fast-debugging
4. **Check if it needs tracing** - Hand off to root-cause-tracing

---

## Related Skills

- **fail-fast-debugging** - For code bugs (logic errors)
- **root-cause-tracing** - For call chain investigation
- **supabase-cli** - For Supabase CLI commands
- **supabase-crm** - For database/RLS patterns
- **verification-before-completion** - Run before claiming "fixed"

---

## Resources

<!-- @resource references/rapid-framework.md "Complete RAPID troubleshooting framework" -->
<!-- @resource references/error-codes.md "Error code reference and resolution patterns" -->
<!-- @resource references/build-errors.md "Build, TypeScript, and dependency error fixes" -->
