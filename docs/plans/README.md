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

### 🚨 **Phase 1: CRITICAL (5 minutes)**

Execute these BEFORE production deployment:

1. **[Fix vCard Export Documentation](./2025-11-04-fix-vcard-export-docs.md)** (5 min)
   - Removes incorrect PRD claims

---

### 🔥 **Phase 2: HIGH PRIORITY (13-15 days)**

Complete within 2 weeks of launch:

2. **[OpportunitiesByPrincipal Report](./2025-11-04-opportunities-by-principal-report.md)** (2 days)
   - ⭐ Highest priority report in PRD

3. **[User Adoption Tracking](./2025-11-04-user-adoption-tracking.md)** (3 days) ⚠️ **SECURITY UPDATED**
   - DAU metrics dashboard
   - **Updated:** TWO-LAYER SECURITY + GDPR compliance

4. **[Global Search Bar](./2025-11-04-global-search-bar.md)** (3 days) ⚠️ **SECURITY PENDING**
   - Unified cross-module search
   - **Requires:** Input validation via Zod schema (see SECURITY-ADDENDUM)

5. **[Complete Reports Module](./2025-11-04-complete-reports-module.md)** (3 days)
   - Weekly Activity Summary + Pipeline Status reports

6. **[Offline Mode](./2025-11-04-offline-mode.md)** (5-7 days)
   - Service Worker + IndexedDB for trade shows

---

### ⚙️ **Phase 3: MEDIUM PRIORITY (13-17 days)**

Enterprise features:

7. **[OAuth Integration](./2025-11-04-oauth-integration.md)** (5 days) ⚠️ **SECURITY PENDING**
   - Google + Microsoft SSO
   - **Requires:** Redirect validation (see SECURITY-ADDENDUM)

8. **[Tasks Full Module](./2025-11-04-tasks-full-module.md)** (5-7 days)
   - Elevate from widget to full resource

9. **[Activity Auto-Generation](./2025-11-04-activity-auto-generation.md)** (3 days)
   - Database triggers for audit trail

---

### 🔧 **Phase 4: LOW PRIORITY (10-12 days)**

Feature completeness:

10. **[Products Import/Export](./2025-11-04-products-import-export.md)** (3 days)
    - CSV import/export for products catalog

11. **[vCard Export Implementation](./2025-11-04-vcard-export-implementation.md)** (2 days)
    - Contact vCard generation (.vcf files)

12. **[Two-Factor Authentication](./2025-11-04-two-factor-auth.md)** (4 days) ⚠️ **SECURITY UPDATED**
    - TOTP with QR codes
    - **Updated:** Crypto-secure backup codes

13. **[Data Quality Widget](./2025-11-04-data-quality-widget.md)** (2 days)
    - Real-time completeness monitoring

---

### 📋 **Phase 5: DOCUMENTATION (1.5 days)**

14. **[Incident Response Playbook](./2025-11-04-incident-response-playbook.md)** (1 day)
    - Security & operational incident procedures

15. **[Manual Rollback Documentation](./2025-11-04-manual-rollback-docs.md)** (2 hours)
    - Operator recovery guide

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

| Priority | Tasks | Original Estimate | Updated Estimate | Difference |
|----------|-------|------------------|------------------|------------|
| CRITICAL | 3 | 4 hours | 4 hours | - |
| HIGH | 5 | 13 days | 15 days | +2 days |
| MEDIUM | 5 | 23-25 days | 25-27 days | +2 days |
| LOW | 4 | 10 days | 12 days | +2 days |
| DOCS | 2 | 1.5 days | 1.5 days | - |
| **TOTAL** | **19** | **52-62 days** | **58-70 days** | **+6-8 days** |

**Reason for increase:** Security hardening (RLS policies, crypto fixes, GDPR compliance)

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
