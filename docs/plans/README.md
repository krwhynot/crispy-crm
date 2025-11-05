# Implementation Plans - Engineering Constitution Compliant

**Last Updated:** November 5, 2025
**Total Plans:** 15 + Security Addendum
**Status:** Ready for implementation with security hardening

---

## ⚠️ REQUIRED READING

**Before implementing ANY plan, read:**
1. **[SECURITY-ADDENDUM.md](./SECURITY-ADDENDUM.md)** - Critical security fixes aligned with Engineering Constitution
2. **[Engineering Constitution](../claude/engineering-constitution.md)** - Core principles that override default patterns

---

## Implementation Order

### 🎯 **Phase 1: MVP - Principal-Centric Design (18-21 days)**

**Excel Replacement Goal:** Complete within 30 days

1. **[Principal-Centric Dashboard](./2025-11-04-principal-centric-dashboard.md)** (6 days)
   - Table view showing all principals with status tracking
   - Core question: "What's the ONE thing to do for each principal?"

2. **[OpportunitiesByPrincipal Report](./2025-11-04-opportunities-by-principal-report.md)** (2 days)
   - ⭐ Highest priority report in PRD

3. **[Complete Reports Module](./2025-11-04-complete-reports-module.md)** (3 days)
   - Weekly Activity Summary report (Pipeline Status deferred to Post-MVP)

4. **[Tasks Full Module](./2025-11-04-tasks-full-module.md)** (5-7 days)
   - Multi-assignment model (primary/secondary/tertiary)
   - Activity integration
   - Elevate from widget to full resource

5. **[Activity Auto-Generation](./2025-11-04-activity-auto-generation.md)** (3 days)
   - Database triggers for audit trail

---

### 🚨 **Phase 2: CRITICAL FIXES (5 minutes)**

Execute these BEFORE production deployment:

1. **[Fix vCard Export Documentation](./2025-11-04-fix-vcard-export-docs.md)** (5 min)
   - Removes incorrect PRD claims

---

### 🔧 **Phase 3: REMAINING FEATURES (5 days)**

10. **[Products Import/Export](./2025-11-04-products-import-export.md)** (3 days)
    - CSV import/export for products catalog

11. **[Data Quality Widget](./2025-11-04-data-quality-widget.md)** (2 days)
    - Real-time completeness monitoring

---

### 📋 **Phase 4: DOCUMENTATION (1.5 days)**

12. **[Incident Response Playbook](./2025-11-04-incident-response-playbook.md)** (1 day)
    - Security & operational incident procedures

13. **[Manual Rollback Documentation](./2025-11-04-manual-rollback-docs.md)** (2 hours)
    - Operator recovery guide

---

### ⏸️ **DEFERRED - Post-MVP**

**These features are deferred to Phase 2+ per principal-centric redesign (v2.0):**

14. **[User Adoption Tracking](./2025-11-04-user-adoption-tracking.md)** (3 days) ⚠️ **SECURITY UPDATED**
    - DAU metrics dashboard
    - **Updated:** TWO-LAYER SECURITY + GDPR compliance
    - **Deferred:** Not critical for Excel replacement goal

15. **[Global Search Bar](./2025-11-04-global-search-bar.md)** (3 days) ⚠️ **SECURITY PENDING**
    - Unified cross-module search
    - **Requires:** Input validation via Zod schema (see SECURITY-ADDENDUM)
    - **Deferred:** Module-level search sufficient for MVP

16. **[Offline Mode](./2025-11-04-offline-mode.md)** (5-7 days)
    - Service Worker + IndexedDB for trade shows
    - **Deferred:** Trade show use case, not critical for Excel replacement

17. **[OAuth Integration](./2025-11-04-oauth-integration.md)** (5 days) ⚠️ **SECURITY PENDING**
    - Google + Microsoft SSO
    - **Requires:** Redirect validation (see SECURITY-ADDENDUM)
    - **Deferred:** Email/password sufficient for small team MVP

18. **[vCard Export Implementation](./2025-11-04-vcard-export-implementation.md)** (2 days)
    - Contact vCard generation (.vcf files)
    - **Deferred:** CSV export sufficient for MVP

19. **[Two-Factor Authentication](./2025-11-04-two-factor-auth.md)** (4 days) ⚠️ **SECURITY UPDATED**
    - TOTP with QR codes
    - **Updated:** Crypto-secure backup codes
    - **Deferred:** Security enhancement, not critical for small team MVP

