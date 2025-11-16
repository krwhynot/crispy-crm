/**
 * Authentication Flow Integration Tests
 *
 * Real Supabase integration tests for auth flows:
 * - Login/logout
 * - Session refresh
 * - Token expiry handling
 * - Error scenarios
 *
 * Uses real local Supabase instance (not mocked).
 * Test user: admin@test.com / password123
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

interface AuthTestContext {
  client: SupabaseClient;
  adminEmail: string;
  adminPassword: string;
  session: Session | null;
}

describe('Authentication Flow Integration', () => {
  let context: AuthTestContext;

  beforeEach(async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env.test');
    }

    context = {
      client: createClient(supabaseUrl, supabaseKey),
      adminEmail: 'admin@test.com',
      adminPassword: 'password123',
      session: null,
    };

    // Ensure we're logged out before each test
    await context.client.auth.signOut();
  });

  afterEach(async () => {
    // Cleanup: sign out after each test
    if (context?.client) {
      await context.client.auth.signOut();
    }
  });

  describe('Login', () => {
    it('successfully logs in with valid credentials', async () => {
      const { data, error } = await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      expect(error).toBeNull();
      expect(data.session).toBeTruthy();
      expect(data.user).toBeTruthy();
      expect(data.user?.email).toBe(context.adminEmail);
      expect(data.session?.access_token).toBeTruthy();
      expect(data.session?.refresh_token).toBeTruthy();

      context.session = data.session;
    });

    it('fails login with invalid email', async () => {
      const { data, error } = await context.client.auth.signInWithPassword({
        email: 'nonexistent@test.com',
        password: context.adminPassword,
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('Invalid');
      expect(data.session).toBeNull();
      expect(data.user).toBeNull();
    });

    it('fails login with invalid password', async () => {
      const { data, error } = await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: 'wrongpassword',
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('Invalid');
      expect(data.session).toBeNull();
      expect(data.user).toBeNull();
    });

    it('fails login with missing credentials', async () => {
      const { data, error } = await context.client.auth.signInWithPassword({
        email: '',
        password: '',
      });

      expect(error).toBeTruthy();
      expect(data.session).toBeNull();
    });
  });

  describe('Logout', () => {
    it('successfully logs out authenticated user', async () => {
      // First login
      await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      // Verify we're logged in
      const { data: sessionBefore } = await context.client.auth.getSession();
      expect(sessionBefore.session).toBeTruthy();

      // Logout
      const { error } = await context.client.auth.signOut();
      expect(error).toBeNull();

      // Verify we're logged out
      const { data: sessionAfter } = await context.client.auth.getSession();
      expect(sessionAfter.session).toBeNull();
    });

    it('handles logout when already logged out', async () => {
      // Ensure we're logged out
      await context.client.auth.signOut();

      // Try to logout again
      const { error } = await context.client.auth.signOut();

      // Should not error
      expect(error).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('retrieves current session after login', async () => {
      // Login
      const { data: loginData } = await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      // Get session
      const { data: sessionData, error } = await context.client.auth.getSession();

      expect(error).toBeNull();
      expect(sessionData.session).toBeTruthy();
      expect(sessionData.session?.user.email).toBe(context.adminEmail);
      expect(sessionData.session?.access_token).toBe(loginData.session?.access_token);
    });

    it('returns null session when not logged in', async () => {
      await context.client.auth.signOut();

      const { data, error } = await context.client.auth.getSession();

      expect(error).toBeNull();
      expect(data.session).toBeNull();
    });

    it('session contains valid tokens and expiry', async () => {
      const { data } = await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      const session = data.session!;

      expect(session.access_token).toBeTruthy();
      expect(session.refresh_token).toBeTruthy();
      expect(session.expires_at).toBeTruthy();
      expect(session.expires_in).toBeTruthy();

      // Verify expiry is in the future
      const expiryTime = session.expires_at! * 1000;
      const now = Date.now();
      expect(expiryTime).toBeGreaterThan(now);
    });
  });

  describe('Session Refresh', () => {
    it('refreshes session with valid refresh token', async () => {
      // Login to get initial session
      const { data: loginData } = await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      const originalAccessToken = loginData.session?.access_token;
      const originalRefreshToken = loginData.session?.refresh_token;

      // Wait a moment to ensure new tokens are different
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh session
      const { data: refreshData, error } = await context.client.auth.refreshSession({
        refresh_token: originalRefreshToken,
      });

      expect(error).toBeNull();
      expect(refreshData.session).toBeTruthy();
      expect(refreshData.session?.access_token).toBeTruthy();
      expect(refreshData.session?.refresh_token).toBeTruthy();

      // New tokens should be different from original
      expect(refreshData.session?.access_token).not.toBe(originalAccessToken);
    });

    it('fails to refresh with invalid refresh token', async () => {
      const { data, error } = await context.client.auth.refreshSession({
        refresh_token: 'invalid_refresh_token',
      });

      expect(error).toBeTruthy();
      expect(error?.message).toBeTruthy();
      expect(data.session).toBeNull();
    });

    it('fails to refresh with empty refresh token', async () => {
      const { data, error } = await context.client.auth.refreshSession({
        refresh_token: '',
      });

      expect(error).toBeTruthy();
      expect(data.session).toBeNull();
    });

    it('refreshes session automatically when calling getSession', async () => {
      // Login
      await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      // Get session (should auto-refresh if needed)
      const { data, error } = await context.client.auth.getSession();

      expect(error).toBeNull();
      expect(data.session).toBeTruthy();
      expect(data.session?.access_token).toBeTruthy();
    });
  });

  describe('User Data', () => {
    it('retrieves user data after login', async () => {
      await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      const { data, error } = await context.client.auth.getUser();

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(data.user.email).toBe(context.adminEmail);
      expect(data.user.id).toBeTruthy();
      expect(data.user.email_confirmed_at).toBeTruthy();
    });

    it('fails to retrieve user when not logged in', async () => {
      await context.client.auth.signOut();

      const { data, error } = await context.client.auth.getUser();

      expect(error).toBeTruthy();
      expect(data.user).toBeNull();
    });
  });

  describe('RLS Integration', () => {
    it('authenticated user can query database', async () => {
      // Login
      await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      // Query organizations (should work with RLS)
      const { data, error } = await context.client
        .from('organizations')
        .select('id, name')
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(Array.isArray(data)).toBe(true);
    });

    it('unauthenticated user cannot insert into protected tables', async () => {
      // Ensure logged out
      await context.client.auth.signOut();

      // Try to insert (should fail RLS)
      const { data, error } = await context.client
        .from('organizations')
        .insert({ name: 'Unauthorized Org', organization_type: 'customer' })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    it('authenticated user can insert into allowed tables', async () => {
      // Login
      await context.client.auth.signInWithPassword({
        email: context.adminEmail,
        password: context.adminPassword,
      });

      // Insert organization (should work with RLS for admin)
      const { data, error } = await context.client
        .from('organizations')
        .insert({ name: 'Test Auth Org', organization_type: 'customer' })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.name).toBe('Test Auth Org');

      // Cleanup
      if (data?.id) {
        await context.client.from('organizations').delete().eq('id', data.id);
      }
    });
  });
});
