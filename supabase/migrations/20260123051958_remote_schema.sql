create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

drop trigger if exists "update_activities_updated_at" on "public"."activities";

drop trigger if exists "update_contacts_updated_at" on "public"."contacts";

drop trigger if exists "audit_dashboard_snapshots_changes" on "public"."dashboard_snapshots";

drop trigger if exists "update_opportunities_updated_at" on "public"."opportunities";

drop trigger if exists "update_opportunity_participants_updated_at" on "public"."opportunity_participants";

drop trigger if exists "update_organizations_updated_at" on "public"."organizations";

drop trigger if exists "update_product_distributors_updated_at" on "public"."product_distributors";

drop trigger if exists "update_products_updated_at" on "public"."products";

drop trigger if exists "update_sales_updated_at" on "public"."sales";

drop trigger if exists "update_tags_updated_at" on "public"."tags";

drop trigger if exists "update_tasks_deprecated_updated_at" on "public"."tasks_deprecated";

drop trigger if exists "audit_tutorial_progress_changes" on "public"."tutorial_progress";

drop trigger if exists "set_updated_at_tutorial_progress" on "public"."tutorial_progress";

drop trigger if exists "update_tutorial_progress_updated_at" on "public"."tutorial_progress";

drop trigger if exists "audit_user_favorites_changes" on "public"."user_favorites";

drop trigger if exists "set_updated_at_user_favorites" on "public"."user_favorites";

drop trigger if exists "trigger_update_user_favorites_updated_at" on "public"."user_favorites";

drop policy "activities_insert_owner" on "public"."activities";

drop policy "activities_update_owner_or_privileged" on "public"."activities";

drop policy "audit_trail_admin_select" on "public"."audit_trail";

drop policy "contact_notes_delete_owner_or_privileged" on "public"."contact_notes";

drop policy "contact_notes_insert_owner" on "public"."contact_notes";

drop policy "contact_notes_update_owner_or_privileged" on "public"."contact_notes";

drop policy "contacts_delete_owner_or_privileged" on "public"."contacts";

drop policy "contacts_insert_owner" on "public"."contacts";

drop policy "contacts_update_owner_or_privileged" on "public"."contacts";

drop policy "interaction_participants_insert_owner" on "public"."interaction_participants";

drop policy "opportunities_update_dual_ownership" on "public"."opportunities";

drop policy "opportunity_notes_insert_owner" on "public"."opportunity_notes";

drop policy "opportunity_notes_update_owner_or_privileged" on "public"."opportunity_notes";

drop policy "opportunity_participants_insert_owner" on "public"."opportunity_participants";

drop policy "select_organization_distributors_visible" on "public"."organization_distributors";

drop policy "organization_notes_insert_owner" on "public"."organization_notes";

drop policy "organization_notes_update_owner_or_privileged" on "public"."organization_notes";

drop policy "organizations_delete_owner_or_admin" on "public"."organizations";

drop policy "organizations_insert_owner" on "public"."organizations";

drop policy "organizations_update_role_based" on "public"."organizations";

drop policy "product_distributors_insert_owner" on "public"."product_distributors";

drop policy "product_distributors_update_owner_or_privileged" on "public"."product_distributors";

drop policy "products_insert_privileged" on "public"."products";

drop policy "update_products_owned" on "public"."products";

drop policy "segments_delete_admin" on "public"."segments";

drop policy "segments_insert_privileged" on "public"."segments";

drop policy "segments_update_privileged" on "public"."segments";

drop policy "delete_tags_admin" on "public"."tags";

drop policy "tags_insert_privileged" on "public"."tags";

drop policy "update_tags_admin" on "public"."tags";

drop policy "tasks_deprecated_read_only" on "public"."tasks_deprecated";

drop policy "tasks_insert_policy" on "public"."tasks_deprecated";

drop policy "contact_notes_select_role_based" on "public"."contact_notes";

drop policy "opportunity_notes_select_role_based" on "public"."opportunity_notes";

drop policy "organization_notes_select_role_based" on "public"."organization_notes";

revoke delete on table "public"."activities" from "anon";

revoke insert on table "public"."activities" from "anon";

revoke references on table "public"."activities" from "anon";

revoke select on table "public"."activities" from "anon";

revoke trigger on table "public"."activities" from "anon";

revoke truncate on table "public"."activities" from "anon";

revoke update on table "public"."activities" from "anon";

revoke references on table "public"."activities" from "authenticated";

revoke trigger on table "public"."activities" from "authenticated";

revoke truncate on table "public"."activities" from "authenticated";

revoke delete on table "public"."activities" from "service_role";

revoke insert on table "public"."activities" from "service_role";

revoke references on table "public"."activities" from "service_role";

revoke select on table "public"."activities" from "service_role";

revoke trigger on table "public"."activities" from "service_role";

revoke truncate on table "public"."activities" from "service_role";

revoke update on table "public"."activities" from "service_role";

revoke delete on table "public"."audit_trail" from "anon";

revoke insert on table "public"."audit_trail" from "anon";

revoke references on table "public"."audit_trail" from "anon";

revoke select on table "public"."audit_trail" from "anon";

revoke trigger on table "public"."audit_trail" from "anon";

revoke truncate on table "public"."audit_trail" from "anon";

revoke update on table "public"."audit_trail" from "anon";

revoke references on table "public"."audit_trail" from "authenticated";

revoke trigger on table "public"."audit_trail" from "authenticated";

revoke truncate on table "public"."audit_trail" from "authenticated";

revoke delete on table "public"."audit_trail" from "service_role";

revoke insert on table "public"."audit_trail" from "service_role";

revoke references on table "public"."audit_trail" from "service_role";

revoke select on table "public"."audit_trail" from "service_role";

revoke trigger on table "public"."audit_trail" from "service_role";

revoke truncate on table "public"."audit_trail" from "service_role";

revoke update on table "public"."audit_trail" from "service_role";

revoke delete on table "public"."contact_notes" from "anon";

revoke insert on table "public"."contact_notes" from "anon";

revoke references on table "public"."contact_notes" from "anon";

revoke select on table "public"."contact_notes" from "anon";

revoke trigger on table "public"."contact_notes" from "anon";

revoke truncate on table "public"."contact_notes" from "anon";

revoke update on table "public"."contact_notes" from "anon";

revoke delete on table "public"."contact_notes" from "service_role";

revoke insert on table "public"."contact_notes" from "service_role";

revoke references on table "public"."contact_notes" from "service_role";

revoke select on table "public"."contact_notes" from "service_role";

revoke trigger on table "public"."contact_notes" from "service_role";

revoke truncate on table "public"."contact_notes" from "service_role";

revoke update on table "public"."contact_notes" from "service_role";

revoke delete on table "public"."contacts" from "anon";

revoke insert on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "anon";

revoke select on table "public"."contacts" from "anon";

revoke trigger on table "public"."contacts" from "anon";

revoke truncate on table "public"."contacts" from "anon";

revoke update on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "authenticated";

revoke trigger on table "public"."contacts" from "authenticated";

revoke truncate on table "public"."contacts" from "authenticated";

revoke delete on table "public"."contacts" from "service_role";

revoke insert on table "public"."contacts" from "service_role";

revoke references on table "public"."contacts" from "service_role";

revoke select on table "public"."contacts" from "service_role";

revoke trigger on table "public"."contacts" from "service_role";

revoke truncate on table "public"."contacts" from "service_role";

revoke update on table "public"."contacts" from "service_role";

revoke delete on table "public"."dashboard_snapshots" from "anon";

revoke insert on table "public"."dashboard_snapshots" from "anon";

revoke references on table "public"."dashboard_snapshots" from "anon";

revoke select on table "public"."dashboard_snapshots" from "anon";

revoke trigger on table "public"."dashboard_snapshots" from "anon";

revoke truncate on table "public"."dashboard_snapshots" from "anon";

revoke update on table "public"."dashboard_snapshots" from "anon";

revoke references on table "public"."dashboard_snapshots" from "authenticated";

revoke trigger on table "public"."dashboard_snapshots" from "authenticated";

revoke truncate on table "public"."dashboard_snapshots" from "authenticated";

revoke delete on table "public"."dashboard_snapshots" from "service_role";

revoke insert on table "public"."dashboard_snapshots" from "service_role";

revoke references on table "public"."dashboard_snapshots" from "service_role";

revoke select on table "public"."dashboard_snapshots" from "service_role";

revoke trigger on table "public"."dashboard_snapshots" from "service_role";

revoke truncate on table "public"."dashboard_snapshots" from "service_role";

revoke update on table "public"."dashboard_snapshots" from "service_role";

revoke delete on table "public"."distributor_principal_authorizations" from "anon";

revoke insert on table "public"."distributor_principal_authorizations" from "anon";

revoke references on table "public"."distributor_principal_authorizations" from "anon";

revoke select on table "public"."distributor_principal_authorizations" from "anon";

revoke trigger on table "public"."distributor_principal_authorizations" from "anon";

revoke truncate on table "public"."distributor_principal_authorizations" from "anon";

revoke update on table "public"."distributor_principal_authorizations" from "anon";

