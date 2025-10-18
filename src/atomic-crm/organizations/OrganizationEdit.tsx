import { useState } from "react";
import { EditBase, Form, useRecordContext, useNotify } from "ra-core";
import { useFormContext } from "react-hook-form";

import { OrganizationInputs } from "./OrganizationInputs";
import { PrincipalChangeWarning } from "./PrincipalChangeWarning";

import { Card, CardContent } from "@/components/ui/card";
import { OrganizationAside } from "./OrganizationAside";
import { FormToolbar } from "../layout/FormToolbar";
import type { Organization } from "../types";

const OrganizationEdit = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [attemptedType, setAttemptedType] = useState<string>("");

  return (
    <EditBase
      actions={false}
      redirect="show"
      mutationOptions={{
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
      notify(
        "Organization type change cancelled. Please reassign products first.",
        { type: "warning" }
      );
    }
  };

  return (
    <>
      <div className="mt-2 flex gap-8">
        <Form className="flex flex-1 flex-col gap-4 pb-2">
          <Card>
            <CardContent>
              <OrganizationInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>

        <OrganizationAside link="show" />
      </div>

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
