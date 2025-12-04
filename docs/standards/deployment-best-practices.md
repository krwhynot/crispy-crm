# Deployment Best Practices & Industry Standards

> **Crispy CRM Deployment Stack Standards Report**
>
> Generated: December 2025 | Based on official documentation from Vercel, GitHub, Supabase, and industry security standards.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vercel Hosting & CDN](#vercel-hosting--cdn)
3. [GitHub Pages (Alternative Deployment)](#github-pages-alternative-deployment)
4. [Supabase Cloud Database Hosting](#supabase-cloud-database-hosting)
5. [CI/CD Pipeline & Secrets Management](#cicd-pipeline--secrets-management)
6. [Cross-Platform Security Checklist](#cross-platform-security-checklist)
7. [Production Launch Checklist](#production-launch-checklist)

---

## Executive Summary

This document establishes industry-standard best practices for Crispy CRM's deployment infrastructure. Following these guidelines ensures:

- **Security**: Protection against common vulnerabilities (OWASP Top 10)
- **Reliability**: High availability and disaster recovery
- **Performance**: Optimized load times and response latency
- **Compliance**: Alignment with SOC 2 and data protection standards

### Technology Stack Overview

| Technology     | Purpose                                          | Project Reference               |
|----------------|--------------------------------------------------|----------------------------------|
| Vercel         | Primary hosting & CDN                            | Production deployment            |
| GitHub Pages   | Alternative static deployment (gh-pages)         | Documentation / Fallback         |
| Supabase Cloud | Database hosting                                 | Project: `aaqnanddcqvfiwhshndl`  |

---

## Vercel Hosting & CDN

### MUST Follow (Critical)

#### Security Requirements

| Requirement | Description | Priority |
|-------------|-------------|----------|
| **Content Security Policy (CSP)** | Implement CSP headers to prevent XSS attacks | Critical |
| **Security Headers** | Configure `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` | Critical |
| **Deployment Protection** | Enable protection to prevent unauthorized access to preview/staging deployments | Critical |
| **Environment Variables** | Store all secrets in Vercel environment variables, never in code | Critical |
| **Commit Lockfiles** | Pin dependencies via `package-lock.json` to prevent supply chain attacks | Critical |

#### Deployment Protection Configuration

```
Standard Protection (Recommended):
├── Protects all domains EXCEPT production custom domains
├── Preview deployments require Vercel Authentication
├── Generated URLs (*.vercel.app) are protected
└── Production custom domain remains publicly accessible
```

**Protection Methods Available:**
1. **Vercel Authentication** - Restricts to Vercel users with access rights (All plans)
2. **Password Protection** - Requires password for access (Enterprise/Pro add-on)
3. **Trusted IPs** - Whitelist specific IP addresses (Enterprise only)

#### Web Application Firewall (WAF)

| Feature | Configuration | Purpose |
|---------|---------------|---------|
| Custom Rules | Define traffic filtering rules | Block malicious patterns |
| IP Blocking | Block known bad actors | Prevent abuse |
| Managed Rulesets | Enable OWASP ruleset | Protect against common attacks |
| Rate Limiting | Configure request limits | Prevent DDoS/abuse |
| Bot Detection | Block unwanted bots | Reduce scraping/spam |

### SHOULD Follow (Recommended)

#### Operational Excellence

- [ ] Define incident response plan with escalation paths
- [ ] Configure rollback strategies for deployments
- [ ] Enable monorepo caching (if applicable) via Turborepo
- [ ] Perform zero-downtime DNS migration to Vercel DNS

#### Performance Optimization

| Optimization | Implementation | Impact |
|--------------|----------------|--------|
| Speed Insights | Enable in project settings | Real-time Core Web Vitals |
| Image Optimization | Use `next/image` or Vercel Image Optimization | 40-70% size reduction |
| Font Optimization | Use `next/font` | Eliminate layout shift |
| Script Optimization | Defer non-critical scripts | Faster TTI |
| Edge Functions | Deploy compute to edge | Lower latency |
| Fluid Compute | Enable for serverless functions | Reduced cold starts |

#### Region Configuration

```
CRITICAL: Deploy serverless functions in the SAME region as your database

Crispy CRM Configuration:
├── Supabase Region: Check project settings
├── Vercel Functions: Match to Supabase region
└── Benefit: Minimized database query latency
```

#### Reliability & Monitoring

- [ ] Enable Log Drains for persistent logging
- [ ] Configure Spend Management alerts
- [ ] Set up automatic Function failover (Enterprise)
- [ ] Implement distributed tracing
- [ ] Subscribe to [Vercel Status Page](https://www.vercel-status.com)

### Cost Optimization

| Strategy | Description |
|----------|-------------|
| Fluid Compute | Optimize function concurrency and reduce cold starts |
| ISR Revalidation | Set appropriate revalidation times (not too frequent) |
| Blob Storage | Move large media files (videos, GIFs) to Vercel Blob |
| Image Pricing | Opt-in to new image optimization pricing model |
| Memory/Duration | Review and right-size function configuration |

### Customer Responsibilities (Shared Responsibility Model)

Per Vercel's shared responsibility model, **you are responsible for**:

1. **Security Assessment** - Evaluating if Vercel's protection meets your needs
2. **Malicious Traffic Costs** - Implementing additional safeguards beyond Vercel's protections
3. **PCI DSS Compliance** - Using appropriate payment gateway (iframe integration)
4. **Source Code Security** - Secure storage and maintenance of source code
5. **Server-side Encryption** - Encrypting data in file system or database
6. **IAM Configuration** - Implementing proper access controls
7. **Region Selection** - Choosing appropriate compute regions for compliance
8. **Production Checklist** - Following Vercel's production checklist

---

## GitHub Pages (Alternative Deployment)

### MUST Follow (Critical)

#### Security Configuration

| Requirement | Implementation | Notes |
|-------------|----------------|-------|
| **HTTPS Enforcement** | Enable "Enforce HTTPS" in repository settings | Automatic SSL via Let's Encrypt |
| **Custom Domain Verification** | Add TXT record for domain verification | Prevents subdomain takeover |
| **Branch Protection** | Protect `gh-pages` branch | Prevent unauthorized deployments |
| **No Secrets in Static Files** | Never include API keys in built assets | Use environment variables at build time |

#### DNS Configuration for Custom Domains

```
A Records (Apex Domain):
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

CNAME Record (Subdomain):
<username>.github.io
```

### SHOULD Follow (Recommended)

#### GitHub Actions Deployment Workflow

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

#### Best Practices

- [ ] Use GitHub Actions for automated deployments (not legacy automatic builds)
- [ ] Configure deployment environment with approval gates
- [ ] Enable GitHub Pages from Actions source (not branch)
- [ ] Use artifact attestations for supply chain security
- [ ] Implement caching for faster builds

### Limitations to Consider

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Static only | No server-side rendering | Use client-side data fetching |
| 1GB repo limit | Large assets problematic | Use external CDN for media |
| 100GB bandwidth/month | High traffic may exceed | Monitor usage, consider Vercel |
| No custom headers | Limited security headers | Use meta tags where possible |
| Public repos only (Free) | Private sites require paid plan | Use Vercel for private |

---

## Supabase Cloud Database Hosting

### MUST Follow (Critical Security)

#### Row Level Security (RLS)

```sql
-- CRITICAL: Enable RLS on ALL tables
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own data"
ON your_table FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
ON your_table FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

| RLS Requirement | Status | Notes |
|-----------------|--------|-------|
| Enable RLS on all tables | MANDATORY | Tables without RLS allow any client to access/modify data |
| Create SELECT policies | MANDATORY | Define who can read what data |
| Create INSERT/UPDATE/DELETE policies | MANDATORY | Define who can modify what data |
| Test as different user roles | MANDATORY | Verify isolation between users |

#### API Key Security

| Key Type | Exposure | Usage |
|----------|----------|-------|
| `anon` key | Safe to expose (with RLS) | Frontend client libraries |
| `service_role` key | **NEVER EXPOSE** | Backend only, bypasses RLS |

```typescript
// CORRECT: Use anon key in frontend
const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// WRONG: Never use service_role in frontend
// const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY) // DANGER!
```

#### Authentication Security

| Requirement | Configuration | Priority |
|-------------|---------------|----------|
| Email Confirmations | Enable in Auth settings | Critical |
| OTP Expiry | Set to 3600 seconds (1 hour) or lower | Critical |
| MFA for Users | Enable for sensitive operations | High |
| MFA for Dashboard | Enable on Supabase account | Critical |
| Custom SMTP | Use your own SMTP server | High |
| CAPTCHA | Enable on signup/signin endpoints | High |

#### Platform Security

- [ ] **SSL Enforcement** - Enable in project settings
- [ ] **Network Restrictions** - Restrict database access by IP
- [ ] **MFA on Account** - Protect your Supabase dashboard access
- [ ] **MFA Enforcement on Org** - Require MFA for all team members
- [ ] **Multiple Owners** - Add backup owners to organization

### SHOULD Follow (Recommended)

#### Performance Optimization

| Optimization | Implementation | Impact |
|--------------|----------------|--------|
| Database Indexes | Add indexes for common query patterns | Faster queries |
| Query Analysis | Use `pg_stat_statements` | Identify slow queries |
| Connection Pooling | Use Supavisor (automatic) | Better connection management |
| Read Replicas | Enable for read-heavy workloads | Horizontal scaling |

```sql
-- Example: Add index for common queries
CREATE INDEX idx_opportunities_principal_id
ON opportunities(principal_id);

CREATE INDEX idx_activities_created_at
ON activities(created_at DESC);
```

#### Backup & Recovery

| Plan | Backup Type | Retention | RPO |
|------|-------------|-----------|-----|
| Free | Not available | - | - |
| Pro | Daily backups | 7 days | 24 hours |
| Pro + PITR | Point-in-time recovery | Configurable | Seconds |

**Recommendation for Crispy CRM:**
- Enable PITR if database > 4GB
- PITR is more resource-efficient than daily backups
- Provides granular recovery options

#### Rate Limits (Auth Endpoints)

| Endpoint | Default Limit | Customizable |
|----------|---------------|--------------|
| Email sending | 2/hour (custom SMTP: higher) | Yes, with custom SMTP |
| OTP sending | 360/hour | Yes |
| Token refresh | 1800/hour per IP | No |
| MFA challenge | 15/minute per IP | No |
| Anonymous signups | 30/hour per IP | No |

#### Monitoring & Availability

- [ ] Subscribe to [Supabase Status Page](https://status.supabase.com)
- [ ] Set up Slack notifications via RSS feed
- [ ] Use Security Advisor to check for issues
- [ ] Use Performance Advisor for optimization recommendations
- [ ] Configure custom SMTP for reliable auth emails

### Supabase Security Checklist

```
Pre-Production Security Audit:
├── [ ] RLS enabled on ALL tables
├── [ ] RLS policies tested for each user role
├── [ ] service_role key NOT in frontend code
├── [ ] SSL Enforcement enabled
├── [ ] Network Restrictions configured
├── [ ] Email confirmation enabled
├── [ ] OTP expiry set appropriately
├── [ ] MFA enabled on dashboard account
├── [ ] Custom SMTP configured
├── [ ] CAPTCHA enabled on auth endpoints
├── [ ] Security Advisor issues resolved
└── [ ] Replication settings reviewed for sensitive tables
```

---

## CI/CD Pipeline & Secrets Management

### MUST Follow (Critical)

#### Never Hardcode Secrets

```typescript
// WRONG - Hardcoded secrets
const API_KEY = "sk_live_abc123xyz789";
const DB_PASSWORD = "super_secret_password";

// CORRECT - Environment variables
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DATABASE_PASSWORD;
```

#### Secrets Storage Hierarchy

| Platform | Secret Storage | Access Method |
|----------|----------------|---------------|
| Vercel | Environment Variables | `process.env.VAR_NAME` |
| GitHub Actions | Repository/Environment Secrets | `${{ secrets.VAR_NAME }}` |
| Supabase | Project Settings > API | Dashboard or CLI |
| Local Development | `.env.local` (gitignored) | `process.env.VAR_NAME` |

#### GitHub Actions Secrets Best Practices

```yaml
# Use repository secrets
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

# Use GITHUB_TOKEN for GitHub API calls (automatic, minimal permissions)
permissions:
  contents: read
  pull-requests: write

# Use environment-specific secrets
jobs:
  deploy-production:
    environment: production  # Requires approval
    env:
      DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
```

#### Permission Principles

| Principle | Implementation |
|-----------|----------------|
| Least Privilege | Grant minimum permissions needed |
| Token Expiration | Set short expiration times |
| Fine-grained Tokens | Use fine-grained PATs over classic |
| GITHUB_TOKEN | Prefer over PATs in workflows |
| Environment Separation | Different secrets per environment |

### SHOULD Follow (Recommended)

#### Secret Scanning & Detection

- [ ] Enable GitHub Secret Scanning on repository
- [ ] Enable push protection to block commits with secrets
- [ ] Use pre-commit hooks for local secret detection
- [ ] Regularly audit for exposed secrets

#### Secret Rotation Strategy

| Secret Type | Rotation Frequency | Automation |
|-------------|-------------------|------------|
| API Keys | 90 days | Automated preferred |
| Database Passwords | 90 days | Manual with procedure |
| OAuth Tokens | Per session | Automatic |
| Service Account Keys | 180 days | Automated preferred |

#### Remediation Plan

If a secret is compromised:

1. **Immediately revoke** the compromised credential
2. **Generate** a new credential
3. **Update** all systems using the credential
4. **Audit** access logs for unauthorized use
5. **Document** the incident and response

#### Environment Configuration

```
Environment Hierarchy:
├── development
│   ├── Local .env.local (gitignored)
│   └── Vercel Development environment
├── preview/staging
│   ├── Vercel Preview environment
│   └── Supabase staging project (optional)
└── production
    ├── Vercel Production environment (protected)
    └── Supabase production project
```

### CI/CD Security Checklist

```
Pipeline Security:
├── [ ] No secrets in code or config files
├── [ ] All secrets stored in platform secret managers
├── [ ] Secret scanning enabled
├── [ ] Push protection enabled
├── [ ] GITHUB_TOKEN used where possible
├── [ ] Fine-grained PATs used (not classic)
├── [ ] Minimum permissions granted
├── [ ] Environment protection rules configured
├── [ ] Deployment approvals for production
├── [ ] Audit logging enabled
└── [ ] Secret rotation schedule documented
```

---

## Cross-Platform Security Checklist

### Authentication & Authorization

- [ ] Implement secure password hashing (handled by Supabase Auth)
- [ ] Enable email confirmation for new users
- [ ] Configure session timeouts appropriately
- [ ] Implement MFA for sensitive operations
- [ ] Test role-based access controls

### Input Validation & Data Protection

- [ ] Validate all user inputs (Zod at API boundary)
- [ ] Sanitize data before database operations
- [ ] Implement rate limiting on all endpoints
- [ ] Use parameterized queries (Supabase handles this)
- [ ] Enable HTTPS everywhere

### API Security

- [ ] Never expose service keys in frontend
- [ ] Implement CORS policies
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Enable API rate limiting
- [ ] Log and monitor API access

### Infrastructure Security

- [ ] Enable deployment protection
- [ ] Configure WAF rules
- [ ] Set up network restrictions
- [ ] Enable audit logging
- [ ] Subscribe to status pages

---

## Production Launch Checklist

### Pre-Launch (T-2 weeks)

- [ ] Complete security audit
- [ ] Run penetration testing (if applicable)
- [ ] Load test critical paths
- [ ] Verify backup/restore procedures
- [ ] Document runbooks

### Launch Day

- [ ] Verify all environment variables set
- [ ] Confirm DNS propagation
- [ ] Test all critical user flows
- [ ] Monitor error rates
- [ ] Have rollback plan ready

### Post-Launch

- [ ] Monitor performance metrics
- [ ] Review error logs daily
- [ ] Gather user feedback
- [ ] Plan iteration cycles
- [ ] Schedule security reviews

---

## References & Sources

### Official Documentation

- [Vercel Production Checklist](https://vercel.com/docs/production-checklist)
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Vercel Shared Responsibility Model](https://vercel.com/docs/security/shared-responsibility)
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase Security Configuration](https://supabase.com/docs/guides/security/product-security)
- [Supabase Secure Data Guide](https://supabase.com/docs/guides/database/secure-data)
- [GitHub Secrets Best Practices](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure)
- [Microsoft Secrets Management Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/secrets-best-practices)

### Compliance Resources

- [Supabase SOC 2 Compliance](https://supabase.com/docs/guides/security/soc-2-compliance)
- [Supabase HIPAA Compliance](https://supabase.com/docs/guides/security/hipaa-compliance)
- [Vercel Trust Center](https://security.vercel.com)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2025 | Claude Code | Initial comprehensive report |

---

> **Note**: This document should be reviewed quarterly and updated as platform features and security best practices evolve.
