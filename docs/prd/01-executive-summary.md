---
**Part of:** Atomic CRM Product Requirements Document
**Document:** Executive Summary
**Category:** Foundation

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Core entity definitions
- 📊 [Success Metrics](./26-success-metrics.md) - KPI targets and evaluation
- 🚀 [Roadmap](./22-roadmap.md) - Implementation phases
- 📚 [Glossary](./27-glossary-appendix.md) - Terminology reference

**Navigation:**
- ⬅️ Previous: [README - Master Index](./00-README.md)
- ➡️ Next: [Data Architecture](./02-data-architecture.md)
---

# PRODUCT REQUIREMENTS DOCUMENT
# Atomic CRM: Principal-Centric Food Distribution Sales Platform

**Version:** 2.0 MVP (Principal-Centric Design)
**Last Updated:** November 5, 2025
**Changes:**
- v2.0: Principal-centric redesign - Dashboard table view, 2 critical reports, Excel replacement focus
- v1.5: Added Round 6 specifications - error handling, monitoring/logging, integration strategy
- v1.4: Added Round 5 specifications - notifications, import/export, dashboard, search
- v1.3: Enhanced opportunity management with trade show handling
- v1.2: Added business process rules and operational requirements
- v1.1: Updated to reflect actual implementation decisions
**Document Owner:** Product Design & Engineering Team

---

## 1. EXECUTIVE SUMMARY

### Overview
Atomic CRM is a web-based CRM system designed to replace Excel-based sales pipeline management for food distribution sales organizations. The platform is optimized for Account Managers who represent 3-5 brand principals (manufacturers) and need to answer one critical question: **"What is the ONE thing I have to do this week for each principal to increase the likelihood of distributors stocking the brand, adding new items, or growing volume on stocked items?"**

**Primary Goal:** Replace Excel within 30 days for a small sales team (2-10 Account Managers).

### Core Design Philosophy: Principal-Centric Workflow

**The Problem:**
Account Managers don't manage hundreds of scattered contacts. They manage **3-5 principals** (brands like Ocean Hugger Foods, Fishpeople Seafood, La Tourangelle) and need to see what needs attention for each principal at a glance.

**The Solution:**
- **Principal-first dashboard:** Table view showing all principals with status indicators
- **Action-oriented:** Focus on "Next Action" and "Stuck?" warnings (30+ days in stage)
- **Filtered by default:** Show only current user's assigned work
- **Simple reporting:** 2 critical reports (Opportunities by Principal, Weekly Activity Summary)
- **Integrated tasks:** Tasks linked to principals with multi-assignment support

### Key Objectives
1. **Centralize Sales Data**: Unified platform replacing Excel spreadsheets
2. **Principal-First Visibility**: Answer "What's my ONE thing for each principal?" in 2 seconds
3. **Activity Tracking**: Account Managers log 10+ activities/week per principal
4. **Tablet Accessibility**: Optimized for Account Manager access via iPad
5. **Team Adoption**: 100% Excel replacement within 30 days

### MVP Scope (3 Core Features)

**1. Principal-Centric Dashboard (6 days)**
- Table view showing all principals at once (not cards/widgets)
- Columns: Principal name, Status (🟢🟡🔴), Next Action, Stuck? (30+ days), Last Activity
- Filtered by default to current user's primary account manager assignments
- Auto-refresh every 5 minutes

**2. Critical Reports (4 days)**
- Opportunities by Principal Report (⭐ HIGHEST PRIORITY)
- Weekly Activity Summary Report (Track 10+ activities/week goal)
- CSV export for offline analysis

**3. Tasks + Activities Integration (8-9 days)**
- Full resource module (not embedded widget)
- Multi-assignment: Primary/Secondary/Tertiary Account Managers
- Optional activity logging when tasks completed
- Priority field deferred (use due date only for MVP)

**Total Implementation:** 18-21 days for MVP

### What We're NOT Building (Deferred to Post-MVP)

**Cut Features:**
- ❌ Global search bar (module-level search sufficient)
- ❌ OAuth integration (Google/Microsoft SSO)
- ❌ Two-factor authentication (2FA/TOTP)
- ❌ Offline mode (trade show capability)
- ❌ vCard export (CSV sufficient)
- ❌ Performance monitoring dashboards (Web Vitals)
- ❌ Analytics integration (Google Analytics)
- ❌ Pipeline Status Report (Opportunities by Principal answers same questions)
- ❌ Customizable dashboards (fixed table for consistency)
- ❌ Charts/visualizations on dashboard (table only)
- ❌ Task priority field (use due date)

**Rationale:** Focus on Excel replacement first. Enterprise features come after team proves they'll adopt the CRM consistently.

### Success Metrics

**Primary Metric:**
- ✅ **Excel Replacement in 30 Days**: 100% of sales team stops using Excel for pipeline management

**Secondary Metrics:**
- Dashboard adoption: 3-5 views per user per day (morning, midday, EOD)
- Activity tracking: 10+ activities logged per Account Manager per week
- Principal coverage: 100% of opportunities have principal assigned
- Report usage: Each critical report run 2-3x per week minimum
- Response time: "What's my ONE thing for Principal X?" answerable in < 2 seconds

**User Satisfaction:**
- 4/5 rating in post-implementation survey
- Declining CSV export frequency (sign they trust the UI)
- Time to answer principal status: < 10 seconds (vs 5+ minutes in Excel)

**Technical Metrics:**
- Performance: <2s initial page load, <500ms interaction response
- Accessibility: WCAG 2.1 AA compliance
- Test coverage: 65% minimum
- Uptime: 99.5% availability

---

## 2. TARGET USERS & USE CASES

