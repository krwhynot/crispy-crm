# Supabase config.toml Reference

Complete guide to `supabase/config.toml` configuration.

## Table of Contents

- [File Location](#file-location)
- [Project Settings](#project-settings)
- [API Settings](#api-settings)
- [Database Settings](#database-settings)
- [Studio Settings](#studio-settings)
- [Auth Settings](#auth-settings)
- [Storage Settings](#storage-settings)
- [Edge Functions](#edge-functions)
- [Environment Variables](#environment-variables)

---

## File Location

**Path:** `supabase/config.toml`

Created by `supabase init`. Project-specific configuration for local development.

---

## Project Settings

```toml
[project]
id = "crispy-crm"  # Local project identifier
```

---

## API Settings

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000
```

| Setting | Default | Description |
|---------|---------|-------------|
| `port` | 54321 | PostgREST API port |
| `schemas` | ["public", "graphql_public"] | Exposed schemas |
| `max_rows` | 1000 | Max rows per request |

---

## Database Settings

```toml
[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
default_pool_size = 20
max_client_conn = 100
```

| Setting | Default | Description |
|---------|---------|-------------|
| `port` | 54322 | PostgreSQL port |
| `shadow_port` | 54320 | Shadow DB for migrations |
| `major_version` | 15 | PostgreSQL version |

### Connection String

```
postgresql://postgres:postgres@localhost:54322/postgres
```

---

## Studio Settings

```toml
[studio]
enabled = true
port = 54323
api_url = "http://localhost"
openai_api_key = "env(OPENAI_API_KEY)"
```

| Setting | Default | Description |
|---------|---------|-------------|
| `port` | 54323 | Studio dashboard port |
| `openai_api_key` | - | For AI features in Studio |

**URL:** `http://localhost:54323`

---

## Auth Settings

### Basic Auth

```toml
[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
enable_anonymous_sign_ins = false
```

### Email Settings

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
secure_password_change = false
max_frequency = "1s"
```

### External OAuth Providers

```toml
[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_GITHUB_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"

[auth.external.google]
enabled = false
client_id = ""
secret = ""
redirect_uri = ""

[auth.external.apple]
enabled = false
client_id = ""
secret = ""
redirect_uri = ""
```

### Available Providers

- `github`, `google`, `apple`, `azure`
- `bitbucket`, `discord`, `facebook`
- `gitlab`, `kakao`, `keycloak`
- `linkedin_oidc`, `notion`, `slack_oidc`
- `spotify`, `twitch`, `twitter`, `workos`, `zoom`

---

## Storage Settings

```toml
[storage]
enabled = true
file_size_limit = "50MiB"
```

### Bucket Configuration

```toml
[storage.buckets.avatars]
public = false
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/gif"]
objects_path = "./seed/avatars"

[storage.buckets.public-files]
public = true
file_size_limit = "10MiB"
```

| Setting | Description |
|---------|-------------|
| `public` | Allow public access |
| `file_size_limit` | Max file size |
| `allowed_mime_types` | Restrict file types |
| `objects_path` | Seed with local files |

**Seed buckets:** `supabase seed buckets`

---

## Edge Functions

```toml
[functions.my-function]
verify_jwt = true
import_map = "./supabase/functions/import_map.json"
```

| Setting | Default | Description |
|---------|---------|-------------|
| `verify_jwt` | true | Require JWT auth |
| `import_map` | - | Deno import map |

---

## Environment Variables

Use `env()` to reference environment variables:

```toml
[auth.external.github]
client_id = "env(SUPABASE_AUTH_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_GITHUB_SECRET)"
```

### .env File

Create `.env` in project root:

```bash
SUPABASE_AUTH_GITHUB_CLIENT_ID=your_client_id
SUPABASE_AUTH_GITHUB_SECRET=your_secret
OPENAI_API_KEY=sk-...
```

**Note:** Restart `supabase start` after changing env vars.

---

## Inbucket (Local Email)

```toml
[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326
```

**URL:** `http://localhost:54324` (view sent emails)

---

## Realtime

```toml
[realtime]
enabled = true
ip_version = 4
max_header_length = 4096
```

---

## Analytics

```toml
[analytics]
enabled = false
port = 54327
vector_port = 54328
```

---

## Complete Example

```toml
[project]
id = "crispy-crm"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
enable_confirmations = false

[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_SECRET)"

[storage]
enabled = true

[storage.buckets.avatars]
public = false
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg"]

[inbucket]
enabled = true
port = 54324

[realtime]
enabled = true
```

---

**Line Count:** ~230
