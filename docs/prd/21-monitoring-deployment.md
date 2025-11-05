---
**Part of:** Atomic CRM Product Requirements Document
**Category:** Technical Specifications
**Document:** 21-monitoring-deployment.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md)
- 💻 [Technology Stack](./18-tech-stack.md)
- 🔌 [API Design](./19-api-design.md)
- 🔒 [Performance & Security](./20-performance-security.md)
- 📊 [Activity Logs Feature](./12-activity-logs.md)
---

# 21. Monitoring & Deployment

## 5.7 Monitoring & Logging

**Application Monitoring:**
- **Basic uptime monitoring only**
- Use free tier service (UptimeRobot or similar)
- Alert on site down via email
- No APM or performance monitoring
- No custom dashboards

**User Activity Logging:**
- **All user actions including views logged**
- Log format: timestamp, user_id, action, entity_type, entity_id, IP address
- Store in database table `activity_logs`
- Used for audit trail and debugging
- No analytics or behavior tracking

**Log Retention:**
- **30 days retention** for all logs
- Automatic cleanup job runs nightly
- Older logs deleted permanently
- No archival or cold storage

## 5.8 Integration & API Strategy

**Third-Party Integrations:**
- **None - standalone CRM only**
- No email provider integration
- No calendar sync
- No accounting software
- No marketing tools
- Future consideration only

**External API:**
- **No API exposed**
- Internal use only via Supabase
- No REST endpoints for external consumers
- No GraphQL
- No webhooks

**Webhook Support:**
- **No webhooks**
- No event notifications to external systems
- All processing synchronous
- No message queues or event streaming

## 5.9 Deployment & Migration Strategy

**Database Migrations (Post-Launch):**
- **Scripted migrations with downtime** (Recommended by zen)
- Use Supabase migration files
- Version control all schema changes
- Test migrations on local first
- Schedule maintenance windows (5-10 minutes)
- Notify users in advance
- Apply during off-hours

**Migration Workflow:**
1. Develop and test locally
2. Generate migration: `supabase db diff -f <name>`
3. Review generated SQL
4. Commit to version control
5. Schedule maintenance window
6. Apply to production: `supabase db push`
7. Verify and monitor

**Feature Flags:**
- **No feature flags**
- All features available to all users
- No gradual rollout capability
- No A/B testing infrastructure

**Multi-Language Support:**
- **English only forever**
- No i18n framework needed
- All text hard-coded in English
- No translation infrastructure
