import { useMutation } from "@tanstack/react-query";
import { Form, useDataProvider, useGetIdentity, useGetOne, useNotify } from "ra-core";
import { User, Bell, Shield, History, Users } from "lucide-react";
import { logger } from "@/lib/logger";
import type { CrmDataProvider } from "../providers/types";
import type { SalesFormData } from "../types";
import { SettingsLayout } from "./SettingsLayout";
import { useSalesUpdate } from "./useSalesUpdate";
import { PersonalSection } from "./PersonalSection";
import { NotificationsSection } from "./NotificationsSection";
import { SecuritySection } from "./SecuritySection";
import { AuditLogSection } from "./AuditLogSection";
import { UsersSection } from "./UsersSection";

export const SettingsPage = () => {
  const {
    data: identity,
    isPending: isIdentityPending,
    refetch: refetchIdentity,
  } = useGetIdentity();
  const { data, refetch: refetchUser } = useGetOne("sales", {
    id: identity?.id,
  });
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();

  const { mutate } = useSalesUpdate({
    userId: identity?.id,
    onSuccess: () => {
      refetchIdentity();
      refetchUser();
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
    onError: (error) => {
      logger.error("Password update failed", error, { feature: "SettingsPage" });
      notify("An error occurred. Please try again.", {
        type: "error",
      });
    },
  });

  if (isIdentityPending) {
    return (
      <div role="status" aria-live="polite" className="p-4">
        <span className="sr-only">Loading settings...</span>
        Loading...
      </div>
    );
  }
  if (!identity) return null;

  const handleOnSubmit = async (values: SalesFormData) => {
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
    ...(identity?.role === "admin"
      ? [
          {
            id: "users",
            label: "Team",
            icon: <Users className="h-4 w-4" />,
            component: <UsersSection />,
          },
          {
            id: "audit",
            label: "Activity Log",
            icon: <History className="h-4 w-4" />,
            component: <AuditLogSection />,
          },
        ]
      : []),
  ];

  return <SettingsLayout sections={sections} />;
};

SettingsPage.path = "/settings";
