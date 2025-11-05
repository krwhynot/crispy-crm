# PRD Completion - Master Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement individual plans task-by-task.

**Created:** November 4, 2025
**Analysis Source:** docs/PRD_IMPLEMENTATION_STATUS_ROLLUP.md
**Current Completion:** 85-90% overall

**Goal:** Complete all remaining PRD requirements to achieve 100% implementation coverage

**Approach:** Prioritized execution with critical pre-launch fixes first, followed by high-impact post-launch features

---

## Executive Summary

**Total Remaining Tasks:** 17 implementation tasks + 2 documentation tasks
**Estimated Total Effort:** 52-62 days
**Critical Path:** 4 hours (pre-launch blockers)
**High Priority Path:** 13 days (post-launch must-haves)

**Key Insight:** The codebase is production-ready (85-90% complete) with excellent core functionality. Remaining work focuses on monitoring integration, user adoption metrics, and feature completeness.

---

## 🚨 CRITICAL - Pre-Launch (5 minutes)

### Task 1: Fix vCard Export Documentation
**File:** `docs/plans/2025-11-04-fix-vcard-export-docs.md`
**Time:** 5 minutes (docs only) OR 2 days (with implementation)
**Priority:** CRITICAL
**Blocker:** No - Documentation inconsistency

**Why Critical:** PRD claims feature is complete (05-contacts-module.md lines 27, 33, 39) but no implementation exists.

**Options:**
1. **Remove claim** from PRD (5 min) - RECOMMENDED
2. **Implement vCard export** (2 days) - See LOW PRIORITY section

---

## 🔥 HIGH PRIORITY - Post-Launch (13 days)

### Task 2: OpportunitiesByPrincipal Report Page ⭐
**File:** `docs/plans/2025-11-04-opportunities-by-principal-report.md`
**Time:** 2 days
**Priority:** HIGH (marked ⭐ in PRD)
**Blocker:** No - Dashboard widget exists, reuse logic

**Why High:** HIGHEST PRIORITY REPORT in PRD (09-reports.md). Dashboard widget exists, need dedicated report page with filtering and export.

**Components:**
1. Report page component with advanced filtering
2. Export to CSV functionality
3. Integration with reports menu
4. Tests (unit + integration)

**Current State:**
- ✅ Dashboard widget: `src/atomic-crm/dashboard/OpportunitiesByPrincipal.tsx`
- ✅ CSV export infrastructure: 100% ready
- ❌ Dedicated report page: Missing

---

### Task 3: User Adoption Tracking Dashboard
**File:** `docs/plans/2025-11-04-user-adoption-tracking.md`
**Time:** 2 days
**Priority:** HIGH
**Blocker:** No - New feature

**Why High:** Cannot measure #1 PRD success metric (100% team adoption in 60 days) without this.

**Components:**
1. Daily active users (DAU) tracking
2. Login frequency per team member
3. Last login timestamp display
4. Dashboard widget showing adoption metrics
5. Database queries for user activity

**Current State:**
- ❌ No DAU tracking (0%)
- ✅ Auth infrastructure exists (Supabase Auth)
- ⚠️ Security monitor has auth tracking but in-memory only

---

### Task 4: Global Search Bar
**File:** `docs/plans/2025-11-04-global-search-bar.md`
**Time:** 2 days
**Priority:** HIGH
**Blocker:** No - Module search exists, extend it

**Why High:** Better UX, PRD requirement (11-search-filtering.md). Module-level search is 100% complete, need unified global search.

**Components:**
1. Global search bar in top navigation
2. Unified results page (cross-module search)
3. Search history (last 10, localStorage)
4. Integration with existing module search
5. Tests

**Current State:**
- ✅ Module-level search: 100% (all 4 core modules)
- ❌ Global search bar: 0%
- ❌ Unified results page: 0%

---

### Task 5: Complete Reports Module
**File:** `docs/plans/2025-11-04-complete-reports-module.md`
**Time:** 3 days
**Priority:** HIGH
**Blocker:** No - Infrastructure ready