revoke references on table "public"."distributor_principal_authorizations" from "authenticated";

revoke trigger on table "public"."distributor_principal_authorizations" from "authenticated";

revoke truncate on table "public"."distributor_principal_authorizations" from "authenticated";

revoke delete on table "public"."interaction_participants" from "anon";

revoke insert on table "public"."interaction_participants" from "anon";

revoke references on table "public"."interaction_participants" from "anon";

revoke select on table "public"."interaction_participants" from "anon";

revoke trigger on table "public"."interaction_participants" from "anon";

revoke truncate on table "public"."interaction_participants" from "anon";

revoke update on table "public"."interaction_participants" from "anon";

revoke references on table "public"."interaction_participants" from "authenticated";

revoke trigger on table "public"."interaction_participants" from "authenticated";

revoke truncate on table "public"."interaction_participants" from "authenticated";

revoke delete on table "public"."interaction_participants" from "service_role";

revoke insert on table "public"."interaction_participants" from "service_role";

revoke references on table "public"."interaction_participants" from "service_role";

revoke select on table "public"."interaction_participants" from "service_role";

revoke trigger on table "public"."interaction_participants" from "service_role";

revoke truncate on table "public"."interaction_participants" from "service_role";

revoke update on table "public"."interaction_participants" from "service_role";

revoke delete on table "public"."migration_history" from "anon";

revoke insert on table "public"."migration_history" from "anon";

revoke references on table "public"."migration_history" from "anon";

revoke select on table "public"."migration_history" from "anon";

revoke trigger on table "public"."migration_history" from "anon";

revoke truncate on table "public"."migration_history" from "anon";

revoke update on table "public"."migration_history" from "anon";

revoke references on table "public"."migration_history" from "authenticated";

revoke trigger on table "public"."migration_history" from "authenticated";

revoke truncate on table "public"."migration_history" from "authenticated";

revoke delete on table "public"."migration_history" from "service_role";

revoke insert on table "public"."migration_history" from "service_role";

revoke references on table "public"."migration_history" from "service_role";

revoke select on table "public"."migration_history" from "service_role";

revoke trigger on table "public"."migration_history" from "service_role";

revoke truncate on table "public"."migration_history" from "service_role";

revoke update on table "public"."migration_history" from "service_role";

revoke delete on table "public"."notifications" from "anon";

revoke insert on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke trigger on table "public"."notifications" from "anon";

revoke truncate on table "public"."notifications" from "anon";

revoke update on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "authenticated";

revoke trigger on table "public"."notifications" from "authenticated";

revoke truncate on table "public"."notifications" from "authenticated";

revoke delete on table "public"."notifications" from "service_role";

revoke insert on table "public"."notifications" from "service_role";

revoke references on table "public"."notifications" from "service_role";

revoke select on table "public"."notifications" from "service_role";

revoke trigger on table "public"."notifications" from "service_role";

revoke truncate on table "public"."notifications" from "service_role";

revoke update on table "public"."notifications" from "service_role";

revoke delete on table "public"."opportunities" from "anon";

revoke insert on table "public"."opportunities" from "anon";

revoke references on table "public"."opportunities" from "anon";

revoke select on table "public"."opportunities" from "anon";

revoke trigger on table "public"."opportunities" from "anon";

revoke truncate on table "public"."opportunities" from "anon";

revoke update on table "public"."opportunities" from "anon";

revoke references on table "public"."opportunities" from "authenticated";

revoke trigger on table "public"."opportunities" from "authenticated";

revoke truncate on table "public"."opportunities" from "authenticated";

revoke delete on table "public"."opportunities" from "service_role";

revoke insert on table "public"."opportunities" from "service_role";

revoke references on table "public"."opportunities" from "service_role";

revoke select on table "public"."opportunities" from "service_role";

revoke trigger on table "public"."opportunities" from "service_role";

revoke truncate on table "public"."opportunities" from "service_role";

revoke update on table "public"."opportunities" from "service_role";

revoke delete on table "public"."opportunity_contacts" from "anon";

revoke insert on table "public"."opportunity_contacts" from "anon";

revoke references on table "public"."opportunity_contacts" from "anon";

revoke select on table "public"."opportunity_contacts" from "anon";

revoke trigger on table "public"."opportunity_contacts" from "anon";

revoke truncate on table "public"."opportunity_contacts" from "anon";

revoke update on table "public"."opportunity_contacts" from "anon";

revoke references on table "public"."opportunity_contacts" from "authenticated";

revoke trigger on table "public"."opportunity_contacts" from "authenticated";

revoke truncate on table "public"."opportunity_contacts" from "authenticated";

revoke delete on table "public"."opportunity_contacts" from "service_role";

revoke insert on table "public"."opportunity_contacts" from "service_role";

revoke references on table "public"."opportunity_contacts" from "service_role";

revoke select on table "public"."opportunity_contacts" from "service_role";

revoke trigger on table "public"."opportunity_contacts" from "service_role";

revoke truncate on table "public"."opportunity_contacts" from "service_role";

revoke update on table "public"."opportunity_contacts" from "service_role";

revoke delete on table "public"."opportunity_notes" from "anon";

revoke insert on table "public"."opportunity_notes" from "anon";

revoke references on table "public"."opportunity_notes" from "anon";

revoke select on table "public"."opportunity_notes" from "anon";

revoke trigger on table "public"."opportunity_notes" from "anon";

revoke truncate on table "public"."opportunity_notes" from "anon";

revoke update on table "public"."opportunity_notes" from "anon";

revoke references on table "public"."opportunity_notes" from "authenticated";

revoke trigger on table "public"."opportunity_notes" from "authenticated";

revoke truncate on table "public"."opportunity_notes" from "authenticated";

revoke delete on table "public"."opportunity_notes" from "service_role";

revoke insert on table "public"."opportunity_notes" from "service_role";

revoke references on table "public"."opportunity_notes" from "service_role";

revoke select on table "public"."opportunity_notes" from "service_role";

revoke trigger on table "public"."opportunity_notes" from "service_role";

revoke truncate on table "public"."opportunity_notes" from "service_role";

revoke update on table "public"."opportunity_notes" from "service_role";

revoke delete on table "public"."opportunity_participants" from "anon";

revoke insert on table "public"."opportunity_participants" from "anon";

revoke references on table "public"."opportunity_participants" from "anon";

revoke select on table "public"."opportunity_participants" from "anon";

revoke trigger on table "public"."opportunity_participants" from "anon";

revoke truncate on table "public"."opportunity_participants" from "anon";

revoke update on table "public"."opportunity_participants" from "anon";

revoke references on table "public"."opportunity_participants" from "authenticated";

revoke trigger on table "public"."opportunity_participants" from "authenticated";

revoke truncate on table "public"."opportunity_participants" from "authenticated";

revoke delete on table "public"."opportunity_participants" from "service_role";

revoke insert on table "public"."opportunity_participants" from "service_role";

revoke references on table "public"."opportunity_participants" from "service_role";

revoke select on table "public"."opportunity_participants" from "service_role";

revoke trigger on table "public"."opportunity_participants" from "service_role";

revoke truncate on table "public"."opportunity_participants" from "service_role";

revoke update on table "public"."opportunity_participants" from "service_role";

revoke delete on table "public"."opportunity_products" from "anon";

revoke insert on table "public"."opportunity_products" from "anon";

revoke references on table "public"."opportunity_products" from "anon";

revoke select on table "public"."opportunity_products" from "anon";

revoke trigger on table "public"."opportunity_products" from "anon";

revoke truncate on table "public"."opportunity_products" from "anon";

revoke update on table "public"."opportunity_products" from "anon";

revoke references on table "public"."opportunity_products" from "authenticated";

revoke trigger on table "public"."opportunity_products" from "authenticated";

revoke truncate on table "public"."opportunity_products" from "authenticated";

revoke delete on table "public"."opportunity_products" from "service_role";

revoke insert on table "public"."opportunity_products" from "service_role";

revoke references on table "public"."opportunity_products" from "service_role";

revoke select on table "public"."opportunity_products" from "service_role";

revoke trigger on table "public"."opportunity_products" from "service_role";

revoke truncate on table "public"."opportunity_products" from "service_role";

revoke update on table "public"."opportunity_products" from "service_role";

revoke delete on table "public"."organization_distributors" from "anon";

revoke insert on table "public"."organization_distributors" from "anon";

revoke references on table "public"."organization_distributors" from "anon";

revoke select on table "public"."organization_distributors" from "anon";

revoke trigger on table "public"."organization_distributors" from "anon";

revoke truncate on table "public"."organization_distributors" from "anon";

revoke update on table "public"."organization_distributors" from "anon";

revoke references on table "public"."organization_distributors" from "authenticated";

revoke trigger on table "public"."organization_distributors" from "authenticated";

revoke truncate on table "public"."organization_distributors" from "authenticated";

revoke delete on table "public"."organization_notes" from "anon";

revoke insert on table "public"."organization_notes" from "anon";

revoke references on table "public"."organization_notes" from "anon";

revoke select on table "public"."organization_notes" from "anon";

revoke trigger on table "public"."organization_notes" from "anon";

revoke truncate on table "public"."organization_notes" from "anon";

