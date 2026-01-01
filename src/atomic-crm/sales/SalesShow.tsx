import { Card, CardContent } from "@/components/ui/card";
import { ShowBase, useShowContext } from "ra-core";
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from "@/components/ui/avatar";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";

export const SalesShow = () => (
  <ShowBase>
    <SalesShowContent />
  </ShowBase>
);

const SalesShowContent = () => {
  const { record, isPending } = useShowContext<Sale>();
  if (isPending || !record) return null;

  return (
    <div className="mt-2 mb-2">
      <main role="main" aria-label="Sales user details">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <SalesAvatar />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">
                  {formatName(record.first_name, record.last_name)}
                </h2>
                <div className="text-sm text-muted-foreground mt-1">
                  {record.email && <div>{record.email}</div>}
                  {record.role && <div className="mt-1 capitalize">Role: {record.role}</div>}
                  {record.disabled !== undefined && (
                    <div className="mt-1">Status: {record.disabled ? "Inactive" : "Active"}</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const SalesAvatar = () => {
  const record = useShowContext<Sale>()?.record;

  if (!record?.avatar && !record?.first_name && !record?.last_name) {
    return null;
  }

  const fullName = formatName(record.first_name, record.last_name);
  const altText = fullName !== "--" ? `${fullName} avatar` : "Sales user avatar";

  return (
    <ShadcnAvatar className="w-11 h-11">
      <AvatarImage src={record.avatar?.src ?? undefined} alt={altText} />
      <AvatarFallback className="text-sm">
        {record.first_name?.charAt(0).toUpperCase()}
        {record.last_name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};

export default SalesShow;