---

## Security Status

### ✅ **Secured (Constitution-Compliant)**

- **Plan 3** (User Adoption Tracking)
  - TWO-LAYER SECURITY implemented
  - GDPR data retention added
  - Effort: 2 days → 3 days

- **Plan 12** (Two-Factor Authentication)
  - Crypto-secure backup codes (Web Crypto API)
  - Effort: 3 days → 4 days

### ⚠️ **Pending Security Updates**

Apply fixes from [SECURITY-ADDENDUM.md](./SECURITY-ADDENDUM.md) before implementing:

- **Plan 4** (Global Search) - Add Zod validation schema
- **Plan 7** (OAuth) - Add redirect URL validation

---

## Effort Summary

### MVP Timeline (Principal-Centric Design)

| Phase | Tasks | Estimate |
|-------|-------|----------|
| **Phase 1: MVP Core** | 5 | 18-21 days |
| **Phase 2: Critical Fixes** | 1 | 5 minutes |
| **Phase 3: Remaining Features** | 2 | 5 days |
| **Phase 4: Documentation** | 2 | 1.5 days |
| **TOTAL MVP PATH** | **10** | **~25 days** |

### Deferred to Post-MVP

| Feature Category | Tasks | Estimate |
|-----------------|-------|----------|
| **Deferred Features** | 6 | 22-28 days |

**Excel Replacement Goal:** MVP path completable within 30 days

**Reason for timeline reduction:** Focused on principal-centric core features only. User Adoption Tracking, Global Search, Offline Mode, OAuth, vCard, and 2FA deferred to Phase 2+

---

## Engineering Constitution Checklist

Before implementing ANY plan, verify:

- [ ] **NO OVER-ENGINEERING** - No retry logic, circuit breakers, or graceful fallbacks
- [ ] **SINGLE SOURCE OF TRUTH** - Supabase only, Zod validation at API boundary
- [ ] **BOY SCOUT RULE** - Fix inconsistencies when editing files
- [ ] **VALIDATION** - Zod schemas in `src/atomic-crm/validation/`
- [ ] **FORM STATE FROM SCHEMA** - Use `zodSchema.partial().parse({})` for defaults
- [ ] **TYPESCRIPT** - `interface` for objects, `type` for unions
- [ ] **FORMS** - Use React Admin components (never raw HTML inputs)
- [ ] **SEMANTIC COLORS** - CSS variables only (never hex codes)
- [ ] **MIGRATIONS** - Use `npx supabase migration new <name>` for timestamps
- [ ] **TWO-LAYER SECURITY** - GRANT permissions + RLS policies for all tables

---

## Quick Start

### Execute Critical Path (Production-Ready in 5 Minutes)

```bash
# Phase 1: Critical tasks
cd /path/to/atomic-crm

# Task 1: Fix vCard Export Docs (5 min)
# See: 2025-11-04-fix-vcard-export-docs.md
```

### Execute with Subagent (Recommended)

```bash
# Use superpowers:executing-plans skill
# Example: Execute Plan 5 with security fixes

# Opens plan, reviews critically, executes tasks in batches
```

---

## Validation Commands

After implementing plans, verify compliance:

```bash
# Color system compliance
npm run validate:colors

# Database migration format
ls supabase/migrations/ | grep -E "^[0-9]{14}_"

# RLS policies exist
psql $DATABASE_URL -c "\d user_activity_log" | grep POLICY

# Crypto usage (should return nothing)
grep -r "Math.random()" src/atomic-crm/

# Zod validation at boundary
grep -r "safeParse" src/atomic-crm/
```

---

## Support

- **Engineering Constitution:** [docs/claude/engineering-constitution.md](../claude/engineering-constitution.md)
- **Security Fixes:** [SECURITY-ADDENDUM.md](./SECURITY-ADDENDUM.md)
- **Database Security:** [Database Security (CLAUDE.md)](../../CLAUDE.md#database-security)
- **Color System:** [Color Theming Architecture](../internal-docs/color-theming-architecture.docs.md)

---

**Created:** November 4, 2025
**Updated for Security:** November 5, 2025
**Plan Author:** Claude Code (AI Agent)
**Engineering Constitution:** Required Reading
