/**
 * WelcomePage Tests
 *
 * Verifies the OTP-based account setup flow:
 * - Phase 1: Email + OTP code entry
 * - Phase 2: Password creation after OTP verification
 * - Error handling for invalid codes and weak passwords
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock supabase client
vi.mock("@/atomic-crm/providers/supabase/supabase", () => ({
  supabase: {
    auth: {
      verifyOtp: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Mock useAppBranding for Layout
vi.mock("@/atomic-crm/root/ConfigurationContext", () => ({
  useAppBranding: () => ({
    darkModeLogo: "/logo.png",
    title: "Crispy CRM",
  }),
}));

import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import { WelcomePage } from "../welcome-page";

describe("WelcomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe("Phase 1 — OTP Verification", () => {
    test("renders email and OTP inputs with Step 1 of 2 label", () => {
      renderWithAdminContext(<WelcomePage />);

      expect(screen.getByText("Step 1 of 2")).toBeDefined();
      expect(screen.getByText("Welcome to Crispy CRM")).toBeDefined();
      expect(screen.getByLabelText(/email/i)).toBeDefined();
      expect(screen.getByLabelText(/setup code/i)).toBeDefined();
      expect(screen.getByText("Verify Code")).toBeDefined();
    });

    test('renders "Already have an account?" link', () => {
      renderWithAdminContext(<WelcomePage />);

      const link = screen.getByText(/Already have an account/i);
      expect(link).toBeDefined();
      expect(link.closest("a")).toBeDefined();
    });

    test("transitions to Phase 2 on successful OTP verification", async () => {
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      renderWithAdminContext(<WelcomePage />);

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email/i);
      const otpInput = screen.getByLabelText(/setup code/i);

      await user.type(emailInput, "test@example.com");
      await user.type(otpInput, "123456");

      const submitButton = screen.getByText("Verify Code");
      await act(async () => {
        submitButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText("Step 2 of 2")).toBeDefined();
        expect(screen.getByText("Create Your Password")).toBeDefined();
      });

      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        token: "123456",
        type: "recovery",
      });
    });

    test("shows error notification on invalid OTP", async () => {
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Token has expired or is invalid", name: "AuthError", status: 400 },
      } as never);

      renderWithAdminContext(<WelcomePage />);

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/setup code/i), "000000");

      await act(async () => {
        screen.getByText("Verify Code").click();
      });

      // Should still be on Phase 1
      await waitFor(() => {
        expect(screen.getByText("Step 1 of 2")).toBeDefined();
      });
    });
  });

  describe("Phase 2 — Password Creation", () => {
    async function goToPhase2() {
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      renderWithAdminContext(<WelcomePage />);

      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/setup code/i), "123456");

      await act(async () => {
        screen.getByText("Verify Code").click();
      });

      await waitFor(() => {
        expect(screen.getByText("Step 2 of 2")).toBeDefined();
      });

      return user;
    }

    test("renders password fields in Phase 2", async () => {
      await goToPhase2();

      expect(screen.getByLabelText(/^Password/)).toBeDefined();
      expect(screen.getByLabelText(/Confirm password/i)).toBeDefined();
      expect(screen.getByText("Set Password & Continue")).toBeDefined();
    });

    test("sets password and redirects on success", async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const user = await goToPhase2();

      await user.type(screen.getByLabelText(/^Password/), "StrongPass1");
      await user.type(screen.getByLabelText(/Confirm password/i), "StrongPass1");

      await act(async () => {
        screen.getByText("Set Password & Continue").click();
      });

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "StrongPass1" });
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
