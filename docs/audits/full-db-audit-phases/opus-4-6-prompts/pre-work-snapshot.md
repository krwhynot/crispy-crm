# Pre-Work Baseline Snapshot (Read-Only)

**Captured:** 2026-02-10
**Purpose:** Reference point BEFORE pre-work items are resolved. NOT the official Tier A baseline.
**Official baseline:** To be captured AFTER pre-work completes.

## Cloud Environment Summary

| Metric | Count |
|--------|-------|
| Tables | 26 |
| Views | 27 |
| Triggers | 52 |
| Functions (distinct) | 109 |
| RLS Policies | 100 |
| Migrations | 355 |
| Latest Migration | `20260210043542` (`add_missing_cols_principal_pipeline_summary`) |

## Local Environment Summary

| Metric | Count |
|--------|-------|
| Tables | 25 (missing `product_features`) |
| Views | 26 |
| Triggers | 85 |
| Functions (distinct) | 116 |
| RLS Policies | 98 |
| Migrations | 355 |
| Latest Migration | `20260210000005` (`add_missing_cols_principal_pipeline_summary`) |

## Vault Secrets

- `project_url`: exists
- `service_role_key`: exists

## Cloud Row Counts

| Table | Rows |
|-------|------|
| activities | 71 |
| audit_trail | 194,446 |
| contact_notes | 0 |
| contacts | 1,664 |
| dashboard_snapshots | 0 |
| distributor_principal_authorizations | 4 |
| interaction_participants | 0 |
| migration_history | 0 |
| notifications | 0 |
| opportunities | 14 |
| opportunity_contacts | 0 |
| opportunity_notes | 0 |
| opportunity_participants | 0 |
| opportunity_products | 1 |
| organization_distributors | 673 |
| organization_notes | 0 |
| organizations | 2,093 |
| product_distributor_authorizations | 0 |
| product_distributors | 0 |
| product_features | 0 |
| products | 14 |
| sales | 8 |
| segments | 40 |
| tags | 0 |
| tutorial_progress | 0 |
| user_favorites | 11 |

## Cloud Triggers (52)

| Trigger | Table | Function |
|---------|-------|----------|
| cascade_activity_contact_trigger | activities | cascade_activity_contact_from_opportunity |
| trigger_log_task_completed | activities | log_task_completed |
| trigger_set_activity_created_by | activities | set_activity_created_by |
| trigger_set_founding_interaction | activities | set_founding_interaction |
| trigger_validate_activity_consistency | activities | validate_activity_consistency |
| set_updated_by_contact_notes | contact_notes | set_updated_by |
| trigger_set_contact_notes_updated_by | contact_notes | set_contact_notes_updated_by |
| trigger_update_contact_notes_updated_at | contact_notes | update_contact_notes_updated_at |
| audit_contacts_changes | contacts | audit_changes |
| set_updated_by_contacts | contacts | set_updated_by |
| trigger_log_contact_org_linked | contacts | log_contact_org_linked |
| trigger_log_contact_org_unlinked | contacts | log_contact_org_unlinked |
| trigger_update_contacts_search_tsv | contacts | update_search_tsv |
| update_distributor_principal_authorizations_updated_at | distributor_principal_authorizations | update_updated_at_column |
| trigger_set_interaction_participant_created_by | interaction_participants | set_interaction_participant_created_by |
| trigger_cleanup_old_notifications | notifications | cleanup_old_notifications |
| audit_opportunities_changes | opportunities | audit_changes |
| enforce_related_opportunity_principal | opportunities | validate_related_opportunity_principal |
| opportunities_version_increment | opportunities | increment_opportunity_version |
| set_updated_by_opportunities | opportunities | set_updated_by |
| trg_validate_opportunity_closure | opportunities | validate_opportunity_closure |
| trigger_log_opportunity_archived | opportunities | log_opportunity_archived |
| trigger_log_opportunity_created | opportunities | log_opportunity_created |
| trigger_log_opportunity_stage_change | opportunities | log_opportunity_stage_change |
| trigger_set_opportunity_owner_defaults | opportunities | set_opportunity_owner_defaults |
| trigger_update_opportunities_search_tsv | opportunities | update_opportunities_search_tsv |
| trigger_update_opportunity_stage_changed_at | opportunities | update_opportunity_stage_changed_at |
| set_updated_by_opportunity_notes | opportunity_notes | set_updated_by |
| trigger_set_opportunity_notes_updated_by | opportunity_notes | set_opportunity_notes_updated_by |
| trigger_update_opportunity_notes_updated_at | opportunity_notes | update_opportunity_notes_updated_at |
| trigger_set_opportunity_participant_created_by | opportunity_participants | set_opportunity_participant_created_by |
| trigger_validate_opportunity_participants | opportunity_participants | validate_opportunity_participants |
| set_opportunity_products_updated_at | opportunity_products | update_opportunity_products_updated_at |
| update_organization_distributors_updated_at | organization_distributors | update_updated_at_column |
| set_organization_notes_updated_by | organization_notes | set_organization_notes_updated_by |
| trigger_set_organizationNotes_updated_by | organization_notes | set_organization_notes_updated_by |
| trigger_update_organizationNotes_updated_at | organization_notes | update_organization_notes_updated_at |
| update_organization_notes_updated_at | organization_notes | update_organization_notes_updated_at |
| audit_organizations_changes | organizations | audit_changes |
| check_organization_cycle | organizations | check_organization_cycle |
| check_parent_deletion | organizations | prevent_parent_org_deletion |
| prevent_parent_deletion | organizations | prevent_parent_organization_deletion |
| set_default_segment_id_trigger | organizations | set_default_segment_id |
| set_updated_by_organizations | organizations | set_updated_by |
| trigger_update_organizations_search_tsv | organizations | update_organizations_search_tsv |
| update_product_distributor_authorizations_updated_at | product_distributor_authorizations | update_updated_at_column |
| set_product_features_updated_at | product_features | update_product_features_updated_at |
| products_search_update | products | products_search_trigger |
| set_updated_by_products | products | set_updated_by |
| trigger_update_products_search_tsv | products | update_search_tsv |
| enforce_sales_column_restrictions_trigger | sales | enforce_sales_column_restrictions |
| keep_is_admin_synced | sales | sync_is_admin_from_role |

## 10-Day Tier D Eligibility Window

**Start:** 2026-02-10 (owner decision)
**Scope:** all Tier D removal candidates (views + tables)
**Success criteria:** no confirmed business use for 10 consecutive days + explicit owner signoff + dependency checks
**Earliest eligible date:** 2026-02-20

---

*Full trigger, RLS policy, index, function, and view snapshots captured via Supabase MCP queries. Raw data retained in Phase 4 session context.*
