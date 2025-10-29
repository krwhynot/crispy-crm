drop trigger if exists "trigger_validate_activity_consistency" on "public"."activities";

drop trigger if exists "set_updated_by_contactnotes" on "public"."contactNotes";

drop trigger if exists "validate_principal_organization_trigger" on "public"."contact_preferred_principals";

drop trigger if exists "set_updated_by_contacts" on "public"."contacts";

drop trigger if exists "trigger_update_contacts_search_tsv" on "public"."contacts";

drop trigger if exists "set_updated_by_opportunities" on "public"."opportunities";

drop trigger if exists "trigger_update_opportunities_search_tsv" on "public"."opportunities";

drop trigger if exists "set_updated_by_opportunitynotes" on "public"."opportunityNotes";

drop trigger if exists "trigger_validate_opportunity_participants" on "public"."opportunity_participants";

drop trigger if exists "set_updated_by_organizations" on "public"."organizations";

drop trigger if exists "trigger_update_organizations_search_tsv" on "public"."organizations";

drop trigger if exists "trigger_validate_pricing_tiers" on "public"."product_pricing_tiers";

drop trigger if exists "products_search_update" on "public"."products";

drop trigger if exists "set_updated_by_products" on "public"."products";

drop trigger if exists "trigger_update_products_search_tsv" on "public"."products";

drop policy "authenticated_delete_tasks" on "public"."tasks";

drop policy "authenticated_insert_tasks" on "public"."tasks";

drop policy "authenticated_select_tasks" on "public"."tasks";

drop policy "authenticated_update_tasks" on "public"."tasks";

revoke delete on table "public"."activities" from "anon";

revoke insert on table "public"."activities" from "anon";

revoke references on table "public"."activities" from "anon";

revoke select on table "public"."activities" from "anon";

revoke trigger on table "public"."activities" from "anon";

revoke truncate on table "public"."activities" from "anon";

revoke update on table "public"."activities" from "anon";

revoke delete on table "public"."activities" from "authenticated";

revoke insert on table "public"."activities" from "authenticated";

revoke references on table "public"."activities" from "authenticated";

revoke select on table "public"."activities" from "authenticated";

revoke trigger on table "public"."activities" from "authenticated";

revoke truncate on table "public"."activities" from "authenticated";

revoke update on table "public"."activities" from "authenticated";

revoke delete on table "public"."activities" from "service_role";

revoke insert on table "public"."activities" from "service_role";

revoke references on table "public"."activities" from "service_role";

revoke select on table "public"."activities" from "service_role";

revoke trigger on table "public"."activities" from "service_role";

revoke truncate on table "public"."activities" from "service_role";

revoke update on table "public"."activities" from "service_role";

revoke delete on table "public"."contactNotes" from "anon";

revoke insert on table "public"."contactNotes" from "anon";

revoke references on table "public"."contactNotes" from "anon";

revoke select on table "public"."contactNotes" from "anon";

revoke trigger on table "public"."contactNotes" from "anon";

revoke truncate on table "public"."contactNotes" from "anon";

revoke update on table "public"."contactNotes" from "anon";

revoke delete on table "public"."contactNotes" from "authenticated";

revoke insert on table "public"."contactNotes" from "authenticated";

revoke references on table "public"."contactNotes" from "authenticated";

revoke select on table "public"."contactNotes" from "authenticated";

revoke trigger on table "public"."contactNotes" from "authenticated";

revoke truncate on table "public"."contactNotes" from "authenticated";

revoke update on table "public"."contactNotes" from "authenticated";

revoke delete on table "public"."contactNotes" from "service_role";

revoke insert on table "public"."contactNotes" from "service_role";

revoke references on table "public"."contactNotes" from "service_role";

revoke select on table "public"."contactNotes" from "service_role";

revoke trigger on table "public"."contactNotes" from "service_role";

revoke truncate on table "public"."contactNotes" from "service_role";

revoke update on table "public"."contactNotes" from "service_role";

revoke delete on table "public"."contact_organizations" from "anon";

revoke insert on table "public"."contact_organizations" from "anon";

revoke references on table "public"."contact_organizations" from "anon";

revoke select on table "public"."contact_organizations" from "anon";

revoke trigger on table "public"."contact_organizations" from "anon";

revoke truncate on table "public"."contact_organizations" from "anon";

revoke update on table "public"."contact_organizations" from "anon";

revoke delete on table "public"."contact_organizations" from "authenticated";

revoke insert on table "public"."contact_organizations" from "authenticated";

revoke references on table "public"."contact_organizations" from "authenticated";

revoke select on table "public"."contact_organizations" from "authenticated";

revoke trigger on table "public"."contact_organizations" from "authenticated";

revoke truncate on table "public"."contact_organizations" from "authenticated";

revoke update on table "public"."contact_organizations" from "authenticated";

revoke delete on table "public"."contact_organizations" from "service_role";

revoke insert on table "public"."contact_organizations" from "service_role";

revoke references on table "public"."contact_organizations" from "service_role";

revoke select on table "public"."contact_organizations" from "service_role";

revoke trigger on table "public"."contact_organizations" from "service_role";

revoke truncate on table "public"."contact_organizations" from "service_role";

revoke update on table "public"."contact_organizations" from "service_role";

revoke delete on table "public"."contact_preferred_principals" from "anon";

revoke insert on table "public"."contact_preferred_principals" from "anon";

revoke references on table "public"."contact_preferred_principals" from "anon";

revoke select on table "public"."contact_preferred_principals" from "anon";

revoke trigger on table "public"."contact_preferred_principals" from "anon";

revoke truncate on table "public"."contact_preferred_principals" from "anon";

revoke update on table "public"."contact_preferred_principals" from "anon";

revoke delete on table "public"."contact_preferred_principals" from "authenticated";

revoke insert on table "public"."contact_preferred_principals" from "authenticated";

revoke references on table "public"."contact_preferred_principals" from "authenticated";

revoke select on table "public"."contact_preferred_principals" from "authenticated";

revoke trigger on table "public"."contact_preferred_principals" from "authenticated";

revoke truncate on table "public"."contact_preferred_principals" from "authenticated";

revoke update on table "public"."contact_preferred_principals" from "authenticated";

revoke delete on table "public"."contact_preferred_principals" from "service_role";

revoke insert on table "public"."contact_preferred_principals" from "service_role";

revoke references on table "public"."contact_preferred_principals" from "service_role";

revoke select on table "public"."contact_preferred_principals" from "service_role";

revoke trigger on table "public"."contact_preferred_principals" from "service_role";

revoke truncate on table "public"."contact_preferred_principals" from "service_role";

revoke update on table "public"."contact_preferred_principals" from "service_role";

revoke delete on table "public"."contacts" from "anon";

revoke insert on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "anon";

revoke select on table "public"."contacts" from "anon";

revoke trigger on table "public"."contacts" from "anon";

revoke truncate on table "public"."contacts" from "anon";

revoke update on table "public"."contacts" from "anon";

revoke delete on table "public"."contacts" from "authenticated";

revoke insert on table "public"."contacts" from "authenticated";

revoke references on table "public"."contacts" from "authenticated";

revoke select on table "public"."contacts" from "authenticated";

revoke trigger on table "public"."contacts" from "authenticated";

revoke truncate on table "public"."contacts" from "authenticated";

revoke update on table "public"."contacts" from "authenticated";

revoke delete on table "public"."contacts" from "service_role";

revoke insert on table "public"."contacts" from "service_role";

revoke references on table "public"."contacts" from "service_role";

revoke select on table "public"."contacts" from "service_role";

revoke trigger on table "public"."contacts" from "service_role";

revoke truncate on table "public"."contacts" from "service_role";

revoke update on table "public"."contacts" from "service_role";

revoke delete on table "public"."interaction_participants" from "anon";

revoke insert on table "public"."interaction_participants" from "anon";

revoke references on table "public"."interaction_participants" from "anon";

revoke select on table "public"."interaction_participants" from "anon";

revoke trigger on table "public"."interaction_participants" from "anon";

revoke truncate on table "public"."interaction_participants" from "anon";

revoke update on table "public"."interaction_participants" from "anon";

revoke delete on table "public"."interaction_participants" from "authenticated";

revoke insert on table "public"."interaction_participants" from "authenticated";

revoke references on table "public"."interaction_participants" from "authenticated";

revoke select on table "public"."interaction_participants" from "authenticated";

revoke trigger on table "public"."interaction_participants" from "authenticated";

revoke truncate on table "public"."interaction_participants" from "authenticated";

revoke update on table "public"."interaction_participants" from "authenticated";

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

revoke delete on table "public"."migration_history" from "authenticated";

revoke insert on table "public"."migration_history" from "authenticated";

revoke references on table "public"."migration_history" from "authenticated";

revoke select on table "public"."migration_history" from "authenticated";

