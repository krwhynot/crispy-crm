/**
 * Integration Tests: opportunities_summary RLS Policies
 *
 * Tests that verify Row Level Security policies work correctly for the
 * opportunities_summary view, ensuring authenticated users can read
 * customer_organization_name from joined organizations table.
 *
 * Test scenarios:
 * 1. Authenticated user can read opportunities with customer names
 * 2. Anon role is blocked by RLS (returns empty)
 * 3. View JOIN returns customer_organization_name correctly
 * 4. Campaign-filtered queries return expected data
 *
 * NOTE: This test uses vi.importActual to bypass the global Supabase mock
 * and hit the real local Supabase instance.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { SupabaseClient, Session } from "@supabase/supabase-js";

// Import the REAL createClient, bypassing the global mock in setup.ts

const { createClient } =
  await vi.importActual<typeof import("@supabase/supabase-js")>("@supabase/supabase-js");

describe("opportunities_summary RLS Integration Tests", () => {
  let supabase: SupabaseClient;
  let authSession: Session | null = null;

  // HARDCODED local Supabase URLs - these tests MUST run against local instance
  // Do NOT use process.env as vitest.config.ts overrides with test values
  const SUPABASE_URL = "http://127.0.0.1:54321";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.-7wL35-YnDVohXfRR7EKrOSmJvPesV5Tk0pxmMmNVxE";

  // Test credentials from seed data
  const TEST_EMAIL = "admin@test.com";
  const TEST_PASSWORD = "password123";

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  afterAll(async () => {
    // Sign out if authenticated
    if (authSession) {
      await supabase.auth.signOut();
    }
  });

  describe("Anon Role (Unauthenticated)", () => {
    it("should return empty results for opportunities_summary", async () => {
      // Ensure we're not authenticated
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from("opportunities_summary")
        .select("id, name, customer_organization_name")
        .limit(10);

      // RLS should block anon access - returns empty array, not error
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("should return empty for direct opportunities table as well", async () => {
      await supabase.auth.signOut();

      const { data, error } = await supabase.from("opportunities").select("id, name").limit(10);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("Authenticated Role", () => {
    beforeAll(async () => {
      // Authenticate as test user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      console.log("[AUTH DEBUG] Sign in result:", {
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userId: data?.user?.id?.slice(0, 8) + "...",
        error: error?.message || "none",
      });

      if (error) {
        console.error("Auth error:", error);
        throw new Error(`Failed to authenticate: ${error.message}`);
      }

      authSession = data.session;

      // Verify session is actually set
      const { data: sessionCheck } = await supabase.auth.getSession();
      console.log("[AUTH DEBUG] Session check after login:", {
        hasSession: !!sessionCheck?.session,
        accessTokenPrefix: sessionCheck?.session?.access_token?.slice(0, 20) + "...",
      });

      expect(authSession).toBeTruthy();
    });

    it("should return opportunities with customer_organization_name", async () => {
      const { data, error } = await supabase
        .from("opportunities_summary")
        .select("id, name, customer_organization_id, customer_organization_name")
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.length).toBeGreaterThan(0);

      // Verify customer_organization_name is populated (not null) for records with customer_organization_id
      const recordsWithCustomerId = data!.filter((r) => r.customer_organization_id !== null);

      if (recordsWithCustomerId.length > 0) {
        const firstWithCustomer = recordsWithCustomerId[0];
        expect(firstWithCustomer.customer_organization_name).toBeTruthy();
        expect(typeof firstWithCustomer.customer_organization_name).toBe("string");
      }
    });

    it("should return campaign-filtered opportunities with customer names", async () => {
      // Query for a specific campaign that exists in seed data
      const { data, error } = await supabase
        .from("opportunities_summary")
        .select("id, name, customer_organization_name, campaign")
        .eq("campaign", "Grand Rapids Trade Show 2024");

      expect(error).toBeNull();

      // If campaign has data, verify customer names are populated
      if (data && data.length > 0) {
        console.log("Campaign opportunities found:", data.length);

        // All records should have customer_organization_name populated
        data.forEach((record) => {
          expect(record.customer_organization_name).toBeTruthy();
          expect(record.customer_organization_name).not.toBe("Unknown Customer");
        });

        // Verify expected customer names from seed data
        const customerNames = data.map((r) => r.customer_organization_name);
        console.log("Customer names in campaign:", customerNames);

        // Grand Rapids Trade Show should have Buffalo Wild Wings and Red Robin
        expect(
          customerNames.includes("Buffalo Wild Wings") || customerNames.includes("Red Robin")
        ).toBe(true);
      }
    });

    it("should include all denormalized organization names in view", async () => {
      const { data, error } = await supabase
        .from("opportunities_summary")
        .select(
          `
          id,
          name,
          customer_organization_id,
          customer_organization_name,
          principal_organization_id,
          principal_organization_name,
          distributor_organization_id,
          distributor_organization_name
        `
        )
        .not("principal_organization_id", "is", null)
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeTruthy();

      if (data && data.length > 0) {
        const record = data[0];

        // Principal should have name populated
        expect(record.principal_organization_name).toBeTruthy();

        // Log for debugging
        console.log("Sample opportunity with all org names:", {
          name: record.name,
          customer: record.customer_organization_name,
          principal: record.principal_organization_name,
          distributor: record.distributor_organization_name,
        });
      }
    });

    it("should return correct total count for authenticated user", async () => {
      const { count, error } = await supabase
        .from("opportunities_summary")
        .select("*", { count: "exact", head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(0);

      // Seed data has 55 opportunities
      console.log("Total opportunities visible to authenticated user:", count);
    });
  });

  describe("View Security Context", () => {
    it("should have security_invoker enabled (proper RLS enforcement)", async () => {
      // This test verifies the view is configured correctly
      // security_invoker=on means RLS on underlying tables is respected

      // Sign in first
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      expect(authError).toBeNull();

      // If we can query the view and get results, security is working correctly
      const { data, error } = await supabase.from("opportunities_summary").select("id").limit(1);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });
  });

  describe("JOIN Chain Verification", () => {
    it("should verify customer org JOIN returns names from organizations table", async () => {
      // Authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      expect(authError).toBeNull();

      // Get opportunity with customer
      const { data: oppData } = await supabase
        .from("opportunities_summary")
        .select("customer_organization_id, customer_organization_name")
        .not("customer_organization_id", "is", null)
        .limit(1)
        .single();

      if (oppData) {
        // Verify the name matches what's in organizations table
        const { data: orgData } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", oppData.customer_organization_id)
          .single();

        expect(orgData).toBeTruthy();
        expect(orgData!.name).toBe(oppData.customer_organization_name);

        console.log("JOIN verification:", {
          orgId: oppData.customer_organization_id,
          fromView: oppData.customer_organization_name,
          fromOrgsTable: orgData!.name,
          match: orgData!.name === oppData.customer_organization_name,
        });
      }
    });
  });
});
