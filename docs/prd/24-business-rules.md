---
**Part of:** Atomic CRM Product Requirements Document
**Category:** Implementation & Operations
**Document:** 24-business-rules.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🎯 [Features - Opportunities](./12-features-opportunities.md) - Stage and ownership workflows
- 🎯 [Features - Products](./13-features-products.md) - Catalog management
- 👥 [Features - Users & Permissions](./14-features-users-permissions.md) - Role definitions
- 🔧 [Implementation Deviations](./23-implementation-deviations.md) - Pragmatic decisions
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
- **Self-Assignment:** Sales reps can claim unassigned opportunities
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
  - Sales Rep
  - Read-Only
- **No Team Hierarchy:** Flat structure, no territory or team concepts
- **Onboarding:** Guided tour in-app (last priority feature) (Q9)
