import { useState } from "react";
import { Form, useNotify, useTranslate } from "ra-core";
import { useSetPassword, useSupabaseAccessToken } from "ra-supabase-core";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { Layout } from "@/components/supabase/layout";
import { logger } from "@/lib/logger";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

interface PasswordFormData {
  password: string;
  confirmPassword: string;
}

interface OtpFormData {
  email: string;
  otp: string;
}

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

/**
 * Validate password strength: min 8 chars, at least one uppercase, one lowercase, one digit.
 * Returns error message or null if valid.
 */
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
 * Set Password Page
 *
 * Supports two authentication paths:
 * 1. **Token path** (default): User arrives via invite link with access_token/refresh_token in URL.
 *    Uses ra-supabase-core's useSetPassword hook.
 * 2. **OTP path** (fallback): When enterprise email providers prefetch/consume the one-time link,
 *    users can manually enter their email and the 6-digit OTP code from the invite email.
 *    Uses supabase.auth.verifyOtp() then supabase.auth.updateUser().
 */
export const SetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const access_token = useSupabaseAccessToken();
  const refresh_token = useSupabaseAccessToken({
    parameterName: "refresh_token",
  });

  const notify = useNotify();
  const translate = useTranslate();
  const [, { mutateAsync: setPassword }] = useSetPassword();

  const hasTokens = Boolean(access_token && refresh_token);

  // Token path: submit password using ra-supabase-core hook
  const submitWithToken = async (values: PasswordFormData) => {
    const strengthError = validatePasswordStrength(values.password);
    if (strengthError) {
      notify(strengthError, { type: "warning" });
      return;
    }

    if (values.password !== values.confirmPassword) {
      notify("ra-supabase.validation.password_mismatch", {
        type: "warning",
        messageArgs: { _: "Passwords do not match" },
      });
      return;
    }

    try {
      setLoading(true);
      await setPassword({
        access_token: access_token!,
        refresh_token: refresh_token!,
        password: values.password,
      });
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "ra.auth.sign_in_error";
      const errorDetails =
        typeof error === "string" ? error : error instanceof Error ? error.message : undefined;

      notify(errorMessage, { type: "warning", messageArgs: { _: errorDetails } });
    } finally {
      setLoading(false);
    }
  };

  // OTP path step 1: verify the 6-digit code
  const submitOtp = async (values: OtpFormData) => {
    if (!values.email || !values.otp) {
      notify("Please enter both your email and the 6-digit code.", { type: "warning" });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        email: values.email,
        token: values.otp,
        type: "invite",
      });

      if (error) {
        logger.warn("OTP verification failed", {
          feature: "SetPasswordPage",
          error: error.message,
        });
        notify(error.message || "Invalid or expired code. Please try again.", { type: "warning" });
        return;
      }

      setOtpVerified(true);
      notify("Code verified. Please choose your password.", { type: "info" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Verification failed";
      notify(message, { type: "warning" });
    } finally {
      setLoading(false);
    }
  };

  // OTP path step 2: set password after OTP verification (user now has a session)
  const submitPasswordAfterOtp = async (values: PasswordFormData) => {
    const strengthError = validatePasswordStrength(values.password);
    if (strengthError) {
      notify(strengthError, { type: "warning" });
      return;
    }

    if (values.password !== values.confirmPassword) {
      notify("Passwords do not match", { type: "warning" });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        notify(error.message || "Failed to set password.", { type: "warning" });
        return;
      }

      notify("Password set successfully. Redirecting to login...", { type: "success" });
      // Redirect to login after a brief delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to set password";
      notify(message, { type: "warning" });
    } finally {
      setLoading(false);
    }
  };

  // Path 1: Token-based flow (invite link worked)
  if (hasTokens) {
    return (
      <Layout>
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {translate("ra-supabase.set_password.new_password", { _: "Choose your password" })}
          </h1>
        </div>
        <Form<PasswordFormData>
          className="space-y-8"
          onSubmit={submitWithToken as SubmitHandler<FieldValues>}
        >
          <PasswordFields translate={translate} />
          <Button type="submit" className="cursor-pointer" disabled={loading}>
            {translate("ra.action.save")}
          </Button>
        </Form>
      </Layout>
    );
  }

  // Path 2a: OTP verified, now set password
  if (otpVerified) {
    return (
      <Layout>
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {translate("ra-supabase.set_password.new_password", { _: "Choose your password" })}
          </h1>
        </div>
        <Form<PasswordFormData>
          className="space-y-8"
          onSubmit={submitPasswordAfterOtp as SubmitHandler<FieldValues>}
        >
          <PasswordFields translate={translate} />
          <Button type="submit" className="cursor-pointer" disabled={loading}>
            {translate("ra.action.save")}
          </Button>
        </Form>
      </Layout>
    );
  }

  // Path 2b: No tokens — show OTP entry form
  return (
    <Layout>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {translate("ra-supabase.set_password.new_password", { _: "Verify your invitation" })}
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the email address from your invitation and the 6-digit code from the email.
        </p>
      </div>
      <Form<OtpFormData> className="space-y-8" onSubmit={submitOtp as SubmitHandler<FieldValues>}>
        <TextInput
          source="email"
          label={`${translate("ra.auth.email", { _: "Email" })} *`}
          autoComplete="email"
          helperText="The email address your invitation was sent to"
        />
        <TextInput
          source="otp"
          label="Verification code *"
          autoComplete="one-time-code"
          helperText="6-digit code from the invitation email"
        />
        <Button type="submit" className="cursor-pointer" disabled={loading}>
          {translate("ra.action.confirm", { _: "Verify code" })}
        </Button>
      </Form>
    </Layout>
  );
};

/**
 * Shared password + confirm password fields with strength requirements helper text.
 */
function PasswordFields({ translate }: { translate: ReturnType<typeof useTranslate> }) {
  return (
    <>
      <TextInput
        label={`${translate("ra.auth.password", { _: "Password" })} *`}
        autoComplete="new-password"
        source="password"
        type="password"
        helperText="Min 8 characters, with uppercase, lowercase, and a number"
      />
      <TextInput
        label={`${translate("ra.auth.confirm_password", { _: "Confirm password" })} *`}
        source="confirmPassword"
        type="password"
        helperText="Must match password above"
      />
    </>
  );
}
