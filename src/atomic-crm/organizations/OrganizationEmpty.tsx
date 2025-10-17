import { CreateButton } from "@/components/admin/create-button";
import useAppBarHeight from "../misc/useAppBarHeight";

export const OrganizationEmpty = () => {
  const appbarHeight = useAppBarHeight();
  return (
    <div
      className="flex flex-col justify-center items-center gap-6"
      style={{
        height: `calc(100dvh - ${appbarHeight}px)`,
      }}
    >
      <img src="./img/empty.svg" alt="No organizations found" />
      <div className="flex flex-col gap-0 items-center">
        <h6 className="text-lg font-bold">No organizations found</h6>
        <p className="text-sm text-center text-[color:var(--text-subtle)] mb-4">
          It seems your organization list is empty.
        </p>
      </div>
      <div className="flex space-x-2">
        <CreateButton label="Create Organization" />
      </div>
    </div>
  );
};
