# Incident Response Playbook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create comprehensive incident response documentation for security and operational emergencies

**Architecture:** Structured playbook with procedures, escalation paths, and recovery steps

**Tech Stack:** Markdown documentation
**Effort:** 1 day | **Priority:** MEDIUM | **Status:** Partial (deploy-safe.sh has rollback, but no incident playbook)

---

## Implementation

### Task 1: Create Main Incident Response Playbook (Day 1 - Morning)

**File:** `docs/operations/incident-response-playbook.md`

```markdown
# Incident Response Playbook

**Version:** 1.0
**Last Updated:** November 4, 2025
**Owner:** Operations Team
**Classification:** CONFIDENTIAL

---

## Table of Contents

1. [Overview](#overview)
2. [Incident Classification](#incident-classification)
3. [Response Team & Contacts](#response-team--contacts)
4. [Security Incidents](#security-incidents)
5. [Data Breach Response](#data-breach-response)
6. [Database Corruption](#database-corruption)
7. [Application Downtime](#application-downtime)
8. [Recovery Procedures](#recovery-procedures)
9. [Post-Incident Review](#post-incident-review)

---

## Overview

This playbook defines procedures for responding to security and operational incidents affecting Atomic CRM. All team members should be familiar with these procedures.

**Objectives:**
- Minimize impact and recovery time (RTO: 4 hours, RPO: 1 hour)
- Preserve evidence for investigation
- Maintain stakeholder communication
- Document lessons learned

---

## Incident Classification

### Severity Levels

**P0 - CRITICAL**
- Complete system outage
- Active security breach
- Data loss affecting multiple customers
- **Response Time:** Immediate
- **Escalation:** CEO, CTO within 15 minutes

**P1 - HIGH**
- Partial system outage
- Performance degradation (>5s response times)
- Suspected security breach
- Data corruption detected
- **Response Time:** <30 minutes
- **Escalation:** Engineering lead within 30 minutes

**P2 - MEDIUM**
- Single feature broken
- Performance issues (<5s response times)
- Security vulnerability reported
- **Response Time:** <2 hours
- **Escalation:** On-call engineer

**P3 - LOW**
- Minor bugs
- Cosmetic issues
- **Response Time:** Next business day

---

## Response Team & Contacts

### Incident Commander
**Primary:** [Engineering Lead Name]
**Phone:** [Phone Number]
**Email:** [Email Address]

### Security Lead
**Primary:** [Security Lead Name]
**Phone:** [Phone Number]
**Email:** [Email Address]

### Database Administrator
**Primary:** [DBA Name]
**Phone:** [Phone Number]
**Email:** [Email Address]

### External Contacts
- **Supabase Support:** support@supabase.com (for database issues)
- **AWS Support:** [Support Number] (for infrastructure)
- **Legal Counsel:** [Law Firm Contact]
- **PR/Communications:** [PR Contact]

---

## Security Incidents

### Detection

**Indicators:**
- Unusual authentication failures (>10 failed attempts/minute)
- Unauthorized API access attempts
- Sentry alerts for suspicious patterns
- Customer reports of unauthorized access

### Immediate Response (First 15 Minutes)

1. **CONFIRM INCIDENT**
   ```bash
   # Check authentication logs
   psql $DATABASE_URL -c "SELECT * FROM auth.audit_log_entries
     WHERE created_at > NOW() - INTERVAL '1 hour'
     ORDER BY created_at DESC LIMIT 100;"

   # Check failed login attempts
   psql $DATABASE_URL -c "SELECT email, COUNT(*)
     FROM auth.audit_log_entries
     WHERE action = 'user_signedin_failed'
       AND created_at > NOW() - INTERVAL '1 hour'
     GROUP BY email
     HAVING COUNT(*) > 5;"
   ```

2. **CONTAIN THREAT**
   - If active breach confirmed, revoke all active sessions:
   ```bash
   psql $DATABASE_URL -c "DELETE FROM auth.sessions;"
   ```
   - Force password reset for affected users
   - Enable IP-based access restrictions if available

3. **NOTIFY STAKEHOLDERS**
   - Email incident commander
   - Create #incident-response Slack channel
   - Begin incident log (use template below)

### Investigation (Hours 1-4)

1. **PRESERVE EVIDENCE**
   ```bash
   # Capture current state
   npm run db:cloud:backup -- incident-$(date +%Y%m%d-%H%M%S)

   # Export authentication logs
   psql $DATABASE_URL -c "\COPY (SELECT * FROM auth.audit_log_entries
     WHERE created_at > NOW() - INTERVAL '24 hours')
     TO 'auth-logs-$(date +%Y%m%d).csv' CSV HEADER;"
   ```

2. **ANALYZE ATTACK VECTOR**
   - Review Sentry error logs
   - Check Supabase dashboard for unusual queries
   - Review application logs for injection attempts

3. **ASSESS IMPACT**
   - Identify compromised accounts
   - Check for data exfiltration (unusual query patterns)
   - Determine timeline of breach

### Remediation (Hours 4-24)

1. **CLOSE VULNERABILITY**
   - Deploy security patch
   - Update RLS policies if needed
   - Rotate secrets/API keys

2. **RESTORE SECURE STATE**
   - Reset passwords for affected accounts
   - Re-enable user access with forced 2FA
   - Monitor for continued suspicious activity

3. **DOCUMENT INCIDENT**
   - Complete incident report (see template)
   - Update security documentation
   - Schedule post-mortem

---

## Data Breach Response

### Legal Requirements

**Notification Timeline:**
- **GDPR:** 72 hours from discovery
- **CCPA:** Without unreasonable delay
- **HIPAA:** 60 days (if applicable)

### Notification Template

```
Subject: Security Incident Notification - Atomic CRM

