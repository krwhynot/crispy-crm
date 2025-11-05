# PRD Update Checklist - Principal-Centric CRM

**Date:** November 5, 2025
**Purpose:** Align all PRD files with approved principal-centric design

---

## Changes Required

### 1. Terminology Updates (ALL FILES)
- [x] Find/replace: "Sales Rep" → "Account Manager"
- [x] Find/replace: "sales rep" → "account manager"
- [x] Note: Database `sales` table name stays unchanged

### 2. Major Feature Changes

#### Dashboard (14-dashboard.md) - COMPLETE REWRITE
- [ ] Remove: All 13 widget descriptions
- [ ] Add: Principal-centric table view design
- [ ] Add: Focus on "What's the ONE thing for each principal?"
- [ ] Update: Screenshots/wireframes

#### Reports (09-reports.md) - SCOPE REDUCTION
- [ ] MVP Reports: Only 2 (not 3+)
  - Opportunities by Principal (CRITICAL)
  - Weekly Activity Summary (CRITICAL)
- [ ] Deferred: Pipeline Status Report (post-launch)
- [ ] Remove: Any other reports not in design

#### Tasks (08-tasks-widget.md) - UPGRADE TO FULL MODULE
- [ ] Rename file: 08-tasks-widget.md → 08-tasks-module.md
- [ ] Update: From embedded widget to full resource
- [ ] Add: Multi-assignment model (primary/secondary/tertiary account managers)
- [ ] Remove: Priority field (deferred to post-MVP)
- [ ] Add: Activity integration

### 3. Cut Features (Mark as "Post-MVP" or "Deferred")

#### Search (10/11-search.md)
- [ ] Module-level search: Keep (already implemented)
- [ ] Global search bar: Mark as DEFERRED
- [ ] Update: "MVP uses module search only"

#### Authentication (03/13-authentication.md)
- [ ] Email/password: Keep (implemented)
- [ ] OAuth (Google/Microsoft): Mark as DEFERRED
- [ ] 2FA/TOTP: Mark as DEFERRED

#### Performance Monitoring (17-performance.md or 24-monitoring-logging.md)
- [ ] Remove: Web Vitals / performance monitoring framework
- [ ] Remove: Analytics integration (Google Analytics)
- [ ] Keep: Basic error logging only

#### Offline Mode (likely in 17-performance.md)
- [ ] Mark as DEFERRED
- [ ] Note: "Post-MVP trade show capability"

#### vCard Export (05-contacts-module.md)
- [ ] Remove: vCard export claims
- [ ] Update: CSV export only

### 4. Success Metrics (26-success-metrics.md)
- [ ] Update: Primary metric = "Excel replacement in 30 days"
- [ ] Remove: Metrics requiring features we cut (global search speed, offline performance)
- [ ] Add: Principal-focused metrics:
  - "Can answer 'What's my ONE thing for Principal X?' in 2 seconds"
  - "Account Managers log 10+ activities/week"
  - "All opportunities have principal assigned"

### 5. Executive Summary (01-executive-summary.md)
- [ ] Update: Terminology (Account Manager)
- [ ] Update: Core features list (principal dashboard, 2 reports, tasks+activities)
- [ ] Update: What we're NOT building (cut features list)

### 6. Roadmap (22/25-roadmap.md)
- [ ] Update: Phase 1-3 timeline (18-21 days for MVP)
- [ ] Move cut features to "Future Enhancements"
- [ ] Add: Principal-centric dashboard as Phase 1

---

## Files to Update (Priority Order)

### HIGH PRIORITY (Core changes)
1. ✅ 01-executive-summary.md
2. ✅ 14-dashboard.md (complete rewrite)
3. ✅ 09-reports.md
4. ✅ 08-tasks-widget.md → 08-tasks-module.md
5. ✅ 26-success-metrics.md

### MEDIUM PRIORITY (Terminology + deferred features)
6. ✅ 03-authentication.md (defer OAuth/2FA)
7. ✅ 05-contacts-module.md (remove vCard)
8. ✅ 10/11-search.md (defer global search)
9. ✅ 17-performance.md (remove monitoring)
10. ✅ 24-monitoring-logging.md (remove analytics)
11. ✅ 22/25-roadmap.md (update phases)

### LOW PRIORITY (Find/replace only)
12-21. All other files: Terminology updates only (Sales Rep → Account Manager)

---

## Validation Checklist

After updates:
- [ ] No mentions of "Sales Rep" in UI-facing docs (database docs ok)
- [ ] Dashboard described as principal-centric table
- [ ] Only 2 reports in MVP scope
- [ ] Tasks described as full module with multi-assignment
- [ ] Cut features marked as "Deferred" or "Post-MVP"
- [ ] Success metrics focus on Excel replacement
- [ ] All cross-references updated

---

## Notes

**Database Naming:**
- PRD can say "Account Manager" in all user-facing descriptions
- Technical sections can clarify: "stored in `sales` table"
- No migration needed

**Deferred vs. Removed:**
- Use "Deferred to Post-MVP" for features we might add
- Use "Removed from Scope" only if truly not needed

---

**Next Step:** Execute updates file-by-file using this checklist
