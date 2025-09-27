# Supabase Migration Audit Results
**Date**: 2025-01-27
**Total Migrations**: 68
**Database**: aaqnanddcqvfiwhshndl (Crispy)

## Migration Categorization Table

| # | Version | Name | Category | Operations | Dependencies | Keep/Archive | Notes |
|---|---------|------|----------|------------|--------------|--------------|-------|
| 1 | 20250923012432 | create_summary_views_fixed | DUPLICATE | Create summary views | None | ARCHIVE | First attempt at summary views, superseded |
| 2 | 20250923012501 | create_init_state_and_notes_views_fixed | INITIAL | Create initial views | #1 | ARCHIVE | Early schema setup |
| 3 | 20250923025604 | create_attachments_storage_bucket | CURRENT | Create storage bucket | None | KEEP | Storage configuration needed |
| 4 | 20250923025618 | create_attachments_bucket_policies | CURRENT | Storage policies | #3 | KEEP | Storage security policies |
| 5 | 20250923025633 | create_opportunity_participants_junction | INITIAL | Junction table | None | KEEP | Core junction table |
| 6 | 20250923025647 | create_opportunity_contacts_junction | INITIAL | Junction table | None | KEEP | Core junction table |
| 7 | 20250923025653 | fix_init_state_rls_and_helper_functions | FIX | RLS fixes | #2 | ARCHIVE | Fixing initial setup |
| 8 | 20250923025729 | implement_core_table_rls_policies | INITIAL | RLS policies | None | KEEP | Core RLS setup |
| 9 | 20250923025750 | fix_views_for_react_admin | FIX | View fixes | #1,#2 | ARCHIVE | View compatibility fixes |
| 10 | 20250923025810 | implement_supporting_table_rls_policies | INITIAL | RLS policies | #8 | KEEP | Supporting table RLS |
| 11 | 20250923025958 | implement_junction_and_remaining_table_rls_policies_fixed | INITIAL | RLS policies | #8,#10 | KEEP | Junction table RLS |
| 12 | 20250923030027 | fix_view_security_definer | FIX | Security fixes | #1,#9 | ARCHIVE | First security definer fix attempt |
| 13 | 20250923030128 | add_missing_opportunity_columns | INITIAL | Add columns | None | KEEP | Core opportunity fields |
| 14 | 20250923030219 | phase_1_3_opportunities_enhancements | INITIAL | Enhancements | #13 | KEEP | Opportunity enhancements |
| 15 | 20250923030418 | fix_security_definer_views_and_functions_corrected | FIX | Security fixes | #12 | ARCHIVE | Second security definer fix |
| 16 | 20250923030557 | recreate_summary_views_final | DUPLICATE | Recreate views | #1,#9 | ARCHIVE | Second attempt at summary views |
| 17 | 20250923030710 | validate_migration_integrity | OBSOLETE | Validation | All | ARCHIVE | Temporary validation |
| 18 | 20250923043043 | create_camelcase_views_for_compatibility | OBSOLETE | Compatibility | #16 | ARCHIVE | Backward compatibility (removed later) |
| 19 | 20250923051144 | fix_view_security_definer_issues | FIX | Security fixes | #15 | ARCHIVE | Third security definer fix |
| 20 | 20250923052310 | fix_contacts_summary_with_correct_columns | FIX | View fix | #16 | ARCHIVE | First contacts summary fix |
| 21 | 20250923052700 | fix_database_views_and_indexes | FIX | Views/Indexes | #16,#20 | ARCHIVE | General view fixes |
| 22 | 20250923052720 | optimize_view_performance_indexes | CURRENT | Add indexes | None | KEEP | Performance indexes |
| 23 | 20250923052948 | fix_summary_views_and_indexes | DUPLICATE | Fix views | #16,#21 | ARCHIVE | Third attempt at summary views |
| 24 | 20250923053327 | fix_rls_infinite_recursion | FIX | RLS fix | #8,#10,#11 | ARCHIVE | RLS recursion fix |
| 25 | 20250923053802 | add_index_field_to_opportunities_v4 | INITIAL | Add column | None | KEEP | Index field for Kanban |
| 26 | 20250923054107 | 000_migration_infrastructure | OBSOLETE | Infrastructure | None | ARCHIVE | Migration tracking (obsolete) |
| 27 | 20250923054251 | 003_feature_flags_table | OBSOLETE | Feature flags | None | ARCHIVE | Not used in current schema |
| 28 | 20250923054407 | recreate_opportunities_summary_with_sales_id | DUPLICATE | Recreate view | #16,#23 | ARCHIVE | Fourth attempt at opportunity view |
| 29 | 20250923054457 | add_sales_id_to_opportunities_simple | DUPLICATE | Add column | None | ARCHIVE | Duplicate of sales_id addition |
| 30 | 20250923054842 | add_sales_and_users_tables | INITIAL | Core tables | None | KEEP | Sales/users tables |
| 31 | 20250923054901 | contact_organizations_relationships | INITIAL | Junction table | None | KEEP | Contact-org relationships |
| 32 | 20250923054950 | activities_and_notes_tables_fixed | INITIAL | Core tables | None | KEEP | Activities and notes |
| 33 | 20250923055018 | tasks_and_tags_tables | INITIAL | Core tables | None | KEEP | Tasks and tags |
| 34 | 20250923055339 | enable_rls_core_tables_fixed | FIX | RLS fix | #8,#24 | ARCHIVE | RLS re-enabling |
| 35 | 20250923060021 | add_missing_foreign_key_indexes | CURRENT | Add indexes | None | KEEP | FK indexes (first attempt) |
| 36 | 20250923062246 | fix_companies_table_and_view | OBSOLETE | Old naming | None | ARCHIVE | Companies (old naming) |
| 37 | 20250923062547 | critical_performance_indexes | CURRENT | Add indexes | #22 | KEEP | Performance indexes |
| 38 | 20250923063501 | add_category_to_opportunities | INITIAL | Add column | None | KEEP | Category field |
| 39 | 20250923064118 | add_sales_id_to_opportunities | DUPLICATE | Add column | #29 | ARCHIVE | Duplicate sales_id |
| 40 | 20250923080818 | fix_demo_access_cascade_20250123 | OBSOLETE | Demo fixes | None | ARCHIVE | Demo environment specific |
| 41 | 20250923080944 | add_business_logic_retry_20250123 | INITIAL | Functions | None | KEEP | Business logic functions |
| 42 | 20250923101237 | fix_sales_table_schema | FIX | Table fix | #30 | ARCHIVE | Sales table fixes |
| 43 | 20250923101326 | link_auth_users_to_sales | INITIAL | FK constraint | #30 | KEEP | Auth linking |
| 44 | 20250923102737 | fix_critical_security_vulnerabilities | FIX | Security | All RLS | ARCHIVE | Security patches |
| 45 | 20250923102754 | add_missing_foreign_key_indexes | DUPLICATE | Add indexes | #35 | ARCHIVE | Duplicate FK indexes |
| 46 | 20250923102828 | optimize_rls_helper_functions | FIX | RLS optimize | #8,#10,#11 | ARCHIVE | RLS optimization |
| 47 | 20250923112406 | rename_tables_to_new_schema | OBSOLETE | Rename | All | ARCHIVE | Companies→Organizations rename |
| 48 | 20250924051946 | create_companies_compatibility_view_fixed | OBSOLETE | Compatibility | #47 | ARCHIVE | Backward compat (removed) |
| 49 | 20250924052024 | drop_and_recreate_compatibility_views | OBSOLETE | Compatibility | #48 | ARCHIVE | Backward compat (removed) |
| 50 | 20250924052314 | fix_contacts_summary_view | FIX | View fix | #20 | ARCHIVE | Second contacts summary fix |
| 51 | 20250924101431 | fix_contact_organization_plural | FIX | Naming fix | #31 | ARCHIVE | Pluralization fix |
| 52 | 20250925024823 | fix_summary_view_permissions | FIX | Permissions | All views | ARCHIVE | View permissions fix |
| 53 | 20250925042904 | add_missing_contact_columns | INITIAL | Add columns | None | KEEP | Contact fields |
| 54 | 20250925044737 | fresh_crm_schema | OBSOLETE | Full reset | All | ARCHIVE | Complete schema reset attempt |
| 55 | 20250925060832 | fix_views_security_definer | FIX | Security | #19,#52 | ARCHIVE | Fourth security definer fix |
| 56 | 20250925061126 | fix_table_permissions_authenticated | FIX | Permissions | All RLS | ARCHIVE | RLS permissions fix |
| 57 | 20250925103945 | add_sales_disabled_column | INITIAL | Add column | #30 | KEEP | Disabled field |
| 58 | 20250926014055 | fix_summary_views_with_correct_columns | DUPLICATE | Fix views | All views | ARCHIVE | Fifth summary views attempt (LATEST) |
| 59 | 20250926014658 | remove_backward_compatibility_views | OBSOLETE | Remove compat | #48,#49 | ARCHIVE | Remove backward compat |
| 60 | 20250926024833 | fix_organizations_search_trigger | FIX | Trigger fix | Search | ARCHIVE | Search trigger fix |
| 61 | 20250926031832 | fix_organization_terminology_v3 | OBSOLETE | Rename | #47 | ARCHIVE | Third terminology fix |
| 62 | 20250926043705 | create_missing_contacts_opportunities_views | CURRENT | Create views | None | KEEP | Final views (LATEST) |
| 63 | 20250926044749 | grant_anon_access_to_contacts_summary | CURRENT | Permissions | #62 | KEEP | Anon access grants |
| 64 | 20250926050007 | grant_permissions_to_tags_table | CURRENT | Permissions | #33 | KEEP | Tags permissions |
| 65 | 20250926050121 | 20250926120000_remove_tasks_archived_at | INITIAL | Remove column | #33 | KEEP | Remove archived_at |
| 66 | 20250926050305 | 20250926121000_add_set_primary_organization_rpc | INITIAL | Add function | None | KEEP | RPC function |
| 67 | 20250926060323 | simple_backward_compatibility_removal | OBSOLETE | Remove compat | #59 | ARCHIVE | Final compat removal |
| 68 | 20250926125832 | organization_pipeline_migration_final | OBSOLETE | Final rename | #47,#61 | ARCHIVE | Final org migration |

