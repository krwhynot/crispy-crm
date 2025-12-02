import { useMutation } from "@tanstack/react-query";
import { Form, useDataProvider, useGetIdentity, useGetOne, useNotify } from "ra-core";
import { useState } from "react";
import { User, Bell, Shield } from "lucide-react";
import type { CrmDataProvider } from "../providers/types";
import type { SalesFormData } from "../types";
import { SettingsLayout } from "./SettingsLayout";
import { PersonalSection } from "./sections/PersonalSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { SecuritySection } from "./sections/SecuritySection";

export const SettingsPage = () => {
  const { data: identity, isPending: isIdentityPending, refetch: refetchIdentity } = useGetIdentity();
  const { data, refetch: refetchUser } = useGetOne("sales", {
    id: identity?.id,
  });
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();

  const { mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      if (!identity) {
        throw new Error("Record not found");
      }
      return dataProvider.salesUpdate(identity.id, data);
    },
    onSuccess: () => {
      refetchIdentity();
      refetchUser();
      notify("Your profile has been updated");
    },
    onError: (_) => {
      notify("An error occurred. Please try again", {
        type: "error",
      });
    },
  });

  const { mutate: updatePassword } = useMutation({
    mutationKey: ["updatePassword"],
    mutationFn: async () => {
      if (!identity) {
        throw new Error("Record not found");
      }
      return dataProvider.updatePassword(identity.id);
    },
    onSuccess: () => {
      notify("A reset password email has been sent to your email address");
    },
    onError: (e) => {
      notify(`${e}`, {
        type: "error",
      });
    },
  });

  if (isIdentityPending) return <div>Loading...</div>;
  if (!identity) return null;

  const handleOnSubmit = async (values: any) => {
    mutate(values);
  };

  const handleClickOpenPasswordChange = () => {
    updatePassword();
  };

  const sections = [
    {
      id: "personal",
      label: "Personal",
      icon: <User className="h-4 w-4" />,
      component: (
        <Form onSubmit={handleOnSubmit} record={data}>
          <PersonalSection />
        </Form>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      component: <NotificationsSection />,
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="h-4 w-4" />,
      component: <SecuritySection onPasswordChange={handleClickOpenPasswordChange} />,
    },
  ];

  return <SettingsLayout sections={sections} />;
};

SettingsPage.path = "/settings";