**Why High:** Reports module is 40% complete (infrastructure + 1 widget, but 0 report pages).

**Components:**
1. Weekly Activity Summary report page (1.5 days)
2. Pipeline Status Report page (1.5 days)
3. Integration with reports menu
4. Tests (unit + integration)

**Current State:**
- ✅ CSV export infrastructure: 100%
- ✅ OpportunitiesByPrincipal widget: 100%
- ❌ Dedicated report pages: 0 of 3

---

### Task 6: Offline Mode Implementation
**File:** `docs/plans/2025-11-04-offline-mode.md`
**Time:** 3-5 days
**Priority:** HIGH
**Blocker:** No - Fully planned, needs implementation

**Why High:** Trade show use case (PRD 20-performance-security.md). 527-line spike document exists with complete design.

**Components:**
1. Service Worker implementation
2. Cache API for static assets
3. IndexedDB for structured data (last 100 viewed records)
4. Offline indicator UI
5. Background sync when online
6. Tests (unit + E2E)

**Current State:**
- ❌ Implementation: 0%
- ✅ Planning: 100% (docs/spikes/2024-11-03-service-worker-strategy.md - 527 lines)
- ✅ PWA manifest: exists

**Reference:** Spike document has complete architecture decisions

---

## ⚙️ MEDIUM PRIORITY - Post-Launch (23-25 days)

### Task 7: OAuth Integration (Google + Microsoft)
**File:** `docs/plans/2025-11-04-oauth-integration.md`
**Time:** 4 days (2 days Google + 2 days Microsoft)
**Priority:** MEDIUM
**Blocker:** No - Email/password works

**Why Medium:** Enterprise authentication requirement. Current email/password is 100% functional.

**Components:**
1. Google OAuth provider (2 days)
2. Microsoft OAuth provider (2 days)
3. Provider selection UI
4. Tests (auth flow, session management)

**Current State:**
- ✅ Email/password: 100% (Supabase Auth)
- ❌ OAuth: 0%

---

### Task 8: Elevate Tasks to Full Resource Module
**File:** `docs/plans/2025-11-04-tasks-full-module.md`
**Time:** 5-7 days
**Priority:** MEDIUM
**Blocker:** No - Widget is functional

**Why Medium:** Tasks module is 65% complete (dashboard widget only). Widget approach works for MVP, full module is polish.

**Components:**
1. TaskList page (2 days)
2. TaskShow detail page (1 day)
3. TaskCreate standalone page (1 day)
4. index.ts module exports (30 min)
5. Priority/opportunity association UI (1 day)
6. Tests (unit + integration) (1-2 days)

**Current State:**
- ✅ Dashboard widget: Functional (add/edit/delete)
- ❌ Standalone pages: Missing
- ❌ Resource registration: Not in CRM.tsx

---

### Task 9: Activity Auto-Generation
**File:** `docs/plans/2025-11-04-activity-auto-generation.md`
**Time:** 3 days
**Priority:** MEDIUM
**Blocker:** No - Manual logging works

**Why Medium:** Automatic audit trail for opportunity lifecycle. Manual logging is 100% functional.

**Components:**
1. Database triggers for stage changes
2. Database triggers for status changes
3. Activity entry formatting
4. Integration with existing activities table
5. Tests (trigger behavior, data integrity)

**Current State:**
- ✅ Manual activity logging: 100%
- ❌ Auto-generation: 0%
- ✅ Database infrastructure: Ready

---

## 🔧 LOW PRIORITY - Future Enhancements (15 days)

### Task 10: Products Import/Export
**File:** `docs/plans/2025-11-04-products-import-export.md`
**Time:** 3 days
**Priority:** LOW
**Blocker:** No - Contacts/Orgs have it

**Components:**
1. CSV import for products (1.5 days)
2. CSV export for products (1 day)
3. Validation and error handling (0.5 days)
4. Tests

**Current State:**
- ✅ Contacts/Organizations import/export: 100%
- ❌ Products import/export: 0%

---

