import { CreateButton } from "@/components/admin/create-button";
import { Progress } from "@/components/ui/progress";
import { useGetList } from "ra-core";
import { matchPath, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import useAppBarHeight from "../misc/useAppBarHeight";
import type { Contact } from "../types";
import { OpportunityCreate } from "./OpportunityCreate";

export const OpportunityEmpty = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const matchCreate = matchPath("/opportunities/create", location.pathname);
  const appbarHeight = useAppBarHeight();

  // get Contact data
  const { data: contacts, isPending: contactsLoading } = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 1 },
  });

  if (contactsLoading) return <Progress value={50} />;

  return (
    <div
      className="flex flex-col justify-center items-center gap-12"
      style={{
        height: `calc(100dvh - ${appbarHeight}px)`,
      }}
    >
      <img src="./img/empty.svg" alt="No opportunities found" />
      {contacts && contacts.length > 0 ? (
        <>
          <div className="flex flex-col items-center gap-0">
            <h3 className="text-lg font-bold">No opportunities found</h3>
            <p className="text-sm text-center text-muted-foreground mb-4">
              It seems your opportunity list is empty.
            </p>
          </div>
          <div className="flex space-x-8">
            <CreateButton label="Create opportunity" />
          </div>
          <OpportunityCreate open={!!matchCreate} />
          {children}
        </>
      ) : (
        <div className="flex flex-col items-center gap-0">
          <h3 className="text-lg font-bold">No opportunities found</h3>
          <p className="text-sm text-center text-muted-foreground mb-4">
            It seems your contact list is empty.
            <br />
            <Link to="/contacts/create" className="hover:underline">
              Add your first contact
            </Link>{" "}
            before creating an opportunity.
          </p>
        </div>
      )}
    </div>
  );
};
