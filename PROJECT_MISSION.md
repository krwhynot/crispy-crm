# Crispy-CRM - Project Mission

## The Goal

**Replace Excel-based sales pipeline management** for MFB, a food distribution sales organization/brokerage.

---

## Key Objectives

| Objective | Description |
|-----------|-------------|
| **Centralize Sales Data** | Unified platform for opportunities, accounts, and contacts (eliminating scattered spreadsheets) |
| **Automate Workflows** | Reduce manual data entry and formula dependencies |
| **Improve Pipeline Visibility** | Real-time dashboards across the 8-stage sales pipeline |
| **Enable Collaboration** | Multi-user access with role-based permissions for the sales team |
| **Enhance Forecasting** | Volume (cases/units) AND dollar-based sales projections |
| **Cross-Device Access** | Desktop-first design with critical mobile/tablet support for field reps |

---

## Business Context

### What MFB Does

MFB manages relationships between three parties in the food distribution chain:

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────────┐
│   PRINCIPALS    │────▶│     MFB     │────▶│   DISTRIBUTORS   │
│ (Manufacturers) │     │  (Broker)   │     │                  │
└─────────────────┘     └─────────────┘     └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    OPERATORS     │
                    │  (Restaurants)   │
                    └──────────────────┘
```

### Scale

| Entity | Count | Examples |
|--------|-------|----------|
| **Account Managers** | 6 | MFB sales team members |
| **Principals** | 9 | McCRUM, Rapid Rasoi, Kaufholds |
| **Distributors** | 50+ | Sysco, USF, GFS, PFG |

### Terminology

| Term | Definition |
|------|------------|
| **Principal** | Food manufacturer whose products MFB represents |
| **Distributor** | Company that buys from principals and distributes to operators |
| **Operator** | Restaurant or foodservice business (end customer) |
| **Opportunity** | A deal moving through the 8-stage pipeline (one principal per opportunity) |
| **Authorization** | When a distributor agrees to carry a principal's products |

---

## Data Model

### Core Relationships

```
Principal (1) ──────── (many) Opportunities
     │
     └── Products

Distributor (1) ──────── (many) Authorizations ──────── (many) Principals
     │
     └── Contacts (buyers, reps, managers)
     └── Territory/Region coverage

Opportunity (1) ──────── (1) Principal
     │
     └── Activities (calls, emails)
     └── Samples sent
```

### Distributor Information Tracked

- Name and location
- Which principals they carry (authorization status)
- Contact people at distributor
- Territory/region coverage

---

## User Roles & Permissions

| Role | Access Level |
|------|--------------|
| **Admin** | Full access to all data, user management, settings |
| **Manager** | See all reps' data, run reports, manage pipeline |
| **Rep** | See own opportunities, log activities, view dashboards |

---

## Pipeline & Forecasting

### Pipeline Stages

**Status**: 8 stages (to be finalized)

### Forecasting Model

- **Dual tracking**: Both volume (cases/units) AND dollar value
- **Reporting periods**: Weekly and Monthly

---

## Principal Reports

### Required Contents

| Section | Description |
|---------|-------------|
| **Pipeline by Stage** | How many deals at each stage for their products |
| **Activity Summary** | Calls, emails logged on their behalf |
| **Won/Lost with Reasons** | Closed deals and why they succeeded or failed |
| **Forecast Projection** | Expected volume/revenue for upcoming periods |

### Delivery Methods

- PDF export (email to principals)
- Excel export (for their own analysis)

### Win/Loss Reasons

**Common Win Reasons:**
- Relationship (existing trust with buyer)
- Product quality (superior taste, ingredients, specs)

**Common Loss Reasons:**
- Price too high (competitor undercut)
- No distributor authorization (product not available through buyer's distributor)
- Competitor relationship (buyer already committed to another brand)

---

## Activity Tracking

### Primary Activity Types

- **Calls** - Phone conversations with contacts
- **Emails** - Email correspondence
- **Samples** - Product samples sent for evaluation (with follow-up tracking)

### Field Sales Workflow

What happens at a typical field visit:
1. Present products to buyer
2. Collect feedback/objections
3. Capture new leads/opportunities

### Automation Priority

**#1 Pain Point**: Data entry from calls/meetings takes too long

**Solution**: Quick activity logging (under 30 seconds per entry)

---

## Must-Have Features for Launch

Without these, the team won't adopt:

| Feature | Priority |
|---------|----------|
| **Principal-filtered views** | See pipeline/activities for one principal at a time |
| **Quick activity logging** | Log a call in under 30 seconds |
| **Export to PDF/Excel** | Generate reports for principals |
| **Sample tracking** | Log when samples sent and follow-up status |
| **Mobile/tablet access** | Critical for daily field use |

### NOT Required for MVP

- Task reminders (nice to have, not blocking)
- External integrations (standalone system)

---

## Rep Performance KPIs

What defines a "good week":

- Number of activities logged
- Deals moved forward (pipeline progression)
- New opportunities created

---

## Data Migration

**Approach**: One-time bulk import of historical data at launch

---

## Success Metrics

| Metric | Target |
|--------|--------|
| **Team Migration** | 100% adoption within 60 days |
| **Data Accuracy** | <5% error rate |
| **Admin Reduction** | 40% less time on manual tasks |
| **Forecast Accuracy** | ±15% variance |

---

## Adoption Risk

**Biggest Risk**: Missing key features that block daily workflows

**Mitigation**: Focus on must-haves (principal views, quick logging, exports, samples, mobile)

---

## The Problem We're Solving

### Current State: Excel Hell

- Scattered spreadsheets with no single source of truth
- Manual data entry prone to errors
- Formula dependencies that break
- No real-time visibility into pipeline
- Difficult to generate principal reports
- No collaboration features

### Why Not Salesforce/HubSpot?

- Too expensive for team size
- Too complex - 90% of features unused
- Can't customize to food brokerage workflow
- Don't own the data

---

## Project Status

**Current Stage**: MVP in Progress (Pre-launch)

---

## Technical Approach

- **Stack**: React 19 + Vite + TypeScript + Supabase + Tailwind CSS v4
- **Design**: Desktop-first, mobile/tablet responsive (critical for field use)
- **Architecture**: See [CLAUDE.md](./CLAUDE.md) for technical details

---

*This document defines WHY we're building Crispy-CRM. For HOW, see the technical documentation.*

*Last updated via questionnaire: Captures MFB's specific food brokerage workflow, principal reporting needs, and field sales requirements.*