revoke trigger on table "public"."migration_history" from "authenticated";

revoke truncate on table "public"."migration_history" from "authenticated";

revoke update on table "public"."migration_history" from "authenticated";

revoke delete on table "public"."migration_history" from "service_role";

revoke insert on table "public"."migration_history" from "service_role";

revoke references on table "public"."migration_history" from "service_role";

revoke select on table "public"."migration_history" from "service_role";

revoke trigger on table "public"."migration_history" from "service_role";

revoke truncate on table "public"."migration_history" from "service_role";

revoke update on table "public"."migration_history" from "service_role";

revoke delete on table "public"."opportunities" from "anon";

revoke insert on table "public"."opportunities" from "anon";

revoke references on table "public"."opportunities" from "anon";

revoke select on table "public"."opportunities" from "anon";

revoke trigger on table "public"."opportunities" from "anon";

revoke truncate on table "public"."opportunities" from "anon";

revoke update on table "public"."opportunities" from "anon";

revoke delete on table "public"."opportunities" from "authenticated";

revoke insert on table "public"."opportunities" from "authenticated";

revoke references on table "public"."opportunities" from "authenticated";

revoke select on table "public"."opportunities" from "authenticated";

revoke trigger on table "public"."opportunities" from "authenticated";

revoke truncate on table "public"."opportunities" from "authenticated";

revoke update on table "public"."opportunities" from "authenticated";

revoke delete on table "public"."opportunities" from "service_role";

revoke insert on table "public"."opportunities" from "service_role";

revoke references on table "public"."opportunities" from "service_role";

revoke select on table "public"."opportunities" from "service_role";

revoke trigger on table "public"."opportunities" from "service_role";

revoke truncate on table "public"."opportunities" from "service_role";

revoke update on table "public"."opportunities" from "service_role";

revoke delete on table "public"."opportunityNotes" from "anon";

revoke insert on table "public"."opportunityNotes" from "anon";

revoke references on table "public"."opportunityNotes" from "anon";

revoke select on table "public"."opportunityNotes" from "anon";

revoke trigger on table "public"."opportunityNotes" from "anon";

revoke truncate on table "public"."opportunityNotes" from "anon";

revoke update on table "public"."opportunityNotes" from "anon";

revoke delete on table "public"."opportunityNotes" from "authenticated";

revoke insert on table "public"."opportunityNotes" from "authenticated";

revoke references on table "public"."opportunityNotes" from "authenticated";

revoke select on table "public"."opportunityNotes" from "authenticated";

revoke trigger on table "public"."opportunityNotes" from "authenticated";

revoke truncate on table "public"."opportunityNotes" from "authenticated";

revoke update on table "public"."opportunityNotes" from "authenticated";

revoke delete on table "public"."opportunityNotes" from "service_role";

revoke insert on table "public"."opportunityNotes" from "service_role";

revoke references on table "public"."opportunityNotes" from "service_role";

revoke select on table "public"."opportunityNotes" from "service_role";

revoke trigger on table "public"."opportunityNotes" from "service_role";

revoke truncate on table "public"."opportunityNotes" from "service_role";

revoke update on table "public"."opportunityNotes" from "service_role";

revoke delete on table "public"."opportunity_participants" from "anon";

revoke insert on table "public"."opportunity_participants" from "anon";

revoke references on table "public"."opportunity_participants" from "anon";

revoke select on table "public"."opportunity_participants" from "anon";

revoke trigger on table "public"."opportunity_participants" from "anon";

revoke truncate on table "public"."opportunity_participants" from "anon";

revoke update on table "public"."opportunity_participants" from "anon";

revoke delete on table "public"."opportunity_participants" from "authenticated";

revoke insert on table "public"."opportunity_participants" from "authenticated";

revoke references on table "public"."opportunity_participants" from "authenticated";

revoke select on table "public"."opportunity_participants" from "authenticated";

revoke trigger on table "public"."opportunity_participants" from "authenticated";

revoke truncate on table "public"."opportunity_participants" from "authenticated";

revoke update on table "public"."opportunity_participants" from "authenticated";

revoke delete on table "public"."opportunity_participants" from "service_role";

revoke insert on table "public"."opportunity_participants" from "service_role";

revoke references on table "public"."opportunity_participants" from "service_role";

revoke select on table "public"."opportunity_participants" from "service_role";

revoke trigger on table "public"."opportunity_participants" from "service_role";

revoke truncate on table "public"."opportunity_participants" from "service_role";

revoke update on table "public"."opportunity_participants" from "service_role";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke select on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke delete on table "public"."organizations" from "authenticated";

revoke insert on table "public"."organizations" from "authenticated";

revoke references on table "public"."organizations" from "authenticated";

revoke select on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke update on table "public"."organizations" from "authenticated";

revoke delete on table "public"."organizations" from "service_role";

revoke insert on table "public"."organizations" from "service_role";

revoke references on table "public"."organizations" from "service_role";

revoke select on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke update on table "public"."organizations" from "service_role";

revoke delete on table "public"."product_category_hierarchy" from "anon";

revoke insert on table "public"."product_category_hierarchy" from "anon";

revoke references on table "public"."product_category_hierarchy" from "anon";

revoke select on table "public"."product_category_hierarchy" from "anon";

revoke trigger on table "public"."product_category_hierarchy" from "anon";

revoke truncate on table "public"."product_category_hierarchy" from "anon";

revoke update on table "public"."product_category_hierarchy" from "anon";

revoke delete on table "public"."product_category_hierarchy" from "authenticated";

revoke insert on table "public"."product_category_hierarchy" from "authenticated";

revoke references on table "public"."product_category_hierarchy" from "authenticated";

revoke select on table "public"."product_category_hierarchy" from "authenticated";

revoke trigger on table "public"."product_category_hierarchy" from "authenticated";

revoke truncate on table "public"."product_category_hierarchy" from "authenticated";

revoke update on table "public"."product_category_hierarchy" from "authenticated";

revoke delete on table "public"."product_category_hierarchy" from "service_role";

revoke insert on table "public"."product_category_hierarchy" from "service_role";

revoke references on table "public"."product_category_hierarchy" from "service_role";

revoke select on table "public"."product_category_hierarchy" from "service_role";

revoke trigger on table "public"."product_category_hierarchy" from "service_role";

revoke truncate on table "public"."product_category_hierarchy" from "service_role";

revoke update on table "public"."product_category_hierarchy" from "service_role";

revoke delete on table "public"."product_distributor_authorizations" from "anon";

revoke insert on table "public"."product_distributor_authorizations" from "anon";

revoke references on table "public"."product_distributor_authorizations" from "anon";

revoke select on table "public"."product_distributor_authorizations" from "anon";

revoke trigger on table "public"."product_distributor_authorizations" from "anon";

revoke truncate on table "public"."product_distributor_authorizations" from "anon";

revoke update on table "public"."product_distributor_authorizations" from "anon";

revoke delete on table "public"."product_distributor_authorizations" from "authenticated";

revoke insert on table "public"."product_distributor_authorizations" from "authenticated";

revoke references on table "public"."product_distributor_authorizations" from "authenticated";

revoke select on table "public"."product_distributor_authorizations" from "authenticated";

revoke trigger on table "public"."product_distributor_authorizations" from "authenticated";

revoke truncate on table "public"."product_distributor_authorizations" from "authenticated";

revoke update on table "public"."product_distributor_authorizations" from "authenticated";

revoke delete on table "public"."product_distributor_authorizations" from "service_role";

revoke insert on table "public"."product_distributor_authorizations" from "service_role";

revoke references on table "public"."product_distributor_authorizations" from "service_role";

revoke select on table "public"."product_distributor_authorizations" from "service_role";

revoke trigger on table "public"."product_distributor_authorizations" from "service_role";

revoke truncate on table "public"."product_distributor_authorizations" from "service_role";

revoke update on table "public"."product_distributor_authorizations" from "service_role";

revoke delete on table "public"."product_features" from "anon";

revoke insert on table "public"."product_features" from "anon";

revoke references on table "public"."product_features" from "anon";

revoke select on table "public"."product_features" from "anon";

revoke trigger on table "public"."product_features" from "anon";

revoke truncate on table "public"."product_features" from "anon";

revoke update on table "public"."product_features" from "anon";

revoke delete on table "public"."product_features" from "authenticated";

revoke insert on table "public"."product_features" from "authenticated";

revoke references on table "public"."product_features" from "authenticated";

revoke select on table "public"."product_features" from "authenticated";

revoke trigger on table "public"."product_features" from "authenticated";

revoke truncate on table "public"."product_features" from "authenticated";

revoke update on table "public"."product_features" from "authenticated";

revoke delete on table "public"."product_features" from "service_role";

revoke insert on table "public"."product_features" from "service_role";

