---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 15 (MVP Feature Checklist) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Category:** Implementation & Operations
**Document:** 22-roadmap.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🏗️ [Technical Architecture](./20-technical-architecture.md) - System design and stack decisions
- 📊 [Success Metrics](./21-success-metrics.md) - KPIs and tracking approach
- 🔧 [Implementation Deviations](./23-implementation-deviations.md) - Code wins pragmatism
- 🎯 [Features - All Modules](./10-features-contacts.md) - Detailed feature specifications
---

# 6. IMPLEMENTATION ROADMAP (MVP)

## Phase 1: Foundation (Weeks 1-3)

**Infrastructure:**
- Set up React + TypeScript + Vite project
- Configure Tailwind CSS with OKLCH color system
- Establish design token system (spacing, colors, shadows, radius)
- Set up routing (React Router)
- Configure state management (Zustand)
- Set up TanStack Query for data fetching

**Authentication:**
- Implement login/logout flow
- JWT token handling and refresh logic
- Protected route wrapper component
- User context/provider

**Core Layout:**
- Top navigation bar component
- Sidebar component (collapsible)
- Page layout template
- Breadcrumb navigation component
- Responsive breakpoints

## Phase 2: Organizations Module (Weeks 4-5)

- Organizations list view (table with sorting, filtering)
- Organization detail view (tabbed interface)
- Create/Edit organization forms
- Organization API integration
- Search within organizations
- CSV export functionality

## Phase 3: Contacts Module (Weeks 6-7)

- Contacts list view
- Contact detail view
- Create/Edit contact forms
- Contact-Organization relationships
- Contact API integration
- Search within contacts

## Phase 4: Products Module (Week 8)

- Products list view
- Product detail view
- Create/Edit product forms
- Product API integration
- Active/Inactive toggle

## Phase 5: Opportunities Module (Weeks 9-12)

**Week 9-10: List & Detail Views**
- Opportunities list view (table with advanced filtering)
- Opportunity detail view (comprehensive layout)
- Related opportunities display
- Activity timeline on detail page

**Week 11-12: Kanban & Creation**
- Kanban pipeline board (drag-and-drop)
- Create/Edit opportunity modal (single form with 6 sections)
- Principal Organization field ⭐ (MOST IMPORTANT - required field)
- Stage/Status update logic
- Opportunity actions

## Phase 6: Tasks & Activity Tracking (Weeks 13-15)

**Tasks Module ⚠️ CRITICAL:**
- Tasks list view (sortable/filterable table)
- Task creation modal (quick add from any entity detail page)
- Task editing and completion (inline checkbox + detail modal)
- Overdue task indicators (red highlighting, badge count)
- Daily email reminders (8 AM configurable)
- Task API integration
- RLS policies (admin/manager/account-manager access levels)

**Activity Tracking:**
- Activity log component
- Quick log activity form
- Activity feed display (reverse chronological)
- Activity filtering and search
- Automated activity logging (stage changes, etc.)
- Activity API integration

## Phase 7: Basic Reporting (Weeks 16-17)

- **Opportunities by Principal Report** ⭐ (MOST IMPORTANT)
  - Grouped list view (Principal → Opportunities)
  - CSV export with proper columns
- **Weekly Activity Summary Report**
  - Per-user activity breakdown
  - CSV export
- **Filtered List Exports**
  - CSV export button on all list views
  - Respects current filters/search
- Note: Analytics dashboards NOT in MVP scope

## Phase 8: Polish & Optimization (Weeks 18-19)

- Accessibility audit (WCAG 2.1 AA compliance)
- Performance optimization (code splitting, lazy loading)
- Responsive design refinement (iPad-first focus)
- Error handling improvements
- Loading states and skeletons
- User onboarding/tooltips

## Phase 9: Testing & Bug Fixes (Weeks 20-21)

- Unit tests for critical components
- Integration tests for key flows
- End-to-end tests (Cypress or Playwright)
- Cross-browser testing (Chrome, Safari, Firefox)
- User acceptance testing (UAT)
- Bug fixes and refinements

## Phase 10: Deployment & Training (Week 22)

- Production deployment
- User training materials
- Admin documentation
- Go-live support
- Post-launch monitoring
