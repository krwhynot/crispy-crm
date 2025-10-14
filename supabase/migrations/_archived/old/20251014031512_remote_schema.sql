create type "public"."task_type" as enum ('Call', 'Email', 'Meeting', 'Follow-up', 'Proposal', 'Discovery', 'Administrative', 'None');

create sequence "public"."activities_id_seq";

create sequence "public"."contactNotes_id_seq";

create sequence "public"."contact_organizations_id_seq";

create sequence "public"."contact_preferred_principals_id_seq";

create sequence "public"."contacts_id_seq";

create sequence "public"."interaction_participants_id_seq";

create sequence "public"."migration_history_id_seq";

create sequence "public"."opportunities_id_seq";

create sequence "public"."opportunityNotes_id_seq";

create sequence "public"."opportunity_participants_id_seq";

create sequence "public"."organizations_id_seq";

create sequence "public"."product_category_hierarchy_id_seq";

create sequence "public"."product_distributor_authorizations_id_seq";

create sequence "public"."product_features_id_seq";

create sequence "public"."product_inventory_id_seq";

create sequence "public"."product_pricing_models_id_seq";

create sequence "public"."product_pricing_tiers_id_seq";

create sequence "public"."products_id_seq";

create sequence "public"."sales_id_seq";

create sequence "public"."tags_id_seq";

create sequence "public"."tasks_id_seq";

DROP TRIGGER IF EXISTS "update_activities_updated_at" on "public"."activities";

DROP TRIGGER IF EXISTS "update_contacts_search_trigger" on "public"."contacts";

DROP TRIGGER IF EXISTS "update_contacts_updated_at" on "public"."contacts";

DROP TRIGGER IF EXISTS "update_opportunities_search_trigger" on "public"."opportunities";

DROP TRIGGER IF EXISTS "update_opportunities_updated_at" on "public"."opportunities";

DROP TRIGGER IF EXISTS "update_organizations_search_trigger" on "public"."organizations";

DROP TRIGGER IF EXISTS "update_organizations_updated_at" on "public"."organizations";

DROP TRIGGER IF EXISTS "update_products_search_trigger" on "public"."products";

DROP TRIGGER IF EXISTS "update_products_updated_at" on "public"."products";

DROP TRIGGER IF EXISTS "update_tasks_updated_at" on "public"."tasks";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."activities";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."contactNotes";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."contact_organizations";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."contact_preferred_principals";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."contacts";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."interaction_participants";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."migration_history";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."opportunities";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."opportunityNotes";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."opportunity_participants";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."opportunity_products";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."organizations";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."product_category_hierarchy";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."product_distributor_authorizations";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."product_features";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."product_inventory";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."product_pricing_models";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."product_pricing_tiers";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."products";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."sales";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."tags";

DROP POLICY IF EXISTS "Authenticated users can access all data" on "public"."tasks";

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

revoke delete on table "public"."opportunity_products" from "anon";

revoke insert on table "public"."opportunity_products" from "anon";

revoke references on table "public"."opportunity_products" from "anon";

revoke select on table "public"."opportunity_products" from "anon";

revoke trigger on table "public"."opportunity_products" from "anon";

revoke truncate on table "public"."opportunity_products" from "anon";

revoke update on table "public"."opportunity_products" from "anon";

revoke delete on table "public"."opportunity_products" from "authenticated";

revoke insert on table "public"."opportunity_products" from "authenticated";

revoke references on table "public"."opportunity_products" from "authenticated";

revoke select on table "public"."opportunity_products" from "authenticated";

revoke trigger on table "public"."opportunity_products" from "authenticated";

revoke truncate on table "public"."opportunity_products" from "authenticated";

revoke update on table "public"."opportunity_products" from "authenticated";

revoke delete on table "public"."opportunity_products" from "service_role";

revoke insert on table "public"."opportunity_products" from "service_role";

revoke references on table "public"."opportunity_products" from "service_role";

revoke select on table "public"."opportunity_products" from "service_role";

revoke trigger on table "public"."opportunity_products" from "service_role";

revoke truncate on table "public"."opportunity_products" from "service_role";

revoke update on table "public"."opportunity_products" from "service_role";

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

revoke delete on table "public"."product_inventory" from "anon";

revoke insert on table "public"."product_inventory" from "anon";

revoke references on table "public"."product_inventory" from "anon";

revoke select on table "public"."product_inventory" from "anon";

revoke trigger on table "public"."product_inventory" from "anon";

revoke truncate on table "public"."product_inventory" from "anon";

revoke update on table "public"."product_inventory" from "anon";

revoke delete on table "public"."product_inventory" from "authenticated";

revoke insert on table "public"."product_inventory" from "authenticated";

revoke references on table "public"."product_inventory" from "authenticated";

revoke select on table "public"."product_inventory" from "authenticated";

revoke trigger on table "public"."product_inventory" from "authenticated";

revoke truncate on table "public"."product_inventory" from "authenticated";

revoke update on table "public"."product_inventory" from "authenticated";

revoke delete on table "public"."product_inventory" from "service_role";

revoke insert on table "public"."product_inventory" from "service_role";

revoke references on table "public"."product_inventory" from "service_role";

revoke select on table "public"."product_inventory" from "service_role";

revoke trigger on table "public"."product_inventory" from "service_role";

revoke truncate on table "public"."product_inventory" from "service_role";

revoke update on table "public"."product_inventory" from "service_role";

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

ALTER TABLE IF EXISTS "public"."contact_organizations" drop constraint "contact_organizations_decision_authority_check";

ALTER TABLE IF EXISTS "public"."contact_organizations" drop constraint "contact_organizations_purchase_influence_check";

ALTER TABLE IF EXISTS "public"."contacts" drop constraint "contacts_decision_authority_check";

ALTER TABLE IF EXISTS "public"."contacts" drop constraint "contacts_purchase_influence_check";

ALTER TABLE IF EXISTS "public"."opportunities" drop constraint "opportunities_probability_check";

ALTER TABLE IF EXISTS "public"."opportunity_products" drop constraint "opportunity_products_created_by_fkey";

ALTER TABLE IF EXISTS "public"."opportunity_products" drop constraint "opportunity_products_discount_percent_check";

