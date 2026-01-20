import { CreateButton } from "@/components/ra-wrappers/create-button";
import { Building2, Users, TrendingUp } from "lucide-react";
import useAppBarHeight from "../hooks/useAppBarHeight";

export const OrganizationEmpty = () => {
  const appbarHeight = useAppBarHeight();

  return (
    <div
      className="flex flex-col justify-center items-center gap-section"
      style={{
        height: `calc(100dvh - ${appbarHeight}px)`,
      }}
    >
      {/* Empty state illustration */}
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted">
        <Building2 className="h-12 w-12 text-muted-foreground" />
      </div>

      {/* Welcome message */}
      <div className="flex flex-col gap-compact items-center max-w-md">
        <h2 className="text-lg font-bold text-foreground">No organizations yet</h2>
        <p className="text-sm text-muted-foreground text-center">
          Start building your network by adding organizations like customers, prospects, principals,
          and distributors.
        </p>
      </div>

      {/* Helpful tips */}
      <div className="flex flex-col lg:flex-row gap-content max-w-3xl w-full px-content lg:px-0">
        <div className="flex flex-col gap-compact items-center lg:items-start text-center lg:text-left flex-1 p-content bg-card rounded-lg border border-border">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Track relationships</h3>
          <p className="text-xs text-muted-foreground">
            Manage contacts, opportunities, and activities for each organization.
          </p>
        </div>

        <div className="flex flex-col gap-compact items-center lg:items-start text-center lg:text-left flex-1 p-content bg-card rounded-lg border border-border">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Organize hierarchies</h3>
          <p className="text-xs text-muted-foreground">
            Set up parent-child relationships and track branch locations.
          </p>
        </div>

        <div className="flex flex-col gap-compact items-center lg:items-start text-center lg:text-left flex-1 p-content bg-card rounded-lg border border-border">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Prioritize accounts</h3>
          <p className="text-xs text-muted-foreground">
            Assign priority levels and segments to focus on high-value accounts.
          </p>
        </div>
      </div>

      {/* Create CTA */}
      <div className="flex flex-col items-center gap-compact">
        <CreateButton label="Create Organization" />
        <p className="text-xs text-muted-foreground">
          Get started by adding your first organization
        </p>
      </div>
    </div>
  );
};
