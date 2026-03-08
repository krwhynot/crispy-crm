# Brainstorm: Admin OTP User Creation

## Problem Statement

When an admin creates a new user in Crispy CRM, the current flow generates a one-time recovery
URL that the admin copies and shares. This link-based approach fails in enterprise environments
because email security tools (Microsoft Defender Safe Links, etc.) prefetch and consume the
one-time link before the user clicks it. The fallback OTP path exists but is hidden and the
set-password page looks too similar to the login screen, causing user confusion.

Additionally, when an OTP expires or a user enters the wrong code too many times, the admin's
only option is "Reset Password" which sends a Supabase recovery email — hitting the same
prefetching problem and the 2-emails/hour rate limit.

## Goals

1. Make OTP (6-digit code) the primary credential for new user onboarding, replacing the recovery URL
2. Create a visually distinct "Welcome" page that clearly communicates first-time account setup
3. Give admins a "Regenerate Code" action for existing users when the OTP expires or fails
4. Keep the recovery URL as a secondary fallback

## Non-Goals

- Automated email sending (admin shares OTP manually)
- Changing the login page design
- Multi-factor authentication setup during onboarding
- Self-service signup (all users are admin-created)

## Open Questions (Resolved)

| Question | Answer | Evidence |
|----------|--------|----------|
| Does generate_link return an OTP? | Yes — `email_otp` field in response | GoTrue API docs |
| What verifyOtp type to use? | `recovery` (matches generate_link type) | Supabase verifyOtp docs |
| Rate limits a concern? | No — admin API bypasses per-user limits, no emails sent | Supabase production checklist |
| 2 emails/hour limit? | Not triggered — our flow never uses Supabase's mailer | Edge Function uses generate_link, not resetPasswordForEmail |
| OTP expiry? | Configurable, default ~1 hour, max 24 hours | Supabase OTP guide |
| How to regenerate expired OTP? | New "Regenerate Code" button on user profile, calls generate_link | Gap in current system |

## Ownership

- Plan owner: TBD
- Tech reviewer: TBD
- Business approver: TBD