revoke update on table "public"."organization_notes" from "anon";

revoke references on table "public"."organization_notes" from "authenticated";

revoke trigger on table "public"."organization_notes" from "authenticated";

revoke truncate on table "public"."organization_notes" from "authenticated";

revoke delete on table "public"."organization_notes" from "service_role";

revoke insert on table "public"."organization_notes" from "service_role";

revoke references on table "public"."organization_notes" from "service_role";

revoke select on table "public"."organization_notes" from "service_role";

revoke trigger on table "public"."organization_notes" from "service_role";

revoke truncate on table "public"."organization_notes" from "service_role";

revoke update on table "public"."organization_notes" from "service_role";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke select on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke delete on table "public"."organizations" from "service_role";

revoke insert on table "public"."organizations" from "service_role";

revoke references on table "public"."organizations" from "service_role";

revoke select on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke update on table "public"."organizations" from "service_role";

revoke delete on table "public"."product_distributor_authorizations" from "anon";

revoke insert on table "public"."product_distributor_authorizations" from "anon";

revoke references on table "public"."product_distributor_authorizations" from "anon";

revoke select on table "public"."product_distributor_authorizations" from "anon";

revoke trigger on table "public"."product_distributor_authorizations" from "anon";

revoke truncate on table "public"."product_distributor_authorizations" from "anon";

revoke update on table "public"."product_distributor_authorizations" from "anon";

revoke references on table "public"."product_distributor_authorizations" from "authenticated";

revoke trigger on table "public"."product_distributor_authorizations" from "authenticated";

revoke truncate on table "public"."product_distributor_authorizations" from "authenticated";

revoke delete on table "public"."product_distributors" from "anon";

revoke insert on table "public"."product_distributors" from "anon";

revoke references on table "public"."product_distributors" from "anon";

revoke select on table "public"."product_distributors" from "anon";

revoke trigger on table "public"."product_distributors" from "anon";

revoke truncate on table "public"."product_distributors" from "anon";

revoke update on table "public"."product_distributors" from "anon";

revoke references on table "public"."product_distributors" from "authenticated";

revoke trigger on table "public"."product_distributors" from "authenticated";

revoke truncate on table "public"."product_distributors" from "authenticated";

revoke delete on table "public"."product_distributors" from "service_role";

revoke insert on table "public"."product_distributors" from "service_role";

revoke references on table "public"."product_distributors" from "service_role";

revoke select on table "public"."product_distributors" from "service_role";

revoke trigger on table "public"."product_distributors" from "service_role";

revoke truncate on table "public"."product_distributors" from "service_role";

revoke update on table "public"."product_distributors" from "service_role";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke select on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke references on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke delete on table "public"."products" from "service_role";

revoke insert on table "public"."products" from "service_role";

revoke references on table "public"."products" from "service_role";

revoke select on table "public"."products" from "service_role";

revoke trigger on table "public"."products" from "service_role";

revoke truncate on table "public"."products" from "service_role";

revoke update on table "public"."products" from "service_role";

revoke delete on table "public"."sales" from "anon";

revoke insert on table "public"."sales" from "anon";

revoke references on table "public"."sales" from "anon";

revoke select on table "public"."sales" from "anon";

revoke trigger on table "public"."sales" from "anon";

revoke truncate on table "public"."sales" from "anon";

revoke update on table "public"."sales" from "anon";

revoke delete on table "public"."sales" from "service_role";

revoke insert on table "public"."sales" from "service_role";

revoke references on table "public"."sales" from "service_role";

revoke select on table "public"."sales" from "service_role";

revoke trigger on table "public"."sales" from "service_role";

revoke truncate on table "public"."sales" from "service_role";

revoke update on table "public"."sales" from "service_role";

revoke delete on table "public"."segments" from "anon";

revoke insert on table "public"."segments" from "anon";

revoke references on table "public"."segments" from "anon";

revoke select on table "public"."segments" from "anon";

revoke trigger on table "public"."segments" from "anon";

revoke truncate on table "public"."segments" from "anon";

revoke update on table "public"."segments" from "anon";

revoke references on table "public"."segments" from "authenticated";

revoke trigger on table "public"."segments" from "authenticated";

revoke truncate on table "public"."segments" from "authenticated";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

revoke delete on table "public"."task_id_mapping" from "anon";

revoke insert on table "public"."task_id_mapping" from "anon";

revoke references on table "public"."task_id_mapping" from "anon";

revoke select on table "public"."task_id_mapping" from "anon";

revoke trigger on table "public"."task_id_mapping" from "anon";

revoke truncate on table "public"."task_id_mapping" from "anon";

revoke update on table "public"."task_id_mapping" from "anon";

revoke references on table "public"."task_id_mapping" from "authenticated";

revoke trigger on table "public"."task_id_mapping" from "authenticated";

revoke truncate on table "public"."task_id_mapping" from "authenticated";

revoke delete on table "public"."task_id_mapping" from "service_role";

revoke insert on table "public"."task_id_mapping" from "service_role";

revoke references on table "public"."task_id_mapping" from "service_role";

revoke select on table "public"."task_id_mapping" from "service_role";

revoke trigger on table "public"."task_id_mapping" from "service_role";

revoke truncate on table "public"."task_id_mapping" from "service_role";

revoke update on table "public"."task_id_mapping" from "service_role";

revoke delete on table "public"."tasks_deprecated" from "anon";

revoke insert on table "public"."tasks_deprecated" from "anon";

revoke references on table "public"."tasks_deprecated" from "anon";

revoke select on table "public"."tasks_deprecated" from "anon";

revoke trigger on table "public"."tasks_deprecated" from "anon";

revoke truncate on table "public"."tasks_deprecated" from "anon";

revoke update on table "public"."tasks_deprecated" from "anon";

revoke references on table "public"."tasks_deprecated" from "authenticated";

revoke trigger on table "public"."tasks_deprecated" from "authenticated";

revoke truncate on table "public"."tasks_deprecated" from "authenticated";

revoke delete on table "public"."tasks_deprecated" from "service_role";

revoke insert on table "public"."tasks_deprecated" from "service_role";

revoke references on table "public"."tasks_deprecated" from "service_role";

revoke select on table "public"."tasks_deprecated" from "service_role";

revoke trigger on table "public"."tasks_deprecated" from "service_role";

revoke truncate on table "public"."tasks_deprecated" from "service_role";

revoke update on table "public"."tasks_deprecated" from "service_role";

revoke delete on table "public"."test_user_metadata" from "anon";

revoke insert on table "public"."test_user_metadata" from "anon";

revoke references on table "public"."test_user_metadata" from "anon";

revoke select on table "public"."test_user_metadata" from "anon";

revoke trigger on table "public"."test_user_metadata" from "anon";

revoke truncate on table "public"."test_user_metadata" from "anon";

revoke update on table "public"."test_user_metadata" from "anon";

revoke references on table "public"."test_user_metadata" from "authenticated";

revoke trigger on table "public"."test_user_metadata" from "authenticated";

revoke truncate on table "public"."test_user_metadata" from "authenticated";

revoke delete on table "public"."test_user_metadata" from "service_role";

revoke insert on table "public"."test_user_metadata" from "service_role";

revoke references on table "public"."test_user_metadata" from "service_role";

revoke select on table "public"."test_user_metadata" from "service_role";

revoke trigger on table "public"."test_user_metadata" from "service_role";

revoke truncate on table "public"."test_user_metadata" from "service_role";

revoke update on table "public"."test_user_metadata" from "service_role";

revoke delete on table "public"."tutorial_progress" from "anon";

revoke insert on table "public"."tutorial_progress" from "anon";

revoke references on table "public"."tutorial_progress" from "anon";

revoke select on table "public"."tutorial_progress" from "anon";

revoke trigger on table "public"."tutorial_progress" from "anon";

revoke truncate on table "public"."tutorial_progress" from "anon";

revoke update on table "public"."tutorial_progress" from "anon";

revoke references on table "public"."tutorial_progress" from "authenticated";

revoke trigger on table "public"."tutorial_progress" from "authenticated";

revoke truncate on table "public"."tutorial_progress" from "authenticated";

revoke delete on table "public"."tutorial_progress" from "service_role";

revoke insert on table "public"."tutorial_progress" from "service_role";

revoke references on table "public"."tutorial_progress" from "service_role";

revoke select on table "public"."tutorial_progress" from "service_role";

revoke trigger on table "public"."tutorial_progress" from "service_role";

revoke truncate on table "public"."tutorial_progress" from "service_role";

revoke update on table "public"."tutorial_progress" from "service_role";

revoke delete on table "public"."user_favorites" from "anon";

revoke insert on table "public"."user_favorites" from "anon";

revoke references on table "public"."user_favorites" from "anon";

revoke select on table "public"."user_favorites" from "anon";

revoke trigger on table "public"."user_favorites" from "anon";

revoke truncate on table "public"."user_favorites" from "anon";

revoke update on table "public"."user_favorites" from "anon";

revoke references on table "public"."user_favorites" from "authenticated";

revoke trigger on table "public"."user_favorites" from "authenticated";

