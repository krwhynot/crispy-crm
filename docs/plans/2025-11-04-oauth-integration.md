# OAuth Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Google and Microsoft OAuth SSO for enterprise authentication

**Architecture:** Extend existing Supabase Auth (email/password 100%) with OAuth providers. Supabase handles OAuth flow.

**Tech Stack:** Supabase Auth OAuth, Google OAuth 2.0, Microsoft Azure AD
**Effort:** 4 days (2 Google + 2 Microsoft) | **Priority:** MEDIUM
**Status:** Email/password works, OAuth 0%

---

## Part A: Google OAuth (2 days)

### Step 1-3: Configure Google Cloud Project

**Manual steps:**
1. Go to https://console.cloud.google.com/
2. Create new project "Atomic CRM"
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://[PROJECT-ID].supabase.co/auth/v1/callback`
5. Save Client ID and Client Secret

### Step 4-6: Configure Supabase

**In Supabase Dashboard:**
1. Go to Authentication → Providers
2. Enable Google provider
3. Enter Client ID and Client Secret
4. Save

### Step 7-9: Update Login UI

**File:** `src/pages/Login.tsx`

```typescript
import { Button } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import { supabaseClient } from '../atomic-crm/providers/supabase/supabase'

// Add Google login button
<Button
  variant="outlined"
  startIcon={<GoogleIcon />}
  onClick={async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }}
  fullWidth
  sx={{ mt: 2 }}
>
  Continue with Google
</Button>
```

### Step 10: Test & Commit

```bash
npm run dev
# Click "Continue with Google"
# Verify OAuth flow works
# Verify user created in Supabase

git add src/pages/Login.tsx
git commit -m "feat: add Google OAuth SSO

- Configure Google Cloud OAuth credentials
- Enable Google provider in Supabase
- Add Google login button to Login page
- Use Supabase signInWithOAuth flow

🤖 Generated with Claude Code"
```

---

## Part B: Microsoft OAuth (2 days)

### Step 11-13: Configure Azure AD

**Manual steps:**
1. Go to https://portal.azure.com/
2. Navigate to Azure Active Directory → App registrations
3. Create new registration "Atomic CRM"
4. Add redirect URI: `https://[PROJECT-ID].supabase.co/auth/v1/callback`
5. Create client secret (Certificates & secrets)
6. Note Application (client) ID and client secret

### Step 14-16: Configure Supabase

**In Supabase Dashboard:**
1. Go to Authentication → Providers
2. Enable Azure (Microsoft) provider
3. Enter Client ID and Client Secret
4. Enter Azure AD tenant ID
5. Save

### Step 17-19: Update Login UI

```typescript
import MicrosoftIcon from '@mui/icons-material/Microsoft'

<Button
  variant="outlined"
  startIcon={<MicrosoftIcon />}
  onClick={async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email',
        redirectTo: window.location.origin,
      },
    })
  }}
  fullWidth
  sx={{ mt: 1 }}
>
  Continue with Microsoft
</Button>
```

### Step 20: Test & Commit

```bash
git add src/pages/Login.tsx
git commit -m "feat: add Microsoft OAuth SSO

- Configure Azure AD app registration
- Enable Azure provider in Supabase
- Add Microsoft login button to Login page

OAuth complete: Email/password + Google + Microsoft

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 4 days | **Impact:** MEDIUM (Enterprise auth)
