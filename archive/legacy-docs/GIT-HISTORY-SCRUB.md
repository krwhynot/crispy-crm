# Git History Scrub Commands

**Created:** 2025-11-22
**Status:** EXECUTE AFTER CREDENTIAL ROTATION

---

## Prerequisites

1. All credentials rotated in Supabase Dashboard
2. Application tested and working with new credentials
3. Team notified about upcoming history rewrite
4. `git-filter-repo` installed: `pip install git-filter-repo`

---

## Files to Scrub from History

| File | Reason |
|------|--------|
| `.env-archive/` | Contains production credentials |
| `docs/archive/2025-11-testing-artifacts/activities-db-dump.sql` | Contains PII |

---

## Backup Location

Database dump archived to: `/home/krwhynot/secure-backup-crispy-crm/activities-db-dump.sql`

---

## Scrub Commands

### Option A: Using git-filter-repo (Recommended)

```bash
# Install if not present
pip install git-filter-repo

# Create a fresh clone to work with (safer)
cd /home/krwhynot/projects
git clone --mirror /home/krwhynot/projects/crispy-crm crispy-crm-scrub
cd crispy-crm-scrub

# Scrub sensitive files
git filter-repo --invert-paths \
  --path .env-archive/ \
  --path docs/archive/2025-11-testing-artifacts/activities-db-dump.sql

# Push to origin (requires force push)
git push --force --all origin
git push --force --tags origin
```

### Option B: Using BFG Repo-Cleaner (Alternative)

```bash
# Download BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Clone fresh
git clone --mirror git@github.com:YOUR_ORG/crispy-crm.git crispy-crm-scrub
cd crispy-crm-scrub

# Delete folders
java -jar ../bfg-1.14.0.jar --delete-folders .env-archive
java -jar ../bfg-1.14.0.jar --delete-files activities-db-dump.sql

# Cleanup
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Push
git push --force
```

---

## After Scrubbing

### Notify Team

Send this message to all team members:

```
Git history has been rewritten to remove sensitive files.

Please run these commands to update your local repo:

git fetch --all
git reset --hard origin/main
git clean -fd

If you have local branches, you may need to rebase them.
```

### Update .gitignore

Ensure these patterns are in `.gitignore`:

```gitignore
# Sensitive files - never commit
.env-archive/
*.sql.dump
*-db-dump.sql
```

### Add Secret Scanner to CI

Add to `.github/workflows/security.yml`:

```yaml
- name: Scan for secrets
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Verification

After scrubbing, verify files are gone:

```bash
# Should return nothing
git log --all --full-history -- .env-archive/
git log --all --full-history -- "*db-dump.sql"
```

---

## IMPORTANT

- **DO NOT** run scrub commands until credentials are rotated
- **DO NOT** run on production repo until tested on a clone
- **BACKUP** the repo before running (`pre-cleanup-2025-11-22` tag created)
