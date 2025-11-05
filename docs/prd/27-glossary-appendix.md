---
**Part of:** Atomic CRM Product Requirements Document
**Document:** Glossary & Appendix
**Category:** Reference

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 📋 [Executive Summary](./01-executive-summary.md) - Core concepts and philosophy
- 🗄️ [Data Architecture](./02-data-architecture.md) - Entity definitions
- 📊 [Success Metrics](./26-success-metrics.md) - KPIs and evaluation
- 🚀 [Roadmap](./25-roadmap.md) - Future enhancements

**Navigation:**
- ⬅️ Previous: [Success Metrics](./26-success-metrics.md)
- ➡️ Next: [Back to README](./00-README.md)
---

## 8. APPENDIX

### 8.1 Glossary

- **Organization**: A customer account (restaurant, distributor, management company)
- **Contact**: A person (decision-maker) at an organization
- **Opportunity**: A potential sale or deal in the pipeline
- **Stage**: A step in the sales pipeline (1-8, from Lead discovery to Order support)
- **Status**: The current state of an opportunity (Open, Closed, On Hold, SOLD-7d)
- **Priority**: Importance level of an organization (A+, A, B, C, D)
- **Volume**: Cases per week expected from a deal
- **Probability**: Likelihood (0-100%) that an opportunity will close
- **Deal Owner**: Account Manager responsible for an opportunity
- **Account Manager**: Team member responsible for an organization relationship and its opportunities
- **Principal**: Brand or product line manufacturer
- **Activity**: A logged interaction (call, email, meeting, etc.)

### 8.2 Business Rules Reference

**Opportunity Lifecycle:**
1. Lead discovery: Identify potential customer
2. Contacted: Initial outreach made
3. Sampled/Visited: Product demonstration/tasting
4. Follow-up: Ongoing nurturing
5. Feedback received: Customer response evaluation
6. Demo/Cookup: In-depth product demonstration
7. SOLD: Deal closed successfully
8. Order support: Post-sale support and fulfillment

**Priority System (4 Levels):**
- **A**: Top-tier accounts, high-value (highest priority)
- **B**: Mid-tier accounts
- **C**: Lower-value accounts
- **D**: Lowest priority accounts

**Stage Progression Rules:**
- Must move forward sequentially (cannot skip stages)
- Can move backward if deal regresses
- Status can change independently of stage
- SOLD-7d status automatically sets stage to SOLD-7

### 8.3 Future Enhancements (Post-MVP)

**Phase 2 Features:**
- Email integration (Gmail, Outlook add-ins)
- Calendar integration (sync meetings)
- Custom report builder
- Scheduled report email delivery
- Advanced search (global, cross-entity)
- Duplicate detection and merging tools
- Bulk email campaigns
- Quote generation
- Convert to Order workflow (opportunity → order record creation)

**Phase 3 Features:**
- Mobile native app (iOS, Android)
- Offline mode with sync
- Advanced analytics (predictive forecasting)
- Territory management
- Commission tracking
- Inventory management integration
- Order management system
- Customer portal (for distributors/customers)

**Long-term Vision:**
- AI-powered lead scoring
- Automated activity capture (email parsing, call transcription)
- Real-time collaboration (see who's viewing/editing)
- Workflow automation (if-then rules)
- Custom fields and entities (no-code customization)
- API marketplace (integrations with ERP, accounting, etc.)

---
