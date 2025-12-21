import { useState } from "react";
import { EditBase, Form, useRecordContext, useNotify } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import { OrganizationInputs } from "./OrganizationInputs";
import { PrincipalChangeWarning } from "./PrincipalChangeWarning";

import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveGrid } from "@/components/design-system";
import { OrganizationAside } from "./OrganizationAside";
import { FormToolbar } from "../layout/FormToolbar";
import type { Organization } from "../types";

const OrganizationEdit = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [attemptedType, setAttemptedType] = useState<string>("");
  const queryClient = useQueryClient();

  return (
    <EditBase
      actions={false}
      redirect="show"
      mutationOptions={{
        onSuccess: () => {
          // Invalidate related caches to prevent stale data
          queryClient.invalidateQueries({ queryKey: ["organizations"] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        },
        onMutate: async (variables) => {
          // Check if trying to change FROM principal
          const { data, previousData } = variables as {
            data: Partial<Organization>;
            previousData: Organization;
          };

          if (
            previousData?.organization_type === "principal" &&
            data?.organization_type &&
            data.organization_type !== "principal"
          ) {
            // Attempt to change from principal - need to validate
            setAttemptedType(data.organization_type);
            setShowWarning(true);
            // Cancel the mutation by throwing
            throw new Error("PRINCIPAL_VALIDATION_REQUIRED");
          }
        },
      }}
      transform={(values) => {
        // add https:// before website if not present
        if (values.website && !values.website.startsWith("http")) {
          values.website = `https://${values.website}`;
        }
        return values;
      }}
    >
      <OrganizationEditContent
        showWarning={showWarning}
        setShowWarning={setShowWarning}
        attemptedType={attemptedType}
      />
    </EditBase>
  );
};

const OrganizationEditContent = ({
  showWarning,
  setShowWarning,
  attemptedType,
}: {
  showWarning: boolean;
  setShowWarning: (show: boolean) => void;
  attemptedType: string;
}) => {
  const record = useRecordContext<Organization>();
  const notify = useNotify();

  const handleWarningClose = () => {
    setShowWarning(false);
    // Reset form field back to principal
    if (record) {
      // The form will automatically revert since the mutation was cancelled
      notify("Organization type change cancelled. Please reassign products first.", {
        type: "warning",
      });
    }
  };

  return (
    <>
      <ResponsiveGrid variant="dashboard" className="mt-2">
        <main role="main" aria-label="Edit organization">
          <Form className="flex flex-col gap-4">
            <Card>
              <CardContent>
                <OrganizationInputs />
                <FormToolbar />
              </CardContent>
            </Card>
          </Form>
        </main>

        <aside aria-label="Organization information">
          <OrganizationAside link="show" />
        </aside>
      </ResponsiveGrid>

      <PrincipalChangeWarning
        open={showWarning}
        onClose={handleWarningClose}
        onConfirm={() => {
          // Not allowing confirmation - must reassign products first
          handleWarningClose();
        }}
        newType={attemptedType}
      />
    </>
  );
};

export { OrganizationEdit };
export default OrganizationEdit;
