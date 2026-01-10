# Storage Hygiene Audit

**Category:** Data Integrity / GDPR Compliance
**Frequency:** Weekly (recommended) or on-demand
**Script:** `scripts/storage-hygiene.ts`

---

## Overview

The Storage Hygiene Audit identifies **orphaned files** in Supabase Storage - files that exist in the storage bucket but are no longer referenced by any database record.

### Why This Matters

1. **GDPR "Right to be Forgotten"** - When a user deletes their data, associated files must also be deleted
2. **Storage Costs** - Orphaned files consume storage quota unnecessarily
3. **Data Integrity** - Orphaned files indicate gaps in the deletion workflow

---

## Quick Start

```bash
# Report only (safe - no changes)
just storage-audit

# Delete orphaned files
just storage-clean

# JSON output for CI/CD
just storage-audit-json
```

---

## What It Checks

### Storage Columns Scanned

| Table | Column | Type | Description |
|-------|--------|------|-------------|
| `organizations` | `logo_url` | text | Organization logos |
| `sales` | `avatar_url` | text | User profile photos |
| `activities` | `attachments` | array | Activity file attachments |
| `contact_notes` | `attachments` | jsonb | Contact note attachments |
| `opportunity_notes` | `attachments` | jsonb | Opportunity note attachments |
| `organization_notes` | `attachments` | jsonb | Organization note attachments |

### Detection Logic

1. **List all files** in the `attachments` storage bucket
2. **Query all file references** from the database tables above
3. **Compare the two sets**:
   - Files in storage but NOT in database → **Orphaned** (can be deleted)
   - Files in database but NOT in storage → **Missing** (data integrity issue)

---

## Output Examples

### Report Mode (Default)

```
╔════════════════════════════════════════════════════════════════╗
║             STORAGE HYGIENE AUDIT                              ║
╚════════════════════════════════════════════════════════════════╝

Mode: REPORT ONLY
Bucket: attachments

📊 Scanning database for file references...
  ✓ organizations.logo_url: found 50 rows
  ✓ sales.avatar_url: found 6 rows
  ✓ activities.attachments: found 12 rows
  ✓ contact_notes.attachments: found 8 rows
  ✓ opportunity_notes.attachments: found 5 rows
  ✓ organization_notes.attachments: found 3 rows

📁 Listing storage files...
  ✓ Storage bucket "attachments": found 92 files

🔍 Comparing storage vs database...

═══════════════════════════════════════════════════════════════════
                         AUDIT RESULTS
═══════════════════════════════════════════════════════════════════

  Files in storage:       92
  References in database: 84

  🔴 Orphaned files:      8
  🟡 Missing from storage: 0

  Orphaned files (not referenced in DB):
    - 0.1234567890.jpg
    - 0.9876543210.png
    - 1.5555555555.pdf
    ... and 5 more

  💡 To delete orphaned files, run with --delete flag:
     npx tsx scripts/storage-hygiene.ts --delete

═══════════════════════════════════════════════════════════════════
```

### JSON Mode (for CI/CD)

```json
{
  "timestamp": "2026-01-08T15:30:00.000Z",
  "bucket": "attachments",
  "totalFilesInStorage": 92,
  "totalReferencesInDb": 84,
  "orphanedFiles": ["0.1234567890.jpg", "0.9876543210.png"],
  "orphanedCount": 8,
  "referencedButMissing": [],
  "missingCount": 0,
  "deletedFiles": [],
  "deletedCount": 0,
  "errors": []
}
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Clean - no orphaned files, no errors |
| 1 | Issues found - orphaned files exist OR errors occurred |

Use exit codes in CI/CD pipelines to fail builds if storage hygiene degrades.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (for storage access) |

### Local Development

For local Supabase, use:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status --output json | jq -r .service_role_key) \
just storage-audit
```

### Production

Use environment variables from your CI/CD system or `.env` file.

---

## Integration with Delete Workflows

This audit works in conjunction with the automatic cleanup in:

- `contactsCallbacks.ts` → `collectContactFilePaths()` + `deleteStorageFiles()`
- `organizationsCallbacks.ts` → `collectOrganizationFilePaths()` + `deleteStorageFiles()`

When a record is archived (soft-deleted), the callback:
1. Collects all file paths BEFORE the archive
2. Executes the archive RPC
3. Deletes the files (fire-and-forget)

This audit catches any files that slip through:
- Files from before the cleanup was implemented
- Files from failed cleanup attempts
- Files orphaned by direct database edits

---

## Recommended Schedule

| Environment | Frequency | Mode |
|-------------|-----------|------|
| Development | On-demand | Report |
| Staging | Weekly | Delete |
| Production | Weekly | Report (manual delete review) |

---

## Troubleshooting

### "Missing required environment variables"

Ensure both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.

### "Failed to list storage files"

- Check if the `attachments` bucket exists
- Verify the service role key has storage access

### "Missing from storage" warnings

These indicate data integrity issues - the database references files that don't exist:
- File was manually deleted from storage
- File upload failed but URL was saved
- Backup/restore mismatch

---

## Related

- [SF-C10] Storage Cleanup on Delete - `storageCleanup.ts`
- [WF-C02] Cascade Soft Delete - `archive_organization_with_relations` RPC
- [WF-C01] Contact Archive - `archive_contact_with_relations` RPC
