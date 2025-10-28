SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict NcN4hID9nVCadce2vdrJMm5f1feVJIvZR6HjLoJIKsVwpU6wybbFid6NVmDEKUB

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '39511163-73ca-4e7f-aa76-23eeff2129fc', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"test@gmail.com","user_id":"7fff257e-3746-44b0-a0ef-0e85630638f0","user_phone":""}}', '2025-10-17 02:24:25.600607+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f10cd5f9-fef9-4915-8ab4-91ebc65b2443', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"account@gmail.com","user_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","user_phone":""}}', '2025-10-17 02:25:17.814072+00', ''),
	('00000000-0000-0000-0000-000000000000', '5fe04581-eebb-4853-b03c-9ccee9e2a0d7', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-17 02:25:20.879739+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd59173ba-4499-4a58-ad71-f4d57e9b4211', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 03:23:44.965298+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ea5c41bd-511f-4560-860f-a5fa072663de', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 03:23:44.966282+00', ''),
	('00000000-0000-0000-0000-000000000000', '33498e13-93bf-4e9c-b740-7dc4abe6efd8', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-17 20:11:32.698904+00', ''),
	('00000000-0000-0000-0000-000000000000', '16f262c7-0172-4d42-89e4-8f67493b2145', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 21:26:39.403147+00', ''),
	('00000000-0000-0000-0000-000000000000', '72e9447d-311d-4b19-ba39-b88475bc3531', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 21:26:39.409765+00', ''),
	('00000000-0000-0000-0000-000000000000', '651a5212-c92b-4532-9d26-52cd1ba68080', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 21:41:05.530874+00', ''),
	('00000000-0000-0000-0000-000000000000', '46c0d732-1c71-42f0-ad93-8cc065062602', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 21:41:05.532289+00', ''),
	('00000000-0000-0000-0000-000000000000', '299253c9-28c2-47f6-9e04-e3e518aa3b05', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 22:37:31.378668+00', ''),
	('00000000-0000-0000-0000-000000000000', '4cc5daf1-b6ff-4fc4-aac4-11d16650578b', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 22:37:31.380612+00', ''),
	('00000000-0000-0000-0000-000000000000', '1a88874a-f912-47e6-8ee4-5c88153229d7', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 23:37:08.72775+00', ''),
	('00000000-0000-0000-0000-000000000000', '3246d568-688d-4d14-94be-0ab572cfa0e7', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-17 23:37:08.728899+00', ''),
	('00000000-0000-0000-0000-000000000000', '3482ce69-d729-43df-80f0-d24cf32f42ec', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 00:36:58.864871+00', ''),
	('00000000-0000-0000-0000-000000000000', '127642ac-fdb8-4286-a651-efd76f0eca8e', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 00:36:58.86806+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f876dd99-a473-49f5-87aa-fbbd63cd50e4', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 01:38:30.607095+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a9971d12-596b-430f-a057-cc20940511cc', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 01:38:30.609043+00', ''),
	('00000000-0000-0000-0000-000000000000', '955a7ad5-f1c6-4a4b-b8fa-5cdfd77ea689', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 14:09:19.227269+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bcb5d087-5921-4b64-aeff-d69474478e7a', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 14:09:19.246947+00', ''),
	('00000000-0000-0000-0000-000000000000', '9087b9c0-47e3-4dbd-a87e-c913b6465ddc', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 15:07:27.559752+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e378458-909c-45be-8fa8-e0a53cad8ab7', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 15:07:27.560824+00', ''),
	('00000000-0000-0000-0000-000000000000', '87bef394-0f21-47b8-9d96-94a76132b680', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-18 16:03:25.984988+00', ''),
	('00000000-0000-0000-0000-000000000000', '532e713a-43ee-4d35-a9a3-72fc1aa17e84', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 16:05:57.546483+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c996552d-2c4e-4ff4-97e7-5348bb17bfb8', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 16:05:57.547761+00', ''),
	('00000000-0000-0000-0000-000000000000', '742b5cd4-8ca2-4275-a1de-0d10151a1438', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 17:03:57.562464+00', ''),
	('00000000-0000-0000-0000-000000000000', '5f9f24e3-28e2-4665-a5a5-71d99cebcb58', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 17:03:57.564092+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ea1dd9ff-5cec-40ed-8ad5-71dafc0ca8ec', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 18:08:03.758116+00', ''),
	('00000000-0000-0000-0000-000000000000', '2f7f99f4-872a-4c66-9c59-22708e2c847b', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 18:08:03.760164+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f6c5c929-8da4-404b-87ab-6a909bc84df7', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 18:08:49.032042+00', ''),
	('00000000-0000-0000-0000-000000000000', '0c7305e2-0394-4c36-aafe-25dcf61be9c8', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-18 18:08:49.032677+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a2896eb1-94d3-48ba-8d1b-a37289fb7102', '{"action":"logout","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-10-18 18:08:54.111193+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e821c5a8-ea82-4e27-a5d8-36d65e8e0ebb', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-18 18:08:55.61298+00', ''),
	('00000000-0000-0000-0000-000000000000', '2b74a27b-b54f-4e16-8962-cb6233725b94', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-18 18:13:28.788136+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d83f991-430d-4083-bcb6-3a36974c1485', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-18 19:16:43.50669+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ca47cad0-afdf-4f13-af4a-c199f99957b6', '{"action":"token_refreshed","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-19 22:47:39.799402+00', ''),
	('00000000-0000-0000-0000-000000000000', '6b7f1bb3-d1f5-46a8-ae47-832af9ad24f8', '{"action":"token_revoked","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-19 22:47:39.805765+00', ''),
	('00000000-0000-0000-0000-000000000000', '7d0a1e31-a0f5-44be-a23d-4b584d0156d1', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-20 00:12:14.429372+00', ''),
	('00000000-0000-0000-0000-000000000000', '1d3b646d-e5c7-4e7b-9580-fb165156f9d5', '{"action":"logout","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-10-20 00:12:15.70854+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f52aba5a-c7c5-42f3-9f7f-5ee12b29b270', '{"action":"login","actor_id":"7fff257e-3746-44b0-a0ef-0e85630638f0","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-20 00:12:23.707293+00', ''),
	('00000000-0000-0000-0000-000000000000', '490f7948-f34f-4c32-919c-196867e1387e', '{"action":"logout","actor_id":"7fff257e-3746-44b0-a0ef-0e85630638f0","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-10-20 00:12:24.146975+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f2b5846d-67ba-46d7-88c7-d7b5774345dc', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-20 00:12:35.479738+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b1e72681-fc08-47d2-8e70-ba93d5b7c79f', '{"action":"logout","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-10-20 00:12:35.971357+00', ''),
	('00000000-0000-0000-0000-000000000000', '55db87c0-5e94-4b43-9997-a1914968ad84', '{"action":"login","actor_id":"7fff257e-3746-44b0-a0ef-0e85630638f0","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-20 00:47:20.397611+00', ''),
	('00000000-0000-0000-0000-000000000000', '4902f222-1eae-434f-b5a5-cd74fa12afc3', '{"action":"token_refreshed","actor_id":"7fff257e-3746-44b0-a0ef-0e85630638f0","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-20 16:34:04.107501+00', ''),
	('00000000-0000-0000-0000-000000000000', '9659b0ca-93f1-49b8-bfef-1549ec3ca13b', '{"action":"token_revoked","actor_id":"7fff257e-3746-44b0-a0ef-0e85630638f0","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-20 16:34:04.113035+00', ''),
	('00000000-0000-0000-0000-000000000000', '3647b013-78f9-41be-8de5-f23d1021180d', '{"action":"token_refreshed","actor_id":"7fff257e-3746-44b0-a0ef-0e85630638f0","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-20 22:11:28.023908+00', ''),
	('00000000-0000-0000-0000-000000000000', '603bb69b-adc4-47bd-8b18-cab59bcc0b5e', '{"action":"token_revoked","actor_id":"7fff257e-3746-44b0-a0ef-0e85630638f0","actor_username":"test@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-10-20 22:11:28.032662+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f8b35418-57d4-455b-b063-b8b7aac203c7', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-20 22:39:00.041652+00', ''),
	('00000000-0000-0000-0000-000000000000', '325724e8-95f5-4fc1-965e-387a13e9b713', '{"action":"logout","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-10-20 22:46:38.978739+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f4244418-54a7-43d1-8b08-29d4ee54c03a', '{"action":"login","actor_id":"c6cec768-af74-47ab-b0a2-3b1f72953b06","actor_username":"account@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-20 22:46:48.103254+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'd3129876-b1fe-40eb-9980-64f5f73c64d6', 'authenticated', 'authenticated', 'admin@test.com', '$2a$06$Gw6IszT.dvjPpCJ0kEeb6eRl.yzTpkQbV0qN4FYWzXLgfYTApq.4W', '2025-10-18 20:24:42.606581+00', NULL, '', NULL, '', NULL, NULL, NULL, NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"last_name": "User", "first_name": "Admin"}', NULL, '2025-10-18 20:24:42.606581+00', '2025-10-18 20:24:42.606581+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '7fff257e-3746-44b0-a0ef-0e85630638f0', 'authenticated', 'authenticated', 'test@gmail.com', '$2a$10$zMzor3J07HIT7dyUvvprDOhTjn4wC.jmBpkIoMyfflhw8k3FMm1sO', '2025-10-17 02:24:25.607646+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-10-20 00:47:20.398651+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-10-17 02:24:25.582899+00', '2025-10-20 22:11:28.050065+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c6cec768-af74-47ab-b0a2-3b1f72953b06', 'authenticated', 'authenticated', 'account@gmail.com', '$2a$10$HcmY8K4aIBr0o7RKtvLOkuBGBThavazslCv5hiQVFgVSM.Eit3wde', '2025-10-17 02:25:17.815767+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-10-20 22:46:48.104376+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-10-17 02:25:17.81187+00', '2025-10-20 22:46:48.107112+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('7fff257e-3746-44b0-a0ef-0e85630638f0', '7fff257e-3746-44b0-a0ef-0e85630638f0', '{"sub": "7fff257e-3746-44b0-a0ef-0e85630638f0", "email": "test@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-10-17 02:24:25.596478+00', '2025-10-17 02:24:25.596547+00', '2025-10-17 02:24:25.596547+00', 'd6d7ce9d-8856-4104-8a4e-76176d22d919'),
	('c6cec768-af74-47ab-b0a2-3b1f72953b06', 'c6cec768-af74-47ab-b0a2-3b1f72953b06', '{"sub": "c6cec768-af74-47ab-b0a2-3b1f72953b06", "email": "account@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-10-17 02:25:17.813263+00', '2025-10-17 02:25:17.813312+00', '2025-10-17 02:25:17.813312+00', 'd4940759-cdd9-4c0e-8016-3fa9cc7f9e19');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('764e188e-a96d-4d1f-a947-fad58113c2a2', '7fff257e-3746-44b0-a0ef-0e85630638f0', '2025-10-20 00:47:20.398732+00', '2025-10-20 22:11:28.064941+00', NULL, 'aal1', NULL, '2025-10-20 22:11:28.064858', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '172.56.24.237', NULL),
	('bf6c46bc-b008-4136-801b-ae55768fa5df', 'c6cec768-af74-47ab-b0a2-3b1f72953b06', '2025-10-20 22:46:48.104461+00', '2025-10-20 22:46:48.104461+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '172.56.24.51', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('764e188e-a96d-4d1f-a947-fad58113c2a2', '2025-10-20 00:47:20.409759+00', '2025-10-20 00:47:20.409759+00', 'password', '8e1b67ed-2891-4c39-a879-79e556133c9e'),
	('bf6c46bc-b008-4136-801b-ae55768fa5df', '2025-10-20 22:46:48.108782+00', '2025-10-20 22:46:48.108782+00', 'password', 'c66fde49-4942-4695-804e-8b301b6c21dc');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 859, '7ertpm2hzwzq', '7fff257e-3746-44b0-a0ef-0e85630638f0', true, '2025-10-20 00:47:20.40141+00', '2025-10-20 16:34:04.115633+00', NULL, '764e188e-a96d-4d1f-a947-fad58113c2a2'),
	('00000000-0000-0000-0000-000000000000', 860, 'jub7d6fq7yye', '7fff257e-3746-44b0-a0ef-0e85630638f0', true, '2025-10-20 16:34:04.123369+00', '2025-10-20 22:11:28.037507+00', '7ertpm2hzwzq', '764e188e-a96d-4d1f-a947-fad58113c2a2'),
	('00000000-0000-0000-0000-000000000000', 861, 'k44nck7teab5', '7fff257e-3746-44b0-a0ef-0e85630638f0', false, '2025-10-20 22:11:28.042448+00', '2025-10-20 22:11:28.042448+00', 'jub7d6fq7yye', '764e188e-a96d-4d1f-a947-fad58113c2a2'),
	('00000000-0000-0000-0000-000000000000', 863, 'h7p2knngtkvu', 'c6cec768-af74-47ab-b0a2-3b1f72953b06', false, '2025-10-20 22:46:48.106044+00', '2025-10-20 22:46:48.106044+00', NULL, 'bf6c46bc-b008-4136-801b-ae55768fa5df');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sales" ("id", "user_id", "created_at", "updated_at", "first_name", "last_name", "email", "phone", "avatar_url", "is_admin", "deleted_at", "disabled") VALUES
	(3, 'd3129876-b1fe-40eb-9980-64f5f73c64d6', '2025-10-18 20:24:42.606581+00', '2025-10-18 20:24:42.606581+00', NULL, NULL, 'admin@test.com', NULL, NULL, false, NULL, false),
	(1, '7fff257e-3746-44b0-a0ef-0e85630638f0', '2025-10-17 02:24:25.582559+00', '2025-10-20 22:11:28.010638+00', NULL, NULL, 'test@gmail.com', NULL, NULL, false, NULL, false),
	(2, 'c6cec768-af74-47ab-b0a2-3b1f72953b06', '2025-10-17 02:25:17.81153+00', '2025-10-20 22:46:48.103023+00', 'Admin', 'User', 'account@gmail.com', NULL, NULL, true, NULL, false);


--
-- Data for Name: segments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contactNotes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contact_organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: contact_preferred_principals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: interaction_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: migration_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunityNotes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: opportunity_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_category_hierarchy; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_distributor_authorizations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_features; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_pricing_models; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_pricing_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: test_user_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('attachments', 'attachments', NULL, '2025-09-23 14:56:04.92132+00', '2025-09-23 14:56:04.92132+00', true, false, 52428800, '{image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-zip-compressed}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('a44f7a71-f860-4d83-86ed-1b0e2e0387d9', 'attachments', '0.12390509635402769.csv', '33af57a8-f5eb-40ec-9f77-e938c9e70cac', '2025-09-30 17:51:56.711726+00', '2025-09-30 17:51:56.711726+00', '2025-09-30 17:51:56.711726+00', '{"eTag": "\"4309e4f103fcc29315a433adf6882007\"", "size": 14623, "mimetype": "text/csv", "cacheControl": "max-age=3600", "lastModified": "2025-09-30T17:51:57.000Z", "contentLength": 14623, "httpStatusCode": 200}', '2c95aad3-7d5f-41d4-813d-a55f6cd9e65f', '33af57a8-f5eb-40ec-9f77-e938c9e70cac', '{}', 1),
	('eb35803b-49e9-4642-be04-4b15499e4bb1', 'attachments', '0.4882013490470488.csv', '33af57a8-f5eb-40ec-9f77-e938c9e70cac', '2025-09-30 17:52:06.988223+00', '2025-09-30 17:52:06.988223+00', '2025-09-30 17:52:06.988223+00', '{"eTag": "\"4309e4f103fcc29315a433adf6882007\"", "size": 14623, "mimetype": "text/csv", "cacheControl": "max-age=3600", "lastModified": "2025-09-30T17:52:07.000Z", "contentLength": 14623, "httpStatusCode": 200}', '3ddf5137-460b-4c1f-a840-88b9b9a5e5ba', '33af57a8-f5eb-40ec-9f77-e938c9e70cac', '{}', 1);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 863, true);


--
-- Name: activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."activities_id_seq"', 1, false);


--
-- Name: contactNotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."contactNotes_id_seq"', 1, false);


--
-- Name: contact_organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."contact_organizations_id_seq"', 1, false);


--
-- Name: contact_preferred_principals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."contact_preferred_principals_id_seq"', 1, false);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."contacts_id_seq"', 10, true);


--
-- Name: interaction_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."interaction_participants_id_seq"', 1, false);


--
-- Name: migration_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."migration_history_id_seq"', 1, false);


--
-- Name: opportunities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."opportunities_id_seq"', 10, true);


--
-- Name: opportunityNotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."opportunityNotes_id_seq"', 1, false);


--
-- Name: opportunity_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."opportunity_participants_id_seq"', 1, false);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."organizations_id_seq"', 11, true);


--
-- Name: product_category_hierarchy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."product_category_hierarchy_id_seq"', 1, false);


--
-- Name: product_distributor_authorizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."product_distributor_authorizations_id_seq"', 1, false);


--
-- Name: product_features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."product_features_id_seq"', 1, false);


--
-- Name: product_pricing_models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."product_pricing_models_id_seq"', 1, false);


--
-- Name: product_pricing_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."product_pricing_tiers_id_seq"', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."products_id_seq"', 17, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."sales_id_seq"', 3, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."tags_id_seq"', 1, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."tasks_id_seq"', 1, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict NcN4hID9nVCadce2vdrJMm5f1feVJIvZR6HjLoJIKsVwpU6wybbFid6NVmDEKUB

RESET ALL;
