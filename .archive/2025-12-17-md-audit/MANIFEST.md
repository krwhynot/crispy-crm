# Archive Manifest: 2025-12-17 Markdown Audit

**Archive Date:** December 17, 2025
**Archive Reason:** Consolidation of superseded, historical, and misplaced documentation files following comprehensive markdown audit

## Archived Files

### RBAC Documentation (Superseded)

1. **docs/rbac-research-findings.md**
   - **Reason:** Superseded by rbac-architecture-verified.md
   - **Archived To:** .archive/2025-12-17-md-audit/docs/rbac-research-findings.md

2. **docs/rbac-gap-analysis.md**
   - **Reason:** Findings incorporated into audit-00-executive-summary.md
   - **Archived To:** .archive/2025-12-17-md-audit/docs/rbac-gap-analysis.md

3. **docs/rbac-implementation-plan.md**
   - **Reason:** Future enhancement documentation
   - **Archived To:** .archive/2025-12-17-md-audit/docs/rbac-implementation-plan.md

4. **docs/rbac-inventory-part1-ui-api.md**
   - **Reason:** Superseded by rbac-architecture-inventory-final.md
   - **Archived To:** .archive/2025-12-17-md-audit/docs/rbac-inventory-part1-ui-api.md

5. **docs/rbac-inventory-part2a-database.md**
   - **Reason:** Superseded by rbac-architecture-inventory-final.md
   - **Archived To:** .archive/2025-12-17-md-audit/docs/rbac-inventory-part2a-database.md

6. **docs/rbac-inventory-part2b-migrations.md**
   - **Reason:** Superseded by rbac-architecture-inventory-final.md
   - **Archived To:** .archive/2025-12-17-md-audit/docs/rbac-inventory-part2b-migrations.md

7. **docs/rbac-recommendations.md**
   - **Reason:** Future enhancement documentation
   - **Archived To:** .archive/2025-12-17-md-audit/docs/rbac-recommendations.md

### Historical Issue Documentation

8. **docs/issues/2025-12-12_sales-slideover-edit-400-error.md**
   - **Reason:** Historical issue documentation (resolved)
   - **Archived To:** .archive/2025-12-17-md-audit/docs/issues/2025-12-12_sales-slideover-edit-400-error.md

### Historical Diagnostic Files

9. **docs/admin-edit-diagnostic-report.md**
   - **Reason:** Historical diagnostic (superseded)
   - **Archived To:** .archive/2025-12-17-md-audit/docs/admin-edit-diagnostic-report.md

10. **docs/admin-edit-interface-analysis.md**
    - **Reason:** Historical analysis (superseded)
    - **Archived To:** .archive/2025-12-17-md-audit/docs/admin-edit-interface-analysis.md

### Temporary Audit Files

11. **docs/audit/temp/audit-performance.md**
    - **Reason:** Temporary file in docs/audit/temp/
    - **Archived To:** .archive/2025-12-17-md-audit/docs/audit/temp/audit-performance.md

12. **docs/audit/temp/audit-health.md**
    - **Reason:** Temporary file in docs/audit/temp/
    - **Archived To:** .archive/2025-12-17-md-audit/docs/audit/temp/audit-health.md

13. **docs/audit/temp/audit-constitution.md**
    - **Reason:** Temporary file in docs/audit/temp/
    - **Archived To:** .archive/2025-12-17-md-audit/docs/audit/temp/audit-constitution.md

14. **docs/audit/temp/audit-consistency.md**
    - **Reason:** Temporary file in docs/audit/temp/
    - **Archived To:** .archive/2025-12-17-md-audit/docs/audit/temp/audit-consistency.md

### Completed Migration Documentation

15. **docs/audits/VAL-04-awaiting-response-cleanup-summary.md**
    - **Reason:** Migration completed successfully
    - **Archived To:** .archive/2025-12-17-md-audit/docs/audits/VAL-04-awaiting-response-cleanup-summary.md

### Post-MVP Scope Documentation

16. **docs/ui-ux/audits/deep-dive/internationalization-audit.md**
    - **Reason:** Post-MVP scope (i18n not in current roadmap)
    - **Archived To:** .archive/2025-12-17-md-audit/docs/ui-ux/audits/deep-dive/internationalization-audit.md

### Meta-Documentation

17. **docs/audits/create-forms/TEMPLATE.md**
    - **Reason:** Meta-documentation template (audit series complete)
    - **Archived To:** .archive/2025-12-17-md-audit/docs/audits/create-forms/TEMPLATE.md

### Serena-Specific Memory Files

18. **.serena/memories/gotrue-null-token-columns-fix.md**
    - **Reason:** Serena-specific memory file (historical fix documentation)
    - **Archived To:** .archive/2025-12-17-md-audit/.serena/memories/gotrue-null-token-columns-fix.md

### Duplicate/Misplaced Files

19. **data/outputs/audit-01-data-quality.md**
    - **Reason:** Duplicate file in wrong location (canonical version in docs/audits/)
    - **Archived To:** .archive/2025-12-17-md-audit/data/outputs/audit-01-data-quality.md
    - **Note:** Not under version control

20. **audit-05-dashboard-filtering.md** (root)
    - **Reason:** Duplicate file in wrong location (canonical version in docs/audits/)
    - **Archived To:** .archive/2025-12-17-md-audit/audit-05-dashboard-filtering.md

21. **validation-audit-report.md** (root)
    - **Reason:** Should be relocated to docs/audits/ (misplaced in root)
    - **Archived To:** .archive/2025-12-17-md-audit/validation-audit-report.md

### Build Artifacts

22. **dist/logos/Readme.md**
    - **Reason:** Build artifact (dist/ directory)
    - **Archived To:** .archive/2025-12-17-md-audit/dist/logos/Readme.md
    - **Note:** Not under version control

## Summary

- **Total Files Archived:** 22
- **Files Moved with Git:** 20
- **Files Moved (not tracked):** 2
- **Primary Categories:**
  - RBAC documentation (superseded): 7 files
  - Historical diagnostics/issues: 3 files
  - Temporary audit files: 4 files
  - Completed migrations: 1 file
  - Post-MVP scope: 1 file
  - Meta-documentation: 1 file
  - Serena memories: 1 file
  - Duplicates/misplaced: 3 files
  - Build artifacts: 1 file

## Archive Location

All files are preserved in `.archive/2025-12-17-md-audit/` with their original relative path structure maintained for easy reference and potential recovery.

## Git History

Files moved using `git mv` retain their full commit history. Use `git log --follow <archived-file-path>` to view the complete history of any archived file.