ALTER TABLE IF EXISTS "public"."opportunity_products" drop constraint "opportunity_products_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunity_products" drop constraint "opportunity_products_price_tier_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunity_products" drop constraint "opportunity_products_product_id_reference_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" drop constraint "product_pricing_tiers_discount_percent_check";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" drop constraint "product_pricing_tiers_unit_price_check";

ALTER TABLE IF EXISTS "public"."products" drop constraint "products_season_end_month_check";

ALTER TABLE IF EXISTS "public"."products" drop constraint "products_season_start_month_check";

ALTER TABLE IF EXISTS "public"."activities" drop constraint "activities_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."activities" drop constraint "activities_created_by_fkey";

ALTER TABLE IF EXISTS "public"."activities" drop constraint "activities_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."contactNotes" drop constraint "contactNotes_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."contactNotes" drop constraint "contactNotes_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."contact_organizations" drop constraint "contact_organizations_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."contact_organizations" drop constraint "contact_organizations_created_by_fkey";

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" drop constraint "contact_preferred_principals_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" drop constraint "contact_preferred_principals_created_by_fkey";

ALTER TABLE IF EXISTS "public"."contacts" drop constraint "contacts_created_by_fkey";

ALTER TABLE IF EXISTS "public"."contacts" drop constraint "contacts_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."interaction_participants" drop constraint "interaction_participants_activity_id_fkey";

ALTER TABLE IF EXISTS "public"."interaction_participants" drop constraint "interaction_participants_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunities" drop constraint "opportunities_created_by_fkey";

ALTER TABLE IF EXISTS "public"."opportunities" drop constraint "opportunities_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunityNotes" drop constraint "opportunityNotes_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunityNotes" drop constraint "opportunityNotes_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunity_participants" drop constraint "opportunity_participants_created_by_fkey";

ALTER TABLE IF EXISTS "public"."opportunity_participants" drop constraint "opportunity_participants_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."organizations" drop constraint "organizations_created_by_fkey";

ALTER TABLE IF EXISTS "public"."organizations" drop constraint "organizations_parent_organization_id_fkey";

ALTER TABLE IF EXISTS "public"."organizations" drop constraint "organizations_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."product_category_hierarchy" drop constraint "product_category_hierarchy_parent_category_id_fkey";

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" drop constraint "product_distributor_authorizations_created_by_fkey";

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" drop constraint "product_distributor_authorizations_product_id_fkey";

ALTER TABLE IF EXISTS "public"."product_features" drop constraint "product_features_product_id_fkey";

ALTER TABLE IF EXISTS "public"."product_inventory" drop constraint "product_inventory_product_id_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_models" drop constraint "product_pricing_models_created_by_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_models" drop constraint "product_pricing_models_product_id_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" drop constraint "product_pricing_tiers_created_by_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" drop constraint "product_pricing_tiers_product_id_fkey";

ALTER TABLE IF EXISTS "public"."products" drop constraint "products_created_by_fkey";

ALTER TABLE IF EXISTS "public"."products" drop constraint "products_updated_by_fkey";

ALTER TABLE IF EXISTS "public"."sales" drop constraint "sales_user_id_fkey";

ALTER TABLE IF EXISTS "public"."tasks" drop constraint "tasks_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."tasks" drop constraint "tasks_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."tasks" drop constraint "tasks_sales_id_fkey";

drop view if exists "public"."opportunities_summary";

drop function if exists "public"."update_contacts_search"();

drop function if exists "public"."update_opportunities_search"();

drop function if exists "public"."update_organizations_search"();

drop function if exists "public"."update_updated_at"();

drop view if exists "public"."contacts_summary";

drop view if exists "public"."organizations_summary";

ALTER TABLE IF EXISTS "public"."opportunity_products" drop constraint "opportunity_products_pkey";

drop index if exists "public"."idx_activities_activity_date";

drop index if exists "public"."idx_activities_contact_id";

drop index if exists "public"."idx_activities_created_by";

drop index if exists "public"."idx_activities_opportunity_id";

drop index if exists "public"."idx_contact_organizations_contact_id";

drop index if exists "public"."idx_contact_organizations_organization_id";

drop index if exists "public"."idx_contacts_email_gin";

drop index if exists "public"."idx_contacts_name";

drop index if exists "public"."idx_contacts_search";

drop index if exists "public"."idx_opportunities_index";

drop index if exists "public"."idx_opportunities_sales_id";

drop index if exists "public"."idx_opportunities_search";

drop index if exists "public"."idx_opportunity_participants_opportunity";

drop index if exists "public"."idx_opportunity_participants_organization";

drop index if exists "public"."idx_organizations_deleted_at";

drop index if exists "public"."idx_organizations_sales_id";

drop index if exists "public"."idx_organizations_search";

drop index if exists "public"."idx_organizations_type";

drop index if exists "public"."idx_products_principal";

drop index if exists "public"."idx_products_search";

drop index if exists "public"."idx_tasks_completed";

drop index if exists "public"."idx_tasks_sales_id";

drop index if exists "public"."opportunity_products_pkey";

drop index if exists "public"."idx_activities_type";

drop index if exists "public"."idx_contact_organizations_primary";

drop index if exists "public"."idx_opportunities_stage";

drop index if exists "public"."idx_opportunities_status";

drop index if exists "public"."idx_organizations_name";

drop index if exists "public"."idx_products_category";

drop index if exists "public"."idx_products_sku";

drop index if exists "public"."idx_products_status";

drop index if exists "public"."idx_tasks_due_date";

drop table "public"."opportunity_products";

alter type "public"."organization_type" rename to "organization_type__old_version_to_be_dropped";

create type "public"."organization_type" as enum ('customer', 'principal', 'distributor', 'prospect', 'partner', 'unknown');

create table "public"."segments" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid
);


ALTER TABLE IF EXISTS "public"."segments" enable row level security;

drop type "public"."organization_type__old_version_to_be_dropped";

ALTER TABLE IF EXISTS "public"."activities" alter column "activity_type" set data type public.activity_type using "activity_type"::text::public.activity_type;