revoke references on table "public"."product_features" from "service_role";

revoke select on table "public"."product_features" from "service_role";

revoke trigger on table "public"."product_features" from "service_role";

revoke truncate on table "public"."product_features" from "service_role";

revoke update on table "public"."product_features" from "service_role";

revoke delete on table "public"."product_pricing_models" from "anon";

revoke insert on table "public"."product_pricing_models" from "anon";

revoke references on table "public"."product_pricing_models" from "anon";

revoke select on table "public"."product_pricing_models" from "anon";

revoke trigger on table "public"."product_pricing_models" from "anon";

revoke truncate on table "public"."product_pricing_models" from "anon";

revoke update on table "public"."product_pricing_models" from "anon";

revoke delete on table "public"."product_pricing_models" from "authenticated";

revoke insert on table "public"."product_pricing_models" from "authenticated";

revoke references on table "public"."product_pricing_models" from "authenticated";

revoke select on table "public"."product_pricing_models" from "authenticated";

revoke trigger on table "public"."product_pricing_models" from "authenticated";

revoke truncate on table "public"."product_pricing_models" from "authenticated";

revoke update on table "public"."product_pricing_models" from "authenticated";

revoke delete on table "public"."product_pricing_models" from "service_role";

revoke insert on table "public"."product_pricing_models" from "service_role";

revoke references on table "public"."product_pricing_models" from "service_role";

revoke select on table "public"."product_pricing_models" from "service_role";

revoke trigger on table "public"."product_pricing_models" from "service_role";

revoke truncate on table "public"."product_pricing_models" from "service_role";

revoke update on table "public"."product_pricing_models" from "service_role";

revoke delete on table "public"."product_pricing_tiers" from "anon";

revoke insert on table "public"."product_pricing_tiers" from "anon";

revoke references on table "public"."product_pricing_tiers" from "anon";

revoke select on table "public"."product_pricing_tiers" from "anon";

revoke trigger on table "public"."product_pricing_tiers" from "anon";

revoke truncate on table "public"."product_pricing_tiers" from "anon";

revoke update on table "public"."product_pricing_tiers" from "anon";

revoke delete on table "public"."product_pricing_tiers" from "authenticated";

revoke insert on table "public"."product_pricing_tiers" from "authenticated";

revoke references on table "public"."product_pricing_tiers" from "authenticated";

revoke select on table "public"."product_pricing_tiers" from "authenticated";

revoke trigger on table "public"."product_pricing_tiers" from "authenticated";

revoke truncate on table "public"."product_pricing_tiers" from "authenticated";

revoke update on table "public"."product_pricing_tiers" from "authenticated";

revoke delete on table "public"."product_pricing_tiers" from "service_role";

revoke insert on table "public"."product_pricing_tiers" from "service_role";

revoke references on table "public"."product_pricing_tiers" from "service_role";

revoke select on table "public"."product_pricing_tiers" from "service_role";

revoke trigger on table "public"."product_pricing_tiers" from "service_role";

revoke truncate on table "public"."product_pricing_tiers" from "service_role";

revoke update on table "public"."product_pricing_tiers" from "service_role";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke select on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke delete on table "public"."products" from "authenticated";

revoke insert on table "public"."products" from "authenticated";

revoke references on table "public"."products" from "authenticated";

revoke select on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke update on table "public"."products" from "authenticated";

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

revoke delete on table "public"."sales" from "authenticated";

revoke insert on table "public"."sales" from "authenticated";

revoke references on table "public"."sales" from "authenticated";

revoke select on table "public"."sales" from "authenticated";

revoke trigger on table "public"."sales" from "authenticated";

revoke truncate on table "public"."sales" from "authenticated";

revoke update on table "public"."sales" from "authenticated";

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

revoke delete on table "public"."segments" from "authenticated";

revoke insert on table "public"."segments" from "authenticated";

revoke references on table "public"."segments" from "authenticated";

revoke select on table "public"."segments" from "authenticated";

revoke trigger on table "public"."segments" from "authenticated";

revoke truncate on table "public"."segments" from "authenticated";

revoke update on table "public"."segments" from "authenticated";

revoke delete on table "public"."segments" from "service_role";

revoke insert on table "public"."segments" from "service_role";

revoke references on table "public"."segments" from "service_role";

revoke select on table "public"."segments" from "service_role";

revoke trigger on table "public"."segments" from "service_role";

revoke truncate on table "public"."segments" from "service_role";

revoke update on table "public"."segments" from "service_role";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke delete on table "public"."tags" from "authenticated";

revoke insert on table "public"."tags" from "authenticated";

revoke references on table "public"."tags" from "authenticated";

revoke select on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke update on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

revoke delete on table "public"."tasks" from "anon";

revoke insert on table "public"."tasks" from "anon";

revoke references on table "public"."tasks" from "anon";

revoke select on table "public"."tasks" from "anon";

revoke trigger on table "public"."tasks" from "anon";

revoke truncate on table "public"."tasks" from "anon";

revoke update on table "public"."tasks" from "anon";

revoke delete on table "public"."tasks" from "authenticated";

revoke insert on table "public"."tasks" from "authenticated";

revoke references on table "public"."tasks" from "authenticated";

revoke select on table "public"."tasks" from "authenticated";

revoke trigger on table "public"."tasks" from "authenticated";

revoke truncate on table "public"."tasks" from "authenticated";

revoke update on table "public"."tasks" from "authenticated";

revoke delete on table "public"."tasks" from "service_role";

revoke insert on table "public"."tasks" from "service_role";

revoke references on table "public"."tasks" from "service_role";

revoke select on table "public"."tasks" from "service_role";

revoke trigger on table "public"."tasks" from "service_role";

revoke truncate on table "public"."tasks" from "service_role";

revoke update on table "public"."tasks" from "service_role";

revoke delete on table "public"."test_user_metadata" from "anon";

revoke insert on table "public"."test_user_metadata" from "anon";

revoke references on table "public"."test_user_metadata" from "anon";

revoke select on table "public"."test_user_metadata" from "anon";

revoke trigger on table "public"."test_user_metadata" from "anon";

revoke truncate on table "public"."test_user_metadata" from "anon";

revoke update on table "public"."test_user_metadata" from "anon";

revoke delete on table "public"."test_user_metadata" from "authenticated";

revoke insert on table "public"."test_user_metadata" from "authenticated";

revoke references on table "public"."test_user_metadata" from "authenticated";

revoke select on table "public"."test_user_metadata" from "authenticated";

revoke trigger on table "public"."test_user_metadata" from "authenticated";

revoke truncate on table "public"."test_user_metadata" from "authenticated";

revoke update on table "public"."test_user_metadata" from "authenticated";

revoke delete on table "public"."test_user_metadata" from "service_role";

revoke insert on table "public"."test_user_metadata" from "service_role";

revoke references on table "public"."test_user_metadata" from "service_role";

revoke select on table "public"."test_user_metadata" from "service_role";

revoke trigger on table "public"."test_user_metadata" from "service_role";

revoke truncate on table "public"."test_user_metadata" from "service_role";

revoke update on table "public"."test_user_metadata" from "service_role";

alter table "public"."activities" drop constraint "activities_contact_id_fkey";

alter table "public"."activities" drop constraint "activities_created_by_fkey";

alter table "public"."activities" drop constraint "activities_opportunity_id_fkey";

alter table "public"."activities" drop constraint "check_interaction_has_opportunity";

alter table "public"."contactNotes" drop constraint "contactNotes_contact_id_fkey";

alter table "public"."contactNotes" drop constraint "contactNotes_created_by_fkey";

alter table "public"."contactNotes" drop constraint "contactNotes_sales_id_fkey";

alter table "public"."contactNotes" drop constraint "contactNotes_updated_by_fkey";

alter table "public"."contact_organizations" drop constraint "contact_organizations_contact_id_fkey";

alter table "public"."contact_organizations" drop constraint "contact_organizations_created_by_fkey";

alter table "public"."contact_preferred_principals" drop constraint "contact_preferred_principals_contact_id_fkey";

alter table "public"."contact_preferred_principals" drop constraint "contact_preferred_principals_created_by_fkey";

alter table "public"."contacts" drop constraint "contacts_created_by_fkey";

alter table "public"."contacts" drop constraint "contacts_organization_id_fkey";

alter table "public"."contacts" drop constraint "contacts_sales_id_fkey";

alter table "public"."contacts" drop constraint "contacts_updated_by_fkey";

alter table "public"."interaction_participants" drop constraint "interaction_participants_activity_id_fkey";

alter table "public"."interaction_participants" drop constraint "interaction_participants_contact_id_fkey";

alter table "public"."opportunities" drop constraint "opportunities_account_manager_id_fkey";

alter table "public"."opportunities" drop constraint "opportunities_created_by_fkey";

