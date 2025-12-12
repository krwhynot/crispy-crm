# RBAC State Verification Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S %Z')

## Overview

This report compares RBAC state between LOCAL and CLOUD Supabase databases.

**Environments:**
- **LOCAL:** `127.0.0.1:54322/postgres` (Docker)
- **CLOUD:** `aaqnanddcqvfiwhshndl.supabase.co` (Supabase Cloud)

---

## 1. Migration History (20251211+)

**Status:** ❌

### LOCAL

```
20251211060000|add_get_sale_by_id_function
20251211080000|add_authorization_to_security_definer_functions
20251211120000|fix_sales_rls_self_update
20251211130000|harden_security_definer_functions
20251211140000|enforce_column_level_updates
20251211160000|fix_trigger_null_auth
20251211170000|allow_admin_full_edit
20251211180000|fix_is_admin_null_auth
```

### CLOUD

```
20251211060000|add_get_sale_by_id_function
20251211080000|add_authorization_to_security_definer_functions
20251211120000|fix_sales_rls_self_update
20251211130000|harden_security_definer_functions
20251211140000|enforce_column_level_updates
20251211160000|fix_trigger_null_auth
20251211170000|allow_admin_full_edit
20251212020132|add_deleted_at_to_admin_update_sale
```

---

## 2. Sales Table Schema

**Status:** ❌

### LOCAL

```
id|bigint|NO|nextval('sales_id_seq'::regclass)
user_id|uuid|YES|
created_at|timestamp with time zone|YES|now()
updated_at|timestamp with time zone|YES|now()
first_name|text|YES|
last_name|text|YES|
email|text|YES|
phone|text|YES|
avatar_url|text|YES|
is_admin|boolean|YES|false
deleted_at|timestamp with time zone|YES|
disabled|boolean|YES|false
role|USER-DEFINED|NO|'rep'::user_role
administrator|boolean|YES|
timezone|text|YES|'America/Chicago'::text
```

### CLOUD

```
id|bigint|NO|nextval('sales_id_seq'::regclass)
user_id|uuid|YES|
created_at|timestamp with time zone|YES|now()
updated_at|timestamp with time zone|YES|now()
first_name|text|YES|
last_name|text|YES|
email|text|YES|
phone|text|YES|
avatar_url|text|YES|
is_admin|boolean|YES|false
deleted_at|timestamp with time zone|YES|
disabled|boolean|YES|false
role|USER-DEFINED|NO|'rep'::user_role
administrator|boolean|YES|
digest_opt_in|boolean|NO|true
timezone|text|YES|'America/Chicago'::text
```

---

## 3. RLS Policies on sales Table

**Status:** ❌

### LOCAL

```
delete_sales|PERMISSIVE|{authenticated}|DELETE|is_admin()|
insert_sales|PERMISSIVE|{authenticated}|INSERT||is_admin()
select_sales|PERMISSIVE|{authenticated}|SELECT|(deleted_at IS NULL)|
update_sales|PERMISSIVE|{public}|UPDATE|(is_admin() OR (user_id = auth.uid()))|(is_admin() OR (user_id = auth.uid()))
```

### CLOUD

```
delete_sales|PERMISSIVE|{authenticated}|DELETE|is_admin()|
insert_sales|PERMISSIVE|{authenticated}|INSERT||is_admin()
select_sales|PERMISSIVE|{authenticated}|SELECT|(deleted_at IS NULL)|
service_role_full_access|PERMISSIVE|{service_role}|ALL|true|true
update_sales|PERMISSIVE|{public}|UPDATE|(is_admin() OR (user_id = auth.uid()))|(is_admin() OR (user_id = auth.uid()))
```

---

## 4. is_admin() Function Definition

**Status:** ❌

### LOCAL

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN TRUE  -- Grant admin when auth.uid() is NULL
      ELSE COALESCE(
        (SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$function$
```

### CLOUD

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT 
    CASE 
      WHEN auth.uid() IS NULL THEN TRUE  -- Grant admin when auth.uid() is NULL
      ELSE COALESCE(
        (SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$function$
```

---

