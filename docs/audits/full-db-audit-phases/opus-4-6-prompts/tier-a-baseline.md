# Tier A Official Baseline (Execution Reference)

**Captured:** 2026-02-10 (post-pre-work)
**Purpose:** This is the OFFICIAL execution reference baseline per Q1 decision.
**Pre-work completed:** product_features parity (Blocker 1), env vars verified (Blocker 2), daily-digest deferred (not MVP).

## Cloud Summary Counts

| Metric | Count |
|--------|-------|
| Tables | 26 |
| Views | 27 |
| Triggers | 52 |
| RLS Policies | 100 |
| Indexes | 192 |
| Functions (distinct) | 109 |
| Migrations | 356 |

## Vault Secrets

- `project_url`: present
- `service_role_key`: present

## Edge Function Env Vars (verified via Dashboard)

- `SUPABASE_SERVICE_ROLE_KEY`: present (SHA256: 067216b8...)
- `CRON_SECRET`: present (SHA256: 6a352392...)

## Cloud Triggers (52)

| Trigger | Table | Function | Timing |
|---------|-------|----------|--------|
| cascade_activity_contact_trigger | activities | cascade_activity_contact_from_opportunity | BEFORE |
| trigger_log_task_completed | activities | log_task_completed | AFTER |
| trigger_set_activity_created_by | activities | set_activity_created_by | BEFORE |
| trigger_set_founding_interaction | activities | set_founding_interaction | AFTER |
| trigger_validate_activity_consistency | activities | validate_activity_consistency | BEFORE |
| set_updated_by_contact_notes | contact_notes | set_updated_by | BEFORE |
| trigger_set_contact_notes_updated_by | contact_notes | set_contact_notes_updated_by | BEFORE |
| trigger_update_contact_notes_updated_at | contact_notes | update_contact_notes_updated_at | BEFORE |
| audit_contacts_changes | contacts | audit_changes | AFTER |
| set_updated_by_contacts | contacts | set_updated_by | BEFORE |
| trigger_log_contact_org_linked | contacts | log_contact_org_linked | AFTER |
| trigger_log_contact_org_unlinked | contacts | log_contact_org_unlinked | AFTER |
| trigger_update_contacts_search_tsv | contacts | update_search_tsv | BEFORE |
| update_distributor_principal_authorizations_updated_at | distributor_principal_authorizations | update_updated_at_column | BEFORE |
| trigger_set_interaction_participant_created_by | interaction_participants | set_interaction_participant_created_by | BEFORE |
| trigger_cleanup_old_notifications | notifications | cleanup_old_notifications | AFTER |
| audit_opportunities_changes | opportunities | audit_changes | AFTER |
| enforce_related_opportunity_principal | opportunities | validate_related_opportunity_principal | BEFORE |
| opportunities_version_increment | opportunities | increment_opportunity_version | BEFORE |
| set_updated_by_opportunities | opportunities | set_updated_by | BEFORE |
| trg_validate_opportunity_closure | opportunities | validate_opportunity_closure | BEFORE |
| trigger_log_opportunity_archived | opportunities | log_opportunity_archived | AFTER |
| trigger_log_opportunity_created | opportunities | log_opportunity_created | AFTER |
| trigger_log_opportunity_stage_change | opportunities | log_opportunity_stage_change | AFTER |
| trigger_set_opportunity_owner_defaults | opportunities | set_opportunity_owner_defaults | BEFORE |
| trigger_update_opportunities_search_tsv | opportunities | update_opportunities_search_tsv | BEFORE |
| trigger_update_opportunity_stage_changed_at | opportunities | update_opportunity_stage_changed_at | BEFORE |
| set_updated_by_opportunity_notes | opportunity_notes | set_updated_by | BEFORE |
| trigger_set_opportunity_notes_updated_by | opportunity_notes | set_opportunity_notes_updated_by | BEFORE |
| trigger_update_opportunity_notes_updated_at | opportunity_notes | update_opportunity_notes_updated_at | BEFORE |
| trigger_set_opportunity_participant_created_by | opportunity_participants | set_opportunity_participant_created_by | BEFORE |
| trigger_validate_opportunity_participants | opportunity_participants | validate_opportunity_participants | BEFORE |
| set_opportunity_products_updated_at | opportunity_products | update_opportunity_products_updated_at | BEFORE |
| update_organization_distributors_updated_at | organization_distributors | update_updated_at_column | BEFORE |
| set_organization_notes_updated_by | organization_notes | set_organization_notes_updated_by | BEFORE |
| trigger_set_organizationNotes_updated_by | organization_notes | set_organization_notes_updated_by | BEFORE |
| trigger_update_organizationNotes_updated_at | organization_notes | update_organization_notes_updated_at | BEFORE |
| update_organization_notes_updated_at | organization_notes | update_organization_notes_updated_at | BEFORE |
| audit_organizations_changes | organizations | audit_changes | AFTER |
| check_organization_cycle | organizations | check_organization_cycle | BEFORE |
| check_parent_deletion | organizations | prevent_parent_org_deletion | BEFORE |
| prevent_parent_deletion | organizations | prevent_parent_organization_deletion | BEFORE |
| set_default_segment_id_trigger | organizations | set_default_segment_id | BEFORE |
| set_updated_by_organizations | organizations | set_updated_by | BEFORE |
| trigger_update_organizations_search_tsv | organizations | update_organizations_search_tsv | BEFORE |
| update_product_distributor_authorizations_updated_at | product_distributor_authorizations | update_updated_at_column | BEFORE |
| set_product_features_updated_at | product_features | update_product_features_updated_at | BEFORE |
| products_search_update | products | products_search_trigger | BEFORE |
| set_updated_by_products | products | set_updated_by | BEFORE |
| trigger_update_products_search_tsv | products | update_search_tsv | BEFORE |
| enforce_sales_column_restrictions_trigger | sales | enforce_sales_column_restrictions | BEFORE |
| keep_is_admin_synced | sales | sync_is_admin_from_role | BEFORE |