revoke truncate on table "public"."user_favorites" from "authenticated";

revoke delete on table "public"."user_favorites" from "service_role";

revoke insert on table "public"."user_favorites" from "service_role";

revoke references on table "public"."user_favorites" from "service_role";

revoke select on table "public"."user_favorites" from "service_role";

revoke trigger on table "public"."user_favorites" from "service_role";

revoke truncate on table "public"."user_favorites" from "service_role";

revoke update on table "public"."user_favorites" from "service_role";

alter table "public"."product_distributors" drop constraint "fk_product_distributors_created_by";

alter table "public"."product_distributors" drop constraint "product_distributors_updated_by_fkey";

alter table "public"."user_favorites" drop constraint "user_favorites_updated_by_fkey";

alter table "public"."activities" drop constraint "activities_contact_id_fkey";

alter table "public"."contact_notes" drop constraint "contact_notes_contact_id_fkey";

alter table "public"."dashboard_snapshots" drop constraint "dashboard_snapshots_sales_id_fkey";

alter table "public"."distributor_principal_authorizations" drop constraint "distributor_principal_authorizations_distributor_id_fkey";

alter table "public"."distributor_principal_authorizations" drop constraint "distributor_principal_authorizations_principal_id_fkey";

alter table "public"."interaction_participants" drop constraint "interaction_participants_activity_id_fkey";

alter table "public"."notifications" drop constraint "notifications_entity_type_check";

alter table "public"."notifications" drop constraint "notifications_type_check";

alter table "public"."opportunity_contacts" drop constraint "opportunity_contacts_contact_id_fkey";

alter table "public"."opportunity_contacts" drop constraint "opportunity_contacts_opportunity_id_fkey";

alter table "public"."opportunity_notes" drop constraint "opportunity_notes_opportunity_id_fkey";

alter table "public"."opportunity_participants" drop constraint "opportunity_participants_opportunity_id_fkey";

alter table "public"."opportunity_products" drop constraint "opportunity_products_opportunity_id_fkey";

alter table "public"."opportunity_products" drop constraint "opportunity_products_product_id_reference_fkey";

alter table "public"."organization_distributors" drop constraint "organization_distributors_distributor_id_fkey";

alter table "public"."organization_distributors" drop constraint "organization_distributors_organization_id_fkey";

alter table "public"."organization_notes" drop constraint "organization_notes_organization_id_fkey";

alter table "public"."product_distributor_authorizations" drop constraint "product_distributor_authorizations_distributor_id_fkey";

alter table "public"."product_distributor_authorizations" drop constraint "product_distributor_authorizations_product_id_fkey";

alter table "public"."product_distributors" drop constraint "fk_product_distributors_distributor";

alter table "public"."product_distributors" drop constraint "fk_product_distributors_product";

alter table "public"."tasks_deprecated" drop constraint "tasks_contact_id_fkey";

alter table "public"."tutorial_progress" drop constraint "tutorial_progress_sales_id_fkey";

drop function if exists "public"."audit_dashboard_snapshots"();

drop function if exists "public"."audit_tutorial_progress"();

drop function if exists "public"."audit_user_favorites"();

drop function if exists "public"."get_campaign_report_stats"(p_campaign text);

drop function if exists "public"."merge_duplicate_contacts"(p_keeper_id integer, p_duplicate_ids integer[]);

drop view if exists "public"."opportunity_stage_changes";

drop function if exists "public"."set_updated_at"();

drop function if exists "public"."sync_contact_organizations"(p_contact_id bigint, p_organizations jsonb);

drop function if exists "public"."update_user_favorites_updated_at"();

drop view if exists "public"."contacts_with_account_manager";

drop view if exists "public"."dashboard_principal_summary";

drop view if exists "public"."organizations_with_account_manager";

drop view if exists "public"."priority_tasks";

drop view if exists "public"."tasks_summary";

drop index if exists "public"."idx_activities_activity_date_active";

drop index if exists "public"."idx_opportunities_stage_active";

drop index if exists "public"."idx_opportunities_updated_at_active";

drop index if exists "public"."idx_opportunity_products_product_id_reference";

drop index if exists "public"."idx_opportunity_products_unique_active";

drop index if exists "public"."idx_organization_distributors_unique_active";

drop index if exists "public"."idx_sales_unique_non_user";

drop index if exists "public"."idx_sales_user_id";

drop index if exists "public"."idx_tasks_sales_due_date_incomplete";

drop index if exists "public"."idx_tutorial_progress_sales_id";

drop index if exists "public"."segments_name_case_insensitive_idx";

drop index if exists "public"."idx_activities_organization_id";

drop index if exists "public"."idx_activities_related_task_id";

drop index if exists "public"."idx_tasks_organization_id";

drop index if exists "public"."segments_name_type_case_insensitive_idx";

alter table "public"."activities" alter column "created_by" drop default;

alter table "public"."contacts" alter column "created_by" drop default;

alter table "public"."distributor_principal_authorizations" alter column "created_by" drop default;

alter table "public"."notifications" add column "metadata" jsonb;

alter table "public"."opportunities" alter column "created_by" drop default;

alter table "public"."opportunities" alter column "opportunity_owner_id" set not null;

alter table "public"."organization_distributors" alter column "created_by" drop default;

alter table "public"."organizations" alter column "created_by" drop default;

alter table "public"."product_distributor_authorizations" alter column "created_by" drop default;

alter table "public"."product_distributors" drop column "updated_by";

alter table "public"."product_distributors" alter column "created_by" drop default;

alter table "public"."products" alter column "created_by" drop default;

alter table "public"."segments" alter column "created_by" drop default;

alter table "public"."segments" alter column "created_by" drop not null;

alter table "public"."tutorial_progress" drop column "deleted_at";

alter table "public"."user_favorites" drop column "updated_at";

alter table "public"."user_favorites" drop column "updated_by";

CREATE INDEX idx_activities_created_by ON public.activities USING btree (created_by);

CREATE INDEX idx_activities_opportunity_id ON public.activities USING btree (opportunity_id) WHERE (opportunity_id IS NOT NULL);

CREATE INDEX idx_audit_trail_changed_by ON public.audit_trail USING btree (changed_by);

CREATE INDEX idx_contact_notes_created_by ON public.contact_notes USING btree (created_by);

CREATE INDEX idx_contact_notes_updated_by ON public.contact_notes USING btree (updated_by);

CREATE INDEX idx_distributor_principal_authorizations_created_by ON public.distributor_principal_authorizations USING btree (created_by);

CREATE INDEX idx_interaction_participants_created_by ON public.interaction_participants USING btree (created_by);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_opportunities_related_opportunity_id ON public.opportunities USING btree (related_opportunity_id);

CREATE INDEX idx_opportunity_notes_created_by ON public.opportunity_notes USING btree (created_by);

CREATE INDEX idx_opportunity_notes_updated_by ON public.opportunity_notes USING btree (updated_by);

CREATE INDEX idx_opportunity_participants_created_by ON public.opportunity_participants USING btree (created_by);

CREATE INDEX idx_organization_distributors_created_by ON public.organization_distributors USING btree (created_by);

CREATE INDEX idx_organization_notes_sales_id ON public.organization_notes USING btree (sales_id);

CREATE INDEX idx_organization_notes_updated_by ON public.organization_notes USING btree (updated_by);

CREATE INDEX idx_product_distributor_authorizations_created_by ON public.product_distributor_authorizations USING btree (created_by);

CREATE INDEX idx_product_distributor_authorizations_deleted_at ON public.product_distributor_authorizations USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX idx_products_created_by ON public.products USING btree (created_by);

CREATE INDEX idx_products_updated_by ON public.products USING btree (updated_by);

CREATE INDEX idx_segments_created_by ON public.segments USING btree (created_by);

CREATE INDEX idx_tasks_created_by ON public.tasks_deprecated USING btree (created_by);

CREATE UNIQUE INDEX opportunity_products_opportunity_id_product_id_reference_key ON public.opportunity_products USING btree (opportunity_id, product_id_reference);

CREATE UNIQUE INDEX segments_name_type_unique ON public.segments USING btree (name, segment_type);

CREATE UNIQUE INDEX uq_organization_distributor ON public.organization_distributors USING btree (organization_id, distributor_id);

CREATE INDEX idx_activities_organization_id ON public.activities USING btree (organization_id);

CREATE INDEX idx_activities_related_task_id ON public.activities USING btree (related_task_id);

CREATE INDEX idx_tasks_organization_id ON public.tasks_deprecated USING btree (organization_id);

CREATE UNIQUE INDEX segments_name_type_case_insensitive_idx ON public.segments USING btree (lower(name), segment_type);

alter table "public"."opportunity_products" add constraint "opportunity_products_opportunity_id_product_id_reference_key" UNIQUE using index "opportunity_products_opportunity_id_product_id_reference_key";

alter table "public"."organization_distributors" add constraint "uq_organization_distributor" UNIQUE using index "uq_organization_distributor";

alter table "public"."segments" add constraint "segments_name_type_unique" UNIQUE using index "segments_name_type_unique";

alter table "public"."activities" add constraint "activities_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE RESTRICT not valid;

