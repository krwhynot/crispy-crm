import { useState } from "react";
import { Form, useNotify, useTranslate } from "ra-core";
import { useSetPassword, useSupabaseAccessToken } from "ra-supabase-core";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { Layout } from "@/components/supabase/layout";
import { logger } from "@/lib/logger";

interface FormData {
  password: string;
  confirmPassword: string;
}

export const SetPasswordPage = () => {
  const [loading, setLoading] = useState(false);

  const access_token = useSupabaseAccessToken();
  const refresh_token = useSupabaseAccessToken({
    parameterName: "refresh_token",
  });

  const notify = useNotify();
  const translate = useTranslate();
  const [, { mutateAsync: setPassword }] = useSetPassword();

  if (!access_token || !refresh_token) {
    logger.warn("Missing access_token or refresh_token for set password", {
      feature: "SetPasswordPage",
    });
    return (
      <Layout>
        <p>{translate("ra-supabase.auth.missing_tokens")}</p>
      </Layout>
    );
  }

  const submit = async (values: FormData) => {
    // Validation at API boundary: Check password match before calling API
    if (values.password !== values.confirmPassword) {
      notify("ra-supabase.validation.password_mismatch", {
        type: "warning",
        messageArgs: {
          _: "Passwords do not match",
        },
      });
      return;
    }

    try {
      setLoading(true);
      await setPassword({
        access_token,
        refresh_token,
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
          {translate("ra-supabase.set_password.new_password", {
            _: "Choose your password",
          })}
        </h1>
      </div>
      <Form<FormData> className="space-y-8" onSubmit={submit as SubmitHandler<FieldValues>}>
        <TextInput
          label={`${translate("ra.auth.password", { _: "Password" })} *`}
          autoComplete="new-password"
          source="password"
          type="password"
          helperText="Required"
        />
        <TextInput
          label={`${translate("ra.auth.confirm_password", { _: "Confirm password" })} *`}
          source="confirmPassword"
          type="password"
          helperText="Required - must match password above"
        />
        <Button type="submit" className="cursor-pointer" disabled={loading}>
          {translate("ra.action.save")}
        </Button>
      </Form>
    </Layout>
  );
};

SetPasswordPage.path = "set-password";
