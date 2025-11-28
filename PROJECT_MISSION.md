# Atomic CRM - Project Mission

## What Is This?

Atomic CRM is an **internal sales tool for a food brokerage company**. It tracks deals, activities, and generates reports for the food manufacturers (principals) we represent.

## The Business Context

### What Food Brokers Do

Food brokers act as **sales representatives for food manufacturers**. Instead of hiring their own salesforce, food manufacturers hire brokers to:

- Present their products to retailers, distributors, and foodservice companies
- Track opportunities and close deals on their behalf
- Report back on pipeline, activities, and results

### Our Terminology

| Term | Definition |
|------|------------|
| **Principal** | A food manufacturer whose products we represent (e.g., "Acme Foods Inc.") |
| **Opportunity** | A potential deal - selling a principal's products to a buyer |
| **Activity** | A logged interaction (call, email, meeting) on behalf of a principal |
| **Contact** | A person at a buyer organization we're selling to |
| **Organization** | A company that might buy our principals' products |

## The Problem We're Solving

### Pain Point: Can't Create Clean Principal Reports

Our principals need to see:
- **Pipeline Summary** - What deals are open for their products?
- **Activity Report** - What have we been doing on their behalf?
- **Won/Lost Analysis** - What closed and why?

**Current state**: Spreadsheets that are hard to maintain and don't provide real-time visibility.

**Why not Salesforce/HubSpot?**
- Too expensive for our team size
- Too complex - 90% of features unused
- Can't customize to our specific workflow
- Don't own the data

## The Solution: Atomic CRM

### Core Value Proposition

| Differentiator | How We Deliver It |
|----------------|-------------------|
| **Simplicity** | Only features we actually need, clean UI |
| **Cost** | Self-hosted on Supabase, no per-seat fees |
| **Customization** | We own the code, can modify anything |
| **Speed** | Optimized for quick data entry (trade shows, calls) |

### Key Workflows

1. **Track Deals by Principal** - See pipeline filtered by which manufacturer's products are involved
2. **Log Activities Fast** - Quick entry for calls, meetings, emails
3. **Generate Principal Reports** - Export-ready summaries to share with manufacturers
4. **Manage Tasks** - Know what follow-ups are due today/tomorrow

## Scale & Scope

- **6-15 principals** (food manufacturers we represent)
- **SMB sales team** (1-20 people)
- **Multiple report audiences**: principals, internal management, individual reps

## MVP Definition

The MVP is complete when:

- [ ] **Core CRUD Working** - Create, read, update, delete all entities
- [ ] **Team Using Daily** - Sales team has adopted it for real work
- [ ] **Replaces Spreadsheet** - Better than Excel for tracking deals
- [ ] **Dashboard Useful** - Pipeline visibility provides actionable insights
- [ ] **Principal Reports** - Can generate clean reports grouped by principal

## Project Status

**Current Stage**: MVP in Progress

**Pre-launch** - Building toward first internal deployment.

## Success Metrics

1. **Adoption**: Team stops using spreadsheets
2. **Report Quality**: Principals receive professional-looking pipeline updates
3. **Time Saved**: Faster to log activities than current process
4. **Visibility**: Management can see real-time pipeline without asking

---

## Technical Approach

See [CLAUDE.md](./CLAUDE.md) for technical details. Key principles:

- **React 19 + Supabase** - Modern, maintainable stack
- **Type Safety** - TypeScript + Zod validation
- **No Over-Engineering** - Fail fast, keep it simple
- **Semantic Design System** - Consistent, accessible UI

---

*This document defines WHY we're building Atomic CRM. For HOW, see the technical documentation.*
