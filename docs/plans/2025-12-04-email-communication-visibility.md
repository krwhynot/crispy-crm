# Implementation Plan: Email & Communication Visibility

**Created:** 2025-12-04
**Type:** Integration (Microsoft 365 Email Sync)
**Scope:** Full Stack (Frontend, Backend, Database)
**Execution:** Hybrid (parallel where independent, sequential for dependencies)

---

## Overview

This plan implements email visibility in Crispy CRM through Microsoft 365 Graph API integration, enhanced activity timeline with Principal filtering, call logging with task prompts, and a Principal Communications Dashboard.

### Feature Components

| Component | Description |
|-----------|-------------|
| **Microsoft 365 Email Sync** | OAuth + Graph API integration to import emails |
| **Enhanced Activity Timeline** | Email display with Principal filtering |
| **Call Logging + Task Prompt** | Activity creation with follow-up task option |
| **Principal Communications Dashboard** | Weekly reporting + pipeline context |

### Design Decisions (from Brainstorming)

- **Email Entry:** Full Microsoft 365 sync via Graph API (not manual/BCC)
- **Sync Scope:** Import emails where To/From matches Contact emails in CRM
- **Storage:** Full content (subject, body), attachment references only (no storage)
- **Display:** Activity Timeline on Contact/Opportunity
- **Phone Calls:** Log Activity → Prompt "Add follow-up task?"
- **Principal Filtering:** Filter on Activity views + dedicated Principal Dashboard
- **Dashboard Purpose:** Weekly reporting & Pipeline context

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Microsoft 365 Graph API                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Edge Function: email-sync-poll                      │
│  (Scheduled every 5 min, fetches new emails per user)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Database Tables                              │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ email_connections │  │ synced_emails    │                     │
│  │ (OAuth tokens)    │  │ (email content)  │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   unifiedDataProvider                            │
│  (Single entry point for all data access)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ Activity Timeline │ │ Call + Task Flow │ │ Principal Dashboard  │
│ (with email sync) │ │ (with prompt)    │ │ (with reporting)     │
└──────────────────┘ └──────────────────┘ └──────────────────────┘
```

---

## Database Schema

### New Tables

#### 1. `email_connections` - OAuth Token Storage
```sql
CREATE TABLE "public"."email_connections" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "sales_id" bigint NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    "provider" text NOT NULL DEFAULT 'microsoft',  -- 'microsoft' | 'google'
    "access_token" text NOT NULL,
    "refresh_token" text NOT NULL,
    "token_expires_at" timestamptz NOT NULL,
    "email_address" text NOT NULL,
    "last_sync_at" timestamptz,
    "sync_enabled" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "deleted_at" timestamptz DEFAULT NULL,
    CONSTRAINT email_connections_sales_unique UNIQUE (sales_id, provider)
);
```

#### 2. `synced_emails` - Email Content Storage
```sql
CREATE TABLE "public"."synced_emails" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "email_connection_id" bigint NOT NULL REFERENCES email_connections(id) ON DELETE CASCADE,
    "message_id" text NOT NULL,  -- Microsoft Graph message ID (for deduplication)
    "thread_id" text,            -- Conversation thread ID
    "subject" text NOT NULL,
    "body_preview" text,         -- First 255 chars
    "body_html" text,            -- Full HTML body
    "sender_email" text NOT NULL,
    "sender_name" text,
    "recipient_emails" text[] NOT NULL,
    "cc_emails" text[],
    "received_at" timestamptz NOT NULL,
    "is_read" boolean DEFAULT false,
    "has_attachments" boolean DEFAULT false,
    "attachment_names" text[],   -- Just names, not content
    "importance" text DEFAULT 'normal',  -- 'low' | 'normal' | 'high'
    "direction" text NOT NULL,   -- 'inbound' | 'outbound'
    "contact_id" bigint REFERENCES contacts(id) ON DELETE SET NULL,
    "organization_id" bigint REFERENCES organizations(id) ON DELETE SET NULL,
    "opportunity_id" bigint REFERENCES opportunities(id) ON DELETE SET NULL,
    "principal_id" bigint REFERENCES organizations(id) ON DELETE SET NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "deleted_at" timestamptz DEFAULT NULL,
    CONSTRAINT synced_emails_message_unique UNIQUE (email_connection_id, message_id)
);
```

### Indexes
```sql
CREATE INDEX idx_synced_emails_contact ON synced_emails(contact_id);
CREATE INDEX idx_synced_emails_organization ON synced_emails(organization_id);
CREATE INDEX idx_synced_emails_opportunity ON synced_emails(opportunity_id);
CREATE INDEX idx_synced_emails_principal ON synced_emails(principal_id);
CREATE INDEX idx_synced_emails_received ON synced_emails(received_at DESC);
CREATE INDEX idx_synced_emails_sender ON synced_emails(sender_email);
CREATE INDEX idx_email_connections_sales ON email_connections(sales_id);
```

---

## Execution Stages

### Stage 1: Database Foundation (Sequential)
Dependencies: None

### Stage 2: Backend Infrastructure (Parallel after Stage 1)
- OAuth setup
- Edge Function
- Data Provider extension

### Stage 3: Core UI Components (Parallel after Stage 2)
- Email connection UI
- Activity Timeline enhancement
- Call + Task flow

### Stage 4: Principal Dashboard (Sequential after Stage 3)
Dependencies: Requires activity enhancements

### Stage 5: Testing & Polish (Sequential)
Dependencies: All features complete

---

## Task Breakdown

### Stage 1: Database Foundation

#### Task 1.1: Create email_connections migration
**File:** `supabase/migrations/[timestamp]_create_email_connections.sql`
**Time:** 2-5 min
**Dependencies:** None

```sql
-- Migration: Create email_connections table for OAuth token storage
CREATE TABLE "public"."email_connections" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "sales_id" bigint NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    "provider" text NOT NULL DEFAULT 'microsoft',
    "access_token" text NOT NULL,
    "refresh_token" text NOT NULL,
    "token_expires_at" timestamptz NOT NULL,
    "email_address" text NOT NULL,
    "last_sync_at" timestamptz,
    "sync_enabled" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "deleted_at" timestamptz DEFAULT NULL,
    CONSTRAINT email_connections_sales_unique UNIQUE (sales_id, provider)
);