### Task 11: vCard Export Implementation
**File:** `docs/plans/2025-11-04-vcard-export-implementation.md`
**Time:** 2 days
**Priority:** LOW
**Blocker:** No - Nice-to-have feature

**Note:** Only implement if Task 2 chose "implement" over "remove claim"

**Components:**
1. vCard library integration (vcard-creator or similar)
2. Contact data formatting to vCard 3.0/4.0
3. Download functionality
4. Export button in contacts UI
5. Tests

**Current State:**
- ❌ Implementation: 0% (PRD claims complete but missing)

---

### Task 12: Two-Factor Authentication
**File:** `docs/plans/2025-11-04-two-factor-auth.md`
**Time:** 3 days
**Priority:** LOW
**Blocker:** No - Security enhancement

**Components:**
1. TOTP integration (Google Authenticator, Authy)
2. QR code generation for 2FA setup
3. Backup codes generation
4. 2FA enforcement UI
5. Tests (auth flow, recovery)

**Current State:**
- ✅ Supabase Auth: Supports 2FA via API
- ❌ UI implementation: 0%

---

### Task 13: Data Quality Dashboard Widget
**File:** `docs/plans/2025-11-04-data-quality-widget.md`
**Time:** 2 days
**Priority:** LOW
**Blocker:** No - Pre-migration scripts exist

**Components:**
1. Real-time data quality queries
2. Dashboard widget showing completeness scores
3. Drill-down by entity type
4. Alert thresholds for quality issues
5. Tests

**Current State:**
- ✅ Pre-migration validation: `scripts/validation/data-quality.js` (1,031 lines)
- ❌ Real-time monitoring: 0%

---

## 📋 DOCUMENTATION TASKS (1.5 days)

### Task 14: Incident Response Playbook
**File:** `docs/plans/2025-11-04-incident-response-playbook.md`
**Time:** 1 day
**Priority:** MEDIUM
**Blocker:** No - Operations documentation

**Components:**
1. Security incident procedures
2. Data breach notification process
3. Database corruption recovery steps
4. Escalation contacts and procedures
5. Recovery time objectives (RTO/RPO)

**Current State:**
- ❌ Incident response: Not documented
- ✅ Database rollback: Documented in deploy-safe.sh

---

### Task 15: Manual Rollback Procedure Documentation
**File:** `docs/plans/2025-11-04-manual-rollback-docs.md`
**Time:** 2 hours
**Priority:** LOW
**Blocker:** No - Automatic rollback works

**Components:**
1. Step-by-step manual rollback guide
2. Verification checklist after rollback
3. Common rollback scenarios
4. Troubleshooting failed rollbacks

**Current State:**
- ✅ Automatic rollback: Implemented in deploy-safe.sh
- ⚠️ Manual procedure: Partially documented
- ❌ Operator guide: Missing

---

## 🎯 RECOMMENDED EXECUTION ORDER

### Phase 1: Pre-Launch Critical Path (4 hours)
**Must complete before production deployment**

```bash
# Day 1 Morning (5 minutes)
1. Fix vCard export docs (5 min)
```

**Deliverable:** Production-ready monitoring and documentation accuracy

---

### Phase 2: High-Impact Post-Launch (2 weeks)
**Complete within 2 weeks of launch**

```bash
# Week 1
Monday-Tuesday: OpportunitiesByPrincipal report page (2 days)
Wednesday-Thursday: User adoption tracking (2 days)
Friday: Global search bar (day 1 of 2)

# Week 2
Monday: Global search bar (day 2 of 2)
Tuesday-Thursday: Complete reports module (3 days)
```

**Deliverable:** Complete Reports module (40% → 100%), user adoption metrics, global search

---

### Phase 3: Offline Mode Sprint (1 week)
**Trade show preparation**

```bash
# Week 3
Monday-Friday: Offline mode implementation (3-5 days)
```

**Deliverable:** Read-only offline mode with Service Worker

---

### Phase 4: Authentication & Automation (1.5 weeks)
**Enterprise readiness**

```bash
# Week 4
OAuth integration (4 days)
Activity auto-generation (3 days)
```