## Cloud Views (27)

| View | Column Refs |
|------|-------------|
| activities_summary | 43 |
| activities_with_task_details | 33 |
| authorization_status | 14 |
| campaign_choices | 2 |
| contactNotes | 11 |
| contact_duplicates | 7 |
| contacts_summary | 37 |
| contacts_with_account_manager | 34 |
| dashboard_pipeline_summary | 4 |
| dashboard_principal_summary | 17 |
| distinct_opportunities_campaigns | 2 |
| distinct_product_categories | 2 |
| duplicate_stats | 1 |
| entity_timeline | 18 |
| opportunities_summary | 51 |
| opportunityNotes | 11 |
| organizationNotes | 10 |
| organization_primary_distributor | 9 |
| organizations_summary | 33 |
| organizations_with_account_manager | 33 |
| principal_opportunities | 11 |
| principal_pipeline_summary | 19 |
| priority_tasks | 26 |
| product_distributors_summary | 16 |
| products_summary | 14 |
| tasks_summary | 31 |
| tasks_v | 20 |

## Cloud RLS Policies (100)

Full policy dump captured via `pg_policies` query. Key counts by table:

| Table | Policies |
|-------|----------|
| activities | 5 |
| audit_trail | 1 |
| contact_notes | 4 |
| contacts | 4 |
| dashboard_snapshots | 1 |
| distributor_principal_authorizations | 4 |
| interaction_participants | 4 |
| migration_history | 1 |
| notifications | 4 |
| opportunities | 5 |
| opportunity_contacts | 4 |
| opportunity_notes | 4 |
| opportunity_participants | 4 |
| opportunity_products | 4 |
| organization_distributors | 4 |
| organization_notes | 4 |
| organizations | 4 |
| product_distributor_authorizations | 4 |
| product_distributors | 5 |
| product_features | 4 |
| products | 4 |
| sales | 6 |
| segments | 4 |
| tags | 7 |
| tutorial_progress | 3 |
| user_favorites | 4 |
| **Total** | **100** |

## Cloud Functions (109 distinct)

109 distinct public functions captured. Full listing available in session context.
Key categories:
- Trigger functions: ~30 (audit, search_tsv, updated_at, validation)
- Business logic: ~25 (archive/unarchive, authorization, digest, opportunity sync)
- Auth/role helpers: ~10 (is_admin, is_manager, current_sales_id, etc.)
- RPC functions: ~15 (log_interaction, create_opportunity, merge_contacts, etc.)
- Cron helpers: 2 (invoke_daily_digest_function, invoke_snapshot_capture_function)

## Cloud Indexes (192)

192 indexes across 26 tables. Full listing captured via `pg_indexes`.
Notable duplicate candidates flagged in Phase 2:
- `idx_product_distributor_auth_deleted_at` + `idx_product_distributor_authorizations_deleted_at` (same table, same definition)
- `idx_opportunities_customer_org` + `idx_opportunities_customer_organization_id` (same column, different WHERE clauses)

## 10-Day Tier D Eligibility Window

| Metric | Value |
|--------|-------|
| Start date | 2026-02-10 |
| Scope | All Tier D removal candidates (views + tables) |
| Success criteria | No confirmed business use for 10 consecutive days + owner signoff + dependency checks |
| Earliest eligible date | 2026-02-20 |

---

## Gate 1 Checklist

- [x] Cloud trigger baseline captured (52 triggers)
- [x] Cloud RLS policy baseline captured (100 policies)
- [x] Cloud index baseline captured (192 indexes)
- [x] Cloud function baseline captured (109 distinct)
- [x] Cloud view baseline captured (27 views)
- [x] Vault secrets verified (`project_url`, `service_role_key`)
- [x] Edge Function env vars verified (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`)
- [x] product_features parity restored (26 tables both envs)
- [x] daily-digest deferred (not MVP)
- [x] PITR availability verified — Pro plan confirmed (daily backups + 7-day PITR window)
- [x] DEPRECATED comments added to `tasks_v` and `tasks_summary` views (migration `20260210000007`)

**Gate 1 status: PASSED (11/11)** — All items complete as of 2026-02-10. Proceeding to Tier B.

---

*Captured by Claude Code (Opus 4.6) via Supabase MCP queries. This baseline is the execution reference for all subsequent tiers.*