-- RLS Policies
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own connections
CREATE POLICY email_connections_select ON email_connections
    FOR SELECT TO authenticated
    USING (sales_id = public.current_sales_id() OR public.is_admin());

CREATE POLICY email_connections_insert ON email_connections
    FOR INSERT TO authenticated
    WITH CHECK (sales_id = public.current_sales_id());

CREATE POLICY email_connections_update ON email_connections
    FOR UPDATE TO authenticated
    USING (sales_id = public.current_sales_id())
    WITH CHECK (sales_id = public.current_sales_id());

CREATE POLICY email_connections_delete ON email_connections
    FOR DELETE TO authenticated
    USING (sales_id = public.current_sales_id() OR public.is_admin());

-- Index
CREATE INDEX idx_email_connections_sales ON email_connections(sales_id);

-- Trigger for updated_at
CREATE TRIGGER set_email_connections_updated_at
    BEFORE UPDATE ON email_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
```

**Verification:** Run `npx supabase db reset` and verify table exists

---

#### Task 1.2: Create synced_emails migration
**File:** `supabase/migrations/[timestamp]_create_synced_emails.sql`
**Time:** 2-5 min
**Dependencies:** Task 1.1

```sql
-- Migration: Create synced_emails table for email content storage
CREATE TABLE "public"."synced_emails" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "email_connection_id" bigint NOT NULL REFERENCES email_connections(id) ON DELETE CASCADE,
    "message_id" text NOT NULL,
    "thread_id" text,
    "subject" text NOT NULL,
    "body_preview" text,
    "body_html" text,
    "sender_email" text NOT NULL,
    "sender_name" text,
    "recipient_emails" text[] NOT NULL,
    "cc_emails" text[],
    "received_at" timestamptz NOT NULL,
    "is_read" boolean DEFAULT false,
    "has_attachments" boolean DEFAULT false,
    "attachment_names" text[],
    "importance" text DEFAULT 'normal',
    "direction" text NOT NULL,
    "contact_id" bigint REFERENCES contacts(id) ON DELETE SET NULL,
    "organization_id" bigint REFERENCES organizations(id) ON DELETE SET NULL,
    "opportunity_id" bigint REFERENCES opportunities(id) ON DELETE SET NULL,
    "principal_id" bigint REFERENCES organizations(id) ON DELETE SET NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "deleted_at" timestamptz DEFAULT NULL,
    CONSTRAINT synced_emails_message_unique UNIQUE (email_connection_id, message_id)
);

-- RLS Policies
ALTER TABLE synced_emails ENABLE ROW LEVEL SECURITY;

-- Users see emails from their connections OR if they're manager/admin
CREATE POLICY synced_emails_select ON synced_emails
    FOR SELECT TO authenticated
    USING (
        email_connection_id IN (
            SELECT id FROM email_connections
            WHERE sales_id = public.current_sales_id()
        )
        OR public.is_manager_or_admin()
    );

-- Only system (Edge Function) inserts emails
CREATE POLICY synced_emails_insert ON synced_emails
    FOR INSERT TO authenticated
    WITH CHECK (
        email_connection_id IN (
            SELECT id FROM email_connections
            WHERE sales_id = public.current_sales_id()
        )
    );

-- Users can update linking (contact_id, opportunity_id, etc.)
CREATE POLICY synced_emails_update ON synced_emails
    FOR UPDATE TO authenticated
    USING (
        email_connection_id IN (
            SELECT id FROM email_connections
            WHERE sales_id = public.current_sales_id()
        )
        OR public.is_manager_or_admin()
    );

-- Soft delete only
CREATE POLICY synced_emails_delete ON synced_emails
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- Indexes
CREATE INDEX idx_synced_emails_contact ON synced_emails(contact_id);
CREATE INDEX idx_synced_emails_organization ON synced_emails(organization_id);
CREATE INDEX idx_synced_emails_opportunity ON synced_emails(opportunity_id);
CREATE INDEX idx_synced_emails_principal ON synced_emails(principal_id);
CREATE INDEX idx_synced_emails_received ON synced_emails(received_at DESC);
CREATE INDEX idx_synced_emails_sender ON synced_emails(sender_email);
CREATE INDEX idx_synced_emails_connection ON synced_emails(email_connection_id);