## Summary Statistics

### By Category:
- **INITIAL** (Core Schema): 18 migrations - KEEP
- **CURRENT** (Active Features): 8 migrations - KEEP
- **DUPLICATE** (Repeated Operations): 8 migrations - ARCHIVE
- **FIX** (Fixing Previous): 17 migrations - ARCHIVE
- **OBSOLETE** (No Longer Needed): 17 migrations - ARCHIVE

### Key Findings:

1. **Summary Views Created/Fixed 5 Times**:
   - #1, #16, #23, #28, #58 (keep #62 - latest)

2. **Security Definer Fixed 4 Times**:
   - #12, #15, #19, #55 (consolidated in final)

3. **Contacts Summary Fixed 3 Times**:
   - #20, #50, #62 (keep #62 - latest)

4. **Foreign Key Indexes Added Twice**:
   - #35, #45 (keep #35)

5. **Backward Compatibility Added Then Removed**:
   - Added: #18, #48, #49
   - Removed: #59, #67

6. **Companies → Organizations Rename Chain**:
   - #36, #47, #61, #68 (5+ related migrations)

### Migrations to Keep (26 total):
- Core table creation (10)
- Essential columns/fields (6)
- Current indexes (3)
- Final views (2)
- RLS policies (3)
- Storage setup (2)

### Migrations to Archive (42 total):
- Duplicate operations (8)
- Fix attempts (17)
- Obsolete/removed features (17)