alter table "public"."opportunities" drop constraint "opportunities_sales_id_fkey";

alter table "public"."opportunities" drop constraint "opportunities_updated_by_fkey";

alter table "public"."opportunityNotes" drop constraint "opportunityNotes_created_by_fkey";

alter table "public"."opportunityNotes" drop constraint "opportunityNotes_opportunity_id_fkey";

alter table "public"."opportunityNotes" drop constraint "opportunityNotes_sales_id_fkey";

alter table "public"."opportunityNotes" drop constraint "opportunityNotes_updated_by_fkey";

alter table "public"."opportunity_participants" drop constraint "opportunity_participants_created_by_fkey";

alter table "public"."opportunity_participants" drop constraint "opportunity_participants_opportunity_id_fkey";

alter table "public"."organizations" drop constraint "organizations_created_by_fkey";

alter table "public"."organizations" drop constraint "organizations_industry_id_fkey";

alter table "public"."organizations" drop constraint "organizations_parent_organization_id_fkey";

alter table "public"."organizations" drop constraint "organizations_sales_id_fkey";

alter table "public"."organizations" drop constraint "organizations_updated_by_fkey";

alter table "public"."product_category_hierarchy" drop constraint "product_category_hierarchy_parent_category_id_fkey";

alter table "public"."product_distributor_authorizations" drop constraint "product_distributor_authorizations_created_by_fkey";

alter table "public"."product_distributor_authorizations" drop constraint "product_distributor_authorizations_product_id_fkey";

alter table "public"."product_features" drop constraint "product_features_product_id_fkey";

alter table "public"."product_pricing_models" drop constraint "product_pricing_models_created_by_fkey";

alter table "public"."product_pricing_models" drop constraint "product_pricing_models_product_id_fkey";

alter table "public"."product_pricing_tiers" drop constraint "product_pricing_tiers_created_by_fkey";

alter table "public"."product_pricing_tiers" drop constraint "product_pricing_tiers_product_id_fkey";

alter table "public"."products" drop constraint "products_created_by_fkey";

alter table "public"."products" drop constraint "products_distributor_id_fkey";

alter table "public"."products" drop constraint "products_updated_by_fkey";

alter table "public"."tasks" drop constraint "tasks_contact_id_fkey";

alter table "public"."tasks" drop constraint "tasks_created_by_fkey";

alter table "public"."tasks" drop constraint "tasks_opportunity_id_fkey";

alter table "public"."tasks" drop constraint "tasks_sales_id_fkey";

drop function if exists "public"."log_engagement"(p_type interaction_type, p_subject text, p_description text, p_contact_id bigint, p_organization_id bigint, p_activity_date timestamp with time zone, p_duration_minutes integer, p_follow_up_required boolean, p_follow_up_date date, p_outcome text, p_created_by bigint);

drop function if exists "public"."log_interaction"(p_opportunity_id bigint, p_type interaction_type, p_subject text, p_description text, p_contact_id bigint, p_organization_id bigint, p_activity_date timestamp with time zone, p_duration_minutes integer, p_follow_up_required boolean, p_follow_up_date date, p_outcome text, p_sentiment character varying, p_created_by bigint);

drop view if exists "public"."contacts_summary";

drop function if exists "public"."get_organization_contacts"(p_organization_id bigint);

drop view if exists "public"."opportunities_summary";

drop view if exists "public"."organizations_summary";

drop view if exists "public"."organizations_with_account_manager";

drop index if exists "public"."idx_organizations_type_distributor";

drop index if exists "public"."idx_organizations_type_principal";

alter table "public"."activities" alter column "activity_type" set data type public.activity_type using "activity_type"::text::public.activity_type;

alter table "public"."activities" alter column "id" set default nextval('public.activities_id_seq'::regclass);

alter table "public"."activities" alter column "type" set data type public.interaction_type using "type"::text::public.interaction_type;

alter table "public"."contactNotes" alter column "created_by" set default public.get_current_sales_id();

alter table "public"."contactNotes" alter column "id" set default nextval('public."contactNotes_id_seq"'::regclass);

alter table "public"."contact_organizations" alter column "id" set default nextval('public.contact_organizations_id_seq'::regclass);

alter table "public"."contact_preferred_principals" alter column "id" set default nextval('public.contact_preferred_principals_id_seq'::regclass);

alter table "public"."contacts" alter column "id" set default nextval('public.contacts_id_seq'::regclass);

alter table "public"."interaction_participants" alter column "id" set default nextval('public.interaction_participants_id_seq'::regclass);

alter table "public"."migration_history" alter column "id" set default nextval('public.migration_history_id_seq'::regclass);

alter table "public"."opportunities" alter column "id" set default nextval('public.opportunities_id_seq'::regclass);

alter table "public"."opportunities" alter column "priority" set default 'medium'::public.priority_level;

alter table "public"."opportunities" alter column "priority" set data type public.priority_level using "priority"::text::public.priority_level;

alter table "public"."opportunities" alter column "stage" set default 'new_lead'::public.opportunity_stage;

alter table "public"."opportunities" alter column "stage" set data type public.opportunity_stage using "stage"::text::public.opportunity_stage;

alter table "public"."opportunities" alter column "status" set default 'active'::public.opportunity_status;

alter table "public"."opportunities" alter column "status" set data type public.opportunity_status using "status"::text::public.opportunity_status;

alter table "public"."opportunityNotes" alter column "created_by" set default public.get_current_sales_id();

alter table "public"."opportunityNotes" alter column "id" set default nextval('public."opportunityNotes_id_seq"'::regclass);

alter table "public"."opportunity_participants" alter column "id" set default nextval('public.opportunity_participants_id_seq'::regclass);

alter table "public"."organizations" alter column "id" set default nextval('public.organizations_id_seq'::regclass);

alter table "public"."organizations" alter column "organization_type" set default 'unknown'::public.organization_type;

alter table "public"."organizations" alter column "organization_type" set data type public.organization_type using "organization_type"::text::public.organization_type;

alter table "public"."product_category_hierarchy" alter column "id" set default nextval('public.product_category_hierarchy_id_seq'::regclass);

alter table "public"."product_distributor_authorizations" alter column "id" set default nextval('public.product_distributor_authorizations_id_seq'::regclass);

alter table "public"."product_features" alter column "id" set default nextval('public.product_features_id_seq'::regclass);

alter table "public"."product_pricing_models" alter column "id" set default nextval('public.product_pricing_models_id_seq'::regclass);

alter table "public"."product_pricing_models" alter column "model_type" set default 'fixed'::public.pricing_model_type;

alter table "public"."product_pricing_models" alter column "model_type" set data type public.pricing_model_type using "model_type"::text::public.pricing_model_type;

alter table "public"."product_pricing_tiers" alter column "id" set default nextval('public.product_pricing_tiers_id_seq'::regclass);

alter table "public"."products" alter column "id" set default nextval('public.products_id_seq'::regclass);

alter table "public"."products" alter column "status" set default 'active'::public.product_status;

alter table "public"."products" alter column "status" set data type public.product_status using "status"::text::public.product_status;

alter table "public"."sales" alter column "id" set default nextval('public.sales_id_seq'::regclass);

alter table "public"."tags" alter column "id" set default nextval('public.tags_id_seq'::regclass);

alter table "public"."tasks" alter column "created_by" set default public.get_current_sales_id();

alter table "public"."tasks" alter column "id" set default nextval('public.tasks_id_seq'::regclass);

alter table "public"."tasks" alter column "priority" set default 'medium'::public.priority_level;

alter table "public"."tasks" alter column "priority" set data type public.priority_level using "priority"::text::public.priority_level;

alter table "public"."tasks" alter column "type" set default 'None'::public.task_type;

alter table "public"."tasks" alter column "type" set data type public.task_type using "type"::text::public.task_type;

CREATE INDEX idx_organizations_type_distributor ON public.organizations USING btree (organization_type) WHERE (organization_type = 'distributor'::public.organization_type);

CREATE INDEX idx_organizations_type_principal ON public.organizations USING btree (organization_type) WHERE (organization_type = 'principal'::public.organization_type);

alter table "public"."activities" add constraint "activities_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) not valid;

alter table "public"."activities" validate constraint "activities_contact_id_fkey";

alter table "public"."activities" add constraint "activities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."activities" validate constraint "activities_created_by_fkey";

alter table "public"."activities" add constraint "activities_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) not valid;

alter table "public"."activities" validate constraint "activities_opportunity_id_fkey";

alter table "public"."activities" add constraint "check_interaction_has_opportunity" CHECK ((((activity_type = 'interaction'::public.activity_type) AND (opportunity_id IS NOT NULL)) OR (activity_type = 'engagement'::public.activity_type))) not valid;

alter table "public"."activities" validate constraint "check_interaction_has_opportunity";