-- Trigger for updated_at
CREATE TRIGGER set_synced_emails_updated_at
    BEFORE UPDATE ON synced_emails
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
```

**Verification:** Run `npx supabase db reset` and verify table exists with indexes

---

#### Task 1.3: Create contact_email_matching function
**File:** `supabase/migrations/[timestamp]_email_contact_matching_function.sql`
**Time:** 2-5 min
**Dependencies:** Task 1.2

```sql
-- Function to match email address to contact
CREATE OR REPLACE FUNCTION public.match_email_to_contact(
    p_email_address text
) RETURNS TABLE (
    contact_id bigint,
    organization_id bigint,
    match_type text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Search contacts where email JSONB array contains matching email
    RETURN QUERY
    SELECT
        c.id as contact_id,
        c.organization_id,
        'contact_email'::text as match_type
    FROM contacts c
    WHERE c.deleted_at IS NULL
      AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(c.email) AS e
          WHERE lower(e->>'email') = lower(p_email_address)
      )
    LIMIT 1;

    -- If no contact found, try organization email
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT
            NULL::bigint as contact_id,
            o.id as organization_id,
            'organization_email'::text as match_type
        FROM organizations o
        WHERE o.deleted_at IS NULL
          AND lower(o.email) = lower(p_email_address)
        LIMIT 1;
    END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.match_email_to_contact(text) TO authenticated;
```

**Verification:** Test with `SELECT * FROM match_email_to_contact('test@example.com');`

---

### Stage 2: Backend Infrastructure (Parallel)

#### Task 2.1: Create Zod validation schemas for email resources
**File:** `src/atomic-crm/validation/email-sync.ts`
**Time:** 2-5 min
**Dependencies:** Stage 1 complete

```typescript
import { z } from "zod";