alter table "public"."activities" validate constraint "activities_contact_id_fkey";

alter table "public"."contact_notes" add constraint "contact_notes_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE RESTRICT not valid;

alter table "public"."contact_notes" validate constraint "contact_notes_contact_id_fkey";

alter table "public"."dashboard_snapshots" add constraint "dashboard_snapshots_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) ON DELETE RESTRICT not valid;

alter table "public"."dashboard_snapshots" validate constraint "dashboard_snapshots_sales_id_fkey";

alter table "public"."distributor_principal_authorizations" add constraint "distributor_principal_authorizations_distributor_id_fkey" FOREIGN KEY (distributor_id) REFERENCES public.organizations(id) ON DELETE RESTRICT not valid;

alter table "public"."distributor_principal_authorizations" validate constraint "distributor_principal_authorizations_distributor_id_fkey";

alter table "public"."distributor_principal_authorizations" add constraint "distributor_principal_authorizations_principal_id_fkey" FOREIGN KEY (principal_id) REFERENCES public.organizations(id) ON DELETE RESTRICT not valid;

alter table "public"."distributor_principal_authorizations" validate constraint "distributor_principal_authorizations_principal_id_fkey";

alter table "public"."interaction_participants" add constraint "interaction_participants_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE RESTRICT not valid;

alter table "public"."interaction_participants" validate constraint "interaction_participants_activity_id_fkey";

