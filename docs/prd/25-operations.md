---
**Part of:** Atomic CRM Product Requirements Document
**Category:** Implementation & Operations
**Document:** 25-operations.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🏗️ [Technical Architecture](./20-technical-architecture.md) - Infrastructure stack
- 🚀 [Roadmap](./22-roadmap.md) - Deployment phase timeline
- 📊 [Success Metrics](./21-success-metrics.md) - Performance monitoring KPIs
- 🔧 [Implementation Deviations](./23-implementation-deviations.md) - Operational simplifications
---

# 11. OPERATIONAL REQUIREMENTS

## Infrastructure & Deployment

### Environment Strategy (Q12)
- **Two Environments:** Local Development + Production
- **Local Dev:** Supabase CLI with Docker
- **Production:** Supabase Cloud + Vercel
- **No Staging:** Direct promotion from dev to production

### Change Management (Q13 - Single Developer)
**Recommended Workflow for Solo Developer:**
1. All configuration in version control (git)
2. Test locally with `npm run db:local:reset`
3. Create migrations with `npx supabase migration new`
4. Review changes with `npx supabase db diff`
5. Deploy with `npm run db:cloud:push`
6. Tag releases in git for rollback ability

**Best Practices:**
- Keep migration files small and focused
- Always include rollback scripts
- Test migrations on fresh database before deploying

## Data Backup Strategy

### Backup Approach (Supabase Automatic)
- **Primary Strategy:** Rely on Supabase automatic backups only
- **No custom backup scripts** or external storage
- **No user-triggered backups** in MVP
- **No continuous replication** to secondary database

### Supabase Backup Features (Built-in)
**Daily Backups:**
- Automatic daily snapshots at midnight UTC
- 7-day retention for Free tier
- 30-day retention for Pro tier
- Point-in-time recovery (PITR) available on Pro tier

**What's Backed Up:**
- All database tables and data
- Database schema and migrations
- RLS policies and functions
- User authentication data
- Storage bucket metadata

**What's NOT Backed Up:**
- Storage bucket files (handled separately by Supabase)
- Application code (handled by git)
- Environment variables (store securely elsewhere)

### Recovery Process
**In Case of Data Loss:**
1. Contact Supabase support for restoration
2. Provide timestamp of desired restore point
3. Supabase restores to new database instance
4. Update connection strings to point to restored instance
5. Verify data integrity
6. Resume operations

**Recovery Time Objective (RTO):**
- Target: 4-8 hours (depends on Supabase support response)
- Acceptable for small team CRM use case

**Recovery Point Objective (RPO):**
- Maximum data loss: 24 hours (daily backup frequency)
- Acceptable given manual data entry pace

### Future Enhancements (Post-MVP)
- Scheduled exports to company cloud storage
- Automated backup verification
- Custom backup scripts for critical data
- Read replicas for zero-downtime backups
- Use feature branches even as solo developer

### Deployment Strategy (Q15)
- **Big Bang Releases:** Deploy all features together
- **No Feature Flags:** Features are either deployed or not
- **Release Schedule:** Deploy during low-usage windows
- **Rollback Plan:** Git tags for version rollback

## Data Management

### Backup Strategy (Q6)
- **Primary:** Rely on Supabase automatic daily backups
- **Point-in-time Recovery:** Available through Supabase (7-30 days based on plan)
- **No Additional Backups:** Trust platform reliability
- **User Exports:** Users can export their data via CSV for local backup

### Data Privacy (Q11)
- **Basic Compliance:** Soft delete + audit trail
- **No GDPR Features:** US-only focus, no EU requirements
- **Data Retention:** 30-day soft delete, then archive
- **User Data Access:** Users can export their own data

## Monitoring & Support

### Performance Monitoring (Q14)
**Free Monitoring Stack:**
- **Supabase Dashboard:** Built-in metrics for database and API
- **Vercel Analytics:** Free tier for web vitals (if using Vercel)
- **Sentry Free Tier:** Error tracking (up to 5K events/month)
- **Uptime Robot:** Free uptime monitoring (50 monitors)

**Key Metrics to Track:**
- Database response time
- API error rate
- Page load speed
- JavaScript errors
- Uptime percentage

### Notification System (Q8)
- **No Notifications:** Users check system when logged in
- **No Email Alerts:** Even for critical events
- **No Push Notifications:** Desktop or mobile
- **Manual Checking:** Users responsible for checking tasks and updates

## Integration Strategy

### API Access (Q5)
- **No Public API:** Web UI only access
- **Supabase REST API:** Available but not documented for external use
- **No Webhooks:** No event streaming to external systems
- **Manual Integration:** Export/import via CSV only

### Third-Party Integrations
- **None Planned:** Standalone system
- **Future Consideration:** Email/calendar in Phase 2
- **Import/Export:** CSV files for data exchange

## Security & Compliance

### Access Control
- **Authentication:** Supabase Auth (email/password)
- **Authorization:** RLS policies per role
- **Session Management:** JWT with refresh tokens
- **Password Policy:** Minimum 6 characters (Supabase default)

### Compliance Requirements
- **Industry:** Food distribution (no special requirements)
- **Geography:** US-only
- **Data Residency:** US-East (Supabase default)
- **Certifications:** None required