// Email connection schema
export const emailConnectionSchema = z.strictObject({
  id: z.coerce.number().int().positive().optional(),
  sales_id: z.coerce.number().int().positive(),
  provider: z.enum(["microsoft", "google"]).default("microsoft"),
  access_token: z.string().min(1).max(4096),
  refresh_token: z.string().min(1).max(4096),
  token_expires_at: z.coerce.date(),
  email_address: z.string().email().max(254),
  last_sync_at: z.coerce.date().nullable().optional(),
  sync_enabled: z.coerce.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const emailConnectionCreateSchema = emailConnectionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export const emailConnectionUpdateSchema = emailConnectionSchema
  .partial()
  .required({ id: true });

// Synced email schema
export const syncedEmailSchema = z.strictObject({
  id: z.coerce.number().int().positive().optional(),
  email_connection_id: z.coerce.number().int().positive(),
  message_id: z.string().min(1).max(500),
  thread_id: z.string().max(500).nullable().optional(),
  subject: z.string().min(1).max(1000),
  body_preview: z.string().max(500).nullable().optional(),
  body_html: z.string().max(100000).nullable().optional(), // 100KB limit
  sender_email: z.string().email().max(254),
  sender_name: z.string().max(200).nullable().optional(),
  recipient_emails: z.array(z.string().email().max(254)),
  cc_emails: z.array(z.string().email().max(254)).nullable().optional(),
  received_at: z.coerce.date(),
  is_read: z.coerce.boolean().default(false),
  has_attachments: z.coerce.boolean().default(false),
  attachment_names: z.array(z.string().max(255)).nullable().optional(),
  importance: z.enum(["low", "normal", "high"]).default("normal"),
  direction: z.enum(["inbound", "outbound"]),
  contact_id: z.coerce.number().int().positive().nullable().optional(),
  organization_id: z.coerce.number().int().positive().nullable().optional(),
  opportunity_id: z.coerce.number().int().positive().nullable().optional(),
  principal_id: z.coerce.number().int().positive().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const syncedEmailCreateSchema = syncedEmailSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export const syncedEmailUpdateSchema = syncedEmailSchema
  .partial()
  .required({ id: true });

// Validation functions
export function validateEmailConnectionCreate(data: unknown) {
  return emailConnectionCreateSchema.parse(data);
}

export function validateEmailConnectionUpdate(data: unknown) {
  return emailConnectionUpdateSchema.parse(data);
}

export function validateSyncedEmailCreate(data: unknown) {
  return syncedEmailCreateSchema.parse(data);
}

export function validateSyncedEmailUpdate(data: unknown) {
  return syncedEmailUpdateSchema.parse(data);
}

// Type exports
export type EmailConnection = z.infer<typeof emailConnectionSchema>;
export type SyncedEmail = z.infer<typeof syncedEmailSchema>;
```

**Constitution Checklist:**
- [x] `z.strictObject()` for mass assignment prevention
- [x] All strings have `.max()` limits
- [x] `z.coerce` for non-string inputs
- [x] `z.enum()` for constrained values

---

#### Task 2.2: Register email resources in ValidationService
**File:** `src/atomic-crm/providers/supabase/services/ValidationService.ts`
**Time:** 2-5 min
**Dependencies:** Task 2.1

**Add to validationRegistry:**
```typescript
import {
  validateEmailConnectionCreate,
  validateEmailConnectionUpdate,
  validateSyncedEmailCreate,
  validateSyncedEmailUpdate,
} from "../../../validation/email-sync";

// In validationRegistry object:
email_connections: {
  create: async (data: unknown) => validateEmailConnectionCreate(data),
  update: async (data: unknown) => validateEmailConnectionUpdate(data),
},
synced_emails: {
  create: async (data: unknown) => validateSyncedEmailCreate(data),
  update: async (data: unknown) => validateSyncedEmailUpdate(data),
},
```

**Add to ResourceTypeMap interface:**
```typescript
import type { EmailConnection, SyncedEmail } from "../../../validation/email-sync";

// In ResourceTypeMap:
email_connections: EmailConnection;
synced_emails: SyncedEmail;
```

**Verification:** TypeScript compiles without errors

---

#### Task 2.3: Add email resources to resources.ts
**File:** `src/atomic-crm/providers/supabase/resources.ts`
**Time:** 2-5 min
**Dependencies:** Task 2.1

**Add to RESOURCE_MAPPING:**
```typescript
email_connections: "email_connections",
synced_emails: "synced_emails",
```

**Add to SOFT_DELETE_RESOURCES:**
```typescript
"email_connections",
"synced_emails",
```

**Add to SEARCHABLE_RESOURCES:**
```typescript
synced_emails: ["subject", "body_preview", "sender_email", "sender_name"],
```

---

#### Task 2.4: Create Microsoft Graph OAuth Edge Function
**File:** `supabase/functions/email-oauth-callback/index.ts`
**Time:** 5-10 min
**Dependencies:** Stage 1 complete

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

const MICROSOFT_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
const REDIRECT_URI = Deno.env.get("EMAIL_OAUTH_REDIRECT_URI");

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

Deno.serve(async (req) => {
  try {
    // Parse URL parameters
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // Contains sales_id
    const error = url.searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      return new Response(
        JSON.stringify({ error: `OAuth error: ${error}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: "Missing code or state parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const salesId = parseInt(state, 10);
    if (isNaN(salesId)) {
      return new Response(
        JSON.stringify({ error: "Invalid state parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID!,
          client_secret: MICROSOFT_CLIENT_SECRET!,
          code,
          redirect_uri: REDIRECT_URI!,
          grant_type: "authorization_code",
          scope: "https://graph.microsoft.com/Mail.Read offline_access",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Token exchange failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const tokens: TokenResponse = await tokenResponse.json();

    // Get user's email address from Graph API
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to get user info" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await userResponse.json();
    const emailAddress = user.mail || user.userPrincipalName;

    // Store connection in database (upsert)
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: dbError } = await supabaseAdmin
      .from("email_connections")
      .upsert(
        {
          sales_id: salesId,
          provider: "microsoft",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          email_address: emailAddress,
          sync_enabled: true,
        },
        { onConflict: "sales_id,provider" }
      );

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to store connection" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Redirect back to CRM settings page
    const successUrl = `${Deno.env.get("APP_URL")}/settings/email?connected=true`;
    return Response.redirect(successUrl, 302);
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

---

#### Task 2.5: Create Email Sync Polling Edge Function
**File:** `supabase/functions/email-sync-poll/index.ts`
**Time:** 10-15 min
**Dependencies:** Tasks 2.4, 1.3

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

const MICROSOFT_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

interface EmailConnection {
  id: number;
  sales_id: number;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  email_address: string;
  last_sync_at: string | null;
}

interface GraphMessage {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body: { content: string; contentType: string };
  from: { emailAddress: { address: string; name: string } };
  toRecipients: Array<{ emailAddress: { address: string } }>;
  ccRecipients: Array<{ emailAddress: { address: string } }>;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  importance: string;
}

async function refreshTokenIfNeeded(
  connection: EmailConnection
): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  // Refresh if expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return connection.access_token;
  }

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID!,
        client_secret: MICROSOFT_CLIENT_SECRET!,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
        scope: "https://graph.microsoft.com/Mail.Read offline_access",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }

  const tokens = await response.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Update tokens in database
  await supabaseAdmin
    .from("email_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || connection.refresh_token,
      token_expires_at: newExpiresAt.toISOString(),
    })
    .eq("id", connection.id);

  return tokens.access_token;
}

async function fetchAndStoreEmails(connection: EmailConnection): Promise<number> {
  const accessToken = await refreshTokenIfNeeded(connection);

  // Build filter for emails since last sync (or last 24 hours)
  const sinceDate = connection.last_sync_at
    ? new Date(connection.last_sync_at)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const filter = `receivedDateTime ge ${sinceDate.toISOString()}`;

  // Fetch messages from Graph API
  const messagesResponse = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages?$filter=${encodeURIComponent(filter)}&$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime,isRead,hasAttachments,importance`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!messagesResponse.ok) {
    throw new Error(`Graph API error: ${await messagesResponse.text()}`);
  }

  const { value: messages }: { value: GraphMessage[] } = await messagesResponse.json();
  let storedCount = 0;

  for (const msg of messages) {
    // Determine direction
    const senderEmail = msg.from.emailAddress.address.toLowerCase();
    const isOutbound = senderEmail === connection.email_address.toLowerCase();
    const direction = isOutbound ? "outbound" : "inbound";

    // Match sender/recipient to contact
    const emailToMatch = isOutbound
      ? msg.toRecipients[0]?.emailAddress.address
      : senderEmail;

    const { data: matchResult } = await supabaseAdmin.rpc(
      "match_email_to_contact",
      { p_email_address: emailToMatch }
    );

    const contactId = matchResult?.[0]?.contact_id || null;
    const organizationId = matchResult?.[0]?.organization_id || null;

    // Skip if no contact/org match (per requirements: "Contact matches only")
    if (!contactId && !organizationId) {
      continue;
    }

    // Get principal_id from opportunity if contact has one
    let principalId = null;
    if (contactId) {
      const { data: opps } = await supabaseAdmin
        .from("opportunities")
        .select("principal_id")
        .or(`contact_id.eq.${contactId}`)
        .not("principal_id", "is", null)
        .limit(1);
      principalId = opps?.[0]?.principal_id || null;
    }

    // Upsert email (message_id is unique)
    const { error } = await supabaseAdmin.from("synced_emails").upsert(
      {
        email_connection_id: connection.id,
        message_id: msg.id,
        thread_id: msg.conversationId,
        subject: msg.subject,
        body_preview: msg.bodyPreview?.substring(0, 255),
        body_html: msg.body.content,
        sender_email: msg.from.emailAddress.address,
        sender_name: msg.from.emailAddress.name,
        recipient_emails: msg.toRecipients.map((r) => r.emailAddress.address),
        cc_emails: msg.ccRecipients?.map((r) => r.emailAddress.address) || [],
        received_at: msg.receivedDateTime,
        is_read: msg.isRead,
        has_attachments: msg.hasAttachments,
        importance: msg.importance.toLowerCase(),
        direction,
        contact_id: contactId,
        organization_id: organizationId,
        principal_id: principalId,
      },
      { onConflict: "email_connection_id,message_id" }
    );

    if (!error) {
      storedCount++;
    }
  }

  // Update last_sync_at
  await supabaseAdmin
    .from("email_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", connection.id);

  return storedCount;
}

Deno.serve(async (req) => {
  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== CRON_SECRET) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get all active email connections
    const { data: connections, error: connError } = await supabaseAdmin
      .from("email_connections")
      .select("*")
      .eq("sync_enabled", true)
      .is("deleted_at", null);

    if (connError) {
      throw connError;
    }

    const results = await Promise.allSettled(
      (connections || []).map(async (conn) => {
        try {
          const count = await fetchAndStoreEmails(conn as EmailConnection);
          return { connectionId: conn.id, emailsStored: count, success: true };
        } catch (error) {
          return {
            connectionId: conn.id,
            success: false,
            error: (error as Error).message,
          };
        }
      })
    );

    const summary = {
      success: true,
      connectionsProcessed: connections?.length || 0,
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { success: false, error: r.reason }
      ),
      executedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

---

#### Task 2.6: Setup pg_cron for email sync
**File:** `supabase/migrations/[timestamp]_setup_email_sync_cron.sql`
**Time:** 2-5 min
**Dependencies:** Task 2.5

```sql
-- Setup cron job for email sync (every 5 minutes)
SELECT cron.schedule(
    'email-sync-poll',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/email-sync-poll',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    $$
);
```

---

### Stage 3: Core UI Components (Parallel)

#### Task 3.1: Create EmailConnectionSettings component
**File:** `src/atomic-crm/settings/EmailConnectionSettings.tsx`
**Time:** 5-10 min
**Dependencies:** Stage 2 complete

```typescript
import { useGetIdentity, useDataProvider, useNotify } from "react-admin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, X, RefreshCw } from "lucide-react";

const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_EMAIL_OAUTH_REDIRECT_URI;

export function EmailConnectionSettings() {
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const salesId = identity?.id;

  // Fetch current connection status
  const { data: connection, isLoading } = useQuery({
    queryKey: ["email_connections", salesId],
    queryFn: async () => {
      const { data } = await dataProvider.getList("email_connections", {
        filter: { sales_id: salesId },
        pagination: { page: 1, perPage: 1 },
        sort: { field: "created_at", order: "DESC" },
      });
      return data[0] || null;
    },
    enabled: !!salesId,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (connection?.id) {
        await dataProvider.delete("email_connections", { id: connection.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_connections"] });
      notify("Email disconnected", { type: "success" });
    },
  });

  const handleConnect = () => {
    const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    authUrl.searchParams.set("client_id", MICROSOFT_CLIENT_ID);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("scope", "https://graph.microsoft.com/Mail.Read offline_access");
    authUrl.searchParams.set("state", String(salesId));
    authUrl.searchParams.set("prompt", "consent");

    window.location.href = authUrl.toString();
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Integration
        </CardTitle>
        <CardDescription>
          Connect your Microsoft 365 account to sync emails with contacts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connection ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="success" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {connection.email_address}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
            {connection.last_sync_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Last synced: {new Date(connection.last_sync_at).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <Button onClick={handleConnect} className="h-11 min-w-[180px]">
            <Mail className="h-4 w-4 mr-2" />
            Connect Microsoft 365
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

**Constitution Checklist:**
- [x] Touch target 44x44px (`h-11`)
- [x] Semantic colors only (no raw hex)
- [x] Uses data provider (not direct Supabase)

---

#### Task 3.2: Add synced emails to Activity Timeline
**File:** `src/atomic-crm/contacts/ActivitiesTab.tsx` (modify existing)
**Time:** 5-10 min
**Dependencies:** Stage 2 complete

**Add email fetch alongside activities:**
```typescript
// Add import
import { useQuery } from "@tanstack/react-query";

// Inside ActivitiesTab component, add:
const { data: syncedEmails = [] } = useQuery({
  queryKey: ["synced_emails", "contact", contactId],
  queryFn: async () => {
    const { data } = await dataProvider.getList("synced_emails", {
      filter: { contact_id: contactId },
      pagination: { page: 1, perPage: 50 },
      sort: { field: "received_at", order: "DESC" },
    });
    return data;
  },
  enabled: !!contactId,
});

// Merge activities and emails into unified timeline
const timelineItems = useMemo(() => {
  const activities = (activitiesData || []).map((a) => ({
    ...a,
    itemType: "activity" as const,
    sortDate: new Date(a.activity_date || a.created_at),
  }));

  const emails = (syncedEmails || []).map((e) => ({
    ...e,
    itemType: "email" as const,
    sortDate: new Date(e.received_at),
  }));

  return [...activities, ...emails].sort(
    (a, b) => b.sortDate.getTime() - a.sortDate.getTime()
  );
}, [activitiesData, syncedEmails]);
```

**Add email rendering in timeline:**
```typescript
// In the timeline render section, add case for emails:
{timelineItems.map((item) => (
  item.itemType === "email" ? (
    <EmailTimelineItem key={`email-${item.id}`} email={item} />
  ) : (
    <ActivityTimelineItem key={`activity-${item.id}`} activity={item} />
  )
))}
```

---

#### Task 3.3: Create EmailTimelineItem component
**File:** `src/atomic-crm/activities/EmailTimelineItem.tsx`
**Time:** 5-10 min
**Dependencies:** Task 3.2

```typescript
import { Mail, ArrowDownLeft, ArrowUpRight, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { SyncedEmail } from "../validation/email-sync";

interface EmailTimelineItemProps {
  email: SyncedEmail & { sortDate: Date };
}

export function EmailTimelineItem({ email }: EmailTimelineItemProps) {
  const isInbound = email.direction === "inbound";
  const DirectionIcon = isInbound ? ArrowDownLeft : ArrowUpRight;

  return (
    <Card className="border-l-4 border-l-primary/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DirectionIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate">
                {isInbound ? email.sender_name || email.sender_email : "You"}
              </span>
              <Badge variant="outline" className="text-xs">
                {isInbound ? "Received" : "Sent"}
              </Badge>
              {email.has_attachments && (
                <Paperclip className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <p className="font-medium text-sm mb-1 truncate">{email.subject}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {email.body_preview}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(email.sortDate, { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

#### Task 3.4: Add Principal filter to Activity List
**File:** `src/atomic-crm/activities/ActivityListFilter.tsx` (modify existing)
**Time:** 5-10 min
**Dependencies:** None (can run parallel)

**Add principal filter:**
```typescript
// Add ReferenceInput for principal filtering
<ReferenceInput
  source="principal_id"
  reference="organizations"
  filter={{ type: "principal" }}
  sort={{ field: "name", order: "ASC" }}
>
  <AutocompleteInput
    label="Principal"
    optionText="name"
    className="min-w-[200px]"
    filterToQuery={(q) => ({ name: q })}
  />
</ReferenceInput>
```

**Update filter handling in ActivityList.tsx:**
```typescript
// In filterValues processing:
if (filters.principal_id) {
  // Filter activities that belong to opportunities with this principal
  // OR synced emails with this principal_id
}
```

---

#### Task 3.5: Implement Call Logging with Task Prompt
**File:** `src/atomic-crm/activities/QuickLogActivityDialog.tsx` (modify existing)
**Time:** 5-10 min
**Dependencies:** None

**Add task prompt after activity creation:**
```typescript
import { useState } from "react";
import { useCreate, useNotify } from "react-admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface TaskPromptDialogProps {
  open: boolean;
  onClose: () => void;
  activityData: {
    contact_id?: number;
    organization_id?: number;
    opportunity_id?: number;
    subject: string;
  };
}

export function TaskPromptDialog({ open, onClose, activityData }: TaskPromptDialogProps) {
  const [create, { isPending }] = useCreate();
  const notify = useNotify();
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  const handleCreateTask = async () => {
    await create(
      "tasks",
      {
        data: {
          title: `Follow up: ${activityData.subject}`,
          type: "Follow-up",
          priority: "medium",
          due_date: dueDate,
          contact_id: activityData.contact_id,
          organization_id: activityData.organization_id,
          opportunity_id: activityData.opportunity_id,
        },
      },
      {
        onSuccess: () => {
          notify("Follow-up task created", { type: "success" });
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Follow-up Task?</DialogTitle>
          <DialogDescription>
            Would you like to create a follow-up task for this activity?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="dueDate">Due Date</Label>
          <div className="relative mt-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-11">
            No Thanks
          </Button>
          <Button onClick={handleCreateTask} disabled={isPending} className="h-11">
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// In QuickLogActivityDialog, after successful activity creation:
const [showTaskPrompt, setShowTaskPrompt] = useState(false);
const [lastActivityData, setLastActivityData] = useState(null);

// After create success:
onSuccess: (data) => {
  notify("Activity logged", { type: "success" });
  // Show task prompt for calls and meetings
  if (["call", "meeting"].includes(data.data.type)) {
    setLastActivityData({
      contact_id: data.data.contact_id,
      organization_id: data.data.organization_id,
      opportunity_id: data.data.opportunity_id,
      subject: data.data.subject,
    });
    setShowTaskPrompt(true);
  } else {
    onClose();
  }
}
```

---

### Stage 4: Principal Communications Dashboard

#### Task 4.1: Create PrincipalCommunicationsDashboard component
**File:** `src/atomic-crm/dashboard/PrincipalCommunicationsDashboard.tsx`
**Time:** 10-15 min
**Dependencies:** Stage 3 complete

```typescript
import { useState, useMemo } from "react";
import { useDataProvider, useGetList, Title } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Mail, Phone, Calendar } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { EmailTimelineItem } from "../activities/EmailTimelineItem";

export function PrincipalCommunicationsDashboard() {
  const dataProvider = useDataProvider();
  const [selectedPrincipal, setSelectedPrincipal] = useState<string>("");
  const [dateRange, setDateRange] = useState<"week" | "month">("week");

  // Fetch principals (organizations with type='principal')
  const { data: principals = [] } = useGetList("organizations", {
    filter: { type: "principal" },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (dateRange === "week") {
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfWeek(now, { weekStartsOn: 1 }),
      };
    }
    return {
      startDate: subDays(now, 30),
      endDate: now,
    };
  }, [dateRange]);

  // Fetch activities for selected principal
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", "principal", selectedPrincipal, startDate, endDate],
    queryFn: async () => {
      if (!selectedPrincipal) return [];

      // Get opportunities for this principal
      const { data: opps } = await dataProvider.getList("opportunities", {
        filter: { principal_id: selectedPrincipal },
        pagination: { page: 1, perPage: 1000 },
        sort: { field: "id", order: "ASC" },
      });

      const oppIds = opps.map((o) => o.id);
      if (oppIds.length === 0) return [];

      const { data } = await dataProvider.getList("activities", {
        filter: {
          opportunity_id: oppIds,
          activity_date_gte: startDate.toISOString(),
          activity_date_lte: endDate.toISOString(),
        },
        pagination: { page: 1, perPage: 500 },
        sort: { field: "activity_date", order: "DESC" },
      });
      return data;
    },
    enabled: !!selectedPrincipal,
  });

  // Fetch synced emails for selected principal
  const { data: emails = [] } = useQuery({
    queryKey: ["synced_emails", "principal", selectedPrincipal, startDate, endDate],
    queryFn: async () => {
      if (!selectedPrincipal) return [];
      const { data } = await dataProvider.getList("synced_emails", {
        filter: {
          principal_id: selectedPrincipal,
          received_at_gte: startDate.toISOString(),
          received_at_lte: endDate.toISOString(),
        },
        pagination: { page: 1, perPage: 500 },
        sort: { field: "received_at", order: "DESC" },
      });
      return data;
    },
    enabled: !!selectedPrincipal,
  });

  // Compute stats
  const stats = useMemo(() => {
    const callCount = activities.filter((a) => a.type === "call").length;
    const meetingCount = activities.filter((a) => a.type === "meeting").length;
    const emailCount = emails.length;
    return { callCount, meetingCount, emailCount };
  }, [activities, emails]);

  // Export to CSV
  const handleExport = () => {
    const rows = [
      ["Date", "Type", "Subject/Description", "Contact", "Direction"],
      ...activities.map((a) => [
        format(new Date(a.activity_date), "yyyy-MM-dd"),
        a.type,
        a.subject || a.description,
        a.contact_id || "",
        "",
      ]),
      ...emails.map((e) => [
        format(new Date(e.received_at), "yyyy-MM-dd"),
        "email",
        e.subject,
        e.sender_email,
        e.direction,
      ]),
    ];

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `principal-communications-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <Title title="Principal Communications" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select value={selectedPrincipal} onValueChange={setSelectedPrincipal}>
            <SelectTrigger className="w-[250px] h-11">
              <SelectValue placeholder="Select Principal" />
            </SelectTrigger>
            <SelectContent>
              {principals.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as "week" | "month")}>
            <SelectTrigger className="w-[150px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExport} disabled={!selectedPrincipal} className="h-11">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {selectedPrincipal && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.callCount}</p>
                    <p className="text-sm text-muted-foreground">Calls</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.emailCount}</p>
                    <p className="text-sm text-muted-foreground">Emails</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.meetingCount}</p>
                    <p className="text-sm text-muted-foreground">Meetings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communications Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Communications Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="emails">Emails</TabsTrigger>
                  <TabsTrigger value="calls">Calls</TabsTrigger>
                  <TabsTrigger value="meetings">Meetings</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-3 mt-4">
                  {/* Merged timeline */}
                  {[...activities, ...emails.map((e) => ({ ...e, itemType: "email" }))]
                    .sort((a, b) =>
                      new Date(b.activity_date || b.received_at).getTime() -
                      new Date(a.activity_date || a.received_at).getTime()
                    )
                    .map((item) =>
                      item.itemType === "email" ? (
                        <EmailTimelineItem key={`email-${item.id}`} email={item} />
                      ) : (
                        <ActivityTimelineItem key={`activity-${item.id}`} activity={item} />
                      )
                    )}
                </TabsContent>
                {/* Add other tab contents... */}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

---

#### Task 4.2: Add Principal Dashboard to routing
**File:** `src/atomic-crm/root/CRM.tsx` (modify existing)
**Time:** 2-5 min
**Dependencies:** Task 4.1

**Add route:**
```typescript
import { PrincipalCommunicationsDashboard } from "../dashboard/PrincipalCommunicationsDashboard";

// In routes:
<Route path="/principal-communications" element={<PrincipalCommunicationsDashboard />} />
```

**Add to navigation menu:**
```typescript
// In Layout or Sidebar component:
<MenuItemLink
  to="/principal-communications"
  primaryText="Principal Communications"
  leftIcon={<Mail />}
/>
```

---

### Stage 5: Testing & Configuration

#### Task 5.1: Create environment variables documentation
**File:** `docs/email-integration-setup.md`
**Time:** 2-5 min

```markdown
# Email Integration Setup

## Microsoft Azure AD Configuration

1. Go to Azure Portal → Azure Active Directory → App registrations
2. Create new registration:
   - Name: "Crispy CRM Email Integration"
   - Supported account types: "Accounts in any organizational directory"
   - Redirect URI: Web → `https://your-supabase-url.supabase.co/functions/v1/email-oauth-callback`

3. Under "Certificates & secrets", create a new client secret

4. Under "API permissions", add:
   - Microsoft Graph → Delegated → Mail.Read
   - Microsoft Graph → Delegated → offline_access

## Environment Variables

Add to Supabase Edge Function secrets:

```bash
supabase secrets set MICROSOFT_CLIENT_ID=your-client-id
supabase secrets set MICROSOFT_CLIENT_SECRET=your-client-secret
supabase secrets set EMAIL_OAUTH_REDIRECT_URI=https://your-project.supabase.co/functions/v1/email-oauth-callback
supabase secrets set APP_URL=https://your-crm-domain.com
```

Add to frontend `.env`:

```env
VITE_MICROSOFT_CLIENT_ID=your-client-id
VITE_EMAIL_OAUTH_REDIRECT_URI=https://your-project.supabase.co/functions/v1/email-oauth-callback
```
```

---

#### Task 5.2: Add unit tests for validation schemas
**File:** `src/atomic-crm/validation/__tests__/email-sync.test.ts`
**Time:** 5-10 min

```typescript
import { describe, it, expect } from "vitest";
import {
  validateEmailConnectionCreate,
  validateSyncedEmailCreate,
} from "../email-sync";

describe("email-sync validation", () => {
  describe("emailConnectionCreateSchema", () => {
    it("validates valid connection data", () => {
      const valid = {
        sales_id: 1,
        provider: "microsoft",
        access_token: "token123",
        refresh_token: "refresh123",
        token_expires_at: new Date(),
        email_address: "user@example.com",
      };
      expect(() => validateEmailConnectionCreate(valid)).not.toThrow();
    });

    it("rejects invalid email", () => {
      const invalid = {
        sales_id: 1,
        provider: "microsoft",
        access_token: "token123",
        refresh_token: "refresh123",
        token_expires_at: new Date(),
        email_address: "not-an-email",
      };
      expect(() => validateEmailConnectionCreate(invalid)).toThrow();
    });

    it("rejects unknown provider", () => {
      const invalid = {
        sales_id: 1,
        provider: "yahoo",
        access_token: "token123",
        refresh_token: "refresh123",
        token_expires_at: new Date(),
        email_address: "user@example.com",
      };
      expect(() => validateEmailConnectionCreate(invalid)).toThrow();
    });
  });

  describe("syncedEmailCreateSchema", () => {
    it("validates valid email data", () => {
      const valid = {
        email_connection_id: 1,
        message_id: "msg123",
        subject: "Test Subject",
        sender_email: "sender@example.com",
        recipient_emails: ["recipient@example.com"],
        received_at: new Date(),
        direction: "inbound",
      };
      expect(() => validateSyncedEmailCreate(valid)).not.toThrow();
    });

    it("enforces body_html max length", () => {
      const tooLong = {
        email_connection_id: 1,
        message_id: "msg123",
        subject: "Test",
        sender_email: "sender@example.com",
        recipient_emails: ["recipient@example.com"],
        received_at: new Date(),
        direction: "inbound",
        body_html: "x".repeat(100001), // Over 100KB limit
      };
      expect(() => validateSyncedEmailCreate(tooLong)).toThrow();
    });
  });
});
```

---

## Dependency Graph

```
Stage 1 (Sequential)
├── 1.1 email_connections migration
├── 1.2 synced_emails migration (depends on 1.1)
└── 1.3 contact matching function (depends on 1.2)

Stage 2 (Parallel after Stage 1)
├── 2.1 Zod validation schemas
├── 2.2 ValidationService registration (depends on 2.1)
├── 2.3 resources.ts update (depends on 2.1)
├── 2.4 OAuth Edge Function
├── 2.5 Sync Polling Edge Function (depends on 2.4)
└── 2.6 pg_cron setup (depends on 2.5)

Stage 3 (Parallel after Stage 2)
├── 3.1 EmailConnectionSettings component
├── 3.2 Activity Timeline enhancement
├── 3.3 EmailTimelineItem component (depends on 3.2)
├── 3.4 Principal filter addition
└── 3.5 Call + Task Prompt flow

Stage 4 (After Stage 3)
├── 4.1 Principal Dashboard component
└── 4.2 Routing integration (depends on 4.1)

Stage 5 (Final)
├── 5.1 Documentation
└── 5.2 Unit tests
```

---

## Verification Checklist

After implementation, verify:

- [ ] User can connect Microsoft 365 account from Settings
- [ ] Emails are synced automatically every 5 minutes
- [ ] Emails appear in Contact activity timeline
- [ ] Emails can be filtered by Principal
- [ ] Logging a call prompts for follow-up task
- [ ] Principal Dashboard shows all communications
- [ ] CSV export works correctly
- [ ] All RLS policies enforce proper access control
- [ ] Validation schemas reject invalid data

---

## Risk Areas

| Risk | Mitigation |
|------|------------|
| OAuth token expiration | Refresh tokens stored, auto-refresh in Edge Function |
| Email volume overwhelming DB | 50-email limit per sync, contact-match filtering |
| Graph API rate limits | 5-min polling interval respects limits |
| Token storage security | RLS ensures users only see own tokens |
