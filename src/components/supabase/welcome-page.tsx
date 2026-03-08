import { useEffect, useState } from "react";
import { Form, useNotify } from "ra-core";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { Layout } from "@/components/supabase/layout";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

interface OtpFormData {
  email: string;
  otp: string;
}

interface PasswordFormData {
  password: string;
  confirmPassword: string;
}

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

/**
 * Welcome Page — OTP-based account setup for new users
 *
 * Two-phase single-page flow:
 * Phase 1: User enters email + 6-digit OTP code from their administrator
 * Phase 2: User creates their password
 *
 * This bypasses enterprise email link-prefetch issues (Microsoft Defender Safe Links, etc.)
 * by using a manually-entered OTP instead of a one-time URL.
 */
const WELCOME_PHASE_KEY = "welcome-setup-phase";

export const WelcomePage = () => {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"verify" | "password">(() => {
    // Persist phase across re-mounts caused by auth state changes
    // (verifyOtp fires SIGNED_IN event → React Admin re-renders route tree)
    const stored = sessionStorage.getItem(WELCOME_PHASE_KEY);
    return stored === "password" ? "password" : "verify";
  });
  const notify = useNotify();

  // Sync phase to sessionStorage and clean up on completion
  useEffect(() => {
    if (phase === "password") {
      sessionStorage.setItem(WELCOME_PHASE_KEY, "password");
    }
  }, [phase]);

  const handleVerifyOtp: SubmitHandler<FieldValues> = async (values) => {
    const { email, otp } = values as OtpFormData;
    if (!email || !otp) {
      notify("Please enter both your email and the 6-digit code.", { type: "warning" });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });

      if (error) {
        notify(error.message || "Invalid or expired code. Ask your administrator for a new one.", {
          type: "warning",
        });
        return;
      }

      setPhase("password");
      notify("Code verified! Now create your password.", { type: "info" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Verification failed";
      notify(message, { type: "warning" });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword: SubmitHandler<FieldValues> = async (values) => {
    const { password, confirmPassword } = values as PasswordFormData;

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      notify(strengthError, { type: "warning" });
      return;
    }

    if (password !== confirmPassword) {
      notify("Passwords do not match", { type: "warning" });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        notify(error.message || "Failed to set password.", { type: "warning" });
        return;
      }

      // Clean up phase state and sign out recovery session, then redirect to login
      sessionStorage.removeItem(WELCOME_PHASE_KEY);
      await supabase.auth.signOut();
      notify("Password set successfully! Redirecting to login...", { type: "success" });
      setTimeout(() => {
        window.location.href = "/#/login";
      }, 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to set password";
      notify(message, { type: "warning" });
    } finally {
      setLoading(false);
    }
  };

  if (phase === "password") {
    return (
      <Layout>
        <div className="flex flex-col space-y-2 text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Step 2 of 2
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Create Your Password</h1>
          <p className="text-sm text-muted-foreground">
            Choose a secure password for your account.
          </p>
        </div>
        <Form<PasswordFormData> className="space-y-8" onSubmit={handleSetPassword}>
          <TextInput
            label="Password *"
            source="password"
            type="password"
            autoComplete="new-password"
            helperText="Min 8 characters, with uppercase, lowercase, and a number"
          />
          <TextInput
            label="Confirm password *"
            source="confirmPassword"
            type="password"
            autoComplete="new-password"
            helperText="Must match password above"
          />
          <Button type="submit" className="cursor-pointer" disabled={loading}>
            Set Password & Continue
          </Button>
        </Form>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col space-y-2 text-center">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Step 1 of 2
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Crispy CRM</h1>
        <p className="text-sm text-muted-foreground">
          Your administrator has created an account for you. Enter your email and the 6-digit setup
          code you received.
        </p>
      </div>
      <Form<OtpFormData> className="space-y-8" onSubmit={handleVerifyOtp}>
        <TextInput
          source="email"
          label="Email *"
          type="email"
          autoComplete="email"
          helperText="The email address your account was created with"
        />
        <TextInput
          source="otp"
          label="Setup code *"
          autoComplete="one-time-code"
          helperText="6-digit code from your administrator"
        />
        <Button type="submit" className="cursor-pointer" disabled={loading}>
          Verify Code
        </Button>
      </Form>
      <Link to="/login" className="text-sm text-center hover:underline">
        Already have an account? Sign in
      </Link>
    </Layout>
  );
};