ALTER TABLE IF EXISTS "public"."activities" alter column "id" set default nextval('public.activities_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."activities" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."activities" alter column "type" set data type public.interaction_type using "type"::text::public.interaction_type;

ALTER TABLE IF EXISTS "public"."contactNotes" add column "date" timestamp with time zone not null default now();

ALTER TABLE IF EXISTS "public"."contactNotes" alter column "id" set default nextval('public."contactNotes_id_seq"'::regclass);

ALTER TABLE IF EXISTS "public"."contactNotes" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."contact_organizations" drop column "decision_authority";

ALTER TABLE IF EXISTS "public"."contact_organizations" drop column "purchase_influence";

ALTER TABLE IF EXISTS "public"."contact_organizations" drop column "role";

ALTER TABLE IF EXISTS "public"."contact_organizations" alter column "id" set default nextval('public.contact_organizations_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."contact_organizations" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" alter column "id" set default nextval('public.contact_preferred_principals_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."contacts" drop column "decision_authority";

ALTER TABLE IF EXISTS "public"."contacts" drop column "purchase_influence";

ALTER TABLE IF EXISTS "public"."contacts" drop column "role";

ALTER TABLE IF EXISTS "public"."contacts" add column "organization_id" bigint;

ALTER TABLE IF EXISTS "public"."contacts" alter column "id" set default nextval('public.contacts_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."contacts" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."interaction_participants" alter column "id" set default nextval('public.interaction_participants_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."interaction_participants" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."migration_history" alter column "id" set default nextval('public.migration_history_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."migration_history" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."opportunities" drop column "amount";

ALTER TABLE IF EXISTS "public"."opportunities" drop column "category";

ALTER TABLE IF EXISTS "public"."opportunities" drop column "probability";

ALTER TABLE IF EXISTS "public"."opportunities" drop column "sales_id";

ALTER TABLE IF EXISTS "public"."opportunities" add column "account_manager_id" bigint;

ALTER TABLE IF EXISTS "public"."opportunities" add column "lead_source" text;

ALTER TABLE IF EXISTS "public"."opportunities" add column "opportunity_owner_id" bigint;

ALTER TABLE IF EXISTS "public"."opportunities" add column "tags" text[] default '{}'::text[];

ALTER TABLE IF EXISTS "public"."opportunities" alter column "estimated_close_date" set default (CURRENT_DATE + '90 days'::interval);

ALTER TABLE IF EXISTS "public"."opportunities" alter column "id" set default nextval('public.opportunities_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."opportunities" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."opportunities" alter column "priority" set default 'medium'::public.priority_level;

ALTER TABLE IF EXISTS "public"."opportunities" alter column "priority" set data type public.priority_level using "priority"::text::public.priority_level;

ALTER TABLE IF EXISTS "public"."opportunities" alter column "stage" set default 'new_lead'::public.opportunity_stage;

ALTER TABLE IF EXISTS "public"."opportunities" alter column "stage" set data type public.opportunity_stage using "stage"::text::public.opportunity_stage;

ALTER TABLE IF EXISTS "public"."opportunities" alter column "status" set default 'active'::public.opportunity_status;

ALTER TABLE IF EXISTS "public"."opportunities" alter column "status" set data type public.opportunity_status using "status"::text::public.opportunity_status;

ALTER TABLE IF EXISTS "public"."opportunityNotes" add column "date" timestamp with time zone not null default now();

ALTER TABLE IF EXISTS "public"."opportunityNotes" alter column "id" set default nextval('public."opportunityNotes_id_seq"'::regclass);

ALTER TABLE IF EXISTS "public"."opportunityNotes" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."opportunity_participants" alter column "commission_rate" set data type numeric(5,4) using "commission_rate"::numeric(5,4);

ALTER TABLE IF EXISTS "public"."opportunity_participants" alter column "id" set default nextval('public.opportunity_participants_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."opportunity_participants" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."organizations" drop column "country";

ALTER TABLE IF EXISTS "public"."organizations" drop column "industry";

ALTER TABLE IF EXISTS "public"."organizations" drop column "segment";

ALTER TABLE IF EXISTS "public"."organizations" add column "context_links" jsonb;

ALTER TABLE IF EXISTS "public"."organizations" add column "description" text;

ALTER TABLE IF EXISTS "public"."organizations" add column "segment_id" uuid;

ALTER TABLE IF EXISTS "public"."organizations" add column "tax_identifier" text;

ALTER TABLE IF EXISTS "public"."organizations" alter column "annual_revenue" set data type numeric(15,2) using "annual_revenue"::numeric(15,2);

ALTER TABLE IF EXISTS "public"."organizations" alter column "id" set default nextval('public.organizations_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."organizations" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."organizations" alter column "organization_type" set default 'unknown'::public.organization_type;

ALTER TABLE IF EXISTS "public"."organizations" alter column "organization_type" set data type public.organization_type using "organization_type"::text::public.organization_type;

ALTER TABLE IF EXISTS "public"."product_category_hierarchy" alter column "id" set default nextval('public.product_category_hierarchy_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."product_category_hierarchy" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."product_category_hierarchy" alter column "level" set not null;

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" alter column "id" set default nextval('public.product_distributor_authorizations_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."product_features" alter column "id" set default nextval('public.product_features_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."product_features" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."product_inventory" alter column "id" set default nextval('public.product_inventory_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."product_inventory" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."product_pricing_models" alter column "base_price" set data type numeric(12,2) using "base_price"::numeric(12,2);

ALTER TABLE IF EXISTS "public"."product_pricing_models" alter column "id" set default nextval('public.product_pricing_models_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."product_pricing_models" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."product_pricing_models" alter column "max_price" set data type numeric(12,2) using "max_price"::numeric(12,2);

ALTER TABLE IF EXISTS "public"."product_pricing_models" alter column "min_price" set data type numeric(12,2) using "min_price"::numeric(12,2);

ALTER TABLE IF EXISTS "public"."product_pricing_models" alter column "model_type" set default 'fixed'::public.pricing_model_type;

ALTER TABLE IF EXISTS "public"."product_pricing_models" alter column "model_type" set data type public.pricing_model_type using "model_type"::text::public.pricing_model_type;

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" alter column "discount_amount" set data type numeric(12,2) using "discount_amount"::numeric(12,2);

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" alter column "discount_percent" set data type numeric(5,2) using "discount_percent"::numeric(5,2);

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" alter column "id" set default nextval('public.product_pricing_tiers_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" alter column "unit_price" set data type numeric(12,2) using "unit_price"::numeric(12,2);

ALTER TABLE IF EXISTS "public"."products" drop column "benefits";

ALTER TABLE IF EXISTS "public"."products" drop column "cases_per_pallet";

ALTER TABLE IF EXISTS "public"."products" drop column "dimensions";

ALTER TABLE IF EXISTS "public"."products" drop column "expiration_date_required";

ALTER TABLE IF EXISTS "public"."products" drop column "features";

ALTER TABLE IF EXISTS "public"."products" drop column "image_urls";

ALTER TABLE IF EXISTS "public"."products" drop column "is_seasonal";

ALTER TABLE IF EXISTS "public"."products" drop column "lead_time_days";

ALTER TABLE IF EXISTS "public"."products" drop column "lot_tracking_required";

ALTER TABLE IF EXISTS "public"."products" drop column "map_price";

ALTER TABLE IF EXISTS "public"."products" drop column "max_order_quantity";

ALTER TABLE IF EXISTS "public"."products" drop column "season_end_month";

ALTER TABLE IF EXISTS "public"."products" drop column "season_start_month";

ALTER TABLE IF EXISTS "public"."products" drop column "shelf_life_days";

ALTER TABLE IF EXISTS "public"."products" drop column "specifications";

ALTER TABLE IF EXISTS "public"."products" drop column "storage_temperature";

ALTER TABLE IF EXISTS "public"."products" drop column "units_per_case";

ALTER TABLE IF EXISTS "public"."products" drop column "upc";

ALTER TABLE IF EXISTS "public"."products" drop column "weight_per_unit";

ALTER TABLE IF EXISTS "public"."products" add column "currency_code" text default 'USD'::text;

ALTER TABLE IF EXISTS "public"."products" add column "manufacturer_part_number" text;

ALTER TABLE IF EXISTS "public"."products" add column "minimum_order_quantity" integer default 1;

ALTER TABLE IF EXISTS "public"."products" alter column "category" set data type public.product_category using "category"::text::public.product_category;

ALTER TABLE IF EXISTS "public"."products" alter column "id" set default nextval('public.products_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."products" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."products" alter column "list_price" set data type numeric(12,2) using "list_price"::numeric(12,2);

ALTER TABLE IF EXISTS "public"."products" alter column "status" set default 'active'::public.product_status;

ALTER TABLE IF EXISTS "public"."products" alter column "status" set data type public.product_status using "status"::text::public.product_status;

ALTER TABLE IF EXISTS "public"."products" alter column "unit_of_measure" set default 'each'::text;

ALTER TABLE IF EXISTS "public"."products" alter column "unit_of_measure" set data type text using "unit_of_measure"::text;

ALTER TABLE IF EXISTS "public"."sales" alter column "id" set default nextval('public.sales_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."sales" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."tags" alter column "id" set default nextval('public.tags_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."tags" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."tasks" drop column "name";

ALTER TABLE IF EXISTS "public"."tasks" add column "title" text not null;

ALTER TABLE IF EXISTS "public"."tasks" add column "type" public.task_type default 'None'::public.task_type;

ALTER TABLE IF EXISTS "public"."tasks" alter column "id" set default nextval('public.tasks_id_seq'::regclass);

ALTER TABLE IF EXISTS "public"."tasks" alter column "id" drop identity;

ALTER TABLE IF EXISTS "public"."tasks" alter column "priority" set default 'medium'::public.priority_level;

ALTER TABLE IF EXISTS "public"."tasks" alter column "priority" set data type public.priority_level using "priority"::text::public.priority_level;

alter sequence "public"."activities_id_seq" owned by "public"."activities"."id";

alter sequence "public"."contactNotes_id_seq" owned by "public"."contactNotes"."id";

alter sequence "public"."contact_organizations_id_seq" owned by "public"."contact_organizations"."id";

alter sequence "public"."contact_preferred_principals_id_seq" owned by "public"."contact_preferred_principals"."id";

alter sequence "public"."contacts_id_seq" owned by "public"."contacts"."id";

alter sequence "public"."interaction_participants_id_seq" owned by "public"."interaction_participants"."id";

alter sequence "public"."migration_history_id_seq" owned by "public"."migration_history"."id";

alter sequence "public"."opportunities_id_seq" owned by "public"."opportunities"."id";

alter sequence "public"."opportunityNotes_id_seq" owned by "public"."opportunityNotes"."id";

alter sequence "public"."opportunity_participants_id_seq" owned by "public"."opportunity_participants"."id";

alter sequence "public"."organizations_id_seq" owned by "public"."organizations"."id";

alter sequence "public"."product_category_hierarchy_id_seq" owned by "public"."product_category_hierarchy"."id";

alter sequence "public"."product_distributor_authorizations_id_seq" owned by "public"."product_distributor_authorizations"."id";

alter sequence "public"."product_features_id_seq" owned by "public"."product_features"."id";

alter sequence "public"."product_inventory_id_seq" owned by "public"."product_inventory"."id";

alter sequence "public"."product_pricing_models_id_seq" owned by "public"."product_pricing_models"."id";

alter sequence "public"."product_pricing_tiers_id_seq" owned by "public"."product_pricing_tiers"."id";

alter sequence "public"."products_id_seq" owned by "public"."products"."id";

alter sequence "public"."sales_id_seq" owned by "public"."sales"."id";

alter sequence "public"."tags_id_seq" owned by "public"."tags"."id";

alter sequence "public"."tasks_id_seq" owned by "public"."tasks"."id";

drop type "public"."storage_temperature";

drop type "public"."unit_of_measure";

drop extension if exists "pg_trgm";

CREATE INDEX idx_activities_contact ON public.activities USING btree (contact_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_activities_date ON public.activities USING btree (activity_date DESC) WHERE (deleted_at IS NULL);

CREATE INDEX idx_activities_follow_up ON public.activities USING btree (follow_up_date) WHERE ((follow_up_required = true) AND (deleted_at IS NULL));

CREATE INDEX idx_activities_opportunity ON public.activities USING btree (opportunity_id) WHERE ((deleted_at IS NULL) AND (opportunity_id IS NOT NULL));

CREATE INDEX idx_activities_organization ON public.activities USING btree (organization_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_companies_deleted_at ON public.organizations USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX idx_companies_is_distributor ON public.organizations USING btree (is_distributor) WHERE (is_distributor = true);

CREATE INDEX idx_companies_is_principal ON public.organizations USING btree (is_principal) WHERE (is_principal = true);

CREATE INDEX idx_companies_organization_type ON public.organizations USING btree (organization_type);

CREATE INDEX idx_companies_parent_company_id ON public.organizations USING btree (parent_organization_id) WHERE (parent_organization_id IS NOT NULL);

CREATE INDEX idx_companies_priority ON public.organizations USING btree (priority);

CREATE INDEX idx_companies_sales_id ON public.organizations USING btree (sales_id);

CREATE INDEX idx_companies_search_tsv ON public.organizations USING gin (search_tsv);

CREATE INDEX idx_contact_notes_contact_id ON public."contactNotes" USING btree (contact_id);

CREATE INDEX idx_contact_organizations_contact ON public.contact_organizations USING btree (contact_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_contact_organizations_decision_makers ON public.contact_organizations USING btree (organization_id, is_primary_decision_maker) WHERE ((deleted_at IS NULL) AND (is_primary_decision_maker = true));

CREATE INDEX idx_contact_organizations_organization ON public.contact_organizations USING btree (organization_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX idx_contact_organizations_unique_contact ON public.contact_organizations USING btree (contact_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_contact_orgs_lookup ON public.contact_organizations USING btree (contact_id, is_primary DESC, created_at);

CREATE INDEX idx_contact_preferred_principals_contact ON public.contact_preferred_principals USING btree (contact_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_contact_preferred_principals_principal ON public.contact_preferred_principals USING btree (principal_organization_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_contact_preferred_principals_strength ON public.contact_preferred_principals USING btree (advocacy_strength) WHERE (deleted_at IS NULL);

CREATE INDEX idx_contacts_organization_id ON public.contacts USING btree (organization_id);

CREATE INDEX idx_contacts_search_tsv ON public.contacts USING gin (search_tsv);

CREATE INDEX idx_interaction_participants_organization ON public.interaction_participants USING btree (organization_id);

CREATE INDEX idx_inventory_available ON public.product_inventory USING btree (quantity_available);

CREATE INDEX idx_inventory_product_id ON public.product_inventory USING btree (product_id);

CREATE INDEX idx_inventory_reorder ON public.product_inventory USING btree (product_id) WHERE (quantity_available <= reorder_point);

CREATE INDEX idx_opportunities_account_manager ON public.opportunities USING btree (account_manager_id);

CREATE INDEX idx_opportunities_customer_organization_id ON public.opportunities USING btree (customer_organization_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_opportunities_distributor_organization_id ON public.opportunities USING btree (distributor_organization_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_opportunities_estimated_close ON public.opportunities USING btree (estimated_close_date);

CREATE INDEX idx_opportunities_owner_id ON public.opportunities USING btree (opportunity_owner_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_opportunities_principal_org ON public.opportunities USING btree (principal_organization_id) WHERE (principal_organization_id IS NOT NULL);

CREATE INDEX idx_opportunities_principal_organization_id ON public.opportunities USING btree (principal_organization_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_opportunities_priority ON public.opportunities USING btree (priority);

CREATE INDEX idx_opportunities_search_tsv ON public.opportunities USING gin (search_tsv);

CREATE INDEX idx_opportunities_tags ON public.opportunities USING gin (tags);

CREATE INDEX idx_opportunity_notes_opportunity_id ON public."opportunityNotes" USING btree (opportunity_id);

CREATE INDEX idx_opportunity_participants_opp_id ON public.opportunity_participants USING btree (opportunity_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_opportunity_participants_org_id ON public.opportunity_participants USING btree (organization_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_opportunity_participants_primary ON public.opportunity_participants USING btree (opportunity_id, role) WHERE ((is_primary = true) AND (deleted_at IS NULL));

CREATE INDEX idx_opportunity_participants_role ON public.opportunity_participants USING btree (role) WHERE (deleted_at IS NULL);

CREATE INDEX idx_organizations_parent_company_id ON public.organizations USING btree (parent_organization_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_organizations_search_tsv ON public.organizations USING gin (search_tsv) WHERE (deleted_at IS NULL);

CREATE INDEX idx_pricing_tiers_effective ON public.product_pricing_tiers USING btree (effective_date, expiration_date);

CREATE INDEX idx_pricing_tiers_product_id ON public.product_pricing_tiers USING btree (product_id);

CREATE INDEX idx_pricing_tiers_quantity ON public.product_pricing_tiers USING btree (product_id, min_quantity, max_quantity);

CREATE INDEX idx_product_auth_active ON public.product_distributor_authorizations USING btree (is_authorized) WHERE (is_authorized = true);

CREATE INDEX idx_product_auth_distributor_id ON public.product_distributor_authorizations USING btree (distributor_id);

CREATE INDEX idx_product_auth_product_id ON public.product_distributor_authorizations USING btree (product_id);

CREATE INDEX idx_products_principal_id ON public.products USING btree (principal_id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_products_search_tsv ON public.products USING gin (search_tsv);

CREATE INDEX idx_sales_disabled ON public.sales USING btree (disabled) WHERE (disabled = false);

CREATE INDEX idx_tasks_reminder_date ON public.tasks USING btree (reminder_date) WHERE (completed = false);

CREATE UNIQUE INDEX industries_name_case_insensitive_idx ON public.segments USING btree (lower(name));

CREATE UNIQUE INDEX industries_name_unique ON public.segments USING btree (name);

CREATE UNIQUE INDEX industries_pkey ON public.segments USING btree (id);

select 1; -- CREATE INDEX unique_contact_organization_active ON public.contact_organizations USING btree (contact_id, organization_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX unique_contact_principal_active ON public.contact_preferred_principals USING btree (contact_id, principal_organization_id, deleted_at);

CREATE UNIQUE INDEX unique_product_distributor ON public.product_distributor_authorizations USING btree (product_id, distributor_id);

CREATE UNIQUE INDEX unique_sku_per_principal ON public.products USING btree (principal_id, sku, deleted_at);

CREATE INDEX idx_activities_type ON public.activities USING btree (activity_type, type) WHERE (deleted_at IS NULL);

CREATE INDEX idx_contact_organizations_primary ON public.contact_organizations USING btree (organization_id, is_primary) WHERE ((deleted_at IS NULL) AND (is_primary = true));

CREATE INDEX idx_opportunities_stage ON public.opportunities USING btree (stage) WHERE (deleted_at IS NULL);

CREATE INDEX idx_opportunities_status ON public.opportunities USING btree (status) WHERE (deleted_at IS NULL);

CREATE INDEX idx_organizations_name ON public.organizations USING btree (name) WHERE (deleted_at IS NULL);

CREATE INDEX idx_products_category ON public.products USING btree (category) WHERE (deleted_at IS NULL);

CREATE INDEX idx_products_sku ON public.products USING btree (sku) WHERE (deleted_at IS NULL);

CREATE INDEX idx_products_status ON public.products USING btree (status) WHERE (deleted_at IS NULL);

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date) WHERE (completed = false);

ALTER TABLE IF EXISTS "public"."segments" add constraint "industries_pkey" PRIMARY KEY using index "industries_pkey";

ALTER TABLE IF EXISTS "public"."activities" add constraint "check_has_contact_or_org" CHECK (((contact_id IS NOT NULL) OR (organization_id IS NOT NULL))) not valid;

ALTER TABLE IF EXISTS "public"."activities" validate constraint "check_has_contact_or_org";

ALTER TABLE IF EXISTS "public"."activities" add constraint "check_interaction_has_opportunity" CHECK ((((activity_type = 'interaction'::public.activity_type) AND (opportunity_id IS NOT NULL)) OR (activity_type = 'engagement'::public.activity_type))) not valid;

ALTER TABLE IF EXISTS "public"."activities" validate constraint "check_interaction_has_opportunity";

ALTER TABLE IF EXISTS "public"."contact_organizations" add constraint "unique_contact_organization_active" EXCLUDE USING btree (contact_id WITH =, organization_id WITH =) WHERE ((deleted_at IS NULL));

ALTER TABLE IF EXISTS "public"."contact_organizations" add constraint "valid_relationship_dates" CHECK (((relationship_end_date IS NULL) OR (relationship_end_date > relationship_start_date))) not valid;

ALTER TABLE IF EXISTS "public"."contact_organizations" validate constraint "valid_relationship_dates";

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" add constraint "unique_contact_principal_active" UNIQUE using index "unique_contact_principal_active";

ALTER TABLE IF EXISTS "public"."contacts" add constraint "contacts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL not valid;

ALTER TABLE IF EXISTS "public"."contacts" validate constraint "contacts_organization_id_fkey";

ALTER TABLE IF EXISTS "public"."interaction_participants" add constraint "has_contact_or_org" CHECK (((contact_id IS NOT NULL) OR (organization_id IS NOT NULL))) not valid;

ALTER TABLE IF EXISTS "public"."interaction_participants" validate constraint "has_contact_or_org";

ALTER TABLE IF EXISTS "public"."opportunities" add constraint "opportunities_account_manager_id_fkey" FOREIGN KEY (account_manager_id) REFERENCES public.sales(id) ON DELETE SET NULL not valid;

ALTER TABLE IF EXISTS "public"."opportunities" validate constraint "opportunities_account_manager_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunities" add constraint "opportunities_lead_source_check" CHECK ((lead_source = ANY (ARRAY['referral'::text, 'trade_show'::text, 'website'::text, 'cold_call'::text, 'email_campaign'::text, 'social_media'::text, 'partner'::text, 'existing_customer'::text]))) not valid;

ALTER TABLE IF EXISTS "public"."opportunities" validate constraint "opportunities_lead_source_check";

ALTER TABLE IF EXISTS "public"."organizations" add constraint "organizations_industry_id_fkey" FOREIGN KEY (segment_id) REFERENCES public.segments(id) not valid;

ALTER TABLE IF EXISTS "public"."organizations" validate constraint "organizations_industry_id_fkey";

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" add constraint "unique_product_distributor" UNIQUE using index "unique_product_distributor";

ALTER TABLE IF EXISTS "public"."product_inventory" add constraint "non_negative_inventory" CHECK (((quantity_on_hand >= 0) AND (quantity_committed >= 0))) not valid;

ALTER TABLE IF EXISTS "public"."product_inventory" validate constraint "non_negative_inventory";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" add constraint "positive_price" CHECK ((unit_price > (0)::numeric)) not valid;

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" validate constraint "positive_price";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" add constraint "positive_quantities" CHECK (((min_quantity > 0) AND ((max_quantity IS NULL) OR (max_quantity >= min_quantity)))) not valid;

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" validate constraint "positive_quantities";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" add constraint "valid_discount" CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric))) not valid;

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" validate constraint "valid_discount";

ALTER TABLE IF EXISTS "public"."products" add constraint "check_currency_code" CHECK ((currency_code ~ '^[A-Z]{3}$'::text)) not valid;

ALTER TABLE IF EXISTS "public"."products" validate constraint "check_currency_code";

ALTER TABLE IF EXISTS "public"."products" add constraint "check_minimum_order_quantity" CHECK ((minimum_order_quantity > 0)) not valid;

ALTER TABLE IF EXISTS "public"."products" validate constraint "check_minimum_order_quantity";

ALTER TABLE IF EXISTS "public"."products" add constraint "unique_sku_per_principal" UNIQUE using index "unique_sku_per_principal";

ALTER TABLE IF EXISTS "public"."segments" add constraint "industries_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

ALTER TABLE IF EXISTS "public"."segments" validate constraint "industries_created_by_fkey";

ALTER TABLE IF EXISTS "public"."segments" add constraint "industries_name_unique" UNIQUE using index "industries_name_unique";

ALTER TABLE IF EXISTS "public"."activities" add constraint "activities_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) not valid;

ALTER TABLE IF EXISTS "public"."activities" validate constraint "activities_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."activities" add constraint "activities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."activities" validate constraint "activities_created_by_fkey";

ALTER TABLE IF EXISTS "public"."activities" add constraint "activities_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) not valid;

ALTER TABLE IF EXISTS "public"."activities" validate constraint "activities_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."contactNotes" add constraint "contactNotes_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."contactNotes" validate constraint "contactNotes_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."contactNotes" add constraint "contactNotes_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."contactNotes" validate constraint "contactNotes_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."contact_organizations" add constraint "contact_organizations_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."contact_organizations" validate constraint "contact_organizations_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."contact_organizations" add constraint "contact_organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."contact_organizations" validate constraint "contact_organizations_created_by_fkey";

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" add constraint "contact_preferred_principals_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" validate constraint "contact_preferred_principals_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" add constraint "contact_preferred_principals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."contact_preferred_principals" validate constraint "contact_preferred_principals_created_by_fkey";

ALTER TABLE IF EXISTS "public"."contacts" add constraint "contacts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."contacts" validate constraint "contacts_created_by_fkey";

ALTER TABLE IF EXISTS "public"."contacts" add constraint "contacts_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."contacts" validate constraint "contacts_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."interaction_participants" add constraint "interaction_participants_activity_id_fkey" FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."interaction_participants" validate constraint "interaction_participants_activity_id_fkey";

ALTER TABLE IF EXISTS "public"."interaction_participants" add constraint "interaction_participants_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) not valid;

ALTER TABLE IF EXISTS "public"."interaction_participants" validate constraint "interaction_participants_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunities" add constraint "opportunities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."opportunities" validate constraint "opportunities_created_by_fkey";

ALTER TABLE IF EXISTS "public"."opportunities" add constraint "opportunities_sales_id_fkey" FOREIGN KEY (opportunity_owner_id) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."opportunities" validate constraint "opportunities_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunityNotes" add constraint "opportunityNotes_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."opportunityNotes" validate constraint "opportunityNotes_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunityNotes" add constraint "opportunityNotes_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."opportunityNotes" validate constraint "opportunityNotes_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."opportunity_participants" add constraint "opportunity_participants_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."opportunity_participants" validate constraint "opportunity_participants_created_by_fkey";

ALTER TABLE IF EXISTS "public"."opportunity_participants" add constraint "opportunity_participants_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."opportunity_participants" validate constraint "opportunity_participants_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."organizations" add constraint "organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."organizations" validate constraint "organizations_created_by_fkey";

ALTER TABLE IF EXISTS "public"."organizations" add constraint "organizations_parent_organization_id_fkey" FOREIGN KEY (parent_organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL not valid;

ALTER TABLE IF EXISTS "public"."organizations" validate constraint "organizations_parent_organization_id_fkey";

ALTER TABLE IF EXISTS "public"."organizations" add constraint "organizations_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."organizations" validate constraint "organizations_sales_id_fkey";

ALTER TABLE IF EXISTS "public"."product_category_hierarchy" add constraint "product_category_hierarchy_parent_category_id_fkey" FOREIGN KEY (parent_category_id) REFERENCES public.product_category_hierarchy(id) not valid;

ALTER TABLE IF EXISTS "public"."product_category_hierarchy" validate constraint "product_category_hierarchy_parent_category_id_fkey";

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" add constraint "product_distributor_authorizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" validate constraint "product_distributor_authorizations_created_by_fkey";

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" add constraint "product_distributor_authorizations_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."product_distributor_authorizations" validate constraint "product_distributor_authorizations_product_id_fkey";

ALTER TABLE IF EXISTS "public"."product_features" add constraint "product_features_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."product_features" validate constraint "product_features_product_id_fkey";

ALTER TABLE IF EXISTS "public"."product_inventory" add constraint "product_inventory_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."product_inventory" validate constraint "product_inventory_product_id_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_models" add constraint "product_pricing_models_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."product_pricing_models" validate constraint "product_pricing_models_created_by_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_models" add constraint "product_pricing_models_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."product_pricing_models" validate constraint "product_pricing_models_product_id_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" add constraint "product_pricing_tiers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" validate constraint "product_pricing_tiers_created_by_fkey";

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" add constraint "product_pricing_tiers_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."product_pricing_tiers" validate constraint "product_pricing_tiers_product_id_fkey";

ALTER TABLE IF EXISTS "public"."products" add constraint "products_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."products" validate constraint "products_created_by_fkey";

ALTER TABLE IF EXISTS "public"."products" add constraint "products_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."products" validate constraint "products_updated_by_fkey";

ALTER TABLE IF EXISTS "public"."sales" add constraint "sales_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."sales" validate constraint "sales_user_id_fkey";

ALTER TABLE IF EXISTS "public"."tasks" add constraint "tasks_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

ALTER TABLE IF EXISTS "public"."tasks" validate constraint "tasks_contact_id_fkey";

ALTER TABLE IF EXISTS "public"."tasks" add constraint "tasks_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) not valid;

ALTER TABLE IF EXISTS "public"."tasks" validate constraint "tasks_opportunity_id_fkey";

ALTER TABLE IF EXISTS "public"."tasks" add constraint "tasks_sales_id_fkey" FOREIGN KEY (sales_id) REFERENCES public.sales(id) not valid;

ALTER TABLE IF EXISTS "public"."tasks" validate constraint "tasks_sales_id_fkey";

set check_function_bodies = off;

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

CREATE OR REPLACE FUNCTION public.get_or_create_segment(p_name text)
 RETURNS SETOF public.segments
 LANGUAGE plpgsql
 SECURITY DEFINER
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
        coalesce(NEW.brand, '') || ' ' ||
        coalesce(NEW.description, '')
    );
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

CREATE OR REPLACE FUNCTION public.update_search_tsv()
 RETURNS trigger
 LANGUAGE plpgsql
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
            COALESCE(NEW.brand, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '') || ' ' ||
            COALESCE(NEW.subcategory, '') || ' ' ||
            COALESCE(array_to_string(NEW.certifications, ' '), '')
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


create or replace view "public"."organizations_summary" as  SELECT o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
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

CREATE OR REPLACE FUNCTION public.update_products_search()
 RETURNS trigger
 LANGUAGE plpgsql
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

create policy "authenticated_delete_activities"
on "public"."activities"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_activities"
on "public"."activities"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_activities"
on "public"."activities"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_activities"
on "public"."activities"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_contactNotes"
on "public"."contactNotes"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_contactNotes"
on "public"."contactNotes"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_contactNotes"
on "public"."contactNotes"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_contactNotes"
on "public"."contactNotes"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_contact_organizations"
on "public"."contact_organizations"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_contact_organizations"
on "public"."contact_organizations"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_contact_organizations"
on "public"."contact_organizations"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_contact_organizations"
on "public"."contact_organizations"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_contact_preferred_principals"
on "public"."contact_preferred_principals"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_contact_preferred_principals"
on "public"."contact_preferred_principals"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_contact_preferred_principals"
on "public"."contact_preferred_principals"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_contact_preferred_principals"
on "public"."contact_preferred_principals"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_contacts"
on "public"."contacts"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_contacts"
on "public"."contacts"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_contacts"
on "public"."contacts"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_contacts"
on "public"."contacts"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_interaction_participants"
on "public"."interaction_participants"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_interaction_participants"
on "public"."interaction_participants"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_interaction_participants"
on "public"."interaction_participants"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_interaction_participants"
on "public"."interaction_participants"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "Enable read for authenticated users on migration_history"
on "public"."migration_history"
as permissive
for select
to authenticated
using ((auth.role() = 'authenticated'::text));


create policy "authenticated_select_migration_history"
on "public"."migration_history"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_opportunities"
on "public"."opportunities"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_opportunities"
on "public"."opportunities"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_opportunities"
on "public"."opportunities"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_opportunities"
on "public"."opportunities"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_opportunityNotes"
on "public"."opportunityNotes"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_opportunityNotes"
on "public"."opportunityNotes"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_opportunityNotes"
on "public"."opportunityNotes"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_opportunityNotes"
on "public"."opportunityNotes"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_opportunity_participants"
on "public"."opportunity_participants"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_opportunity_participants"
on "public"."opportunity_participants"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_opportunity_participants"
on "public"."opportunity_participants"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_opportunity_participants"
on "public"."opportunity_participants"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_organizations"
on "public"."organizations"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_organizations"
on "public"."organizations"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_organizations"
on "public"."organizations"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_organizations"
on "public"."organizations"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_product_category_hierarchy"
on "public"."product_category_hierarchy"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_product_category_hierarchy"
on "public"."product_category_hierarchy"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_product_category_hierarchy"
on "public"."product_category_hierarchy"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_product_category_hierarchy"
on "public"."product_category_hierarchy"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_product_distributor_authorizations"
on "public"."product_distributor_authorizations"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_product_distributor_authorizations"
on "public"."product_distributor_authorizations"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_product_distributor_authorizations"
on "public"."product_distributor_authorizations"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_product_distributor_authorizations"
on "public"."product_distributor_authorizations"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_product_features"
on "public"."product_features"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_product_features"
on "public"."product_features"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_product_features"
on "public"."product_features"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_product_features"
on "public"."product_features"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_product_inventory"
on "public"."product_inventory"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_product_inventory"
on "public"."product_inventory"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_product_inventory"
on "public"."product_inventory"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_product_inventory"
on "public"."product_inventory"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_product_pricing_models"
on "public"."product_pricing_models"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_product_pricing_models"
on "public"."product_pricing_models"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_product_pricing_models"
on "public"."product_pricing_models"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_product_pricing_models"
on "public"."product_pricing_models"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_product_pricing_tiers"
on "public"."product_pricing_tiers"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_product_pricing_tiers"
on "public"."product_pricing_tiers"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_product_pricing_tiers"
on "public"."product_pricing_tiers"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_product_pricing_tiers"
on "public"."product_pricing_tiers"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_products"
on "public"."products"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_products"
on "public"."products"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_products"
on "public"."products"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_products"
on "public"."products"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_sales"
on "public"."sales"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_sales"
on "public"."sales"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_sales"
on "public"."sales"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_sales"
on "public"."sales"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "Allow authenticated read access"
on "public"."segments"
as permissive
for select
to authenticated
using (true);


create policy "Allow authenticated users to create"
on "public"."segments"
as permissive
for insert
to authenticated
with check (true);


create policy "authenticated_delete_tags"
on "public"."tags"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_tags"
on "public"."tags"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_tags"
on "public"."tags"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_tags"
on "public"."tags"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_delete_tasks"
on "public"."tasks"
as permissive
for delete
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_insert_tasks"
on "public"."tasks"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "authenticated_select_tasks"
on "public"."tasks"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "authenticated_update_tasks"
on "public"."tasks"
as permissive
for update
to authenticated
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


CREATE TRIGGER trigger_validate_activity_consistency BEFORE INSERT OR UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.validate_activity_consistency();

CREATE TRIGGER validate_principal_organization_trigger BEFORE INSERT OR UPDATE ON public.contact_preferred_principals FOR EACH ROW EXECUTE FUNCTION public.validate_principal_organization();

CREATE TRIGGER trigger_update_contacts_search_tsv BEFORE INSERT OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_search_tsv();

CREATE TRIGGER trigger_update_opportunities_search_tsv BEFORE INSERT OR UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_search_tsv();

CREATE TRIGGER trigger_validate_opportunity_participants BEFORE INSERT OR UPDATE ON public.opportunity_participants FOR EACH ROW EXECUTE FUNCTION public.validate_opportunity_participants();

CREATE TRIGGER trigger_update_organizations_search_tsv BEFORE INSERT OR UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_organizations_search_tsv();

CREATE TRIGGER trigger_validate_pricing_tiers BEFORE INSERT OR UPDATE ON public.product_pricing_tiers FOR EACH ROW EXECUTE FUNCTION public.validate_pricing_tiers();

CREATE TRIGGER products_search_update BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.products_search_trigger();

CREATE TRIGGER trigger_update_products_search_tsv BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_search_tsv();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();

DROP POLICY IF EXISTS "Authenticated users can delete attachments" on "storage"."objects";

DROP POLICY IF EXISTS "Authenticated users can update attachments" on "storage"."objects";

DROP POLICY IF EXISTS "Authenticated users can upload attachments" on "storage"."objects";

DROP POLICY IF EXISTS "Authenticated users can view attachments" on "storage"."objects";


  create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'attachments'::text));



  create policy "Allow public downloads"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'attachments'::text));



  create policy "Allow users to delete own files"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'attachments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Allow users to update own files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'attachments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