Dear [Customer Name],

We are writing to inform you of a security incident that may have affected
your data in Atomic CRM.

WHAT HAPPENED:
[Brief description of incident]

WHAT INFORMATION WAS INVOLVED:
[List of data types: names, emails, phone numbers, etc.]

WHAT WE ARE DOING:
[Remediation steps taken]

WHAT YOU CAN DO:
[Recommended actions: password reset, monitor accounts, etc.]

CONTACT:
For questions, contact security@atomiccrm.com or call [phone number].

We sincerely apologize for this incident and are committed to protecting
your data.

[Signature]
```

---

## Database Corruption

### Detection

**Indicators:**
- Constraint violations in logs
- Foreign key errors
- Data inconsistencies reported by users
- Referential integrity check failures

### Immediate Response

1. **ASSESS SCOPE**
   ```bash
   # Run integrity checks
   npm run db:validate:integrity

   # Check for orphaned records
   psql $DATABASE_URL -f scripts/validation/referential-integrity.js
   ```

2. **STOP WRITES IF SEVERE**
   - Set application to read-only mode (if possible)
   - Or take application offline temporarily

3. **BACKUP CURRENT STATE**
   ```bash
   npm run db:cloud:backup -- corruption-$(date +%Y%m%d-%H%M%S)
   ```

### Recovery

**Option 1: Point-in-Time Recovery (Preferred)**
```bash
# Restore from backup before corruption
npm run db:cloud:restore -- backup-[timestamp]

# Replay migration if needed
npx supabase migration up
```

**Option 2: Data Repair**
```bash
# Fix referential integrity
psql $DATABASE_URL -f scripts/validation/fix-orphaned-records.sql

# Re-run validation
npm run db:validate:all
```

### Verification

```bash
# Run full validation suite
npm run db:validate:all

# Check critical tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM contacts WHERE organization_id NOT IN (SELECT id FROM organizations);"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM opportunities WHERE contact_id NOT IN (SELECT id FROM contacts);"
```

---

## Application Downtime

### Detection

- UptimeRobot alert
- Multiple customer reports
- Sentry alert spike (>100 errors/minute)

### Immediate Response (First 5 Minutes)

1. **CHECK INFRASTRUCTURE**
   ```bash
   # Check Supabase status
   curl https://status.supabase.com/api/v2/status.json

   # Check application health
   curl https://app.atomiccrm.com/health
   ```

2. **CHECK RECENT DEPLOYMENTS**
   ```bash
   git log -5 --oneline
   npm run deploy:history
   ```

3. **ROLLBACK IF NEEDED**
   ```bash
   # Automatic rollback
   npm run deploy:rollback

   # Or manual
   git checkout [previous-commit]
   npm run deploy
   ```

### Root Cause Analysis

1. Check error logs in Sentry
2. Review Supabase logs for query failures
3. Check database connection pool saturation
4. Review recent code changes

---

## Recovery Procedures

### Recovery Time Objective (RTO)

**Target:** 4 hours maximum

**P0 Incidents:** 1 hour
**P1 Incidents:** 4 hours
**P2 Incidents:** 24 hours

### Recovery Point Objective (RPO)

**Target:** 1 hour maximum

- Database backups: Every 1 hour (automated via Supabase)
- Manual backups before major changes
- Transaction logs for point-in-time recovery

### Recovery Steps

1. **Assess Situation**
   - Identify what needs recovery
   - Determine recovery point (timestamp)

2. **Execute Recovery**
   ```bash
   # Database recovery
   npm run db:cloud:restore -- backup-[timestamp]

   # Application recovery
   npm run deploy:rollback
   ```

3. **Verify Recovery**
   ```bash
   # Run smoke tests
   npm run test:e2e -- --grep="critical-path"

   # Verify data integrity
   npm run db:validate:all
   ```

4. **Resume Operations**
   - Update status page
   - Notify stakeholders
   - Monitor for issues

---

## Post-Incident Review

**Timeline:** Within 48 hours of incident resolution

### Review Agenda

1. **Timeline Review**
   - When was incident detected?
   - How long until containment?
   - How long until resolution?

2. **What Went Well**
   - Effective procedures
   - Quick responses
   - Good communication

3. **What Went Wrong**
   - Detection delays
   - Communication gaps
   - Missing procedures

4. **Action Items**
   - Security improvements
   - Process updates
   - Training needs
   - Documentation updates

### Incident Report Template

```
# Incident Report: [Title]