alter table "public"."contactNotes" add constraint "contactNotes_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

alter table "public"."contactNotes" validate constraint "contactNotes_contact_id_fkey";

alter table "public"."contactNotes" add constraint "contactNotes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."contactNotes" validate constraint "contactNotes_created_by_fkey";

alter table "public"."contactNotes" add constraint "contactNotes_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) ON DELETE CASCADE not valid;

alter table "public"."contactNotes" validate constraint "contactNotes_sales_id_fkey";

alter table "public"."contactNotes" add constraint "contactNotes_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."contactNotes" validate constraint "contactNotes_updated_by_fkey";

alter table "public"."contact_organizations" add constraint "contact_organizations_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

alter table "public"."contact_organizations" validate constraint "contact_organizations_contact_id_fkey";

alter table "public"."contact_organizations" add constraint "contact_organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."contact_organizations" validate constraint "contact_organizations_created_by_fkey";

alter table "public"."contact_preferred_principals" add constraint "contact_preferred_principals_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

alter table "public"."contact_preferred_principals" validate constraint "contact_preferred_principals_contact_id_fkey";

alter table "public"."contact_preferred_principals" add constraint "contact_preferred_principals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."contact_preferred_principals" validate constraint "contact_preferred_principals_created_by_fkey";

alter table "public"."contacts" add constraint "contacts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."contacts" validate constraint "contacts_created_by_fkey";

alter table "public"."contacts" add constraint "contacts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL not valid;

alter table "public"."contacts" validate constraint "contacts_organization_id_fkey";

alter table "public"."contacts" add constraint "contacts_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) not valid;

alter table "public"."contacts" validate constraint "contacts_sales_id_fkey";

alter table "public"."contacts" add constraint "contacts_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."contacts" validate constraint "contacts_updated_by_fkey";

alter table "public"."interaction_participants" add constraint "interaction_participants_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE not valid;

alter table "public"."interaction_participants" validate constraint "interaction_participants_activity_id_fkey";

alter table "public"."interaction_participants" add constraint "interaction_participants_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) not valid;

alter table "public"."interaction_participants" validate constraint "interaction_participants_contact_id_fkey";

alter table "public"."opportunities" add constraint "opportunities_account_manager_id_fkey" FOREIGN KEY (account_manager_id) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."opportunities" validate constraint "opportunities_account_manager_id_fkey";

alter table "public"."opportunities" add constraint "opportunities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."opportunities" validate constraint "opportunities_created_by_fkey";

alter table "public"."opportunities" add constraint "opportunities_sales_id_fkey" FOREIGN KEY (opportunity_owner_id) REFERENCES public.sales(id) not valid;

alter table "public"."opportunities" validate constraint "opportunities_sales_id_fkey";

alter table "public"."opportunities" add constraint "opportunities_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."opportunities" validate constraint "opportunities_updated_by_fkey";

alter table "public"."opportunityNotes" add constraint "opportunityNotes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."opportunityNotes" validate constraint "opportunityNotes_created_by_fkey";

alter table "public"."opportunityNotes" add constraint "opportunityNotes_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE not valid;

alter table "public"."opportunityNotes" validate constraint "opportunityNotes_opportunity_id_fkey";

alter table "public"."opportunityNotes" add constraint "opportunityNotes_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) ON DELETE CASCADE not valid;

alter table "public"."opportunityNotes" validate constraint "opportunityNotes_sales_id_fkey";

alter table "public"."opportunityNotes" add constraint "opportunityNotes_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."opportunityNotes" validate constraint "opportunityNotes_updated_by_fkey";

alter table "public"."opportunity_participants" add constraint "opportunity_participants_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."opportunity_participants" validate constraint "opportunity_participants_created_by_fkey";

alter table "public"."opportunity_participants" add constraint "opportunity_participants_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE not valid;

alter table "public"."opportunity_participants" validate constraint "opportunity_participants_opportunity_id_fkey";

alter table "public"."organizations" add constraint "organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."organizations" validate constraint "organizations_created_by_fkey";

alter table "public"."organizations" add constraint "organizations_industry_id_fkey" FOREIGN KEY (segment_id) REFERENCES public.segments(id) not valid;

alter table "public"."organizations" validate constraint "organizations_industry_id_fkey";