alter table "public"."notifications" add constraint "notifications_entity_type_check" CHECK ((entity_type = ANY (ARRAY['task'::text, 'opportunity'::text, 'contact'::text, 'organization'::text, 'product'::text, 'digest'::text, NULL::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_entity_type_check";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['task_overdue'::text, 'task_assigned'::text, 'mention'::text, 'opportunity_won'::text, 'opportunity_lost'::text, 'system'::text, 'daily_digest'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."opportunity_contacts" add constraint "opportunity_contacts_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE RESTRICT not valid;

alter table "public"."opportunity_contacts" validate constraint "opportunity_contacts_contact_id_fkey";

alter table "public"."opportunity_contacts" add constraint "opportunity_contacts_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE RESTRICT not valid;

alter table "public"."opportunity_contacts" validate constraint "opportunity_contacts_opportunity_id_fkey";

alter table "public"."opportunity_notes" add constraint "opportunity_notes_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE RESTRICT not valid;

alter table "public"."opportunity_notes" validate constraint "opportunity_notes_opportunity_id_fkey";

alter table "public"."opportunity_participants" add constraint "opportunity_participants_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE RESTRICT not valid;

alter table "public"."opportunity_participants" validate constraint "opportunity_participants_opportunity_id_fkey";

alter table "public"."opportunity_products" add constraint "opportunity_products_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE RESTRICT not valid;

alter table "public"."opportunity_products" validate constraint "opportunity_products_opportunity_id_fkey";

alter table "public"."opportunity_products" add constraint "opportunity_products_product_id_reference_fkey" FOREIGN KEY (product_id_reference) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."opportunity_products" validate constraint "opportunity_products_product_id_reference_fkey";

alter table "public"."organization_distributors" add constraint "organization_distributors_distributor_id_fkey" FOREIGN KEY (distributor_id) REFERENCES public.organizations(id) ON DELETE RESTRICT not valid;

alter table "public"."organization_distributors" validate constraint "organization_distributors_distributor_id_fkey";

alter table "public"."organization_distributors" add constraint "organization_distributors_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT not valid;

alter table "public"."organization_distributors" validate constraint "organization_distributors_organization_id_fkey";

alter table "public"."organization_notes" add constraint "organization_notes_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT not valid;

alter table "public"."organization_notes" validate constraint "organization_notes_organization_id_fkey";

alter table "public"."product_distributor_authorizations" add constraint "product_distributor_authorizations_distributor_id_fkey" FOREIGN KEY (distributor_id) REFERENCES public.organizations(id) ON DELETE RESTRICT not valid;

alter table "public"."product_distributor_authorizations" validate constraint "product_distributor_authorizations_distributor_id_fkey";

alter table "public"."product_distributor_authorizations" add constraint "product_distributor_authorizations_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."product_distributor_authorizations" validate constraint "product_distributor_authorizations_product_id_fkey";

alter table "public"."product_distributors" add constraint "fk_product_distributors_distributor" FOREIGN KEY (distributor_id) REFERENCES public.organizations(id) ON DELETE RESTRICT not valid;

alter table "public"."product_distributors" validate constraint "fk_product_distributors_distributor";

alter table "public"."product_distributors" add constraint "fk_product_distributors_product" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."product_distributors" validate constraint "fk_product_distributors_product";

alter table "public"."tasks_deprecated" add constraint "tasks_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE RESTRICT not valid;

alter table "public"."tasks_deprecated" validate constraint "tasks_contact_id_fkey";

alter table "public"."tutorial_progress" add constraint "tutorial_progress_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) ON DELETE RESTRICT not valid;

alter table "public"."tutorial_progress" validate constraint "tutorial_progress_sales_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.archive_contact_with_relations(contact_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate input (fail-fast)
  IF contact_id IS NULL THEN
    RAISE EXCEPTION 'Contact ID cannot be null';
  END IF;

  -- Archive the contact
  UPDATE contacts
  SET deleted_at = NOW()
  WHERE id = contact_id AND deleted_at IS NULL;

  -- Cascade archive to activities (owned by this contact)
  UPDATE activities
  SET deleted_at = NOW()
  WHERE activities.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  -- Cascade archive to contact notes
  UPDATE "contactNotes"
  SET deleted_at = NOW()
  WHERE "contactNotes".contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  -- Cascade archive to interaction_participants
  UPDATE interaction_participants
  SET deleted_at = NOW()
  WHERE interaction_participants.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  -- Cascade archive to opportunity_contacts (junction table)
  -- Note: We archive the JUNCTION record, not the opportunity itself
  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_contacts.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

END;
$function$
;

CREATE OR REPLACE FUNCTION public.archive_organization_with_relations(org_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  contact_rec RECORD;
  opp_rec RECORD;
BEGIN
  -- Validate input (fail-fast)
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID cannot be null';
  END IF;

  -- Archive the organization
  UPDATE organizations
  SET deleted_at = NOW()
  WHERE id = org_id AND deleted_at IS NULL;

  -- Cascade archive to organization notes
  UPDATE "organizationNotes"
  SET deleted_at = NOW()
  WHERE "organizationNotes".organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  -- Cascade archive to activities (owned by this organization)
  UPDATE activities
  SET deleted_at = NOW()
  WHERE activities.organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  -- Cascade archive to organization_distributors (junction table)
  UPDATE organization_distributors
  SET deleted_at = NOW()
  WHERE organization_distributors.organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  -- Cascade archive to distributor_principal_authorizations
  -- (where this org is principal OR distributor)
  UPDATE distributor_principal_authorizations
  SET deleted_at = NOW()
  WHERE (distributor_principal_authorizations.principal_id = archive_organization_with_relations.org_id
      OR distributor_principal_authorizations.distributor_id = archive_organization_with_relations.org_id)
    AND deleted_at IS NULL;

  -- RECURSIVE: Archive all contacts that belong to this organization
  FOR contact_rec IN
    SELECT id FROM contacts
    WHERE organization_id = archive_organization_with_relations.org_id
      AND deleted_at IS NULL
  LOOP
    PERFORM archive_contact_with_relations(contact_rec.id);
  END LOOP;

  -- RECURSIVE: Archive opportunities where this org is the CUSTOMER
  -- (Customer owns the opportunity; principal/distributor are references)
  FOR opp_rec IN
    SELECT id FROM opportunities
    WHERE customer_organization_id = archive_organization_with_relations.org_id
      AND deleted_at IS NULL
  LOOP
    PERFORM archive_opportunity_with_relations(opp_rec.id);
  END LOOP;

END;
$function$
;

create or replace view "public"."contact_duplicates" as  WITH duplicate_groups AS (
         SELECT ((lower(TRIM(BOTH FROM COALESCE(contacts.first_name, ''::text))) || ' '::text) || lower(TRIM(BOTH FROM COALESCE(contacts.last_name, ''::text)))) AS normalized_name,
            contacts.organization_id,
            count(*) AS duplicate_count,
            array_agg(contacts.id ORDER BY contacts.created_at) AS contact_ids,
            min(contacts.created_at) AS first_created,
            max(contacts.created_at) AS last_created
           FROM public.contacts
          WHERE ((contacts.first_name IS NOT NULL) OR (contacts.last_name IS NOT NULL))
          GROUP BY ((lower(TRIM(BOTH FROM COALESCE(contacts.first_name, ''::text))) || ' '::text) || lower(TRIM(BOTH FROM COALESCE(contacts.last_name, ''::text)))), contacts.organization_id
         HAVING (count(*) > 1)
        )
 SELECT dg.normalized_name,
    dg.organization_id,
    o.name AS organization_name,
    dg.duplicate_count,
    dg.contact_ids,
    dg.first_created,
    dg.last_created,
    dg.contact_ids[1] AS keeper_id,
    dg.contact_ids[2:] AS duplicate_ids
   FROM (duplicate_groups dg
     LEFT JOIN public.organizations o ON ((o.id = dg.organization_id)))
  ORDER BY dg.duplicate_count DESC, dg.normalized_name;


create or replace view "public"."duplicate_stats" as  SELECT count(*) AS total_duplicate_groups,
    sum((duplicate_count - 1)) AS total_extra_records,
    sum(
        CASE
            WHEN (duplicate_count >= 3) THEN 1
            ELSE 0
        END) AS high_priority_groups,
    sum(
        CASE
            WHEN (duplicate_count = 2) THEN 1
            ELSE 0
        END) AS medium_priority_groups
   FROM public.contact_duplicates;


CREATE OR REPLACE FUNCTION public.merge_duplicate_contacts(p_keeper_id bigint, p_duplicate_ids bigint[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_notes_moved INT := 0;
  v_tasks_moved INT := 0;
  v_participants_moved INT := 0;
  v_contacts_archived INT := 0;
  v_result jsonb;
BEGIN
  -- Validate keeper exists and is not soft-deleted
  IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_keeper_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Keeper contact ID % does not exist or is deleted', p_keeper_id;
  END IF;

  -- Validate all duplicate IDs exist and are not already deleted
  IF EXISTS (
    SELECT 1 FROM unnest(p_duplicate_ids) AS did
    WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = did AND deleted_at IS NULL)
  ) THEN
    RAISE EXCEPTION 'One or more duplicate contact IDs do not exist or are already deleted';
  END IF;

  -- Prevent keeper from being in duplicate list
  IF p_keeper_id = ANY(p_duplicate_ids) THEN
    RAISE EXCEPTION 'Keeper ID cannot be in the duplicate IDs list';
  END IF;

  -- Transfer contact notes to keeper (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contactNotes' AND table_schema = 'public') THEN
    UPDATE "contactNotes"
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_notes_moved = ROW_COUNT;
  END IF;

  -- Transfer tasks to keeper (if table exists and has contact_id column)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'contact_id' AND table_schema = 'public'
  ) THEN
    UPDATE tasks
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_tasks_moved = ROW_COUNT;
  END IF;

  -- Transfer interaction participants to keeper (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interaction_participants' AND table_schema = 'public') THEN
    UPDATE interaction_participants
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_participants_moved = ROW_COUNT;
  END IF;

  -- SOFT DELETE duplicate contacts (Constitution fix)
  -- OLD: DELETE FROM contacts WHERE id = ANY(p_duplicate_ids);
  -- NEW: Use soft delete with deleted_at timestamp
  UPDATE contacts 
  SET deleted_at = NOW()
  WHERE id = ANY(p_duplicate_ids)
    AND deleted_at IS NULL;  -- Only soft-delete if not already deleted
  GET DIAGNOSTICS v_contacts_archived = ROW_COUNT;

  -- Return summary (renamed key for clarity)
  v_result := jsonb_build_object(
    'success', true,
    'keeper_id', p_keeper_id,
    'duplicates_archived', v_contacts_archived,  -- renamed from duplicates_removed
    'notes_transferred', v_notes_moved,
    'tasks_transferred', v_tasks_moved,
    'participants_transferred', v_participants_moved
  );

  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.unarchive_contact_with_relations(contact_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate input
  IF contact_id IS NULL THEN
    RAISE EXCEPTION 'Contact ID cannot be null';
  END IF;

  -- Unarchive the contact
  UPDATE contacts
  SET deleted_at = NULL
  WHERE id = contact_id;

  -- Cascade unarchive to activities
  UPDATE activities
  SET deleted_at = NULL
  WHERE activities.contact_id = unarchive_contact_with_relations.contact_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to contact notes
  UPDATE "contactNotes"
  SET deleted_at = NULL
  WHERE "contactNotes".contact_id = unarchive_contact_with_relations.contact_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to interaction_participants
  UPDATE interaction_participants
  SET deleted_at = NULL
  WHERE interaction_participants.contact_id = unarchive_contact_with_relations.contact_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to opportunity_contacts (junction table)
  UPDATE opportunity_contacts
  SET deleted_at = NULL
  WHERE opportunity_contacts.contact_id = unarchive_contact_with_relations.contact_id
    AND deleted_at IS NOT NULL;

END;
$function$
;

CREATE OR REPLACE FUNCTION public.unarchive_organization_with_relations(org_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  contact_rec RECORD;
  opp_rec RECORD;
BEGIN
  -- Validate input
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID cannot be null';
  END IF;

  -- Unarchive the organization
  UPDATE organizations
  SET deleted_at = NULL
  WHERE id = org_id;

  -- Cascade unarchive to organization notes
  UPDATE "organizationNotes"
  SET deleted_at = NULL
  WHERE "organizationNotes".organization_id = unarchive_organization_with_relations.org_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to activities
  UPDATE activities
  SET deleted_at = NULL
  WHERE activities.organization_id = unarchive_organization_with_relations.org_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to organization_distributors
  UPDATE organization_distributors
  SET deleted_at = NULL
  WHERE organization_distributors.organization_id = unarchive_organization_with_relations.org_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to distributor_principal_authorizations
  UPDATE distributor_principal_authorizations
  SET deleted_at = NULL
  WHERE (distributor_principal_authorizations.principal_id = unarchive_organization_with_relations.org_id
      OR distributor_principal_authorizations.distributor_id = unarchive_organization_with_relations.org_id)
    AND deleted_at IS NOT NULL;

  -- RECURSIVE: Unarchive contacts that belonged to this organization
  -- Note: This unarchives ALL contacts that were archived, which may include
  -- contacts archived for other reasons. For production, consider tracking
  -- archive reason or using a separate restore mechanism.
  FOR contact_rec IN
    SELECT id FROM contacts
    WHERE organization_id = unarchive_organization_with_relations.org_id
      AND deleted_at IS NOT NULL
  LOOP
    PERFORM unarchive_contact_with_relations(contact_rec.id);
  END LOOP;

  -- RECURSIVE: Unarchive opportunities where this org was the customer
  FOR opp_rec IN
    SELECT id FROM opportunities
    WHERE customer_organization_id = unarchive_organization_with_relations.org_id
      AND deleted_at IS NOT NULL
  LOOP
    PERFORM unarchive_opportunity_with_relations(opp_rec.id);
  END LOOP;

END;
$function$
;

create or replace view "public"."contacts_with_account_manager" as  SELECT c.id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.title,
    c.department,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.birthday,
    c.linkedin_url,
    c.twitter_handle,
    c.notes,
    c.sales_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.deleted_at,
    c.search_tsv,
    c.first_seen,
    c.last_seen,
    c.gender,
    c.tags,
    c.organization_id,
    c.updated_by,
    c.status,
    COALESCE((s.first_name || COALESCE((' '::text || s.last_name), ''::text)), 'Unassigned'::text) AS account_manager_name,
    (s.user_id IS NOT NULL) AS account_manager_is_user
   FROM (public.contacts c
     LEFT JOIN public.sales s ON ((c.sales_id = s.id)));


CREATE OR REPLACE FUNCTION public.create_booth_visitor_opportunity(_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  _org_id BIGINT;
  _contact_id BIGINT;
  _opp_id BIGINT;
  _account_manager_id BIGINT;
  _principal_id BIGINT;
  _email_val TEXT;
  _phone_val TEXT;
  _email_jsonb JSONB;
  _phone_jsonb JSONB;
  _principal_name TEXT;
  _principal_type organization_type;
  _opp_name TEXT;
  _first_name TEXT;
  _last_name TEXT;
  _org_name TEXT;
  _city TEXT;
  _state TEXT;
  _campaign TEXT;
  _quick_note TEXT;
  _create_contact BOOLEAN;
BEGIN
  _first_name := _data->>'first_name';
  _last_name := _data->>'last_name';
  _org_name := _data->>'org_name';
  _city := _data->>'city';
  _state := _data->>'state';
  _campaign := COALESCE(_data->>'campaign', '');
  _quick_note := _data->>'quick_note';
  _email_val := _data->>'email';
  _phone_val := _data->>'phone';
  _principal_id := (_data->>'principal_id')::BIGINT;
  _org_id := (_data->>'organization_id')::BIGINT;

  IF _principal_id IS NULL THEN
    RAISE EXCEPTION 'principal_id is required';
  END IF;

  _account_manager_id := COALESCE(
    (_data->>'account_manager_id')::BIGINT,
    (SELECT id FROM sales WHERE user_id = auth.uid())
  );

  IF _account_manager_id IS NULL THEN
    RAISE EXCEPTION 'account_manager_id is required or current user must have a sales record. User ID: %', auth.uid();
  END IF;

  IF _org_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = _org_id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Organization with id % does not exist or is deleted', _org_id;
    END IF;
    SELECT name INTO _org_name FROM organizations WHERE id = _org_id;
  ELSE
    IF _org_name IS NULL OR _org_name = '' THEN
      RAISE EXCEPTION 'Either organization_id or org_name is required';
    END IF;
    INSERT INTO organizations (name, city, state, organization_type, sales_id, segment_id)
    VALUES (_org_name, _city, _state, 'customer', _account_manager_id, '562062be-c15b-417f-b2a1-d4a643d69d52'::uuid)
    RETURNING id INTO _org_id;
  END IF;

  SELECT name, organization_type INTO _principal_name, _principal_type
  FROM organizations WHERE id = _principal_id;

  IF _principal_name IS NULL THEN
    RAISE EXCEPTION 'Principal organization with id % does not exist', _principal_id;
  END IF;

  IF _principal_type != 'principal' THEN
    RAISE EXCEPTION 'Organization % is not a principal', _principal_id;
  END IF;

  _create_contact := (_first_name IS NOT NULL OR _last_name IS NOT NULL OR _email_val IS NOT NULL OR _phone_val IS NOT NULL);

  IF _create_contact THEN
    IF _email_val IS NOT NULL AND _email_val != '' THEN
      _email_jsonb := jsonb_build_array(jsonb_build_object('email', _email_val, 'type', 'Work'));
    ELSE
      _email_jsonb := '[]'::jsonb;
    END IF;

    IF _phone_val IS NOT NULL AND _phone_val != '' THEN
      _phone_jsonb := jsonb_build_array(jsonb_build_object('number', _phone_val, 'type', 'Work'));
    ELSE
      _phone_jsonb := '[]'::jsonb;
    END IF;

    INSERT INTO contacts (name, first_name, last_name, organization_id, sales_id, email, phone, first_seen, last_seen, tags)
    VALUES (
      COALESCE(_first_name, '') || CASE WHEN _first_name IS NOT NULL AND _last_name IS NOT NULL THEN ' ' ELSE '' END || COALESCE(_last_name, ''),
      _first_name, _last_name, _org_id, _account_manager_id, _email_jsonb, _phone_jsonb, NOW(), NOW(), '{}'::bigint[]
    ) RETURNING id INTO _contact_id;
  END IF;

  _opp_name := _org_name || ' - ' || _principal_name;

  INSERT INTO opportunities (
    name, customer_organization_id, principal_organization_id, contact_ids, campaign,
    stage, priority, estimated_close_date, lead_source, description, opportunity_owner_id
  ) VALUES (
    _opp_name, _org_id, _principal_id,
    CASE WHEN _contact_id IS NOT NULL THEN ARRAY[_contact_id] ELSE '{}'::bigint[] END,
    _campaign, 'new_lead', 'medium', (CURRENT_DATE + INTERVAL '30 days')::date,
    'trade_show', NULLIF(_quick_note, ''), _account_manager_id
  ) RETURNING id INTO _opp_id;

  -- Link products if provided (using correct column: product_id_reference)
  IF _data->'product_ids' IS NOT NULL THEN
    INSERT INTO opportunity_products (opportunity_id, product_id_reference)
    SELECT _opp_id, (jsonb_array_elements_text(_data->'product_ids'))::BIGINT;
  END IF;

  RETURN jsonb_build_object('organization_id', _org_id, 'contact_id', _contact_id, 'opportunity_id', _opp_id, 'success', true);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create booth visitor: %', SQLERRM;
END;
$function$
;

create or replace view "public"."dashboard_principal_summary" as  WITH principal_opportunities AS (
         SELECT o.principal_organization_id,
            o.id AS opportunity_id,
            o.stage,
            o.estimated_close_date,
            o.account_manager_id,
            (EXTRACT(epoch FROM (now() - o.created_at)) / (86400)::numeric) AS days_in_stage
           FROM public.opportunities o
          WHERE ((o.status = 'active'::public.opportunity_status) AND (o.principal_organization_id IS NOT NULL))
        ), principal_activities AS (
         SELECT po.principal_organization_id,
            count(a.id) AS weekly_activity_count
           FROM (principal_opportunities po
             LEFT JOIN public.activities a ON (((a.opportunity_id = po.opportunity_id) AND (a.created_at >= (now() - '7 days'::interval)))))
          GROUP BY po.principal_organization_id
        ), principal_reps AS (
         SELECT po.principal_organization_id,
            array_agg(DISTINCT ((s.first_name || ' '::text) || s.last_name) ORDER BY ((s.first_name || ' '::text) || s.last_name)) AS assigned_reps
           FROM (principal_opportunities po
             JOIN public.sales s ON ((s.id = po.account_manager_id)))
          GROUP BY po.principal_organization_id
        ), principal_aggregates AS (
         SELECT po.principal_organization_id,
            count(DISTINCT po.opportunity_id) AS opportunity_count,
            max(po.days_in_stage) AS max_days_in_stage,
            bool_or((po.days_in_stage > (14)::numeric)) AS is_stuck,
            max(a.created_at) AS last_activity_date,
            ( SELECT a2.type
                   FROM (public.activities a2
                     JOIN principal_opportunities po2 ON (((a2.opportunity_id = po2.opportunity_id) AND (po2.principal_organization_id = po.principal_organization_id))))
                  ORDER BY a2.created_at DESC
                 LIMIT 1) AS last_activity_type,
            (EXTRACT(epoch FROM (now() - max(a.created_at))) / (86400)::numeric) AS days_since_last_activity
           FROM (principal_opportunities po
             LEFT JOIN public.activities a ON ((a.opportunity_id = po.opportunity_id)))
          GROUP BY po.principal_organization_id
        )
 SELECT org.id,
    org.name AS principal_name,
    pa.opportunity_count,
    COALESCE(pact.weekly_activity_count, (0)::bigint) AS weekly_activity_count,
    COALESCE(prep.assigned_reps, ARRAY[]::text[]) AS assigned_reps,
    pa.last_activity_date,
    pa.last_activity_type,
    pa.days_since_last_activity,
        CASE
            WHEN (pa.days_since_last_activity IS NULL) THEN 'urgent'::text
            WHEN (pa.days_since_last_activity > (7)::numeric) THEN 'urgent'::text
            WHEN (pa.days_since_last_activity > (3)::numeric) THEN 'warning'::text
            ELSE 'good'::text
        END AS status_indicator,
    pa.max_days_in_stage,
    pa.is_stuck,
    NULL::text AS next_action,
    (((COALESCE(pa.days_since_last_activity, (30)::numeric) * (2)::numeric) + (
        CASE
            WHEN pa.is_stuck THEN 50
            ELSE 0
        END)::numeric) - ((pa.opportunity_count)::numeric * 0.5)) AS priority_score
   FROM (((public.organizations org
     JOIN principal_aggregates pa ON ((pa.principal_organization_id = org.id)))
     LEFT JOIN principal_activities pact ON ((pact.principal_organization_id = org.id)))
     LEFT JOIN principal_reps prep ON ((prep.principal_organization_id = org.id)))
  WHERE (org.organization_type = 'principal'::public.organization_type)
  ORDER BY (((COALESCE(pa.days_since_last_activity, (30)::numeric) * (2)::numeric) + (
        CASE
            WHEN pa.is_stuck THEN 50
            ELSE 0
        END)::numeric) - ((pa.opportunity_count)::numeric * 0.5));


CREATE OR REPLACE FUNCTION public.get_product_distributor_pricing(p_product_id bigint, p_distributor_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_pricing JSONB;
BEGIN
    SELECT special_pricing
    INTO v_pricing
    FROM product_distributor_authorizations
    WHERE product_id = p_product_id
      AND distributor_id = p_distributor_id
      AND is_authorized = true
      AND deleted_at IS NULL
      AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);

    RETURN v_pricing;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_manager()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE
      ELSE COALESCE(
        (SELECT role = 'manager' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$function$
;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE
      ELSE COALESCE(
        (SELECT role IN ('admin', 'manager') FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$function$
;

CREATE OR REPLACE FUNCTION public.is_product_authorized_for_distributor(p_product_id bigint, p_distributor_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_product_auth RECORD;
    v_org_auth RECORD;
    v_principal_id BIGINT;
BEGIN
    SELECT principal_id INTO v_principal_id
    FROM products
    WHERE id = p_product_id AND deleted_at IS NULL;

    IF v_principal_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT is_authorized, expiration_date
    INTO v_product_auth
    FROM product_distributor_authorizations
    WHERE product_id = p_product_id
      AND distributor_id = p_distributor_id
      AND deleted_at IS NULL;

    IF FOUND THEN
        IF v_product_auth.expiration_date IS NOT NULL
           AND v_product_auth.expiration_date < CURRENT_DATE THEN
            NULL;
        ELSE
            RETURN v_product_auth.is_authorized;
        END IF;
    END IF;

    SELECT is_authorized, expiration_date
    INTO v_org_auth
    FROM distributor_principal_authorizations
    WHERE principal_id = v_principal_id
      AND distributor_id = p_distributor_id
      AND deleted_at IS NULL;

    IF FOUND THEN
        IF v_org_auth.expiration_date IS NOT NULL
           AND v_org_auth.expiration_date < CURRENT_DATE THEN
            RETURN false;
        END IF;
        RETURN v_org_auth.is_authorized;
    END IF;

    RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_rep()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE
      ELSE COALESCE(
        (SELECT role = 'rep' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$function$
;

create or replace view "public"."organizations_with_account_manager" as  SELECT o.id,
    o.name,
    o.organization_type,
    o.priority,
    o.website,
    o.address,
    o.city,
    o.state,
    o.postal_code,
    o.phone,
    o.email,
    o.logo_url,
    o.linkedin_url,
    o.employee_count,
    o.founded_year,
    o.notes,
    o.sales_id,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
    o.import_session_id,
    o.search_tsv,
    o.context_links,
    o.description,
    o.tax_identifier,
    o.segment_id,
    o.updated_by,
    o.parent_organization_id,
    COALESCE((s.first_name || COALESCE((' '::text || s.last_name), ''::text)), 'Unassigned'::text) AS account_manager_name,
    (s.user_id IS NOT NULL) AS account_manager_is_user
   FROM (public.organizations o
     LEFT JOIN public.sales s ON ((o.sales_id = s.id)));


create or replace view "public"."priority_tasks" as  SELECT a.id,
    a.subject AS title,
    a.description,
    (a.type)::text AS type,
    a.due_date,
    a.priority,
    a.sales_id,
    a.contact_id,
    a.organization_id,
    a.opportunity_id,
    a.created_at,
    COALESCE(((c.first_name || ' '::text) || c.last_name), c.first_name) AS contact_name,
    org.name AS organization_name,
    opp.name AS opportunity_name,
    COALESCE(((s.first_name || ' '::text) || s.last_name), s.email) AS assignee_name,
        CASE
            WHEN (a.due_date < CURRENT_DATE) THEN true
            ELSE false
        END AS is_overdue,
    (a.due_date - CURRENT_DATE) AS days_until_due
   FROM ((((public.activities a
     LEFT JOIN public.contacts c ON ((a.contact_id = c.id)))
     LEFT JOIN public.organizations org ON ((a.organization_id = org.id)))
     LEFT JOIN public.opportunities opp ON ((a.opportunity_id = opp.id)))
     LEFT JOIN public.sales s ON ((a.sales_id = s.id)))
  WHERE ((a.activity_type = 'task'::public.activity_type) AND (a.deleted_at IS NULL) AND (COALESCE(a.completed, false) = false) AND ((a.snooze_until IS NULL) OR (a.snooze_until <= now())))
  ORDER BY
        CASE a.priority
            WHEN 'critical'::public.priority_level THEN 1
            WHEN 'high'::public.priority_level THEN 2
            WHEN 'medium'::public.priority_level THEN 3
            WHEN 'low'::public.priority_level THEN 4
            ELSE 5
        END, a.due_date;


create or replace view "public"."tasks_summary" as  SELECT a.id,
    a.subject AS title,
    a.description,
    (a.type)::text AS type,
    a.due_date,
    a.reminder_date,
    a.completed,
    a.completed_at,
    a.priority,
    a.contact_id,
    a.organization_id,
    a.opportunity_id,
    a.sales_id,
    a.snooze_until,
    a.overdue_notified_at,
    a.created_by,
    a.created_at,
    a.updated_at,
    COALESCE(((c.first_name || ' '::text) || c.last_name), c.first_name, c.last_name) AS contact_name,
    org.name AS organization_name,
    opp.name AS opportunity_name,
    COALESCE(((s.first_name || ' '::text) || s.last_name), s.first_name, s.email) AS assignee_name,
    s.email AS assignee_email,
    COALESCE(((creator.first_name || ' '::text) || creator.last_name), creator.first_name, creator.email) AS creator_name
   FROM (((((public.activities a
     LEFT JOIN public.contacts c ON ((a.contact_id = c.id)))
     LEFT JOIN public.organizations org ON ((a.organization_id = org.id)))
     LEFT JOIN public.opportunities opp ON ((a.opportunity_id = opp.id)))
     LEFT JOIN public.sales s ON ((a.sales_id = s.id)))
     LEFT JOIN public.sales creator ON ((a.created_by = creator.id)))
  WHERE ((a.activity_type = 'task'::public.activity_type) AND (a.deleted_at IS NULL));


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_role()
 RETURNS public.user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN 'rep'::public.user_role
      ELSE COALESCE(
        (SELECT role FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        'rep'::public.user_role
      )
    END
$function$
;

CREATE OR REPLACE FUNCTION public.validate_opportunity_participants()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_org_type organization_type;
    v_primary_count INTEGER;
BEGIN
    -- Get organization type (is_principal/is_distributor columns were removed)
    SELECT organization_type
    INTO v_org_type
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Validate role matches organization type
    -- principal role requires organization_type = 'principal'
    IF NEW.role = 'principal' AND v_org_type != 'principal' THEN
        RAISE EXCEPTION 'Organization % is not a principal (type: %)', NEW.organization_id, v_org_type;
    END IF;

    -- distributor role requires organization_type = 'distributor'
    IF NEW.role = 'distributor' AND v_org_type != 'distributor' THEN
        RAISE EXCEPTION 'Organization % is not a distributor (type: %)', NEW.organization_id, v_org_type;
    END IF;

    -- Enforce single primary per role per opportunity
    IF NEW.is_primary THEN
        SELECT COUNT(*) INTO v_primary_count
        FROM opportunity_participants
        WHERE opportunity_id = NEW.opportunity_id
          AND role = NEW.role
          AND is_primary = true
          AND deleted_at IS NULL
          AND id != COALESCE(NEW.id, -1);

        IF v_primary_count > 0 THEN
            -- Auto-demote existing primary
            UPDATE opportunity_participants
            SET is_primary = false,
                updated_at = NOW()
            WHERE opportunity_id = NEW.opportunity_id
              AND role = NEW.role
              AND is_primary = true
              AND id != COALESCE(NEW.id, -1)
              AND deleted_at IS NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;


  create policy "authenticated_select_audit_trail"
  on "public"."audit_trail"
  as permissive
  for select
  to authenticated
using (true);



  create policy "insert_contact_notes"
  on "public"."contact_notes"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "delete_contacts"
  on "public"."contacts"
  as permissive
  for delete
  to authenticated
using ((deleted_at IS NULL));



  create policy "insert_contacts"
  on "public"."contacts"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "update_contacts"
  on "public"."contacts"
  as permissive
  for update
  to authenticated
using ((deleted_at IS NULL))
with check (true);



  create policy "interaction_participants_insert_policy"
  on "public"."interaction_participants"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "insert_opportunity_notes"
  on "public"."opportunity_notes"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "update_opportunity_notes"
  on "public"."opportunity_notes"
  as permissive
  for update
  to authenticated
using ((deleted_at IS NULL))
with check (true);



  create policy "opportunity_participants_insert_policy"
  on "public"."opportunity_participants"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_select_organization_distributors"
  on "public"."organization_distributors"
  as permissive
  for select
  to authenticated
using ((auth.uid() IS NOT NULL));



  create policy "insert_organization_notes"
  on "public"."organization_notes"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "update_organization_notes"
  on "public"."organization_notes"
  as permissive
  for update
  to authenticated
using ((deleted_at IS NULL))
with check (true);



  create policy "delete_organizations"
  on "public"."organizations"
  as permissive
  for delete
  to authenticated
using ((deleted_at IS NULL));



  create policy "insert_organizations"
  on "public"."organizations"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "update_organizations"
  on "public"."organizations"
  as permissive
  for update
  to authenticated
using ((deleted_at IS NULL))
with check (true);



  create policy "insert_product_distributors"
  on "public"."product_distributors"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "update_product_distributors"
  on "public"."product_distributors"
  as permissive
  for update
  to authenticated
using ((deleted_at IS NULL))
with check (true);



  create policy "insert_products"
  on "public"."products"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "update_products"
  on "public"."products"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "delete_segments"
  on "public"."segments"
  as permissive
  for delete
  to authenticated
using ((deleted_at IS NULL));



  create policy "insert_segments"
  on "public"."segments"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "update_segments"
  on "public"."segments"
  as permissive
  for update
  to authenticated
using ((deleted_at IS NULL))
with check (true);



  create policy "authenticated_delete_tags"
  on "public"."tags"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_insert_tags"
  on "public"."tags"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_update_tags"
  on "public"."tags"
  as permissive
  for update
  to authenticated
using (true);



  create policy "deprecated_read_only"
  on "public"."tasks_deprecated"
  as permissive
  for select
  to authenticated
using (true);



  create policy "contact_notes_select_role_based"
  on "public"."contact_notes"
  as permissive
  for select
  to authenticated
using (((deleted_at IS NULL) AND (( SELECT private.is_admin_or_manager() AS is_admin_or_manager) OR private.can_access_by_role(sales_id, created_by))));



  create policy "opportunity_notes_select_role_based"
  on "public"."opportunity_notes"
  as permissive
  for select
  to authenticated
using (((deleted_at IS NULL) AND (( SELECT private.is_admin_or_manager() AS is_admin_or_manager) OR private.can_access_by_role(sales_id, created_by))));



  create policy "organization_notes_select_role_based"
  on "public"."organization_notes"
  as permissive
  for select
  to authenticated
using (((deleted_at IS NULL) AND (( SELECT private.is_admin_or_manager() AS is_admin_or_manager) OR private.can_access_by_role(sales_id, NULL::bigint))));


CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


