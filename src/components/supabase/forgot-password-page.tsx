import { useState } from "react";
import { useResetPassword } from "ra-supabase-core";
import { Form, useNotify, useTranslate } from "ra-core";
import { Layout } from "@/components/supabase/layout.tsx";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button.tsx";

interface FormData {
  email: string;
}

export const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);

  const notify = useNotify();
  const translate = useTranslate();
  const [, { mutateAsync: resetPassword }] = useResetPassword();

  const submit = async (values: FormData) => {
    try {
      setLoading(true);
      await resetPassword({
        email: values.email,
      });
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "ra.auth.sign_in_error";

      const errorDetails =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : undefined;

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

  return (
    <Layout>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {translate("ra-supabase.reset_password.forgot_password", {
            _: "Forgot password?",
          })}
        </h1>
        <p>
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
        <Button type="submit" className="cursor-pointer" disabled={loading}>
          {translate("ra.action.reset_password", {
            _: "Reset password",
          })}
        </Button>
      </Form>
    </Layout>
  );
};

ForgotPasswordPage.path = "forgot-password";