alter table "public"."organizations" add constraint "organizations_parent_organization_id_fkey" FOREIGN KEY (parent_organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_parent_organization_id_fkey";

alter table "public"."organizations" add constraint "organizations_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) not valid;

alter table "public"."organizations" validate constraint "organizations_sales_id_fkey";

alter table "public"."organizations" add constraint "organizations_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_updated_by_fkey";

alter table "public"."product_category_hierarchy" add constraint "product_category_hierarchy_parent_category_id_fkey" FOREIGN KEY (parent_category_id) REFERENCES public.product_category_hierarchy(id) not valid;

alter table "public"."product_category_hierarchy" validate constraint "product_category_hierarchy_parent_category_id_fkey";

alter table "public"."product_distributor_authorizations" add constraint "product_distributor_authorizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."product_distributor_authorizations" validate constraint "product_distributor_authorizations_created_by_fkey";

alter table "public"."product_distributor_authorizations" add constraint "product_distributor_authorizations_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_distributor_authorizations" validate constraint "product_distributor_authorizations_product_id_fkey";

alter table "public"."product_features" add constraint "product_features_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_features" validate constraint "product_features_product_id_fkey";

alter table "public"."product_pricing_models" add constraint "product_pricing_models_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."product_pricing_models" validate constraint "product_pricing_models_created_by_fkey";

alter table "public"."product_pricing_models" add constraint "product_pricing_models_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_pricing_models" validate constraint "product_pricing_models_product_id_fkey";

alter table "public"."product_pricing_tiers" add constraint "product_pricing_tiers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."product_pricing_tiers" validate constraint "product_pricing_tiers_created_by_fkey";

alter table "public"."product_pricing_tiers" add constraint "product_pricing_tiers_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_pricing_tiers" validate constraint "product_pricing_tiers_product_id_fkey";

alter table "public"."products" add constraint "products_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

alter table "public"."products" validate constraint "products_created_by_fkey";

alter table "public"."products" add constraint "products_distributor_id_fkey" FOREIGN KEY (distributor_id) REFERENCES public.organizations(id) ON DELETE SET NULL not valid;

alter table "public"."products" validate constraint "products_distributor_id_fkey";

alter table "public"."products" add constraint "products_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.sales(id) not valid;

alter table "public"."products" validate constraint "products_updated_by_fkey";

alter table "public"."tasks" add constraint "tasks_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_contact_id_fkey";

alter table "public"."tasks" add constraint "tasks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

alter table "public"."tasks" validate constraint "tasks_created_by_fkey";

alter table "public"."tasks" add constraint "tasks_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) not valid;

alter table "public"."tasks" validate constraint "tasks_opportunity_id_fkey";

alter table "public"."tasks" add constraint "tasks_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) not valid;

alter table "public"."tasks" validate constraint "tasks_sales_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.log_engagement(p_type public.interaction_type, p_subject text, p_description text DEFAULT NULL::text, p_contact_id bigint DEFAULT NULL::bigint, p_organization_id bigint DEFAULT NULL::bigint, p_activity_date timestamp with time zone DEFAULT now(), p_duration_minutes integer DEFAULT NULL::integer, p_follow_up_required boolean DEFAULT false, p_follow_up_date date DEFAULT NULL::date, p_outcome text DEFAULT NULL::text, p_created_by bigint DEFAULT NULL::bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_activity_id BIGINT;
BEGIN
    IF p_contact_id IS NULL AND p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Engagement must have either a contact or organization';
    END IF;

    IF p_contact_id IS NOT NULL AND p_organization_id IS NULL THEN
        SELECT organization_id INTO p_organization_id
        FROM contact_organizations
        WHERE contact_id = p_contact_id
          AND is_primary_contact = true
          AND deleted_at IS NULL
        LIMIT 1;
    END IF;

    INSERT INTO activities (
        activity_type,
        type,
        subject,
        description,
        activity_date,
        duration_minutes,
        contact_id,
        organization_id,
        follow_up_required,
        follow_up_date,
        outcome,
        created_by
    )
    VALUES (
        'engagement',
        p_type,
        p_subject,
        p_description,
        p_activity_date,
        p_duration_minutes,
        p_contact_id,
        p_organization_id,
        p_follow_up_required,
        p_follow_up_date,
        p_outcome,
        p_created_by
    )
    RETURNING id INTO v_activity_id;

    RETURN v_activity_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_interaction(p_opportunity_id bigint, p_type public.interaction_type, p_subject text, p_description text DEFAULT NULL::text, p_contact_id bigint DEFAULT NULL::bigint, p_organization_id bigint DEFAULT NULL::bigint, p_activity_date timestamp with time zone DEFAULT now(), p_duration_minutes integer DEFAULT NULL::integer, p_follow_up_required boolean DEFAULT false, p_follow_up_date date DEFAULT NULL::date, p_outcome text DEFAULT NULL::text, p_sentiment character varying DEFAULT NULL::character varying, p_created_by bigint DEFAULT NULL::bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_activity_id BIGINT;
    v_customer_org_id BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM opportunities WHERE id = p_opportunity_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Opportunity % does not exist or is deleted', p_opportunity_id;
    END IF;

    IF p_organization_id IS NULL THEN
        SELECT op.organization_id INTO v_customer_org_id
        FROM opportunity_participants op
        WHERE op.opportunity_id = p_opportunity_id
          AND op.role = 'customer'
          AND op.is_primary = true
          AND op.deleted_at IS NULL
        LIMIT 1;

        p_organization_id := v_customer_org_id;
    END IF;

    INSERT INTO activities (
        activity_type,
        type,
        subject,
        description,
        activity_date,
        duration_minutes,
        contact_id,
        organization_id,
        opportunity_id,
        follow_up_required,
        follow_up_date,
        outcome,
        sentiment,
        created_by
    )
    VALUES (
        'interaction',
        p_type,
        p_subject,
        p_description,
        p_activity_date,
        p_duration_minutes,
        p_contact_id,
        p_organization_id,
        p_opportunity_id,
        p_follow_up_required,
        p_follow_up_date,
        p_outcome,
        p_sentiment,
        p_created_by
    )
    RETURNING id INTO v_activity_id;

    UPDATE opportunities
    SET updated_at = NOW()
    WHERE id = p_opportunity_id;

    IF p_sentiment = 'positive' AND p_contact_id IS NOT NULL THEN
        UPDATE contact_preferred_principals
        SET last_interaction_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE contact_id = p_contact_id
          AND principal_organization_id IN (
              SELECT organization_id
              FROM opportunity_participants
              WHERE opportunity_id = p_opportunity_id
                AND role = 'principal'
                AND deleted_at IS NULL
          )
          AND deleted_at IS NULL;
    END IF;

    RETURN v_activity_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_product_price(p_product_id bigint, p_quantity integer, p_distributor_id bigint DEFAULT NULL::bigint)
 RETURNS TABLE(unit_price numeric, total_price numeric, discount_applied numeric, tier_name text, special_pricing boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_base_price NUMERIC;
    v_tier_price NUMERIC;
    v_tier_name TEXT;
    v_tier_discount NUMERIC;
    v_special_price NUMERIC;
    v_final_unit_price NUMERIC;
BEGIN
    SELECT list_price INTO v_base_price
    FROM products
    WHERE id = p_product_id;

    IF p_distributor_id IS NOT NULL THEN
        SELECT (special_pricing->>'unit_price')::NUMERIC INTO v_special_price
        FROM product_distributor_authorizations
        WHERE product_id = p_product_id
        AND distributor_id = p_distributor_id
        AND is_authorized = true
        AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);
    END IF;

    SELECT
        ppt.unit_price,
        ppt.tier_name,
        ppt.discount_percent
    INTO v_tier_price, v_tier_name, v_tier_discount
    FROM product_pricing_tiers ppt
    WHERE ppt.product_id = p_product_id
    AND p_quantity >= ppt.min_quantity
    AND (ppt.max_quantity IS NULL OR p_quantity <= ppt.max_quantity)
    AND (ppt.expiration_date IS NULL OR ppt.expiration_date >= CURRENT_DATE)
    ORDER BY ppt.min_quantity DESC
    LIMIT 1;

    v_final_unit_price := COALESCE(v_special_price, v_tier_price, v_base_price);

    RETURN QUERY
    SELECT
        v_final_unit_price AS unit_price,
        v_final_unit_price * p_quantity AS total_price,
        COALESCE(v_tier_discount, 0) AS discount_applied,
        COALESCE(v_tier_name, 'Standard') AS tier_name,
        v_special_price IS NOT NULL AS special_pricing;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_product_availability(p_product_id bigint, p_quantity integer, p_needed_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(is_available boolean, quantity_available integer, can_fulfill_by date, availability_notes text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_quantity_available INTEGER;
    v_lead_time INTEGER;
    v_is_seasonal BOOLEAN;
    v_in_season BOOLEAN;
    v_status product_status;
BEGIN
    SELECT
        COALESCE(pi.quantity_available, 0),
        p.lead_time_days,
        p.is_seasonal,
        CASE
            WHEN p.is_seasonal = false THEN true
            WHEN EXTRACT(MONTH FROM p_needed_date)::INTEGER BETWEEN
                p.season_start_month AND p.season_end_month THEN true
            ELSE false
        END,
        p.status
    INTO v_quantity_available, v_lead_time, v_is_seasonal, v_in_season, v_status
    FROM products p
    LEFT JOIN product_inventory pi ON p.id = pi.product_id
    WHERE p.id = p_product_id;

    RETURN QUERY
    SELECT
        v_quantity_available >= p_quantity AND v_in_season AND v_status = 'active' AS is_available,
        v_quantity_available AS quantity_available,
        CASE
            WHEN v_quantity_available >= p_quantity THEN p_needed_date
            ELSE p_needed_date + INTERVAL '1 day' * COALESCE(v_lead_time, 7)
        END::DATE AS can_fulfill_by,
        CASE
            WHEN v_status != 'active' THEN 'Product is ' || v_status
            WHEN NOT v_in_season THEN 'Product is out of season'
            WHEN v_quantity_available < p_quantity THEN
                'Insufficient inventory. ' || v_quantity_available || ' available, ' ||
                p_quantity || ' requested'
            ELSE 'Available'
        END AS availability_notes;
END;
$function$
;

create or replace view "public"."contacts_summary" as  SELECT c.id,
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
    o.name AS company_name
   FROM (public.contacts c
     LEFT JOIN public.organizations o ON (((o.id = c.organization_id) AND (o.deleted_at IS NULL))))
  WHERE (c.deleted_at IS NULL);


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
    COALESCE((s.first_name || COALESCE((' '::text || s.last_name), ''::text)), 'Unassigned'::text) AS account_manager_name,
    (s.user_id IS NOT NULL) AS account_manager_is_user
   FROM (public.contacts c
     LEFT JOIN public.sales s ON ((c.sales_id = s.id)));


CREATE OR REPLACE FUNCTION public.create_opportunity_with_participants(p_opportunity_data jsonb, p_participants jsonb[])
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_opportunity_id BIGINT;
    v_participant JSONB;
    v_customer_count INTEGER := 0;
    v_principal_count INTEGER := 0;
BEGIN
    FOREACH v_participant IN ARRAY p_participants
    LOOP
        IF v_participant->>'role' = 'customer' THEN
            v_customer_count := v_customer_count + 1;
        ELSIF v_participant->>'role' = 'principal' THEN
            v_principal_count := v_principal_count + 1;
        END IF;
    END LOOP;

    IF v_customer_count = 0 THEN
        RAISE EXCEPTION 'Opportunity must have at least one customer participant';
    END IF;

    INSERT INTO opportunities (
        name, description, stage, status, priority, amount, estimated_close_date,
        opportunity_owner_id, created_at, updated_at
    )
    VALUES (
        p_opportunity_data->>'name', p_opportunity_data->>'description',
        COALESCE((p_opportunity_data->>'stage')::opportunity_stage, 'lead'),
        COALESCE((p_opportunity_data->>'status')::opportunity_status, 'active'),
        COALESCE((p_opportunity_data->>'priority')::priority_level, 'medium'),
        (p_opportunity_data->>'amount')::NUMERIC,
        (p_opportunity_data->>'estimated_close_date')::DATE,
        (p_opportunity_data->>'opportunity_owner_id')::BIGINT,
        NOW(), NOW()
    )
    RETURNING id INTO v_opportunity_id;

    FOREACH v_participant IN ARRAY p_participants
    LOOP
        INSERT INTO opportunity_participants (
            opportunity_id, organization_id, role, is_primary,
            commission_rate, territory, notes, created_by
        )
        VALUES (
            v_opportunity_id,
            (v_participant->>'organization_id')::BIGINT,
            v_participant->>'role',
            COALESCE((v_participant->>'is_primary')::BOOLEAN, false),
            (v_participant->>'commission_rate')::NUMERIC,
            v_participant->>'territory',
            v_participant->>'notes',
            (v_participant->>'created_by')::BIGINT
        );
    END LOOP;

    RETURN v_opportunity_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_contact_organizations(p_contact_id bigint)
 RETURNS TABLE(organization_id bigint, organization_name text, is_primary boolean, is_primary_decision_maker boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        co.organization_id,
        o.name,
        co.is_primary,
        co.is_primary_decision_maker
    FROM contact_organizations co
    JOIN organizations o ON o.id = co.organization_id
    WHERE co.contact_id = p_contact_id
    AND co.deleted_at IS NULL
    AND o.deleted_at IS NULL
    ORDER BY co.is_primary DESC, o.name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_sales_id()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT id FROM sales WHERE user_id = auth.uid() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_segment(p_name text)
 RETURNS SETOF public.segments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Try to insert, skip if duplicate
  INSERT INTO segments (name, created_by)
  VALUES (trim(p_name), auth.uid())
  ON CONFLICT (lower(name)) DO NOTHING;

  -- Return the record (new or existing)
  RETURN QUERY
  SELECT * FROM segments
  WHERE lower(name) = lower(trim(p_name));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_organization_contacts(p_organization_id bigint)
 RETURNS TABLE(contact_id bigint, contact_name text, role public.contact_role, is_primary_decision_maker boolean, purchase_influence smallint)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        co.contact_id,
        c.name AS contact_name,
        co.role,
        co.is_primary_decision_maker,
        co.purchase_influence
    FROM contact_organizations co
    JOIN contacts c ON c.id = co.contact_id
    WHERE co.organization_id = p_organization_id
    AND co.deleted_at IS NULL
    ORDER BY co.is_primary_decision_maker DESC, co.purchase_influence DESC NULLS LAST;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.sales (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_update_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.sales
    SET email = NEW.email,
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$function$
;

create or replace view "public"."opportunities_summary" as  SELECT o.id,
    o.name,
    o.description,
    o.stage,
    o.status,
    o.priority,
    o.index,
    o.estimated_close_date,
    o.actual_close_date,
    o.customer_organization_id,
    o.principal_organization_id,
    o.distributor_organization_id,
    o.founding_interaction_id,
    o.stage_manual,
    o.status_manual,
    o.next_action,
    o.next_action_date,
    o.competition,
    o.decision_criteria,
    o.contact_ids,
    o.opportunity_owner_id,
    o.created_at,
    o.updated_at,
    o.created_by,
    o.deleted_at,
    o.search_tsv,
    o.tags,
    o.account_manager_id,
    o.lead_source,
    o.updated_by,
    cust_org.name AS customer_organization_name,
    prin_org.name AS principal_organization_name,
    dist_org.name AS distributor_organization_name
   FROM (((public.opportunities o
     LEFT JOIN public.organizations cust_org ON ((o.customer_organization_id = cust_org.id)))
     LEFT JOIN public.organizations prin_org ON ((o.principal_organization_id = prin_org.id)))
     LEFT JOIN public.organizations dist_org ON ((o.distributor_organization_id = dist_org.id)));


create or replace view "public"."organizations_summary" as  SELECT o.id,
    o.name,
    o.organization_type,
    o.priority,
    o.segment_id,
    o.annual_revenue,
    o.employee_count,
    o.phone,
    o.website,
    o.postal_code,
    o.city,
    o.state,
    o.description,
    o.created_at,
    count(DISTINCT opp.id) AS nb_opportunities,
    count(DISTINCT c.id) AS nb_contacts,
    max(opp.updated_at) AS last_opportunity_activity
   FROM ((public.organizations o
     LEFT JOIN public.opportunities opp ON ((((opp.customer_organization_id = o.id) OR (opp.principal_organization_id = o.id) OR (opp.distributor_organization_id = o.id)) AND (opp.deleted_at IS NULL))))
     LEFT JOIN public.contacts c ON (((c.organization_id = o.id) AND (c.deleted_at IS NULL))))
  WHERE (o.deleted_at IS NULL)
  GROUP BY o.id;


create or replace view "public"."organizations_with_account_manager" as  SELECT o.id,
    o.name,
    o.organization_type,
    o.parent_organization_id,
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
    o.annual_revenue,
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
    COALESCE((s.first_name || COALESCE((' '::text || s.last_name), ''::text)), 'Unassigned'::text) AS account_manager_name,
    (s.user_id IS NOT NULL) AS account_manager_is_user
   FROM (public.organizations o
     LEFT JOIN public.sales s ON ((o.sales_id = s.id)));


CREATE OR REPLACE FUNCTION public.products_search_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        coalesce(NEW.name, '') || ' ' ||
        coalesce(NEW.sku, '') || ' ' ||
        coalesce(NEW.manufacturer_part_number, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category::text, '') || ' ' ||
        coalesce(NEW.ingredients, '') || ' ' ||
        coalesce(NEW.marketing_description, '')
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_primary_organization(p_contact_id bigint, p_organization_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- First, ensure the relationship exists
    IF NOT EXISTS (
        SELECT 1 FROM contact_organizations 
        WHERE contact_id = p_contact_id 
        AND organization_id = p_organization_id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Contact-Organization relationship does not exist';
    END IF;
    
    -- Set all other organizations for this contact to non-primary
    UPDATE contact_organizations
    SET is_primary = FALSE,
        updated_at = NOW()
    WHERE contact_id = p_contact_id
    AND deleted_at IS NULL;
    
    -- Set the specified organization as primary
    UPDATE contact_organizations
    SET is_primary = TRUE,
        updated_at = NOW()
    WHERE contact_id = p_contact_id
    AND organization_id = p_organization_id
    AND deleted_at IS NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Set updated_by to the current user's sales_id
  NEW.updated_by := public.get_current_sales_id();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.setup_test_user(p_user_id uuid, p_first_name text, p_last_name text, p_email text, p_is_admin boolean DEFAULT false)
 RETURNS TABLE(result_id bigint, result_user_id uuid, result_email text, result_is_admin boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Insert or update sales record
  RETURN QUERY
  INSERT INTO public.sales AS s (user_id, first_name, last_name, email, is_admin)
  VALUES (p_user_id, p_first_name, p_last_name, p_email, p_is_admin)
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW()
  RETURNING 
    s.id,
    s.user_id,
    s.email,
    s.is_admin;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_contact_organizations(p_contact_id bigint, p_organizations jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    org_record record;
BEGIN
    -- Delete existing associations (delete-then-insert pattern)
    DELETE FROM contact_organizations WHERE contact_id = p_contact_id;

    -- Insert new associations from JSONB payload
    FOR org_record IN
        SELECT
            (elem->>'organization_id')::bigint as organization_id,
            COALESCE((elem->>'is_primary')::boolean, false) as is_primary,
            COALESCE((elem->>'is_primary_decision_maker')::boolean, false) as is_primary_decision_maker,
            (elem->>'relationship_start_date')::date as relationship_start_date,
            (elem->>'relationship_end_date')::date as relationship_end_date,
            elem->>'notes' as notes
        FROM jsonb_array_elements(p_organizations) AS elem
    LOOP
        INSERT INTO contact_organizations (
            contact_id,
            organization_id,
            is_primary,
            is_primary_decision_maker,
            relationship_start_date,
            relationship_end_date,
            notes,
            created_at,
            updated_at
        ) VALUES (
            p_contact_id,
            org_record.organization_id,
            org_record.is_primary,
            org_record.is_primary_decision_maker,
            org_record.relationship_start_date,
            org_record.relationship_end_date,
            org_record.notes,
            now(),
            now()
        );
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_opportunity_with_products(opportunity_data jsonb, products_to_create jsonb, products_to_update jsonb, product_ids_to_delete integer[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  opportunity_id BIGINT;
  updated_opportunity RECORD;
BEGIN
  INSERT INTO opportunities (
    id, name, description, opportunity_context, stage, priority, amount, probability,
    estimated_close_date, customer_organization_id, principal_organization_id,
    distributor_organization_id, contact_ids, opportunity_owner_id, index
  )
  VALUES (
    (opportunity_data->>'id')::BIGINT,
    opportunity_data->>'name',
    opportunity_data->>'description',
    opportunity_data->>'opportunity_context',
    (opportunity_data->>'stage')::opportunity_stage,
    (opportunity_data->>'priority')::priority_level,
    (opportunity_data->>'amount')::NUMERIC,
    (opportunity_data->>'probability')::INTEGER,
    (opportunity_data->>'estimated_close_date')::DATE,
    (opportunity_data->>'customer_organization_id')::BIGINT,
    (opportunity_data->>'principal_organization_id')::BIGINT,
    (opportunity_data->>'distributor_organization_id')::BIGINT,
    (opportunity_data->>'contact_ids')::BIGINT[],
    (opportunity_data->>'opportunity_owner_id')::BIGINT,
    (opportunity_data->>'index')::INTEGER
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    opportunity_context = EXCLUDED.opportunity_context,
    stage = EXCLUDED.stage,
    priority = EXCLUDED.priority,
    amount = EXCLUDED.amount,
    probability = EXCLUDED.probability,
    estimated_close_date = EXCLUDED.estimated_close_date,
    customer_organization_id = EXCLUDED.customer_organization_id,
    principal_organization_id = EXCLUDED.principal_organization_id,
    distributor_organization_id = EXCLUDED.distributor_organization_id,
    contact_ids = EXCLUDED.contact_ids,
    opportunity_owner_id = EXCLUDED.opportunity_owner_id,
    index = EXCLUDED.index,
    updated_at = NOW()
  RETURNING id INTO opportunity_id;

  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (
      opportunity_id, product_id_reference, product_name, product_category,
      quantity, unit_price, extended_price, notes
    )
    SELECT
      opportunity_id,
      (p->>'product_id_reference')::BIGINT,
      p->>'product_name',
      p->>'product_category',
      (p->>'quantity')::NUMERIC,
      (p->>'unit_price')::NUMERIC,
      (p->>'extended_price')::NUMERIC,
      p->>'notes'
    FROM JSONB_ARRAY_ELEMENTS(products_to_create) AS p;
  END IF;

  IF JSONB_ARRAY_LENGTH(products_to_update) > 0 THEN
    UPDATE opportunity_products op
    SET
      product_id_reference = (p->>'product_id_reference')::BIGINT,
      product_name = p->>'product_name',
      quantity = (p->>'quantity')::NUMERIC,
      unit_price = (p->>'unit_price')::NUMERIC,
      extended_price = (p->>'extended_price')::NUMERIC,
      notes = p->>'notes',
      updated_at = NOW()
    FROM JSONB_ARRAY_ELEMENTS(products_to_update) p
    WHERE op.id = (p->>'id')::BIGINT;
  END IF;

  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    DELETE FROM opportunity_products WHERE id = ANY(product_ids_to_delete);
  END IF;

  SELECT * FROM opportunities WHERE id = opportunity_id INTO updated_opportunity;
  RETURN TO_JSONB(updated_opportunity);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_organizations_search_tsv()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.search_tsv := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.website, '')), 'D');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_products_search()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.sku, '') || ' ' ||
        COALESCE(NEW.marketing_description, '')
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_search_tsv()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.website, '') || ' ' ||
            COALESCE(NEW.address, '') || ' ' ||
            COALESCE(NEW.city, '') || ' ' ||
            COALESCE(NEW.state, '')
        );
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.first_name, '') || ' ' ||
            COALESCE(NEW.last_name, '') || ' ' ||
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.department, '') || ' ' ||
            COALESCE(NEW.email::text, '') || ' ' ||
            COALESCE(NEW.phone::text, '')
        );
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.next_action, '')
            -- REMOVED: opportunity_context (column doesn't exist)
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.sku, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '') || ' ' ||
            COALESCE(NEW.ingredients, '') || ' ' ||
            COALESCE(NEW.marketing_description, '') || ' ' ||
            COALESCE(NEW.manufacturer_part_number, '') || ' ' ||
            COALESCE(array_to_string(NEW.certifications, ' '), '') || ' ' ||
            COALESCE(array_to_string(NEW.allergens, ' '), '')
        );
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_activity_consistency()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_opp_customer_id BIGINT;
    v_contact_org_id BIGINT;
BEGIN
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        SELECT op.organization_id INTO v_opp_customer_id
        FROM opportunity_participants op
        WHERE op.opportunity_id = NEW.opportunity_id
          AND op.role = 'customer'
          AND op.is_primary = true
          AND op.deleted_at IS NULL
        LIMIT 1;

        IF NEW.contact_id IS NOT NULL THEN
            SELECT organization_id INTO v_contact_org_id
            FROM contact_organizations
            WHERE contact_id = NEW.contact_id
              AND organization_id = v_opp_customer_id
              AND deleted_at IS NULL
            LIMIT 1;

            IF v_contact_org_id IS NULL THEN
                RAISE WARNING 'Contact % is not associated with opportunity customer organization %',
                              NEW.contact_id, v_opp_customer_id;
            END IF;
        END IF;

        IF NEW.organization_id IS NULL THEN
            NEW.organization_id := v_opp_customer_id;
        END IF;
    END IF;

    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_opportunity_participant_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_org_type organization_type;
BEGIN
    -- Get organization type
    SELECT organization_type
    INTO v_org_type
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Validate role matches organization type
    IF NEW.role = 'principal' AND v_org_type != 'principal' THEN
        RAISE EXCEPTION 'Organization must be a principal to have principal role';
    END IF;

    IF NEW.role = 'distributor' AND v_org_type != 'distributor' THEN
        RAISE EXCEPTION 'Organization must be a distributor to have distributor role';
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_opportunity_participants()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_org_type organization_type;
    v_is_principal BOOLEAN;
    v_is_distributor BOOLEAN;
    v_primary_count INTEGER;
BEGIN
    SELECT organization_type, is_principal, is_distributor
    INTO v_org_type, v_is_principal, v_is_distributor
    FROM organizations
    WHERE id = NEW.organization_id;

    IF NEW.role = 'principal' AND NOT v_is_principal THEN
        RAISE EXCEPTION 'Organization % is not marked as a principal', NEW.organization_id;
    END IF;

    IF NEW.role = 'distributor' AND NOT v_is_distributor THEN
        RAISE EXCEPTION 'Organization % is not marked as a distributor', NEW.organization_id;
    END IF;

    IF NEW.is_primary THEN
        SELECT COUNT(*) INTO v_primary_count
        FROM opportunity_participants
        WHERE opportunity_id = NEW.opportunity_id
          AND role = NEW.role
          AND is_primary = true
          AND deleted_at IS NULL
          AND id != COALESCE(NEW.id, -1);

        IF v_primary_count > 0 THEN
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

CREATE OR REPLACE FUNCTION public.validate_pricing_tiers()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_overlap_count
    FROM product_pricing_tiers
    WHERE product_id = NEW.product_id
    AND id != COALESCE(NEW.id, -1)
    AND (
        (NEW.min_quantity BETWEEN min_quantity AND COALESCE(max_quantity, 999999)) OR
        (COALESCE(NEW.max_quantity, 999999) BETWEEN min_quantity AND COALESCE(max_quantity, 999999)) OR
        (min_quantity BETWEEN NEW.min_quantity AND COALESCE(NEW.max_quantity, 999999))
    )
    AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Pricing tier quantities overlap with existing tiers';
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_principal_organization()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM companies
        WHERE id = NEW.principal_organization_id
        AND is_principal = true
    ) THEN
        RAISE EXCEPTION 'Organization % is not marked as principal', NEW.principal_organization_id;
    END IF;
    RETURN NEW;
END;
$function$
;

create policy "authenticated_delete_tasks"
on "public"."tasks"
as permissive
for delete
to authenticated
using ((sales_id = public.get_current_sales_id()));


create policy "authenticated_insert_tasks"
on "public"."tasks"
as permissive
for insert
to authenticated
with check ((sales_id = public.get_current_sales_id()));


create policy "authenticated_select_tasks"
on "public"."tasks"
as permissive
for select
to authenticated
using ((sales_id = public.get_current_sales_id()));


create policy "authenticated_update_tasks"
on "public"."tasks"
as permissive
for update
to authenticated
using ((sales_id = public.get_current_sales_id()));


CREATE TRIGGER trigger_validate_activity_consistency BEFORE INSERT OR UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.validate_activity_consistency();

CREATE TRIGGER set_updated_by_contactnotes BEFORE UPDATE ON public."contactNotes" FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TRIGGER validate_principal_organization_trigger BEFORE INSERT OR UPDATE ON public.contact_preferred_principals FOR EACH ROW EXECUTE FUNCTION public.validate_principal_organization();

CREATE TRIGGER set_updated_by_contacts BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TRIGGER trigger_update_contacts_search_tsv BEFORE INSERT OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_search_tsv();

CREATE TRIGGER set_updated_by_opportunities BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TRIGGER trigger_update_opportunities_search_tsv BEFORE INSERT OR UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_search_tsv();

CREATE TRIGGER set_updated_by_opportunitynotes BEFORE UPDATE ON public."opportunityNotes" FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TRIGGER trigger_validate_opportunity_participants BEFORE INSERT OR UPDATE ON public.opportunity_participants FOR EACH ROW EXECUTE FUNCTION public.validate_opportunity_participants();

CREATE TRIGGER set_updated_by_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TRIGGER trigger_update_organizations_search_tsv BEFORE INSERT OR UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_organizations_search_tsv();

CREATE TRIGGER trigger_validate_pricing_tiers BEFORE INSERT OR UPDATE ON public.product_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.validate_pricing_tiers();

CREATE TRIGGER products_search_update BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.products_search_trigger();

CREATE TRIGGER set_updated_by_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TRIGGER trigger_update_products_search_tsv BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_search_tsv();


drop trigger if exists "on_auth_user_created" on "auth"."users";

drop trigger if exists "on_auth_user_updated" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