**Deliverable:** OAuth SSO, automatic audit trail

---

### Phase 5: Module Completeness (1-2 weeks)
**Architecture polish**

```bash
# Week 6-7
Tasks full module elevation (5-7 days)
```

**Deliverable:** Tasks elevated from widget to full resource module

---

### Phase 6: Low Priority Enhancements (2-3 weeks)
**Feature completeness**

```bash
# Week 8-10
Products import/export (3 days)
vCard export (2 days, if chosen)
Two-factor auth (3 days)
Data quality widget (2 days)
Incident response playbook (1 day)
```

**Deliverable:** 100% PRD completion

---

## 📊 EFFORT SUMMARY

| Priority | Tasks | Total Effort | Deliverable |
|----------|-------|-------------|-------------|
| **CRITICAL** | 3 | 4 hours | Production monitoring |
| **HIGH** | 5 | 13 days | Core completeness |
| **MEDIUM** | 5 | 23-25 days | Enterprise features |
| **LOW** | 4 | 10 days | Polish |
| **DOCS** | 2 | 1.5 days | Operations |
| **TOTAL** | 19 | 52-62 days | 100% PRD |

---

## 🚀 NEXT STEPS

### Option 1: Execute Critical Path Immediately
**Recommended for pre-launch**

```bash
# In this session, execute Phase 1 tasks sequentially
# Use superpowers:subagent-driven-development for parallel execution
```

**Benefits:**
- Production-ready in 4 hours
- Unblocks launch
- Quick wins with high impact

---

### Option 2: Create Detailed Plans for All Tasks
**Recommended for comprehensive planning**

I can create individual detailed implementation plans (with exact code, tests, file paths) for:
- All 3 CRITICAL tasks (immediate execution)
- All 5 HIGH priority tasks (post-launch roadmap)
- Selected MEDIUM/LOW tasks (as needed)

**Each plan will include:**
- Exact file paths (create/modify)
- Complete code examples (not pseudocode)
- Test-driven development steps
- Verification commands with expected output
- Commit messages following conventional commits

---

### Option 3: Execute High-Priority Tasks in Parallel
**Recommended for post-launch velocity**

Use separate worktrees or parallel subagent sessions to implement:
- OpportunitiesByPrincipal report (Agent A)
- User adoption tracking (Agent B)
- Global search bar (Agent C)

**Benefits:**
- Parallel development reduces calendar time
- Independent features minimize conflicts
- Fresh context per agent

---

## 📁 INDIVIDUAL PLAN LOCATIONS

When generated, individual plans will be saved to:

```
docs/plans/
├── 2025-11-04-prd-completion-master-plan.md (this file)
├── 2025-11-04-fix-vcard-export-docs.md
├── 2025-11-04-opportunities-by-principal-report.md
├── 2025-11-04-user-adoption-tracking.md
├── 2025-11-04-global-search-bar.md
├── 2025-11-04-complete-reports-module.md
├── 2025-11-04-offline-mode.md
├── 2025-11-04-oauth-integration.md
├── 2025-11-04-tasks-full-module.md
├── 2025-11-04-activity-auto-generation.md
├── 2025-11-04-products-import-export.md
├── 2025-11-04-vcard-export-implementation.md
├── 2025-11-04-two-factor-auth.md
├── 2025-11-04-data-quality-widget.md
├── 2025-11-04-incident-response-playbook.md
└── 2025-11-04-manual-rollback-docs.md
```

---

## 🎯 DECISION POINT

**What would you like to do next?**

1. **Execute Critical Path** (4 hours) - Production monitoring setup
2. **Generate All Detailed Plans** (19 individual plans with complete code)
3. **Generate High Priority Plans Only** (5 detailed plans)
4. **Execute Specific Task** (choose task number from above)

Let me know your choice, and I'll proceed accordingly!

---

**Analysis Source:** docs/PRD_IMPLEMENTATION_STATUS_ROLLUP.md
**Codebase Version:** main branch (commit 3061bf7)
**Plan Author:** Claude Code (AI Agent)
**Plan Date:** November 4, 2025
