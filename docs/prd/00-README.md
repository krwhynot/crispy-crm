# Crispy-CRM - Product Requirements Documentation

> **⚠️ SUPERSEDED**: These modular PRD files are from v1.5 (November 2025). The **canonical PRD** is now `../PRD.md` v1.18 (2025-11-28). Key differences: 7 pipeline stages (not 8), 13 activity types, Business Playbook integration. Use `../PRD.md` for current requirements.

**Version:** 1.5 MVP (Modular Edition) - **ARCHIVED**
**Last Updated:** November 4, 2025
**Superseded By:** `../PRD.md` v1.18
**Purpose:** Complete product specification split into focused, navigable modules

---

## Document Organization

This PRD is split into **27 modular documents** organized by category for easier navigation, maintenance, and collaboration.

### Reading Guide by Audience

**📊 Product Managers / Stakeholders**
1. Start: [Executive Summary](./01-executive-summary.md)
2. Then: [Success Metrics](./26-success-metrics.md)
3. Review: Feature modules (03-25) as needed

**👨‍💻 Developers / Engineers**
1. Start: [Data Architecture](./02-data-architecture.md)
2. Then: Feature modules (03-25) for implementation details
3. Reference: [Glossary](./27-glossary-appendix.md) for terminology

**🎨 Designers / UX**
1. Start: [Executive Summary](./01-executive-summary.md) for design philosophy
2. Then: Feature modules (03-25) for UI requirements
3. Reference: Design system patterns in feature specs

---

## Document Map

### 📋 Foundation (Overview & Architecture)

| File | Description | Key Content |
|------|-------------|-------------|
| [01-executive-summary.md](./01-executive-summary.md) | Project overview, objectives, success criteria | Vision, design philosophy, key metrics |
| [02-data-architecture.md](./02-data-architecture.md) | Complete database schema, entities, relationships | TypeScript interfaces, validation rules, data flow |

### 🗂️ Core Features (Resource Management)

| File | Description | Key Content |
|------|-------------|-------------|
| 03-organizations.md | Organization management module | Restaurant/distributor tracking, priority system |
| 04-contacts.md | Contact management module | People management, JSONB arrays, minimal fields |
| 05-opportunities.md | Opportunity/deal tracking module | Multi-org tracking, stage progression, principal filtering |
| 06-products.md | Product catalog module | Simple association tracking (no pricing) |
| 07-tasks.md | Task management module | Due dates, priority, entity associations |
| 08-activities.md | Activity logging module | Call/email/meeting tracking, polymorphic relations |

### ⚙️ System Features (UI/UX & Workflows)

| File | Description | Key Content |
|------|-------------|-------------|
| 14-dashboard.md | Dashboard module | Principal-centric table view with status tracking |
| 10-search.md | Search functionality module | Global search, filters, quick find |
| 11-notifications.md | Notification system module | Task reminders, overdue alerts |
| 12-import-export.md | Data import/export module | CSV handling, bulk operations |
| 13-user-management.md | User & auth module | Roles, permissions, authentication |

### 🎨 Design & Technical Specs

| File | Description | Key Content |
|------|-------------|-------------|
| 14-design-system.md | UI/UX design patterns | Tailwind v4, iPad-first, accessibility |
| 15-responsive-design.md | Responsive breakpoints | Mobile, tablet, desktop layouts |
| 16-accessibility.md | WCAG compliance | Keyboard nav, screen readers, ARIA |
| 17-performance.md | Performance targets | Load times, interaction latency, optimization |

### 🔧 Technical Architecture

| File | Description | Key Content |
|------|-------------|-------------|
| 18-tech-stack.md | Technology choices | React, Supabase, TypeScript, Vite |
| 19-database-design.md | Database implementation | PostgreSQL patterns, indexes, constraints |
| 20-api-design.md | API patterns | REST endpoints, error handling |
| 21-auth-security.md | Security model | RLS policies, auth flows, data protection |

### 🚀 Implementation & Operations

| File | Description | Key Content |
|------|-------------|-------------|
| 22-testing-strategy.md | Test plan | Unit, integration, E2E testing |
| 23-deployment.md | Deployment process | CI/CD, environments, migrations |
| 24-monitoring-logging.md | Observability | Error tracking, logging, metrics |
| 25-roadmap.md | Implementation phases | MVP → Phase 2 → Phase 3 features |

### 📚 Reference Materials

| File | Description | Key Content |
|------|-------------|-------------|
| [26-success-metrics.md](./26-success-metrics.md) | KPIs and evaluation criteria | Excel replacement metrics, adoption targets |
| [27-glossary-appendix.md](./27-glossary-appendix.md) | Terminology & future enhancements | Definitions, business rules, post-MVP features |

---

## Document Interdependencies

```
Executive Summary (01)
    ├──> Data Architecture (02) ──┬──> All Feature Modules (03-13)
    │                              │
    │                              └──> Design System (14-17)
    │
    ├──> Success Metrics (26)
    │
    └──> Roadmap (25)

Data Architecture (02)
    ├──> Organizations (03)
    ├──> Contacts (04)
    ├──> Opportunities (05)
    ├──> Products (06)
    ├──> Tasks (07)
    ├──> Activities (08)
    └──> Database Design (19)

Design System (14)
    ├──> Responsive Design (15)
    ├──> Accessibility (16)
    └──> All Feature Modules (03-13)

Technical Stack (18)
    ├──> Database Design (19)
    ├──> API Design (20)
    ├──> Auth & Security (21)
    └──> Deployment (23)

Testing (22) ──> All Modules
Monitoring (24) ──> All Modules
```

---

## Navigation Tips

1. **Internal Links**: Use `Ctrl+Click` (or `Cmd+Click` on Mac) to open links in new tab
2. **Search**: Use your editor's search to find content across all files
3. **Related Documents**: Each file header lists 3-5 most relevant related docs
4. **Cross-References**: Emoji prefixes help identify document types:
   - 📋 Foundation/overview
   - 🗂️ Feature module
   - ⚙️ System feature
   - 🎨 Design spec
   - 🔧 Technical spec
   - 🚀 Operations/deployment
   - 📊 Metrics/reporting
   - 📚 Reference material

---

## Version History

**v1.5 (Modular)** - November 4, 2025
- Split monolithic PRD into 27 focused modules
- Added navigation index and cross-references
- Preserved all v1.5 content (Round 6 specs included)

**v1.5 (Monolithic)** - November 3, 2025
- Added Round 6: error handling, monitoring, integration, deployment, security

**v1.4** - Previous date
- Added Round 5: notifications, import/export, dashboard, search, iPad optimizations

**v1.3** - Previous date
- Enhanced opportunity management with trade show handling, multi-brand filtering

---

## Maintenance Notes

**When updating this PRD:**
- Update version number in this file AND in 01-executive-summary.md
- Add changes to version history in both locations
- Update cross-references if document structure changes
- Run link checker to verify internal references
- Keep line counts current in each file's metadata

**For new features:**
- Add to appropriate existing module if small
- Create new module file (28-xxx.md) if substantial
- Update this README's document map
- Add cross-references in related documents

---

**Questions?** Refer to [Glossary](./27-glossary-appendix.md) for terminology or contact the Product Design & Engineering Team.