**Date:** [Date]
**Severity:** [P0/P1/P2/P3]
**Status:** RESOLVED
**Duration:** [X hours]

## Summary
[Brief description]

## Timeline
- HH:MM - Incident detected
- HH:MM - Team notified
- HH:MM - Containment achieved
- HH:MM - Root cause identified
- HH:MM - Resolution deployed
- HH:MM - Incident closed

## Root Cause
[Technical explanation]

## Impact
- Users affected: [Number]
- Data affected: [Description]
- Revenue impact: [Amount]
- Downtime: [Duration]

## Resolution
[What was done to fix]

## Prevention
[What will prevent recurrence]

## Action Items
1. [Action with owner and due date]
2. [Action with owner and due date]
```

---

## Appendix: Quick Reference

### Emergency Commands

```bash
# Force logout all users
psql $DATABASE_URL -c "DELETE FROM auth.sessions;"

# Backup database immediately
npm run db:cloud:backup -- emergency-$(date +%Y%m%d-%H%M%S)

# Rollback deployment
npm run deploy:rollback

# Check system health
curl https://app.atomiccrm.com/health

# View recent errors
npx sentry-cli issues list --max 10
```

### Status Page Update

```bash
# Update status (if using statuspage.io or similar)
curl -X POST https://api.statuspage.io/v1/pages/[PAGE_ID]/incidents \
  -H "Authorization: OAuth [TOKEN]" \
  -d '{"name":"Database Performance Degradation","status":"investigating"}'
```

---

**Document Control:**
- Review frequency: Quarterly
- Next review: February 1, 2026
- Approval required: CTO, Security Lead

```

---

### Task 2: Create Security Incident Log Template (Day 1 - Afternoon)

**File:** `docs/operations/incident-log-template.md`

```markdown
# Security Incident Log

**Incident ID:** INC-[YYYYMMDD]-[###]
**Date Opened:** [Date Time]
**Reported By:** [Name]
**Severity:** [P0/P1/P2/P3]
**Status:** [OPEN/INVESTIGATING/CONTAINED/RESOLVED/CLOSED]

---

## Incident Summary

**Type:** [Security Breach/Data Loss/Downtime/Other]
**Description:** [Brief description of what happened]

---

## Timeline

| Time | Event | Action Taken | Person |
|------|-------|--------------|--------|
| HH:MM | Incident detected | [Action] | [Name] |
| HH:MM | Team notified | [Action] | [Name] |
| HH:MM | Investigation started | [Action] | [Name] |
| HH:MM | Root cause identified | [Action] | [Name] |
| HH:MM | Fix deployed | [Action] | [Name] |
| HH:MM | Incident resolved | [Action] | [Name] |

---

## Impact Assessment

**Users Affected:** [Number]
**Data Affected:** [Description]
**Services Impacted:** [List]
**Estimated Cost:** [$Amount]

---

## Root Cause

[Technical explanation of what caused the incident]

---

## Resolution

[What was done to resolve the incident]

---

## Follow-Up Actions

- [ ] Action item 1 - Owner: [Name] - Due: [Date]
- [ ] Action item 2 - Owner: [Name] - Due: [Date]
- [ ] Schedule post-mortem - Owner: [Name] - Due: [Date]

---

## Lessons Learned

**What Went Well:**
-

**What Could Be Improved:**
-

**Action Items:**
-

---

**Closed By:** [Name]
**Closed Date:** [Date]
**Sign-Off:** [Signature]
```

---

### Task 3: Document & Commit

**Update README** to reference incident playbook:

**File:** `README.md` (add to Operations section)

```markdown
## Operations

- [Incident Response Playbook](docs/operations/incident-response-playbook.md)
- [Manual Rollback Procedure](docs/operations/manual-rollback-procedure.md)
- [Production Deployment Guide](scripts/db/PRODUCTION-WARNING.md)
```

**Commit:**
```bash
git add docs/operations/incident-response-playbook.md
git add docs/operations/incident-log-template.md
git add README.md
git commit -m "docs: add comprehensive incident response playbook

- Create incident response procedures for security and operations
- Define severity levels and response times (RTO: 4h, RPO: 1h)
- Document security incident response (detection, containment, remediation)
- Add data breach notification procedures and templates
- Document database corruption recovery procedures
- Add application downtime response procedures
- Include post-incident review process and templates
- Add quick reference for emergency commands

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Plan Status:** ✅ Ready | **Time:** 1 day | **Impact:** MEDIUM (Operations readiness)

**Prerequisites:** None (documentation only)
**Review Required:** CTO, Security Lead, Legal Counsel
