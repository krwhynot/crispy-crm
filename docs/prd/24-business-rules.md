---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 12 (Business Rules) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Category:** Implementation & Operations
**Document:** 24-business-rules.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🎯 [Features - Opportunities](./12-features-opportunities.md) - Stage and ownership workflows
- 🎯 [Features - Products](./13-features-products.md) - Catalog management
- 👥 [Features - Users & Permissions](./14-features-users-permissions.md) - Role definitions
- 🔧 [Implementation Deviations](./23-implementation-deviations.md) - Pragmatic decisions
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ✅ **80-85%** |
| **Confidence** | 🟢 **HIGH** - Production ready |
| **Validation Files** | 13 Zod schemas (2,307 lines) |
| **Database Constraints** | 177+ (CHECK, UNIQUE, FK, NOT NULL) |
| **Test Coverage** | 20 validation test files |
| **Business Logic** | 199+ validation constraints |

**Completed Requirements:**

**Opportunity Stage Validation (100%):**
- ✅ Stage enum: 8 stages (new_lead, initial_outreach, sample_visit_offered, awaiting_response, feedback_logged, demo_scheduled, closed_won, closed_lost)
- ✅ Flexible transitions: Can move to any stage at any time per PRD
- ✅ Default value: "new_lead"
- ✅ Database enum matches validation schemas

**Required Field Enforcement (100%):**
- ✅ Opportunities: name, customer_organization_id, principal_organization_id, estimated_close_date (30-day default), contact_ids (at least 1 for create)
- ✅ Contacts: name OR first_name/last_name, email (at least 1), sales_id
- ✅ Tasks: title, contact_id, due_date, type
- ✅ Database migration 20251101172947: customer_organization_id NOT NULL enforced
- ✅ 94+ validation error messages across all schemas

**Field Validation Rules (95%):**
- ✅ 199+ validation constraints (min, max, email, URL, positive, refine, superRefine)
- ✅ Email validation with regex patterns
- ✅ URL validation with LinkedIn domain check
- ✅ JSONB array validation (contacts.ts: email/phone sub-schemas)
- ✅ Date validation (future dates for reminders)
- ✅ Complex business logic (activities.ts: type-specific requirements, cross-field validation)

**Database Constraints (90%):**
- ✅ 177+ constraints (CHECK, UNIQUE, FK, NOT NULL)
- ✅ Foreign key constraints (67 total)
- ✅ Unique constraints (partial index on sales.first_name/last_name WHERE user_id IS NULL)
- ✅ Check constraints (opportunity stage enum, organization type enum, priority levels)

**Business Logic in Schemas (85%):**
- ✅ 24 default value rules
- ✅ Contact name normalization (auto-compute from first/last, auto-split if only name provided)
- ✅ Opportunity contact validation (distinguishes partial updates vs. explicit removal)
- ✅ Activity type-specific validation (engagement vs. interaction separate schemas)
- ✅ Estimated close date: auto-calculated 30 days from now

**RPC/Backend Validation (80%):**
- ✅ Migration 20251030132011: RPC backend validation for customer requirement, contact requirement, product requirement
- ✅ 5 RPC functions with Zod parameter schemas (rpc.ts)
- ✅ Raises exceptions with clear error messages

**Contact-Organization Validation (100%):**
- ✅ Migration 20251029022918: Contact must belong to opportunity's customer organization
- ✅ Triggers prevent malicious API manipulation

**Status Transition Rules (N/A - Intentional):**
- ✅ Flexible model per PRD: No hard restrictions on stage transitions (correct implementation)
- ✅ Can move to any stage at any time (matches PRD Q1 answer)

**Audit Trail (100%):**
- ✅ Migration 20251103232837: Audit trail system with created_by/updated_by tracking
- ✅ Trigger-based automatic audit record creation

**Missing Requirements (15-20%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Priority inheritance (opportunity → tasks, org → contacts) | ❌ Missing | 🟢 HIGH | 2 days |
| Stage transition logging (auto activity entries) | ⚠️ Manual | 🟡 MEDIUM | 1 day |
| Cross-entity validation integration tests | ⚠️ Partial | 🟢 HIGH | 1 day |

**Details:**
- **Strong Foundation:** Professional-grade business rule implementation with comprehensive validation layer (13 Zod schemas), strong database constraints (177+), extensive test coverage (20 test suites)
- **Single Source of Truth:** Zod validation at API boundaries (Engineering Constitution #2)
- **Security Focus:** Backend RPC validation prevents API manipulation
- **Priority Inheritance Gap:** Low impact - each entity has independent priority field with defaults, no automatic propagation
- **Test Coverage:** 20 comprehensive test suites (validation, integration, edge cases, transformation)

**Blockers:** None

**Status:** Production-ready business rules implementation with 80-85% completion. One minor gap (priority inheritance) has low impact. All critical validation rules enforced at database and API layers.

---

# 10. BUSINESS PROCESS RULES

## Opportunity Management

### Stage Transitions
- **Flexibility:** Can move to any stage at any time (Q1: Flexible)
- **Requirement:** Must complete interaction form with description when changing stage
- **Validation:** Stage change triggers activity log entry with mandatory notes field
- **No Restrictions:** Can move backwards or skip stages as needed

### Ownership & Assignment
- **Territory Management:** Manual assignment with self-service (Q2)
- **Default Behavior:** New opportunities unassigned until claimed
- **Self-Assignment:** Account Managers can claim unassigned opportunities
- **Manager Override:** Managers can reassign any opportunity
- **Orphaned Records:** When user deactivated, opportunities remain with them until manually reassigned (Q4)

## Product Catalog
- **Edit Permissions:** All authenticated users can add/edit products (Q3)
- **No Approval Workflow:** Changes are immediate
- **Audit Trail:** All product changes logged with user and timestamp
- **No Currency/Pricing:** Products are catalog items only (Q7)

## User & Role Management
- **Fixed Roles:** 4 predefined roles, no customization (Q10)
  - Admin
  - Sales Manager
  - Account Manager
  - Read-Only
- **No Team Hierarchy:** Flat structure, no territory or team concepts
- **Onboarding:** Guided tour in-app (last priority feature) (Q9)
