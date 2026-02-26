import { useCallback, useEffect, useRef, useState } from "react";
import { useResetPassword } from "ra-supabase-core";
import { Form, useNotify, useTranslate } from "ra-core";
import { Layout } from "@/components/supabase/layout.tsx";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { Button } from "@/components/ui/button.tsx";

interface FormData {
  email: string;
}

const COOLDOWN_SECONDS = 60;

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = useNotify();
  const translate = useTranslate();
  const [, { mutateAsync: resetPassword }] = useResetPassword();

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const submit = async (values: FormData) => {
    try {
      setLoading(true);
      await resetPassword({
        email: values.email,
      });
      // Start cooldown after successful submission
      startCooldown();
      notify("If an account exists with that email, a reset link has been sent.", {
        type: "info",
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

      // Start cooldown even on error (server may have rate-limited)
      startCooldown();
      notify(errorMessage, {
        type: "warning",
        messageArgs: {
          _: errorDetails,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldown > 0;

  return (
    <Layout>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {translate("ra-supabase.reset_password.forgot_password", {
            _: "Forgot password?",
          })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {translate("ra-supabase.reset_password.forgot_password_details", {
            _: "Enter your email to receive a reset password link.",
          })}
        </p>
      </div>
      <Form<FormData> className="space-y-8" onSubmit={submit as SubmitHandler<FieldValues>}>
        <TextInput
          source="email"
          label={`${translate("ra.auth.email", { _: "Email" })} *`}
          autoComplete="email"
          helperText="Required"
        />
        <Button type="submit" className="cursor-pointer" disabled={isDisabled}>
          {cooldown > 0
            ? `Try again in ${cooldown}s`
            : translate("ra.action.reset_password", { _: "Reset password" })}
        </Button>
      </Form>
    </Layout>
  );
};