### Primary Users: Account Managers
**Role:** Account Managers managing 3-5 brand principals (manufacturers)
**Daily Workflow:**
1. Morning: Check dashboard for urgent principals (🔴 red status)
2. Midday: Log activities (calls, emails, meetings)
3. EOD: Review tasks and plan next day's actions

**Key Questions They Ask:**
- "What's the ONE thing I need to do this week for each principal?"
- "Which principals are stuck (30+ days in same stage)?"
- "What did I accomplish this week?" (activity summary)

### Secondary Users: Sales Managers
**Role:** Oversee 2-10 Account Managers, review weekly activity
**Key Questions:**
- "Is everyone actively working their principals?" (10+ activities/week)
- "Which opportunities are stuck across the team?"
- "Are all principals being covered?"

### Use Cases

**Primary Use Case: Morning Dashboard Check**
1. Account Manager logs in
2. Dashboard shows table of 3-5 principals
3. Identifies urgent principal (🔴 red, 45 days stuck, last activity 12 days ago)
4. Clicks "Next Action" to see task (e.g., "Demo at Roka")
5. Completes task, optionally logs activity
6. Principal status updates to 🟢 green

**Secondary Use Case: Weekly Activity Review**
1. Sales Manager runs Weekly Activity Summary report
2. Sees John logged 18 activities, Jane logged 6 activities
3. Discusses with Jane why activity is low
4. Sets goal: Minimum 10 activities/week per Account Manager

---

## 3. BUSINESS CONTEXT

### Current State (Excel-Based)
- **Data scattered:** Multiple Excel files per Account Manager
- **No real-time visibility:** Manual updates, formulas break
- **Hard to report:** 5+ minutes to answer "What's the status of Principal X?"
- **No activity tracking:** Calls/emails not logged anywhere
- **Collaboration difficult:** Emailing files back and forth

### Future State (Atomic CRM)
- **Centralized:** Single source of truth for all principals
- **Real-time:** Dashboard updates every 5 minutes
- **Fast reporting:** 2-second answer to "What's my ONE thing for Principal X?"
- **Activity tracking:** All calls/emails/meetings logged with timestamps
- **Team visibility:** Managers see all Account Manager activity

### Competitive Advantages
1. **Principal-first design:** Unique focus on brand principals (not generic "deals")
2. **Simplicity:** No bloat, just what's needed for Excel replacement
3. **Speed:** 2-second dashboard insights vs 5+ minutes in Excel
4. **Accountability:** 10+ activities/week goal visible to managers
5. **iPad-optimized:** Field sales access during customer visits

---

## 4. TECHNICAL APPROACH

### Architecture
- **Frontend:** React 19 + Vite + TypeScript + React Admin
- **Backend:** Supabase (PostgreSQL + Edge Functions + Storage)
- **Design System:** Tailwind v4 with semantic color tokens
- **State Management:** TanStack Query for caching
- **Forms:** React Hook Form with Zod validation

### Key Technical Decisions
1. **Single source of truth:** Supabase only (no external analytics in MVP)
2. **Fail-fast:** No retry logic, circuit breakers, or graceful fallbacks
3. **Form state from schema:** `zodSchema.partial().parse({})` for defaults
4. **Two-layer security:** GRANT + RLS policies for all tables
5. **No over-engineering:** Build for pre-launch velocity, not resilience

### Deployment
- **Hosting:** Vercel (frontend) + Supabase Cloud (backend)
- **Environments:** Local development + Production only (no staging for MVP)
- **Database:** PostgreSQL 15 with Row Level Security (RLS)
- **CI/CD:** GitHub Actions for tests, Vercel for auto-deploy

---

## 5. CONSTRAINTS & ASSUMPTIONS

### Constraints
- **Team size:** 2-10 Account Managers (small team, shared data)
- **Timeline:** 18-21 days for MVP implementation
- **Budget:** Minimal (Supabase free tier, Vercel hobby plan)
- **Device:** iPad-first design (primary device for field sales)

### Assumptions
- Account Managers will log 10+ activities/week if it's easy
- Principal-centric view more useful than contact-centric
- CSV export sufficient for offline analysis (no Excel integration)
- 30 days stuck = problem (average sales cycle 2-4 weeks)
- Module-level search sufficient (no global search needed)

---

## 6. RISKS & MITIGATION

### Risk 1: Team Won't Adopt CRM
**Mitigation:**
- Focus on Excel replacement (what they know)
- 2-second dashboard insights (faster than Excel)
- Activity tracking shows accountability (managers enforce)

### Risk 2: Dashboard Too Simplistic
**Mitigation:**
- Fixed table ensures everyone sees principals the same way
- Consistency over customization (prevents confusion)
- Can add charts later if requested

### Risk 3: Missing Features Block Adoption
**Mitigation:**
- Cut ruthlessly (OAuth, 2FA, offline, global search all deferred)
- Focus on 3 core features only
- Add features in Phase 2 based on real feedback

---

## 7. APPENDIX

### Terminology
- **Principal:** Brand or manufacturer (e.g., Ocean Hugger Foods, Fishpeople Seafood)
- **Account Manager:** Sales representative managing 3-5 principals
- **Stuck:** Opportunity in same stage for 30+ days
- **Activity:** Logged interaction (call, email, meeting, note)

### Cross-References
- Full data architecture: [02-data-architecture.md](./02-data-architecture.md)
- Success metrics detail: [26-success-metrics.md](./26-success-metrics.md)
- Implementation roadmap: [22-roadmap.md](./22-roadmap.md)
- Principal-centric design: [docs/plans/2025-11-05-principal-centric-crm-design.md](../plans/2025-11-05-principal-centric-crm-design.md)

---

**Document Status:** APPROVED - Ready for Implementation
**Last Reviewed:** November 5, 2025 (stakeholder approval received)
**Next Review:** After MVP launch (30 days from deployment)
